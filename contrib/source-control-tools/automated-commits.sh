#!/usr/bin/env bash

# Note: Any bot running this script must have the appropriate permissions to
# push commits upstream. When running locally, this script will git push in a
# dry run by default.

export LC_ALL=C.UTF-8

set -euxo pipefail

DEFAULT_PARENT_COMMIT="origin/master"

help_message() {
  cat <<EOF
$0 [options] [script] [script_args...]
Generate a commit from available recipes.

The given script may produce a commit. If a commit is generated this way, it will be landed.

Options:
  -p, --parent              The parent commit to build ontop of. Default: '${DEFAULT_PARENT_COMMIT}'
                              Note: This should only be used for testing since the behavior of setting
                              this to a particular commit varies slightly from the default.
  -h, --help                Display this help message.

Environment Variables:
  COMMIT_TYPE               (required) The commit recipe to run.
  DRY_RUN                   If set to 'no', this script will push the generated changes upstream. Default: 'yes'
EOF
}

SCRIPT=""
SCRIPT_ARGS=()
PARENT_COMMIT="${DEFAULT_PARENT_COMMIT}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
case $1 in
  -p|--parent)
    PARENT_COMMIT=$(git rev-parse "$2")
    shift # shift past argument
    shift # shift past value
    ;;
  -h|--help)
    help_message
    exit 0
    ;;
  *)
    SCRIPT="$1"
    shift
    SCRIPT_ARGS=("$@")
    break
    ;;
esac
done

: "${COMMIT_TYPE:=}"
if [ -z "${COMMIT_TYPE}" ]; then
  echo "Error: Environment variable COMMIT_TYPE must be set"
  exit 2
fi

LAND_PATCH_ARGS=()
case ${DRY_RUN:=yes} in
  no|NO|false|FALSE)
    if [ "${PARENT_COMMIT}" != "${DEFAULT_PARENT_COMMIT}" ]; then
      echo "Error: Running with DRY_RUN=no on a commit parent other than '${DEFAULT_PARENT_COMMIT}'"
      exit 3
    fi
    ;;
  *)
    LAND_PATCH_ARGS+=("--dry-run")
    ;;
esac

echo "Building automated commit '${COMMIT_TYPE}'..."

BOT_PREFIX="[Automated]"
TOPLEVEL=$(git rev-parse --show-toplevel)

BUILD_DIR="${TOPLEVEL}/abc-ci-builds/automated-commit-${COMMIT_TYPE}"
mkdir -p "${BUILD_DIR}"
export BUILD_DIR

DEVTOOLS_DIR="${TOPLEVEL}"/contrib/devtools

# Make sure tree is clean
git checkout master
git reset --hard "${PARENT_COMMIT}"

case "${COMMIT_TYPE}" in
  archive-release-notes)
    # shellcheck source=../utils/compare-version.sh
    source "${TOPLEVEL}"/contrib/utils/compare-version.sh
    RELEASE_NOTES_FILE="${TOPLEVEL}/doc/release-notes.md"
    RELEASE_NOTES_VERSION=$(sed -n "1s/^Bitcoin ABC version \([0-9]\+\.[0-9]\+\.[0-9]\+\).\+$/\1/p" "${RELEASE_NOTES_FILE}")
    RELEASE_NOTES_ARCHIVE="${TOPLEVEL}/doc/release-notes/release-notes-${RELEASE_NOTES_VERSION}.md"

    CURRENT_VERSION=""
    get_current_version CURRENT_VERSION

    # Compare the versions. We only want to archive the release notes if the
    # current version is greater the our release notes version.
    if version_less_equal "${CURRENT_VERSION}" "${RELEASE_NOTES_VERSION}"
    then
      echo "Current version ${CURRENT_VERSION} <= release-notes version ${RELEASE_NOTES_VERSION}, skip the update"
      exit 0
    fi

    # Archive the release notes
    cp "${RELEASE_NOTES_FILE}" "${RELEASE_NOTES_ARCHIVE}"

    # Generate a fresh blank release notes file for the new version
    PROJECT_VERSION="${CURRENT_VERSION}" envsubst < "${TOPLEVEL}/doc/release-notes/release-notes.md.in" > "${RELEASE_NOTES_FILE}"

    git add "${RELEASE_NOTES_FILE}" "${RELEASE_NOTES_ARCHIVE}"
    git commit -m "${BOT_PREFIX} Archive release notes for version ${RELEASE_NOTES_VERSION}"
    ;;

  update-chainparams)
    CHAINPARAMS_SCRIPTS_DIR="${DEVTOOLS_DIR}"/chainparams

    # Assumes bitcoind instances are already running on mainnet and testnet
    pushd "${CHAINPARAMS_SCRIPTS_DIR}"
    CHAINPARAMS_MAINNET_TXT="chainparams_main.txt"
    ./make_chainparams.py > "${CHAINPARAMS_MAINNET_TXT}"
    git add "${CHAINPARAMS_MAINNET_TXT}"

    CHAINPARAMS_TESTNET_TXT="chainparams_test.txt"
    ./make_chainparams.py -a 127.0.0.1:18332 > "${CHAINPARAMS_TESTNET_TXT}"
    git add "${CHAINPARAMS_TESTNET_TXT}"

    CHAINPARAMS_CONSTANTS="${TOPLEVEL}"/src/chainparamsconstants.h
    ./generate_chainparams_constants.py . > "${CHAINPARAMS_CONSTANTS}"
    git add "${CHAINPARAMS_CONSTANTS}"
    popd

    git commit -m "${BOT_PREFIX} Update chainparams"
    ;;

  update-seeds)
    # Assumes seeder instances are already running on mainnet and testnet
    pushd "${TOPLEVEL}"/contrib/seeds
    : "${SEEDS_MAIN:=seeds_main.txt}"
    ./makeseeds.py < "${SEEDS_MAIN}" > nodes_main.txt
    git add nodes_main.txt

    : "${SEEDS_TEST:=seeds_test.txt}"
    ./makeseeds.py < "${SEEDS_TEST}" > nodes_test.txt
    git add nodes_test.txt

    SEEDS_HEADER="${TOPLEVEL}"/src/chainparamsseeds.h
    ./generate-seeds.py . > "${SEEDS_HEADER}"
    git add "${SEEDS_HEADER}"
    popd

    # Check that seeds have good connectivity
    "${DEVTOOLS_DIR}"/build_cmake.sh
    SEEDS_DIR="${TOPLEVEL}"/contrib/seeds
    RPC_PORT=18832 "${SEEDS_DIR}"/check-seeds.sh main 80
    RPC_PORT=18833 "${SEEDS_DIR}"/check-seeds.sh test 70

    git commit -m "${BOT_PREFIX} Update seeds"
    ;;

  update-timings)
    "${DEVTOOLS_DIR}"/build_cmake.sh
    pushd "${BUILD_DIR}"
    ninja check-functional-extended
    TIMING_SRC_FILE="${TOPLEVEL}"/test/functional/timing.json
    mv timing.json "${TIMING_SRC_FILE}"
    popd

    # Check that all tests are included in timing.json
    pushd "${TOPLEVEL}"/test/functional
    NON_TESTS=$(python3 -c 'from test_runner import NON_SCRIPTS; print(" ".join(NON_SCRIPTS))')
    export NON_TESTS
    check_missing() {
      # Exclude non-tests from the check
      if [[ "${NON_TESTS}" =~ $1 ]]; then
        exit 0
      fi

      if ! grep -q $1 timing.json ; then
        echo "Error: Test file '$1' is missing from timing.json"
        exit 1
      fi
    }
    export -f check_missing
    find . -maxdepth 1 -name '*.py' | cut -c 3- | xargs -I'{}' -n1 bash -c 'check_missing {}'
    popd

    git add "${TIMING_SRC_FILE}"

    git commit -m "${BOT_PREFIX} Update timing.json"
    ;;

  *)
    if [ -z "${SCRIPT}" ]; then
      echo "Error: Invalid commit name '${COMMIT_TYPE}'"
      exit 10
    fi

    if [ ! -f "${SCRIPT}" ]; then
      echo "Error: '${SCRIPT}' does not exist"
      exit 10
    fi

    "${SCRIPT}" "${SCRIPT_ARGS[@]}"
    ;;
esac

# Bail early if there's nothing to land
if [ "$(git rev-parse HEAD)" == "$(git rev-parse ${PARENT_COMMIT})" ]; then
  echo "No new changes. Nothing to do."
  exit 0
fi

# Land the generated commit
"${TOPLEVEL}"/contrib/source-control-tools/land-patch.sh "${LAND_PATCH_ARGS[@]}"
