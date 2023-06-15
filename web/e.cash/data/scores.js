// Copyright (c) 2023 The Bitcoin developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

/**
 * Exchange and services scoring criteria for sorting on the get ecash page
 * All criteria must have an attribute, which is the key for the value to score against
 * And a score value, the value to award for having the correct value
 *
 * There are two main scoring types "value" and "min/max"
 * A value can be type: string, (positive)boolean, or number the getScores function will
 * just check if the attribute from the item matches the value here
 *
 * Min max must be numbers
 *
 * The two special cases are trading_pairs, just requires a min number
 * And issues, which does not require a value to check against
 */
export const exchangeScoringCriteria = [
    {
        attribute: 'withdrawals_working',
        value: true,
        score: 20,
    },
    {
        attribute: 'deposits_working',
        value: true,
        score: 20,
    },
    {
        attribute: 'ecash_deposit_address_format',
        value: true,
        score: 20,
    },
    {
        attribute: 'deposit_confirmations',
        min: 0,
        max: 1,
        score: 15,
    },
    {
        attribute: 'withdrawal_fee',
        min: 0,
        max: 100,
        score: 10,
    },
    {
        attribute: 'withdrawal_fee',
        min: 100,
        max: 1000,
        score: 5,
    },
    {
        attribute: 'trading_pairs',
        min: 2,
        score: 10,
    },
    {
        attribute: 'decimal_places',
        min: 2,
        max: 2,
        score: 5,
    },
];

export const instantExchangeScoringCriteria = [
    {
        attribute: 'trading_open',
        value: true,
        score: 40,
    },
    {
        attribute: 'ecash_deposit_address_format',
        value: true,
        score: 30,
    },
    {
        attribute: 'deposit_confirmations',
        min: 0,
        max: 1,
        score: 20,
    },
    {
        attribute: 'decimal_place',
        min: 2,
        max: 2,
        score: 10,
    },
];

export const servicesScoringCriteria = [
    {
        attribute: 'ecash_address_format',
        value: true,
        score: 40,
    },
    {
        attribute: 'decimal_place',
        min: 2,
        max: 2,
        score: 30,
    },
    {
        attribute: 'issues',
        score: 30,
    },
];

/**
 * Return a sorted array based on scoring criteria
 * @param {array} data - The array of exchange data returned from the scorecard API.
 * @param {array} scoringCriteria - An array containing the scoring criteria
 * @returns {array} The same array, sorted alphabetically, then by deposit
 * confirmations, then by score specified by the scoring criteria
 */
export const getScores = (data, scoringCriteria) => {
    for (let i = 0; i < data.length; ++i) {
        const item = data[i];
        let score = 0;

        scoringCriteria.forEach(criteria => {
            if (criteria.value && item[criteria.attribute] === criteria.value) {
                score += criteria.score;
            } else if (
                criteria.min >= 0 &&
                criteria.max &&
                item[criteria.attribute] >= criteria.min &&
                item[criteria.attribute] <= criteria.max
            ) {
                score += criteria.score;
            } else if (
                criteria.attribute === 'trading_pairs' &&
                item[criteria.attribute].length >= criteria.min
            ) {
                score += criteria.score;
            } else if (
                criteria.attribute === 'issues' &&
                (item[criteria.attribute] === null ||
                    item[criteria.attribute] === '')
            ) {
                score += criteria.score;
            }
        });
        item.score = (score / 100) * 100;
    }
    return data;
};

/**
 * Return a sorted array based on name, score, and deposit confimations
 * @param {array} data - The array of data
 * @returns {array} The same array, sorted alphabetically, then by deposit
 * confirmations, then by score
 */
export const sortExchanges = data => {
    data.sort((a, b) => a.name.localeCompare(b.name));
    data.sort((a, b) => a.deposit_confirmations - b.deposit_confirmations);
    data.sort((a, b) => b.score - a.score);
    return data;
};

/**
 * Return an array with length divisible by 3 by adding empty strings if needed
 * @param {array} any javascript array, e.g. ['one']
 * @returns {array} the same array, with empty string entries added to the end
 * such that the length is divisible by 3
 * e.g. ['one', '', '']
 */
export function makeDivisibleByThree(array) {
    const length = array.length;
    const remainder = length % 3;
    const emptyObjectsToAdd = remainder === 0 ? 0 : 3 - remainder;

    for (let i = 0; i < emptyObjectsToAdd; i++) {
        array.push('');
    }
    return array;
}

/**
 * Fetch scorecard api data and return scored and sorted arrays.
 * @returns {object} object with keys for each enpoint response
 */
export async function getScoreCardData() {
    let responses, propsObj;
    try {
        responses = await Promise.all([
            fetch('https://api.scorecard.cash/exchanges').then(res =>
                res.json(),
            ),
            fetch('https://api.scorecard.cash/instant-exchanges').then(res =>
                res.json(),
            ),
            fetch('https://api.scorecard.cash/apps-services').then(res =>
                res.json(),
            ),
        ]);
        propsObj = {
            props: {
                exchanges: makeDivisibleByThree(
                    sortExchanges(
                        getScores(responses[0], exchangeScoringCriteria),
                    ),
                ),
                instantExchanges: makeDivisibleByThree(
                    sortExchanges(
                        getScores(responses[1], instantExchangeScoringCriteria),
                    ),
                ),
                services: makeDivisibleByThree(
                    sortExchanges(
                        getScores(responses[2], servicesScoringCriteria),
                    ),
                ),
            },
        };
    } catch (err) {
        throw new Error(err);
    }

    return propsObj;
}
