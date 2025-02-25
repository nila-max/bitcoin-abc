// Copyright (c) 2024 The Bitcoin developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useLocation, Link } from 'react-router-dom';
import {
    Collapse,
    Form,
    Input,
    Modal,
    Alert,
    Switch,
    Tooltip,
    Checkbox,
} from 'antd';
import { Row, Col, notification } from 'antd';
import {
    PlusSquareOutlined,
    WalletFilled,
    ImportOutlined,
    LockOutlined,
    CheckOutlined,
    CloseOutlined,
    LockFilled,
} from '@ant-design/icons';
import { WalletContext } from 'wallet/context';
import { SidePaddingCtn, FormLabel } from 'components/Common/Atoms';
import { StyledCollapse } from 'components/Common/StyledCollapse';
import {
    AntdFormWrapper,
    CurrencySelectDropdown,
} from 'components/Common/EnhancedInputs';
import PrimaryButton, {
    SecondaryButton,
    SmartButton,
} from 'components/Common/PrimaryButton';
import {
    ThemedCopyOutlined,
    ThemedWalletOutlined,
    ThemedDollarOutlined,
    ThemedSettingOutlined,
    ThemedContactsOutlined,
    ThemedContactSendOutlined,
    ThemedPlusOutlined,
    ThemedDownloadOutlined,
    ThemedCopySolid,
    ThemedTrashcanOutlined,
    ThemedEditOutlined,
    WarningIcon,
    ThemedXIcon,
    ThemedFacebookIcon,
    ThemedGithubIcon,
    SocialContainer,
    SocialLink,
} from 'components/Common/CustomIcons';
import TokenIcon from 'components/Etokens/TokenIcon';
import { Event } from 'components/Common/GoogleAnalytics';
import ApiError from 'components/Common/ApiError';
import CopyToClipboard from 'components/Common/CopyToClipboard';
import { formatSavedBalance } from 'utils/formatting';
import {
    isValidNewWalletNameLength,
    validateMnemonic,
    isValidRecipient,
} from 'validation';
import { convertToEcashPrefix, getWalletState } from 'utils/cashMethods';
import appConfig from 'config/app';
import { isMobile } from 'helpers';
import { hasEnoughToken } from 'wallet';
const { Panel } = Collapse;

const VersionContainer = styled.div`
    color: ${props => props.theme.contrast};
`;

const SWRow = styled.div`
    border-radius: 3px;
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
    @media (max-width: 500px) {
        flex-direction: column;
        margin-bottom: 12px;
    }
`;

const SWName = styled.div`
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    word-wrap: break-word;
    hyphens: auto;

    @media (max-width: 500px) {
        width: 100%;
        justify-content: center;
        margin-bottom: 15px;
    }

    h3 {
        font-size: 16px;
        color: ${props => props.theme.darkBlue};
        margin: 0;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    h3.overflow {
        width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const SWBalance = styled.div`
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    word-wrap: break-word;
    hyphens: auto;
    @media (max-width: 500px) {
        width: 100%;
        justify-content: center;
        margin-bottom: 15px;
    }
    div {
        font-size: 13px;
        color: ${props => props.theme.darkBlue};
        margin: 0;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    div.overflow {
        width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const SWButtonCtn = styled.div`
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    @media (max-width: 500px) {
        width: 100%;
        justify-content: center;
    }

    button {
        cursor: pointer;
        background: transparent;
        border: 1px solid #fff;
        box-shadow: none;
        color: #fff;
        border-radius: 3px;
        opacity: 0.6;
        transition: all 200ms ease-in-out;

        :hover {
            opacity: 1;
            background: ${props => props.theme.eCashBlue};
            border-color: ${props => props.theme.eCashBlue};
        }

        @media (max-width: 768px) {
            font-size: 14px;
        }
    }

    svg {
        stroke: ${props => props.theme.eCashBlue};
        fill: ${props => props.theme.eCashBlue};
        width: 20px;
        height: 25px;
        margin-right: 10px;
        cursor: pointer;
        :hover {
            stroke: ${props => props.theme.settings.delete};
            fill: ${props => props.theme.settings.delete};
        }
    }
`;

const ContactListRow = styled.div`
    border-radius: 3px;
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
    @media (max-width: 500px) {
        flex-direction: column;
        margin-bottom: 12px;
    }
`;

const ContactListAddress = styled.div`
    width: 40%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    word-wrap: break-word;
    hyphens: auto;
    @media (max-width: 500px) {
        width: 100%;
        justify-content: center;
        margin-bottom: 15px;
    }
    div {
        font-size: 13px;
        color: ${props => props.theme.darkBlue};
        margin: 12px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    div.overflow {
        width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const ContactListName = styled.div`
    width: 30%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    word-wrap: break-word;
    hyphens: auto;
    @media (max-width: 500px) {
        width: 100%;
        justify-content: center;
        margin-bottom: 15px;
    }
    div {
        font-size: 13px;
        color: ${props => props.theme.darkBlue};
        margin: 0px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    div.overflow {
        width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const ContactListCtn = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    @media (max-width: 500px) {
        width: 100%;
        justify-content: center;
    }
    ${ThemedCopySolid} {
        margin-top: 7px;
    }

    button {
        cursor: pointer;
        background: transparent;
        border: 1px solid #fff;
        box-shadow: none;
        color: #fff;
        border-radius: 3px;
        opacity: 0.6;
        transition: all 200ms ease-in-out;

        :hover {
            opacity: 1;
            background: ${props => props.theme.eCashBlue};
            border-color: ${props => props.theme.eCashBlue};
        }

        @media (max-width: 768px) {
            font-size: 14px;
        }
    }

    svg {
        stroke: ${props => props.theme.eCashBlue};
        fill: ${props => props.theme.eCashBlue};
        width: 25px;
        height: 25px;
        margin-right: 10px;
        cursor: pointer;
        :hover {
            stroke: ${props => props.theme.settings.delete};
            fill: ${props => props.theme.settings.delete};
        }
    }
`;

const ContactListBtnCtn = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
`;

const ExpandedBtnText = styled.span`
    @media (max-width: 335px) {
        display: none;
    }
`;

const ContactListBtn = styled.button`
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    background: transparent;
    border: 1px solid #fff;
    box-shadow: none;
    color: #fff;
    border-radius: 3px;
    opacity: 0.6;
    gap: 3px;
    transition: all 200ms ease-in-out;
    @media (max-width: 500px) {
        width: 100%;
        justify-content: center;
    }
    :hover {
        opacity: 1;
        background: ${props => props.theme.eCashBlue};
        border-color: ${props => props.theme.eCashBlue};
    }
    svg {
        fill: ${props => props.theme.contrast} !important;
    }
`;

const AWRow = styled.div`
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    h3 {
        font-size: 16px;
        flex: 1 1 0;
        display: inline-block;
        color: ${props => props.theme.darkBlue};
        margin: 0;
        text-align: left;
        font-weight: bold;
        @media (max-width: 500px) {
            font-size: 14px;
        }
    }
    h4 {
        font-size: 16px;
        flex: 1 1 0;
        display: inline-block;
        color: ${props => props.theme.eCashBlue} !important;
        margin: 0;
        text-align: right;
    }
    ${SWButtonCtn} {
        flex: 1 1 0;
    }
    @media (max-width: 500px) {
        flex-direction: column;
        margin-bottom: 12px;
    }
`;

const StyledConfigure = styled.div`
    h2 {
        color: ${props => props.theme.contrast};
        font-size: 25px;
    }
    svg {
        fill: ${props => props.theme.eCashBlue};
        
    }
    p {
        color: ${props => props.theme.darkBlue};
    }
    .ant-alert {
        color: ${props => props.theme.lightGrey}
        font-size: 14px;
    }
    .ant-collapse-header{
        .anticon{
            flex: 1;
        }
        .seedPhrase{ 
            flex: 2;
        }
    }
  
   
`;

const StyledSpacer = styled.div`
    height: 1px;
    width: 100%;
    background-color: ${props => props.theme.lightWhite};
    margin: 60px 0 50px;
`;

const HideableTextContainer = styled.div``;
const SettingsLabel = styled.div`
    display: flex;
    white-space: nowrap;
    gap: 3px;
`;

const GeneralSettingsItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    .ant-switch svg {
        fill: #717171;
    }
    .anticon {
        color: ${props => props.theme.contrast};
    }
    .ant-switch {
        background-color: #bdbdbd;
    }
    .ant-switch-checked {
        background-color: ${props => props.theme.eCashBlue};
        svg {
            fill: ${props => props.theme.contrast};
        }
    }
    color: ${props => props.theme.lightWhite};
`;

const VIPSettingsHolder = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
`;

const Configure = ({ passLoadingStatus }) => {
    const ContextValue = React.useContext(WalletContext);
    const {
        wallet,
        apiError,
        addNewSavedWallet,
        activateWallet,
        renameSavedWallet,
        renameActiveWallet,
        deleteWallet,
        getSavedWallets,
        updateCashtabState,
        cashtabState,
    } = ContextValue;
    // Ensure cashtabState is not undefined before context initializes
    const { contactList, settings } =
        typeof cashtabState === 'undefined'
            ? appConfig.defaultCashtabState
            : cashtabState;

    const walletState = getWalletState(wallet);
    const { tokens } = walletState;

    const location = useLocation();

    const [savedWallets, setSavedWallets] = useState([]);
    const [formData, setFormData] = useState({
        mnemonic: '',
    });
    const [showRenameWalletModal, setShowRenameWalletModal] = useState(false);
    const [showDeleteWalletModal, setShowDeleteWalletModal] = useState(false);
    const [walletToBeRenamed, setWalletToBeRenamed] = useState(null);
    const [walletToBeDeleted, setWalletToBeDeleted] = useState(null);
    const [newWalletName, setNewWalletName] = useState('');
    const [
        confirmationOfWalletToBeDeleted,
        setConfirmationOfWalletToBeDeleted,
    ] = useState('');
    const [newWalletNameIsValid, setNewWalletNameIsValid] = useState(null);
    const [walletDeleteValid, setWalletDeleteValid] = useState(null);
    const [seedInput, openSeedInput] = useState(false);
    const [revealSeed, setRevealSeed] = useState(false);
    const [showTranslationWarning, setShowTranslationWarning] = useState(false);
    const [savedWalletContactModal, setSavedWalletContactModal] =
        useState(false);

    const showPopulatedDeleteWalletModal = walletInfo => {
        setWalletToBeDeleted(walletInfo);
        setShowDeleteWalletModal(true);
    };

    const showPopulatedRenameWalletModal = walletInfo => {
        setWalletToBeRenamed(walletInfo);
        setShowRenameWalletModal(true);
    };
    const cancelRenameWallet = () => {
        // Delete form value
        setNewWalletName('');
        setShowRenameWalletModal(false);
    };
    const cancelDeleteWallet = () => {
        setWalletToBeDeleted(null);
        setConfirmationOfWalletToBeDeleted('');
        setShowDeleteWalletModal(false);
    };
    const updateSavedWallets = async activeWallet => {
        // Lock the UI while getting the correct savedWallets value from indexedDb into state
        passLoadingStatus(true);
        if (activeWallet) {
            let savedWallets;
            try {
                savedWallets = await getSavedWallets(activeWallet);
                setSavedWallets(savedWallets);
            } catch (err) {
                console.log(`Error in getSavedWallets()`);
                console.log(err);
            }
        }
    };

    const [isValidMnemonic, setIsValidMnemonic] = useState(null);

    const [showRenameContactModal, setShowRenameContactModal] = useState(false);
    const [contactToBeRenamed, setContactToBeRenamed] = useState(null); //object
    const [newContactNameIsValid, setNewContactNameIsValid] = useState(null);
    const [
        confirmationOfContactToBeRenamed,
        setConfirmationOfContactToBeRenamed,
    ] = useState('');

    const [showDeleteContactModal, setShowDeleteContactModal] = useState(false);
    const [contactAddressToDelete, setContactAddressToDelete] = useState(null);
    const [contactDeleteValid, setContactDeleteValid] = useState(null);
    const [
        confirmationOfContactToBeDeleted,
        setConfirmationOfContactToBeDeleted,
    ] = useState('');

    const [showManualAddContactModal, setShowManualAddContactModal] =
        useState(false);
    const [manualContactName, setManualContactName] = useState('');
    const [manualContactAddress, setManualContactAddress] = useState('');
    const [manualContactNameIsValid, setManualContactNameIsValid] =
        useState(null);
    const [manualContactAddressIsValid, setManualContactAddressIsValid] =
        useState(null);

    useEffect(() => {
        // Update savedWallets every time the active wallet changes
        // Use wallet.name and not wallet as the dep param, since wallet changes every time new txs come in or update function from useWallet.js runs
        updateSavedWallets(wallet);
    }, [wallet.name]);

    useEffect(() => {
        // Only unlock UI when savedWallets is updated in state
        passLoadingStatus(false);
    }, [savedWallets]);

    const handleContactListRouting = async () => {
        // if this was routed from Home screen's Add to Contact link
        if (location && location.state && location.state.contactToAdd) {
            // set default name for contact and sender as address
            let newContactObj = {
                name: location.state.contactToAdd.substring(6, 11),
                address: location.state.contactToAdd,
            };

            // Check to see if the contact exists
            const contactExists = contactList.find(
                contact => contact.address === newContactObj.address,
            );

            if (typeof contactExists !== 'undefined') {
                // Contact already exists
                notification.error({
                    message: 'Error',
                    description:
                        location.state.contactToAdd +
                        ' already exists in the Contact List',
                });
            } else {
                contactList.push(newContactObj);

                // Update localforage and state
                await updateCashtabState('contactList', contactList);
                notification.success({
                    message: 'Success',
                    description:
                        location.state.contactToAdd + ' added to Contact List',
                });
            }
        }
    };

    useEffect(() => {
        const detectedBrowserLang = navigator.language;
        if (!detectedBrowserLang.includes('en-')) {
            setShowTranslationWarning(true);
        }

        if (
            location &&
            location.state &&
            location.state.showRenameWalletModal
        ) {
            setShowRenameWalletModal(true);
            setWalletToBeRenamed(wallet);
        }

        handleContactListRouting();
    }, []);

    // Need this function to ensure that savedWallets are updated on new wallet creation
    const updateSavedWalletsOnCreate = async importMnemonic => {
        // Event("Category", "Action", "Label")
        // Track number of times a different wallet is activated
        Event('Configure.js', 'Create Wallet', 'New');
        const walletAdded = await addNewSavedWallet(importMnemonic);
        if (!walletAdded) {
            Modal.error({
                title: 'This wallet already exists!',
                content: 'Wallet not added',
            });
        } else {
            Modal.success({
                content: 'Wallet added to your saved wallets',
            });
        }
        await updateSavedWallets(wallet);
    };

    const updateSavedWalletsOnLoad = async (wallet, walletToActivate) => {
        // Event("Category", "Action", "Label")
        // Track number of times a different wallet is activated
        Event('Configure.js', 'Activate', '');
        await activateWallet(wallet, walletToActivate);
    };

    async function submit() {
        setFormData({
            ...formData,
        });

        // Exit if no user input
        if (!formData.mnemonic) {
            return;
        }

        // Exit if mnemonic is invalid
        if (!isValidMnemonic) {
            return;
        }
        // Event("Category", "Action", "Label")
        // Track number of times a different wallet is activated
        Event('Configure.js', 'Create Wallet', 'Imported');
        updateSavedWalletsOnCreate(formData.mnemonic);
    }

    const handleChange = e => {
        const { value, name } = e.target;

        // Validate mnemonic on change
        // Import button should be disabled unless mnemonic is valid
        setIsValidMnemonic(validateMnemonic(value));

        setFormData(p => ({ ...p, [name]: value }));
    };

    const changeWalletName = async () => {
        let oldActiveWalletName;
        if (!isValidNewWalletNameLength(newWalletName)) {
            setNewWalletNameIsValid(false);
            return;
        }
        // Hide modal
        setShowRenameWalletModal(false);
        // Change wallet name
        console.log(
            `Changing wallet ${walletToBeRenamed.name} name to ${newWalletName}`,
        );
        let renameSuccess;

        if (walletToBeRenamed.name === wallet.name) {
            oldActiveWalletName = walletToBeRenamed.name;
            renameSuccess = await renameActiveWallet(
                wallet,
                walletToBeRenamed.name,
                newWalletName,
            );
        } else {
            renameSuccess = await renameSavedWallet(
                walletToBeRenamed.name,
                newWalletName,
            );
        }

        if (renameSuccess) {
            Modal.success({
                content: `Wallet "${
                    oldActiveWalletName !== undefined
                        ? oldActiveWalletName
                        : walletToBeRenamed.name
                }" renamed to "${newWalletName}"`,
            });
        } else {
            Modal.error({
                content: `Rename failed. All wallets must have a unique name.`,
            });
        }
        await updateSavedWallets(wallet);
        // Clear wallet name for form
        setNewWalletName('');
    };

    const deleteSelectedWallet = async () => {
        if (!walletDeleteValid && walletDeleteValid !== null) {
            return;
        }
        if (
            confirmationOfWalletToBeDeleted !==
            `delete ${walletToBeDeleted.name}`
        ) {
            setWalletDeleteValid(false);
            return;
        }

        // Hide modal
        setShowDeleteWalletModal(false);
        // Change wallet name
        console.log(`Deleting wallet "${walletToBeDeleted.name}"`);
        const walletDeletedSuccess = await deleteWallet(walletToBeDeleted);

        if (walletDeletedSuccess) {
            Modal.success({
                content: `Wallet "${walletToBeDeleted.name}" successfully deleted`,
            });
        } else {
            Modal.error({
                content: `Error deleting ${walletToBeDeleted.name}.`,
            });
        }
        await updateSavedWallets(wallet);
        // Clear wallet delete confirmation from form
        setConfirmationOfWalletToBeDeleted('');
    };

    const handleWalletNameInput = e => {
        const { value } = e.target;
        // validation
        if (value && isValidNewWalletNameLength(value)) {
            setNewWalletNameIsValid(true);
        } else {
            setNewWalletNameIsValid(false);
        }

        setNewWalletName(value);
    };

    const handleWalletToDeleteInput = e => {
        const { value } = e.target;

        if (value && value === `delete ${walletToBeDeleted.name}`) {
            setWalletDeleteValid(true);
        } else {
            setWalletDeleteValid(false);
        }
        setConfirmationOfWalletToBeDeleted(value);
    };

    const handleContactNameInput = e => {
        const { value } = e.target;

        if (
            value &&
            value.length &&
            value.length < appConfig.localStorageMaxCharacters
        ) {
            setNewContactNameIsValid(true);
        } else {
            setNewContactNameIsValid(false);
        }
        setConfirmationOfContactToBeRenamed(value);
    };

    const handleRenameContact = contactObj => {
        if (!contactObj) {
            console.log(
                'handleRenameContact() error: Invalid contact object for update',
            );
            return;
        }
        setContactToBeRenamed(contactObj);
        setShowRenameContactModal(true);
    };

    const handleRenameContactCancel = () => {
        setShowRenameContactModal(false);
    };

    const handleRenameContactModalOk = () => {
        if (
            !newContactNameIsValid ||
            newContactNameIsValid === null ||
            !contactToBeRenamed
        ) {
            return;
        }
        renameContactByName(contactToBeRenamed);
        setShowRenameContactModal(false);
    };

    const renameContactByName = async contact => {
        // obtain reference to the contact object in the array
        let contactToUpdate = contactList.find(
            element => element.address === contact.address,
        );

        // if a match was found
        if (typeof contactToUpdate !== 'undefined') {
            // update the contact name
            contactToUpdate.name = confirmationOfContactToBeRenamed;

            // Update localforage and state
            await updateCashtabState('contactList', contactList);
        } else {
            notification.error({
                message: 'Error',
                description: 'Unable to find contact in array',
            });
        }
    };

    const handleSendModalToggle = checkedState => {
        updateCashtabState('settings', {
            ...settings,
            sendModal: checkedState,
        });
    };

    const handleMinFeesToggle = checkedState => {
        updateCashtabState('settings', {
            ...settings,
            minFeeSends: checkedState,
        });
    };

    const handleCameraOverride = checkedState => {
        updateCashtabState('settings', {
            ...settings,
            autoCameraOn: checkedState,
        });
    };
    const handleUnknownSenderMsg = checkedState => {
        updateCashtabState('settings', {
            ...settings,
            hideMessagesFromUnknownSenders: checkedState,
        });
    };

    const getContactNameByAddress = contactAddress => {
        if (!contactAddress) {
            return;
        }

        // filter contact from local contact list array
        const filteredContactList = contactList.filter(
            element => element.address === contactAddress,
        );

        if (!filteredContactList) {
            return;
        }

        return filteredContactList[0].name;
    };

    const deleteContactByAddress = async contactAddress => {
        if (!contactAddress) {
            return;
        }

        // filter contact from local contact list array
        const updatedContactList = contactList.filter(
            element => element.address !== contactAddress,
        );

        // Update localforage and state
        await updateCashtabState('contactList', updatedContactList);
        notification.success({
            message: 'Success',
            description: `${contactAddressToDelete} removed from Contact List`,
        });
    };

    const handleDeleteContact = contactAddress => {
        if (!contactAddress) {
            console.log(
                'handleDeleteContact() error: Invalid contact address for deletion',
            );
            return;
        }
        setContactAddressToDelete(contactAddress);
        setShowDeleteContactModal(true);
    };

    const handleDeleteContactModalCancel = () => {
        setShowDeleteContactModal(false);
    };

    const handleDeleteContactModalOk = () => {
        if (
            !contactDeleteValid ||
            contactDeleteValid === null ||
            !contactAddressToDelete
        ) {
            return;
        }
        setShowDeleteContactModal(false);
        deleteContactByAddress(contactAddressToDelete);
    };

    const handleContactToDeleteInput = e => {
        const { value } = e.target;
        const contactName = getContactNameByAddress(contactAddressToDelete);
        if (value && value === 'delete ' + contactName) {
            setContactDeleteValid(true);
        } else {
            setContactDeleteValid(false);
        }
        setConfirmationOfContactToBeDeleted(value);
    };

    const exportContactList = contactListArray => {
        if (!contactListArray) {
            notification.error({
                message: 'Error',
                description: 'Unable to export contact list',
            });
            return;
        }

        // convert object array into csv data
        let csvContent =
            'data:text/csv;charset=utf-8,' +
            contactListArray.map(
                element => '\n' + element.name + '|' + element.address,
            );

        // encode csv
        var encodedUri = encodeURI(csvContent);

        // hidden DOM node to set the default file name
        var csvLink = document.createElement('a');
        csvLink.setAttribute('href', encodedUri);
        csvLink.setAttribute(
            'download',
            'Cashtab_Contacts_' + wallet.name + '.csv',
        );
        document.body.appendChild(csvLink);
        csvLink.click();
    };

    const handleAddSavedWalletAsContactOk = async () => {
        // Check to see if the contact exists
        const contactExists = contactList.find(
            contact => contact.address === manualContactAddress,
        );
        if (typeof contactExists !== 'undefined') {
            // it exists
            notification.error({
                message: 'Error',
                description:
                    manualContactAddress +
                    ' already exists in the Contact List',
            });
        } else {
            contactList.push({
                name: manualContactName,
                address: manualContactAddress,
            });
            // update localforage and state
            await updateCashtabState('contactList', contactList);
            notification.success({
                message: 'Success',
                description: `${manualContactAddress} added to Contact List`,
            });
        }

        // Reset relevant state fields
        setSavedWalletContactModal(false);
        setManualContactName('');
        setManualContactAddress('');
    };

    const handleAddSavedWalletAsContactCancel = () => {
        setSavedWalletContactModal(false);
        setManualContactName('');
        setManualContactAddress('');
    };

    const addSavedWalletToContact = wallet => {
        if (!wallet) {
            return;
        }
        // initialise saved wallet name and address to state for confirmation modal
        setManualContactName(wallet.name);
        setManualContactAddress(
            convertToEcashPrefix(wallet.Path1899.cashAddress),
        );
        setSavedWalletContactModal(true);
    };

    const handleManualAddContactModalOk = async () => {
        // if either inputs are invalid then go no further
        if (!manualContactNameIsValid || !manualContactAddressIsValid) {
            return;
        }

        // Check to see if the contact exists
        const contactExists = contactList.find(
            contact => contact.address === manualContactAddress,
        );

        if (typeof contactExists !== 'undefined') {
            // Contact exists
            notification.error({
                message: 'Error',
                description: `${manualContactAddress} already exists in the Contact List`,
            });
        } else {
            contactList.push({
                name: manualContactName,
                address: manualContactAddress,
            });
            // update localforage and state
            await updateCashtabState('contactList', contactList);
            notification.success({
                message: 'Success',
                description: `${manualContactAddress} added to Contact List`,
            });
        }

        // Reset relevant state fields
        setShowManualAddContactModal(false);
        setManualContactName('');
        setManualContactAddress('');
    };

    const handleManualAddContactModalCancel = () => {
        setShowManualAddContactModal(false);
        setManualContactName('');
        setManualContactAddress('');
    };

    const handleManualContactNameInput = e => {
        const { value } = e.target;

        if (value && value.length && value.length < 24) {
            setManualContactNameIsValid(true);
        } else {
            setManualContactNameIsValid(false);
        }
        setManualContactName(value);
    };

    const handleManualContactAddressInput = async e => {
        const { value } = e.target;
        setManualContactAddress(value);
        setManualContactAddressIsValid(await isValidRecipient(value));
    };

    return (
        <SidePaddingCtn data-testid="configure-ctn">
            <StyledConfigure>
                {savedWalletContactModal && (
                    <Modal
                        title={`Add the following saved wallet to contact list?`}
                        open={savedWalletContactModal}
                        onOk={() => handleAddSavedWalletAsContactOk()}
                        onCancel={() => handleAddSavedWalletAsContactCancel()}
                    >
                        <AntdFormWrapper>
                            <Form style={{ width: 'auto' }}>
                                <FormLabel>Name: {manualContactName}</FormLabel>
                                <br />
                                <FormLabel>
                                    Address: {manualContactAddress}
                                </FormLabel>
                            </Form>
                        </AntdFormWrapper>
                    </Modal>
                )}
                {showManualAddContactModal && (
                    <Modal
                        data-testid="confirm-add-contact-modal"
                        title={`Add new contact to contact list`}
                        open={showManualAddContactModal}
                        onOk={() => handleManualAddContactModalOk()}
                        onCancel={() => handleManualAddContactModalCancel()}
                    >
                        <AntdFormWrapper>
                            <Form style={{ width: 'auto' }}>
                                <FormLabel>Name:</FormLabel>
                                <Form.Item
                                    validateStatus={
                                        manualContactNameIsValid === null ||
                                        manualContactNameIsValid
                                            ? ''
                                            : 'error'
                                    }
                                    help={
                                        manualContactNameIsValid === null ||
                                        manualContactNameIsValid
                                            ? ''
                                            : 'Contact name must be a string between 1 and 24 characters long'
                                    }
                                >
                                    <Input
                                        placeholder="Enter new contact name"
                                        name="manualContactName"
                                        value={manualContactName}
                                        onChange={e =>
                                            handleManualContactNameInput(e)
                                        }
                                    />
                                </Form.Item>
                                <FormLabel>eCash Address:</FormLabel>
                                <Form.Item
                                    validateStatus={
                                        manualContactAddressIsValid === null ||
                                        manualContactAddressIsValid
                                            ? ''
                                            : 'error'
                                    }
                                    help={
                                        manualContactAddressIsValid === null ||
                                        manualContactAddressIsValid
                                            ? ''
                                            : 'Invalid eCash address or alias'
                                    }
                                >
                                    <Input
                                        placeholder="Enter new eCash address or alias"
                                        name="manualContactAddress"
                                        value={manualContactAddress}
                                        onChange={e =>
                                            handleManualContactAddressInput(e)
                                        }
                                    />
                                </Form.Item>
                            </Form>
                        </AntdFormWrapper>
                    </Modal>
                )}
                {showDeleteContactModal && (
                    <>
                        <Modal
                            data-testid="confirm-delete-contact-modal"
                            title="Confirm Delete Contact"
                            open={showDeleteContactModal}
                            onOk={() => handleDeleteContactModalOk()}
                            onCancel={() => handleDeleteContactModalCancel()}
                        >
                            <p>
                                are you sure you want to delete{' '}
                                {getContactNameByAddress(
                                    contactAddressToDelete,
                                )}{' '}
                                from contact list?
                            </p>
                            <AntdFormWrapper>
                                <Form style={{ width: 'auto' }}>
                                    <Form.Item
                                        validateStatus={
                                            contactDeleteValid === null ||
                                            contactDeleteValid
                                                ? ''
                                                : 'error'
                                        }
                                        help={
                                            contactDeleteValid === null ||
                                            contactDeleteValid
                                                ? ''
                                                : 'Your confirmation phrase must match exactly'
                                        }
                                    >
                                        <Input
                                            data-testid="confirm-delete-contact"
                                            prefix={<ThemedContactsOutlined />}
                                            placeholder={`Type "delete ${getContactNameByAddress(
                                                contactAddressToDelete,
                                            )}" to confirm`}
                                            name="contactToBeDeletedInput"
                                            value={
                                                confirmationOfContactToBeDeleted
                                            }
                                            onChange={e =>
                                                handleContactToDeleteInput(e)
                                            }
                                        />
                                    </Form.Item>
                                </Form>
                            </AntdFormWrapper>
                        </Modal>
                    </>
                )}
                {showRenameContactModal && (
                    <Modal
                        data-testid="confirm-rename-contact-modal"
                        title={`Set contact name for ${contactToBeRenamed.address}`}
                        open={showRenameContactModal}
                        onOk={() => handleRenameContactModalOk()}
                        onCancel={() => handleRenameContactCancel()}
                    >
                        <AntdFormWrapper>
                            <Form style={{ width: 'auto' }}>
                                <Form.Item
                                    validateStatus={
                                        newContactNameIsValid === null ||
                                        newContactNameIsValid
                                            ? ''
                                            : 'error'
                                    }
                                    help={
                                        newContactNameIsValid === null ||
                                        newContactNameIsValid
                                            ? ''
                                            : 'Contact name must be a string between 1 and 24 characters long'
                                    }
                                >
                                    <Input
                                        prefix={<WalletFilled />}
                                        placeholder="Enter new contact name"
                                        name="newContactName"
                                        value={confirmationOfContactToBeRenamed}
                                        onChange={e =>
                                            handleContactNameInput(e)
                                        }
                                    />
                                </Form.Item>
                            </Form>
                        </AntdFormWrapper>
                    </Modal>
                )}
                {walletToBeRenamed !== null && (
                    <Modal
                        title={`Rename Wallet ${walletToBeRenamed.name}`}
                        open={showRenameWalletModal}
                        onOk={changeWalletName}
                        onCancel={() => cancelRenameWallet()}
                    >
                        <AntdFormWrapper>
                            <Form style={{ width: 'auto' }}>
                                <Form.Item
                                    validateStatus={
                                        newWalletNameIsValid === null ||
                                        newWalletNameIsValid
                                            ? ''
                                            : 'error'
                                    }
                                    help={
                                        newWalletNameIsValid === null ||
                                        newWalletNameIsValid
                                            ? ''
                                            : 'Wallet name must be a string between 1 and 24 characters long'
                                    }
                                >
                                    <Input
                                        prefix={<WalletFilled />}
                                        placeholder="Enter new wallet name"
                                        name="newName"
                                        value={newWalletName}
                                        onChange={e => handleWalletNameInput(e)}
                                    />
                                </Form.Item>
                            </Form>
                        </AntdFormWrapper>
                    </Modal>
                )}
                {walletToBeDeleted !== null && (
                    <Modal
                        title={`Are you sure you want to delete wallet "${walletToBeDeleted.name}"?`}
                        open={showDeleteWalletModal}
                        onOk={deleteSelectedWallet}
                        onCancel={() => cancelDeleteWallet()}
                    >
                        <AntdFormWrapper>
                            <Form style={{ width: 'auto' }}>
                                <Form.Item
                                    validateStatus={
                                        walletDeleteValid === null ||
                                        walletDeleteValid
                                            ? ''
                                            : 'error'
                                    }
                                    help={
                                        walletDeleteValid === null ||
                                        walletDeleteValid
                                            ? ''
                                            : 'Your confirmation phrase must match exactly'
                                    }
                                >
                                    <Input
                                        prefix={<WalletFilled />}
                                        placeholder={`Type "delete ${walletToBeDeleted.name}" to confirm`}
                                        name="walletToBeDeletedInput"
                                        value={confirmationOfWalletToBeDeleted}
                                        onChange={e =>
                                            handleWalletToDeleteInput(e)
                                        }
                                    />
                                </Form.Item>
                            </Form>
                        </AntdFormWrapper>
                    </Modal>
                )}
                <h2>
                    <ThemedCopyOutlined /> Backup your wallet
                </h2>
                <Alert
                    style={{ marginBottom: '12px' }}
                    description="Your seed phrase is the only way to restore your wallet. Write it down. Keep it safe."
                    type="warning"
                    showIcon
                />
                {showTranslationWarning && (
                    <Alert
                        style={{ marginBottom: '12px' }}
                        description="Please do not translate your seed phrase. Store your seed phrase in English. You must re-enter these exact English words to restore your wallet from seed."
                        type="warning"
                        showIcon
                    />
                )}
                {wallet && wallet.mnemonic && (
                    <StyledCollapse expandIconPosition="start">
                        <Panel
                            header={
                                <div className="seedPhrase">
                                    Click to reveal seed phrase
                                </div>
                            }
                        >
                            <p
                                className="notranslate"
                                style={{ userSelect: 'text' }}
                            >
                                {
                                    <>
                                        <WarningIcon />
                                        <br />
                                        <b>NEVER</b> share your seed phrase.
                                        <br />
                                        <b>DO NOT</b> enter it into 3rd party
                                        websites.
                                        <br />
                                        <br />
                                        <Checkbox
                                            onChange={() => {
                                                setRevealSeed(!revealSeed);
                                            }}
                                        >
                                            I understand, show me my seed
                                            phrase.
                                        </Checkbox>
                                        <br />
                                    </>
                                }
                                {wallet && wallet.mnemonic && revealSeed ? (
                                    <>
                                        <br />
                                        {wallet.mnemonic}
                                    </>
                                ) : (
                                    ''
                                )}
                            </p>
                        </Panel>
                    </StyledCollapse>
                )}
                <StyledSpacer />
                <h2>
                    <ThemedWalletOutlined /> Manage Wallets
                </h2>
                {apiError ? (
                    <ApiError />
                ) : (
                    <>
                        <PrimaryButton
                            onClick={() => updateSavedWalletsOnCreate()}
                        >
                            <PlusSquareOutlined /> New Wallet
                        </PrimaryButton>
                        <SecondaryButton
                            onClick={() => openSeedInput(!seedInput)}
                        >
                            <ImportOutlined /> Import Wallet
                        </SecondaryButton>
                        {seedInput && (
                            <>
                                <p style={{ color: '#fff' }}>
                                    Copy and paste your mnemonic seed phrase
                                    below to import an existing wallet
                                </p>
                                <AntdFormWrapper>
                                    <Form style={{ width: 'auto' }}>
                                        <Form.Item
                                            validateStatus={
                                                isValidMnemonic === null ||
                                                isValidMnemonic
                                                    ? ''
                                                    : 'error'
                                            }
                                            help={
                                                isValidMnemonic === null ||
                                                isValidMnemonic
                                                    ? ''
                                                    : 'Valid mnemonic seed phrase required'
                                            }
                                        >
                                            <Input
                                                prefix={<LockOutlined />}
                                                type="email"
                                                placeholder="mnemonic (seed phrase)"
                                                name="mnemonic"
                                                autoComplete="off"
                                                onChange={e => handleChange(e)}
                                                required
                                                title=""
                                            />
                                        </Form.Item>
                                        <SmartButton
                                            disabled={!isValidMnemonic}
                                            onClick={() => submit()}
                                        >
                                            Import
                                        </SmartButton>
                                    </Form>
                                </AntdFormWrapper>
                            </>
                        )}
                    </>
                )}
                {savedWallets && savedWallets.length > 0 && (
                    <>
                        <StyledCollapse defaultActiveKey={['1']}>
                            <Panel header="Saved wallets" key="1">
                                <AWRow>
                                    <Tooltip title={wallet.name}>
                                        <h3 className="notranslate">
                                            {wallet.name}
                                        </h3>
                                    </Tooltip>
                                    <h4>Currently active</h4>
                                    <SWButtonCtn>
                                        <ThemedEditOutlined
                                            onClick={() =>
                                                showPopulatedRenameWalletModal(
                                                    wallet,
                                                )
                                            }
                                        />
                                        <ThemedContactsOutlined
                                            onClick={() =>
                                                addSavedWalletToContact(wallet)
                                            }
                                        />
                                    </SWButtonCtn>
                                </AWRow>
                                <div>
                                    {savedWallets.map(sw => (
                                        <SWRow key={sw.name}>
                                            <Tooltip
                                                title={sw.name}
                                                autoAdjustOverflow={true}
                                            >
                                                <SWName>
                                                    <h3 className="overflow notranslate">
                                                        {sw.name}
                                                    </h3>
                                                </SWName>
                                            </Tooltip>
                                            <SWBalance>
                                                <div className="overflow">
                                                    [
                                                    {sw && sw.state
                                                        ? formatSavedBalance(
                                                              sw.state.balances
                                                                  .totalBalance,
                                                          )
                                                        : 'N/A'}{' '}
                                                    XEC]
                                                </div>
                                            </SWBalance>
                                            <SWButtonCtn>
                                                <ThemedEditOutlined
                                                    onClick={() =>
                                                        showPopulatedRenameWalletModal(
                                                            sw,
                                                        )
                                                    }
                                                />
                                                <ThemedContactsOutlined
                                                    data-testid="add-saved-wallet-to-contact-btn"
                                                    onClick={() =>
                                                        addSavedWalletToContact(
                                                            sw,
                                                        )
                                                    }
                                                />
                                                <ThemedTrashcanOutlined
                                                    onClick={() =>
                                                        showPopulatedDeleteWalletModal(
                                                            sw,
                                                        )
                                                    }
                                                />
                                                <button
                                                    onClick={() =>
                                                        updateSavedWalletsOnLoad(
                                                            wallet,
                                                            sw,
                                                        )
                                                    }
                                                >
                                                    Activate
                                                </button>
                                            </SWButtonCtn>
                                        </SWRow>
                                    ))}
                                </div>
                            </Panel>
                        </StyledCollapse>
                    </>
                )}
                <Row type="flex" data-testid="contact-list-collapse">
                    <Col span={24}>
                        <StyledCollapse
                            style={{
                                marginBottom: '24px',
                            }}
                            defaultActiveKey={
                                location &&
                                location.state &&
                                location.state.contactToAdd
                                    ? ['1']
                                    : ['0']
                            }
                        >
                            <Panel header="Contact List" key="1">
                                <AntdFormWrapper data-testid="contact-list-items">
                                    <Form
                                        style={{
                                            width: 'auto',
                                        }}
                                    >
                                        {contactList &&
                                        contactList.length > 0 ? (
                                            contactList.map(
                                                (element, index) => (
                                                    <ContactListRow key={index}>
                                                        <Tooltip
                                                            title={element.name}
                                                        >
                                                            <ContactListName>
                                                                <div className="overflow">
                                                                    {
                                                                        element.name
                                                                    }
                                                                </div>
                                                            </ContactListName>
                                                        </Tooltip>
                                                        <Tooltip
                                                            title={
                                                                element.address
                                                            }
                                                        >
                                                            <ContactListAddress>
                                                                <div className="overflow notranslate">
                                                                    {
                                                                        element.address
                                                                    }
                                                                </div>
                                                            </ContactListAddress>
                                                        </Tooltip>
                                                        <ContactListCtn data-testid="contact-list-options">
                                                            <CopyToClipboard
                                                                data={
                                                                    element.address
                                                                }
                                                                optionalOnCopyNotification={{
                                                                    title: 'Copied',
                                                                    msg: `${element.address} copied to clipboard`,
                                                                }}
                                                            >
                                                                <ThemedCopySolid />
                                                            </CopyToClipboard>
                                                            <ThemedEditOutlined
                                                                data-testid="rename-contact-btn"
                                                                onClick={() =>
                                                                    handleRenameContact(
                                                                        element,
                                                                    )
                                                                }
                                                            />
                                                            <Link
                                                                to="/send"
                                                                state={{
                                                                    contactSend:
                                                                        element.address,
                                                                }}
                                                            >
                                                                <ThemedContactSendOutlined />
                                                            </Link>
                                                            <ThemedTrashcanOutlined
                                                                data-testid="delete-contact-btn"
                                                                onClick={() =>
                                                                    handleDeleteContact(
                                                                        element.address,
                                                                    )
                                                                }
                                                            />
                                                        </ContactListCtn>
                                                    </ContactListRow>
                                                ),
                                            )
                                        ) : (
                                            <div>
                                                <p>
                                                    {
                                                        'Your contact list is empty.'
                                                    }
                                                </p>
                                                <p>
                                                    {
                                                        'Contacts can be added by clicking on a received transaction and looking for the "Add to contacts" icon or via the "New Contact" button below.'
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {/* Export button will only show when there are contacts */}
                                        <ContactListBtnCtn>
                                            {contactList &&
                                                contactList.length > 0 && (
                                                    <ContactListBtn
                                                        onClick={() =>
                                                            exportContactList(
                                                                contactList,
                                                            )
                                                        }
                                                    >
                                                        <ThemedDownloadOutlined />
                                                        <ExpandedBtnText>
                                                            Download
                                                        </ExpandedBtnText>
                                                        CSV
                                                    </ContactListBtn>
                                                )}
                                            <br />
                                            <br />
                                            <ContactListBtn
                                                data-testid="add-contact-btn"
                                                onClick={() =>
                                                    setShowManualAddContactModal(
                                                        true,
                                                    )
                                                }
                                            >
                                                <ThemedPlusOutlined />
                                                <ExpandedBtnText>
                                                    Add
                                                </ExpandedBtnText>
                                                Contact
                                            </ContactListBtn>
                                        </ContactListBtnCtn>
                                    </Form>
                                </AntdFormWrapper>
                            </Panel>
                        </StyledCollapse>
                    </Col>
                </Row>
                <StyledSpacer />
                <h2>
                    <ThemedDollarOutlined /> Fiat Currency
                </h2>
                <AntdFormWrapper>
                    <CurrencySelectDropdown
                        defaultValue={
                            settings && settings.fiatCurrency
                                ? settings.fiatCurrency
                                : 'usd'
                        }
                        onChange={fiatCode => {
                            updateCashtabState('settings', {
                                ...settings,
                                fiatCurrency: fiatCode,
                            });
                        }}
                    />
                </AntdFormWrapper>
                <StyledSpacer />
                <h2>
                    <ThemedSettingOutlined /> General Settings
                </h2>
                <GeneralSettingsItem>
                    <SettingsLabel>
                        <LockFilled /> Send Confirmations
                    </SettingsLabel>
                    <Switch
                        data-testid="send-confirmations-switch"
                        size="small"
                        checkedChildren={<CheckOutlined />}
                        unCheckedChildren={<CloseOutlined />}
                        checked={settings ? settings.sendModal : false}
                        onChange={handleSendModalToggle}
                    />
                </GeneralSettingsItem>
                {isMobile(navigator) && (
                    <GeneralSettingsItem>
                        <SettingsLabel>
                            <LockFilled /> Auto-open camera{' '}
                            <HideableTextContainer>
                                on send
                            </HideableTextContainer>
                        </SettingsLabel>
                        <Switch
                            size="small"
                            checkedChildren={<CheckOutlined />}
                            unCheckedChildren={<CloseOutlined />}
                            checked={settings ? settings.autoCameraOn : false}
                            onChange={handleCameraOverride}
                        />
                    </GeneralSettingsItem>
                )}
                <GeneralSettingsItem>
                    <SettingsLabel>
                        <LockFilled /> Hide msgs from unknown sender
                    </SettingsLabel>
                    <Switch
                        size="small"
                        checkedChildren={<CheckOutlined />}
                        unCheckedChildren={<CloseOutlined />}
                        checked={
                            settings
                                ? settings.hideMessagesFromUnknownSenders
                                : false
                        }
                        onChange={handleUnknownSenderMsg}
                    />
                </GeneralSettingsItem>

                {hasEnoughToken(
                    tokens,
                    appConfig.vipSettingsTokenId,
                    appConfig.vipSettingsTokenQty,
                ) && (
                    <>
                        <StyledSpacer />
                        <VIPSettingsHolder>
                            {' '}
                            <TokenIcon
                                size={64}
                                tokenId={appConfig.vipSettingsTokenId}
                            />
                            <h2>VIP Settings</h2>
                        </VIPSettingsHolder>
                        <GeneralSettingsItem>
                            <SettingsLabel>
                                {' '}
                                <LockFilled /> ABSOLUTE MINIMUM fees
                            </SettingsLabel>
                            <Switch
                                data-testid="settings-minFeeSends-switch"
                                size="small"
                                checkedChildren={<CheckOutlined />}
                                unCheckedChildren={<CloseOutlined />}
                                checked={
                                    settings ? settings.minFeeSends : false
                                }
                                onChange={handleMinFeesToggle}
                            />
                        </GeneralSettingsItem>
                    </>
                )}

                <StyledSpacer />
                <SocialContainer>
                    <SocialLink
                        href="https://x.com/cashtabwallet"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <ThemedXIcon />
                    </SocialLink>{' '}
                    <SocialLink
                        href="https://www.facebook.com/Cashtab"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <ThemedFacebookIcon />
                    </SocialLink>
                    <SocialLink
                        href="https://github.com/Bitcoin-ABC/bitcoin-abc/tree/master/cashtab"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <ThemedGithubIcon />
                    </SocialLink>
                </SocialContainer>

                {typeof process.env.REACT_APP_VERSION === 'string' && (
                    <>
                        <StyledSpacer />
                        <VersionContainer>
                            v{process.env.REACT_APP_VERSION}
                        </VersionContainer>
                    </>
                )}
            </StyledConfigure>
        </SidePaddingCtn>
    );
};

/*
passLoadingStatus must receive a default prop that is a function
in order to pass the rendering unit test in Configure.test.js

status => {console.log(status)} is an arbitrary stub function
*/

Configure.defaultProps = {
    passLoadingStatus: status => {
        console.log(status);
    },
};

Configure.propTypes = {
    passLoadingStatus: PropTypes.func,
};

export default Configure;
