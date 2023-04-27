import React, { useCallback } from "react";
import { Link } from "react-router-dom";

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletError } from '@solana/wallet-adapter-base';
import { BN, web3 } from '@project-serum/anchor';
//import spok from 'spok';

import { ChatNavigationHelpers, useDialectUiId } from '@dialectlabs/react-ui';
import { GRAPE_BOTTOM_CHAT_ID } from '../utils/ui-contants';
import moment from 'moment';
import { useSnackbar } from 'notistack';

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
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    CircularProgress,
} from '@mui/material';

import { 
    RPC_CONNECTION,
    GRAPE_PROFILE,
    PROXY
} from '../utils/grapeTools/constants';

import { 
    getReceiptsFromAuctionHouse,
    } from '../utils/grapeTools/helpers';

import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../utils/grapeTools/WalletAddress'; // global key handling
import ExplorerView from '../utils/grapeTools/Explorer';

import { gah_cancelListingReceipt } from '../utils/auctionHouse/gah_cancelListingReceipt';

import { TokenAmount } from '../utils/grapeTools/safe-math';
import { useTranslation } from 'react-i18next';

import CancelIcon from '@mui/icons-material/Cancel';
import Chat from '@mui/icons-material/Chat';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';

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
    const [mintOwner, setMintOwner] = React.useState(props.mintOwner || null);
    const [salePrice, setSalePrice] = React.useState(props.salePrice || null);
    const [salePriceAH, setSalePriceAH] = React.useState(props.salePriceAH || null);
    const [symbol, setSymbol] = React.useState(props.symbol || null);
    const ggoconnection = RPC_CONNECTION;
    const { connection } = useConnection();
    const { navigation, open } = useDialectUiId<ChatNavigationHelpers>(GRAPE_BOTTOM_CHAT_ID);
    const [receiptListing, setReceiptListing] = React.useState(null);
    const [receiptPurchase, setReceiptPurchase] = React.useState(null);
    const [receiptBid, setReceiptBid] = React.useState(null);
    const [receipts, setReceipts] = React.useState(null);
    const { t, i18n } = useTranslation();
    const { publicKey, sendTransaction, signTransaction } = useWallet();

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
                //let response = null;

                const apiUrl = PROXY+"https://api-mainnet.magiceden.dev/v2/collections/"+symbol+"/stats";
                
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

    const cancelMEListing = async (sellerPubKey:string,auctionHouseAddress:string,tokenAccount:string,price:any) => {
        try{
            //let response = null;

            const apiUrl = PROXY+"https://api-devnet.magiceden.dev/v2/instructions/sell_cancel?seller="+sellerPubKey+"&auctionHouseAddress="+auctionHouseAddress+"&tokenMint="+mint+"&tokenAccount="+tokenAccount+"&price="+price+"&sellerReferral=&expiry=-1";

            const resp = await window.fetch(apiUrl, {
                method: 'GET',
                redirect: 'follow',
                //body: JSON.stringify(body),
                //headers: { "Content-Type": "application/json" },
            })
            
            const json = await resp.json();

        } catch(e){console.log("ERR: "+e)}
    }

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );

    const handleCancelListingReceipt = async (listedPrice: number) => {
        //const listed = salePrice && salePrice > 0 ? true : false;  
        const listed = listedPrice && listedPrice > 0 ? true : false;  
        //const transactionInstr = await acceptOffer(offerAmount, mint, walletPublicKey, buyerAddress.toString(), updateAuthority, collectionAuctionHouse);
        if (listed){
            try {
                //START CANCEL LISTING
                //const transactionInstr = await cancelListing(salePrice, mint, walletPublicKey.toString(), mintOwner, updateAuthority, collectionAuctionHouse);
                const collectionAuctionHouse = salePriceAH;
                const transactionInstr = await gah_cancelListingReceipt(listedPrice, mint, publicKey.toString(), mintOwner, null, null, null, collectionAuctionHouse);
                const instructionsArray = [transactionInstr.instructions].flat();        
                const transaction = new Transaction()
                .add(
                    ...instructionsArray
                );
    
                enqueueSnackbar(`${t('Canceling Listing Receipt for')} ${listedPrice} SOL`,{ variant: 'info' });
                const signedTransaction = await sendTransaction(transaction, connection);
                
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
                const latestBlockHash = await connection.getLatestBlockhash();
                await ggoconnection.confirmTransaction({
                    blockhash: latestBlockHash.blockhash,
                    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                    signature: signedTransaction}, 
                    'processed'
                );
                closeSnackbar(cnfrmkey);
                const snackaction = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                        {signedTransaction}
                    </Button>
                );
                enqueueSnackbar(`${t('Listing Receipt Cancelled')}`,{ variant: 'success', action:snackaction });
                //END CANCEL LISTING
                //console.log("sending unicast message")
                
                //unicastGrapeSolflareMessage(`Listing Cancelled`, `Your listing for ${mintName} has been cancelled on grape.art`, image, publicKey.toString(), `https://grape.art${GRAPE_PREVIEW}${mint}`, signedTransaction, collectionAuctionHouse);

                /*
                const eskey = enqueueSnackbar(`${t('Metadata will be refreshed in a few seconds')}`, {
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    persist: true,
                });
                */
                
                /*
                setTimeout(function() {
                    closeSnackbar(eskey);
                    //setRefreshOffers(true);
                }, GRAPE_RPC_REFRESH);
                */
                
            }catch(e:any){
                closeSnackbar();
                enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
                //enqueueSnackbar(`Error: ${(e)}`,{ variant: 'error' });
                console.log("Error: "+e);
                //console.log("Error: "+JSON.stringify(e));
            }  
        }
        
    }

    const getHistory = async () => {
        if ((!loading) && (mint)){
            setLoading(true);

            const results = await getReceiptsFromAuctionHouse(null, null, null, mint, null, true, null);

            const activityResults = new Array();

            for (const item of results){
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

            try{
                //const response = null;
                
                const json = await fetchMEHistoryWithTimeout(mint,0);
                //console.log("json: "+JSON.stringify(json));

                try{
                    // here get the last sale and show it:
                    let found = false;
                    for (const item of json){
                        //console.log(item.type + ' ' + item.price + ' '+formatBlockTime(item.blockTime, true, true));
                        if (item.type === "buyNow"){
                            found = true;
                        }
                    }
                }catch(e){console.log("ERR: "+e);return null;}

                if (json){
                    let founddm = false;
                    for (const meitem of json){
                        let bookkeeper = meitem.seller;
                        const buyer = meitem.buyer;
                        const seller = meitem.seller;
                        let receiptType = '';
                        const createdAt = meitem.blockTime;
                        let cancelledAt = null;
                        
                        //console.log("ME: "+JSON.stringify(meitem));
                        let purchaeReceipt = null;
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
                        
                        let source = meitem.source;
                        if (source === "magiceden_v2")
                            source = "MagicEden v2"
                        if ((source === "auctionhouse")||(source === "solanart_ah")){
                            console.log("ah or sa ah");
                        } else {
                            let directmessage = null;
                            if ((activityResults.length === 0)||(!founddm)){
                                if (receiptType === 'listing_receipt'){
                                    directmessage = true;
                                    founddm = true;
                                }
                            }
                                
                            if (bookkeeper && bookkeeper.length > 0){
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
                                    source: source,
                                    directmessage:directmessage});
                            } else{
                                console.log("Found instance with no bookkeeper - "+createdAt+" - "+source+" - "+meitem.price)
                            }

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

    const Timeout = (time:number) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), time * 1000);
        return controller;
    };

    const fetchMEHistoryWithTimeout = async (mint:string,start:number) => {
        const apiUrl = PROXY+"https://api-mainnet.magiceden.dev/v2/tokens/"+mint+"/activities?offset="+start+"&limit=100";
        const resp = await window.fetch(apiUrl, {
            method: 'GET',
            redirect: 'follow',
            signal: Timeout(5).signal,
        })
        const json = await resp.json(); 
        return json
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
                                                                            {+item.price.toFixed(4)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
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
                                                        <TableCell><Typography variant="caption">Bookkeeper</Typography></TableCell>
                                                        <TableCell><Typography variant="caption">Status</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Amount</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Date</Typography></TableCell>
                                                        <TableCell>Marketplace</TableCell>
                                                    </TableRow>

                                                </TableHead>

                                                <TableBody>
                                                    {history && history.map((item: any, key: number) => (
                                                        
                                                        <TableRow key={key}>
                                                            
                                                            <TableCell>
                                                                <ButtonGroup>

                                                                    <ExplorerView address={item.bookkeeper} type='address' shorten={5} hideTitle={false} style='text' color='white' fontSize='14px' />

                                                                    {key === 0 &&
                                                                        <> 
                                                                            {/*item.bookkeeper === publicKey.toBase58() &&  item.bookkeeper !== mintOwner && item.state === "listing_receipt" && !salePrice &&
                                                                                <Tooltip title='Cancel Listing Receipt'>
                                                                                    <Button
                                                                                        onClick={() => {handleCancelListingReceipt(+item?.price)}}
                                                                                        color="error"
                                                                                            sx={{borderRadius:'17px',ml:1}}
                                                                                    >
                                                                                        <CancelIcon sx={{fontSize: 12}} />
                                                                                    </Button>
                                                                                </Tooltip>
                                                                            */}
                                                                        </>
                                                                    }

                                                                {item.directmessage &&
                                                                    <Tooltip title="Send a direct message">
                                                                        <Button
                                                                            variant='text'
                                                                            color='inherit'
                                                                            onClick={() => {
                                                                                open();
                                                                                navigation?.showCreateThread(item.bookkeeper);
                                                                            }}
                                                                            sx={{
                                                                                m:0,p:0,
                                                                                textTransform: 'none',
                                                                                borderRadius: '17px',
                                                                                transition:
                                                                                    'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                                                                            
                                                                            }}
                                                                        >
                                                                            
                                                                            <Chat
                                                                                sx={{ fontSize: 12, color: 'white' }}
                                                                            />
                                                                        </Button>
                                                                    </Tooltip>
                                                                }
                                                                </ButtonGroup>
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
                                                                        <Button size="small" variant="text" sx={{ml:1,color:'white',borderRadius:'24px'}} target='_blank' href={`https://explorer.solana.com/address/${item.auctionHouse.toBase58()}/anchor-account`}>
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