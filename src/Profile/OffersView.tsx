import React from "react";
import { Link } from "react-router-dom";
// @ts-ignore

import { useWallet } from '@solana/wallet-adapter-react';

import { TokenAmount, lt } from '../utils/grapeTools/safe-math';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';

import { makeStyles, styled, alpha } from '@mui/material/styles';
import { Button } from '@mui/material';

import { useSnackbar } from 'notistack';

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
    getAuctionHouseProgramAsSigner,
    loadWalletKey,
    deserializeAccount,
  } from '../utils/auctionHouse/helpers/accounts';

import { BN, web3 } from '@project-serum/anchor';
import { getPriceWithMantissa } from '../utils/auctionHouse/helpers/various';

import {  
    getReceiptsFromAuctionHouse,
    getMintFromVerifiedMetadata,
    getMintFromMetadata } from '../utils/grapeTools/helpers';

import {
    Typography,
    Grid,
    Box,
    Table,
    TableContainer,
    TableRow,
    TableCell,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Container,
} from '@mui/material';

import { red } from '@mui/material/colors';

import MuiAlert, { AlertProps } from '@mui/material/Alert';

import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import GrapeIcon from '../components/static/GrapeIcon';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CircularProgress from '@mui/material/CircularProgress';
import CancelIcon from '@mui/icons-material/Cancel';

import { 
    GRAPE_RPC_ENDPOINT, 
    GRAPE_RPC_REFRESH, 
    GRAPE_PREVIEW, 
    GRAPE_PROFILE, 
    GRAPE_COLLECTIONS_DATA } from '../utils/grapeTools/constants';
import { trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { cancelWithdrawOffer } from '../utils/auctionHouse/cancelWithdrawOffer';
import { cancelOffer } from '../utils/auctionHouse/cancelOffer';
import { withdrawOffer } from '../utils/auctionHouse/withdrawOffer';

import { useTranslation } from 'react-i18next';
import { json } from "stream/consumers";

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

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
  }));

  function convertSolVal(sol: any){
    return parseFloat(new TokenAmount(sol, 9).format());
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

export default function OffersView(props:any){
    const [offers, setOffers] = React.useState(null);
    const [myoffers, setMyOffers] = React.useState(0);
    const [listings, setListings] = React.useState(null);
    const [ahbalance, setAHBalance] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [ahloading, setAHLoading] = React.useState(false);
    const [ thisPublicKey, setThisPublicKey] = React.useState(props.pubkey || null);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const { publicKey, sendTransaction } = useWallet();
    const [walletCollection, setWalletCollection] = React.useState(props.wallet_collection);
    const [walletCollectionMeta, setWalletCollectionMeta] = React.useState(props.wallet_collection_meta);
    const [refresh, setRefresh] = React.useState(false);
    const [counter, setCounter] = React.useState(0);
    const [limit, setLimit] = React.useState(25);
    const [maxPage, setMaxPage] = React.useState(false);
    const [beforeSignature, setBeforeSignature] = React.useState(null);
    const [page, setPage] = React.useState(1);
    const [alertwithdrawopen, setAlertWithdrawOpen] = React.useState(false);
    const rowsperpage = 1500;
    const selectedstate = props.selectedstate;

    const handleAlertWithdrawClose = () => {
        setAlertWithdrawOpen(false);
    };
    const handleAlertWithdrawOpen = () => {
        setAlertWithdrawOpen(true);
    };

    const fetchVerifiedCollection = async(address:string) => {
        try{
            const url = GRAPE_COLLECTIONS_DATA+'verified_collections.json';
            const response = await window.fetch(url, {
                method: 'GET',
                headers: {
                }
              });
              const string = await response.text();
              const json = string === "" ? {} : JSON.parse(string);
              //console.log(">>> "+JSON.stringify(json));
              // filter to get only this ua
              for (var item of json){
                if (address){
                    if (item.address === address){
                        //setVerifiedCollection(verified);
                        //console.log("found: "+item.address);
                        //console.log("auctionHouse: "+item.auctionHouse);
                        return item;
                    }
                }
              }
            if (!address)
                return json;
            else    
              return null;
        } catch(e){
            console.log("ERR: "+e)
            return null;
        }
    }

    const handleCancelOffer = async (offerAmount: number, mint: any, updateAuthority: any) => {
        try {
            const mintKey = new web3.PublicKey(mint);
            let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mintKey));
            const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
            let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
            const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);                
            const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, publicKey, mintAccountInfoDs.owner, updateAuthority, null);
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
            await connection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`${t('Offer has been canceled')} `,{ variant: 'success', action:snackaction });
            
            const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center',
                },
                persist: true,
            });
            setTimeout(function() {
                closeSnackbar(eskey);
                setRefresh(true);
            }, GRAPE_RPC_REFRESH);
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            //enqueueSnackbar(`${t('Error')}: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }
	//handCancelWithdrawOffer was useful when only allowing one offer at a time
    const handleCancelWithdrawOffer = async (offerAmount: number, mint: any, updateAuthority: any) => {
        try {
            let [vcFinal] = await Promise.all([fetchVerifiedCollection(updateAuthority)]);

            const mintKey = new web3.PublicKey(mint);
            let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mintKey));
            const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
            let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
            const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);
            console.log("vcFinal?.auctionHouse "+vcFinal?.auctionHouse);
            const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, publicKey, mintAccountInfoDs.owner, updateAuthority, vcFinal?.auctionHouse);
            const instructionsArray = [transactionInstr.instructions].flat();        
            const transaction = new Transaction()
            .add(
                ...instructionsArray
            );

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
            enqueueSnackbar(`${t('Offer Cancel and Withdrawal completed')} `,{ variant: 'success', action:snackaction });
            
            const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center',
                },
                persist: true,
            });
            setTimeout(function() {
                closeSnackbar(eskey);
                setRefresh(true);
            }, GRAPE_RPC_REFRESH);
            /*console.log('Withdrew', offerAmount, amountAdjusted, 'from your account with Auction House',
                AUCTION_HOUSE_ADDRESS, '. New Balance:', currBal - amountAdjusted,);*/
        } catch(e){
            closeSnackbar()
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            //enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }
    
    const handleWithdrawOffer = async (offerAmount: number, mint: string, updateAuthority: string) => {

        try {
            var allmints: any[] = [];
            if (!mint){
                for (var item of offers){
                    if(item.state === 1){
                        allmints.push({mint: item.mint, offerAmount: convertSolVal(item.offeramount)});
                        if (!mint)
                            mint = item.mint;
                    }               
                }
            }

            if (allmints.length <= 1){
                console.log("mint: "+mint);
                // get updateAuthority
                // get auctionHouse
                
                
                if (mint){ // with mint allow calling cancel withdraw combo
                    let [vcFinal] = await Promise.all([fetchVerifiedCollection(updateAuthority)]);
                    try {
                        const mintKey = new web3.PublicKey(mint);
                        let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mintKey));
                        const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
                        let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
                        const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);
                        console.log("vcFinal?.auctionHouse "+vcFinal?.auctionHouse);
                        const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, publicKey, mintAccountInfoDs.owner, updateAuthority, vcFinal?.auctionHouse);
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
                        enqueueSnackbar(`${t('Offer Cancel and Withdrawal completed')} `,{ variant: 'success', action:snackaction });
                        
                        const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                            anchorOrigin: {
                                vertical: 'top',
                                horizontal: 'center',
                            },
                            persist: true,
                        });
                        setTimeout(function() {
                            closeSnackbar(eskey);
                            setRefresh(true);
                        }, GRAPE_RPC_REFRESH);
                    } catch(e){
                        closeSnackbar();
                        enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
                        console.log("Error: "+JSON.stringify(e));
                    } 
                } else{ // no mint then just withdraw
                    let [vcFinal] = await Promise.all([fetchVerifiedCollection(updateAuthority)]);
                    try {
                        console.log("vcFinal?.auctionHouse "+vcFinal?.auctionHouse);
                        const transactionInstr = await withdrawOffer(offerAmount, null, publicKey, updateAuthority, vcFinal?.auctionHouse);
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
                        enqueueSnackbar(`${t('Withdrawal from Grapevine completed')} `,{ variant: 'success', action:snackaction });
                        
                        const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                            anchorOrigin: {
                                vertical: 'top',
                                horizontal: 'center',
                            },
                            persist: true,
                        });
                        setTimeout(function() {
                            closeSnackbar(eskey);
                            setRefresh(true);
                        }, GRAPE_RPC_REFRESH);
                    } catch(e){
                        closeSnackbar();
                        enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
                        console.log("Error: "+e);
                    }
                }
            } else {  
                //enqueueSnackbar(`To withdraw from Grapevine you must first cancel all pending Offers.`,{ variant: 'warning' });
                //several mints to cancel and finally withdraw
                
                    let cnt = 1;
                    let [vcFinal] = await Promise.all([fetchVerifiedCollection(null)]);

                    for (var item of allmints){  
                        
                        console.log("updateAuthority: " + JSON.stringify(updateAuthority))
                        for (var verified of vcFinal){
                            console.log("verified: "+verified)
                        }
                        
                        console.log(JSON.stringify(allmints));  
                        try{ 
                            if (cnt <= allmints.length){
                                //cancelOffer on specific mint in list
                                const mintKey = new web3.PublicKey(item.mint);
                                let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mintKey));
                                const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
                                let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
                                const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);
                                //let numericAmmount = item.offerAmount;
                                
                                const transactionInstr = await cancelOffer(item.offerAmount, item.mint, publicKey, mintAccountInfoDs.owner, updateAuthority, vcFinal?.auctionHouse);
                                const instructionsArray = [transactionInstr.instructions].flat();        
                                const transaction = new Transaction()
                                .add(
                                    ...instructionsArray
                                );
                                
                                enqueueSnackbar(`${t('Preparing to cancel offer for')} ${item.offerAmount} SOL ${t('on')} ${t('mint')} ${item.mint}`,{ variant: 'info' });
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
                                enqueueSnackbar(`${t('Offer cancel complete')} `,{ variant: 'success', action:snackaction });                 
                            }
                        } catch(e){
                            closeSnackbar();
                            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
                            console.log("Error: "+e);
                        }
                        
                        try{
                            if (cnt === allmints.length){
                                
                                const transactionInstr = await withdrawOffer(offerAmount, null, publicKey, updateAuthority, vcFinal?.auctionHouse);
                                console.log("here...")
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
                                enqueueSnackbar(`${t('Grapevine Withdrawal complete')} `,{ variant: 'success', action:snackaction });                     
                            }
                        } catch(e){
                            closeSnackbar();
                            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
                            console.log("Error: "+e);
                        }  

                        cnt++;
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
                        setRefresh(true);
                    }, GRAPE_RPC_REFRESH);
         
				
            }
            
        } catch(e){
            closeSnackbar();
            enqueueSnackbar(`${t('Error')}: ${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }

    const getOffers = async () => {
        getEscrowBalance();


        if (!loading){
            setLoading(true);
            setMaxPage(false);

            
                //console.log("with aH: "+ collectionAuthority.auctionHouse+" - "+JSON.stringify(collectionAuthority))
                const results = await getReceiptsFromAuctionHouse(AUCTION_HOUSE_ADDRESS, thisPublicKey, null, null);

                const offerResults = new Array();
                const listingResults: any[] = [];
                for (var item of results){
                    const mintitem = await getMintFromMetadata(null, item?.metadata);
                    
                    if (!item?.canceledAt){
                        if (mintitem && mintitem.length > 3){
                            console.log("item: "+JSON.stringify(item));
                            if (item.receipt_type==='bid_receipt'){
                                offerResults.push({buyeraddress: item.bookkeeper.toBase58(), bookkeeper: item.bookkeeper.toBase58(), amount: item.price, price: item.price, mint: mintitem, metadataParsed:mintitem, isowner: false, createdAt: item.createdAt, cancelledAt: item.canceledAt, timestamp: item.createdAt, blockTime: item.createdAt, state: item?.receipt_type});
                            } else if (item.receipt_type==='listing_receipt'){
                                listingResults.push({buyeraddress: item.bookkeeper.toBase58(), bookkeeper: item.bookkeeper.toBase58(), amount: item.price, price: item.price, mint: mintitem, metadataParsed:mintitem, isowner: false, createdAt: item.createdAt, cancelledAt: item.canceledAt, timestamp: item.createdAt, blockTime: item.createdAt, state: item?.receipt_type});
                            } else if (item.receipt_type==='cancel_listing_receipt'){
                                listingResults.push({buyeraddress: item.bookkeeper.toBase58(), bookkeeper: item.bookkeeper.toBase58(), amount: item.price, price: item.price, mint: mintitem, metadataParsed:mintitem, isowner: false, createdAt: item.createdAt, cancelledAt: item.canceledAt, timestamp: item.createdAt, blockTime: item.createdAt, state: item?.receipt_type});
                            }
                        }
                    }
                }

                // sort by date
                offerResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);
                listingResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);
            //setMyOffers(myoffers+j);

            
            if (offers){
                setOffers(
                    (offers:any) => [...offers,offerResults]
                );
            }else {
                setOffers(
                    offerResults
                ); 
            }

            if (listings){
                setListings(
                    (listings:any) => [...listings,listingResults]
                );
            }else {
                setListings(
                    listingResults
                ); 
            }

            setLoading(false);
        }
    }

    const getEscrowBalance = async () => {
        const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
        const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
        const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
        
        if (!ahloading){
            setAHLoading(true);
            if (publicKey){
                const escrow = ( await getAuctionHouseBuyerEscrow(auctionHouseKey, publicKey,))[0];
                let amount = await getTokenAmount(anchorProgram, escrow, auctionHouseObj.treasuryMint,);
                console.log("Escrow: "+amount);
                setAHBalance(amount);
            }
            setAHLoading(false);
            
        }
    }

    const { t, i18n } = useTranslation();

    React.useEffect(() => { 
        if (thisPublicKey){
            if (!loading){
                if ((!offers)||(refresh)){
                    console.log("Getting offers for "+thisPublicKey);
                    getOffers();
                }
            }
        }
    }, [refresh, thisPublicKey]);
    
    if ((loading)||(ahloading)){
        return (
            <Box
                    sx={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '17px',
                        p:2
                    }} 
                > 
                <Grid container
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                    }} 
                >
                    <CircularProgress />
                </Grid>
            </Box>
        );
    } else {
        if (selectedstate == 'bid_receipt'){
            return (
                
            <Box
                sx={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '17px',
                    p:2
                }} 
            > 
                <Grid 
                    container 
                    direction="row"
                    justifyContent='flex-end'
                    alignContent='flex-end'>
                    
                    <Typography variant="caption">*Displaying from the Grape Auction House, for Marketplaces please visit the respective marketplace</Typography>
                    <br/>

                    {(publicKey && publicKey.toBase58() === thisPublicKey && ahbalance && (ahbalance > 0.001)) ?
                        <Box
                            sx={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '17px',
                                mt:1,
                                mb:1,
                                ml:0,
                                mr:0
                            }}
                        >
                            
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
                                open={alertwithdrawopen}
                                onClose={handleAlertWithdrawClose}
                                aria-labelledby="alert-bn-dialog-title"
                                aria-describedby="alert-bn-dialog-description"
                                >
                                <DialogTitle id="alert-bn-dialog-title">
                                    <Typography>
                                        {t('CONFIRMATION')}
                                    </Typography>
                                </DialogTitle>
                                <DialogContent>
                                    <DialogContentText id="alert-bn-dialog-description">
                                    <br />
                                    <Alert 
                                        severity="warning" variant="outlined"
                                        sx={{backgroundColor:'black'}}
                                        >
                                            {t('You currently have')} <strong>{myoffers}</strong> {t('standing offer')}{(myoffers > 1 && <>s</>)}, {t('it is recommended that you cancel all standing offers and then attempt to withdraw. If you are unable to cancel then click Withdraw to force cancel from the Grape Auction House')}
                                            <br/><br/>
                                            {t('NOTE: By pressing Withdraw you will have to Accept')} <strong>{myoffers}</strong> {t('additional transaction')}{(myoffers > 1 && <>s</>)} {t('with your wallet')}
                                    </Alert>
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleAlertWithdrawClose}>{t('Cancel')}</Button>
                                    <Button 
                                        onClick={() => handleWithdrawOffer(convertSolVal(ahbalance), null, null)}
                                        autoFocus>
                                    {t('Withdraw')}
                                    </Button>
                                </DialogActions>
                            </BootstrapDialog>
                            
                            <Grid 
                                item
                                sx={{
                                }}
                            >
                                <Typography variant="caption">
                                    <Tooltip title={`In the Grape Auction House ${AUCTION_HOUSE_ADDRESS}`}>
                                        <Button
                                            size="small"
                                            variant="text"
                                            //onClick={() => (myoffers > 0 ? setAlertWithdrawOpen(true) : handleWithdrawOffer(convertSolVal(ahbalance), null, null))}
                                            sx={{
                                                borderRadius:'17px'
                                            }}
                                        >
                                            {convertSolVal(ahbalance)} <SolCurrencyIcon sx={{fontSize:"8px", mr:0.5 }} /> <GrapeIcon sx={{fontSize:"22px", mr:0.5, color:'white' }} />
                                        </Button>
                                    </Tooltip>
                                </Typography>
                            </Grid>
                        </Box>
                    :
                    <Box></Box>
                    }
                    
                    <TableContainer
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                        }}
                    >
                        <Table size="small" aria-label="offers">
                            {offers && offers.map((item: any,key:number) => (
                                <>
                                    {item.state === selectedstate && (
                                    <>
                                        <TableRow sx={{border:'none'}} key={key}>
                                            <TableCell>
                                                <Tooltip title={t('Visit Profile')}>
                                                    <Button
                                                        component={Link} to={`${GRAPE_PROFILE}${item.bookkeeper}`}
                                                        sx={{borderRadius:'24px'}}
                                                    >
                                                        <AccountCircleOutlinedIcon sx={{fontSize:"14px", mr:1}} />
                                                        <Typography variant="caption">
                                                            {trimAddress(item.bookkeeper, 3)}
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell  align="center"><Typography variant="h6">
                                                Offer {(item.amount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                                {/*
                                                {item.isowner ? (
                                                    <Tooltip title={t('Offer made')}>
                                                        <IconButton>
                                                            <ArrowForwardIcon color="success" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    ):(
                                                    <Tooltip title={t('Offer received')}>
                                                        <IconButton>
                                                            <ArrowBackIcon sx={{ color: red[500] }} />
                                                        </IconButton>
                                                    </Tooltip>)}
                                                    {(item.amount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                                */}
                                            </Typography></TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={t('View NFT')}>
                                                    <Button
                                                        component={Link} to={`${GRAPE_PREVIEW}${item.mint}`}
                                                        sx={{borderRadius:'24px'}}
                                                    >
                                                        <ImageOutlinedIcon sx={{fontSize:"14px", mr:1}}/>
                                                        <Typography variant="caption">
                                                            {trimAddress(item.mint, 3)}
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="caption">
                                                    <Tooltip title={formatBlockTime(item.timestamp, true, true)}>
                                                        <Button size='small' sx={{borderRadius:'24px'}}>{timeAgo(item.timestamp)}</Button>
                                                    </Tooltip>
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                        </>
                                    )}
                                </>
                            ))}
                        </Table>
                    </TableContainer>
                </Grid>
            </Box>
            )
        } else {
            return (
                <Box
                sx={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '17px',
                    p:2
                }} 
            > 
                <Grid 
                    container 
                    direction="row"
                    justifyContent='flex-end'
                    alignContent='flex-end'>
                    
                    <Typography variant="caption">*Displaying from the Grape Auction House, for Marketplaces please visit the respective marketplace</Typography>
                    <br/>

                    {(publicKey && publicKey.toBase58() === thisPublicKey && ahbalance && (ahbalance > 0.001)) ?
                        <Box
                            sx={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '17px',
                                mt:1,
                                mb:2,
                            }}
                        >
                            
                            <Grid 
                                item
                                sx={{
                                }}
                            >
                                <Typography variant="caption">
                                    <Tooltip title={`In the Grape Auction House ${AUCTION_HOUSE_ADDRESS}`}>
                                        <Button
                                            size="small"
                                            variant="text"
                                            //onClick={() => (myoffers > 0 ? setAlertWithdrawOpen(true) : handleWithdrawOffer(convertSolVal(ahbalance), null, null))}
                                            sx={{
                                                borderRadius:'17px'
                                            }}
                                        >
                                            {convertSolVal(ahbalance)} <SolCurrencyIcon sx={{fontSize:"8px", mr:0.5 }} /> <GrapeIcon sx={{fontSize:"22px", mr:0.5, color:'white' }} />
                                        </Button>
                                    </Tooltip>
                                </Typography>
                            </Grid>
                        </Box>
                    :
                    <Box></Box>
                    }
                    

                    <TableContainer
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                        }}
                    >
                        <Table size="small" aria-label="listings">
                            {listings && listings.map((item: any,key:number) => (
                                <>
                                    {item.state === 'listing_receipt' && (
                                    <>
                                        <TableRow sx={{p:1}} key={key}>
                                            <TableCell  align="right"><Typography variant="caption">
                                            </Typography></TableCell>
                                            <TableCell  align="right"><Typography variant="h6">
                                                {(item.amount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                            </Typography></TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={t('View NFT')}>
                                                    <Button
                                                        component={Link} to={`${GRAPE_PREVIEW}${item.mint}`}
                                                        sx={{borderRadius:'24px'}}
                                                    >
                                                        <ImageOutlinedIcon sx={{fontSize:"14px", mr:1}}/>
                                                        <Typography variant="caption">
                                                            {trimAddress(item.mint, 4)}
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="caption">
                                                    <Tooltip title={formatBlockTime(item.timestamp, true, true)}>
                                                        <Button size='small' sx={{borderRadius:'24px'}}>{timeAgo(item.timestamp)}</Button>
                                                    </Tooltip>
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                            </TableCell>
                                        </TableRow>
                                    </>
                                    )}
                                    {item.state === 'cancel_listing_receipt' && (
                                    <>
                                        <TableRow sx={{p:1}} key={key}>
                                            <TableCell  align="right"><Typography variant="caption">
                                            </Typography></TableCell>
                                            <TableCell  align="right"><Typography variant="h6" sx={{color:'red'}}>
                                                {(item.amount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                            </Typography></TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={t('View NFT')}>
                                                    <Button
                                                        component={Link} to={`${GRAPE_PREVIEW}${item.mint}`}
                                                        sx={{borderRadius:'24px'}}
                                                    >
                                                        <ImageOutlinedIcon sx={{fontSize:"14px", mr:1}}/>
                                                        <Typography variant="caption">
                                                            {trimAddress(item.mint, 4)}
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="caption">
                                                    <Tooltip title={formatBlockTime(item.timestamp, true, true)}>
                                                        <Button size='small' sx={{borderRadius:'24px'}}>{timeAgo(item.timestamp)}</Button>
                                                    </Tooltip>
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                            </TableCell>
                                        </TableRow>
                                    </>
                                    )}
                                </>
                            ))}
                        </Table>
                    </TableContainer>
                </Grid>
            </Box>
            )
        }
    }
}
