import React, { useCallback } from "react";
import { Link } from "react-router-dom";

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
// @ts-ignore
//import fetch from 'node-fetch';

import { TokenAmount } from '../utils/grapeTools/safe-math';
import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import moment from 'moment';

import { unicastGrapeSolflareMessage } from "../utils/walletNotifications/walletNotifications";

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
    GRAPE_COLLECTIONS_DATA,
    GRAPE_RPC_ENDPOINT, 
    OTHER_MARKETPLACES, 
    GRAPE_RPC_REFRESH, 
    GRAPE_PREVIEW, 
    GRAPE_PROFILE,
    FEATURED_DAO_ARRAY,
    VERIFIED_DAO_ARRAY,
} from '../utils/grapeTools/constants';

import {  
    getReceiptsFromAuctionHouse,
    getMintFromVerifiedMetadata } from '../utils/grapeTools/helpers';

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
    getMetadata,
  } from '../utils/auctionHouse/helpers/accounts';

import { cancelOffer } from '../utils/auctionHouse/cancelOffer';
import { submitOffer } from '../utils/auctionHouse/submitOffer';
import { acceptOffer } from '../utils/auctionHouse/acceptOffer';
import { cancelListing } from '../utils/auctionHouse/cancelListing';
import { sellNowListing } from '../utils/auctionHouse/sellNowListing';
import { buyNowListing } from '../utils/auctionHouse/buyNowListing';
//import { withdrawOffer } from '../utils/auctionHouse/withdrawOffer';
import { gah_makeOffer } from '../utils/auctionHouse/gah_makeOffer';
import { gah_cancelOffer } from '../utils/auctionHouse/gah_cancelOffer';
import { gah_acceptOffer } from '../utils/auctionHouse/gah_acceptOffer';
import { gah_makeListing } from '../utils/auctionHouse/gah_makeListing';
import { gah_sellListing } from '../utils/auctionHouse/gah_sellListing';
import { gah_cancelListing } from '../utils/auctionHouse/gah_cancelListing';
import { cancelWithdrawOffer } from '../utils/auctionHouse/cancelWithdrawOffer';
import { depositInGrapeVine } from '../utils/auctionHouse/depositInGrapeVine';
import { voteSell } from '../utils/auctionHouse/voteSell';
import { voteListing } from '../utils/auctionHouse/voteListing';
import { voteOffer } from '../utils/auctionHouse/voteOffer';
import { createProposal } from '../utils/auctionHouse/createProposal';

import "../App.less";

import { BN, web3 } from '@project-serum/anchor';
import { getPriceWithMantissa } from '../utils/auctionHouse/helpers/various';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
//import { WalletConnectButton } from "@solana/wallet-adapter-react-ui";
import { WalletConnectButton } from "@solana/wallet-adapter-material-ui";
import  useWalletStore  from '../utils/governanceTools/useWalletStore';
import { sendTransactions } from "../utils/governanceTools/sendTransactions";
import { InstructionsAndSignersSet } from "../utils/auctionHouse/helpers/types";
import { useTranslation } from 'react-i18next';
import GrapeIcon from "../components/static/GrapeIcon";

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

function ValidateDAO(mintOwner: string){
    for (var featured of FEATURED_DAO_ARRAY){
        if (featured.address === mintOwner){
            return true;
        }
    } 
    for (var verified of VERIFIED_DAO_ARRAY){
        //if (verified.address === mintOwner){
        if (verified.solTreasury === mintOwner){
            return true;
        }
    } 
    return false;
}

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
    const updateAuthority = props.updateAuthority;  
    const mintOwner = props.mintOwner;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const { publicKey, wallet, sendTransaction } = useWallet();
	const anchorWallet = useAnchorWallet();
    const [daoPublicKey, setDaoPublicKey] = React.useState(null);
    const salePrice = props.salePrice || null;
    const weightedScore = props.grapeWeightedScore || 0;
    const collectionAuctionHouse = props.collectionAuctionHouse || null; 
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
                if (daoPublicKey){
                    //voteListing2
                    const daoTransactionInstr = await voteListing(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, daoPublicKey, updateAuthority, collectionAuctionHouse);
                    //params from original voteListing
                    //const daoTransactionInstr = await voteListing(+sell_now_amount, mint, daoPublicKey.toString(), publicKey);
                    console.log('transactionInstr' +JSON.stringify(daoTransactionInstr));
                    /*const instructionsArray = [daoTransactionInstr.instructions].flat();            
                    transaction.add(
                        ...instructionsArray
                    );*/
                    //console.log(daoTransactionInstr);
                    //console.log(daoTransactionInstr.instructions[1].data.buffer.toString());
                    //console.log(Utf8ArrayToStr(daoTransactionInstr.instructions[1].data));
                    const proposalPk = await createProposal(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, daoPublicKey, connection, daoTransactionInstr, sendTransaction, anchorWallet, 2, updateAuthority, collectionAuctionHouse);

                    if (proposalPk){
                        enqueueSnackbar(`Proposal: ${proposalPk} created for accepting Listing Price Set to ${sell_now_amount} SOL`,{ variant: 'success' });
                    }
                } else {
                    //const transactionInstr = await sellNowListing(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, daoPublicKey, updateAuthority, collectionAuctionHouse);
                    const transactionInstr = await gah_makeListing(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, daoPublicKey, updateAuthority, collectionAuctionHouse);
                    const instructionsArray = [transactionInstr.instructions].flat();            
                    transaction.add(
                        ...instructionsArray
                    );     
                    enqueueSnackbar(`Preparing to set Sell Now Price to ${sell_now_amount} SOL`,{ variant: 'info' });
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
                    enqueueSnackbar(`Sell Now Price Set to ${sell_now_amount} SOL`,{ variant: 'success', action:snackaction });      
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
        for (var verified of VERIFIED_DAO_ARRAY){
            //if (verified.address === mintOwner){
             if (verified.solTreasury == mintOwner){
                setDaoPublicKey(verified.address);
            }
        } 
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
    const updateAuthority = props.updateAuthority;
    const mintOwner = props.mintOwner;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const { publicKey, wallet, sendTransaction } = useWallet();
    const salePrice = props.salePrice || null;
    const weightedScore = props.grapeWeightedScore || 0;
    const collectionAuctionHouse = props.collectionAuctionHouse || null;
    //const salePrice = React.useState(props.salePrice);

    const handleClickOpenDialog = () => {
        setSellNowAmount('');
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
                //const transactionInstr = await sellNowListing(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, null, updateAuthority, collectionAuctionHouse);
                const transactionInstr = await gah_makeListing(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, null, updateAuthority, collectionAuctionHouse);
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
                enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
                //enqueueSnackbar(`Error: ${e}`,{ variant: 'error' });
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
    const offers = props.offers || null;
    //const [sol_balance, setSolBalance] = React.useState(props.solBalance);
    const sol_balance = props.solBalance;  
    const name = props.mintName;  
    const mint = props.mint;  
    const image = props.image;
    const mintOwner = props.mintOwner;
    const updateAuthority = props.updateAuthority; 
    const collectionAuctionHouse = props.collectionAuctionHouse;  
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
        console.log("collectionAuctionHouse: "+collectionAuctionHouse)
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
                    //const transactionInstr = await submitOffer(+offer_amount, mint, publicKey.toString(), mintOwner, updateAuthority, collectionAuctionHouse);
                    //console.log("transactionInstr1 submitOffer: "+JSON.stringify(transactionInstr1));
                    
                    const transactionInstr = await gah_makeOffer(+offer_amount, mint, publicKey.toString(), mintOwner, updateAuthority, collectionAuctionHouse);
                    //console.log("transactionInstr makeOffer: "+JSON.stringify(transactionInstr));
    
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
                    
                    //(title:string,message:string,image:string,publicKey:string,actionUrl:string)
                    
                    //unicastGrapeSolflareMessage('Offer Received', offer_amount+' SOL offer made for '+mint+' on grape.art', image, publicKey.toBase58(), `${GRAPE_PREVIEW}${mint}`);
                    //unicastGrapeSolflareMessage('Offer Received', offer_amount+' SOL offer made for '+mint+' on grape.art', image, publicKey.toBase58(), `${GRAPE_PREVIEW}${mint}`);
                    
                    // check if outbid
                    let highest_offer = 0;
                    let highest_offer_pk = null;
                    let previous_offer_pk = null;
                    let offcnt = 0;
                    if (offers){
                        //console.log("Offers:"+offers.length);
                        offers.sort((a:any,b:any) => (a.offeramount < b.offeramount) ? 1 : -1);
                        offcnt = offers?.length || 1;
                        if (offcnt > 1){
                            previous_offer_pk = offers[1].buyeraddress;
                        }
                        
                        /*
                        for (var offer of offers){
                            console.log(offer.offeramount + " - " + offer.buyeraddress + " :: "+(offer?.state));
                            //if (offer.state === )
                            if ((offcnt >= 1)){//&&(offer?.state === 1)){
                                previous_offer_pk = offer.buyeraddress;
                                console.log("previous offer: "+previous_offer_pk)
                            }
                            offcnt++;
                        } */
                    }

                    console.log("offcnt: "+offcnt);
                    if ((previous_offer_pk)&&(offcnt > 0)){
                        console.log(previous_offer_pk+' you have been outbid');
                        unicastGrapeSolflareMessage(`Outbid Notice ${name}`, 'You have been outbid on grape.art', image, previous_offer_pk, `https://grape.art${GRAPE_PREVIEW}${mint}`, signedTransaction, collectionAuctionHouse);
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
                    enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
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
                        disabled={((+offer_amount > sol_balance) || (+offer_amount < 0.001) || (+offer_amount <= props.highestOffer))}
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
    const mintName = props.mintName;
    const updateAuthority = props.updateAuthority;
    const collectionAuctionHouse = props.collectionAuctionHouse;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const walletPublicKey = publicKey;
    const mint = props.mint; 
    const image = props.image;
    const [refreshOffers, setRefreshOffers] = React.useState(false);
    const anchorWallet = useAnchorWallet();
    const [alertopen, setAlertOpen] = React.useState(false); 
    const [alertbuynowopen, setAlertBuyNowOpen] = React.useState(false);
    const [final_offeramount, setFinalOfferAmount] = React.useState(null);
    const [tradeState, setTradeState] = React.useState(null);
    const [final_offerfrom, setFinalOfferFrom] = React.useState(null);
    const [salePrice, setSalePrice] = React.useState(props.salePrice);
    const [saleDate, setSaleDate] = React.useState(null);
    const [saleTimeAgo, setSaleTimeAgo] = React.useState(null);
    const [highestOffer, setHighestOffer] = React.useState(0);
    const [openOffers, setOpenOffers] = React.useState(0);
    const [verifiedCollection, setVerifiedCollection] = React.useState(null);
    const [verifiedCollectionLoaded, setVerifiedCollectionLoaded] = React.useState(false);
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

    const setAcceptPrompt = (offeramount:any, offerfrom:any, tradeState: PublicKey) => {
        setTradeState(tradeState)
        setFinalOfferAmount(offeramount);
        setFinalOfferFrom(offerfrom);
        handleAlertClickOpen();
    }

    const handleAcceptOffer = async (offerAmount: number, buyerAddress: any, tradeState: PublicKey) => {
        handleAlertClose();
        
        try {
            const transaction = new Transaction();
            
            if (!ValidateDAO(mintOwner)) {
                //const transactionInstr = await acceptOffer(offerAmount, mint, walletPublicKey, buyerAddress.toString(), updateAuthority, collectionAuctionHouse);
                const transactionInstr = await gah_acceptOffer(offerAmount, mint, walletPublicKey, buyerAddress.toString(), updateAuthority, collectionAuctionHouse, tradeState);
                const instructionsArray = [transactionInstr.instructions].flat();  
                transaction.add(
                    ...instructionsArray
                );  
                
                enqueueSnackbar(`${t('Preparing to accept offer of')}: ${offerAmount} SOL ${t('from')}: ${buyerAddress.toString()}`,{ variant: 'info' });
                const signedTransaction2 = await sendTransaction(transaction, connection);
                    
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
                const latestBlockHash = await connection.getLatestBlockhash();
                await ggoconnection.confirmTransaction({
                    blockhash: latestBlockHash.blockhash,
                    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                    signature: signedTransaction2}, 
                    'processed'
                );
                closeSnackbar(cnfrmkey);
                const snackaction = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signedTransaction2}`} target='_blank'  sx={{color:'white'}}>
                        {signedTransaction2}
                    </Button>
                );
                enqueueSnackbar(`${t('NFT transaction completed')} `,{ variant: 'success', action:snackaction });
            } else {
                //set instruction to sell state before sending proposal to realm
                const transactionInstrSell = await voteSell(+offerAmount, mint, publicKey.toString(), mintOwner, mintOwner.toString(), updateAuthority);
                const instructionsArray = [transactionInstrSell.instructions].flat();            
                transaction.add(
                    ...instructionsArray
                ); 
                enqueueSnackbar(`Preparing to create proposal to vote on for ${offerAmount} SOL`,{ variant: 'info' });
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
                enqueueSnackbar(`Offer state changed. Proceed to acccept proposal creation`,{ variant: 'success', action:snackaction });               

                const transactionInstr = await voteOffer(+offerAmount, mint, mintOwner.toString(), buyerAddress.toString(), publicKey.toString(), updateAuthority);
                console.log('transactionInstr' +JSON.stringify(transactionInstr));
                //transactionInstr.add(feePayer: COLLABORATION_SOL_TREASURY);
                const proposalPk = await createProposal(+offerAmount, mint, publicKey.toString(), mintOwner, 0, mintOwner.toString(), connection, transactionInstr, sendTransaction, anchorWallet, 1, updateAuthority, collectionAuctionHouse);
                //const proposalPk = await createProposal(+offerAmount, mint, publicKey.toString(), mintOwner, 0, mintOwner.toString(), ggoconnection, transactionInstr, sendTransaction, anchorWallet, 1);
                if (proposalPk){
                    enqueueSnackbar(`Proposal: ${proposalPk} created and offer for ${offerAmount} SOL will be voted if to be accepted.`,{ variant: 'success' });
                }
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
                try{
                    props.setRefresh(true);
                }catch(err){console.log("ERR: "+err)}
                //props.refreshOffers(true);
                //props.setRefreshOwner(true);
            }, GRAPE_RPC_REFRESH);
                
        } catch(e){
            closeSnackbar();
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
        
    }

    const handleCancelListing =  async (salePrice: number) => {
        try {
            //START CANCEL LISTING
            //const transactionInstr = await cancelListing(salePrice, mint, walletPublicKey.toString(), mintOwner, updateAuthority, collectionAuctionHouse);
            const transactionInstr = await gah_cancelListing(salePrice, mint, walletPublicKey.toString(), mintOwner, null, null, updateAuthority, collectionAuctionHouse);
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
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            //enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }

    const handleWithdrawOffer = async (offerAmount: number) => {
        try {
            //const transactionInstr = await withdrawOffer(offerAmount, mint, walletPublicKey.toString(), mintOwner, updateAuthority);
            
            //const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, walletPublicKey, mintOwner, updateAuthority, collectionAuctionHouse);
            const transactionInstr = await gah_cancelOffer(offerAmount, mint, walletPublicKey, mintOwner, updateAuthority, collectionAuctionHouse);
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
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            //enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }

    const handleCancelOffer = async (offerAmount: number) => {
        try {
            console.log("with updateAuthority/collectionAuctionHouse: "+updateAuthority+" / "+collectionAuctionHouse);
            //const transactionInstr = await cancelOffer(offerAmount, mint, walletPublicKey, mintOwner, updateAuthority, collectionAuctionHouse);
			const transactionInstr = await gah_cancelOffer(offerAmount, mint, walletPublicKey, mintOwner, updateAuthority, collectionAuctionHouse);
            //const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, walletPublicKey, mintOwner, updateAuthority, collectionAuctionHouse);
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
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            //enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
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

        const response = await window.fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        
        const json = await response.json();
        const resultValues = json.result
        return resultValues;
    };
    
    const getOffers = async () => {
        
        
        try {
            //getMetadata
            if (!openOffers){
                //console.log("with aH: "+ collectionAuthority.auctionHouse+" - "+JSON.stringify(collectionAuthority))
                const results = await getReceiptsFromAuctionHouse(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS, null, mint, 'bid_receipt');
                // we need to get listing_receipt too to show the latest price listed, do in two calls or in one with a filter????

                const open_offers = 0;
                let allResults: any[] = [];
                let offerResults: any[] = [];

                for (var item of results){
                    const mintitem = await getMintFromVerifiedMetadata(item.metadata.toBase58(), null);
                    console.log("item: "+JSON.stringify(item));
                    // check if bid_receipt is for offers only
                    allResults.push({buyeraddress: item.bookkeeper.toBase58(), bookkeeper: item.bookkeeper.toBase58(), amount: item.price, price: item.price, mint: mintitem?.address || mint, metadataParsed:mintitem, isowner: false, createdAt: item.createdAt, cancelledAt: item.canceledAt, timestamp: item.createdAt, blockTime: item.createdAt, state: item?.receipt_type, tradeState: item.tradeState});
                }

                // sort by date
                allResults.sort((a:any,b:any) => (a.blockTime > b.blockTime) ? 1 : -1);

                //activityResults.push({buyeraddress: feePayer.toBase58(), amount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: forSaleDate, blockTime: value.blockTime, state: memo_json?.state || memo_json?.status});
                //return activityResults;

                
                // now show with filtering offerResults
                let forSale = 0;
                let forSaleDate = null;
                let bid_count = 0;
                let listing_count = 0;
                let highest_offer = 0;
                let isCancelled = false;

                for (var offer of allResults){
                    if (!offer?.cancelledAt){
                        listing_count++
                        if (offer.state === 'listing_receipt'){ // exit on first receipt
                            if (forSaleDate > offer.blockTime){
                                console.log("checking: "+offer.bookkeeper+" vs "+mintOwner)
                                if (offer.bookkeeper === mintOwner){
                                    forSale = offer.price;
                                    forSaleDate = offer.blockTime;
                                }
                            }
                        } else if (offer.state === 'cancel_listing_receipt'){ // exit on first receipt
                            isCancelled = true;
                            break;
                        }
                    }
                }

                if (forSale){
                    // check here if this is actually still for sale...

                }

                for (var offer of allResults){
                    if (!offer?.cancelledAt){
                        if (offer.state === 'bid_receipt'){ // exit on first receipt
                            bid_count++
                            offerResults.push(offer);
                            if (highest_offer < offer.price)
                                highest_offer = offer.price;
                        }
                    }
                }                

                setHighestOffer(highest_offer);
                setOpenOffers(bid_count);
                // sort offers by highest offeramount
                //console.log("offerResults pre: "+JSON.stringify(offerResults));
                offerResults.sort((a,b) => (a.offeramount < b.offeramount) ? 1 : -1);
                //console.log("offerResults post: "+JSON.stringify(offerResults));
                setOffers(
                    offerResults
                );
                setSalePrice(
                    forSale
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

            }
            
            return null;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
        
    }

    const handleBuyNow =  async (salePrice: number, collectionAuctionHouse: string) => {

        const buyerPublicKey = publicKey;
        const sellerWalletKey = new web3.PublicKey(mintOwner);
        handleAlertBuyNowClose();

        try {
            const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
            const auctionHouseKey = new web3.PublicKey(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS);
            const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
            const escrow = (await getAuctionHouseBuyerEscrow(auctionHouseKey, publicKey))[0];
            const amount = await getTokenAmount(anchorProgram,escrow,auctionHouseObj.treasuryMint,);
			const escrowAmount = convertSolVal(amount);
            //if (amount === 0){
                //const transactionInstr = await buyNowListing(salePrice, mint, sellerWalletKey.toString(), buyerPublicKey, updateAuthority, auctionHouseKey.toBase58());
                const transactionInstr = await gah_sellListing(salePrice, mint, buyerPublicKey.toBase58(), sellerWalletKey.toBase58(), null, null, updateAuthority, auctionHouseKey.toBase58());
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
                    try{
                        props.setRefresh(true);
                    }catch(err){console.log("ERR: "+err);}
                }, GRAPE_RPC_REFRESH);

            /*}
            else {
                enqueueSnackbar(`To BUY NOW you must first cancel the existing offer of ${convertSolVal(amount)} SOL.`,{ variant: 'warning' });
            }*/
        } catch(e){
            closeSnackbar();
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            //enqueueSnackbar(`Error: ${e}`,{ variant: 'error' });
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
        const [collection, setCollection] = React.useState(null);
        const collectionAuctionHouse = props.collectionAuctionHouse;

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
                                                                                onClick={() => handleBuyNow(salePrice, collectionAuctionHouse)}
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
                                                                        <>
                                                                        {!ValidateCurve(mintOwner) && salePrice <= 0 &&
                                                                            <Grid item>
                                                                                <SellNowVotePrompt mint={mint} updateAuthority={updateAuthority} mintOwner={mintOwner} salePrice={salePrice} grapeWeightedScore={grape_weighted_score} RefreshOffers={setRefreshOffers} collectionAuctionHouse={collectionAuctionHouse} />
                                                                            </Grid>
                                                                        }
                                                                        
                                                                        {(ValidateCurve(mintOwner) || (ValidateDAO(mintOwner))) && (
                                                                            <Grid item>
                                                                                <OfferPrompt mintName={mintName} mint={mint} updateAuthority={updateAuthority} image={image} mintOwner={mintOwner} setRefreshOffers={setRefreshOffers} solBalance={sol_portfolio_balance} highestOffer={highestOffer} offers={offers} collectionAuctionHouse={collectionAuctionHouse} />
                                                                            </Grid>
                                                                        )}
                                                                        </>
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
                                                                <SellNowPrompt mint={mint} updateAuthority={updateAuthority} mintOwner={mintOwner} salePrice={salePrice} grapeWeightedScore={grape_weighted_score} RefreshOffers={setRefreshOffers} collectionAuctionHouse={collectionAuctionHouse} />
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
            if (!offers){
                getOffers();
            }
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
                <ItemTools collectionAuctionHouse={collectionAuctionHouse} />
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
                                                            onClick={() => handleAcceptOffer(final_offeramount, final_offerfrom, tradeState)}
                                                            autoFocus>
                                                        {t('Accept')}
                                                        </Button>
                                                    </DialogActions>
                                                </BootstrapDialog>

                                            {offers && offers.map((item: any) => (
                                                <>
                                                    {(item.state === 'bid_receipt') ? (
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
                                                                    {(item.price)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
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
                                                                {(ValidateDAO(mintOwner)) ? (
                                                                    
                                                                    <>
                                                                        {publicKey && publicKey.toBase58() === item.buyeraddress ? (
                                                                            <Button 
                                                                                color="error"
                                                                                variant="text"
                                                                                //onClick={() => handleWithdrawOffer(convertSolVal(item.offeramount))}
                                                                                onClick={() => handleCancelOffer((item.price))}
                                                                                sx={{
                                                                                    borderRadius: '10px',
                                                                                }}
                                                                            >
                                                                                <CancelIcon />
                                                                            </Button>
                                                                        ):(
                                                                            <>
                                                                                <Tooltip
                                                                                    title='Vote to accept'
                                                                                >
                                                                                    <Button
                                                                                        //onClick={() => setAcceptPrompt(convertSolVal(item.offeramount), item.buyeraddress)}
                                                                                        className='buyNowButton'
                                                                                        sx={{
                                                                                    }}
                                                                                    >
                                                                                        {t('VOTE')}
                                                                                    </Button>
                                                                                </Tooltip>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                ):(
                                                                    <>
                                                                    {publicKey && publicKey.toBase58() === mintOwner && (
                                                                        <Button
                                                                            onClick={() => setAcceptPrompt((item.price), item.buyeraddress, item.tradeState)} //acceptOfferWrapper(convertSolVal(item.offeramount), item.buyeraddress)} //handleAcceptOffer(convertSolVal(item.offeramount), item.buyeraddress)}
                                                                            className='buyNowButton'
                                                                            sx={{
                                                                            }}
                                                                        >
                                                                            {t('ACCEPT')}
                                                                        </Button>
                                                                    )}
                                                                    
                                                                    {publicKey && publicKey.toBase58() === item.buyeraddress && (
                                                                        <Button 
                                                                            color="error"
                                                                            variant="text"
                                                                            //onClick={() => handleWithdrawOffer(convertSolVal(item.offeramount))}
                                                                            onClick={() => handleCancelOffer((item.price))}
                                                                            sx={{
                                                                                borderRadius: '10px',
                                                                            }}
                                                                        >
                                                                            <CancelIcon />
                                                                        </Button>
                                                                    )}
                                                                    </>
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
                    <>
                    <HistoryView mint={mint} />
                    </>
                }
            </>
        )
    }
}