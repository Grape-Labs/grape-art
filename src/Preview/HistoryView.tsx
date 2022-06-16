import React from "react";
import { Link } from "react-router-dom";

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BN, web3 } from '@project-serum/anchor';
//import spok from 'spok';

import moment from 'moment';

import {
    Typography,
    Grid,
    Box,
    Button,
    ButtonGroup,
    Skeleton,
    Collapse,
    Table,
    TableHead,
    TableBody,
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

import {
    AUCTION_HOUSE_PROGRAM_ID,
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    WRAPPED_SOL_MINT,
    TOKEN_PROGRAM_ID,
} from '../utils/auctionHouse/helpers/constants';

import { AuctionHouseProgram  } from '@metaplex-foundation/mpl-auction-house';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

import { 
    GRAPE_RPC_ENDPOINT,
    GRAPE_PROFILE,
} from '../utils/grapeTools/constants';

import { 
    getReceiptsFromAuctionHouse,
    } from '../utils/grapeTools/helpers';

import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../utils/grapeTools/WalletAddress'; // global key handling

import { TokenAmount } from '../utils/grapeTools/safe-math';

import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BallotIcon from '@mui/icons-material/Ballot';
import SellIcon from '@mui/icons-material/Sell';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';
import CancelIcon from '@mui/icons-material/Cancel';
import { ConstructionOutlined, SentimentSatisfiedSharp } from "@mui/icons-material";

function convertSolVal(sol: any){
    try{
        sol = parseFloat(new TokenAmount(sol, 9).format()).toFixed(4);
    }catch(e){console.log("ERR: "+e)}
    return sol;
}

export default function HistoryView(props: any){
    const [history, setHistory] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [open_history_collapse, setOpenHistoryCollapse] = React.useState(false);
    const [openHistory, setOpenHistory] = React.useState(0);
    const [historyME, setMEHistory] = React.useState(null);
    const [statsME, setMEStats] = React.useState(null);
    const [openMEHistory, setMEOpenHistory] = React.useState(0);
    const [me_open_history_collapse, setMEOpenHistoryCollapse] = React.useState(false);
    const [mint, setMint] = React.useState(props.mint || null);
    const [symbol, setSymbol] = React.useState(props.symbol || null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();

    const [receiptListing, setReceiptListing] = React.useState(null);
    const [receiptPurchase, setReceiptPurchase] = React.useState(null);
    const [receiptBid, setReceiptBid] = React.useState(null);
    const [receipts, setReceipts] = React.useState(null);

    const handleMEClick = () => {
        setMEOpenHistoryCollapse(!me_open_history_collapse);
    }

    const handleClick = () => {
        setOpenHistoryCollapse(!open_history_collapse);
    }

    const getMEStats = async () => {
        setLoading(true);

        if (mint){
            try{
                let response = null;

                const apiUrl = "https://corsproxy.io/?https://api-mainnet.magiceden.dev/v2/collections/"+symbol+"/stats";
                
                const resp = await window.fetch(apiUrl, {
                    method: 'GET',
                    redirect: 'follow',
                    //body: JSON.stringify(body),
                    //headers: { "Content-Type": "application/json" },
                })

                const json = await resp.json();
                //console.log("json: "+JSON.stringify(json));
                setMEStats(json);
            } catch(e){console.log("ERR: "+e)}
        }
        setLoading(false);
    }

    const getMEHistory = async () => {
        
        setLoading(true);
        
        if (mint){
            try{
                let response = null;

                const apiUrl = "https://corsproxy.io/?https://api-mainnet.magiceden.dev/v2/tokens/"+mint+"/activities?offset=0&limit=100";
                
                const resp = await window.fetch(apiUrl, {
                    method: 'GET',
                    redirect: 'follow',
                    //body: JSON.stringify(body),
                    //headers: { "Content-Type": "application/json" },
                })

                const json = await resp.json();
                //console.log("json: "+JSON.stringify(json));
                try{
                    // here get the last sale and show it:
                    // grape-art-last-sale
                    
                    let found = false;
                    for (var item of json){
                        //console.log(item.type + ' ' + item.price + ' '+formatBlockTime(item.blockTime, true, true));
                        if (item.type === "buyNow"){
                            let elements = document.getElementById("grape-art-last-sale");
                            if (!found){
                                //elements.innerHTML = 'Last sale '+item.price+'sol on '+formatBlockTime(item.blockTime, true, false);
                            }
                            found = true;
                        }
                    }
                }catch(e){console.log("ERR: "+e);return null;}

                setMEHistory(json);
                setMEOpenHistory(json.length);
            } catch(e){console.log("ERR: "+e)}
        }
        setLoading(false);
    }

    const getHistory = async () => {
        if ((!loading) && (mint)){
            setLoading(true);

            const results = await getReceiptsFromAuctionHouse(null, null, mint, null, true);

            const activityResults = new Array();

            for (var item of results){
                //const mintitem = await getMintFromVerifiedMetadata(item.metadata.toBase58(), collectionMintList);
                //console.log("> history: "+JSON.stringify(item));
                //console.log("mintitem: "+JSON.stringify(mintitem));
                activityResults.push({
                    buyeraddress: item.bookkeeper.toBase58(), 
                    bookkeeper: item.bookkeeper.toBase58(), 
                    amount: item.price, 
                    price: item.price, 
                //    mint: mintitem?.address, 
                //    metadataParsed:mintitem, 
                    isowner: false, 
                    createdAt: item.createdAt, 
                    cancelledAt: item.canceledAt, 
                    timestamp: timeAgo(item.createdAt), 
                    blockTime: item.createdAt, 
                    state: item?.receipt_type, 
                    tradeState: item.tradeState, 
                    purchaseReceipt: item.purchaseReceipt, 
                    auctionHouse: item?.auctionHouse, 
                    seller: item?.seller, 
                    buyer: item?.buyer, 
                    source: "auctionhouse"});
            }

            /*
            const offerResults = new Array();
            const listingResults: any[] = [];
            for (var item of results){
                //const mintitem = await getMintFromMetadata(null, item?.metadata);
                
                if (!item?.canceledAt){
                        console.log("item: "+JSON.stringify(item));
                        if (item.receipt_type==='bid_receipt'){
                            offerResults.push({buyeraddress: item.bookkeeper.toBase58(), bookkeeper: item.bookkeeper.toBase58(), amount: item.price, price: item.price, mint: mint, isowner: false, createdAt: item.createdAt, cancelledAt: item.canceledAt, timestamp: item.createdAt, blockTime: item.createdAt, state: item?.receipt_type});
                        } else if (item.receipt_type==='listing_receipt'){
                            listingResults.push({buyeraddress: item.bookkeeper.toBase58(), bookkeeper: item.bookkeeper.toBase58(), amount: item.price, price: item.price, mint: mint, isowner: false, createdAt: item.createdAt, cancelledAt: item.canceledAt, timestamp: item.createdAt, blockTime: item.createdAt, state: item?.receipt_type});
                        } else if (item.receipt_type==='cancel_listing_receipt'){
                            listingResults.push({buyeraddress: item.bookkeeper.toBase58(), bookkeeper: item.bookkeeper.toBase58(), amount: item.price, price: item.price, mint: mint, isowner: false, createdAt: item.createdAt, cancelledAt: item.canceledAt, timestamp: item.createdAt, blockTime: item.createdAt, state: item?.receipt_type});
                        }
                }
            }
            */

            // fetch also history for ME

            try{
                let response = null;

                const apiUrl = "https://corsproxy.io/?https://api-mainnet.magiceden.dev/v2/tokens/"+mint+"/activities?offset=0&limit=100";
                
                const resp = await window.fetch(apiUrl, {
                    method: 'GET',
                    redirect: 'follow',
                    //body: JSON.stringify(body),
                    //headers: { "Content-Type": "application/json" },
                })

                const json = await resp.json();
                //console.log("json: "+JSON.stringify(json));
                try{
                    // here get the last sale and show it:
                    // grape-art-last-sale
                    
                    let found = false;
                    for (var item of json){
                        //console.log(item.type + ' ' + item.price + ' '+formatBlockTime(item.blockTime, true, true));
                        if (item.type === "buyNow"){
                            found = true;
                        }
                    }
                }catch(e){console.log("ERR: "+e);return null;}

                if (json){
                    for (var meitem of json){
                        var bookkeeper = meitem.seller;
                        var buyer = meitem.buyer;
                        var seller = meitem.seller;
                        var receiptType = '';
                        var createdAt = meitem.blockTime;
                        var cancelledAt = null;
                        
                        console.log("ME: "+JSON.stringify(meitem));
                        var purchaeReceipt = null;
                        if (buyer && seller){
                            bookkeeper = buyer;
                            purchaeReceipt = 'purchase_receipt';
                        }
                        if (meitem.type === 'list'){
                            receiptType = 'listing_receipt'
                        } else if (meitem.type === 'bid'){
                            receiptType = 'bid_receipt'
                        } else if (meitem.type === 'delist'){
                            receiptType = 'cancel_listing_receipt'
                            if (meitem.blockTime)
                                cancelledAt = meitem.blockTime
                        } else if (meitem.type === 'buyNow'){
                            receiptType = 'purchase_receipt'
                            purchaeReceipt = meitem.signature;
                        }
                        
                        var source = meitem.source;
                        if (source === "magiceden_v2")
                            source = "Magic-Eden"
                        if ((source === "auctionhouse")||(source === "solanart_ah")){

                        } else {
                            activityResults.push({
                                buyeraddress: bookkeeper, 
                                bookkeeper: bookkeeper, 
                                amount: meitem.price, 
                                price: meitem.price, 
                                isowner: false, 
                                createdAt: createdAt, 
                                cancelledAt: cancelledAt, 
                                timestamp: timeAgo(createdAt), 
                                blockTime: createdAt, 
                                state: receiptType, 
                                tradeState: null, 
                                purchaseReceipt: null, 
                                auctionHouse: null,
                                seller: seller, 
                                buyer: buyer, 
                                source: source});
                        }

                        
                    }
                }


            } catch(e){console.log("ERR: "+e)}


            // sort by date
            //offerResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);
            //listingResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);

            // sort by date
            activityResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);
            const dupRemovedResults = activityResults.filter( activity => !activity.purchaseReceipt)
            //const dupRemovedResults2 = activityResults.filter( activity => !activity.blockTime)
            //activityResults.push({buyeraddress: feePayer.toBase58(), amount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: forSaleDate, blockTime: value.blockTime, state: memo_json?.state || memo_json?.status});
            
            setHistory(dupRemovedResults);
            setOpenHistory(dupRemovedResults.length);

            //return dupRemovedResults;


        }
        setLoading(false);
    }

    React.useEffect(() => {
        if (mint){
            if (!loading){
                getHistory();
            }
        }
    }, [mint]);

    if (loading){
        /*return <></>*/
        
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
                {historyME && historyME.length > 0 &&
                    <Box
                        sx={{ 
                            p: 1, 
                            mb: 3, 
                            width: '100%',
                            background: '#13151C',
                            borderRadius: '24px'
                        }}
                    > 
                        <ListItemButton onClick={handleMEClick}
                            sx={{borderRadius:'20px'}}
                        >
                            <ListItemIcon>
                            <BarChartOutlinedIcon />
                            </ListItemIcon>
                            <ListItemText 
                                primary='Magic Eden History'
                            />
                                <Typography variant="caption"><strong>{openMEHistory}</strong></Typography>
                                {me_open_history_collapse ? <ExpandLess /> : <ExpandMoreIcon />}
                        </ListItemButton>
                        <Collapse in={me_open_history_collapse} timeout="auto" unmountOnExit>
                            <List component="div" 
                                sx={{ 
                                    width: '100%',
                                }}>
                                <ListItemText>
                                    <Box sx={{ margin: 1 }}>
                                        <TableContainer>
                                            <Table size="small" aria-label="purchases">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell><Typography variant="caption">Source</Typography></TableCell>
                                                        <TableCell><Typography variant="caption">Owner</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Amount</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Date</Typography></TableCell>
                                                        <TableCell>Signature</TableCell>
                                                    </TableRow>

                                                </TableHead>

                                                <TableBody>
                                                    {historyME && historyME.map((item: any) => (
                                                        <>
                                                            {//item.buyer &&
                                                            <TableRow>
                                                                <TableCell>
                                                                    {item.seller ?
                                                                        <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item.seller}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                            {trimAddress(item.seller,3)}
                                                                        </Button>   
                                                                    :
                                                                        <Typography variant="body2" sx={{textAlign:'center'}}>
                                                                            {item.type.toLocaleUpperCase()}
                                                                        </Typography>
                                                                    } 
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.buyer ?
                                                                        <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item.buyer}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                            {trimAddress(item.buyer,3)}
                                                                        </Button>
                                                                    :    
                                                                        <Typography variant="body2" sx={{textAlign:'center'}}>
                                                                            {item.type.toLocaleUpperCase()}
                                                                        </Typography>
                                                                    }    
                                                                </TableCell>
                                                                <TableCell  align="right">
                                                                        <Typography variant="body2">
                                                                            {item.price} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                                                        </Typography>
                                                                    </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="caption">
                                                                        <Tooltip
                                                                            title={formatBlockTime(item.blockTime, true, true)}
                                                                        >
                                                                            <Button size="small">{timeAgo(item.blockTime)}</Button>
                                                                        </Tooltip>
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/tx/${item.signature}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                        {trimAddress(item.signature,3)}
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                            }
                                                        </>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                </ListItemText>
                            </List>
                        </Collapse>
                    </Box>
                }
                {history && history.length > 0 &&
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
                            <BarChartOutlinedIcon />
                            </ListItemIcon>
                            <ListItemText 
                                primary='History'
                            />
                                <Typography variant="caption"><strong>{openHistory}</strong></Typography>
                                {open_history_collapse ? <ExpandLess /> : <ExpandMoreIcon />}
                        </ListItemButton>
                        <Collapse in={open_history_collapse} timeout="auto" unmountOnExit>
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
                                                        <TableCell><Typography variant="caption">Bookeeper</Typography></TableCell>
                                                        <TableCell><Typography variant="caption">Status</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Amount</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Date</Typography></TableCell>
                                                        <TableCell>Marketplace</TableCell>
                                                    </TableRow>

                                                </TableHead>

                                                <TableBody>
                                                    {history && history.map((item: any) => (
                                                        <TableRow>
                                                            
                                                            <TableCell>
                                                                <Tooltip title={'View Bookkeeper Profile'}>
                                                                    <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item.bookkeeper}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                        {trimAddress(item.bookkeeper,4)}
                                                                    </Button>
                                                                </Tooltip>
                                                            </TableCell>
                                                            <TableCell>
                                                                
                                                                    <Typography variant="body2" sx={{textAlign:'center'}}>
                                                                        
                                                                        {item?.purchaseReceipt ?
                                                                            <>Sale 
                                                                                {item.purchaseReciept && item.purchaseReceipt.length >0 &&
                                                                                <Typography variant="caption">({trimAddress(item.purchaseReceipt.toBase58(),3)})</Typography>
                                                                                }
                                                                            </>
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

                                                                    </Typography>
                                                                
                                                            </TableCell>
                                                            <TableCell  align="right">
                                                                    <Typography variant="body2">
                                                                        {(item?.price)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                                                    </Typography>
                                                                </TableCell>
                                                            <TableCell align="right">
                                                                <Typography variant="caption">
                                                                    <Tooltip
                                                                        title={formatBlockTime(item.blockTime, true, true)}
                                                                    >
                                                                        <Button size="small">{timeAgo(item?.blockTime)}</Button>
                                                                    </Tooltip>
                                                                </Typography>
                                                            </TableCell>
                                                            {item.source === 'auctionhouse' ?
                                                                <TableCell>
                                                                    <Tooltip title={'Auction House'}>
                                                                        <Button size="small" variant="text" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                            {trimAddress(item.auctionHouse.toBase58(),4)}
                                                                        </Button>
                                                                    </Tooltip>
                                                                </TableCell> 
                                                            :
                                                                <TableCell>
                                                                    <Tooltip title={'Escrow'}>
                                                                        <Button size="small" variant="text" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                            {item.source}
                                                                        </Button>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            }
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                </ListItemText>
                            </List>
                        </Collapse>
                    </Box>
                }
            </>
        )
    }

}