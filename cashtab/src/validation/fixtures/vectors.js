// Copyright (c) 2024 The Bitcoin developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

// Test vectors for validation functions
import appConfig from 'config/app';
import { cashtabSettings } from 'config/cashtabSettings';
import defaultCashtabCache from 'config/cashtabCache';
import { mockCashtabCache } from 'helpers/fixtures/mocks';
import { validWallet } from 'validation/fixtures/mocks';

const cloneObjectWithDeletedKey = (object, key) => {
    const clonedObject = JSON.parse(JSON.stringify(object));
    delete clonedObject[key];
    return clonedObject;
};

export default {
    shouldDisableXecSend: {
        expectedReturns: [
            {
                description: 'Disabled on startup',
                formData: {
                    address: '',
                    value: '',
                },
                balances: { totalBalance: '10000' },
                apiError: false,
                sendBchAmountError: false,
                sendBchAddressError: false,
                isMsgError: false,
                priceApiError: false,
                isOneToManyXECSend: false,
                sendDisabled: true,
            },
            {
                description:
                    'Disabled if address has been entered but no value',
                formData: {
                    address: 'ecash:qp89xgjhcqdnzzemts0aj378nfe2mhu9yvxj9nhgg6',
                    value: '',
                },
                balances: { totalBalance: '10000' },
                apiError: false,
                sendBchAmountError: false,
                sendBchAddressError: false,
                isMsgError: false,
                priceApiError: false,
                isOneToManyXECSend: false,
                sendDisabled: true,
            },
            {
                description: 'Enabled for valid address and value',
                formData: {
                    address: 'ecash:qp89xgjhcqdnzzemts0aj378nfe2mhu9yvxj9nhgg6',
                    value: '50',
                },
                balances: { totalBalance: '10000' },
                apiError: false,
                sendBchAmountError: false,
                sendBchAddressError: false,
                isMsgError: false,
                priceApiError: false,
                isOneToManyXECSend: false,
                sendDisabled: false,
            },
            {
                description: 'Disabled on zero balance',
                formData: {
                    address: 'ecash:qp89xgjhcqdnzzemts0aj378nfe2mhu9yvxj9nhgg6',
                    value: '50',
                },
                balances: { totalBalance: '0' },
                apiError: false,
                sendBchAmountError: false,
                sendBchAddressError: false,
                isMsgError: false,
                priceApiError: false,
                isOneToManyXECSend: false,
                sendDisabled: true,
            },
            {
                description: 'Disabled for invalid address',
                formData: {
                    address: 'ecash:qp89xgjhcqdnzzemts0aj378nfe2mhu9yvxj9nhgg',
                    value: '50',
                },
                balances: { totalBalance: '10000' },
                apiError: false,
                sendBchAmountError: false,
                sendBchAddressError:
                    'a string indicating a validation error msg',
                isMsgError: false,
                priceApiError: false,
                isOneToManyXECSend: false,
                sendDisabled: true,
            },
            {
                description: 'Disabled for invalid value',
                formData: {
                    address: 'ecash:qp89xgjhcqdnzzemts0aj378nfe2mhu9yvxj9nhgg6',
                    value: '5',
                },
                balances: { totalBalance: '10000' },
                apiError: false,
                sendBchAmountError:
                    'a string indicating a validation error msg',
                sendBchAddressError: false,
                isMsgError: false,
                priceApiError: false,
                isOneToManyXECSend: false,
                sendDisabled: true,
            },
            {
                description: 'Disabled for invalid opreturn msg',
                formData: {
                    address: 'ecash:qp89xgjhcqdnzzemts0aj378nfe2mhu9yvxj9nhgg6',
                    value: '5',
                },
                balances: { totalBalance: '10000' },
                apiError: false,
                sendBchAmountError: false,
                sendBchAddressError: false,
                isMsgError: 'a string indicating a validation error msg',
                priceApiError: false,
                isOneToManyXECSend: false,
                sendDisabled: true,
            },
            {
                description: 'Disabled on priceApi error',
                formData: {
                    address: 'ecash:qp89xgjhcqdnzzemts0aj378nfe2mhu9yvxj9nhgg6',
                    value: '5',
                },
                balances: { totalBalance: '10000' },
                apiError: false,
                sendBchAmountError: false,
                sendBchAddressError: false,
                isMsgError: false,
                priceApiError: true,
                isOneToManyXECSend: false,
                sendDisabled: true,
            },
            {
                description:
                    'Enabled if isOneToManyXECSend and value is not entered',
                formData: {
                    address:
                        'ecash:qp89xgjhcqdnzzemts0aj378nfe2mhu9yvxj9nhgg6, 22\necash:qp89xgjhcqdnzzemts0aj378nfe2mhu9yvxj9nhgg6, 22',
                    value: '',
                },
                balances: { totalBalance: '10000' },
                apiError: false,
                sendBchAmountError: false,
                sendBchAddressError: false,
                isMsgError: false,
                priceApiError: false,
                isOneToManyXECSend: true,
                sendDisabled: false,
            },
        ],
    },
    meetsAliasSpecInputCases: {
        expectedReturns: [
            {
                description:
                    'returns true for a valid lowercase alphanumeric input',
                inputStr: 'jasdf3873',
                response: true,
            },
            {
                description:
                    'returns expected error if input contains uppercase char',
                inputStr: 'jasDf3873',
                response:
                    'Alias may only contain lowercase characters a-z and 0-9',
            },
            {
                description:
                    'returns expected error if input contains special char',
                inputStr: 'Glück',
                response:
                    'Alias may only contain lowercase characters a-z and 0-9',
            },
            {
                description: 'returns expected error if input contains emoji',
                inputStr: '😉',
                response:
                    'Alias may only contain lowercase characters a-z and 0-9',
            },
            {
                description:
                    'returns expected error if input contains other special characters',
                inputStr: '( ͡° ͜ʖ ͡°)',
                response:
                    'Alias may only contain lowercase characters a-z and 0-9',
            },
            {
                description:
                    'returns expected error if input is an empty string',
                inputStr: '​',
                response:
                    'Alias may only contain lowercase characters a-z and 0-9',
            },
            {
                description:
                    'returns expected error if input contains an empty space',
                inputStr: '​jasdf3873',
                response:
                    'Alias may only contain lowercase characters a-z and 0-9',
            },
            {
                description: 'returns expected error if input contains symbols',
                inputStr: '​jasdf3873@#',
                response:
                    'Alias may only contain lowercase characters a-z and 0-9',
            },
            {
                description: 'returns expected error if input is not a string',
                inputStr: { testAlias: 'string at key' },
                response: 'Alias input must be a string',
            },
            {
                description:
                    'returns expected error if input contains underscores',
                inputStr: 'test_WITH_badchars',
                response:
                    'Alias may only contain lowercase characters a-z and 0-9',
            },
            {
                description:
                    'returns expected error if exceeds byte restriction',
                inputStr: '0123456789012345678901',
                response: `Invalid bytecount 22. Alias be 1-21 bytes.`,
            },
            {
                description: 'returns true for an alias of max bytecount',
                inputStr: '012345678901234567890',
                response: true,
            },
        ],
    },
    validAliasSendInputCases: {
        expectedReturns: [
            {
                description: 'Valid alias send input',
                sendToAliasInput: 'chicken.xec',
                response: true,
            },
            {
                description: 'Valid alias missing prefix',
                sendToAliasInput: 'chicken',
                response: `Must include '.xec' suffix when sending to an eCash alias`,
            },
            {
                description: 'Valid alias with double suffix',
                sendToAliasInput: 'chicken.xec.xec',
                response: `Must include '.xec' suffix when sending to an eCash alias`,
            },
            {
                description: 'Valid alias with bad suffix',
                sendToAliasInput: 'chicken.xe',
                response: `Must include '.xec' suffix when sending to an eCash alias`,
            },
            {
                description: 'Invalid alias (too long)',
                sendToAliasInput: '0123456789012345678901.xec',
                response: `Invalid bytecount 22. Alias be 1-21 bytes.`,
            },
            {
                description: 'Invalid alias (nonalphanumeric)',
                sendToAliasInput: 'Capitalized@.xec',
                response:
                    'Alias may only contain lowercase characters a-z and 0-9',
            },
        ],
    },
    parseAddressInputCases: {
        expectedReturns: [
            // address only
            {
                description: 'Blank string',
                addressInput: '',
                parsedAddressInput: {
                    address: {
                        value: '',
                        error: 'Invalid address',
                        isAlias: false,
                    },
                },
            },
            {
                description: 'Address only and no querystring',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                },
            },
            {
                description: 'prefixless address input',
                addressInput: 'qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                parsedAddressInput: {
                    address: {
                        value: 'qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                },
            },
            // alias only
            {
                description: 'alias only and no querystring',
                addressInput: 'chicken.xec',
                parsedAddressInput: {
                    address: {
                        value: 'chicken.xec',
                        error: false,
                        isAlias: true,
                    },
                },
            },
            {
                description: 'alias missing .xec suffix',
                addressInput: 'chicken',
                parsedAddressInput: {
                    address: {
                        value: 'chicken',
                        error: `Aliases must end with '.xec'`,
                        isAlias: true,
                    },
                },
            },
            // amount param only
            {
                description:
                    'Valid address with valid amount param, no decimals',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx?amount=500000',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                    amount: { value: '500000', error: false },
                    queryString: { value: 'amount=500000', error: false },
                },
            },
            {
                description:
                    'Valid address with valid amount param, with decimals',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx?amount=123.45',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                    amount: { value: '123.45', error: false },
                    queryString: { value: 'amount=123.45', error: false },
                },
            },
            {
                description: 'Invalid address with valid amount param',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfg?amount=500000',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfg',
                        error: 'Invalid address',
                        isAlias: false,
                    },
                    amount: { value: '500000', error: false },
                    queryString: { value: 'amount=500000', error: false },
                },
            },
            {
                description: 'etoken address with valid amount param',
                addressInput:
                    'etoken:qq9h6d0a5q65fgywv4ry64x04ep906mdkufhx2swv3?amount=500000',
                parsedAddressInput: {
                    address: {
                        value: 'etoken:qq9h6d0a5q65fgywv4ry64x04ep906mdkufhx2swv3',
                        error: `eToken addresses are not supported for ${appConfig.ticker} sends`,
                        isAlias: false,
                    },
                    amount: { value: '500000', error: false },
                    queryString: { value: 'amount=500000', error: false },
                },
            },
            {
                description:
                    'Valid address with invalid amount param (too many decimal places)',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx?amount=123.456',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                    amount: {
                        value: '123.456',
                        error: `Invalid XEC send amount "123.456"`,
                    },
                    queryString: { value: 'amount=123.456', error: false },
                },
            },
            {
                description: 'Valid alias with valid amount param',
                addressInput: 'chicken.xec?amount=125',
                parsedAddressInput: {
                    address: {
                        value: 'chicken.xec',
                        error: false,
                        isAlias: true,
                    },
                    amount: { value: '125', error: false },
                    queryString: { value: 'amount=125', error: false },
                },
            },
            {
                description: 'Invalid alias with valid amount param',
                addressInput: 'chicken?amount=125',
                parsedAddressInput: {
                    address: {
                        value: 'chicken',
                        error: `Aliases must end with '.xec'`,
                        isAlias: true,
                    },
                    amount: { value: '125', error: false },
                    queryString: { value: 'amount=125', error: false },
                },
            },
            // opreturn param only
            {
                description: 'Valid address with valid op_return_raw param',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx?op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                    op_return_raw: {
                        value: '042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                        error: false,
                    },
                    queryString: {
                        value: 'op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                        error: false,
                    },
                },
            },
            {
                description: 'Valid alias with valid op_return_raw param',
                addressInput:
                    'chicken.xec?op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                parsedAddressInput: {
                    address: {
                        value: 'chicken.xec',
                        error: false,
                        isAlias: true,
                    },
                    op_return_raw: {
                        value: '042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                        error: false,
                    },
                    queryString: {
                        value: 'op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                        error: false,
                    },
                },
            },
            {
                description: 'Valid address with invalid op_return_raw param',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx?op_return_raw=notvalid042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                    op_return_raw: {
                        value: 'notvalid042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                        error: `Invalid op_return_raw param "notvalid042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d"`,
                    },
                    queryString: {
                        value: 'op_return_raw=notvalid042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                        error: false,
                    },
                },
            },
            // Both op_return_raw and amount params
            {
                description: 'Valid amount and op_return_raw params',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx?amount=500&op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                    amount: { value: '500', error: false },
                    op_return_raw: {
                        value: '042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                        error: false,
                    },
                    queryString: {
                        value: 'amount=500&op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                        error: false,
                    },
                },
            },

            {
                description: 'invalid querystring (unsupported params)',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx?*&@^&%@amount=-500000',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                    queryString: {
                        value: '*&@^&%@amount=-500000',
                        error: `Unsupported param "%@amount"`,
                    },
                },
            },
            // Querystring errors where no params can be returned
            {
                description: 'Invalid queryString, repeated param',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx?amount=123.45&amount=678.9',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                    queryString: {
                        value: 'amount=123.45&amount=678.9',
                        error: 'bip21 parameters may not appear more than once',
                    },
                },
            },
            {
                description: 'Repeated op_return_raw param',
                addressInput:
                    'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx?op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d&op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                parsedAddressInput: {
                    address: {
                        value: 'ecash:qq9h6d0a5q65fgywv4ry64x04ep906mdku8f0gxfgx',
                        error: false,
                        isAlias: false,
                    },
                    queryString: {
                        value: 'op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d&op_return_raw=042e786563000474657374150095e79f51d4260bc0dc3ba7fb77c7be92d0fbdd1d',
                        error: `bip21 parameters may not appear more than once`,
                    },
                },
            },
        ],
    },
    isValidContactList: {
        expectedReturns: [
            {
                description: 'Legacy empty contact list',
                contactList: [{}],
                isValid: false,
            },
            {
                description: 'Empty contact list',
                contactList: [],
                isValid: true,
            },
            {
                description: 'Array of more than one empty object is invalid',
                contactList: [{}, {}],
                isValid: false,
            },
            {
                description: 'List with one valid entry',
                contactList: [
                    {
                        address:
                            'ecash:qphlhe78677sz227k83hrh542qeehh8el5lcjwk72y',
                        name: 'Alpha',
                    },
                ],
                isValid: true,
            },
            {
                description: 'Multiple valid entries',
                contactList: [
                    {
                        address:
                            'ecash:qpdkc5p7f25hwkxsr69m3evlj4h7wqq9xcgmjc8sxr',
                        name: 'Alpha',
                    },
                    {
                        address:
                            'ecash:qpq235n3l3u6ampc8slapapnatwfy446auuv64ylt2',
                        name: 'Beta',
                    },
                    {
                        address:
                            'ecash:qz50e58nkeg2ej2f34z6mhwylp6ven8emy8pp52r82',
                        name: 'Gamma',
                    },
                ],
                isValid: true,
            },
            {
                description: 'Valid objects but also an empty object is false',
                contactList: [
                    {},
                    {
                        address:
                            'ecash:qpdkc5p7f25hwkxsr69m3evlj4h7wqq9xcgmjc8sxr',
                        name: 'Alpha',
                    },
                    {
                        address:
                            'ecash:qpq235n3l3u6ampc8slapapnatwfy446auuv64ylt2',
                        name: 'Beta',
                    },
                    {
                        address:
                            'ecash:qz50e58nkeg2ej2f34z6mhwylp6ven8emy8pp52r82',
                        name: 'Gamma',
                    },
                ],
                isValid: false,
            },
            {
                description: 'Valid alias formats are accepted',
                contactList: [
                    {
                        address: 'beta.xec',
                        name: 'Test',
                    },
                ],
                isValid: true,
            },
        ],
    },
    migrateLegacyCashtabSettings: {
        expectedReturns: [
            {
                description: 'Migrates a 1.4.x user to 1.5.0 settings',
                legacySettings: {
                    fiatCurrency: 'usd',
                    sendModal: false,
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                },
                migratedSettings: {
                    fiatCurrency: 'usd',
                    sendModal: false,
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                    minFeeSends: false,
                },
            },
            {
                description: 'User with only fiatCurrency in settings',
                legacySettings: {
                    fiatCurrency: 'gbp',
                },
                migratedSettings: {
                    fiatCurrency: 'gbp',
                    sendModal: false,
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                    minFeeSends: false,
                },
            },
            {
                description: 'Migrates an empty object to default settings',
                legacySettings: {},
                migratedSettings: cashtabSettings,
            },
            {
                description:
                    'Returns object unchanged if it has all expected keys',
                legacySettings: {
                    fiatCurrency: 'brl',
                    sendModal: true,
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                    minFeeSends: false,
                },
                migratedSettings: {
                    fiatCurrency: 'brl',
                    sendModal: true,
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                    minFeeSends: false,
                },
            },
        ],
    },
    isValidCashtabSettings: {
        expectedReturns: [
            {
                description: 'A 1.4.x settings object is invalid',
                settings: {
                    fiatCurrency: 'usd',
                    sendModal: false,
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                },
                isValid: false,
            },
            {
                description: 'A 1.5.0 settings object is valid',
                settings: {
                    fiatCurrency: 'usd',
                    sendModal: false,
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                    minFeeSends: false,
                },
                isValid: true,
            },
            {
                description:
                    'Rejects an otherwise-valid settings object if the currency is not supported',
                settings: {
                    fiatCurrency: 'xau',
                    sendModal: false,
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                    minFeeSends: false,
                },
                isValid: false,
            },
            {
                description:
                    'Rejects an otherwise-valid settings object if a ticker is misnamed',
                settings: {
                    fiatCurrencyTicker: 'usd',
                    sendModal: false,
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                    minFeeSends: false,
                },
                isValid: false,
            },
            {
                description:
                    'Rejects an otherwise-valid settings object if it is from before the introduction of sendModal',
                settings: {
                    fiatCurrencyTicker: 'usd',
                    autoCameraOn: true,
                    hideMessagesFromUnknownSenders: false,
                    balanceVisible: true,
                },
                isValid: false,
            },
        ],
    },
    isValidCashtabCache: {
        expectedReturns: [
            {
                description: 'Returns false for legacy cashtabCache',
                cashtabCache: { tokenInfoById: {} },
                isValid: false,
            },
            {
                description:
                    'Returns false if there is not a map at tokens key',
                cashtabCache: { tokens: {} },
                isValid: false,
            },
            {
                description: 'Returns true for current version cashtabCache',
                cashtabCache: mockCashtabCache,
                isValid: true,
            },
            {
                description: 'Returns true for default cashtabCache',
                cashtabCache: defaultCashtabCache,
                isValid: true,
            },
        ],
    },
    isValidCashtabWallet: {
        expectedReturns: [
            {
                description: 'Returns true for a valid Cashtab wallet',
                wallet: validWallet,
                returned: true,
            },
            {
                description: 'Returns false if not an object',
                wallet: 'a string',
                returned: false,
            },
            {
                description:
                    'Returns false if false (used to indicate no wallet yet set)',
                wallet: false,
                returned: false,
            },
            {
                description: 'Returns false if wallet is missing state',
                wallet: cloneObjectWithDeletedKey(validWallet, 'state'),
                returned: false,
            },
            {
                description: 'Returns false if wallet is missing mnemonic',
                wallet: cloneObjectWithDeletedKey(validWallet, 'mnemonic'),
                returned: false,
            },
            {
                description: 'Returns false if wallet is missing name',
                wallet: cloneObjectWithDeletedKey(validWallet, 'name'),
                returned: false,
            },
            {
                description: 'Returns false if wallet is missing Path145',
                wallet: cloneObjectWithDeletedKey(validWallet, 'Path145'),
                returned: false,
            },
            {
                description:
                    'Returns false if wallet is missing Path145.hash160',
                wallet: {
                    ...validWallet,
                    Path145: cloneObjectWithDeletedKey(
                        validWallet.Path145,
                        'hash160',
                    ),
                },
                returned: false,
            },
            {
                description:
                    'Returns false if wallet is missing Path145.cashAddress',
                wallet: {
                    ...validWallet,
                    Path145: cloneObjectWithDeletedKey(
                        validWallet.Path145,
                        'cashAddress',
                    ),
                },
                returned: false,
            },
            {
                description:
                    'Returns false if wallet is missing Path145.publicKey',
                wallet: {
                    ...validWallet,
                    Path145: cloneObjectWithDeletedKey(
                        validWallet.Path145,
                        'publicKey',
                    ),
                },
                returned: false,
            },
            {
                description: 'Returns false if wallet is missing Path245',
                wallet: cloneObjectWithDeletedKey(validWallet, 'Path245'),
                returned: false,
            },
            {
                description:
                    'Returns false if wallet is missing Path245.hash160',
                wallet: {
                    ...validWallet,
                    Path245: cloneObjectWithDeletedKey(
                        validWallet.Path245,
                        'hash160',
                    ),
                },
                returned: false,
            },
            {
                description:
                    'Returns false if wallet is missing Path245.cashAddress',
                wallet: {
                    ...validWallet,
                    Path245: cloneObjectWithDeletedKey(
                        validWallet.Path245,
                        'cashAddress',
                    ),
                },
                returned: false,
            },
            {
                description:
                    'Returns false if wallet is missing Path245.publicKey',
                wallet: {
                    ...validWallet,
                    Path245: cloneObjectWithDeletedKey(
                        validWallet.Path245,
                        'publicKey',
                    ),
                },
                returned: false,
            },
            {
                description: 'Returns false if wallet is missing Path1899',
                wallet: cloneObjectWithDeletedKey(validWallet, 'Path1899'),
                returned: false,
            },
            {
                description:
                    'Returns false if wallet is missing Path1899.hash160',
                wallet: {
                    ...validWallet,
                    Path1899: cloneObjectWithDeletedKey(
                        validWallet.Path1899,
                        'hash160',
                    ),
                },
                returned: false,
            },
            {
                description:
                    'Returns false if wallet is missing Path1899.cashAddress',
                wallet: {
                    ...validWallet,
                    Path1899: cloneObjectWithDeletedKey(
                        validWallet.Path1899,
                        'cashAddress',
                    ),
                },
                returned: false,
            },
            {
                description:
                    'Returns false if wallet is missing Path1899.publicKey',
                wallet: {
                    ...validWallet,
                    Path1899: cloneObjectWithDeletedKey(
                        validWallet.Path1899,
                        'publicKey',
                    ),
                },
                returned: false,
            },
            {
                description: 'Returns false if wallet.state is not an object',
                wallet: {
                    ...validWallet,
                    state: 'string',
                },
                returned: false,
            },
            {
                description: 'Returns false if no balances in wallet.state',
                wallet: {
                    ...validWallet,
                    state: cloneObjectWithDeletedKey(
                        validWallet.state,
                        'balances',
                    ),
                },
                returned: false,
            },
            {
                description: 'Returns false if no slpUtxos in wallet.state',
                wallet: {
                    ...validWallet,
                    state: cloneObjectWithDeletedKey(
                        validWallet.state,
                        'slpUtxos',
                    ),
                },
                returned: false,
            },
            {
                description: 'Returns false if no nonSlpUtxos in wallet.state',
                wallet: {
                    ...validWallet,
                    state: cloneObjectWithDeletedKey(
                        validWallet.state,
                        'nonSlpUtxos',
                    ),
                },
                returned: false,
            },
            {
                description: 'Returns false if no tokens in wallet.state',
                wallet: {
                    ...validWallet,
                    state: cloneObjectWithDeletedKey(
                        validWallet.state,
                        'tokens',
                    ),
                },
                returned: false,
            },
            {
                description:
                    'Returns false if hydratedUtxoDetails is in wallet.state',
                wallet: {
                    ...validWallet,
                    state: { ...validWallet.state, hydratedUtxoDetails: [] },
                },
                returned: false,
            },
            {
                description:
                    'Returns false if slpBalancesAndUtxos is in wallet.state',
                wallet: {
                    ...validWallet,
                    state: { ...validWallet.state, slpBalancesAndUtxos: [] },
                },
                returned: false,
            },
        ],
    },
};
