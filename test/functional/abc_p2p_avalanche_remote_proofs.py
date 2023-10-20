#!/usr/bin/env python3
# Copyright (c) 2023 The Bitcoin developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.
"""Test the avalanche remote proofs feature."""
import random
import time

from test_framework.avatools import (
    AvaP2PInterface,
    build_msg_avaproofs,
    gen_proof,
    get_ava_p2p_interface,
)
from test_framework.messages import (
    NODE_AVALANCHE,
    NODE_NETWORK,
    AvalanchePrefilledProof,
    calculate_shortid,
)
from test_framework.p2p import p2p_lock
from test_framework.test_framework import BitcoinTestFramework
from test_framework.util import assert_equal, uint256_hex

AVALANCHE_MAX_PERIODIC_NETWORKING_INTERVAL = 5 * 60


class AvalancheRemoteProofsTest(BitcoinTestFramework):
    def set_test_params(self):
        self.num_nodes = 1
        self.extra_args = [
            [
                "-avaproofstakeutxodustthreshold=10000",
                "-avaproofstakeutxoconfirmations=1",
            ]
        ]

    def run_test(self):
        node = self.nodes[0]

        inbound = get_ava_p2p_interface(self, node)

        now = int(time.time())
        node.setmocktime(now)

        outbound = node.add_outbound_p2p_connection(
            AvaP2PInterface(self, node),
            p2p_idx=1,
            connection_type="avalanche",
            services=NODE_NETWORK | NODE_AVALANCHE,
        )

        assert_equal(len(node.getpeerinfo()), 2)
        outbound.nodeid = node.getpeerinfo()[-1]["id"]

        self.log.info("Check we save the remote proofs for our avalanche outbounds")

        def remoteFromProof(proof, present=True, last_update=now):
            return {
                "proofid": uint256_hex(proof.proofid),
                "present": present,
                "last_update": now,
            }

        def assert_remote_proofs(nodeid, remote_proofs):
            lhs = sorted(node.getremoteproofs(nodeid), key=lambda p: p["proofid"])
            rhs = sorted(remote_proofs, key=lambda p: p["proofid"])
            assert_equal(lhs, rhs)

        assert_remote_proofs(inbound.nodeid, [])
        assert_remote_proofs(outbound.nodeid, [remoteFromProof(outbound.proof)])

        proofs = []
        for _ in range(10):
            _, proof = gen_proof(self, node)
            proofs.append(proof)

            inbound.send_avaproof(proof)
            outbound.send_avaproof(proof)

        inbound.sync_with_ping()
        outbound.sync_with_ping()

        assert_remote_proofs(inbound.nodeid, [])
        assert_remote_proofs(
            outbound.nodeid,
            [remoteFromProof(proof) for proof in [outbound.proof] + proofs],
        )

        self.log.info("Upon disconnect the remote proofs empty")

        outbound.peer_disconnect()
        outbound.wait_for_disconnect()
        assert_remote_proofs(outbound.nodeid, [])

        self.log.info("Check the compact proofs update the remote proofs status")

        # Clear all proofs from the node
        self.restart_node(0)

        now = int(time.time())
        node.setmocktime(now)

        outbound = node.add_outbound_p2p_connection(
            AvaP2PInterface(self, node),
            p2p_idx=2,
            connection_type="avalanche",
            services=NODE_NETWORK | NODE_AVALANCHE,
        )
        outbound.nodeid = node.getpeerinfo()[-1]["id"]
        assert_remote_proofs(outbound.nodeid, [remoteFromProof(outbound.proof)])

        now += 1
        node.setmocktime(now)

        def trigger_avaproofs(msg):
            node.mockscheduler(AVALANCHE_MAX_PERIODIC_NETWORKING_INTERVAL)

            outbound.wait_until(lambda: outbound.last_message.get("getavaproofs"))
            with p2p_lock:
                outbound.last_message = {}
            outbound.send_and_ping(msg)

        def build_compactproofs_msg(prefilled_proof, proofs_to_announce):
            key0 = random.randint(0, 2**64 - 1)
            key1 = random.randint(0, 2**64 - 1)

            shortid_map = {}
            for proofid in [proof.proofid for proof in proofs_to_announce]:
                shortid_map[proofid] = calculate_shortid(key0, key1, proofid)
            index_prefilled_proof = list(shortid_map.keys()).index(
                prefilled_proof.proofid
            )

            return build_msg_avaproofs(
                proofs_to_announce,
                prefilled_proofs=[
                    AvalanchePrefilledProof(index_prefilled_proof, prefilled_proof)
                ],
                key_pair=[key0, key1],
            )

        # Build a compact proofs message, including a prefilled proof that node
        # doesn't know yet.
        _, prefilled_proof = gen_proof(self, node)
        compactproofs_msg = build_compactproofs_msg(
            prefilled_proof, [outbound.proof] + [prefilled_proof] + proofs
        )
        trigger_avaproofs(compactproofs_msg)

        # We expect the prefilled proof to be added as present, the outbound
        # proof to remain present, and the proofs to not be added (because the
        # node doesn't know about them and needs to request them)
        assert_remote_proofs(
            outbound.nodeid,
            [remoteFromProof(proof) for proof in [outbound.proof] + [prefilled_proof]],
        )

        # Add the proofs to the node
        for proof in proofs:
            node.sendavalancheproof(proof.serialize().hex())
            assert uint256_hex(proof.proofid) in node.getavalancheproofs()["valid"]

        node.mockscheduler(AVALANCHE_MAX_PERIODIC_NETWORKING_INTERVAL)

        outbound.wait_until(lambda: outbound.last_message.get("getavaproofs"))
        with p2p_lock:
            outbound.last_message = {}
        outbound.send_and_ping(compactproofs_msg)

        # Now the proofs should be all present
        assert_remote_proofs(
            outbound.nodeid,
            [
                remoteFromProof(proof)
                for proof in [outbound.proof] + [prefilled_proof] + proofs
            ],
        )

        # Stop sending some proofs and check they are marked as absent
        now += 1
        node.setmocktime(now)

        compactproofs_msg = build_compactproofs_msg(
            prefilled_proof, [outbound.proof] + [prefilled_proof]
        )
        trigger_avaproofs(compactproofs_msg)

        # Now only the peer proof and the prefilled one are present
        assert_remote_proofs(
            outbound.nodeid,
            [
                remoteFromProof(proof, present=(proof not in proofs))
                for proof in [outbound.proof] + [prefilled_proof] + proofs
            ],
        )

        # Add back half the proofs
        proofs_present = proofs[:5]
        proofs_absent = proofs[5:]

        now += 1
        node.setmocktime(now)

        compactproofs_msg = build_compactproofs_msg(
            prefilled_proof, [outbound.proof] + [prefilled_proof] + proofs_present
        )
        trigger_avaproofs(compactproofs_msg)

        assert_remote_proofs(
            outbound.nodeid,
            [
                remoteFromProof(proof, present=(proof not in proofs_absent))
                for proof in [outbound.proof] + [prefilled_proof] + proofs
            ],
        )


if __name__ == "__main__":
    AvalancheRemoteProofsTest().main()
