// Copyright (c) 2022 The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <mempool_args.h>

#include <kernel/mempool_options.h>

#include <util/system.h>

using kernel::MemPoolOptions;

void ApplyArgsManOptions(const ArgsManager &argsman,
                         MemPoolOptions &mempool_opts) {
    mempool_opts.check_ratio =
        argsman.GetIntArg("-checkmempool", mempool_opts.check_ratio);

    if (auto mb = argsman.GetIntArg("-maxmempool")) {
        mempool_opts.max_size_bytes = *mb * 1'000'000;
    }

    if (auto hours = argsman.GetIntArg("-mempoolexpiry")) {
        mempool_opts.expiry = std::chrono::hours{*hours};
    }
}
