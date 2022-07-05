import * as React from 'react';
import { styled } from '@mui/material/styles';

import { Link, useLocation, NavLink } from 'react-router-dom';
import { TokenAmount } from '../utils/grapeTools/safe-math';

import {
    Box,
    Button,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Typography,
    Table,
    TableCell,
    TableRow,
    Tooltip,
    LinearProgress,
    Hidden,
} from '@mui/material';

import { PreviewView } from "../Preview/Preview";

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import GrapeIcon from '../components/static/GrapeIcon';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CircularProgress from '@mui/material/CircularProgress';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { WalletConnectButton } from "@solana/wallet-adapter-material-ui";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { BN, web3 } from '@project-serum/anchor';

import { red } from '@mui/material/colors';

import {
    AUCTION_HOUSE_PROGRAM_ID,
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    WRAPPED_SOL_MINT,
  } from '../utils/auctionHouse/helpers/constants';
import {
    loadAuctionHouseProgram,
    getAuctionHouseBuyerEscrow,
    getTokenAmount,
    getAuctionHouseTradeState,
    getAtaForMint,
  } from '../utils/auctionHouse/helpers/accounts';


import {
    METAPLEX_PROGRAM_ID,
} from '../utils/auctionHouse/helpers/constants';

import { decodeMetadata } from '../utils/grapeTools/utils';
import { 
    getReceiptsFromAuctionHouse,
    getMintFromVerifiedMetadata } from '../utils/grapeTools/helpers';
import { 
    GRAPE_RPC_ENDPOINT, 
    GRAPE_PREVIEW, 
    GRAPE_PROFILE, 
} from '../utils/grapeTools/constants';

import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling

import { useTranslation } from 'react-i18next';

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

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
}));

export default function ActivityView(props: any){
    const mode = props.mode;
    const collectionAuthority = props.collectionAuthority;
    const collectionMintList = props.collectionMintList;
    const auctionHouseListings = props.activity;
    const tokenPrice = props.tokenPrice;
    const tokenToSymbol = props?.tokenToSymbol || 'USDC';
    const meStats = props.meStats;
    const MD_PUBKEY = METAPLEX_PROGRAM_ID;
    const [open, setOpenDialog] = React.useState(false);
    const { t, i18n } = useTranslation();
    const { publicKey } = useWallet();
    const [walletCollection, setWalletCollection] = React.useState(null);
    const [collectionMetaFinal,setCollectionMetaFinal] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [activityLoaded, setActivityLoaded] = React.useState(false);
    const [recentActivity, setRecentActivity] = React.useState(null);
    const [selectedMint, setSelectedMint] = React.useState(null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const rpclimit = 100;

    const handleClickOpenDialog = async () => {
        await getAllActivity();
        //if (activityLoaded)
        setOpenDialog(true);
    };
    
    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const fetchAllActivity = async () => {
        
        try {
            setActivityLoaded(false);
            //if (!recentActivity){
                if (mode === 0){
                    if (!recentActivity){
                        //console.log("with aH: "+ collectionAuthority.auctionHouse+" - "+JSON.stringify(collectionAuthority))
                        const results = await getReceiptsFromAuctionHouse(collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS, null, null, null, false, null);

                        const activityResults = new Array();

                        for (var item of results){

                            const mintitem = await getMintFromVerifiedMetadata(item.metadata.toBase58(), collectionMintList);
                            //console.log("> item: "+JSON.stringify(item));
                            //console.log("mintitem: "+JSON.stringify(mintitem));
                            if (mintitem?.address){
                                activityResults.push({
                                    buyeraddress: item.bookkeeper.toBase58(), 
                                    bookkeeper: item.bookkeeper.toBase58(), 
                                    amount: item.price, 
                                    price: item.price, 
                                    mint: mintitem?.address, 
                                    metadataParsed:mintitem, 
                                    isowner: false, 
                                    createdAt: item.createdAt, 
                                    cancelledAt: item.canceledAt, 
                                    timestamp: timeAgo(item.createdAt), 
                                    blockTime: item.createdAt, 
                                    state: item?.receipt_type, 
                                    tradeState: item.tradeState, 
                                    purchaseReceipt: item.purchaseReceipt, 
                                    seller: item?.seller, 
                                    buyer: item?.buyer});
                            }
                        }

                        // sort by date
                        activityResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);
                        const dupRemovedResults = activityResults.filter( activity => !activity.purchaseReceipt)
                        //activityResults.push({buyeraddress: feePayer.toBase58(), amount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: forSaleDate, blockTime: value.blockTime, state: memo_json?.state || memo_json?.status});
                        return dupRemovedResults;
                    }
                } else if (mode === 1){
                    if (!recentActivity){
                        //console.log("with aH: "+ collectionAuthority.auctionHouse+" - "+JSON.stringify(collectionAuthority))
                        const results = await getReceiptsFromAuctionHouse(collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS, null, null, null, false, null);

                        const activityResults = new Array();

                        for (var item of results){

                            const mintitem = await getMintFromVerifiedMetadata(item.metadata.toBase58(), collectionMintList);
                            //console.log("> item: "+JSON.stringify(item));
                            //console.log("mintitem: "+JSON.stringify(mintitem));
                            if (mintitem?.address){
                                activityResults.push({
                                    buyeraddress: item.bookkeeper.toBase58(), 
                                    bookkeeper: item.bookkeeper.toBase58(), 
                                    amount: item.price, 
                                    price: item.price, 
                                    mint: mintitem?.address, 
                                    metadataParsed:mintitem, 
                                    isowner: false, 
                                    createdAt: item.createdAt, 
                                    cancelledAt: item.canceledAt, 
                                    timestamp: timeAgo(item.createdAt), 
                                    blockTime: item.createdAt, 
                                    state: item?.receipt_type, 
                                    tradeState: item.tradeState, 
                                    purchaseReceipt: item.purchaseReceipt,
                                    seller: item?.seller, 
                                    buyer: item?.buyer});
                            }
                        }

                        // sort by date
                        activityResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);
                        const dupRemovedResults = activityResults.filter( activity => !activity.purchaseReceipt)
                        //activityResults.push({buyeraddress: feePayer.toBase58(), amount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: forSaleDate, blockTime: value.blockTime, state: memo_json?.state || memo_json?.status});
                        return dupRemovedResults;
                    }
                } else if (mode === 2){

                    //console.log("with aH: "+ collectionAuthority.auctionHouse+" - "+JSON.stringify(collectionAuthority))
                    const results = await getReceiptsFromAuctionHouse(collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS, publicKey.toBase58(), null, null, false, null);

                    const activityResults = new Array();

                    for (var item of results){
                        const mintitem = await getMintFromVerifiedMetadata(item.metadata.toBase58(), collectionMintList);
                        //console.log("> item: "+JSON.stringify(item));
                        //console.log("mintitem: "+JSON.stringify(mintitem));
                        if (mintitem?.address){
                            activityResults.push({
                                buyeraddress: item.bookkeeper.toBase58(), 
                                bookkeeper: item.bookkeeper.toBase58(), 
                                amount: item.price, 
                                price: item.price, 
                                mint: mintitem?.address, 
                                metadataParsed:mintitem, 
                                isowner: false, 
                                createdAt: item.createdAt, 
                                cancelledAt: item.canceledAt, 
                                timestamp: timeAgo(item.createdAt), 
                                blockTime: item.createdAt, 
                                state: item?.receipt_type, 
                                purchaseReceipt: item.purchaseReceipt, 
                                seller: item?.seller, 
                                buyer: item?.buyer
                            });
                        }
                    }

                    // sort by date
                    activityResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);
                    const dupRemovedResults = activityResults.filter( activity => !activity.purchaseReceipt)
                    //activityResults.push({buyeraddress: feePayer.toBase58(), amount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: forSaleDate, blockTime: value.blockTime, state: memo_json?.state || memo_json?.status});
                    return dupRemovedResults;
                }

            //}

            setActivityLoaded(true);
            return null;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getAllActivity = async () => {
        setLoading(true);
        
        if (!auctionHouseListings){
            console.log("Fetching on chain recent activity");
            
            const [activityResults] = await Promise.all([fetchAllActivity()]);
            //console.log("activityResults: "+JSON.stringify(activityResults));
            //setRecentActivity(JSON.parse(JSON.stringify(activityResults)));
            setRecentActivity(activityResults);
        } else{
            console.log("With recent activity");
            // transpose auctionHouseListings
            const activityResults = new Array();
            for (var item of auctionHouseListings){
                if (item?.mint){
                    activityResults.push({
                        buyeraddress: item.buyeraddress, 
                        amount: item.amount, 
                        mint: item?.mint, 
                        isowner: false, 
                        blockTime: item.blockTime, 
                        timestamp: item.timestamp, 
                        state: item?.state, 
                        purchaseReceipt: item?.purchaseReceipt, 
                        seller: item?.seller
                    })
                }
            }
            
            setRecentActivity(auctionHouseListings);
            
            //console.log("auctionHouseListings "+JSON.stringify(auctionHouseListings))
        }

        setLoading(false);
    }

    function RecentActivityRow(props:any){
        const item = props.item;
        const key = props.key;
        const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);

        const handleClickOpenPreviewDialog = () => {
            setOpenPreviewDialog(true);
        };
        
        const handleClosePreviewDialog = () => {
            setOpenPreviewDialog(false);
        };
        
        return (
            <>
                <TableRow sx={{border:'none'}} key={key}>
                    <TableCell>
                        <Tooltip title={t('Visit Bookkeeper Profile')}>
                            <Button
                                variant="text"
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
                        
                        {item?.purchaseReceipt ?
                            <>Sale <Typography variant="caption">({trimAddress(item.purchaseReceipt.toBase58(),3)})</Typography></>
                        :
                            <>
                            {item.state === "bid_receipt" && 
                                <>Offer
                                {item?.cancelledAt &&
                                    <> Cancelled</>
                                }</>
                            }
                            {item.state === "listing_receipt" && 
                                <>Listing
                                {item?.cancelledAt &&
                                    <> Cancelled</>
                                }
                                </>}
                            {item.state === "cancel_listing_receipt" && 
                                <>Listing Cancelled</>
                            }

                            {item.state === "purchase_receipt" && 
                                <>Sale</>
                            }
                            </>
                        } 

                        
                    </Typography></TableCell>
                    <TableCell  align="center"><Typography variant="h6">
                        {(item.price)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                    </Typography></TableCell>
                    <TableCell align="right">
                        <Tooltip title={t('View NFT')}>
                            <Button
                                variant="text"
                                //component={Link} to={`${GRAPE_PREVIEW}${item.mint}`}
                                onClick={handleClickOpenPreviewDialog}
                                sx={{borderRadius:'24px'}}
                            >
                                <Avatar
                                    src={'https://solana-cdn.com/cdn-cgi/image/width=256/'+item.metadataParsed?.image}
                                    sx={{
                                        backgroundColor:'#222',
                                        width: 40, 
                                        height: 40,
                                        mr:1
                                    }}
                                ></Avatar>

                                <Typography variant="caption">
                                    {item.metadataParsed?.name ?
                                        <>{item.metadataParsed?.name}</>
                                        :
                                        <>{trimAddress(item.mint, 3)}</>
                                    }
                                    
                                </Typography>
                            </Button>
                        </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                        <Typography variant="caption">
                            <Tooltip title={formatBlockTime(item.blockTime, true, true)}>
                                <Button 
                                variant="text" size='small' sx={{borderRadius:'24px'}}>{(item.timestamp)}</Button>
                            </Tooltip>
                        </Typography>
                    </TableCell>
                    <TableCell align="center"> 
                        <Tooltip title={t('View')}>
                            <Button 
                                color="error"
                                variant="text"
                                onClick={handleClickOpenPreviewDialog}
                                //component={Link} to={`${GRAPE_PREVIEW}${item.mint}`}
                                //onClick={() => handleCancelWithdrawOffer(convertSolVal(item.offeramount), item.mint, item.updateAuthority)}
                                sx={{
                                    borderRadius: '24px',
                                }}
                            >
                                <ArrowForwardIcon />
                            </Button>
                        </Tooltip>
                    </TableCell>
                </TableRow>
                <BootstrapDialog 
                    fullWidth={true}
                    maxWidth={"lg"}
                    open={openPreviewDialog} onClose={handleClosePreviewDialog}
                    PaperProps={{
                        style: {
                            background: '#13151C',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px'
                        }
                    }}
                >
                    <DialogContent>
                        <PreviewView handlekey={item.mint} />
                    </DialogContent>
                    <DialogActions>
                        <Button variant="text" onClick={handleClosePreviewDialog}>{t('Close')}</Button>
                    </DialogActions>
                </BootstrapDialog>
            </> 
        )
    }

    function RecentActivity(props:any){
        const recentActivity = props.recentActivity;

        return (
            <Table size="small" aria-label="offers">
                {recentActivity && recentActivity.map((item: any, key:number) => (
                    <RecentActivityRow item={item} key={key} />
                ))}
            </Table>

        )
    }

    /*
    React.useEffect(() => {
        if (refresh)
            getAllActivity();
    }, [refresh]);
    */

    return (
        <>
            {mode === 0 || mode === 1 ?
                <>
                    {loading ?
                    <>
                        {mode === 0 ?
                            <Box
                                className='grape-store-stat-item'
                                sx={{borderRadius:'24px',m:2,p:1}}
                                >
                                <Typography variant="body2" sx={{color:'yellow'}}>
                                    VOLUME/ACTIVITY
                                </Typography>
                                <Typography variant="subtitle2">
                                    loading...
                                </Typography>
                            </Box>
                        :
                            <Button 
                                sx={{
                                    color:'white',
                                    verticalAlign: 'middle',
                                    display: 'inline-flex',
                                    borderRadius:'17px'
                                }}
                            >
                                Loading
                            </Button>
                        }
                    </>
                    :   
                    <>
                        {mode === 0 ?
                            <Tooltip title={meStats ? <strong>{((meStats.volumeAll/1000000000000)*tokenPrice).toFixed(2)}K {tokenToSymbol}</strong> : `Volume`}>
                                <Button 
                                    variant="text"
                                    onClick={handleClickOpenDialog}
                                    sx={{
                                        color:'white',
                                        verticalAlign: 'middle',
                                        display: 'inline-flex',
                                        borderRadius:'17px',
                                        m:0,
                                        p:0
                                    }}
                                >
                                    <Box
                                        className='grape-store-stat-item'
                                        sx={{borderRadius:'24px',m:2,p:1}}
                                    >
                                        <Typography variant="body2" sx={{color:'yellow'}}>
                                            VOLUME/ACTIVITY
                                        </Typography>
                                        <Typography variant="subtitle2">
                                            {meStats ?
                                                <>{(meStats.volumeAll/1000000000000).toFixed(1)}k SOL</>
                                            :
                                                <>
                                                {(collectionAuthority.volume/1000).toFixed(1)}k SOL
                                                </>
                                            }
                                        </Typography>
                                    </Box>
                                </Button>
                            </Tooltip>
                        :
                            <Button 
                                onClick={handleClickOpenDialog}
                                sx={{
                                    color:'white',
                                    verticalAlign: 'middle',
                                    display: 'inline-flex',
                                    borderRadius:'17px'
                                }}
                            >
                                {t('Activity')}
                            </Button>
                        }
                    </>
                    }
                </>
            :
                <>
                    <Button 
                        onClick={handleClickOpenDialog}
                        sx={{
                            color:'white',
                            verticalAlign: 'middle',
                            display: 'inline-flex',
                            borderRadius:'17px'
                        }}
                    >
                        {publicKey ?
                            <>
                                <>
                                    {t('My')}
                                </>
                                <Hidden smDown>
                                    {` ${t('Activity')}`}
                                </Hidden>
                            </>
                        :
                            <>
                                <>
                                    {t('Connect')}
                                </>
                                <Hidden smDown>
                                    {` ${t('your wallet')}`}
                                </Hidden>
                            </>
                   
                        }   
                    </Button>
                </>
            }


            <BootstrapDialog 
                fullWidth={true}
                maxWidth={"lg"}
                open={open} onClose={handleCloseDialog}
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
                    {mode === 2 ?
                    <>
                        {t('My Recent Activity')}
                    </>
                    :
                    <>{t('Recent Activity')}</>
                    }
                        <Tooltip title={`Auction House ${collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS}`}>
                            <Button sx={{color:'white',borderRadius:'17px'}} variant="text" size="small">
                                <InfoOutlinedIcon fontSize='small' />
                            </Button>
                        </Tooltip>
                </DialogTitle>
                <DialogContent>
                    <List>

                        {mode === 0 || mode === 1 ?
                            <>
                                {loading ?
                                    <>
                                        <LinearProgress />
                                    </>
                                : 
                                <>
                                    {!recentActivity &&
                                        <>no activity</>
                                    }
                                    
                                    <RecentActivity recentActivity={recentActivity}/>

                                </>
                                }
                            </>
                        :
                        <>
                        { !publicKey || loading ?
                            <>
                                {publicKey ?
                                <>
                                    <LinearProgress />
                                </>
                                :
                                <>
                                    <WalletConnectButton />
                                </>
                                }
                            </>
                        :  
                        <>
                            {!recentActivity &&
                                <>no activity</>
                            }
                            
                            <RecentActivity recentActivity={recentActivity}/>

                        </>
                        }
                    </>
                    }
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button variant="text" onClick={handleCloseDialog}>{t('Close')}</Button>
                </DialogActions>
            </BootstrapDialog> 

        </>
  );
}