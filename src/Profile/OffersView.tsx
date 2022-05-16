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

import { GRAPE_RPC_ENDPOINT, GRAPE_RPC_REFRESH, GRAPE_PREVIEW, GRAPE_PROFILE, FEATURED_DAO_ARRAY } from '../utils/grapeTools/constants';
import { trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { cancelWithdrawOffer } from '../utils/auctionHouse/cancelWithdrawOffer';
import { cancelOffer } from '../utils/auctionHouse/cancelOffer';
import { withdrawOffer } from '../utils/auctionHouse/withdrawOffer';

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

    const handleCancelOffer = async (offerAmount: number, mint: any, updateAuthority: any) => {
        try {
            const mintKey = new web3.PublicKey(mint);
            let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mintKey));
            const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
            let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
            const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);                
            const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, publicKey, mintAccountInfoDs.owner, updateAuthority);
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
            const mintKey = new web3.PublicKey(mint);
            let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mintKey));
            const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
            let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
            const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);
            const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, publicKey, mintAccountInfoDs.owner, updateAuthority);
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
                if (mint){ // with mint allow calling cancel withdraw combo
                    try {
                        const mintKey = new web3.PublicKey(mint);
                        let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mintKey));
                        const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
                        let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
                        const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);
                        const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, publicKey, mintAccountInfoDs.owner, updateAuthority);
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
                        console.log("Error: "+e);
                    } 
                } else{ // no mint then just withdraw
                    try {
                        const transactionInstr = await withdrawOffer(offerAmount, null, publicKey, updateAuthority);
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

                    for (var item of allmints){  
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
                                const transactionInstr = await cancelOffer(item.offerAmount, item.mint, publicKey, mintAccountInfoDs.owner, updateAuthority);
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
                                const transactionInstr = await withdrawOffer(offerAmount, null, publicKey, updateAuthority);
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

            const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
            const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
            const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
            //let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mint)).toBuffer())], auctionHouseKey);
            let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(thisPublicKey)).toBuffer())], auctionHouseKey);
            //let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
            
            /*
            console.log("derivedMintPDA: "+derivedMintPDA);
            console.log("derivedBuyerPDA: "+derivedBuyerPDA);
            console.log("derivedOwnerPDA: "+derivedOwnerPDA);
            */
            
            let result = await ggoconnection.getSignaturesForAddress(derivedBuyerPDA[0], {limit: 100});
            
            //let sale_result = await connection.getSignaturesForAddress(derivedBuyerPDA[0], {limit: 250});
            //console.log(JSON.stringify(result));
            
            let offerResults: any[] = [];
            let cancelStateResults: any[] = [];
            let allListingResults: any[] = [];
            let listingResults: any[] = [];
            let mintArrayPDA: any[] = [];
            let escrow_cache: any[] = [];
            let exists = false;
            let existSaleCancelAction = 0;
            let cntr = 0;
            let cnt = 0;


            let sellerTradeStateArr: any[] = [];
            let signatures: any[] = [];
            for (var value of result){
                signatures.push(value.signature);
            }

            const getTransactionAccountInputs2 = await ggoconnection.getParsedTransactions(signatures, 'confirmed');
            for (var value of result){
                if (value.err === null){
                    
                    try{
                        //console.log('value: '+JSON.stringify(value));
                        const getTransactionAccountInputs = getTransactionAccountInputs2[cnt];
                        
                        if (getTransactionAccountInputs?.transaction && getTransactionAccountInputs?.transaction?.message){
                        
                            let feePayer = new PublicKey(getTransactionAccountInputs?.transaction.message.accountKeys[0].pubkey); // .feePayer.toBase58();                            
                            let progAddress = getTransactionAccountInputs.meta.logMessages[0];

                            // get last signature
                            if (cntr === limit-1){
                                //console.log(value.signature);
                                setBeforeSignature(value.signature);
                                setMaxPage(true);
                            }

                            //if ( feePayer != mintOwner && progAddress.search(AUCTION_HOUSE_PROGRAM_ID.toBase58())>0 && feePayer != null){
                            {
                                 
                                let escrow_found = false;
                                let escrow_found_index = 0;
                                for (var i = 0; i < escrow_cache.length; i++){
                                    if (escrow_cache[i].feePayer.toBase58() === feePayer.toBase58()){
                                        escrow_found = true;
                                        escrow_found_index = i;
                                    }
                                }

                                let amount_on_escrow = 0;

                                if (!escrow_found){
                                    let escrow = ( await getAuctionHouseBuyerEscrow(auctionHouseKey, feePayer,))[0];
                                    amount_on_escrow = await getTokenAmount(anchorProgram, escrow, auctionHouseObj.treasuryMint,);
                                    escrow_cache.push(
                                        {
                                            //escrow: escrow,
                                            amount_on_escrow: amount_on_escrow,
                                            feePayer: feePayer
                                        }
                                    );
                                    
                                } else{
                                    amount_on_escrow = escrow_cache[escrow_found_index].amount_on_escrow;
                                }
                                
                                let auctionMint = getTransactionAccountInputs.meta.preTokenBalances[0]?.mint;
                                //console.log('auctionMint: '+auctionMint);
                                
                                //if (auctionMint){
                                //    console.log("value3: "+JSON.stringify(value));
                                
                                // check if memo is an array
                                
                                // consider countering all brackets

                                    {
                                        exists = false;
                                        //console.log('VAL '+JSON.stringify(value));
                                        if ((value) && (value.memo)){
                                            
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
                                                memo_str = memo_str.substring(init,fin); // include brackets
                                                memo_arr.push(memo_str);
                                            }
                                            
                                            for (var memo_item of memo_arr){
                                                try{
                                                    const memo_json = JSON.parse(memo_item);
                                                    
                                                    //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_item);
                                                    //console.log(memo_json);
                                                    if ((memo_json?.status === 0) || // withdraw
                                                        (memo_json?.status === 1) || // offer
                                                        (memo_json?.status === 2) || // sale
                                                        (memo_json?.status === 3) || // listing/accept
                                                        (memo_json?.status === 4) || // buy now
                                                        (memo_json?.status === 5) || // cancel
                                                        (memo_json?.state === 0) || // withdraw
                                                        (memo_json?.state === 1) || // offer
                                                        (memo_json?.state === 2) || // sale
                                                        (memo_json?.state === 3) || // listing/accept
                                                        (memo_json?.state === 4) || // buy now
                                                        (memo_json?.state === 5)){ // cancel
                                                        
                                                        // consider checking amount vs memo_json.offer
                                                        
                                                        //CHECK IF OWNER HAS AN ACTIVE SELL NOW PRICE
                                                        let sale_state_exists = false;
                                                        
                                                        //console.log(memo_json?.state + ' ('+memo_json?.mint+') - ' + feePayer.toBase58() + ': ' + memo_json?.amount);
                                                        //console.log(feePayer.toBase58() + ' v ' + thisPublicKey);
                                                        
                                                        if (feePayer.toBase58() === thisPublicKey){

                                                            if ( feePayer.toBase58() === thisPublicKey && progAddress.search(AUCTION_HOUSE_PROGRAM_ID.toBase58())>0 && feePayer != null && !sale_state_exists){
                                                                
                                                                if ((memo_json?.status === 0) ||
                                                                    (memo_json?.status === 2) ||
                                                                    (memo_json?.status === 3) ||
                                                                    (memo_json?.status === 4) ||
                                                                    (memo_json?.status === 5) ||
                                                                    (memo_json?.state === 0) ||
                                                                    (memo_json?.state === 2) ||
                                                                    (memo_json?.state === 3) ||
                                                                    (memo_json?.state === 4) ||
                                                                    (memo_json?.state === 5)){

                                                                    if ((memo_json?.sellPrice)||(memo_json?.amount)){
                                                                        // check if exists
                                                                        for (var i = 0; i < allListingResults.length; i++){
                                                                            if (memo_json?.mint === allListingResults[i].mint){ // get latest offer
                                                                                sale_state_exists = true;
                                                                            }
                                                                        }
                                                                        for (var i = 0; i < cancelStateResults.length; i++){
                                                                            if (memo_json?.mint === cancelStateResults[i].mint){ // get latest offer
                                                                                sale_state_exists = true;
                                                                            }
                                                                        }

                                                                        // push last sale state first
                                                                        if ((!sale_state_exists)&&(selectedstate===2)){ // handle this only for sale tab
                                                                            let mint_address = new PublicKey(memo_json?.mint)
                                                                            mintArrayPDA.push(mint_address);

                                                                            if (memo_json?.amount){
                                                                                let ownerHasMint = false;
                                                                                for (var wvalue of walletCollection){
                                                                                    if (wvalue.account.data.parsed.info?.mint === memo_json?.mint)
                                                                                        ownerHasMint = true;
                                                                                }
																				//check if this is a valid sale or offer first
                                                                                if ((memo_json?.status === 2) || // sale
                                                                                    (memo_json?.status === 5)  || // cancel
                                                                                    (memo_json?.state === 2) || // sale
                                                                                    (memo_json?.state === 5)){ // cancel
                                                                                    
                                                                                    if (memo_json?.state === 5){
                                                                                        //sellerTradeStateArr.push(null);
                                                                                        cancelStateResults.push({tradeStatePublicKey: null, buyeraddress: feePayer, offeramount: memo_json?.amount, mint: memo_json?.mint, isowner: ownerHasMint, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status}); 
                                                                                    } else if (memo_json?.state === 2){
                                                                                        let thisTokenOwner = new web3.PublicKey(thisPublicKey);
                                                                                        if (!ownerHasMint){
                                                                                            // owner does not have the mint
                                                                                            let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mint_address));
                                                                                            const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
                                                                                            let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
                                                                                            const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);
                                                                                            thisTokenOwner = mintAccountInfoDs.owner;
                                                                                        } 
                                                                                        //console.log("Check: "+JSON.stringify(memo_json));
                                                                                        
                                                                                        if (ownerHasMint){
                                                                                            const tokenAccountKey = (await getAtaForMint(mint_address, thisTokenOwner))[0];
                                                                                            
                                                                                            //const tokenAccountKey = (await getAtaForMint(mint_address, mintAccountInfoDs.owner))[0];
                                                                                            const tokenSizeAdjusted = new BN(
                                                                                                await getPriceWithMantissa(
                                                                                                    1,
                                                                                                    mint_address,
                                                                                                    thisTokenOwner, 
                                                                                                    anchorProgram,
                                                                                                ),
                                                                                            );
                                                                                            let offerAmount = memo_json?.amount || memo_json?.sellPrice;
                                                                                            const buyPriceAdjusted = new BN(
                                                                                                await getPriceWithMantissa(
                                                                                                    convertSolVal(offerAmount),
                                                                                                    //@ts-ignore
                                                                                                    auctionHouseObj.treasuryMint,
                                                                                                    thisTokenOwner, 
                                                                                                    anchorProgram,
                                                                                                ),
                                                                                            );
                                                                                            
                                                                                            const sellerTradeState = (
                                                                                                await getAuctionHouseTradeState(
                                                                                                    auctionHouseKey,
                                                                                                    thisTokenOwner,
                                                                                                    tokenAccountKey,
                                                                                                    //@ts-ignore
                                                                                                    auctionHouseObj.treasuryMint,
                                                                                                    mint_address,
                                                                                                    tokenSizeAdjusted,
                                                                                                    buyPriceAdjusted,
                                                                                                )
                                                                                            )[0];
                                                                                            
                                                                                            sellerTradeStateArr.push(sellerTradeState);
                                                                                            // THESE ARE REDUNDANT RPC CALLS WE ARE BATCHING AND CHECKING IN THE END
                                                                                            //const sellerTradeStateInfo = await connection.getAccountInfo(sellerTradeState);    
                                                                                            //console.log("sellerTradeStateInfo: "+JSON.stringify(sellerTradeStateInfo));
                                                                                            //if (sellerTradeStateInfo != null){   
                                                                                                //console.log('ownerHasMint ('+ownerHasMint+'):', memo_json?.mint, 'state:', memo_json?.state);
                                                                                                if (ownerHasMint) {
                                                                                                    //console.log('ownerHasMint:', memo_json?.mint, 'state:', memo_json?.state);
                                                                                                    if (thisPublicKey == feePayer)
                                                                                                        allListingResults.push({tradeStatePublicKey: sellerTradeState.toBase58(), buyeraddress: feePayer, offeramount: memo_json?.amount, mint: memo_json?.mint, isowner: true, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});  
                                                                                                    else
                                                                                                        allListingResults.push({tradeStatePublicKey: sellerTradeState.toBase58(), buyeraddress: feePayer, offeramount: memo_json?.amount, mint: memo_json?.mint, isowner: false, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});  
                                                                                                } else {
                                                                                                    //console.log('owner does not have Mint:', memo_json?.mint, 'state:', memo_json?.state); 
                                                                                                    if (memo_json?.state != 5) {
                                                                                                        allListingResults.push({tradeStatePublicKey: sellerTradeState.toBase58(), buyeraddress: feePayer, offeramount: memo_json?.amount, mint: memo_json?.mint, isowner: false, timestamp: value.blockTime, state: memo_json?.state});  
                                                                                                    }
                                                                                                }
                                                                                            //}
                                                                                        }
                                                                                    }
                                                                                    
                                                                                    
																				}
																			}
                                                                        }
                                                                    }
                                                                    
                                                                }
                                                            }
                                                        }

                                                        if ((memo_json?.status === 0) ||
                                                            (memo_json?.status === 1) ||
                                                            (memo_json?.status === 5) ||
                                                            (memo_json?.state === 0) ||
                                                            (memo_json?.state === 1) ||
                                                            (memo_json?.state === 5)){
                                                            
                                                            //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_item);
                                                            //if ((memo_json?.amount === amount)||
                                                            //    (memo_json?.offer === amount)){
                                                            {
                                                                //console.log('OFFER: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_item);
                                                                if (memo_json?.amount >= 0){
                                                                    exists = false;
                                                                    //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_item);
                                                                    for (var i = 0; i < offerResults.length; i++){
                                                                        if (//(feePayer === offerResults[i].buyeraddress)&&
                                                                            (memo_json?.mint === offerResults[i].mint)){
                                                                            exists = true;
                                                                        }
                                                                    }
                                                                    if (!exists){
                                                                        
                                                                        //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_item);
                                                                        
                                                                        if (amount_on_escrow > 0){ // here check if the feePayer is good for the offer
                                                                            if (feePayer.toBase58() === thisPublicKey)
                                                                                offerResults.push({buyeraddress: feePayer.toBase58(), offeramount: memo_json?.amount, mint: memo_json?.mint, isowner: true, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});  

                                                                            else   
                                                                                offerResults.push({buyeraddress: feePayer.toBase58(), offeramount: memo_json?.amount, mint: memo_json?.mint, isowner: false, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});  
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }catch(e){console.log("ERR: "+e)}
                                            }
                                        }
                                    }
                                //}
                            }
                        }
                    }catch(ert){console.log("ERR: "+ert)}
                }
                cnt++;
                cntr++;
                setCounter(cntr);
            }

            if (mintArrayPDA.length > 0){
                /*
                for (var y=0;y<mintArrayPDA.length;y++){
                    const MD_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
                    let [pda, bump] = await PublicKey.findProgramAddress([
                        Buffer.from("metadata"),
                        MD_PUBKEY.toBuffer(),
                        new PublicKey(mintArrayPDA[y]).toBuffer(),
                    ], MD_PUBKEY)
                }

                let final_mint_states = await connection.getParsedTransactions(mintArrayPDA);
                let state_was_sold = false;
                let final_sale_state = '';//memo_json?.state || memo_json?.status;
                for (var x=0; x < listingResults.length; x++){
                    
                    // for each listing
                    // check the final_mint_state (last transaction?)
                    for (var r=0; r < final_mint_states.length; r++){
                        
                        console.log("Final Mint State: "+JSON.stringify(final_mint_states[r]))

                    }
                    /*
                    if ((listingResults[x]) && (listingResults[x].memo)){
                    
                        let sub_memo_str = listingResults[x].memo;
                        let init = sub_memo_str.indexOf('{');
                        let fin = sub_memo_str.indexOf('}');
                        sub_memo_str = sub_memo_str.substr(init,fin);
                        const sub_memo_json = JSON.parse(sub_memo_str);
                        
                        if ((sub_memo_json?.status === 3) ||
                            (sub_memo_json?.status === 4) ||
                            (sub_memo_json?.state === 3) ||
                            (sub_memo_json?.state === 4)){
                            state_was_sold = true;
                            final_sale_state = sub_memo_json?.state || sub_memo_json?.status;
                            //console.log("SOLD: "+sub_memo_json?.state);
                        }
                    }
                    */

                    // if first instance of 
                //} 
            }
            var j = 0;
            for (var i = 0; i < offerResults.length; i++){
                if ((offerResults[i].isowner && offerResults[i].state === 1)){
                    j++;
                }
            }
            setMyOffers(myoffers+j);

            // check which tab we are in to avoid uneeded RPC call
            const tradeStates = await ggoconnection.getMultipleAccountsInfo(sellerTradeStateArr, 'confirmed');
            let x = 0;
            for (var alrvalue of allListingResults){
                // check if this has a trade 
                if ((alrvalue.tradeStatePublicKey) && (sellerTradeStateArr[x])){
                    if (alrvalue.tradeStatePublicKey === sellerTradeStateArr[x].toBase58()){
                        // check if this has an active trade state
                        if (tradeStates[x]){
                            //console.log("checking: "+alrvalue.tradeStatePublicKey + " vs "+sellerTradeStateArr[x].toBase58());
                            listingResults.push({
                                buyeraddress: allListingResults[x].buyeraddress, offeramount: allListingResults[x].offeramount, mint: allListingResults[x].mint, isowner: allListingResults[x].isowner, timestamp: allListingResults[x].timestamp, state: allListingResults[x].state
                            })
                        }
                    }
                }
                x++;
            }
            
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
        if (selectedstate == 1){
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
                    
                    {/*
                    {(publicKey && publicKey.toBase58() === thisPublicKey && ahbalance && (ahbalance > 0)) ?
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
                                        onClick={() => handleWithdrawOffer(convertSolVal(ahbalance), null)}
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
                                    <Tooltip title={t('Withdraw from the Grape Auction House')}>
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() => (myoffers > 0 ? setAlertWithdrawOpen(true) : handleWithdrawOffer(convertSolVal(ahbalance), null))}
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
                    }*/}
                    
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
                                                        component={Link} to={`${GRAPE_PROFILE}${item.buyeraddress}`}
                                                        sx={{borderRadius:'24px'}}
                                                    >
                                                        <AccountCircleOutlinedIcon sx={{fontSize:"14px", mr:1}} />
                                                        <Typography variant="caption">
                                                            {trimAddress(item.buyeraddress, 3)}
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell  align="center"><Typography variant="h6">
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
                                                    {convertSolVal(item.offeramount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
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
                                            <TableCell align="center"> 
                                                {publicKey &&
                                                <>
                                                    {(publicKey.toBase58() === item.buyeraddress) && (
                                                    <Tooltip title={t('Cancel Offer')}>
                                                        <Button 
                                                            color="error"
                                                            variant="text"
                                                            //onClick={() => handleWithdrawOffer(convertSolVal(item.offeramount), item.mint)}
                                                            onClick={() => handleCancelWithdrawOffer(convertSolVal(item.offeramount), item.mint, item.updateAuthority)}
                                                            //onClick={() => handleCancelOffer(convertSolVal(item.offeramount), item.mint)}
                                                            sx={{
                                                                borderRadius: '24px',
                                                            }}
                                                        >
                                                            <CancelIcon />
                                                        </Button>
                                                    </Tooltip>
                                                    )}
                                                </>
                                                }
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
                    {/*
                    {(publicKey && publicKey.toBase58() === thisPublicKey && ahbalance && (ahbalance > 0)) ?
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
                                    <Tooltip title={t('Withdraw from the Grape Auction House')}>
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() => (myoffers > 0 ? setAlertWithdrawOpen(true) : handleWithdrawOffer(convertSolVal(ahbalance), null))}
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
                    */}

                    <TableContainer
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                        }}
                    >
                        <Table size="small" aria-label="listings">
                            {listings && listings.map((item: any,key:number) => (
                                <>
                                    {item.state === 2 && (
                                    <>
                                        <TableRow sx={{p:1}} key={key}>
                                            <TableCell  align="right"><Typography variant="caption">
                                            </Typography></TableCell>
                                            <TableCell  align="right"><Typography variant="h6">
                                                {convertSolVal(item.offeramount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
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
