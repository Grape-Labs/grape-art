import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';

import * as anchor from '@project-serum/anchor';
import { Idl, Provider } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import {
    Dialog,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    DialogActions,
    DialogTitle,
    DialogContent,
    Avatar,
    Button,
    Tooltip,
    CardActionArea,
    TextField,
} from '@mui/material';

import { trimAddress } from '../utils/grapeTools/WalletAddress'; // global key handling

import MessageIcon from '@mui/icons-material/Message';

import { useTranslation } from 'react-i18next';
import { createDialectForMembers, sendMessage } from '@dialectlabs/react';
import { walletconnect } from 'web3modal/dist/providers/connectors';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

// DEPRECATED in favour of Message button
export default function DirectMessageView(props: any) {
    const recipient = props.address || null;
    const [messageText, setMessageText] = React.useState(null);
    const [open_snackbar, setSnackbarState] = React.useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const { publicKey, wallet } = useWallet();
    const { connection } = useConnection();
    const DIALECT_PUBLIC_KEY = new PublicKey('D2pyBevYb6dit1oCx6e8vCxFK9mBeYCRe8TTntk2Tm98');

    const handleCopyClick = () => {
        enqueueSnackbar(`Copied!`, { variant: 'success' });
    };

    const [open, setOpen] = React.useState(false);

    const handleCloseDialog = () => {
        setOpen(false);
    };

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (value) => {
        setOpen(false);
    };

    const sendDirectMessage = async () => {
        /*
        const NETWORK_NAME = 'mainnet';

        const members = [
            {publicKey: publicKey, scopes:[true, true]},
            {publicKey: new PublicKey(recipient), scopes:[true, true]}
        ]
        const dialect = await createDialectForMembers(program, publicKey.toBase58(), recipient, [true, true], [false, true]);
        await sendMessage(program, dialect, recipient, messageText)
        */
    };

    const HandleMessageSend = (value) => {
        sendDirectMessage();
    };

    const { t, i18n } = useTranslation();

    return (
        <>
            <Tooltip title={t('Send a message to this address')}>
                <ListItemButton
                    disabled
                    sx={{
                        width: '100%',
                        borderRadius: '25px',
                        p: 1,
                    }}
                    onClick={handleClickOpen}
                >
                    <ListItemIcon>
                        <MessageIcon />
                    </ListItemIcon>
                    <ListItemText primary={`Message`} />
                </ListItemButton>
            </Tooltip>
            <BootstrapDialog
                maxWidth={'lg'}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        background: '#13151C',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                    },
                }}
            >
                <DialogTitle>{t('Send a direct message to') + ' ' + trimAddress(recipient, 4)}</DialogTitle>
                <form onSubmit={HandleMessageSend}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            autoComplete="off"
                            margin="dense"
                            id=""
                            label={t('Start typing your message')}
                            type="text"
                            fullWidth
                            variant="standard"
                            onChange={(e: any) => {
                                setMessageText(e.target.value);
                            }}
                            inputProps={{
                                style: {
                                    textAlign: 'left',
                                    fontSize: '20px',
                                },
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="text"
                            //disabled={((+offer_amount > sol_balance) || (+offer_amount < 0.001) || (+offer_amount < props.highestOffer))}
                            title="Send"
                        >
                            {t('Send')}
                        </Button>
                    </DialogActions>
                </form>
            </BootstrapDialog>
        </>
    );
}
