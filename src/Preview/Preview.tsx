import React, { useEffect, useState, useCallback, memo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { struct } from 'buffer-layout';

import CyberConnect, { Env, Blockchain, solana, ConnectionType } from '@cyberlab/cyberconnect';

import {CopyToClipboard} from 'react-copy-to-clipboard';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { u128, u64 } from '@project-serum/borsh'
// @ts-ignore
import fetch from 'node-fetch'
import ImageViewer from 'react-simple-image-viewer';
import { Helmet } from 'react-helmet';

import { findDisplayName } from '../utils/name-service';
import { getProfilePicture, createSetProfilePictureTransaction } from '@solflare-wallet/pfp';

import { TokenAmount, lt } from '../utils/grapeTools/safe-math';
import { 
    getRealms, 
    getVoteRecordsByVoter, 
    getTokenOwnerRecordForRealm, 
    getTokenOwnerRecordsByOwner, 
    getGovernanceAccounts, 
    pubkeyFilter, 
    TokenOwnerRecord, 
    withCreateProposal,
    VoteType, 
    getGovernanceProgramVersion,
    serializeInstructionToBase64,
    createInstructionData,
    withInsertTransaction
} from '@solana/spl-governance';
import { Router, useNavigate, useLocation } from 'react-router';
import { makeStyles, styled, alpha } from '@mui/material/styles';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import { FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';
import { useWeb3 } from '../utils/cyberConnect/web3Context';
import { followListInfoQuery, searchUserInfoQuery } from '../utils/cyberConnect/query';
import moment from 'moment';

import {
    Pagination,
    Stack,
    Avatar,
    AlertTitle,
    AppBar,
    Toolbar,
    Chip,
    Typography,
    Grid,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    Box,
    ButtonGroup,
    Paper,
    Divider,
    Skeleton,
    Collapse,
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Badge,
    InputBase,
    Tooltip,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    SnackbarOrigin,
    List,
    ListSubheader,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Card,
    CardHeader,
    CardContent,
    
} from '@mui/material';

import MuiAlert, { AlertProps } from '@mui/material/Alert';

import QrCodeIcon from '@mui/icons-material/QrCode';

import FlagIcon from '@mui/icons-material/Flag';
import EmojiFlagsIcon from '@mui/icons-material/EmojiFlags';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BallotIcon from '@mui/icons-material/Ballot';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SegmentIcon from '@mui/icons-material/Segment';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShareIcon from '@mui/icons-material/Share';
import SellIcon from '@mui/icons-material/Sell';
import PreviewIcon from '@mui/icons-material/Preview';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CircularProgress from '@mui/material/CircularProgress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import DeleteIcon from '@mui/icons-material/Delete';

import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletError } from '@solana/wallet-adapter-base';

import { UPDATE_AUTHORITIES } from '../utils/grapeTools/mintverification';
import { GRAPE_WHITELIST } from '../utils/grapeTools/whitelist';
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
import ShareSocialURL from '../utils/grapeTools/ShareUrl';
import { RegexTextField } from '../utils/grapeTools/RegexTextField';
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { borderRadius } from "@mui/system";

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
import { sendTransactionWithRetryWithKeypair } from '../utils/auctionHouse/helpers/transactions';  
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { decodeMetadata, Metadata } from '../utils/auctionHouse/helpers/schema';
import { ConstructionOutlined, ModeComment, SentimentSatisfiedAltTwoTone } from "@mui/icons-material";
import { propsToClassKey } from "@mui/styles";
import { WalletConnectButton } from "@solana/wallet-adapter-react-ui";

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
  

interface ExpandMoreProps extends IconButtonProps {
    expand: boolean;
  }
  
  const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
  })(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  }));

function getParam(param: string) {
    return new URLSearchParams(document.location.search).get(param);
}

function convertSolVal(sol: any){
    let sol_precision = 6;
    return +sol/1000000000;
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

const ItemOffers = (props: any) => {
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

            enqueueSnackbar(`Preparing to accept offer of: ${offerAmount} SOL from: ${buyerAddress.toString()}`,{ variant: 'info' });
            const signedTransaction2 = await sendTransaction(transaction, connection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction2, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction2}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction2}
                </Button>
            );
            enqueueSnackbar(`NFT transaction completed `,{ variant: 'success', action:snackaction });
            
            const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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

            enqueueSnackbar(`Canceling Sell Now Price for ${salePrice} SOL`,{ variant: 'info' });
            const signedTransaction = await sendTransaction(transaction, connection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`Sell Now Price Removed `,{ variant: 'success', action:snackaction });
            //END CANCEL LISTING
            
            const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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


            enqueueSnackbar(`Preparing to withdraw offer for ${offerAmount} SOL`,{ variant: 'info' });
            const signedTransaction = await sendTransaction(transaction, connection)
           
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`Offer Withdrawal complete `,{ variant: 'success', action:snackaction });
            const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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

            enqueueSnackbar(`Preparing to Cancel Offer for ${offerAmount} SOL`,{ variant: 'info' });
            //console.log('TransactionInstr:', TransactionInstr);
            const signedTransaction = await sendTransaction(transaction, connection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`Offer has been cancelled `,{ variant: 'success', action:snackaction });
                
            const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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
                                            memo_str = submemo.substr(init,fin-(init-1)); // include brackets
                                            memo_arr.push(memo_str);
                                            submemo = submemo.replace(memo_str, "");
                                            //console.log("pushed ("+mx+"):: "+memo_str + " init: "+init+" fin: "+fin);
                                            //console.log("submemo: "+submemo);
                                        }
                                    } else{
                                        let init = memo_str.indexOf('{');
                                        let fin = memo_str.indexOf('}');
                                        memo_str = memo_str.substr(init,fin); // include brackets
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
                
                enqueueSnackbar(`Preparing to BUY NOW: ${salePrice} SOL from: ${buyerPublicKey.toBase58()}`,{ variant: 'info' });
                //const signedTransaction = await sendTransaction(transaction, connection);
                //await connection.confirmTransaction(signedTransaction, 'processed');
                enqueueSnackbar(`Executing transfer for: ${mint.toString()}`,{ variant: 'info' });
                const signedTransaction2 = await sendTransaction(transaction, connection);
                
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                await ggoconnection.confirmTransaction(signedTransaction2, 'processed');
                closeSnackbar(cnfrmkey);
                const snackaction = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signedTransaction2}`} target='_blank'  sx={{color:'white'}}>
                        {signedTransaction2}
                    </Button>
                );
                enqueueSnackbar(`NFT transaction complete `,{ variant: 'success', action:snackaction });
                
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
                    
                    enqueueSnackbar(`Preparing to Deposit amount back in GrapeVine: ${depositAmount} SOL to: ${buyerPublicKey.toBase58()}`,{ variant: 'info' });
                    const signedTransaction = await sendTransaction(transaction, connection);
                    
                    const snackprogress = (key:any) => (
                        <CircularProgress sx={{padding:'10px'}} />
                    );
                    const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                    await ggoconnection.confirmTransaction(signedTransaction, 'processed');
                    closeSnackbar(cnfrmkey);
                    const snackaction = (key:any) => (
                        <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                            {signedTransaction}
                        </Button>
                    );
                    enqueueSnackbar(`Deposit back to GrapeVine completed`,{ variant: 'success', action:snackaction });
                }
                const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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
                        
                        {publicKey ? (
                            <>
                                {publicKey.toString() !== mintOwner ? (
                                    <Box
                                        sx={{
                                            pl:2,
                                            mb:3
                                        }}
                                    >
                                        <Typography component="div" variant="caption">
                                            Buy now: 
                                            {salePrice <= 0 ? 
                                                <>&nbsp;not listed for sale</>
                                            :
                                                <>
                                                {( (saleTimeAgo) ? 
                                                    <small>&nbsp;listed {saleTimeAgo}</small>
                                                :
                                                    (saleDate) && <>&nbsp;listed on {saleDate}</>
                                                )}
                                                </>
                                            }
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
                                            Selling now: 
                                            
                                            {salePrice <= 0 ? 
                                                <>&nbsp;not listed for sale</>
                                            :
                                                <>
                                                {( (saleTimeAgo) ? 
                                                    <small>&nbsp;listed {saleTimeAgo}</small>
                                                :
                                                    (saleDate) && <>&nbsp;listed on {saleDate}</>
                                                )}
                                                </>
                                            }
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
                                                                        BUY NOW CONFIRMATION
                                                                    </Typography>
                                                                </DialogTitle>
                                                                <DialogContent>
                                                                    <DialogContentText id="alert-bn-dialog-description">
                                                                    <br />
                                                                    <Alert 
                                                                        severity="info" variant="outlined"
                                                                        sx={{backgroundColor:'black'}}
                                                                        >
                                                                        Amount: {salePrice}<SolCurrencyIcon sx={{fontSize:"12px"}} /><br/>
                                                                        Mint: <MakeLinkableAddress addr={mint} trim={0} hasextlink={true} hascopy={false} fontsize={16} /> <br/>
                                                                        Owner: <MakeLinkableAddress addr={mintOwner} trim={0} hasextlink={true} hascopy={false} fontsize={16} /><br/>
                                                                        <Typography sx={{textAlign:'center'}}>
                                                                        Make sure the above is correct<br/>press Accept to proceed
                                                                        </Typography>
                                                                    </Alert>
                                                                    
                                                                    </DialogContentText>
                                                                </DialogContent>
                                                                <DialogActions>
                                                                    <Button onClick={handleAlertBuyNowClose}>Cancel</Button>
                                                                    <Button 
                                                                        onClick={() => handleBuyNow(salePrice)}
                                                                        autoFocus>
                                                                    Accept
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
                                                                            <AccountBalanceWalletIcon sx={{mr:1}}/> Buy Now
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
                                                                <Tooltip title={`The Marketplace requires ${TOKEN_VERIFICATION_AMOUNT} ${TOKEN_VERIFICATION_NAME} to make an offer`}>
                                                                    <Button sx={{borderRadius:'10px'}}>
                                                                        <Alert severity="warning" sx={{borderRadius:'10px'}}>
                                                                        Offers limited to {TOKEN_VERIFICATION_NAME} holders
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
                                                            <CancelIcon sx={{mr:1}}/> Cancel Listing
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
                                </Grid>
                            </>
                            )
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
                        <BallotIcon />
                        </ListItemIcon>
                        <ListItemText 
                            primary='Offers'
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
                                                    <TableCell><Typography variant="caption">Address</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">Offer</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">Date</Typography></TableCell>
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
                                                            CONFIRMATION
                                                        </Typography>
                                                    </DialogTitle>
                                                    <DialogContent>
                                                        <DialogContentText id="alert-dialog-description">
                                                        <br />
                                                        <Alert severity="info" variant="outlined" sx={{backgroundColor:'black'}} >
                                                            Amount: {final_offeramount}<SolCurrencyIcon sx={{fontSize:"12px"}} /><br/>
                                                            Mint: <MakeLinkableAddress addr={mint} trim={0} hasextlink={true} hascopy={false} fontsize={16} /> <br/>
                                                            From: <MakeLinkableAddress addr={final_offerfrom} trim={0} hasextlink={true} hascopy={false} fontsize={16} /><br/>
                                                            <Typography sx={{textAlign:'center'}}>
                                                            Make sure the above is correct<br/>press Accept to proceed
                                                            </Typography><br/>
                                                        </Alert>
                                                        
                                                        </DialogContentText>
                                                    </DialogContent>
                                                    <DialogActions>
                                                        <Button onClick={handleAlertClose}>Cancel</Button>
                                                        <Button 
                                                            onClick={() => handleAcceptOffer(final_offeramount, final_offerfrom)}
                                                            autoFocus>
                                                        Accept
                                                        </Button>
                                                    </DialogActions>
                                                </BootstrapDialog>

                                            {offers && offers.map((item: any) => (
                                                <>

                                                    {(item.state === 1) ? (
                                                        <TableRow>
                                                            <TableCell><Typography variant="body2">
                                                                <Tooltip title='View Profile'>
                                                                    <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item.buyeraddress}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                        {trimAddress(item.buyeraddress,4)}
                                                                    </Button>
                                                                </Tooltip>
                                                                <Tooltip title='Visit Explorer'>
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
                                                                        ACCEPT
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
            </>
        )
    }
}

function OfferPrompt(props: any) {
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

                    enqueueSnackbar(`Preparing to make an offer for ${+offer_amount} SOL`,{ variant: 'info' });
                    const signedTransaction = await sendTransaction(transaction, connection)
                    const snackprogress = (key:any) => (
                        <CircularProgress sx={{padding:'10px'}} />
                    );
                    const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                    await ggoconnection.confirmTransaction(signedTransaction, 'processed');
                    closeSnackbar(cnfrmkey);
                    const snackaction = (key:any) => (
                        <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                            {signedTransaction}
                        </Button>
                    );
                    enqueueSnackbar(`Offer sent `,{ variant: 'success', action:snackaction });
                    
                    const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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
                <SellIcon sx={{mr:1}}/> Make offer
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
                    MAKE AN OFFER
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
                        label={`Set your offer`}
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
                                Available Balance: {sol_balance} <SolCurrencyIcon sx={{fontSize:"10px"}} />
                                <ButtonGroup variant="text" size="small" aria-label="outlined primary button group" sx={{ml:1}}>
                                    <Button 
                                        onClick={() => {
                                            setOfferAmount((String)(sol_balance))}}
                                    > 
                                        Max 
                                    </Button>
                                    <Button  
                                        onClick={() => {
                                            setOfferAmount((String)(+sol_balance/2))}}
                                    > 
                                        Half
                                    </Button>
                                </ButtonGroup>
                                {(props.highestOffer > 0) && (
                                    <>
                                    <br/>Highest Offer: 
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
                            SUBMIT
                    </Button>
                </DialogActions>
                </form>
            </BootstrapDialog>   
        </React.Fragment>
    );

}

function GrapeVerified(props:any){

    let updateAuthority = props.updateAuthority;
    let verified = UPDATE_AUTHORITIES.indexOf(updateAuthority);
    
    if (verified > -1){
        return (
            <Tooltip title={`Update Authority Verified`}>
                <Button sx={{color:'white', borderRadius:'24px'}}>
                    <VerifiedIcon sx={{fontSize:"12px"}} />
                </Button>
            </Tooltip>
        );
    } else{
        return <></>
    }
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
    
    async function handleSellNow(event: any) {
        event.preventDefault();
        
        if (+sell_now_amount > 0) {
            handleCloseDialog();
            //const setSellNowPrice = async () => {
            try {
                const transaction = new Transaction();
                const transactionInstr = await sellNowListing(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, daoPublicKey);
                
                const instructionsArray = [transactionInstr.instructions].flat();        
                
                // we need to pass the transactions to realms not to the wallet, and then with the instructoin set we pass to the wallet only the ones from realms
                if (daoPublicKey){
                    const transactionInstr2 = await createDAOProposal(+sell_now_amount, mint, publicKey.toString(), mintOwner, weightedScore, daoPublicKey, connection, transactionInstr, sendTransaction);
                    
                    console.log("transactionInstr2: "+JSON.stringify(transactionInstr2));
                    const instructionsArray2 = [transactionInstr2.instructions].flat();
                    console.log("instructionsArray2: "+ JSON.stringify(instructionsArray2));
                    transaction.add(...instructionsArray2);
                } else {
                    transaction.add(
                        ...instructionsArray
                    );
                }
                
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
                
                const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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
                            PROPOSE A SELL NOW PRICE
                        </DialogTitle>
                        <form onSubmit={handleSellNow}>
                        <DialogContent>
                            <RegexTextField
                                regex={/[^0-9]+\.?[^0-9]/gi}
                                autoFocus
                                autoComplete='off'
                                margin="dense"
                                id="preview_sell_now_id"
                                label="Set your sale price"
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
                                        Price set in SOL <SolCurrencyIcon sx={{fontSize:"12px"}} />
                                    </Typography>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button 
                                type="submit"
                                variant="text" 
                                disabled={+sell_now_amount < 0.001}
                                title="Submit">
                                    SUBMIT
                            </Button>
                        </DialogActions>
                        </form>
                    </BootstrapDialog> 
                </>
            :
            <>
                <Grid item>
                    <Tooltip title={`This NFT is currently owned by a program and may be listed at a marketplace`}>
                        <Button sx={{borderRadius:'10px'}}>
                            <Alert severity="warning" sx={{borderRadius:'10px'}}>
                            LISTED/PROGRAM OWNED NFT
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
                enqueueSnackbar(`Preparing to set Sell Now Price to ${sell_now_amount} SOL`,{ variant: 'info' });
                const signedTransaction = await sendTransaction(transaction, connection);
                
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                await ggoconnection.confirmTransaction(signedTransaction, 'processed');
                closeSnackbar(cnfrmkey);
                const snackaction = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                        {signedTransaction}
                    </Button>
                );
                enqueueSnackbar(`Sell Now Price Set to ${sell_now_amount} SOL`,{ variant: 'success', action:snackaction });
                
                const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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
    return (
        <React.Fragment>
            <Button 
                size="large" 
                variant="outlined" 
                sx={{
                    borderRadius: '10px',
                }}
                value="Sell Now" onClick={handleClickOpenDialog}>
                <AccountBalanceWalletIcon sx={{mr:1}}/> Sell Now
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
                    SET SELL NOW PRICE
                </DialogTitle>
                <form onSubmit={handleSellNow}>
                <DialogContent>
                    <RegexTextField
                        regex={/[^0-9]+\.?[^0-9]/gi}
                        autoFocus
                        autoComplete='off'
                        margin="dense"
                        id="preview_sell_now_id"
                        label="Set your sale price"
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
                                Price set in SOL <SolCurrencyIcon sx={{fontSize:"12px"}} />
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        type="submit"
                        variant="text" 
                        disabled={+sell_now_amount < 0.001}
                        title="Submit">
                            SUBMIT
                    </Button>
                </DialogActions>
                </form>
            </BootstrapDialog>   
        </React.Fragment>
    );
}

function SocialLikes(props: any){
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isLiked, setIsLiked] = React.useState(false);
    const [loadingLikedState, setLoadingLikedState] = React.useState(false);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const {publicKey} = useWallet();
    const solanaProvider = useWallet();
    const mint = props.mint;
    
    const cyberConnect = new CyberConnect({
        namespace: 'Grape',
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    const getLikeStatus = async () => {
        
        if (publicKey){
            if (mint){
                setLoadingLikedState(true);
                let socialconnection = await fetchSearchAddrInfo(publicKey.toBase58(), mint);
                if (socialconnection){
                    //if (socialconnection?.identity){
                    if (socialconnection?.connections[0]?.followStatus) {  
                        if (socialconnection?.connections[0].type.toString() === "LIKE")
                            setIsLiked(socialconnection?.connections[0].followStatus.isFollowing);
                    }
                }
                setLoadingLikedState(false);
            }
            
        }
    }

    const fetchSearchAddrInfo = async (fromAddr:string, toAddr: string) => {
        const resp = await searchUserInfoQuery({
            fromAddr:fromAddr,
            toAddr,
            namespace: 'Grape',
            network: Network.SOLANA,
            type: 'LIKE',
        });
        if (resp) {
            setSearchAddrInfo(resp);
        }

        return resp;
    };

    const likeWalletConnect = async (followAddress:string) => {
        // address:string, alias:string
        let tofollow = followAddress;   
        let promise = await cyberConnect.connect(tofollow,'', ConnectionType.LIKE)
        .catch(function (error) {
            console.log(error);
        });
        getLikeStatus();
    };
    const likeWalletDisconnect = async (followAddress:string) => {
        // address:string, alias:string
        let promise = await cyberConnect.disconnect(followAddress.toString())
        .catch(function (error) {
            console.log(error);
        });
        getLikeStatus();
    };
    
    React.useEffect(() => {
        getLikeStatus();
    },[]);

    return ( 
        <>
        {loadingLikedState ?
            <Button 
                sx={{borderRadius:'24px'}}
            >
                <CircularProgress sx={{p:'14px',m:-2}} />
            </Button>
        :
            <>
            {isLiked ?  
                        <Button 
                            variant="text" 
                            title="Unlike"
                            onClick={() => likeWalletDisconnect(mint)}
                            size="small"
                            className="profileAvatarIcon"
                            sx={{borderRadius:'24px', color:'white'}}
                            >
                            <FavoriteIcon sx={{fontSize:'20px', color:'red'}} />
                        </Button>
                :
                        <Button 
                            variant="text" 
                            title="Like"
                            onClick={() => likeWalletConnect(mint)}
                            size="small"
                            className="profileAvatarIcon"
                            sx={{borderRadius:'24px', color:'white'}}
                            >
                            <FavoriteBorderIcon sx={{fontSize:'20px'}} />
                        </Button>
            }
            </>
        }
        </>
    );
}

function SocialFlags(props: any){
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isFlagged, setIsFlagged] = React.useState(false);
    const [loadingFlaggedState, setLoadingFlaggedState] = React.useState(false);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const {publicKey} = useWallet();
    const solanaProvider = useWallet();
    const mint = props.mint;

    const cyberConnect = new CyberConnect({
        namespace: 'Grape',
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    const getFlagStatus = async () => {
        
        if (publicKey){
            if (mint){
                setLoadingFlaggedState(true);
                let socialconnection = await fetchSearchAddrInfo(publicKey.toBase58(), mint);
                if (socialconnection){
                    //if (socialconnection?.identity){
                    if (socialconnection?.connections[0]?.followStatus) { 
                        if (socialconnection?.connections[0].type.toString() === "REPORT") 
                            setIsFlagged(socialconnection?.connections[0].followStatus.isFollowing);
                    }
                }
                setLoadingFlaggedState(false);
            }
            
        }
    }

    const fetchSearchAddrInfo = async (fromAddr:string, toAddr: string) => {
        const resp = await searchUserInfoQuery({
            fromAddr:fromAddr,
            toAddr,
            namespace: 'Grape',
            network: Network.SOLANA,
            type: 'REPORT',
        });
        if (resp) {
            setSearchAddrInfo(resp);
        }

        return resp;
    };

    const flagWalletConnect = async (followAddress:string) => {
        // address:string, alias:string
        let tofollow = followAddress;   

        let promise = await cyberConnect.connect(tofollow,'', ConnectionType.REPORT)
        .catch(function (error) {
            console.log(error);
        });
        getFlagStatus();
    };
    const flagWalletDisconnect = async (followAddress:string) => {
        // address:string, alias:string
        let promise = await cyberConnect.disconnect(followAddress.toString())
        .catch(function (error) {
            console.log(error);
        });
        getFlagStatus();
    };

    React.useEffect(() => {
        getFlagStatus();
    },[]);
    
    return ( 
        <>
        {loadingFlaggedState ?
            <Button 
                sx={{borderRadius:'24px'}}
            >
                <CircularProgress sx={{p:'14px',m:-2}} />
            </Button>
        :
            <>
            {isFlagged ?  
                        <Button 
                            variant="text" 
                            title="Unflag"
                            onClick={() => flagWalletDisconnect(mint)}
                            size="small"
                            className="profileAvatarIcon"
                            sx={{borderRadius:'24px', color:'yellow'}}
                            >
                            <FlagIcon sx={{fontSize:'20px'}} />
                        </Button>
                :
                        <Button 
                            variant="text" 
                            title="Flag"
                            onClick={() => flagWalletConnect(mint)}
                            size="small"
                            className="profileAvatarIcon"
                            sx={{borderRadius:'24px', color:'white'}}
                            >
                            <EmojiFlagsIcon sx={{fontSize:'20px'}} />
                        </Button>
            }
            </>
        }
        </>
    );
}

function GalleryItemMeta(props: any) {
    const collectionrawprimer = props.collectionrawdata.meta_primer || [];
    const collectionrawdata = props.collectionrawdata.meta_final || [];
    const collectionitem = props.collectionitem.collectionmeta || [];
    const [mint, setMint] = React.useState(props.mint || null);
    const [refreshOwner, setRefreshOwner] = React.useState(false);
    const [loadingOwner, setLoadingOwner] = React.useState(false);
    const [mintAta, setMintATA] = React.useState(null);
    const [tokenOwners, setTokenOwners] = React.useState(null);
    const [grape_member_balance, setGrapeMemberBalance] = React.useState(null);
    const [sol_portfolio_balance, setSolPortfolioBalance] = React.useState(0);
    const [grape_weighted_score, setGrapeWeightedScore] = React.useState(0);
    const [grape_governance_balance, setGrapeGovernanceBalance] = React.useState(null);
    const [grape_offer_threshhold, setGrapeOfferThreshhold] = React.useState(TOKEN_VERIFICATION_AMOUNT);
    const [open_offers_collapse, setOpenOffersCollapse] = React.useState(false);
    const [grape_whitelisted, setGrapeWhitelisted] = React.useState(null);
    const [open_creator_collapse, setOpenCreatorCollapse] = React.useState(false);
    const [open_attribute_collapse, setOpenAttributeCollapse] = React.useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [collectionItemImages, setCollectionItemImages] = useState([]);
    //const [pubkey, setPubkey] = React.useState(null);
    const [open_meta, setOpenMeta] = React.useState(false);
    const [open_offers, setOpenOffers] = React.useState(false);
    const [open_description, setOpenDescription] = React.useState(true);
    const [open_traits, setOpenTraits] = React.useState(true);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const {publicKey, sendTransaction} = useWallet();
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [loadingFollowState, setLoadingFollowState] = React.useState(false);
    const navigate = useNavigate();
    const { enqueueSnackbar, closeSnackbar} = useSnackbar();
    
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const solanaProvider = useWallet();

    const cyberConnect = new CyberConnect({
        namespace: 'Grape',
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    const fetchSearchAddrInfo = async (fromAddr:string, toAddr: string) => {
        const resp = await searchUserInfoQuery({
            fromAddr:fromAddr,
            toAddr,
            namespace: 'Grape',
            network: Network.SOLANA,
            type: 'FOLLOW',
        });
        if (resp) {
            setSearchAddrInfo(resp);
        }
  
        return resp;
    };

    const followWalletConnect = async (followAddress:string) => {
        // address:string, alias:string
        let tofollow = followAddress;   
        let promise = await cyberConnect.connect(tofollow)
        .catch(function (error) {
            console.log(error);
        });
        getFollowStatus();
    };
    const followWalletDisconnect = async (followAddress:string) => {
        // address:string, alias:string
        let promise = await cyberConnect.disconnect(followAddress.toString())
        .catch(function (error) {
            console.log(error);
        });
        getFollowStatus();
    };
    
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );
        
    const salePrice = props.salePrice || null;
    //console.log('GalleryItemMeta salePrice:', salePrice);
    const handleClickOpenTraits = () => {
        setOpenTraits(!open_traits);
    }

    const handleClickOpenMeta = () => {
        setOpenMeta(!open_meta);
    };

    const handleClickOpenOffers = () => {
        setOpenOffers(!open_offers);
    };
    const handleClickOpenDescription = () => {
        setOpenDescription(!open_description);
    };

    const handleSendItem = () => {
        
    };

    const openImageViewer = useCallback((index) => {
        setCurrentImage(index);
        setIsViewerOpen(true);
    }, []);

    const closeImageViewer = () => {
        setCurrentImage(0);
        setIsViewerOpen(false);
    };

    // after owner we can get the signatures for the 

    const getGovernanceBalance = async () => {
        try{
            const programId = new PublicKey(TOKEN_REALM_PROGRAM_ID);
            const realmId = new PublicKey(TOKEN_REALM_ID);
            const governingTokenMint = new PublicKey(TOKEN_VERIFICATION_ADDRESS);
            const governingTokenOwner = publicKey;

            const ownerRecords = await getTokenOwnerRecordForRealm(
                ggoconnection, 
                programId,
                realmId,
                governingTokenMint,
                governingTokenOwner
            );
            
            return ownerRecords;
        } catch(e){console.log("ERR: "+e);}
    }

    const fetchBalances = async () => {
        const body = {
          method: "getTokenAccountsByOwner",
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            publicKey.toString(),
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { encoding: "jsonParsed", commitment: "processed" },
          ],
          id: "35f0036a-3801-4485-b573-2bf29a7c77d2",
        };
    
          const response = await fetch(GRAPE_RPC_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
          })
          const json = await response.json();
          const resultValues = json.result.value
          return resultValues;
    
      };

    const GetTokenOwner = async (tokenAddress:any) => {
        //alert("HERE!")
        //let token_owner = await connection.getTokenLargestAccounts(new PublicKey(tokenAddress));//  Promise.all([GetLargestTokenAccounts()]);
        //console.log("Token Owner: "+JSON.stringify(token_owner));

        const body = {
          method: "getAccountInfo", // getAccountInfo
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            tokenAddress,
            {"encoding":"jsonParsed",
            "commitment":"confirmed"}
            // add <object> (optional) Commitment
          ],
          "id":1,
        };
    
        const response = await fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        
        const json = await response.json();
        const resultValues = json.result.value
        return resultValues;
    };

    const GetLargestTokenAccounts = async () => {
        const body = {
          method: "getTokenLargestAccounts", // getAccountInfo
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            mint,
            {"commitment":"confirmed"}
          ],
          "id":1,
        };
    
        const response = await fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        
        const json = await response.json();
        const resultValues = json.result.value
        return resultValues;
    };

    const fetchTokenAccountData = async () => {
        let [flargestTokenAccounts] = await Promise.all([GetLargestTokenAccounts()]);
        //console.log("settings setMintAta: "+JSON.stringify(flargestTokenAccounts));
        if (+flargestTokenAccounts[0].amount === 1){ // some NFTS are amount > 1
            setMintATA(flargestTokenAccounts[0].address);
        }
    }

    const fetchSOLBalance = async () => {
        const body = {
          method: "getBalance",
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            publicKey.toString()
          ],
          id: "35f0036a-3801-4485-b573-2bf29a7c77d3",
        };
    
        const response = await fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        
        const json = await response.json();
        const resultValues = json.result.value;
        return resultValues;
    };

    const getFollowStatus = async () => {
        
        if (publicKey){
            if (tokenOwners){
                if (tokenOwners.data.parsed.info.owner){
                    setLoadingFollowState(true);
                    let socialconnection = await fetchSearchAddrInfo(publicKey.toBase58(), tokenOwners?.data.parsed.info.owner);
                    if (socialconnection){
                        //if (socialconnection?.identity){
                        if (socialconnection?.connections[0]?.followStatus) {  
                            setIsFollowing(socialconnection?.connections[0].followStatus.isFollowing);
                        }
                    }
                    setLoadingFollowState(false);
                }
            }
        }
    }

    const getMintOwner = async () => {
        setLoadingOwner(true);
        let [tokenowner] = await Promise.all([GetTokenOwner(mintAta)]);
        setTokenOwners(tokenowner);
        fetchSolanaDomain(tokenowner?.data.parsed.info.owner);
        getFollowStatus();
        setLoadingOwner(false);
    }

    React.useEffect(() => {
        if (publicKey){
            console.log("pkey: "+publicKey.toBase58());
            getFollowStatus();
        }
    }, [publicKey]);

    const fetchTokenAccountOwnerHoldings = async () => {
        if (publicKey){ 
            let [sol_rsp, portfolio_rsp, governance_rsp] = await Promise.all([fetchSOLBalance(), fetchBalances(), getGovernanceBalance()]);
            setGrapeWhitelisted(GRAPE_WHITELIST.indexOf(publicKey.toString()));
            if (sol_rsp){ // use sol calc for balance
                setSolPortfolioBalance(parseFloat(new TokenAmount(sol_rsp, 9).format()));
            }
            try{

                if (governance_rsp?.account?.governingTokenDepositAmount){
                    setGrapeGovernanceBalance(governance_rsp?.account?.governingTokenDepositAmount);
                }else{    
                    setGrapeGovernanceBalance(0);
                }
            }catch(e){
                setGrapeGovernanceBalance(0);
                console.log("ERR: "+e);
            }

            try{
                setGrapeMemberBalance(0);
                let final_weighted_score = 0;
                portfolio_rsp.map((token:any) => {
                    let mint = token.account.data.parsed.info.mint;
                    let balance = token.account.data.parsed.info.tokenAmount.uiAmount;
                    if (mint === '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA'){ // check if wallet has sol
                        if (governance_rsp?.account?.governingTokenDepositAmount){
                            const total_grape = +balance + (+governance_rsp?.account?.governingTokenDepositAmount)/1000000
                            setGrapeMemberBalance(total_grape);
                            if (+total_grape >= 1000){
                                const weighted_score = total_grape/1000;
                                if (weighted_score<=0)
                                    final_weighted_score = 0;
                                else if (weighted_score<6)
                                    final_weighted_score = 1; 
                                else if (weighted_score<25)
                                    final_weighted_score = 2; 
                                else if (weighted_score<50)
                                    final_weighted_score = 3; 
                                else if (weighted_score>=50)
                                    final_weighted_score = 4; 
                                setGrapeWeightedScore(final_weighted_score);
                            }
                        } else{
                            setGrapeMemberBalance(balance);
                            if (+balance >= 1000){
                                const weighted_score = +balance/1000;
                                if (weighted_score<=0)
                                    final_weighted_score = 0;
                                else if (weighted_score<6)
                                    final_weighted_score = 1; 
                                else if (weighted_score<25)
                                    final_weighted_score = 2; 
                                else if (weighted_score<50)
                                    final_weighted_score = 3; 
                                else if (weighted_score>=50)
                                    final_weighted_score = 4; 
                                setGrapeWeightedScore(final_weighted_score);
                            }
                        }
                    }
                });
            } catch(e){console.log("ERR: "+e);}
            
        }
    }

    const HandleSetAvatar = async () => {
        try{
            const transaction = await createSetProfilePictureTransaction(publicKey, new PublicKey(mint), new PublicKey(mintAta));
            //console.log("Transaction: "+JSON.stringify(transaction));
            enqueueSnackbar(`Preparing set your avatar with ${mint} mint`,{ variant: 'info' });
            const signedTransaction = await sendTransaction(transaction, connection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`Your avatar has been set `,{ variant: 'success', action:snackaction });
        } catch(e){
            closeSnackbar();
            enqueueSnackbar(`Error: ${e}`,{ variant: 'error' });
            console.log("Error: "+e);
        } 
    }

    const SearchForMint = (props: any) => {
        const [open_dialog, setOpenPKDialog] = React.useState(false);
        const [mintKey, setInputMintValue] = React.useState('');
    
        const handleClickOpenDialog = () => {
            setOpenPKDialog(true);
        };
        
        const handleCloseDialog = () => {
            setOpenPKDialog(false);
        };
        
        function HandleMintAddressSubmit(event: any) {
            event.preventDefault();
            if ((mintKey.length >= 32) && 
                (mintKey.length <= 44)){
                // WalletId is base58 validate the type too later on
                props.setMintPubkey(mintKey);
                handleCloseDialog();
            } else{
                // Invalid Wallet ID
                console.log("INVALID MINT");
            }
        }
        
        return (
          <React.Fragment>
            <Button onClick={handleClickOpenDialog}
                sx={{borderRadius:'24px',color:'white'}}
            >
                <SearchIcon />
            </Button> 
             
            <BootstrapDialog 
                fullWidth={true}
                maxWidth={"md"}
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
                    Mint
                </DialogTitle>
                <form onSubmit={HandleMintAddressSubmit}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            autoComplete='off'
                            margin="dense"
                            id="preview_mint_key"
                            label="Paste a mint address"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={mintKey}
                            onChange={(e) => setInputMintValue(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button 
                            type="submit"
                            variant="text" 
                            title="GO">
                                Go
                        </Button>
                    </DialogActions>
                </form>
            </BootstrapDialog>   
          </React.Fragment>
        );
    }

    const fetchSolanaDomain = async (ownerPublicKey:string) => {
        if (ownerPublicKey){
            //console.log("checking domains for "+ownerPublicKey);
            const domain = await findDisplayName(ggoconnection, ownerPublicKey);
            if (domain){
                if (domain[0] !== ownerPublicKey)
                    setSolanaDomain(domain[0]);
            }
        }
    }
    
    React.useEffect(() => { 
        if (refreshOwner){
            //setTokenOwners(null);
            props.setRefresh(true);
        }
        if ((mintAta)||(refreshOwner)){
            getMintOwner();
            fetchTokenAccountOwnerHoldings();
        }
        if (refreshOwner){
            setRefreshOwner(!refreshOwner);
        }
    }, [mintAta, publicKey, refreshOwner]);
    
    React.useEffect(() => { 
        try{
            ( collectionitem?.image && 
                collectionItemImages.push(collectionitem.image)
            )
        } catch(e){
            console.log("ERR: "+e);
        }
        
        if (!tokenOwners){
            fetchTokenAccountData();
        }
    }, [mint]);

    try{
        return (
            <Grid>
                <Helmet>
                    <title>{`${collectionitem.name} Grape Social. Stateless. Marketplace.`}</title>
                    <meta property="og:title" content={`${collectionitem.name} @Grape`} />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content={window.location.href} />
                    <meta property="og:image" content={collectionitem.image} />
                    <meta property="og:description" content={collectionitem.name} />
                    <meta name="theme-color" content="#FF0000" />

                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:site" content={`${collectionitem.name} @Grape`} />
                    <meta name="twitter:title" content={collectionitem.name} />
                    <meta name="twitter:description" content={collectionitem.name} />
                    <meta name="twitter:image" content={collectionitem.image} />
                </Helmet>

                {isViewerOpen && (
                    <ImageViewer
                    src={ collectionItemImages }
                    currentIndex={ currentImage }
                    disableScroll={ false }
                    closeOnClickOutside={ true }
                    onClose={ closeImageViewer }
                    />
                )}

                <Box
                    sx={{
                        mt: 2,
                        
                    }}
                >
                    <Box
                        sx={{
                            borderRadius: '17px',
                            background: 'rgba(0, 0, 0, 0.6)',
                            mb: 4,
                            pl: 3,
                            pr: 3,
                            pt: 1,
                            pb: 1
                        }}
                        >
                            <Grid container direction="row" spacing={{ xs: 2, md: 3 }}>
                                <Grid item xs={6} md={8}>
                                    <ButtonGroup variant="text">
                                        <Button
                                            className="button icon-left"
                                            onClick={() => navigate(-1)}
                                            sx={{color:'white',borderRadius:'24px'}}
                                        >
                                            <ArrowBackIosIcon />
                                            Back
                                        </Button>
                                        <SearchForMint setMintPubkey={props.setMintPubkey} />
                                    </ButtonGroup>
                                </Grid>
                                <Grid item  xs={6} md={4}>
                                    <Box display="flex" justifyContent="flex-end">
                                        
                                        <SocialLikes mint={mint} />
                                        <SocialFlags mint={mint} />
                                        
                                        <Button sx={{borderRadius:'24px',background:'none'}}>
                                            <Avatar 
                                                component={Paper} 
                                                elevation={4}
                                                alt={collectionitem.name}
                                                src={collectionitem.image}
                                                sx={{ width: 26, height: 26, bgcolor: "#222", ml:1}}
                                            >
                                                
                                            </Avatar>
                                            <ShareSocialURL fontSize={'20px'} url={'https://grape.art'+GRAPE_PREVIEW+mint} title={'Grape DEX | '+trimAddress(mint,4)} />
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid> 
                    </Box>    
                    <Box
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                            p:3,
                            pl:4,
                            pr:4
                        }} 
                    >              
                        
                        <Grid container spacing={{ xs: 2, md: 3 }} >
                            <Grid item xs={12} sm={12} md={6}>
                                <Box
                                    sx={{ 
                                        width: '100%'
                                    }}
                                > 
                                    <List
                                        sx={{ 
                                            width: '100%'
                                        }}
                                        component="nav"
                                        >
                                        
                                            <ListItemText>
                                                <Grid 
                                                    container 
                                                    spacing={2}
                                                    direction="column"
                                                    alignItems="center"
                                                    justifyContent="center">
                                                        <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                                                            <ListItemButton
                                                                sx={{
                                                                    width:'100%',
                                                                    borderRadius:'25px',
                                                                    p: '2px'
                                                                }}
                                                            >
                                                                <img
                                                                    src={`${collectionitem.image}`}
                                                                    srcSet={`${collectionitem.image}`}
                                                                    alt={collectionitem.name}
                                                                    onClick={ () => openImageViewer(0) }
                                                                    loading="lazy"
                                                                    height="auto"
                                                                    style={{
                                                                        width:'100%',
                                                                        borderRadius:'24px'
                                                                    }}
                                                                />
                                                            </ListItemButton>
                                                        </Grid>
                                                        <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center', mt:'-15px'}}>
                                                            <Button
                                                                size="small" variant="text" 
                                                                onClick={ () => openImageViewer(0) }
                                                                sx={{color:'white',borderRadius:'24px'}}
                                                            >
                                                                Preview <OpenInFullIcon sx={{ fontSize:'16px', ml:1 }}/></Button>
                                                        </Grid>
                                                    </Grid>
                                                
                                            </ListItemText>
                                        
                                    </List>
                                </Box>
                                
                                <List
                                    sx={{ 
                                        width: '100%',
                                    }}
                                    component="nav"
                                >

                                    <Box
                                        sx={{ 
                                            p: 1,
                                            mb: 3, 
                                            width: '100%',
                                            background: '#13151C',
                                            borderRadius: '24px'
                                        }}
                                    > 
                                        
                                            <ListItemButton onClick={handleClickOpenDescription}
                                                sx={{borderRadius:'20px'}}
                                            >
                                                <ListItemIcon>
                                                <SegmentIcon />
                                                </ListItemIcon>
                                                <ListItemText primary="Description" />
                                                {open_description ? <ExpandLess /> : <ExpandMoreIcon />}
                                            </ListItemButton>
                                            <Collapse in={open_description} timeout="auto" unmountOnExit>
                                                <List component="div" disablePadding>
                                                    <ListItemText primary={collectionitem?.description} sx={{p:2}}  />
                                                </List>
                                            </Collapse>
                                            
                                    </Box>
                                    <Box
                                        sx={{ 
                                            p: 1, 
                                            width: '100%',
                                            background: '#13151C',
                                            borderRadius: '24px'
                                        }}
                                    >         
                                        
                                        <ListItemButton onClick={handleClickOpenMeta}
                                            sx={{borderRadius:'20px'}}
                                        >
                                            <ListItemIcon>
                                            <FormatListBulletedIcon />
                                            </ListItemIcon>
                                            <ListItemText primary="Details" />
                                            {open_meta ? <ExpandLess /> : <ExpandMoreIcon />}
                                        </ListItemButton>
                                        <Collapse in={open_meta} timeout="auto" unmountOnExit>
                                            <List component="div" sx={{ pl: 4 }}>
                                                <ListItemText>

                                                <TableContainer component={Paper}
                                                    sx={{
                                                        background: 'rgba(255,255,255,0.015)',
                                                        boxShadow: 3,
                                                        borderRadius: '20px'
                                                    }}
                                                >
                                                    <StyledTable 
                                                        sx={{ }} 
                                                        size="small" 
                                                        aria-label="NFT Meta">
                                                        
                                                        {collectionitem?.attributes ?
                                                            <React.Fragment>

                                                                {collectionitem.attributes?.length  && collectionitem.attributes.length > 0 ? (
                                                                    <></>
                                                                    )
                                                                :
                                                                <>
                                                                    <TableRow
                                                                        onClick={() => setOpenAttributeCollapse(!open_attribute_collapse)}
                                                                    >
                                                                        <TableCell>
                                                                        Attributes:
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {collectionitem.attributes.length}
                                                                            <IconButton
                                                                                aria-label="expand row"
                                                                                size="small"
                                                                                sx={{ textAlign:"right" }}
                                                                            >
                                                                                {open_attribute_collapse ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                            </IconButton>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                    <TableRow>
                                                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                                            <Collapse in={open_attribute_collapse} timeout="auto" unmountOnExit>
                                                                                <Box sx={{ margin: 1 }}>
                                                                                    <Table size="small" aria-label="purchases">

                                                                                        {collectionitem.attributes.length > 0 &&
                                                                                        <TableHead>
                                                                                            <TableRow>
                                                                                                <TableCell><Typography variant="subtitle1">Attribute</Typography></TableCell>
                                                                                                <TableCell><Typography variant="subtitle1" >Type</Typography></TableCell>
                                                                                            </TableRow>
                                                                                        </TableHead>
                                                                                        }
                                                                                        {collectionitem.attributes.length > 0 ? collectionitem.attributes?.map((item: any) => (
                                                                                            <TableRow>
                                                                                                <TableCell>{item?.trait_type}</TableCell>
                                                                                                <TableCell>{item?.value}</TableCell>
                                                                                            </TableRow>
                                                                                        ))  
                                                                                        :
                                                                                        <TableRow>
                                                                                            <TableCell>Attributes:</TableCell>
                                                                                            <TableCell>
                                                                                            {collectionitem.attributes.itemType?.length > 0 &&
                                                                                                <Tooltip title={`Type`}>
                                                                                                <Chip label={collectionitem.attributes?.itemType} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            {collectionitem.attributes.category?.length > 0 &&
                                                                                                <Tooltip title={`Category`}>
                                                                                                <Chip label={collectionitem.attributes?.category} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            {collectionitem.attributes.rarity?.length > 0 &&
                                                                                                <Tooltip title={`Rarity`}>
                                                                                                <Chip label={collectionitem.attributes?.rarity} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            {collectionitem.attributes.spec?.length > 0 &&
                                                                                                <Tooltip title={`Spec`}>
                                                                                                <Chip label={collectionitem.attributes?.spec} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            {collectionitem.attributes.class?.length > 0 &&
                                                                                                <Tooltip title={`Class`}>
                                                                                                <Chip label={collectionitem.attributes?.class} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            </TableCell>
                                                                                        </TableRow> 
                                                                                        }
                                                                                    </Table>
                                                                                </Box>
                                                                            </Collapse>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </>
                                                                }
                                                            </React.Fragment>
                                                        : null }

                                                        <TableRow>
                                                            <TableCell>Mint:</TableCell>
                                                            <TableCell>
                                                                <MakeLinkableAddress addr={mint} trim={5} hasextlink={true} hascopy={true} fontsize={14} />
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        <TableRow>
                                                            <TableCell>Owner:</TableCell>
                                                            <TableCell>
                                                                
                                                            {tokenOwners && (
                                                                <MakeLinkableAddress addr={tokenOwners?.data.parsed.info.owner} trim={5} hasextlink={true} hascopy={true} fontsize={14} />
                                                            )}  
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        {collectionitem?.symbol ? 
                                                            <TableRow>
                                                                <TableCell>Symbol:</TableCell>
                                                                <TableCell>{collectionitem.symbol}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionitem.seller_fee_basis_points > 0 ?
                                                            <TableRow>
                                                                <TableCell>Royalty:</TableCell>
                                                                <TableCell>
                                                                {(+collectionitem.seller_fee_basis_points/100).toFixed(2)}%
                                                                <Tooltip title={`This is the rate at which royalties are shared with creators if this asset is sold using the Metaplex Auction program`}><HelpOutlineIcon sx={{ fontSize:16, ml: 1  }}/></Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        : null }

    {collectionitem.properties?.creators ?
                                                            <React.Fragment>
                                                                <TableRow
                                                                    onClick={() => setOpenCreatorCollapse(!open_creator_collapse)}
                                                                >
                                                                    <TableCell>Creators:</TableCell>
                                                                    <TableCell>
                                                                        {collectionitem.properties.creators.length}
                                                                        <IconButton
                                                                            aria-label="expand row"
                                                                            size="small"
                                                                            sx={{ textAlign:"right" }}
                                                                        >
                                                                            {open_creator_collapse ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                        </IconButton>
                                                                        
                                                                    </TableCell>
                                                                </TableRow>
                                                                <TableRow>
                                                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                                        <Collapse in={open_creator_collapse} timeout="auto" unmountOnExit>
                                                                            <Box sx={{ margin: 1 }}>
                                                                                <Table size="small" aria-label="purchases">
                                                                                    <TableHead>
                                                                                        <TableRow>
                                                                                            <TableCell><Typography variant="caption">Creator Address</Typography></TableCell>
                                                                                            <TableCell align="right"><Typography variant="caption">% Royalty</Typography></TableCell>
                                                                                        </TableRow>
                                                                                    </TableHead>
                                                                                    {collectionitem.properties.creators.length > 0 && collectionitem.properties.creators.map((item: any) => (
                                                                                        <TableRow>
                                                                                            <TableCell>
                                                                                            <Button
                                                                                                title="Visit Profile"
                                                                                                component={Link} 
                                                                                                to={`${GRAPE_PROFILE}${item.address}`}
                                                                                            >
                                                                                                <AccountCircleOutlinedIcon sx={{fontSize:'14px'}}/>
                                                                                            </Button>
                                                                                                <MakeLinkableAddress addr={item.address} trim={5} hasextlink={true} hascopy={false} fontsize={14} />
                                                                                            </TableCell>
                                                                                            <TableCell align="right">{item.share}%</TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </Table>
                                                                            </Box>
                                                                        </Collapse>
                                                                    </TableCell>
                                                                </TableRow>
                                                            </React.Fragment>
                                                        : null }


                                                        {collectionitem?.edition ?
                                                            <TableRow>
                                                                <TableCell>Edition:</TableCell>
                                                                <TableCell>{collectionitem.edition}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionitem?.background_color ?
                                                            <TableRow>
                                                                <TableCell>Background:</TableCell>
                                                                <TableCell>#{collectionitem.background_color}</TableCell>
                                                            </TableRow>
                                                        : null }

                                                        {collectionrawdata?.updateAuthority ?
                                                            <TableRow>
                                                                <TableCell>Update Authority:</TableCell>
                                                                <TableCell>
                                                                    <MakeLinkableAddress addr={collectionrawdata.updateAuthority} trim={5} hasextlink={true} hascopy={false} fontsize={14} />
                                                                </TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionrawdata?.isMutable == 1 ?
                                                            <TableRow>
                                                                <TableCell>Mutable:</TableCell>
                                                                <TableCell><LockOpenIcon /></TableCell>
                                                            </TableRow>
                                                        : 
                                                            <TableRow>
                                                                <TableCell>Mutable:</TableCell>
                                                                <TableCell><Tooltip title={`This is immutable`}><LockIcon /></Tooltip></TableCell>
                                                            </TableRow> }
                                                        {collectionrawdata?.primarySaleHappened ? 
                                                            <TableRow>
                                                                <TableCell>Primary Sale:</TableCell>
                                                                <TableCell><CheckCircleIcon /></TableCell>
                                                            </TableRow>
                                                        : 
                                                        <TableRow>
                                                            <TableCell>Primary Sale:</TableCell>
                                                            <TableCell><Tooltip title={`Primary sale has not occured as of this fetch`}><BlockIcon /></Tooltip></TableCell>
                                                        </TableRow>
                                                        }

                                                        {collectionitem?.createdAt ?
                                                            <TableRow>
                                                                <TableCell>Created At:</TableCell>
                                                                <TableCell>{formatBlockTime(collectionitem.createdAt, false, false)}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionitem?.updatedAt ?
                                                            <TableRow>
                                                                <TableCell>Updated At:</TableCell>
                                                                <TableCell>{formatBlockTime(collectionitem.updatedAt, false, false)}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionitem?.deactivated ?
                                                            <TableRow>
                                                                <TableCell>Deactivated:</TableCell>
                                                                <TableCell><Tooltip title={`This is deactivated`}><CheckCircleIcon /></Tooltip></TableCell>
                                                            </TableRow>
                                                        : null }

                                                        {collectionitem.image ?
                                                            
                                                            <TableRow>
                                                                <TableCell>Image:</TableCell>
                                                                <TableCell>
                                                                    <Button size="small" variant="text" component="a" href={`${collectionitem.image}`} target="_blank">
                                                                        View Original <OpenInNewIcon sx={{fontSize:12, ml:1}} />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        : null}

                                                        {/*collectionrawprimer.owner ?
                                                            <TableRow>
                                                                <TableCell>Owner:</TableCell>
                                                                <TableCell>{collectionrawprimer.owner}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionrawprimer.executable ?
                                                            <TableRow>
                                                                <TableCell>Executable:</TableCell>
                                                                <TableCell>{collectionrawprimer.executable}</TableCell>
                                                            </TableRow>
                                                        : null */}
                                                    </StyledTable>
                                                </TableContainer>
                                                
                                                </ListItemText>
                                            </List>
                                        </Collapse>
                                    </Box>
                                </List>
                            </Grid>
                            <Grid item xs={12} sm={12} md={6}>
                                
                                <List
                                    sx={{ 
                                        width: '100%',
                                        p: 2
                                    }}
                                    component="nav"
                                    >       
                                    <ListItemText>

                                        <Box>
                                            <Typography component="div" variant="subtitle1">
                                                {collectionitem.symbol} <GrapeVerified updateAuthority={collectionrawdata?.updateAuthority} />
                                            </Typography>
                                            <Typography component="div" variant="h4" sx={{fontWeight:'800'}}>
                                                <strong>
                                                {collectionitem.name}
                                                </strong>
                                            </Typography>
                                            <Typography component="div" variant="caption">
                                                {tokenOwners && 
                                                    (<>
                                                        {(OTHER_MARKETPLACES.filter(e => e.address === tokenOwners?.data.parsed.info.owner).length > 0) ? (
                                                            <>
                                                                {(OTHER_MARKETPLACES.filter(e => e.address === tokenOwners?.data.parsed.info.owner)).map(filteredMarket => (
                                                                <>
                                                                Listed on 
                                                                    {(filteredMarket.name.length > 0) ? (
                                                                        <>  
                                                                            
                                                                            {(filteredMarket.previewUrl.length > 0) ? (
                                                                                <>
                                                                                    <Button size="small" variant="text" component="a" href={`${filteredMarket.previewUrl}${mint}`} target="_blank" sx={{ml:1}}>
                                                                                        {filteredMarket.logo &&
                                                                                        <Avatar 
                                                                                            component={Paper} 
                                                                                            elevation={4}
                                                                                            alt={filteredMarket.name}
                                                                                            src={filteredMarket.logo}
                                                                                            sx={{ width: 14, height: 14, bgcolor: "#eee", mr:0.5}}
                                                                                        />
                                                                                        }
                                                                                        {filteredMarket.name} <OpenInNewIcon sx={{fontSize:'14px', ml:1}} />
                                                                                    </Button>
                                                                                </>
                                                                            ):(
                                                                                <>
                                                                                    <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/address/${mint}`} target="_blank" sx={{ml:1}}>
                                                                                        {filteredMarket.logo &&
                                                                                        <Avatar 
                                                                                            component={Paper} 
                                                                                            elevation={4}
                                                                                            alt={filteredMarket.name}
                                                                                            src={filteredMarket.logo}
                                                                                            sx={{ width: 14, height: 14, bgcolor: "#eee", mr:0.5}}
                                                                                        />
                                                                                        }
                                                                                        {filteredMarket.name} 
                                                                                        <OpenInNewIcon sx={{fontSize:'14px', ml:1}} />
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                        </>
                                                                    ):(
                                                                        <>
                                                                        {trimAddress(tokenOwners?.data.parsed.info.owner, 4)}
                                                                        </>
                                                                    )}
                                                                </>
                                                                ))}
                                                            </>
                                                        )
                                                        :
                                                        (
                                                            <>
                                                            {!loadingOwner ?
                                                            <Grid container direction="row">
                                                                <Grid item>
                                                                {solanaDomain && solanaDomain.length > 0 ?
                                                                <>
                                                                    Owned by 
                                                                    <Tooltip title={`Visit profile`}>
                                                                        <Button
                                                                            component={Link} 
                                                                            to={`${GRAPE_PROFILE}${tokenOwners?.data.parsed.info.owner}`}
                                                                            sx={{borderRadius:'24px', color:'white'}}
                                                                        >
                                                                            <Typography variant="caption">
                                                                                <strong>{solanaDomain}</strong>
                                                                            </Typography>
                                                                        </Button>
                                                                    </Tooltip>
                                                                </>
                                                                :
                                                                <>
                                                                    Owned by 
                                                                    <Tooltip title={`Visit profile`}>
                                                                        <Button
                                                                            component={Link} 
                                                                            to={`${GRAPE_PROFILE}${tokenOwners?.data.parsed.info.owner}`}
                                                                            sx={{borderRadius:'24px', color:'white'}}
                                                                        >
                                                                            <Typography variant="caption">
                                                                                <strong>{trimAddress(tokenOwners?.data.parsed.info.owner, 4)}</strong>
                                                                            </Typography>
                                                                        </Button>
                                                                    </Tooltip>

                                                                </>
                                                                }
                                                                
                                                                </Grid>
                                                                <Grid item 
                                                                    sx={{ 
                                                                        display: "flex",
                                                                        justifyContent: 'flex-end'
                                                                    }}>
                                                                    <Tooltip title={`Explorer`}>
                                                                        <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/address/${tokenOwners?.data.parsed.info.owner}`} target="_blank" sx={{borderRadius:'24px', color:'white', pl:0, pr:0}}> <OpenInNewIcon sx={{fontSize:'14px'}} /></Button>
                                                                    </Tooltip>
                                                                    {publicKey && publicKey.toBase58() === tokenOwners?.data.parsed.info.owner ?
                                                                        <Tooltip title={`Set this NFT as your avatar`}>
                                                                            <Button 
                                                                                variant="text" 
                                                                                title="Set Avatar"
                                                                                onClick={HandleSetAvatar}
                                                                                size="small"
                                                                                className="profileAvatarIcon"
                                                                                sx={{borderRadius:'24px', color:'white'}}
                                                                                >
                                                                                <AccountCircleOutlinedIcon 
                                                                                    sx={{
                                                                                        fontSize:'14px',
                                                                                    }} 
                                                                                />
                                                                            </Button>
                                                                        </Tooltip>
                                                                    :
                                                                    <>
                                                                        {loadingFollowState ?
                                                                            <Button 
                                                                                sx={{borderRadius:'24px'}}
                                                                            >
                                                                                <CircularProgress sx={{p:'14px',m:-2}} />
                                                                            </Button>
                                                                        :
                                                                            <>
                                                                            {isFollowing ?  
                                                                                    <Button 
                                                                                        variant="text" 
                                                                                        title="Unfollow"
                                                                                        onClick={() => followWalletDisconnect(tokenOwners?.data.parsed.info.owner)}
                                                                                        size="small"
                                                                                        className="profileAvatarIcon"
                                                                                        sx={{borderRadius:'24px', color:'white'}}
                                                                                        >
                                                                                        <PersonRemoveOutlinedIcon sx={{fontSize:'14px'}} />
                                                                                    </Button>
                                                                                :
                                                                                    <Button 
                                                                                        variant="text" 
                                                                                        title="Follow"
                                                                                        onClick={() => followWalletConnect(tokenOwners?.data.parsed.info.owner)}
                                                                                        size="small"
                                                                                        className="profileAvatarIcon"
                                                                                        sx={{borderRadius:'24px', color:'white'}}
                                                                                        >
                                                                                        <PersonAddOutlinedIcon sx={{fontSize:'14px'}} />
                                                                                    </Button>
                                                                            }
                                                                            </>
                                                                        }
                                                                    </>
                                                                    }

                                                                </Grid>
                                                                
                                                            </Grid>
                                                            :<>Loading owner</>}
                                                            </>
                                                        )
                                                    }
                                                    </>
                                                    )
                                                }  
                                            </Typography>
                                        </Box>
                                    </ListItemText>
                                </List>
                                
                                {tokenOwners?.data.parsed.info.owner &&
                                    <ItemOffers
                                        mintAta={mintAta} 
                                        mintOwner={tokenOwners?.data.parsed.info.owner} 
                                        mint={mint} 
                                        refreshOwner={refreshOwner}
                                        setRefreshOwner={setRefreshOwner} 
                                        setRefresh={props.setRefresh} 
                                        grape_member_balance={grape_member_balance}
                                        grape_governance_balance={grape_governance_balance}
                                        grape_offer_threshhold={grape_offer_threshhold}
                                        grape_weighted_score={grape_weighted_score}
                                        grape_whitelisted={grape_whitelisted}
                                        sol_portfolio_balance={sol_portfolio_balance}
                                        />
                                }
                                

                                {collectionitem.attributes?.length && collectionitem.attributes.length > 0 ? (
                                    <Box
                                        sx={{ 
                                            p: 1, 
                                            width: '100%',
                                            background: '#13151C',
                                            borderRadius: '24px'
                                        }}
                                    > 
                                        <ListItemButton onClick={handleClickOpenTraits}
                                            sx={{borderRadius:'20px'}}
                                        >
                                            <ListItemIcon>
                                            <FormatListBulletedIcon />
                                            </ListItemIcon>
                                            <ListItemText primary="Traits" />
                                            {open_traits ? <ExpandLess /> : <ExpandMoreIcon />}
                                        </ListItemButton>
                                        <Collapse in={open_traits} timeout="auto" unmountOnExit>
                                            <List
                                                sx={{ 
                                                    width: '100%'
                                                }}
                                                component="nav"
                                                >       
                                                <ListItemText>
                                                    <Grid item alignItems="center">
                                                        {collectionitem.attributes?.length && collectionitem.attributes.length > 0 && (
                                                            <>
                                                                {collectionitem.attributes?.map((item: any) => (
                                                                    <Chip 
                                                                        sx={{
                                                                            padding:'22.5px',
                                                                            margin: '5px',
                                                                            textAlign: 'center',
                                                                            background: '#272727',
                                                                            borderRadius: '10px'
                                                                        }}
                                                                        label={
                                                                            <>
                                                                                <strong>{item?.trait_type}</strong>
                                                                                <Divider />
                                                                                {item?.value}
                                                                            </>} />
                                                                        
                                                                ))}
                                                            </>  
                                                            )
                                                        }
                                                    </Grid>
                                                </ListItemText>
                                            </List>
                                        </Collapse>
                                    </Box>
                                )
                                : <></>
                                }
                                    
                            </Grid>
                        </Grid>    
                    
                    </Box>
                    {/*
                    <CardActions
                        sx={{
                            display: "flex",
                            justifyContent: 'flex-end',
                            padding: 1
                        }}
                    >
                        <OfferPrompt mint={mint} />
                    </CardActions>
                    */}
                </Box>  
            </Grid>
        );
    } catch(e){ 
        console.log("ERR: "+e);
        return null 
    }
}

function intFromBytes( x: any ){
    var val = 0;
    for (var i = 0; i < x.length; ++i) {        
        val += x[i];        
        if (i < x.length-1) {
            val = val << 8;
        }
    }
    return val;
}

function getInt64Bytes( x: any ){
    var bytes = [];
    var i = 8;
    do {
        bytes[--i] = x & (255);
        x = x>>8;
    } while ( i )
    return bytes;
}

type Props = {
    children: React.ReactElement;
    waitBeforeShow?: number;
};

export function PreviewView(this: any, props: any) {
    const [collection, setCollection] = React.useState(null);
    //const isConnected = session && session.isConnected;
    const [loading, setLoading] = React.useState(false);
    //const [success, setSuccess] = React.useState(false);
    const [mint, setMintPubkey] = React.useState(null);
    const [refresh, setRefresh] = React.useState(false);
    
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const urlParams = searchParams.get("pkey") || handlekey;

    //const [pubkey, setPubkey] = React.useState(null);
    const [walletPKId, setInputPKValue] = React.useState(null);
    
    const history = useNavigate();
    //const location = useLocation();
    
    function HandlePKSubmit(event: any) {
        event.preventDefault();
        console.log("Sending: "+walletPKId);
        
        if (ValidateAddress(walletPKId)){
            // WalletId is base58 validate the type too later on
            setMintPubkey(walletPKId);
            //setPubkey(walletPKId);
            //props.setPubkey(walletPKId);
        } else{
            // Invalid Wallet ID
            console.log("INVALID MINT ID");
        }
    }
    const CollectionProfileClear = (props: any) => {
        // TODO:
        // Add button next to collection to clear navigation address
        // this should only appear if the user is logged in (has a pubkey from session)
        return (
            <React.Fragment></React.Fragment>
        );
    }

    const PreviewItem = (props: any) => {
        const [thismint, setThisMint] = React.useState(props.mint);
        const [expanded, setExpanded] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const [collectionmeta, setCollectionMeta] = React.useState(null);
        const [collectionrawdata, setCollectionRaw] = React.useState(null);
        const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
        const { connection } = useConnection();
        
        const handleExpandClick = () => {
            setExpanded(!expanded);
        };
        
        const MD_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
        const getCollectionData = async () => {
            try {
                let mint_address = new PublicKey(mint)
                let [pda, bump] = await PublicKey.findProgramAddress([
                    Buffer.from("metadata"),
                    MD_PUBKEY.toBuffer(),
                    new PublicKey(mint_address).toBuffer(),
                ], MD_PUBKEY)
                
                const meta_response = await ggoconnection.getAccountInfo(pda);

                let meta_final = decodeMetadata(meta_response.data);
                setCollectionRaw({meta_final,meta_response});
                
                const metadata = await fetch(meta_final.data.uri).then(
                    (res: any) => res.json());
                
                return metadata;
            } catch (e) { // Handle errors from invalid calls
                console.log(e);
                return null;
            }
        }
        
        const getCollectionMeta = async () => {
            if (!loading){
                setLoading(true);
                let [collectionmeta] = await Promise.all([getCollectionData()]);
                setCollectionMeta({
                    collectionmeta
                });
    
                setLoading(false);
            }
        }
    
        useEffect(() => {
            const interval = setTimeout(() => {
                getCollectionMeta();
            }, 500);
            return () => clearInterval(interval); 
        }, [thismint]);
        
        if((!collectionmeta)||
            (loading)){
            
            return (
                <Card
                    sx={{
                        borderRadius: '20px',
                    }}
                >
                    <Skeleton 
                        sx={{
                            borderRadius: '20px',
                        }}
                        variant="rectangular" width="100%" height={325} />
                </Card>
            )
        } //else{
        {   
            let image = collectionmeta.collectionmeta?.image || null;
            if (!image){
                console.log("ERR: " + JSON.stringify(collectionmeta));
                return null;
            }else{
            //console.log("Mint: "+mint);
            //if ((collectionmeta)&&(!loading)){
            //if (image){
                return (
                        <GalleryItemMeta collectionitem={collectionmeta} collectionrawdata={collectionrawdata} mint={mint} setRefresh={setRefresh} setMintPubkey={setMintPubkey} />
                );
            }
            //}
        }
    }

    React.useEffect(() => { 
        if (refresh)
            setRefresh(!refresh);
        
        if (mint && ValidateAddress(mint)){
            //props.history.push({
            history({
                pathname: GRAPE_PREVIEW+mint
            },
                { replace: true }
            );
        } else {
            history({
                pathname: '/preview'
            },
                { replace: true }
            );
        } 
        
    }, [mint, refresh]);

    if (!mint){
        if (urlParams?.length > 0){
            setMintPubkey(urlParams);
        }
    }

    return (
        <React.Fragment>
                { mint && ValidateAddress(mint) ?
                    <PreviewItem mint={mint} />
                : 
                    <Paper className="grape-paper-background">
                        <Grid 
                            className="grape-paper" 
                            container
                            spacing={0}>
                            <Grid item>
                                <Typography 
                                    align="center"
                                    variant="h3">
                                    {'Invalid Mint'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                }
                
        </React.Fragment>
    );
}