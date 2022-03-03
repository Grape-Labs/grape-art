import React, { useEffect, useState, useCallback, memo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { render } from "react-dom";
import { decodeMetadata } from '../utils/grapeTools/utils'
// @ts-ignore
import fetch from 'node-fetch'
import ImageViewer from 'react-simple-image-viewer';
import InfiniteScroll from 'react-infinite-scroll-component';

import { findDisplayName } from '../utils/name-service';

import CyberConnect, { Env, Blockchain, solana } from '@cyberlab/cyberconnect';
import { FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';
import { formatAddress, removeDuplicate, isValidAddr } from '../utils/cyberConnect/helper';
import { useWeb3 } from '../utils/cyberConnect/web3Context';
import { followListInfoQuery, searchUserInfoQuery } from '../utils/cyberConnect/query';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProfilePicture } from '@solflare-wallet/pfp';

import { TokenAmount, lt } from '../utils/grapeTools/safe-math';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';

import { Helmet } from 'react-helmet';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'

import { useNavigate } from 'react-router';
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
    Pagination,
    Stack,
    Typography,
    Grid,
    Box,
    Skeleton,
    Avatar,
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    Card,
    CardActionArea,
    CardMedia,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemButton,
    Tab,
    Tabs,
    InputBase,
    Tooltip,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Paper,
    Container,
    ListItemIcon,
    SpeedDial,
    Hidden,
    ButtonGroup,
    SpeedDialIcon,
    SpeedDialAction,
    FormControl,
    FormControlLabel,
    FormLabel,
} from '@mui/material';

import { SpeedDialProps } from '@mui/material/SpeedDial';
import { red } from '@mui/material/colors';

import MuiAlert, { AlertProps } from '@mui/material/Alert';

import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';

import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';
import RssFeedOutlinedIcon from '@mui/icons-material/RssFeedOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import ExploreIcon from '@mui/icons-material/Explore';
import MessageIcon from '@mui/icons-material/Message';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import HomeIcon from '@mui/icons-material/Home';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import GrapeIcon from '../components/static/GrapeIcon';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';
import CancelIcon from '@mui/icons-material/Cancel';

import { GRAPE_RPC_ENDPOINT, GRAPE_RPC_REFRESH, GRAPE_PREVIEW, GRAPE_PROFILE, FEATURED_DAO_ARRAY } from '../utils/grapeTools/constants';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';
import { MakeLinkableAddress, ValidateAddress, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { getMintOwner } from "../utils/auctionHouse/helpers/helpers";
import { cancelWithdrawOffer } from '../utils/auctionHouse/cancelWithdrawOffer';
import { cancelOffer } from '../utils/auctionHouse/cancelOffer';
import { withdrawOffer } from '../utils/auctionHouse/withdrawOffer';
import { AccessTimeSharp, CollectionsOutlined, ConstructionOutlined, ContentCutOutlined } from "@mui/icons-material";
import { relative } from "path";

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

const PubKeyDialog = (props: any) => {
    const [open_dialog, setOpenPKDialog] = React.useState(false);
    const [walletPKId, setInputPKValue] = React.useState('');

    const handleClickOpenDialog = () => {
        setOpenPKDialog(true);
    };
    
    const handleCloseDialog = () => {
        setInputPKValue("");
        setOpenPKDialog(false);
    };

    function HandlePKSubmit(event: any) {
        event.preventDefault();
        if ((walletPKId.length >= 32) && 
            (walletPKId.length <= 44)){
            // WalletId is base58 validate the type too later on
            props.setPubkey(walletPKId);
            handleCloseDialog();
        } else{
            // Invalid Wallet ID
            console.log("INVALID WALLET ID");
        }
    }
    
    return (
      <React.Fragment>
        <Button size="small" variant="text" value="Search with WalletID" onClick={handleClickOpenDialog}
            sx={{borderRadius:'24px'}}
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
                Public Key
            </DialogTitle>
            <form onSubmit={HandlePKSubmit}>
            <DialogContent>
                <TextField
                    autoFocus
                    autoComplete='off'
                    margin="dense"
                    id="collection_wallet_id"
                    label="Paste a public key"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={walletPKId}
                    onChange={(e) => setInputPKValue(e.target.value)}
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


/*
  LAYOUT:
    0 ['key', 'u8'] (Uninitialized=0, MetadataV1=4)
    1 ['updateAuthority', 'pubkey'], (ignore)
    33 ['mint', 'pubkey'], (filter)
    65 ['data', Data],
    72+0 name (borsh string)
    72+x symbol (borsh string)
    72+x uri (borsh string)
 */

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

const GalleryItem = (props: any) => {
    const collectionitem = props.collectionitem || [];
    const mint = collectionitem?.wallet?.account.data.parsed.info.mint || null;
    const [expanded, setExpanded] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [collectionmeta, setCollectionMeta] = React.useState(null);
        //const [collectionrawdata, setCollectionRaw] = React.useState(props.collectionitemmeta || null);
        
        const handleExpandClick = () => {
            setExpanded(!expanded);
        };

        const MD_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
        const getCollectionData = async () => {
            try {
                let meta_primer = collectionitem;
                let buf = Buffer.from(meta_primer.data, 'base64');
                let meta_final = decodeMetadata(buf);
                
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

                if (mint)
                    getCollectionMeta();
            }, 500);
            return () => clearInterval(interval); 
        }, [collectionitem]);
        
        if((!collectionmeta)||
            (loading)){
            //getCollectionMeta();
            //setTimeout(getCollectionMeta(), 250);
            return (
                <ListItemButton
                    sx={{
                        width:'100%',
                        borderRadius:'25px',
                        p: '2px',
                        mb: 5
                    }}
                >
                    <Skeleton 
                        sx={{
                            borderRadius:'25px',
                        }}
                        variant="rectangular" width={325} height={325} />
                </ListItemButton>
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
                    
                        <Grid 
                            container 
                            alignItems="center"
                            justifyContent="center">
                            <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                                <ListItemButton
                                    component={Link} to={`${GRAPE_PREVIEW}${mint}`}
                                    sx={{
                                        width:'100%',
                                        borderRadius:'25px',
                                        p: '2px'
                                    }}
                                >
                                    <img
                                        src={`${image}`}
                                        srcSet={`${image}`}
                                        alt={collectionmeta.collectionmeta?.name}
                                        //onClick={ () => openImageViewer(0) }
                                        loading="lazy"
                                        height="auto"
                                        style={{
                                            width:'100%',
                                            borderRadius:'24px'
                                        }}
                                    />
                                </ListItemButton>
                            </Grid>
                            <Grid item sx={{display:'flex'}}>
                                <Box
                                    sx={{p:1}}
                                >
                                    <Typography variant="caption">
                                        {collectionmeta.collectionmeta?.name}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                );
            }
            //}
        }
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
    >
        {value === index && (
        <Box sx={{ p: 0 }}>
            <Typography>{children}</Typography>
        </Box>
        )}
    </div>
    );
}

const FeedView = (props: any) => {
    const [loading, setLoading] = React.useState(false);
    const [limit, setLimit] = React.useState(25);
    const [maxPage, setMaxPage] = React.useState(false);
    const [beforeSignature, setBeforeSignature] = React.useState(null);
    const [featured, setFeatured] = React.useState(null);
    const [featuredmeta, setFeaturedMeta] = React.useState(null);
    const [mergedfeaturedmeta, setMergedFeaturedMeta] = React.useState(null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();

    const [saleTimeAgo, setSaleTimeAgo] = React.useState(null);
    const MD_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    
    const statestruct = ['Withdraw', 'Offer', 'Sale', 'Accepted from listing', 'Buy Now', 'Cancel', ''];

    const FeaturedItem = (props: any) => {
        const [finalMeta, setFinalMeta] = React.useState(null);
        const itemraw = props.itemmeta;
        //const itemdata = props.itemdata;

        const getCollectionItemData = async () => {
            try {
                //console.log("RAW: "+JSON.stringify(itemraw));
                let meta_primer = itemraw;
                let buf = Buffer.from(itemraw.data, 'base64');
                let meta_final = decodeMetadata(buf);
                //setCollectionRaw({meta_final,meta_primer});
    
                const metadata = await fetch(meta_final.data.uri).then(
                    (res: any) => res.json());
                
                return metadata;
            } catch (e) { // Handle errors from invalid calls
                console.log(e);
                return null;
            }
        }

        const getMeta = async () => {
            let final_meta = await getCollectionItemData();
            setFinalMeta(final_meta);
        }

        React.useEffect(() => { 
            if ((itemraw)&&(!finalMeta)){
                getMeta();
            }
        }, [itemraw]);


        //console.log("HERE: "+JSON.stringify(item));

        if (!finalMeta){
            return <><CircularProgress /></>
        } else{
            return (
                <Container
                    style={{overflow:'hidden', position:'relative', margin:0, padding:0}}
                >
                    <Container
                        sx={{
                            position:'relative',
                            background: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '26px',
                            overflow:'hidden',
                            mt:2,
                            mb:2,
                            ml:0,
                            mr:0,
                            p:0,
                            backgroundSize: "cover",
                        }} 
                    >
                    <img
                        src={finalMeta?.image}
                        alt=""
                        style={{
                            opacity: '0.1',
                            position: 'absolute',
                            borderRadius: '26px',
                            marginTop:2,
                            marginBottom:2,
                            padding:1,
                            top:'-20%',
                            left:'-20%',
                            width:'150%'
                        }}
                    />
                    
                    <Grid 
                        container 
                        direction='row'
                        >
                            <Grid item xs={12} sm={12} md={6}>
                                <Grid 
                                    container 
                                    alignItems="center"
                                    justifyContent="center">
                                    <Grid item sx={{display:'column',justifyContent:'center',alignItems:'center', p:0}}>
                                        <Box
                                            sx={{
                                                background: 'rgba(0, 0, 0, 0.6)',
                                                borderRadius: '26px',
                                                width:'100%',
                                                p:'2px',
                                            }} 
                                        >
                                            <ListItemButton
                                                component={Link} to={`${GRAPE_PREVIEW}${itemraw.memo.mint}`}
                                                sx={{
                                                    borderRadius:'25px',
                                                    p: 0
                                                }}
                                            >
                                                <img
                                                    src={`${finalMeta?.image}`}
                                                    srcSet={`${finalMeta?.image}`}
                                                    alt={finalMeta?.name}
                                                    //onClick={ () => openImageViewer(0) }
                                                    loading="lazy"
                                                    height="auto"
                                                    style={{
                                                        width:'100%',
                                                        borderRadius:'24px',
                                                        padding:0
                                                    }}
                                                />
                                            </ListItemButton>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Grid>
                            
                            <Grid item xs={12} sm={12} md={6}>
                                <Container
                                    sx={{
                                        minWidth: '100%',
                                        minHeight:'100%',
                                        m:1,
                                        p:0
                                    }} 
                                >
                                    <Container>
                                    {finalMeta?.symbol &&
                                        <Typography variant="caption">
                                            {finalMeta?.symbol}
                                        </Typography>
                                        }
                                        <Typography variant="h4">
                                            {finalMeta?.name}
                                        </Typography>
                                        
                                        <Box
                                            sx={{
                                                background: 'rgba(0, 0, 0, 0.9)',
                                                minWidth: '100%',
                                                minHeight:'100%',
                                                p:1.5,
                                                mt:1,
                                                borderRadius:'24px',
                                            }} 
                                        >
                                            <Typography sx={{fontSize:'30px'}}>
                                                {statestruct[itemraw.memo.state]} <strong>{itemraw.memo.amount}</strong> <SolCurrencyIcon sx={{fontSize:"18px", mr:0.5 }}/>
                                            </Typography>
                                            <Typography variant="caption">
                                            - {itemraw.memo.timestamp} 
                                            </Typography>
                                            <Typography variant="caption">
                                                <Button size="small" sx={{fontSize:'10px'}} component="a" href={`https://explorer.solana.com/address/${itemraw.memo.mint}`} target="_blank">{trimAddress(itemraw.memo.mint,5)} <OpenInNewIcon sx={{fontSize:'14px', ml:1}} /></Button>
                                            </Typography>
                                            <Typography component="div" variant="caption" sx={{mt:1,mb:1}}>
                                            {finalMeta?.description}
                                            </Typography>
                                            
                                            <Button 
                                                className="buyNowButton"
                                                component={Link} 
                                                to={`${GRAPE_PREVIEW}${itemraw.memo.mint}`}
                                            >
                                                View
                                            </Button>
                                        </Box>
                                    </Container>
                                </Container>
                            </Grid>
                            
                        </Grid>
                    </Container>
                </Container>
            )
        }
    }
    
    const getCollectionData = async (mintarr:string[]) => {
        try {
            let mintsPDAs = new Array();
            
            for (var value of mintarr){
                if (value){
                    let mint_address = new PublicKey(value);
                    let [pda, bump] = await PublicKey.findProgramAddress([
                        Buffer.from("metadata"),
                        MD_PUBKEY.toBuffer(),
                        new PublicKey(mint_address).toBuffer(),
                    ], MD_PUBKEY)

                    if (pda){
                        //console.log("pda: "+pda.toString());
                        mintsPDAs.push(pda);
                    }
                    
                }
            }

            const metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
            
            // LOOP ALL METADATA WE HAVE
            for (var metavalue of metadata){
                
                try{
                    let meta_primer = metavalue;
                    let buf = Buffer.from(metavalue.data);
                    let meta_final = decodeMetadata(buf);
                    
                }catch(etfm){console.log("ERR: "+etfm + " for "+ JSON.stringify(metavalue));}
            }

            return metadata;
            
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getFeatured = async () => {
        
        if (!loading){
            setLoading(true);
            const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
            const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
            const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
            //let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mint)).toBuffer())], auctionHouseKey);
            //let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((publicKey).toBuffer())], auctionHouseKey);
            //let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
            
            /*
            console.log("derivedMintPDA: "+derivedMintPDA);
            console.log("derivedBuyerPDA: "+derivedBuyerPDA);
            console.log("derivedOwnerPDA: "+derivedOwnerPDA);
            */
        
            let result = await ggoconnection.getSignaturesForAddress(auctionHouseKey, {limit: 100});
            let ahListings: any[] = [];
            let ahListingsMints: any[] =[];
            let exists = false;
            let cntr = 0;
            let cnt = 0;

            let signatures: any[] = [];
            for (var value of result){
                signatures.push(value.signature);
            }

            const getTransactionAccountInputs2 = await ggoconnection.getParsedTransactions(signatures, 'confirmed');
            let featured = null;
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
                                setBeforeSignature(value.signature);
                                setMaxPage(true);
                            }
                            
                            exists = false;
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

                                        //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_str);
                                        for (var i = 0; i < ahListings.length; i++){
                                            if ((memo_json?.mint === ahListings[i].mint)){ // match same
                                                // if match then add
                                                if (memo_json.state === 1)
                                                    ahListings[i].offers = ahListings[i].offers+1;
                                                exists = true;
                                            }
                                        }

                                        if (!exists){
                                            let forSaleDate = ''+value.blockTime;
                                            if (forSaleDate){
                                                let timeago = timeAgo(''+value.blockTime);
                                                forSaleDate = timeago;
                                            }

                                            let solvalue = convertSolVal(memo_json?.amount || memo_json?.offer);
                                            if (memo_json?.mint){
                                                let offer = 0;
                                                if (memo_json.state === 1)
                                                    offer = 1;
                                                ahListings.push({amount: solvalue, mint: memo_json?.mint, timestamp: forSaleDate, blockTime:value.blockTime, state: memo_json?.state || memo_json?.status, offers: offer, score: memo_json?.score || 0});  
                                                ahListingsMints.push(memo_json.mint);
                                                
                                            }
                                        }
                                    }catch(merr){console.log("ERR: "+merr)}
                                }
                            }
                        }
                    } catch (e){console.log("ERR: "+e)}
                }
            } 

            let collectionmeta = await getCollectionData(ahListingsMints);

            setFeaturedMeta(collectionmeta);
            setFeatured(ahListings);

            for (var i = 0; i < collectionmeta.length; i++){
                collectionmeta[i]["memo"] = ahListings[i];
            }
            
            try{
                let finalmeta = JSON.parse(JSON.stringify(collectionmeta));
                finalmeta.sort((a:any,b:any) => (b.memo.score - a.memo.score) || (b.memo.blockTime - a.memo.blockTime));
                setMergedFeaturedMeta(finalmeta);
            }catch(e){
                setMergedFeaturedMeta(collectionmeta);
            }
            
            
            setLoading(false);                                      
        }
    }

    //React.useEffect(() => { 
        if ((!loading) && (!featured))
            getFeatured();
    //}, []);

    if (loading){
        return (
            <Grid 
                container 
                direction="column" 
                spacing={0} 
                alignItems="center"
                rowSpacing={8}
                width="100%"
                minWidth="400px"
            >
                <Grid 
                    item xs={12}
                >
                    <Box
                        height="100%"
                        display="flex-grow"
                        justifyContent="center"
                    >
                        <CircularProgress />
                    </Box>
                </Grid>
            </Grid>
        )
    } else{
        return (
            <Grid 
                container 
                direction="column" 
                spacing={0} 
                alignItems="center"
                rowSpacing={8}
            >
                <Grid 
                    item xs={12}
                >
                    <Box
                        height="100%"
                        display="flex-grow"
                        justifyContent="center"
                    >
                        {mergedfeaturedmeta &&
                            <>
                                <>
                                {mergedfeaturedmeta.map((item: any, key: number) => (
                                    <>
                                    {item.memo.state === 2 && 
                                        <FeaturedItem itemmeta={item} />
                                    }
                                    </>
                                ))}
                                </>

                                <>
                                {mergedfeaturedmeta.map((item: any, key: number) => (
                                    <>
                                    {item.memo.state === 1 && 
                                        <FeaturedItem itemmeta={item} />
                                    }
                                    </>
                                ))}
                                </>
                            </>
                        }
                    </Box>
                </Grid>
            </Grid>
        );
    }
}

const SocialView = (props: any) => {
    const [pubkey, setPubKey] = React.useState<string>(props.pubkey || null);
    const [type, setType] = React.useState<number>(props.type || 0);
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const rpclimit = 100;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [followListInfo, setFollowListInfo] = useState<FollowListInfoResp | null>(null);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const solanaProvider = useWallet();
    const { publicKey } = useWallet();

    const NAME_SPACE = 'Grape';
    const GLOBAL_NAME_SPACE = '';
    const NETWORK = Network.SOLANA;
    const FIRST = 10; // The number of users in followings/followers list for each fetch

    const cyberConnect = new CyberConnect({
        namespace: NAME_SPACE,
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    // Get the current user followings and followers list
    const initFollowListInfo = async () => {
        setLoading(true);
        if (!pubkey) {
            return;
        }

        const resp = await followListInfoQuery({
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            followingFirst: FIRST,
            followerFirst: FIRST
        });
        if (resp) {
            setFollowListInfo(resp);
        }
        setLoading(false);
    };
  
  const fetchMore = async (type: 'followings' | 'followers') => {
    if (!pubkey || !followListInfo) {
      return;
    }

    const params =
      type === 'followers'
        ? {
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            followerFirst: FIRST,
            followerAfter: followListInfo.followers.pageInfo.endCursor,
          }
        : {
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            followingFirst: FIRST,
            followingAfter: followListInfo.followings.pageInfo.endCursor,
          };

    const resp = await followListInfoQuery(params);
    if (resp) {
      type === 'followers'
        ? setFollowListInfo({
            ...followListInfo,
            followers: {
              pageInfo: resp.followers.pageInfo,
              list: removeDuplicate(
                followListInfo.followers.list.concat(resp.followers.list)
              ),
            },
          })
        : setFollowListInfo({
            ...followListInfo,
            followings: {
              pageInfo: resp.followings.pageInfo,
              list: removeDuplicate(
                followListInfo.followings.list.concat(resp.followings.list)
              ),
            },
          });
    }
  };

    const ProfilePicture = (props:any) => {
        const followitem = props.followitem;
        const [address, setAddress] = React.useState(followitem.address);
        const [loadingpicture, setLoadingPicture] = React.useState(false);
        const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
        const [hasProfilePicture, setHasProfilePicture] = React.useState(false);
        const countRef = React.useRef(0);

        const fetchProfilePicture = async () => {
            setLoadingPicture(true);  
                //console.log("trying: "+address)
                try{
                    //console.log(countRef.current+": "+address+" - "+loadingpicture);
                    const { isAvailable, url } = await getProfilePicture(ggoconnection, new PublicKey(address));
                    
                    let img_url = url;
                    if (url)
                        img_url = url.replace(/width=100/g, 'width=256');
                    setProfilePictureUrl(img_url);
                    setHasProfilePicture(isAvailable);
                    countRef.current++;
                }catch(e){}
            setLoadingPicture(false);
        }

        React.useEffect(() => {       
            if (!loadingpicture){
                //const interval = setTimeout(() => {
                    if (address)
                        fetchProfilePicture();
                //}, 500);
            }
        }, []);

        /*
        React.useEffect(() => { 
            if ((!loadingpicture)&&(countRef.current<1)){
                const interval = setTimeout(() => {
                    if (address)
                        fetchProfilePicture();
                }, 500);
                return () => clearInterval(interval); 
            }
        }, []);
        */

        
        if (loadingpicture){
            return (
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgb(0, 0, 0)' }}>
                    <CircularProgress sx={{ width: 56, height: 56, bgcolor: 'rgb(0, 0, 0)' }} />
                </Avatar>)
        }else{
            
            if (hasProfilePicture){
                return (  
                    <Avatar alt={address} src={profilePictureUrl} sx={{ width: 56, height: 56, bgcolor: 'rgb(0, 0, 0)' }}>
                        {address.substr(0,2)}
                    </Avatar>
                );
            
            } else{
                return (
                    <>
                    {followitem.avatar ?
                        <>
                            <Avatar alt={followitem.address} src={followitem.avatar} sx={{ width: 56, height: 56, bgcolor: 'rgb(0, 0, 0)' }}>
                                {followitem.address.substr(0,2)}
                            </Avatar>
                        </>
                    :
                        <>
                        {jsNumberForAddress(followitem.address) ?
                            <>
                            <Jazzicon diameter={56} seed={jsNumberForAddress(followitem.address)} />
                            </>
                        :
                            <>
                            <Jazzicon diameter={56} seed={Math.round(Math.random() * 10000000)} />
                            </>
                        }
                        </>
                    }
                    </>
                );
            }
        }
    }


    const SocialItem = (props: any) => {
        const [followitem, setFollowItem] = React.useState(props.followitem);
        const [followitemkey, setFollowItemKey] = React.useState(props.followitemkey);
        
        if (loading){
            return <Grid item xs={12} sm={6} md={4}><CircularProgress /></Grid>
        } else{
            return (
                
                <Grid item xs={12} sm={12} md={4} lg={3}>

                    <ListItem 
                        key={followitemkey}
                        sx={{ 
                            background:'rgba(0,0,0,0.5)',
                            borderRadius:'17px' }}>
                        <ListItemButton
                            component={Link} 
                            to={`${GRAPE_PROFILE}${followitem.address}`}
                            sx={{ 
                                m:1,
                                borderRadius:'17px'}}
                            >
                            <ListItemAvatar>
                                <ProfilePicture followitem={followitem} />
                            </ListItemAvatar>
                            <ListItemText
                                sx={{ml:1}}
                                primary={followitem.ens || trimAddress(followitem.address,4)}  
                                secondary={<Typography variant="caption" color="#777">From {followitem.namespace}</Typography>}
                            />
                        </ListItemButton>
                    </ListItem>
                </Grid>


            )
        }
    }

    React.useEffect(() => { 
        if (publicKey){
            initFollowListInfo();
        }
    }, []);
    

    if (loading){
        return (
            <Grid 
                container 
                direction="column" 
                spacing={2} 
                alignItems="center"
                rowSpacing={8}
            >
                <Grid 
                    item xs={12}
                >
                    <CircularProgress />
                </Grid>
            </Grid>
        )
    } else {
        return (
            <> 
                <Box
                    sx={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '17px',
                        p:4
                    }} 
                > 
                    <Grid container 
                        spacing={{ xs: 2, md: 3 }} 
                        justifyContent="center"
                        alignItems="center">
                        
                        {type === 0 ?
                        <>
                            {followListInfo &&
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                                    {followListInfo?.followers && followListInfo.followers.list.map((item: any, key: number) => (
                                    <SocialItem followitem={item} followitemkey={key} />
                                    ))}
                                </Grid>
                            }
                            
                            {followListInfo?.followers.pageInfo.hasNextPage &&
                                <Button onClick={() => fetchMore('followers')}>more</Button>
                            }
                        </>
                        :
                        <>
                            {followListInfo &&
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                                    {followListInfo?.followings && followListInfo.followings.list.map((item: any, key: number) => (
                                    <SocialItem followitem={item} followitemkey={key} />
                                    ))}
                                </Grid>
                            }
                            {followListInfo?.followings.pageInfo.hasNextPage &&
                                <Button onClick={() => fetchMore('followings')}>more</Button>
                            }
                        </>
                        }
                    </Grid>

                </Box>
            </>
        );
    }
}

const OffersView = (props:any) => {
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

    const handleCancelOffer = async (offerAmount: number, mint: any) => {
        try {
            const mintKey = new web3.PublicKey(mint);
            let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mintKey));
            const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
            let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
            const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);                
            const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, publicKey, mintAccountInfoDs.owner);
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
            await connection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`Offer has been canceled `,{ variant: 'success', action:snackaction });
            
            const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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
            enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }
	//handCancelWithdrawOffer was useful when only allowing one offer at a time
    const handleCancelWithdrawOffer = async (offerAmount: number, mint: any) => {
        try {
            const mintKey = new web3.PublicKey(mint);
            let tokenAccount =  await ggoconnection.getTokenLargestAccounts(new PublicKey(mintKey));
            const tokenKey = new web3.PublicKey(tokenAccount?.value[0].address.toBase58());
            let mintAccountInfo = await ggoconnection.getAccountInfo(tokenKey);
            const mintAccountInfoDs = deserializeAccount(mintAccountInfo?.data);
            const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, publicKey, mintAccountInfoDs.owner);
            const instructionsArray = [transactionInstr.instructions].flat();        
            const transaction = new Transaction()
            .add(
                ...instructionsArray
            );

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
            enqueueSnackbar(`Offer Cancel and Withdrawal completed `,{ variant: 'success', action:snackaction });
            
            const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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
            enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        }  
    }
    
    const handleWithdrawOffer = async (offerAmount: number, mint: string) => {

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
                        const transactionInstr = await cancelWithdrawOffer(offerAmount, mint, publicKey, mintAccountInfoDs.owner);
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
                        enqueueSnackbar(`Offer Cancel and Withdrawal completed `,{ variant: 'success', action:snackaction });
                        
                        const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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
                        enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
                        console.log("Error: "+e);
                    } 
                } else{ // no mint then just withdraw
                    try {
                        const transactionInstr = await withdrawOffer(offerAmount, null, publicKey);
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
                        enqueueSnackbar(`Withdrawal from Grapevine completed `,{ variant: 'success', action:snackaction });
                        
                        const eskey = enqueueSnackbar(`Metadata will be refreshed in a few seconds`, {
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
                        enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
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
                                const transactionInstr = await cancelOffer(item.offerAmount, item.mint, publicKey, mintAccountInfoDs.owner);
                                const instructionsArray = [transactionInstr.instructions].flat();        
                                const transaction = new Transaction()
                                .add(
                                    ...instructionsArray
                                );
                            
                                enqueueSnackbar(`Preparing to cancel offer for ${item.offerAmount} SOL on mint ${item.mint}`,{ variant: 'info' });
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
                                enqueueSnackbar(`Offer cancel complete `,{ variant: 'success', action:snackaction });                 
                            }
                        } catch(e){
                            closeSnackbar();
                            enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
                            console.log("Error: "+e);
                        }

                        try{
                            if (cnt === allmints.length){
                                const transactionInstr = await withdrawOffer(offerAmount, null, publicKey);
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
                                enqueueSnackbar(`Grapevine Withdrawal complete `,{ variant: 'success', action:snackaction });                     
                            }
                        } catch(e){
                            closeSnackbar();
                            enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
                            console.log("Error: "+e);
                        }    

                        cnt++;
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
                        setRefresh(true);
                    }, GRAPE_RPC_REFRESH);
         
				
            }
            
        } catch(e){
            closeSnackbar();
            enqueueSnackbar(`Error: ${e}`,{ variant: 'error' });
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
            let cntr = 0;
            
            const escrow = ( await getAuctionHouseBuyerEscrow(auctionHouseKey, publicKey,))[0];
            let amount = await getTokenAmount(anchorProgram, escrow, auctionHouseObj.treasuryMint,);
            setAHBalance(amount);

            setAHLoading(false);
            
        }
    }

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
    
    if (loading){
        return (
            <Grid container
                alignItems="center"
                justifyContent="center"
                sx={{
                }} 
            >
                <CircularProgress />
            </Grid>
        );
    } else {
        if (selectedstate == 1){
            return (
                
                <Container
                    sx={{p:0,m:0}}
                >
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
                                        CONFIRMATION
                                    </Typography>
                                </DialogTitle>
                                <DialogContent>
                                    <DialogContentText id="alert-bn-dialog-description">
                                    <br />
                                    <Alert 
                                        severity="warning" variant="outlined"
                                        sx={{backgroundColor:'black'}}
                                        >
                                            You currently have <strong>{myoffers}</strong> standing offer{(myoffers > 1 && <>s</>)}, it is recommended that you cancel all standing offers and then attempt to withdraw. If you are unable to cancel then click Withdraw to force cancel from the Grape Auction House
                                            <br/><br/>
                                            NOTE: By pressing Withdraw you will have to Accept <strong>{myoffers}</strong> additional transaction{(myoffers > 1 && <>s</>)} with your wallet
                                    </Alert>
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleAlertWithdrawClose}>Cancel</Button>
                                    <Button 
                                        onClick={() => handleWithdrawOffer(convertSolVal(ahbalance), null)}
                                        autoFocus>
                                    Withdraw
                                    </Button>
                                </DialogActions>
                            </BootstrapDialog>
                            
                            <Grid 
                                container
                                direction="row"
                                justifyContent='flex-end'
                                alignContent='flex-end'
                                sx={{
                                    p:1,pr:1.25
                                }}
                            >
                                <Typography variant="caption">
                                    <Button
                                            title="Withdraw from the Grape Auction House"
                                            size="small"
                                            variant="text"
                                            onClick={() => (myoffers > 0 ? setAlertWithdrawOpen(true) : handleWithdrawOffer(convertSolVal(ahbalance), null))}
                                            sx={{
                                                borderRadius: '10px',
                                                fontSize: '11px',
                                                ml:1
                                            }}
                                        >
                                        {convertSolVal(ahbalance)} <SolCurrencyIcon sx={{fontSize:"8px", mr:0.5 }} /> <GrapeIcon sx={{fontSize:"22px", mr:0.5, color:'white' }} />
                                    
                                    </Button>
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
                            p:0,
                        }}
                    >
                        <Table size="small" aria-label="offers">
                            {offers && offers.map((item: any,key:number) => (
                                <>
                                    {item.state === selectedstate && (
                                    <>
                                        <TableRow sx={{p:1}} key={key}>
                                            <TableCell>
                                                <Tooltip title={`Visit profile`}>
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
                                                    <Tooltip title={`Offer made`}>
                                                        <IconButton>
                                                            <ArrowForwardIcon color="success" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    ):(
                                                    <Tooltip title={`Offer received`}>
                                                        <IconButton>
                                                            <ArrowBackIcon sx={{ color: red[500] }} />
                                                        </IconButton>
                                                    </Tooltip>)}
                                                    {convertSolVal(item.offeramount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                            </Typography></TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={`View NFT`}>
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
                                                {(publicKey == item.buyeraddress) && (
                                                    <Tooltip title={`Cancel Offer`}>
                                                        <Button 
                                                            color="error"
                                                            variant="text"
                                                            //onClick={() => handleWithdrawOffer(convertSolVal(item.offeramount), item.mint)}
                                                            onClick={() => handleCancelWithdrawOffer(convertSolVal(item.offeramount), item.mint)}
                                                            //onClick={() => handleCancelOffer(convertSolVal(item.offeramount), item.mint)}
                                                            sx={{
                                                                borderRadius: '24px',
                                                            }}
                                                        >
                                                            <CancelIcon />
                                                        </Button>
                                                    </Tooltip>
                                                    )}
                                            </TableCell>
                                        </TableRow>
                                        </>
                                    )}
                                </>
                            ))}
                        </Table>
                    </TableContainer>
                </Container>
            )
        } else {
            return (
                <Container
                    sx={{p:0}}
                >
                    {(publicKey && publicKey.toBase58() === thisPublicKey && ahbalance && (ahbalance > 0)) ?
                        <Box
                            sx={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '17px',
                                mt:1,
                                mb:2
                            }}
                        >
                            <Grid 
                                container
                                direction="row"
                                justifyContent='flex-end'
                                alignContent='flex-end'
                                sx={{
                                    p:1,pr:1.25
                                }}
                            >
                                <Typography variant="caption">
                                    <Button
                                            title="Withdraw from the Grape Auction House"
                                            size="small"
                                            variant="text"
                                            onClick={() => handleWithdrawOffer(convertSolVal(ahbalance), null)}
                                            sx={{
                                                borderRadius: '10px',
                                                fontSize: '11px',
                                                ml:1
                                            }}
                                        >
                                        {convertSolVal(ahbalance)} <SolCurrencyIcon sx={{fontSize:"8px", mr:0.5 }} /> <GrapeIcon sx={{fontSize:"22px", mr:0.5, color:'white' }} />
                                    
                                    </Button>
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
                                    {item.state === 2 && (
                                    <>
                                        <TableRow sx={{p:1}} key={key}>
                                            <TableCell  align="right"><Typography variant="caption">
                                            </Typography></TableCell>
                                            <TableCell  align="right"><Typography variant="h6">
                                                {convertSolVal(item.offeramount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                            </Typography></TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={`View NFT`}>
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
                </Container>
            )
        }
    }
}

const StyledSpeedDial = styled(SpeedDial)(({ theme }) => ({
    position: 'absolute',
    '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
      top: theme.spacing(2),
      left: theme.spacing(2),
    },
  }));
  
  
  

const MainMenu = (props:any) => {
    const pubkey = props.pubkey;
    const { publicKey } = useWallet();

    if ((publicKey) && (publicKey.toBase58() != pubkey)){
        return (
        
            <List
                sx={{m:1,p:1}}
            >
                <ListItem disablePadding>
                    <ListItemButton
                        title="Back Home"
                        component={Link} to={`${GRAPE_PROFILE}${publicKey.toBase58()}`}
                        sx={{
                            width:'100%',
                            borderRadius:'25px',
                            p: 1
                        }}
                    >
                        <ListItemIcon>
                            <HomeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Home" />
                    </ListItemButton>
                </ListItem>
    
                <ListItem disablePadding>
                    <ListItemButton
                        title="Visit Solana Explorer"
                        component="a" href={`https://explorer.solana.com/address/${publicKey.toBase58()}`} target="_blank"
                        sx={{
                            width:'100%',
                            borderRadius:'25px',
                            p: 1
                        }}
                    >
                        <ListItemIcon>
                            <ExploreIcon />
                        </ListItemIcon>
                        <ListItemText primary="Explore" />
                    </ListItemButton>
                </ListItem>
    
                <ListItem disablePadding>
                    <ListItemButton
                        title="Messaging coming soon"
                        disabled
                        sx={{
                            width:'100%',
                            borderRadius:'25px',
                            p: 1
                        }}
                    >
                        <ListItemIcon>
                            <MessageIcon />
                        </ListItemIcon>
                        <ListItemText primary={`Messages`} />
                    </ListItemButton>
                </ListItem>
            </List>
    
        );
    } else{
        return (<></>);
    }
    
    /*
    const actions = [
        { icon: <HomeIcon />, name: 'Home' },
        { icon: <ExploreIcon />, name: 'Explore' },
        { icon: <MessageIcon />, name: 'Messages *coming soon' },
    ];
    
    return (
        <Box sx={{ height: 230, transform: 'translateZ(0px)', flexGrow: 1 }}>
            <SpeedDial
                ariaLabel="Menu"
                sx={{ position: 'absolute', bottom: 16, left: 16 }}
                icon={<SpeedDialIcon sx={{color:'white'}} />}
                direction='down'
            >
                {actions.map((action) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                />
                ))}
            </SpeedDial>
        </Box>
    )
    */
}


const MainPanel = (props: any) => {
    const [loading, setLoading] = React.useState(false);
    const [ thisPublicKey, setThisPublicKey] = React.useState(props.thisPublicKey || null);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [walletCollection, setWalletCollection] = React.useState(props.wallet_collection);
    const [walletCollectionMeta, setWalletCollectionMeta] = React.useState(props.wallet_collection_meta);
    const finalCollection = props.final_collection || null;
    const [page, setPage] = React.useState(1);
    const rowsperpage = 1500;

    const [tabvalue, setTabValue] = React.useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    function a11yProps(index: number) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }
    
    if(loading){
        return (
            <Grid item xs='auto' sm='auto' md='auto' lg='auto' xl='auto'>
                <Box
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                    }} 
                >
                    <CircularProgress />
                </Box>
            </Grid>
        )
    } else{
        return (
            <Grid item xs={12} sm={6} md={8} lg={9} xl={9}>
                <Container
                    sx={{
                        minHeight: '225px',
                        m:0,
                        p:0,
                    }} 
                >
                    
                    
                        <Tabs 
                            variant="scrollable"
                            scrollButtons="auto"
                            value={tabvalue} 
                            onChange={handleTabChange} 
                            sx={{
                                background: 'rgba(0, 0, 0, 0.6)',
                                borderRadius: '17px',
                                mb:1,
                            }} 
                            >
                            <Tab icon={<Hidden smUp><CollectionsOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>Collection</Hidden>} sx={{color:'white',minWidth:'60px'}} {...a11yProps(0)} />
                            <Tab icon={<Hidden smUp><RssFeedOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>Feed</Hidden>} sx={{color:'white',minWidth:'60px'}} {...a11yProps(1)} />
                            <Tab icon={<Hidden smUp><ArrowCircleLeftOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>Followers</Hidden>} sx={{color:'white',minWidth:'60px'}} {...a11yProps(2)} />
                            <Tab icon={<Hidden smUp><ArrowCircleRightOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>Following</Hidden>} sx={{color:'white',minWidth:'60px'}} {...a11yProps(3)} />
                            {/*<Tab label="Bids" sx={{color:'white'}} {...a11yProps(4)} />*/}
                            <Tab icon={<Hidden smUp><GavelOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>Offers</Hidden>} sx={{color:'white',minWidth:'60px'}} {...a11yProps(5)} />
                            <Tab icon={<Hidden smUp><SolCurrencyIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>Selling</Hidden>} sx={{color:'white',minWidth:'60px'}} {...a11yProps(6)} />
                        </Tabs>
                    
                    
                    <TabPanel value={tabvalue} index={1}>
                        <Box
                            sx={{
                                borderRadius: '17px',
                            }} 
                            > 
                            <FeedView />
                        </Box>
                    </TabPanel>

                    <TabPanel value={tabvalue} index={0}>
                        {finalCollection && finalCollection.length > 0 && (
                            <Box
                                sx={{
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    borderRadius: '17px',
                                    p:4
                                }} 
                            > 
                                <Grid container 
                                    spacing={{ xs: 2, md: 3 }} 
                                    justifyContent="center"
                                    alignItems="center">
                                    
                                    { (finalCollection.length > 0 ? finalCollection
                                        .slice((page - 1) * rowsperpage, page * rowsperpage):finalCollection)
                                        .map((collectionInfo: any, key: any) => {
                                            return(
                                                <Grid item xs={12} sm={12} md={4} lg={3} key={key}>
                                                    <Box
                                                        sx={{
                                                            background: 'rgba(0, 0, 0, 0.6)',
                                                            borderRadius: '26px',
                                                            minWidth: '175px'
                                                        }} 
                                                    >
                                                    <GalleryItem collectionitem={collectionInfo} listed={true} count={key} />
                                                    
                                                    </Box>
                                                </Grid>
                                                    
                                            )
                                        }
                                    )}
                                </Grid>
                                
                                { walletCollection.length > rowsperpage && 
                                    <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
                                        <Stack spacing={2}>
                                            <Pagination
                                                count={(Math.ceil(walletCollection.length / rowsperpage))}
                                                page={page}
                                                //onChange={handlePageChange}
                                                defaultPage={1}
                                                color="primary"
                                                size="small"
                                                showFirstButton
                                                showLastButton
                                                //classes={{ ul: classes.paginator }}
                                                />
                                        </Stack>
                                    </Grid>
                                }
                            </Box>
                            
                        )}
                    </TabPanel>
                    
                    <TabPanel value={tabvalue} index={2}>
                        <SocialView pubkey={thisPublicKey} type={0} />
                    </TabPanel>
                    
                    <TabPanel value={tabvalue} index={3}>
                        <SocialView pubkey={thisPublicKey} type={1} />
                    </TabPanel>

                    <TabPanel value={tabvalue} index={4}>
                        <OffersView selectedstate={1} pubkey={thisPublicKey} wallet_collection={walletCollection} wallet_collection_meta={walletCollectionMeta} />
                    </TabPanel>
                    <TabPanel value={tabvalue} index={5}>
                        <OffersView selectedstate={2} pubkey={thisPublicKey} wallet_collection={walletCollection} wallet_collection_meta={walletCollectionMeta} />
                    </TabPanel>
                </Container>
            </Grid>
        );
    }
}

const GroupGalleryList = (props: any) => {
    const [expanded_collection, setExpandedCollection] = React.useState(true);
    const [pubkey, setPubKey] = React.useState<string>(props.pubkey || null);
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const rowsperpage = 1500;
    const rpclimit = 100;
    //const [wallet_collection, setCollectionArray] = React.useState(props.collection.collection)
    //const [wallet_collection] = React.useState(props.collection.collection);
    const [wallet_collection, setCollectionArray] = React.useState(props.collection.collection);
    const [wallet_collection_meta, setCollectionMeta] = React.useState(null);
    const [final_collection, setCollectionMetaFinal] = React.useState(null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const [featuredObj, setFeaturedObj] = React.useState(null);
    const [profilePictureUrl, setProfilePicutureUrl] = React.useState(null);
    const [hasProfilePicture, setHasProfilePicture] = React.useState(false);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [loadCount, setLoadCount] = React.useState(0);
    const [loadingFollowState, setLoadingFollowState] = React.useState(false);
    const [followListInfo, setFollowListInfo] = useState<FollowListInfoResp | null>(null);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const solanaProvider = useWallet();
    const { publicKey } = useWallet();
    
    const NAME_SPACE = 'Grape';
    const NETWORK = Network.SOLANA;
    const FIRST = 10; // The number of users in followings/followers list for each fetch

    const cyberConnect = new CyberConnect({
        namespace: NAME_SPACE,
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    // Get the current user followings and followers list
  const initFollowListInfo = async () => {
    if (!pubkey) {
      return;
    }
    
    setLoading(true);
    const resp = await followListInfoQuery({
        address:pubkey,
        namespace: '',
        network: NETWORK,
        followingFirst: FIRST,
        followerFirst: FIRST
    });
    if (resp) {
      setFollowListInfo(resp);
    }
    setLoading(false);
  };
  
  const fetchMore = async (type: 'followings' | 'followers') => {
    if (!pubkey || !followListInfo) {
      return;
    }

    const params =
      type === 'followers'
        ? {
            address:pubkey,
            namespace: '',
            network: NETWORK,
            followerFirst: FIRST,
            followerAfter: followListInfo.followers.pageInfo.endCursor,
          }
        : {
            address:pubkey,
            namespace: '',
            network: NETWORK,
            followingFirst: FIRST,
            followingAfter: followListInfo.followings.pageInfo.endCursor,
          };

    const resp = await followListInfoQuery(params);
    if (resp) {
      type === 'followers'
        ? setFollowListInfo({
            ...followListInfo,
            followers: {
              pageInfo: resp.followers.pageInfo,
              list: removeDuplicate(
                followListInfo.followers.list.concat(resp.followers.list)
              ),
            },
          })
        : setFollowListInfo({
            ...followListInfo,
            followings: {
              pageInfo: resp.followings.pageInfo,
              list: removeDuplicate(
                followListInfo.followings.list.concat(resp.followings.list)
              ),
            },
          });
    }
  };
  


    const fetchSearchAddrInfo = async (fromAddr:string, toAddr: string) => {

        const resp = await searchUserInfoQuery({
            fromAddr:fromAddr,
            toAddr,
            namespace: NAME_SPACE,
            network: NETWORK,
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
        let promise = await cyberConnect.connect(followAddress.toString())
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

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        getCollectionMeta(value);
        //count={(Math.ceil(wallet_collection.length / rowsperpage))}
    };

    const handleExpandCollectionClick = () => {
        setExpandedCollection(!expanded_collection);
    };
    
    const fetchProfilePicture = async () => {
        const { isAvailable, url } = await getProfilePicture(ggoconnection, new PublicKey(pubkey));

        let img_url = url;
        if (url)
            img_url = url.replace(/width=100/g, 'width=256');
        setProfilePicutureUrl(img_url);
        setHasProfilePicture(isAvailable);
    }

    const fetchSolanaDomain = async () => {
        const domain = await findDisplayName(ggoconnection, pubkey);
        if (domain){
            if (domain[0] !== pubkey)
                setSolanaDomain(domain[0]);
        }
    }

    const MD_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const getCollectionData = async (start:number) => {
        try {
            let mintsPDAs = new Array();
            //console.log("RPClim: "+rpclimit);
            //console.log("Paging "+(rpclimit*(start))+" - "+(rpclimit*(start+1)));
            
            let mintarr = wallet_collection.slice(rpclimit*(start), rpclimit*(start+1)).map((value:any, index:number) => {
                //console.log("mint: "+JSON.stringify(value.account.data.parsed.info.mint));
                return value.account.data.parsed.info.mint;
            });

            for (var value of mintarr){
                if (value){
                    let mint_address = new PublicKey(value);
                    let [pda, bump] = await PublicKey.findProgramAddress([
                        Buffer.from("metadata"),
                        MD_PUBKEY.toBuffer(),
                        new PublicKey(mint_address).toBuffer(),
                    ], MD_PUBKEY)

                    if (pda){
                        //console.log("pda: "+pda.toString());
                        mintsPDAs.push(pda);
                    }
                    
                }
            }

            //console.log("pushed pdas: "+JSON.stringify(mintsPDAs));
            const metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
            //console.log("returned: "+JSON.stringify(metadata));

            
            // LOOP ALL METADATA WE HAVE
            for (var metavalue of metadata){
                //console.log("Metaplex val: "+JSON.stringify(metavalue));
                if (metavalue?.data){
                    try{
                        let meta_primer = metavalue;
                        let buf = Buffer.from(metavalue.data);
                        let meta_final = decodeMetadata(buf);
                        //console.log("meta_final: "+JSON.stringify(meta_final));
                    }catch(etfm){console.log("ERR: "+etfm + " for "+ JSON.stringify(metavalue));}
                } else{
                    console.log("Something not right...");
                }
                //setCollectionRaw({meta_final,meta_primer});
                
                /*
                const finalmetadata = await fetch(meta_final.data.uri).then(
                    (res: any) => res.json());
                */
            }

            return metadata;
            
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getFollowStatus = async () => {
        if (publicKey){
            if (pubkey){
                setLoadingFollowState(true);
                let socialconnection = await fetchSearchAddrInfo(publicKey.toBase58(), pubkey);
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

    const getCollectionMeta = async (start:number) => {
        if (!loading){
            setLoading(true);
            // see how many loops we will need to conduct
            let wallletlength = wallet_collection.length;
            
            let loops = (Math.ceil(wallet_collection.length/rpclimit));
            let collectionmeta: any[] = [];

            console.log("lps: "+loops);
            for (var x=0;x<loops;x++){
                //const interval = setTimeout(() => {
                    let tmpcollectionmeta = await getCollectionData(x);
                    //collectionmeta.push(tmpcollectionmeta);
                    collectionmeta = collectionmeta.concat(tmpcollectionmeta);
                //}, 200);
                
            }
            
            console.log(collectionmeta.length + ' vs '+wallet_collection.length);

            setLoadCount(loadCount+1);
            setCollectionMeta({collectionmeta});

            for (var i = 0; i < collectionmeta.length; i++){
                //console.log(i+": "+JSON.stringify(collectionmeta[i])+" --- with --- "+JSON.stringify(wallet_collection[i]));
                if (collectionmeta[i]){
                    collectionmeta[i]["wallet"] = wallet_collection[i];
                }
            }
            
            try{
                let finalmeta = JSON.parse(JSON.stringify(collectionmeta));
                setCollectionMetaFinal(finalmeta);
            }catch(e){}
            // setCollectionMetaFinal(); // add both arrays

            setLoading(false);
        }
    }

    React.useEffect(() => { 
        if (pubkey){
            if (ValidateAddress(pubkey)){
                if (loadCount < 1){
                    fetchProfilePicture();
                    getCollectionMeta(0);
                    fetchSolanaDomain();
                    getFollowStatus();
                    initFollowListInfo();

                    // get featured
                    for (var featured of FEATURED_DAO_ARRAY){
                        if (featured.address === pubkey){
                            setFeaturedObj(featured);
                        }
                    }
                }
            }
        }
    }, [pubkey]);

    if (loading){
        return <>Loading...</>
    } else {

        return (
            <React.Fragment>
                <Box>
                        <Box
                            sx={{
                                mb:4,
                                mt:3,
                                //background:'green'
                            }}
                        >
                            {featuredObj && (
                                <Card sx={{borderRadius:'26px',mb:2}}>

                                        {/*component={Link} to={`${GRAPE_PROFILE}${featuredObj.address}`}*/}
                                    <CardActionArea
                                        component="a" href={`${featuredObj.daourl}`} target="_blank"
                                    >
                                        <CardMedia
                                        component="img"
                                        image={featuredObj.img}
                                        alt={featuredObj.title}
                                            sx={{
                                                maxHeight: '250',
                                                background: 'rgba(0, 0, 0, 1)',
                                                m:0,
                                                p:0,
                                            }} 
                                        />
                                    </CardActionArea>
                                </Card>
                            )}

                                <Grid 
                                    container 
                                    spacing={2}
                                    rowSpacing={3}
                                    >    
                                    <Grid item xs={12} sm={6} md={4} lg={3} xl={3}
                                    sx={{
                                    }}
                                    >
                                    
                                    <Box
                                        className='grape-profile-background'
                                        sx={{
                                            //background: 'rgba(0, 0, 0, 0.6)',
                                            position:'relative',
                                            borderRadius: '17px',
                                            minHeight: '225px',
                                            minWidth:'250px',
                                            overflow:'hidden',
                                            pb:3,
                                            pl:4,
                                            pr:4
                                        }} 
                                    >
                                    {featuredObj ? (  
                                        <img
                                            src={featuredObj.img}
                                            alt=""
                                            style={{
                                                opacity: '0.21',
                                                position: 'absolute',
                                                marginTop:2,
                                                marginBottom:2,
                                                padding:1,
                                                top:'-5%',
                                                right:'-5%',
                                                height:'110%'
                                            }}
                                        />
                                    )
                                    :(
                                        <>
                                            {(hasProfilePicture && profilePictureUrl) &&
                                                <img
                                                    src={profilePictureUrl}
                                                    alt=""
                                                    style={{
                                                        opacity: '0.05',
                                                        position: 'absolute',
                                                        marginTop:2,
                                                        marginBottom:2,
                                                        padding:1,
                                                        top:'-5%',
                                                        left:'-45%',
                                                        height:'150%'
                                                    }}
                                                />
                                            }
                                        </>
                                        )
                                    }
                                    
                                        
                                        <List
                                            sx={{ 
                                                width: '100%',
                                                pl: 2,
                                                pr: 2,
                                                pb: 2
                                            }}
                                            component="nav"
                                            >       
                                            <ListItemText>

                                            <Grid 
                                                container 
                                                direction="column"
                                                alignItems="flex-end"
                                                justifyContent="flex-end"
                                            >
                                                <Grid item>
                                                    <Box sx={{ mt:-1.5,mr:-6 }}>
                                                        
                                                        <Typography component="div" variant="caption" alignItems="flex-end" justifyContent="flex-end">

                                                            <ButtonGroup variant="text">
                                                            <ShareSocialURL url={'https://grape.art'+GRAPE_PROFILE+pubkey} title={'Grape Profile | '+trimAddress(pubkey,4)} />

                                                            {publicKey && publicKey.toBase58() !== pubkey &&
                                                                <Typography component="div" variant="caption" align="center" sx={{ flexGrow: 1 }}>
                                                                {loadingFollowState ?
                                                                    <>
                                                                        <CircularProgress sx={{p:'14px',m:-0.75}} />
                                                                    </>
                                                                :
                                                                    <>
                                                                        {isFollowing ?  
                                                                            <Tooltip title={`Unfollow`}>
                                                                                <Button 
                                                                                    variant="text" 
                                                                                    onClick={() => followWalletDisconnect(pubkey)}
                                                                                    size="small"
                                                                                    className="profileAvatarIcon"
                                                                                    sx={{borderRadius:'24px', color:'white'}}
                                                                                    >
                                                                                    <PersonRemoveOutlinedIcon />
                                                                                </Button>
                                                                            </Tooltip>
                                                                            :
                                                                            <Tooltip title={`Follow`}>
                                                                                <Button 
                                                                                    variant="text" 
                                                                                    onClick={() => followWalletConnect(pubkey)}
                                                                                    size="small"
                                                                                    className="profileAvatarIcon"
                                                                                    sx={{borderRadius:'24px', color:'white'}}
                                                                                    >
                                                                                    <PersonAddOutlinedIcon />
                                                                                </Button>
                                                                            </Tooltip>
                                                                        }
                                                                    </>
                                                                }
                                                                </Typography>
                                                            }
                                                            </ButtonGroup>
                                                        </Typography>
                                                    </Box>
                                                </Grid>  
                                            </Grid>  
                                            <Grid 
                                                container 
                                                direction="column"
                                                alignItems="center"
                                                justifyContent="center"
                                                sx={{mt:2}}
                                            >
                                                <Grid item>
                                                {(hasProfilePicture && profilePictureUrl) ?
                                                    <Avatar sx={{ width: 100, height: 100 }} alt="Profile" src={profilePictureUrl} />
                                                :
                                                    <Jazzicon diameter={100} seed={jsNumberForAddress(pubkey)} />
                                                }
                                                </Grid>
                                                <Grid item
                                                    alignItems="center"
                                                    justifyContent="center"
                                                >
                                                    <Typography gutterBottom variant="body1" component="div" sx={{ flexGrow: 1, color:'white' }}>
                                                        {solanaDomain && solanaDomain.length > 0 ?
                                                        <Grid 
                                                            container 
                                                            direction="column"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                        >
                                                            <Grid item>
                                                                <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/address/${pubkey}`} target="_blank">
                                                                    <Typography gutterBottom variant="body1" component="div" sx={{ flexGrow: 1, color:'white' }}><strong>{solanaDomain}</strong></Typography>
                                                                </Button>
                                                            </Grid>
                                                            <Grid item sx={{mt:-1.5}}>
                                                                <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/address/${pubkey}`} target="_blank">
                                                                    <Typography gutterBottom variant="caption" component="div" sx={{ flexGrow: 1, color:'white' }}>{trimAddress(pubkey,4)}</Typography>
                                                                </Button>
                                                            </Grid>
                                                        </Grid>
                                                        :
                                                            <MakeLinkableAddress addr={pubkey} trim={5} hasextlink={true} hascopy={false} permalink={false} fontsize={14} />
                                                        }
                                                    </Typography>
                                                </Grid>
                                                <Grid item sx={{mt:1}}>
                                                    
                                                    {followListInfo && 
                                                        <>
                                                            
                                                            <Typography component="div" variant="caption" align="center" sx={{ flexGrow: 1 }}>
                                                                <Box
                                                                    sx={{border:'1px solid #fff', borderRadius:'17px',pl:5,pr:5, m:1}}
                                                                >
                                                                    <strong>{followListInfo.followingCount}</strong>&nbsp;  
                                                                    <Typography component="span" color="#aaa" variant="caption" align="center" sx={{ flexGrow: 1 }}>Following</Typography>&nbsp; 
                                                                </Box>
                                                                <Box
                                                                    sx={{border:'1px solid #fff', borderRadius:'17px',pl:5,pr:5, m:1}}
                                                                >
                                                                    <strong>{followListInfo.followerCount}</strong>&nbsp;
                                                                    <Typography component="span" color="#aaa" variant="caption" align="center" sx={{ flexGrow: 1 }}>Followers</Typography>
                                                                </Box>
                                                            </Typography>
                                                        </>
                                                    }
                                                    
                                                    { final_collection && final_collection.length > 0 && (
                                                        <>
                                                            <Typography component="div" variant="caption" align="center" color="#aaa"  sx={{ flexGrow: 1, mt:3 }}>
                                                                <strong>{final_collection.length}</strong> items collected
                                                            </Typography>
                                                        </>
                                                    )}
                                                    
                                                    
                                                            
                                                </Grid>
                                            </Grid>
                                            </ListItemText>
                                        </List>
                                    </Box>
                                    <MainMenu pubkey={pubkey} />
                                </Grid>
                                
                                <MainPanel thisPublicKey={pubkey} final_collection={final_collection} wallet_collection={wallet_collection} wallet_collection_meta={wallet_collection_meta} />
                            </Grid>
                        </Box>
                        
                    </Box>
            </React.Fragment>
        );
    }
    
}

/*
export async function performReverseLookup(
    connection: Connection,
    nameAccount: PublicKey
  ): Promise<string> {
    const hashedReverseLookup = await getHashedName(nameAccount.toBase58());
    const reverseLookupAccount = await getNameAccountKey(
      hashedReverseLookup,
      centralState
    );
  
    const name = await NameRegistryState.retrieve(
      connection,
      reverseLookupAccount
    );
    if (!name.data) {
      throw new Error("Could not retrieve name data");
    }
    const nameLength = new BN(name.data.slice(0, 4), "le").toNumber();
    return name.data.slice(4, 4 + nameLength).toString();
  }
*/

export async function findOwnedNameAccountsForUser(
    connection: Connection,
    userAccount: PublicKey
  ): Promise<PublicKey[]> {
    const NAME_PROGRAM_ID = new PublicKey('namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX');
    const filters = [
      {
        memcmp: {
          offset: 32,
          bytes: userAccount.toBase58(),
        },
      },
    ];
    const accounts = await connection.getProgramAccounts(NAME_PROGRAM_ID, {
      filters,
    });
    
    return accounts.map((a) => a.pubkey);    
}


export function ProfileView(this: any, props: any) {
    //const [provider, setProvider] = React.useState(getParam('provider'));
    const [gallery, setGallery] = React.useState(null);
    const [collection, setCollection] = React.useState(null);
    //const isConnected = session && session.isConnected;
    const [loading, setLoading] = React.useState(false);
    const [loadCount, setLoadCount] = React.useState(0);
    //const [success, setSuccess] = React.useState(false);
    const [pubkey, setPubkey] = React.useState(null);
    const [newinputpkvalue, setNewInputPKValue] = React.useState(null);
    const { publicKey } = useWallet();
    //const { handlekey } = useParams() as { 
    //    handlekey: string;
    //}
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const urlParams = searchParams.get("pkey") || handlekey;

    // console.log("SP: "+searchParams.get("pkey") + " vs "+ urlParams);

    const navigate = useNavigate();
    //const location = useLocation();
    
    const fetchWalletCollection = async () => {
        
        /*
        TokenAccountsFilter
        const response = await connection.getTokenAccountsByOwner(
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
        );*/

        const body = {
          method: "getTokenAccountsByOwner",
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            pubkey,
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { encoding: "jsonParsed", commitment: "processed" },
          ],
          id: "35f0036a-3801-4485-b573-2bf29a7c77d4",
        };
        
        const response = await fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
    
        const json = await response.json();
        try{
            //const err = json?.result || true;
            //if (!err){
            //    return [];
            //} else{
                const resultValues = json.result.value
                
                let walletCollection = new Array();
                let wallet = resultValues && resultValues?.map((collectionInfo: any) => {
                    (+collectionInfo.account.data.parsed.info.tokenAmount.amount >= 1) &&
                        (+collectionInfo.account.data.parsed.info.tokenAmount.decimals === 0) && 
                            walletCollection.push(collectionInfo);    
                            return collectionInfo;
                });
                return walletCollection;
            //}
        } catch(e){console.log(e);}
        return [];
    };

    const getWalletGallery = async () => {
        if (!loading){
            setLoading(true);
            setLoadCount(loadCount+1);

            let [collection] = await Promise.all([fetchWalletCollection()]);
            setCollection({
                collection
            })
            setLoading(false);
        } else{
            return (
                <Grid 
                    container 
                    direction="column" 
                    spacing={2} 
                    alignItems="center"
                    rowSpacing={8}
                >
                    <Grid 
                        item xs={12}
                    >
                        <CircularProgress color="inherit" />
                    </Grid>
                </Grid>
            )
        }
    }

    const CollectionProfile = (props: any) => {
        return (
                <Grid 
                    container 
                    direction="column" 
                    spacing={2} 
                    alignItems="center"
                    rowSpacing={8}
                >
                    <Grid 
                        item xs={12}
                    >
                        <Box
                            height="100%"
                            display="flex-grow"
                            justifyContent="center"
                        >
                            <GroupGalleryList gallery={gallery} collection={collection} pubkey={pubkey} setPubkey={setPubkey} />
                        </Box>
                    </Grid>
                </Grid>
        );
    }

    function handlePublicKeySubmit(event: any) {
        event.preventDefault();

        if (newinputpkvalue && newinputpkvalue.length>0 && ValidateAddress(newinputpkvalue)){
            //console.log("SETTER MANUAL: "+newinputpkvalue);
            //setNewInputPKValue(null);

            navigate({
                pathname: GRAPE_PROFILE+newinputpkvalue
            },
                { replace: true }
            );
            
        } else{
            setNewInputPKValue('');
        }
    }

    React.useEffect(() => { 
        if (pubkey){
            if (ValidateAddress(pubkey)){
                //props.history.push({
                navigate({
                    pathname: GRAPE_PROFILE+pubkey
                },
                    { replace: true }
                );
                console.log(loadCount);
                getWalletGallery();
            } else {
                navigate({
                    pathname: '/profile'
                },
                    { replace: true }
                );
            } 
        }
    }, [pubkey]);
    
    /*
    if (urlParams)
        console.log("urlParams: "+urlParams+ " v: "+ValidateAddress(urlParams));
    if (pubkey)
        console.log("pubkey: "+pubkey);
    if (publicKey)
        console.log("publicKey: "+publicKey.toBase58());
    */

    if ((urlParams) && (pubkey)){
        //console.log("SETTER 1: "+urlParams + " vs "+ pubkey);
        if (urlParams != pubkey){
            if (ValidateAddress(urlParams))
                setPubkey(urlParams);
        }
    } else if ((publicKey)&&(!pubkey)&&(!urlParams)){
        //console.log("SETTER 3: "+urlParams + " vs "+ pubkey);
        if (ValidateAddress(publicKey.toBase58()))
            setPubkey(publicKey.toBase58());
    }

    if (!pubkey){
        if (urlParams?.length > 0){
            //console.log("SETTER 2: "+urlParams);
            if (ValidateAddress(urlParams))
                setPubkey(urlParams);
        } else{
            // should we set the pubkey here based on if you are logged in?
            if (publicKey){
                if (ValidateAddress(publicKey.toBase58())){
                    if (publicKey !== pubkey){
                        if (!urlParams){
                            navigate({
                                pathname: GRAPE_PROFILE+publicKey.toBase58()
                            },
                                { replace: true }
                            );
                        }
                    }
                }
            }
        }
    } else {
        if(((!gallery) && (!collection))||
            (loading)){
            return (
            <React.Fragment>
                <Box
                    sx={{ 
                        p: 1, 
                        mb: 3, 
                        width: '100%',
                        background: '#13151C',
                        borderRadius: '24px'
                    }}
                > 
                        <Grid 
                            container 
                            direction="column" 
                            spacing={2} 
                            alignItems="center"
                            rowSpacing={8}
                        >
                            <Grid 
                                item xs={12}
                            >
                                <Box
                                    height="100%"
                                    display="flex"
                                    justifyContent="center"
                                >
                                    <CircularProgress color="inherit" />
                                </Box>
                            </Grid>
                        </Grid>
                </Box>
            </React.Fragment>
            )
        }
    }
    
    return (
        <React.Fragment>
            <Box
                sx={{
                    mt: 2,
                    
                }}
            >
                <Box>  

                        { pubkey && ValidateAddress(pubkey) ?
                            <CollectionProfile />
                        : 
                        <>
                            <React.Fragment>
                                <Box
                                    sx={{ 
                                        p: 1, 
                                        mb: 3, 
                                        width: '100%',
                                        background: '#13151C',
                                        borderRadius: '24px'
                                    }}
                                > 
                                        <Grid 
                                            container 
                                            direction="column" 
                                            spacing={2} 
                                            alignItems="center"
                                            rowSpacing={8}
                                        >
                                            
                                            <Grid 
                                                item xs={12}
                                            >
                                                <Paper
                                                    component="form"
                                                    onSubmit={handlePublicKeySubmit}
                                                    sx={{ m:2, p: 1, display: 'flex', alignItems: 'center', borderRadius: '24px' }}
                                                >
                                                    <InputBase
                                                        fullWidth
                                                        sx={{ ml: 1, flex: 1 }}
                                                        placeholder="Enter a wallet address"
                                                        inputProps={{ 'aria-label': 'wallet address' }}
                                                        value={newinputpkvalue}
                                                        onChange={(e) => setNewInputPKValue(e.target.value)}
                                                    />
                                                    <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
                                                        <SearchIcon />
                                                    </IconButton>
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    </Box>
                            </React.Fragment>
                        </>
                        }

                </Box>
            </Box>
        </React.Fragment>
    );
}
