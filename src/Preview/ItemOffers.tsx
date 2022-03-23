import React, { useCallback } from "react";
import { Link } from "react-router-dom";

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
// @ts-ignore
import fetch from 'node-fetch';

import { TokenAmount } from '../utils/grapeTools/safe-math';
import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import moment from 'moment';

import {
    Typography,
    Grid,
    Box,
    ButtonGroup,
    Skeleton,
    Collapse,
    Table,
    TableHead,
    TableCell,
    TableContainer,
    TableRow,
    InputBase,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';

import MuiAlert, { AlertProps } from '@mui/material/Alert';

import HowToVoteIcon from '@mui/icons-material/HowToVote';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BallotOutlinedIcon from '@mui/icons-material/BallotOutlined';
import SellIcon from '@mui/icons-material/Sell';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';
import CancelIcon from '@mui/icons-material/Cancel';

import HistoryView from './HistoryView';

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletError } from '@solana/wallet-adapter-base';

import { 
    TOKEN_REALM_PROGRAM_ID,
    TOKEN_REALM_ID,
    TOKEN_VERIFICATION_NAME,
    TOKEN_VERIFICATION_AMOUNT,
    TOKEN_VERIFICATION_ADDRESS,
    GRAPE_RPC_ENDPOINT, 
    OTHER_MARKETPLACES, 
    GRAPE_RPC_REFRESH, 
    GRAPE_PREVIEW, 
    GRAPE_PROFILE,
    FEATURED_DAO_ARRAY
} from '../utils/grapeTools/constants';
import { RegexTextField } from '../utils/grapeTools/RegexTextField';
import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling

import {
    AUCTION_HOUSE_PROGRAM_ID,
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    WRAPPED_SOL_MINT,
    TOKEN_PROGRAM_ID,
  } from '../utils/auctionHouse/helpers/constants';
import {
    loadAuctionHouseProgram,
    getAuctionHouseBuyerEscrow,
    getTokenAmount,
    getAuctionHouseTradeState,
    getAtaForMint,
  } from '../utils/auctionHouse/helpers/accounts';

import { cancelOffer } from '../utils/auctionHouse/cancelOffer';
import { withdrawOffer } from '../utils/auctionHouse/withdrawOffer';
import { submitOffer } from '../utils/auctionHouse/submitOffer';
import { acceptOffer } from '../utils/auctionHouse/acceptOffer';
import { cancelListing } from '../utils/auctionHouse/cancelListing';
import { sellNowListing } from '../utils/auctionHouse/sellNowListing';
import { buyNowListing } from '../utils/auctionHouse/buyNowListing';
import { cancelWithdrawOffer } from '../utils/auctionHouse/cancelWithdrawOffer';
import { depositInGrapeVine } from '../utils/auctionHouse/depositInGrapeVine';
import { createDAOProposal } from '../utils/auctionHouse/createDAOProposal';

import "../App.less";

import { BN, web3 } from '@project-serum/anchor';
import { getPriceWithMantissa } from '../utils/auctionHouse/helpers/various';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from "@solana/wallet-adapter-react-ui";

import { useTranslation } from 'react-i18next';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
    ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Search = styled('div')(({ theme }) => ({
    /*
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(1),
      width: 'auto',
    },
    */
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        width: '12ch',
        '&:focus': {
          width: '20ch',
        },
      },
    },
  }));

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
}));

function convertSolVal(sol: any){
    sol = parseFloat(new TokenAmount(sol, 9).format());
    return sol;
}

function formatBlockTime(date: string, epoch: boolean, time: boolean){
    // TODO: make a clickable date to change from epoch, to time from, to UTC, to local date
    let date_str = new Date(date).toLocaleDateString(); //.toUTCString();
    if (time)
        date_str = new Date(date).toLocaleString();
    if (epoch){
        date_str = new Date(+date * 1000).toLocaleDateString(); //.toUTCString();
        if (time)
            date_str = new Date(+date * 1000).toLocaleString(); //.toUTCString();
    }
    return (
        <>{date_str}</>
    );
}

function SellNowVotePrompt(props:any){
    const [open_dialog, setOpenSPDialog] = React.useState(false);
    const [sell_now_amount, setSellNowAmount] = React.useState('');
    const mint = props.mint;  
    const mintOwner = props.mintOwner;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const { publicKey, wallet, sendTransaction } = useWallet();
    const [daoPublicKey, setDaoPublicKey] = React.useState(null);
    const salePrice = props.salePrice || null;
    const weightedScore = props.grapeWeightedScore || 0;
    //const salePrice = React.useState(props.salePrice);

    const handleClickOpenDialog = () => {
        setSellNowAmount('');
        //console.log('SalePrice in handleSellNow:' ,salePrice);
        setOpenSPDialog(true);
    };
    
    const handleCloseDialog = () => {
        setOpenSPDialog(false);
    };

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );

    const { t, i18n } = useTranslation();
    
    async function handleSellNow(event: any) {
        event.preventDefault();
        
        if (+sell_now_amount > 0) {
            handleCloseDialog();
            //const setSellNowPrice = async () => {
            try {
                const transaction = new Transaction();
                const transactionInstr = await sellNowListing(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, daoPublicKey);
                
                const instructionsArray = [transactionInstr.instructions].flat();        
                
                // we need to pass the transactions to realms not to the wallet, and then with the instruction set we pass to the wallet only the ones from realms
                if (daoPublicKey){
                    const transactionInstr2 = await createDAOProposal(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, daoPublicKey, connection, transactionInstr, sendTransaction);
                    //console.log("transactionInstr2: "+JSON.stringify(transactionInstr2));
                    const instructionsArray2 = [transactionInstr2.instructions].flat();
                    //console.log("instructionsArray2: "+ JSON.stringify(instructionsArray2));
                    transaction.add(...instructionsArray2);
                } else {
                    transaction.add(
                        ...instructionsArray
                    );
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD

=======
=======
>>>>>>> parent of 64937b6 (successful multiple instructions to test realm collaboration)
=======
>>>>>>> parent of 64937b6 (successful multiple instructions to test realm collaboration)
=======
>>>>>>> parent of 64937b6 (successful multiple instructions to test realm collaboration)
=======
>>>>>>> parent of 64937b6 (successful multiple instructions to test realm collaboration)
                }
                if (daoPublicKey){
                    enqueueSnackbar(`Preparing to create a Proposal for Listing Price to ${sell_now_amount} SOL`,{ variant: 'info' });
                } else {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 64937b6 (successful multiple instructions to test realm collaboration)
=======
>>>>>>> parent of 64937b6 (successful multiple instructions to test realm collaboration)
=======
>>>>>>> parent of 64937b6 (successful multiple instructions to test realm collaboration)
=======
>>>>>>> parent of 64937b6 (successful multiple instructions to test realm collaboration)
=======
>>>>>>> parent of 64937b6 (successful multiple instructions to test realm collaboration)
                    enqueueSnackbar(`Preparing to set Sell Now Price to ${sell_now_amount} SOL`,{ variant: 'info' });
                }
                const signedTransaction = await sendTransaction(transaction, connection);                    
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                await connection.confirmTransaction(signedTransaction, 'processed');
                closeSnackbar(cnfrmkey);
                const snackaction = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                        {signedTransaction}
                    </Button>
                );
                if (daoPublicKey){
                    enqueueSnackbar(`Proposal Created for Listing Price Set to ${sell_now_amount} SOL`,{ variant: 'success', action:snackaction });
                } else {
                    enqueueSnackbar(`Sell Now Price Set to ${sell_now_amount} SOL`,{ variant: 'success', action:snackaction });

                }
                if (daoPublicKey){
                    enqueueSnackbar(`${t('Preparing to create a Proposal for Listing Price to')} ${sell_now_amount} SOL`,{ variant: 'info' });
                } else {
                    enqueueSnackbar(`${t('Preparing to set Sell Now Price to')} ${sell_now_amount} SOL`,{ variant: 'info' });
                }
                const signedTransaction = await sendTransaction(transaction, connection);                    
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
                await connection.confirmTransaction(signedTransaction, 'processed');
                closeSnackbar(cnfrmkey);
                const snackaction = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                        {signedTransaction}
                    </Button>
                );
                if (daoPublicKey){
                    enqueueSnackbar(`${t('Proposal Created for Listing Price Set to')} ${sell_now_amount} SOL`,{ variant: 'success', action:snackaction });
                } else {
                    enqueueSnackbar(`${t('Sell Now Price Set to')} ${sell_now_amount} SOL`,{ variant: 'success', action:snackaction });
                }
                const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    persist: true,
                });
                setTimeout(function() {
                    closeSnackbar(eskey);
                    props.setRefreshOffers(true);
                }, GRAPE_RPC_REFRESH);
                
            
            } catch(e){
                closeSnackbar();
                enqueueSnackbar(`${e}`,{ variant: 'error' });
                console.log("Error: "+e);
                //console.log("Error: "+JSON.stringify(e));
            } 
        } else{
            console.log("INVALID AMOUNT");
        }
    }

    React.useEffect(() => {
        for (var featured of FEATURED_DAO_ARRAY){
            if (featured.address === mintOwner){
                setDaoPublicKey(featured.address);
            }
        } 
        // static grape test (remove after testing)
        if (mintOwner === 'JAbgQLj9MoJ2Kvie8t8Y6z6as3Epf7rDp87Po3wFwrNK')
            setDaoPublicKey(featured.address);
    },[]);

    return (
        <React.Fragment>
            
            {daoPublicKey ?
               <> 
        
                    <Button 
                        size="large" 
                        variant="outlined" 
                        sx={{
                            borderRadius: '10px',
                        }}
                        value="Sell Now Instructions" onClick={handleClickOpenDialog}>
                        <HowToVoteIcon sx={{mr:1}}/> VOTE TO LIST
                    </Button>            
                    <BootstrapDialog 
                        fullWidth={true}
                        maxWidth={"sm"}
                        open={open_dialog} onClose={handleCloseDialog}
                        PaperProps={{
                            style: {
                                background: '#13151C',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px'
                            }
                        }}
                    >
                        <DialogTitle>
                        {t('PROPOSE A SELL NOW PRICE')}
                        </DialogTitle>
                        <form onSubmit={handleSellNow}>
                        <DialogContent>
                            <RegexTextField
                                regex={/[^0-9]+\.?[^0-9]/gi}
                                autoFocus
                                autoComplete='off'
                                margin="dense"
                                id="preview_sell_now_id"
                                label={t('Set your sale price')}
                                type="text"
                                fullWidth
                                variant="standard"
                                value={sell_now_amount}
                                onChange={(e: any) => {
                                    setSellNowAmount(e.target.value)}
                                }
                                inputProps={{
                                    style: { 
                                        textAlign:'center', 
                                        fontSize: '34px'
                                    }
                                }}
                            />
                            <Grid 
                                container
                                alignContent='flex-end'
                                justifyContent='flex-end'
                            >
                                <Grid item
                                    sx={{textAlign:'right'}}
                                >
                                    <Typography
                                        variant="caption"
                                    >
                                        {t('Price set in SOL')} <SolCurrencyIcon sx={{fontSize:"12px"}} />
                                    </Typography>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>{t('Cancel')}</Button>
                            <Button 
                                type="submit"
                                variant="text" 
                                disabled={+sell_now_amount < 0.001}
                                title="Submit">
                                    {t('SUBMIT')}
                            </Button>
                        </DialogActions>
                        </form>
                    </BootstrapDialog> 
                </>
            :
            <>
                <Grid item>
                    <Tooltip title={t('This NFT is currently owned by a program and may be listed on a marketplace')}>
                        <Button sx={{borderRadius:'10px'}}>
                            <Alert severity="warning" sx={{borderRadius:'10px'}}>
                            {t('LISTED/PROGRAM OWNED NFT')}
                            </Alert>
                        </Button>
                    </Tooltip>
                </Grid>  
            </>
            }  
        </React.Fragment>
    );
}

function SellNowPrompt(props:any){
    const [open_dialog, setOpenSPDialog] = React.useState(false);
    const [sell_now_amount, setSellNowAmount] = React.useState('');
    const mint = props.mint;  
    const mintOwner = props.mintOwner;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const { publicKey, wallet, sendTransaction } = useWallet();
    const salePrice = props.salePrice || null;
    const weightedScore = props.grapeWeightedScore || 0;
    //const salePrice = React.useState(props.salePrice);

    const handleClickOpenDialog = () => {
        setSellNowAmount('');
        //console.log('SalePrice in handleSellNow:' ,salePrice);
        setOpenSPDialog(true);
    };
    
    const handleCloseDialog = () => {
        setOpenSPDialog(false);
    };

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );
    
    async function handleSellNow(event: any) {
        event.preventDefault();
        
        if (+sell_now_amount > 0) {
            handleCloseDialog();
            //const setSellNowPrice = async () => {
            try {
                //START SELL NOW / LIST
                const transactionInstr = await sellNowListing(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, null);
                const instructionsArray = [transactionInstr.instructions].flat();        
                const transaction = new Transaction()
                .add(
                    ...instructionsArray
                );
                enqueueSnackbar(`${t('Preparing to set Sell Now Price to')} ${sell_now_amount} SOL`,{ variant: 'info' });
                const signedTransaction = await sendTransaction(transaction, connection);
                
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
                await ggoconnection.confirmTransaction(signedTransaction, 'processed');
                closeSnackbar(cnfrmkey);
                const snackaction = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                        {signedTransaction}
                    </Button>
                );
                enqueueSnackbar(`${t('Sell Now Price Set to')} ${sell_now_amount} SOL`,{ variant: 'success', action:snackaction });
                
                const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    persist: true,
                });
                setTimeout(function() {
                    closeSnackbar(eskey);
                    props.setRefreshOffers(true);
                }, GRAPE_RPC_REFRESH);
            } catch(e){
                closeSnackbar();
                enqueueSnackbar(`Error: ${e}`,{ variant: 'error' });
                console.log("Error: "+e);
                //console.log("Error: "+JSON.stringify(e));
            } 
        } else{
            console.log("INVALID AMOUNT");
        }
    }

    const { t, i18n } = useTranslation();

    return (
        <React.Fragment>
            <Button 
                size="large" 
                variant="outlined" 
                sx={{
                    borderRadius: '10px',
                }}
                value="Sell Now" onClick={handleClickOpenDialog}>
                <AccountBalanceWalletIcon sx={{mr:1}}/> {t('Sell Now')}
            </Button>            
            <BootstrapDialog 
                fullWidth={true}
                maxWidth={"sm"}
                open={open_dialog} onClose={handleCloseDialog}
                PaperProps={{
                    style: {
                        background: '#13151C',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px'
                    }
                }}
            >
                <DialogTitle>
                    {t('SET SELL NOW PRICE')}
                </DialogTitle>
                <form onSubmit={handleSellNow}>
                <DialogContent>
                    <RegexTextField
                        regex={/[^0-9]+\.?[^0-9]/gi}
                        autoFocus
                        autoComplete='off'
                        margin="dense"
                        id="preview_sell_now_id"
                        label={t('Set your sale price')}
                        type="text"
                        fullWidth
                        variant="standard"
                        value={sell_now_amount}
                        onChange={(e: any) => {
                            setSellNowAmount(e.target.value)}
                        }
                        inputProps={{
                            style: { 
                                textAlign:'center', 
                                fontSize: '34px'
                            }
                        }}
                    />
                    <Grid 
                        container
                        alignContent='flex-end'
                        justifyContent='flex-end'
                    >
                        <Grid item
                            sx={{textAlign:'right'}}
                        >
                            <Typography
                                variant="caption"
                            >
                                {t('Price set in SOL')} <SolCurrencyIcon sx={{fontSize:"12px"}} />
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>{t('Cancel')}</Button>
                    <Button 
                        type="submit"
                        variant="text" 
                        disabled={+sell_now_amount < 0.001}
                        title="Submit">
                            {t('SUBMIT')}
                    </Button>
                </DialogActions>
                </form>
            </BootstrapDialog>   
        </React.Fragment>
    );
}

export function OfferPrompt(props: any) {
    const [open_dialog, setOpenOPDialog] = React.useState(false);
    const [offer_amount, setOfferAmount] = React.useState('');
    //const [sol_balance, setSolBalance] = React.useState(props.solBalance);
    const sol_balance = props.solBalance;  
    const mint = props.mint;  
    const mintOwner = props.mintOwner;  
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const { publicKey, wallet, sendTransaction } = useWallet();

    // using wallet-adapter
    const buyerPublicKey = publicKey;
    
    const handleClickOpenDialog = () => {
        setOfferAmount('');
        setOpenOPDialog(true);
    };
    
    const handleCloseDialog = () => {
        setOpenOPDialog(false);
    };

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );

    const { t, i18n } = useTranslation();

    async function HandleOfferSubmit(event: any) {
        event.preventDefault();
        if (+offer_amount > 0) {
            handleCloseDialog();
            //check the buyerwallet offer balance and that no other pending offer exists
            /*const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
            let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
            const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
            const escrow = (await getAuctionHouseBuyerEscrow(auctionHouseKey, publicKey))[0];
            const balance = await getTokenAmount(anchorProgram,escrow,auctionHouseObj.treasuryMint,);
            if (balance === 0) {    
			*/
			//no need allowing for multiple offers
                try {
                    const transactionInstr = await submitOffer(+offer_amount, mint, publicKey.toString(), mintOwner);
                    const instructionsArray = [transactionInstr.instructions].flat();        
                    const transaction = new Transaction()
                    .add(
                        ...instructionsArray
                    );

                    enqueueSnackbar(`${t('Preparing to make an offer for')} ${+offer_amount} SOL`,{ variant: 'info' });
                    const signedTransaction = await sendTransaction(transaction, connection)
                    const snackprogress = (key:any) => (
                        <CircularProgress sx={{padding:'10px'}} />
                    );
                    const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
                    await ggoconnection.confirmTransaction(signedTransaction, 'processed');
                    closeSnackbar(cnfrmkey);
                    const snackaction = (key:any) => (
                        <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                            {signedTransaction}
                        </Button>
                    );
                    enqueueSnackbar(`${t('Offer sent')} `,{ variant: 'success', action:snackaction });
                    
                    const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                            anchorOrigin: {
                                vertical: 'top',
                                horizontal: 'center',
                            },
                            persist: true,
                        });
                        setTimeout(function() {
                            closeSnackbar(eskey);
                            props.setRefreshOffers(true);
                        }, GRAPE_RPC_REFRESH);
                } catch(e){
                    closeSnackbar();
                    enqueueSnackbar(`Error: ${e}`,{ variant: 'error' });
                    console.log("Error: "+e);
                    //console.log("Error: "+JSON.stringify(e));
                }
            /*}
            else {
                enqueueSnackbar(`To make a new offer you must first cancel the existing offer of ${convertSolVal(balance)} SOL.`,{ variant: 'warning' });
            } */       
        } else{
            console.log("INVALID AMOUNT");
        }
    }
    
    return (

        <React.Fragment>

            <Button 
                size="large" 
                variant="outlined" 
                value="Make Offer" 
                onClick={handleClickOpenDialog}
                sx={{
                    color: '#fff',
                    borderColor: '#fff',
                    borderRadius: '10px',
                }}
            >
                <SellIcon sx={{mr:1}}/> {t('Make offer')}
            </Button> 
            
            <BootstrapDialog 
                fullWidth={true}
                maxWidth={"sm"}
                open={open_dialog} onClose={handleCloseDialog}
                PaperProps={{
                    style: {
                        background: '#13151C',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px'
                    }
                    /*
                    style: {
                        
                        background: 'linear-gradient(to right, #251a3a, #000000)',
                        boxShadow: '3',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderTop: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '20px',
                        padding:'4'
                        },*/
                    }}
                >
                <DialogTitle>
                    {t('MAKE AN OFFER')}
                </DialogTitle>
                <form onSubmit={HandleOfferSubmit}>
                <DialogContent>
                    <RegexTextField
                        regex={/[^0-9]+\.?[^0-9]/gi}
                        //regex={/[^0-9]+\.?[0-9]/gi}
                        //regex={/^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/gi}
                        autoFocus
                        autoComplete='off'
                        margin="dense"
                        id="preview_offer_id"
                        label={t('Set your offer')}
                        type="text"
                        fullWidth
                        variant="standard"
                        value={offer_amount}
                        onChange={(e: any) => {
                            setOfferAmount(e.target.value)}
                        }
                        inputProps={{
                            style: { 
                                textAlign:'center', 
                                fontSize: '34px'
                            }
                        }}
                    />
                    <Grid 
                        container
                        alignContent='flex-end'
                        justifyContent='flex-end'
                    >
                        <Grid item
                            sx={{textAlign:'right'}}
                        >
                            <Typography
                                variant="caption"
                            >
                                {t('Available Balance')}: {sol_balance} <SolCurrencyIcon sx={{fontSize:"10px"}} />
                                <ButtonGroup variant="text" size="small" aria-label="outlined primary button group" sx={{ml:1}}>
                                    <Button 
                                        onClick={() => {
                                            setOfferAmount((String)(sol_balance))}}
                                    > 
                                        {t('Max')}
                                    </Button>
                                    <Button  
                                        onClick={() => {
                                            setOfferAmount((String)(+sol_balance/2))}}
                                    > 
                                        {t('Half')}
                                    </Button>
                                </ButtonGroup>
                                {(props.highestOffer > 0) && (
                                    <>
                                    <br/>{t('Highest Offer')}: 
                                        {(props.highestOffer < sol_balance+0.001) ?
                                            <Button 
                                                onClick={() => {
                                                    setOfferAmount((String)(+props.highestOffer+0.001))}}
                                            > 
                                                {props.highestOffer}
                                            </Button>
                                        : 
                                            <>
                                                {props.highestOffer}
                                            </>
                                        }
                                    </>
                                )}
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        type="submit"
                        variant="text" 
                        disabled={((+offer_amount > sol_balance) || (+offer_amount < 0.001) || (+offer_amount < props.highestOffer))}
                        title="Submit">
                            {t('SUBMIT')}
                    </Button>
                </DialogActions>
                </form>
            </BootstrapDialog>   
        </React.Fragment>
    );

}

export default function ItemOffers(props: any) {
    const [mintAta, setMintAta] = React.useState(props.mintAta);
    const [offers, setOffers] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [open_offers_collapse, setOpenOffersCollapse] = React.useState(false);
    const pubkey = props.pubkey || null;
    const mintOwner = props.mintOwner;
    
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const walletPublicKey = publicKey;
    const mint = props.mint; 
    const [refreshOffers, setRefreshOffers] = React.useState(false);
    const anchorWallet = useAnchorWallet();
    const [alertopen, setAlertOpen] = React.useState(false); 
    const [alertbuynowopen, setAlertBuyNowOpen] = React.useState(false);
    const [final_offeramount, setFinalOfferAmount] = React.useState(null);
    const [final_offerfrom, setFinalOfferFrom] = React.useState(null);
    const [salePrice, setSalePrice] = React.useState(props.salePrice);
    const [saleDate, setSaleDate] = React.useState(null);
    const [saleTimeAgo, setSaleTimeAgo] = React.useState(null);
    const [highestOffer, setHighestOffer] = React.useState(0);
    const [openOffers, setOpenOffers] = React.useState(0);
    const grape_governance_balance = props.grape_governance_balance;
    const grape_offer_threshhold = props.grape_offer_threshhold;
    const grape_member_balance = props.grape_member_balance;
    const grape_whitelisted = props.grape_whitelisted;
    const grape_weighted_score = props.grape_weighted_score;
    const sol_portfolio_balance = props.sol_portfolio_balance;
    
    const handleAlertBuyNowClose = () => {
        setAlertBuyNowOpen(false);
    };
    const handleAlertBuyNowOpen = () => {
        setAlertBuyNowOpen(true);
    };
    const setBuyNowPrompt = () => {
        handleAlertBuyNowOpen();
    }
    
    const handleAlertClickOpen = () => {
        setAlertOpen(true);
    };
    
    const handleAlertClose = () => {
        setAlertOpen(false);
    };
    const handleClick = () => {
        setOpenOffersCollapse(!open_offers_collapse);
    }

    const setAcceptPrompt = (offeramount:any, offerfrom:any) => {
        setFinalOfferAmount(offeramount);
        setFinalOfferFrom(offerfrom);
        handleAlertClickOpen();
    }

    const handleAcceptOffer = async (offerAmount: number, buyerAddress: any) => {
        handleAlertClose();

        try {
            const transactionInstr = await acceptOffer(offerAmount, mint, walletPublicKey, buyerAddress.toString());
            const instructionsArray = [transactionInstr.instructions].flat();  
            const transaction = new Transaction()
            .add(...instructionsArray);

            enqueueSnackbar(`${t('Preparing to accept offer of')}: ${offerAmount} SOL ${t('from')}: ${buyerAddress.toString()}`,{ variant: 'info' });
            const signedTransaction2 = await sendTransaction(transaction, connection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction2, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction2}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction2}
                </Button>
            );
            enqueueSnackbar(`{t('NFT transaction completed')} `,{ variant: 'success', action:snackaction });
            
            const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    persist: true,
                });
            setTimeout(function() {
                closeSnackbar(eskey);
                props.setRefresh(true);
                //props.refreshOffers(true);
                //props.setRefreshOwner(true);
            }, GRAPE_RPC_REFRESH);
                
        } catch(e){
            closeSnackbar();
            enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
        
    }

    const handleCancelListing =  async (salePrice: number) => {
        try {
            //START CANCEL LISTING
            const transactionInstr = await cancelListing(salePrice, mint, walletPublicKey.toString(), mintOwner);
            const instructionsArray = [transactionInstr.instructions].flat();        
            const transaction = new Transaction()
            .add(
                ...instructionsArray
            );

            enqueueSnackbar(`${t('Canceling Sell Now Price for')} ${salePrice} SOL`,{ variant: 'info' });
            const signedTransaction = await sendTransaction(transaction, connection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`${t('Sell Now Price Removed')} `,{ variant: 'success', action:snackaction });
            //END CANCEL LISTING
            
            const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center',
                },
                persist: true,
            });
            setTimeout(function() {
                closeSnackbar(eskey);
                setRefreshOffers(true);
            }, GRAPE_RPC_REFRESH);

        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }

    const handleWithdrawOffer = async (offerAmount: number) => {
        try {
            //const transactionInstr = await withdrawOffer(offerAmount, mint, walletPublicKey.toString(), mintOwner);
            const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, walletPublicKey, mintOwner);
            const instructionsArray = [transactionInstr.instructions].flat();        
            const transaction = new Transaction()
            .add(
                ...instructionsArray
            );


            enqueueSnackbar(`${t('Preparing to withdraw offer for')} ${offerAmount} SOL`,{ variant: 'info' });
            const signedTransaction = await sendTransaction(transaction, connection)
           
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`${t('Offer Withdrawal complete')} `,{ variant: 'success', action:snackaction });
            const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center',
                },
                persist: true,
            });
            setTimeout(function() {
                closeSnackbar(eskey);
                setRefreshOffers(true);
            }, GRAPE_RPC_REFRESH);
            /*console.log('Withdrew', offerAmount, amountAdjusted, 'from your account with Auction House',
                AUCTION_HOUSE_ADDRESS, '. New Balance:', currBal - amountAdjusted,);*/
        } catch(e){
            closeSnackbar();
            enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }

    const handleCancelOffer = async (offerAmount: number) => {
        try {

            //const transactionInstr = await cancelOffer(offerAmount, mint, walletPublicKey, mintOwner);
			const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, walletPublicKey, mintOwner);
            const instructionsArray = [transactionInstr.instructions].flat();        
            const transaction = new Transaction()
            .add(
                ...instructionsArray
            );

            enqueueSnackbar(`${t('Preparing to Cancel Offer for')} ${offerAmount} SOL`,{ variant: 'info' });
            //console.log('TransactionInstr:', TransactionInstr);
            const signedTransaction = await sendTransaction(transaction, connection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`${t('Offer has been cancelled')} `,{ variant: 'success', action:snackaction });
                
            const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
              anchorOrigin: {
                  vertical: 'top',
                  horizontal: 'center',
              },
              persist: true,
            });
            setTimeout(function() {
              closeSnackbar(eskey);
              setRefreshOffers(true);
            }, GRAPE_RPC_REFRESH);

        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }

    //console.log('mintowner: ', mintOwner);
    const GetSignatureOffers = async (spkey: string, until: any, slimit: Number)  => { // made this more generic of a function
        const gslimit = slimit || 25;
        const body = {
          method: "getSignaturesForAddress", // getAccountInfo
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            spkey,
            {
                "limit":gslimit,
                "commitment":"confirmed",
                //"before":beforeSignature,
                //"until":until 
            }
          ],
          "id":1,
        };

        const response = await fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        
        const json = await response.json();
        const resultValues = json.result
        return resultValues;
    };

    const getOffers = async () => {
        const anchorProgram = await loadAuctionHouseProgram(pubkey, ENV_AH, GRAPE_RPC_ENDPOINT);
        const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
        const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
        let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mint)).toBuffer())], auctionHouseKey);
        
        //let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((publicKey).toBuffer())], auctionHouseKey);
        //let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
        
        /*
        console.log("derivedMintPDA: "+derivedMintPDA);
        console.log("derivedBuyerPDA: "+derivedBuyerPDA);
        console.log("derivedOwnerPDA: "+derivedOwnerPDA);
        */

        //console.log("derivedMintPDA: "+derivedMintPDA);
        
        let [result] = await Promise.all([GetSignatureOffers(derivedMintPDA[0].toString(),'', 25)]);
        let offerResults: any[] = [];
		let offerResultsCancelled: any[] = [];
		let exists = false;
        //let salePrice = 0;
        let existSaleCancelAction = 0;
        let cnt = 0;
        let open_offers = 0;
        var forSale = 0;
        var forSaleDate = null;
        var forSaleTimeAgo = null;
        //console.log('derivedMintPDA[0]: '+derivedMintPDA[0].toString());

        if (!loading){
            setLoading(true);
            
            let signatures: any[] = [];
            for (var value of result){
                signatures.push(value.signature);
            }

            const getTransactionAccountInputs2 = await ggoconnection.getParsedTransactions(signatures, 'confirmed');
            setOpenOffers(0);
            for (var value of result){
                if (value.err === null){                   
                    
                    const getTransactionAccountInputs = getTransactionAccountInputs2[cnt];

                    try{
                        //console.log("value: "+JSON.stringify(value));
                        //console.log("gtai ("+getTransactionAccountInputs2.length+"): "+JSON.stringify(getTransactionAccountInputs2[cnt]));
                        
                        if (getTransactionAccountInputs?.transaction && getTransactionAccountInputs?.transaction?.message){
                            let feePayer = new PublicKey(getTransactionAccountInputs?.transaction.message.accountKeys[0].pubkey); // .feePayer.toBase58();
                            let progAddress = getTransactionAccountInputs.meta.logMessages[0];
                            let instructionType = getTransactionAccountInputs.meta.logMessages[1];
                            let allLogMessages = getTransactionAccountInputs.meta.logMessages;

                            //console.log("feePayer: "+feePayer.toBase58());

                            //console.log('getTransactionAccountInputs:', getTransactionAccountInputs);
                            //console.log("escrow: "+JSON.stringify(getTransactionAccountInputs.meta.preTokenBalances));
                            let auctionMint = getTransactionAccountInputs.meta.preTokenBalances[0]?.mint;                        
                            //console.log("escrow: "+JSON.stringify(getTransactionAccountInputs.transaction.feePayer));
                            //if (auctionMint){
                            {    
                                    
                                if ((value) && (value?.memo)){

                                    let memo_arr: any[] = [];
                                    let memo_str = value.memo;
                                    let memo_instances = ((value.memo.match(/{/g)||[]).length);
                                    if (memo_instances > 0) {
                                        // multi memo
                                        let mcnt = 0;
                                        let submemo = memo_str;
                                        //console.log("STR full (instance "+memo_instances+"): "+submemo);
                                        for (var mx=0;mx<memo_instances;mx++){
                                            let init = submemo.indexOf('{');
                                            let fin = submemo.indexOf('}');
                                            memo_str = submemo.substring(init,fin+1); // include brackets
                                            memo_arr.push(memo_str);
                                            submemo = submemo.replace(memo_str, "");
                                            //console.log("pushed ("+mx+"):: "+memo_str + " init: "+init+" fin: "+fin);
                                            //console.log("submemo: "+submemo);
                                        }
                                    } else{
                                        let init = memo_str.indexOf('{');
                                        let fin = memo_str.indexOf('}');
                                        memo_str = memo_str.substring(init,fin+1); // include brackets
                                        memo_arr.push(memo_str);
                                    }
                                    
                                    for (var memo_item of memo_arr){
                                        try{
                                            const memo_json = JSON.parse(memo_item);
                                    
                                            /*
                                            if ((memo_json?.status === 3) || 
                                                (memo_json?.status === 4) ||
                                                (memo_json?.state === 3) ||
                                                (memo_json?.state === 4)){
                                                if ((memo_json?.sellPrice)||(memo_json?.amount)){
                                                    //let sol = parseFloat(new TokenAmount(memo_json?.amount, 9).format());
                                                    //console.log("Sold for: "+sol);
                                                    offerResults.push({buyeraddress: feePayer, offeramount: memo_json?.amount, mint: getTransactionAccountInputs.meta.preTokenBalances[0].mint, isowner: false, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});  
                                                }
                                            }*/

                                            //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+'): ' +memo_str);
                                            if ( feePayer.toBase58() !== mintOwner && progAddress.search(AUCTION_HOUSE_PROGRAM_ID.toBase58())>0 && feePayer != null){
                                                
                                                //console.log("value: "+JSON.stringify(value));
                                                const escrow = ( await getAuctionHouseBuyerEscrow(auctionHouseKey, feePayer,))[0];
                                                let amount_on_escrow = await getTokenAmount(anchorProgram, escrow, auctionHouseObj.treasuryMint,); // total amount on escrow
                                                // we need to now get the amount of the offer
                                                //console.log(amount);
                                                //let amount = await getTokenAmount(anchorProgram, escrow, new PublicKey(auctionMint),);
                                                // we need to filter to find the amount that was offered to the specific mint
                                                
                                                if (amount_on_escrow >= 0) {
                                                //{
                                                    //let [inner_result] = await Promise.all([GetSignatureOffers(mintAta, '')]); // making this call again to get the memos                                       
                                                    exists = false;                   
                                                    {
                                                        try{    
                                                            if ((memo_json?.status === 0)||
                                                                (memo_json?.status === 5) ||
                                                                (memo_json?.state === 0)||
                                                                (memo_json?.state === 5)){ // add to an array to search against other offers and cancel them out
                                                                offerResultsCancelled.push({buyeraddress: feePayer, offeramount: memo_json?.amount, mint: memo_json.mint, isowner: false, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});  
                                                            }
                                                            
                                                            //console.log('memo_json: ' + memo_str);
                                                            
                                                            //if (memo_json.mint === getTransactionAccountInputs.meta.preTokenBalances[0].mint){
                                                            {  
                                                                //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+'): ' +memo_str);

                                                                if ((memo_json?.status === 0) || // withdraw
                                                                    (memo_json?.status === 1) || // offer
                                                                    (memo_json?.status === 2) || // sale
                                                                    (memo_json?.status === 3) || // listing/accept
                                                                    //(memo_json?.status === 4) || // buy now
                                                                    (memo_json?.status === 5) ||
                                                                    (memo_json?.state === 0) || // withdraw
                                                                    (memo_json?.state === 1) || // offer
                                                                    (memo_json?.state === 2) || // sale
                                                                    (memo_json?.state === 3) || // listing/accept
                                                                    //(memo_json?.state === 4) || // buy now
                                                                    (memo_json?.state === 5)){ // cancel
                                                                    
                                                                    //console.log(feePayer.toBase58() + ": "+memo_str);

                                                                    /*if ((memo_json?.amount <= amount_on_escrow)||
                                                                        (memo_json?.offer <= amount_on_escrow)){ //.offer used in beta*/
                                                                        
                                                                        let found = false;
                                                                        //console.log(feePayer+": "+JSON.stringify(memo_str));
                                                                        for (var cancelled of offerResultsCancelled){
                                                                            if ((cancelled.buyeraddress === feePayer.toBase58())&&
                                                                                (cancelled.offeramount === amount_on_escrow)){
                                                                                    found = true;
                                                                            }
                                                                        }
                                                                        
                                                                        if (!found){
                                                                            //if (amount_on_escrow > highestOffer){
                                                                                let sol = parseFloat(new TokenAmount(highestOffer, 9).format());
                                                                                setHighestOffer(sol);
                                                                            //}

                                                                            exists = false;
                                                                            //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_str);
                                                                            for (var i = 0; i < offerResults.length; i++){
                                                                                if ((feePayer.toBase58() === offerResults[i].buyeraddress)){
                                                                                    exists = true;
                                                                                }
                                                                            }
                                                                            
                                                                            if (!exists){
                                                                                if (amount_on_escrow > 0){ // here check if the feePayer is good for the offer
                                                                                    //console.log('PUSH '+memo_json?.state+':: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_str);
                                                                                    
                                                                                    if (memo_json?.state === 1 || memo_json?.status === 1){
                                                                                        open_offers++;
                                                                                    }

                                                                                    if (feePayer.toBase58() === mintOwner)
                                                                                        offerResults.push({buyeraddress: feePayer.toBase58(), offeramount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: true, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});  
                                                                                    else   
                                                                                        offerResults.push({buyeraddress: feePayer.toBase58(), offeramount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});  
                                                                                }
                                                                            }
                                                                        }
                                                                    // }
                                                                }
                                                            }
                                                        }catch(e){console.log("ERR: "+e)}
                                                    }
                                                }
                                            }
                                            //CHECK IF OWNER HAS AN ACTIVE SELL NOW PRICE
                                            if ( feePayer.toBase58() === mintOwner && progAddress.search(AUCTION_HOUSE_PROGRAM_ID.toBase58())>0 && feePayer != null && existSaleCancelAction === 0){
                                                //console.log('PUSH '+memo_json?.state+':: '+feePayer.toBase58() + '('+memo_json?.amount+'): ' +memo_str);
                                                                                    
                                                for (var i = 0; i < offerResults.length; i++){
                                                    if ((feePayer.toBase58() === offerResults[i].buyeraddress)){
                                                        exists = true;
                                                    }
                                                }

                                                if (!exists){
                                                    //console.log(feePayer+": "+JSON.stringify(memo_str)); 
                                                    if ((memo_json?.status === 2) ||
                                                        (memo_json?.state === 2)) {
														//make a final check for seller trade state
                                                            const mintOwnerPK = new PublicKey(mintOwner);
                                                            const mintKey = new PublicKey(mint);
                                                            const tokenAccountKey = (await getAtaForMint(mintKey, mintOwnerPK))[0];
                                                            const tokenSizeAdjusted = new BN(
                                                                await getPriceWithMantissa(
                                                                  1,
                                                                  mintKey,
                                                                  mintOwnerPK, 
                                                                  anchorProgram,
                                                                ),
                                                            );
                                                            let offerAmount = memo_json?.amount || memo_json?.sellPrice;
                                                            //console.log('offerAmount', offerAmount);
                                                            const buyPriceAdjusted = new BN(
                                                                await getPriceWithMantissa(
                                                                  convertSolVal(offerAmount),
                                                                  //@ts-ignore
                                                                  auctionHouseObj.treasuryMint,
                                                                  mintOwnerPK, 
                                                                  anchorProgram,
                                                                ),
                                                            );

                                                            const sellerTradeState = (
                                                                await getAuctionHouseTradeState(
                                                                  auctionHouseKey,
                                                                  mintOwnerPK,
                                                                  tokenAccountKey,
                                                                  //@ts-ignore
                                                                  auctionHouseObj.treasuryMint,
                                                                  mintKey,
                                                                  tokenSizeAdjusted,
                                                                  buyPriceAdjusted,
                                                                )
                                                            )[0];
                                                            const sellerTradeStateInfo = await ggoconnection.getAccountInfo(sellerTradeState);        
                                                            //console.log('sellerTradeStateInfo:', sellerTradeStateInfo);
                                                            if (sellerTradeStateInfo != null){
																forSale = memo_json?.amount || memo_json?.sellPrice;
																forSaleDate = value.blockTime;
															}
                                                        //console.log('Saleprice:', salePrice);
                                                    }
                                                }
                                                existSaleCancelAction = 1;
                                            }
                                        } catch(ert){console.log("ERR: "+ert);}
                                    }
                                }
                            }
                        }
                    }catch(er){console.log("ERR: "+er)}
                    cnt++;
                }
            }

            setOpenOffers(open_offers);
            // sort offers by highest offeramount
            //console.log("offerResults pre: "+JSON.stringify(offerResults));
            offerResults.sort((a,b) => (a.offeramount < b.offeramount) ? 1 : -1);
            //console.log("offerResults post: "+JSON.stringify(offerResults));
            setOffers(
                offerResults
            );
            setSalePrice(
                convertSolVal(forSale)
            );
        
            if (forSaleDate){
                let prettyForSaleDate = moment.unix(+forSaleDate).format("MMMM Do YYYY, h:mm a");
                setSaleDate(
                    prettyForSaleDate
                );
                if (forSaleDate){
                    let timeago = timeAgo(forSaleDate);
                    setSaleTimeAgo(timeago);                                          
                }
            }
            setLoading(false);
        }
    }

    const handleBuyNow =  async (salePrice: number) => {

        const buyerPublicKey = publicKey;
        const sellerWalletKey = new web3.PublicKey(mintOwner);
        handleAlertBuyNowClose();

        try {
            const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
            const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
            const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
            const escrow = (await getAuctionHouseBuyerEscrow(auctionHouseKey, publicKey))[0];
            const amount = await getTokenAmount(anchorProgram,escrow,auctionHouseObj.treasuryMint,);
			const escrowAmount = convertSolVal(amount);
            //if (amount === 0){
                const transactionInstr = await buyNowListing(salePrice, mint, sellerWalletKey.toString(), buyerPublicKey);
                const instructionsArray = [transactionInstr.instructions].flat();        
                const transaction = new Transaction()
                .add(
                    ...instructionsArray
                );
                
                enqueueSnackbar(`${t('Preparing to BUY NOW')}: ${salePrice} SOL ${t('from')}: ${buyerPublicKey.toBase58()}`,{ variant: 'info' });
                //const signedTransaction = await sendTransaction(transaction, connection);
                //await connection.confirmTransaction(signedTransaction, 'processed');
                enqueueSnackbar(`${t('Executing transfer for')}: ${mint.toString()}`,{ variant: 'info' });
                const signedTransaction2 = await sendTransaction(transaction, connection);
                
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
                await ggoconnection.confirmTransaction(signedTransaction2, 'processed');
                closeSnackbar(cnfrmkey);
                const snackaction = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signedTransaction2}`} target='_blank'  sx={{color:'white'}}>
                        {signedTransaction2}
                    </Button>
                );
                enqueueSnackbar(`${t('NFT transaction complete')} `,{ variant: 'success', action:snackaction });
                
                if (escrowAmount > 0){
                    //check the amount to redeposit 
                    let depositAmount = 0;
                    if (escrowAmount > salePrice){
                        depositAmount = salePrice;
                    } else {
                        depositAmount = escrowAmount;
                    }
                    const transactionInstr = await depositInGrapeVine(depositAmount, buyerPublicKey);
                    const instructionsArray = [transactionInstr.instructions].flat();        
                    const transaction = new Transaction()
                    .add(
                        ...instructionsArray
                    );
                    
                    enqueueSnackbar(`${t('Preparing to Deposit amount back in GrapeVine')}: ${depositAmount} SOL ${t('to')}: ${buyerPublicKey.toBase58()}`,{ variant: 'info' });
                    const signedTransaction = await sendTransaction(transaction, connection);
                    
                    const snackprogress = (key:any) => (
                        <CircularProgress sx={{padding:'10px'}} />
                    );
                    const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
                    await ggoconnection.confirmTransaction(signedTransaction, 'processed');
                    closeSnackbar(cnfrmkey);
                    const snackaction = (key:any) => (
                        <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                            {signedTransaction}
                        </Button>
                    );
                    enqueueSnackbar(`${t('Deposit back to GrapeVine completed')}`,{ variant: 'success', action:snackaction });
                }
                const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                        anchorOrigin: {
                            vertical: 'top',
                            horizontal: 'center',
                        },
                        persist: true,
                });
                
                setTimeout(function() {
                    closeSnackbar(eskey);
                    props.setRefresh(true);
                }, GRAPE_RPC_REFRESH);

            /*}
            else {
                enqueueSnackbar(`To BUY NOW you must first cancel the existing offer of ${convertSolVal(amount)} SOL.`,{ variant: 'warning' });
            }*/
        } catch(e){
            closeSnackbar();
            enqueueSnackbar(`Error: ${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }     
    }

    const setSolanaPay = (props: any) => {
        /* // NATIVE SOL
            console.log('2. 🛍 Simulate a customer checkout \n');
            const amount = new BigNumber(20);
            const reference = new Keypair().publicKey;
            const label = 'Jungle Cats store';
            const message = 'Jungle Cats store - your order - #001234';
            const memo = 'JC#4098';
        */

        /* // SPL TOKEN
        console.log('2. 🛍 Simulate a customer checkout \n');
        const amount = new BigNumber(20);
        const reference = new Keypair().publicKey;
        const label = 'Jungle Cats store';
        const message = 'Jungle Cats store - your order - #001234';
        const memo = 'JC#4098';
        const splToken = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)';
        
        */

        /* // CREATE LINK
        console.log('3. 💰 Create a payment request link \n');
        const url = encodeURL({ recipient: MERCHANT_WALLET, amount, reference, label, message, memo, splToken });
        */

        /*// ENCODE TO QR
        
        console.log('3. 💰 Create a payment request link \n');
        const url = encodeURL({ recipient: MERCHANT_WALLET, amount, reference, label, message, memo });

        // encode URL in QR code
        const qrCode = createQR(url);

        */


        /* // ADD QR TO PAGE
        console.log('3. 💰 Create a payment request link \n');
        const url = encodeURL({ recipient: MERCHANT_WALLET, amount, reference, label, message, memo });

        // encode URL in QR code
        const qrCode = createQR(url);

        // get a handle of the element
        const element = document.getElementById('qr-code');

        // append QR code to the element
        qrCode.append(element);
        */

        return 

    }

    const { t, i18n } = useTranslation();

    const ItemTools = (props: any) => {
        
        return (
            <>
            {(OTHER_MARKETPLACES.filter(e => e.address === mintOwner).length > 0) ? (
                <></>
            ):(
                <Box
                    sx={{ 
                        p: 1, 
                        width: '100%',
                        background: '#13151C',
                        borderRadius: '24px',
                        mb: 3
                    }}
                > 
                    <List
                        sx={{ 
                            width: '100%'
                        }}
                        component="nav"
                        >       
                        <ListItemText>
                        
                        
                            <>
                                
                                {publicKey && publicKey.toString() === mintOwner ? (
                                    <Box
                                        sx={{
                                            pl:2,
                                            mb:3
                                        }}
                                    >
                                        <Typography component="div" variant="caption">
                                        {t('Selling now')}: 
                                            
                                            {salePrice <= 0 ? 
                                                <>&nbsp;{t('not listed for sale')}</>
                                            :
                                                <>
                                                {( (saleTimeAgo) ? 
                                                    <small>&nbsp;{t('listed')} {saleTimeAgo}</small>
                                                :
                                                    (saleDate) && <>&nbsp;{t('listed on')} {saleDate}</>
                                                )}
                                                </>
                                            }
                                            <Typography component="div" variant="caption" id="grape-art-last-sale"></Typography>
                                        </Typography>
                                        {( (salePrice > 0) ?
                                            <Typography component="div" variant="h4" sx={{fontWeight:'800'}}>
                                                <strong>{salePrice} <SolCurrencyIcon /></strong>
                                            </Typography>
                                            : <></> 
                                        )}
                                    </Box>
                                ):(
                                    <Box
                                        sx={{
                                            pl:2,
                                            mb:3
                                        }}
                                    >
                                        <Typography component="div" variant="caption">
                                            {t('Buy now')}: 
                                            {salePrice <= 0 ? 
                                                <>&nbsp;{t('not listed for sale')}</>
                                            :
                                                <>
                                                {( (saleTimeAgo) ? 
                                                    <>&nbsp;{t('listed')} {saleTimeAgo}</>
                                                :
                                                    (saleDate) && <>&nbsp;{t('listed on')} {saleDate}</>
                                                )}
                                                </>
                                            }
                                            <Typography component="div" variant="caption" id="grape-art-last-sale"></Typography>
                                        </Typography>
                                        {( (salePrice > 0) ?
                                            <Typography component="div" variant="h4" sx={{fontWeight:'800'}}>
                                                <strong>{salePrice} <SolCurrencyIcon /></strong>
                                            </Typography>
                                            : <></> 
                                        )}
                                    </Box>
                                )}

                                <Grid 
                                    container 
                                    spacing={2}
                                    direction="column"
                                    alignItems="center"
                                    justifyContent="center">
                                    
                                    {publicKey ?
                                        <>
                                        {publicKey.toString() !== mintOwner ? (
                                                <Grid 
                                                container
                                                spacing={2}
                                                alignItems="center"
                                                justifyContent="center">
                                                    <>
                                                                <BootstrapDialog 
                                                                    fullWidth={true}
                                                                    maxWidth={"sm"}
                                                                    PaperProps={{
                                                                        style: {
                                                                            background: '#13151C',
                                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                                                            borderRadius: '20px'
                                                                        }
                                                                    }}
                                                                    open={alertbuynowopen}
                                                                    onClose={handleAlertBuyNowClose}
                                                                    aria-labelledby="alert-bn-dialog-title"
                                                                    aria-describedby="alert-bn-dialog-description"
                                                                    >
                                                                    <DialogTitle id="alert-bn-dialog-title">
                                                                        <Typography>
                                                                            {t('BUY NOW CONFIRMATION')}
                                                                        </Typography>
                                                                    </DialogTitle>
                                                                    <DialogContent>
                                                                        <DialogContentText id="alert-bn-dialog-description">
                                                                        <br />
                                                                        <Alert 
                                                                            severity="info" variant="outlined"
                                                                            sx={{backgroundColor:'black'}}
                                                                            >
                                                                            {t('Amount')}: {salePrice}<SolCurrencyIcon sx={{fontSize:"12px"}} /><br/>
                                                                            {t('Mint')}: <MakeLinkableAddress addr={mint} trim={0} hasextlink={true} hascopy={false} fontsize={16} /> <br/>
                                                                            {t('Owner')}: <MakeLinkableAddress addr={mintOwner} trim={0} hasextlink={true} hascopy={false} fontsize={16} /><br/>
                                                                            <Typography sx={{textAlign:'center'}}>
                                                                            {t('Make sure the above is correct')}<br/>{t('press Accept to proceed')}
                                                                            </Typography>
                                                                        </Alert>
                                                                        
                                                                        </DialogContentText>
                                                                    </DialogContent>
                                                                    <DialogActions>
                                                                        <Button onClick={handleAlertBuyNowClose}>Cancel</Button>
                                                                        <Button 
                                                                            onClick={() => handleBuyNow(salePrice)}
                                                                            autoFocus>
                                                                        {t('Accept')}
                                                                        </Button>
                                                                    </DialogActions>
                                                                </BootstrapDialog>
                                                                
                                                                <Grid item>
                                                                    {( (salePrice > 0) ?
                                                                        <>
                                                                            {/*
                                                                            <Button 
                                                                                size="large" 
                                                                                variant="contained" 
                                                                                value="Use Solana Pay" 
                                                                                onClick={() => setSolanaPay(true)}
                                                                                sx={{
                                                                                    background: 'linear-gradient(268.11deg, #00F0DD 3.12%, #DC1FFF 96.88%)',
                                                                                    borderRadius: '10px',
                                                                                    color: '#fff',
                                                                                    mr:1,
                                                                                }}
                                                                            >
                                                                                <QrCodeIcon />
                                                                            </Button>
                                                                            */}
                                                                            <Button 
                                                                                size="large" 
                                                                                variant="contained" 
                                                                                value="Buy Now" 
                                                                                className="buyNowButton"
                                                                                onClick={() => setAlertBuyNowOpen(true)}
                                                                                sx={{
                                                                                    
                                                                                }}
                                                                            >
                                                                                <AccountBalanceWalletIcon sx={{mr:1}}/> {t('Buy Now')}

                                                                            </Button>
                                                                        </>
                                                                    :<></>)}
                                                                </Grid>

                                                            {((grape_whitelisted > -1) ||
                                                                (grape_member_balance > grape_offer_threshhold)) ? (
                                                                <Grid item>
                                                                    {ValidateCurve(mintOwner) ?
                                                                        <OfferPrompt mint={mint} mintOwner={mintOwner} setRefreshOffers={setRefreshOffers} solBalance={sol_portfolio_balance} highestOffer={highestOffer} />
                                                                    :
                                                                        <SellNowVotePrompt mint={mint} mintOwner={mintOwner} salePrice={salePrice} grapeWeightedScore={grape_weighted_score} RefreshOffers={setRefreshOffers} />
                                                                    }
                                                                </Grid>
                                                            ) : (
                                                                <Grid item>
                                                                    <Tooltip title={`${t('The Marketplace requires')} ${TOKEN_VERIFICATION_AMOUNT} ${TOKEN_VERIFICATION_NAME} ${t('to make an offer')}`}>
                                                                        <Button sx={{borderRadius:'10px'}}>
                                                                            <Alert severity="warning" sx={{borderRadius:'10px'}}>
                                                                            {t('Offers limited to')} {TOKEN_VERIFICATION_NAME} {t('holders')}
                                                                            </Alert>
                                                                        </Button>
                                                                    </Tooltip>
                                                                </Grid>
                                                            )}
                                                    </>
                                                </Grid>
                                        )
                                        :
                                            <Grid 
                                            container
                                            spacing={2}
                                            alignItems="center"
                                            justifyContent="center">
                                                <Grid item>
                                                    
                                                    {( (salePrice > 0) ?
                                                        <>
                                                            <Button 
                                                                size="large" 
                                                                color="error"
                                                                variant='outlined'
                                                                onClick={() => handleCancelListing(salePrice)}
                                                                sx={{
                                                                    borderRadius: '10px',
                                                                }}
                                                            >
                                                                <CancelIcon sx={{mr:1}}/> {t('Cancel Listing')}
                                                            </Button>   
                                                        </>
                                                        : 
                                                        <>
                                                            <SellNowPrompt mint={mint} mintOwner={mintOwner} salePrice={salePrice} grapeWeightedScore={grape_weighted_score} RefreshOffers={setRefreshOffers} />
                                                        </>
                                                    )}
                                                </Grid>
                                            </Grid>
                                        }
                                        </>
                                    :(
                                        <Grid
                                            container
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                            <Grid item>
                                            <WalletConnectButton />
                                            </Grid>
                                        </Grid>
                                    )
                                    }
                                </Grid>
                            </>
                        </ListItemText>
                    </List>
                </Box>
            )}
            </>
        );
    }   

    React.useEffect(() => {
        if (refreshOffers){
            //setOffers(null);
            setRefreshOffers(!refreshOffers);
        }

        if (mintAta){
            //if (!offers){
                getOffers();
            //}
        }
    }, [mintAta, refreshOffers]);

    if ((!offers)||(loading)){
        return (
            <Box
                sx={{ 
                    p: 1, 
                    mb: 3, 
                    width: '100%',
                    background: '#13151C',
                    borderRadius: '24px'
                }}
            > 
                <Skeleton
                    sx={{ 
                        height: '100%',
                        width: '100%'
                    }}
                />
            </Box>
        )
    } else{      
        return ( 
            <>
                <ItemTools />
                <Box
                    sx={{ 
                        p: 1, 
                        mb: 3, 
                        width: '100%',
                        background: '#13151C',
                        borderRadius: '24px'
                    }}
                > 
                    <ListItemButton onClick={handleClick}
                        sx={{borderRadius:'20px'}}
                    >
                        <ListItemIcon>
                        <BallotOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText 
                            primary={t('Offers')}
                        />
                            <Typography variant="caption"><strong>{openOffers}</strong></Typography>
                            {open_offers_collapse ? <ExpandLess /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={open_offers_collapse} timeout="auto" unmountOnExit>
                        <List component="div" 
                            sx={{ 
                                width: '100%',
                            }}>
                            <ListItemText>
                                <Box sx={{ margin: 1 }}>
                                    {/*<div style={{width: 'auto', overflowX: 'scroll'}}>*/}
                                    <TableContainer>
                                        <Table size="small" aria-label="purchases">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><Typography variant="caption">{t('Address')}</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">{t('Offer')}</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">{t('Date')}</Typography></TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <BootstrapDialog 
                                                fullWidth={true}
                                                maxWidth={"sm"}
                                                PaperProps={{
                                                    style: {
                                                        background: '#13151C',
                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                        borderTop: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '20px'
                                                    }
                                                    /*
                                                    style: {
                                                        
                                                        background: 'linear-gradient(to right, #251a3a, #000000)',
                                                        boxShadow: '3',
                                                        border: '1px solid rgba(255,255,255,0.15)',
                                                        borderTop: '1px solid rgba(255,255,255,0.3)',
                                                        borderRadius: '20px',
                                                        padding:'4'
                                                        },*/
                                                    }}
                                                
                                                    open={alertopen}
                                                    onClose={handleAlertClose}
                                                    aria-labelledby="alert-dialog-title"
                                                    aria-describedby="alert-dialog-description"
                                                    >
                                                    <DialogTitle id="alert-dialog-title">
                                                        <Typography>
                                                            {t('CONFIRMATION')}
                                                        </Typography>
                                                    </DialogTitle>
                                                    <DialogContent>
                                                        <DialogContentText id="alert-dialog-description">
                                                        <br />
                                                        <Alert severity="info" variant="outlined" sx={{backgroundColor:'black'}} >
                                                            {t('Amount')}: {final_offeramount}<SolCurrencyIcon sx={{fontSize:"12px"}} /><br/>
                                                            {t('Mint')}: <MakeLinkableAddress addr={mint} trim={0} hasextlink={true} hascopy={false} fontsize={16} /> <br/>
                                                            {t('From')}: <MakeLinkableAddress addr={final_offerfrom} trim={0} hasextlink={true} hascopy={false} fontsize={16} /><br/>
                                                            <Typography sx={{textAlign:'center'}}>
                                                            {t('Make sure the above is correct')}<br/>{t('press Accept to proceed')}
                                                            </Typography><br/>
                                                        </Alert>
                                                        
                                                        </DialogContentText>
                                                    </DialogContent>
                                                    <DialogActions>
                                                        <Button onClick={handleAlertClose}>{t('Cancel')}</Button>
                                                        <Button 
                                                            onClick={() => handleAcceptOffer(final_offeramount, final_offerfrom)}
                                                            autoFocus>
                                                        {t('Accept')}
                                                        </Button>
                                                    </DialogActions>
                                                </BootstrapDialog>

                                            {offers && offers.map((item: any) => (
                                                <>

                                                    {(item.state === 1) ? (
                                                        <TableRow>
                                                            <TableCell><Typography variant="body2">
                                                                <Tooltip title={t('View Profile')}>
                                                                    <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item.buyeraddress}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                        {trimAddress(item.buyeraddress,4)}
                                                                    </Button>
                                                                </Tooltip>
                                                                <Tooltip title={t('Visit Explorer')}>
                                                                    <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/address/${item.buyeraddress}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                        <OpenInNewIcon sx={{fontSize:'14px'}} />
                                                                    </Button>
                                                                </Tooltip>
                                                            </Typography></TableCell>
                                                            <TableCell  align="right">
                                                                <Typography variant="body2">
                                                                    {convertSolVal(item.offeramount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Typography variant="caption">
                                                                    <Tooltip
                                                                        title={formatBlockTime(item.timestamp, true, true)}
                                                                    >
                                                                        <Button size="small">{timeAgo(item.timestamp)}</Button>
                                                                    </Tooltip>
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                            
                                                            <>
                                                                {publicKey && publicKey.toBase58() === mintOwner && (
                                                                    <div>
                                                                    <Button
                                                                        onClick={() => setAcceptPrompt(convertSolVal(item.offeramount), item.buyeraddress)} //acceptOfferWrapper(convertSolVal(item.offeramount), item.buyeraddress)} //handleAcceptOffer(convertSolVal(item.offeramount), item.buyeraddress)}
                                                                        className='buyNowButton'
                                                                        sx={{
                                                                        }}
                                                                    >
                                                                        {t('ACCEPT')}
                                                                    </Button>
                                                                </div>
                                                                )}
                                                                
                                                                {publicKey && publicKey.toBase58() === item.buyeraddress && (
                                                                    <Button 
                                                                        color="error"
                                                                        variant="text"
                                                                        //onClick={() => handleWithdrawOffer(convertSolVal(item.offeramount))}
                                                                        onClick={() => handleCancelOffer(convertSolVal(item.offeramount))}
                                                                        sx={{
                                                                            borderRadius: '10px',
                                                                        }}
                                                                    >
                                                                        <CancelIcon />
                                                                    </Button>
                                                                )}
                                                            </>
                                                            
                                                            </TableCell>
                                                        </TableRow>
                                                    ):(<></>)}
                                                </>
                                            ))}
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </ListItemText>
                        </List>
                    </Collapse>
                </Box>
                {mint &&
                    <></>
                    /*
                    <HistoryView mint={mint} />
                    */

                }
            </>
        )
    }
}