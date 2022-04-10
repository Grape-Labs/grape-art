import React from "react";
import { Link } from "react-router-dom";

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BN, web3 } from '@project-serum/anchor';
import spok from 'spok';

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

import { AuctionHouse, AuctionHouseArgs } from '../utils/auction-house/js/generated';
import {
    loadAuctionHouseProgram,
    getAuctionHouseBuyerEscrow,
    getTokenAmount,
    getAuctionHouseTradeState,
    getAtaForMint,
} from '../utils/auctionHouse/helpers/accounts';

import {
    AuctionHouseProgram
} from '../utils/auction-house/js/AuctionHouseProgram';

import {
    ListingReceipt
} from '../utils/auction-house/js/generated/accounts/ListingReceipt';

import {
    PurchaseReceipt
} from '../utils/auction-house/js/generated/accounts/PurchaseReceipt';

import { 
    GRAPE_RPC_ENDPOINT,
    GRAPE_PROFILE,
} from '../utils/grapeTools/constants';

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

    const handleMEClick = () => {
        setMEOpenHistoryCollapse(!me_open_history_collapse);
    }

    const handleClick = () => {
        setOpenHistoryCollapse(!open_history_collapse);
    }

    const getMEStats = async () => {
        setLoading(true);

        if (mint){
            let response = null;

            const apiUrl = "https://api-mainnet.magiceden.dev/v2/collections/"+symbol+"/stats";
            
            const resp = await fetch(apiUrl, {
                method: 'GET',
                redirect: 'follow',
                //body: JSON.stringify(body),
                //headers: { "Content-Type": "application/json" },
            })

            const json = await resp.json();
            //console.log("json: "+JSON.stringify(json));
            setMEStats(json);
        }
        setLoading(false);
    }

    const getMEHistory = async () => {
        
        setLoading(true);
        
        if (mint){
            let response = null;

            const apiUrl = "https://api-mainnet.magiceden.dev/v2/tokens/"+mint+"/activities?offset=0&limit=100";
            
            const resp = await fetch(apiUrl, {
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
        }
        setLoading(false);
    }

    const getHistory = async () => {
        setLoading(true);
        //const AuctionHouseProgram = await ggoconnection.AuctionHouseProgram();// await ggoconnection.AuctionHouseProgram(new PublicKey(ENV_AH)); // loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
        
        const AuctionHouseProgram = AuctionHouse.fromAccountAddress(ggoconnection, new PublicKey(ENV_AH)); //.fromAccountInfo(info)[0];
        //spok(t, AuctionHouseProgram, expected);

        
        if (mint){
            /*
            const _mint = new PublicKey(mint);
            const metadata = await Metadata.findByMint(ggoconnection, _mint);
            */
            /**
             * Allocated data size on auction_house program per PDA type
             * CreateAuctionHouse: 459
             * PrintListingReceipt: 236
             * PrintBidReceipt: 269
             * PrintPurchaseReceipt: 193
             */
            
            /*
            const PrintListingReceiptSize = 236;
            const PrintBidReceiptSize = 269;
            const PrintPurchaseReceiptSize = 193;

            const ReceiptAccountSizes = [
                PrintListingReceiptSize,
                PrintBidReceiptSize,
                PrintPurchaseReceiptSize,
            ] as const;

            const ReceiptAccounts = await ReceiptAccountSizes.map(async size => {
                const accounts = await ggoconnection.getProgramAccounts(
                  AUCTION_HOUSE_PROGRAM_ID,
                  {
                    commitment: 'confirmed',
                    filters: [
                      {
                        dataSize: size,
                      },
                    ],
                  }
                );
                const parsedAccounts = await accounts.map(async account => {
                  switch (size) {
                    case PrintListingReceiptSize:
                      const [
                        ListingReceipt,
                      ] = await AuctionHouseProgram.accounts.ListingReceipt.fromAccountInfo(
                        account.account
                      );
                      return {
                        ...ListingReceipt,
                        receipt_type: ListingReceipt.canceledAt
                          ? 'cancel_listing_receipt'
                          : 'listing_receipt',
                      } as TransactionReceipt;
                      break;
                    case PrintBidReceiptSize:
                      const [
                        BidReceipt,
                      ] = await AuctionHouseProgram.accounts.BidReceipt.fromAccountInfo(
                        account.account
                      );
                      return {
                        ...BidReceipt,
                        receipt_type: 'bid_receipt',
                      } as TransactionReceipt;
                      break;
                    case PrintPurchaseReceiptSize:
                      const [
                        PurchaseReceipt,
                      ] = await AuctionHouseProgram.accounts.PurchaseReceipt.fromAccountInfo(
                        account.account
                      );
                      return {
                        ...PurchaseReceipt,
                        receipt_type: 'purchase_receipt',
                      } as TransactionReceipt;
                    default:
                      return undefined;
                      break;
                  }
                });
          
                return await Promise.all(parsedAccounts);
              });
          
              return await (await Promise.all(ReceiptAccounts))
                .flat()
                .filter(
                  receipt =>
                    !!receipt &&
                    receipt.metadata.toBase58() === metadata.pubkey.toBase58()
                )
                .map(receipt => ({
                  ...receipt,
                  */
                  /** @ts-ignore */
                  //tokenSize: receipt.tokenSize.toNumber(),
                  /** @ts-ignore */
                  //price: receipt.price.toNumber() / LAMPORTS_PER_SOL,
                  /** @ts-ignore */
                  //createdAt: receipt.createdAt.toNumber(),
                  /** @ts-ignore */
                  //cancelledAt: receipt.canceledAt?.toNumber?.(),
                //}));

            //const confirmedsignatures = await ggoconnection.getConfirmedSignaturesForAddress2(new PublicKey(mint), {"limit":25});
            const listingreceipts = await ggoconnection.getConfirmedSignaturesForAddress2(new PublicKey(mint), {"limit":25});
            
            //setHistory(nftSales);
            //setOpenHistory(nftSales.length);
        }
        setLoading(false);
    }

    React.useEffect(() => {
        if (mint){
            //if (!history){
                getHistory();
                //getMEHistory();
            //}
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
                                primary='History'
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
                                        {/*<div style={{width: 'auto', overflowX: 'scroll'}}>*/}
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
                                                        <TableCell><Typography variant="caption">Type</Typography></TableCell>
                                                        <TableCell><Typography variant="caption">Owner</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Amount</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Date</Typography></TableCell>
                                                        <TableCell>Signature</TableCell>
                                                    </TableRow>

                                                </TableHead>

                                                <TableBody>
                                                    {history && history.map((item: any) => (
                                                        <TableRow>
                                                            
                                                            
                                                            <TableCell>
                                                                {item.source ?
                                                                    <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.source}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                        {trimAddress(item.source,3)}
                                                                    </Button>   
                                                                :
                                                                    <Typography variant="body2" sx={{textAlign:'center'}}>
                                                                        {item.type.toLocaleUpperCase()}
                                                                    </Typography>
                                                                }   
                                                            </TableCell>
                                                            <TableCell>
                                                                {item.owner ?
                                                                <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.owner}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                    {trimAddress(item?.owner,3)}
                                                                </Button>
                                                                :    
                                                                    <Typography variant="body2" sx={{textAlign:'center'}}>
                                                                        {item?.type.toLocaleUpperCase()}
                                                                    </Typography>
                                                                
                                                                }    
                                                            </TableCell>
                                                            <TableCell  align="right">
                                                                    <Typography variant="body2">
                                                                        {convertSolVal(item?.amount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
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
                                                            <TableCell>
                                                                <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/tx/${item?.signature}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                    {trimAddress(item?.signature,3)}
                                                                </Button>
                                                            </TableCell>
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