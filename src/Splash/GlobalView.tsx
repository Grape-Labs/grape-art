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

export default function GlobalView(props: any){
    const [history, setHistory] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [historyME, setMEHistory] = React.useState(null);
    const [statsME, setMEStats] = React.useState(null);
    const [openMEHistory, setMEOpenHistory] = React.useState(0);
    const [mint, setMint] = React.useState(props.mint || null);
    const [symbol, setSymbol] = React.useState(props.symbol || null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();

    const [receiptListing, setReceiptListing] = React.useState(null);
    const [receiptPurchase, setReceiptPurchase] = React.useState(null);
    const [receiptBid, setReceiptBid] = React.useState(null);
    const [receipts, setReceipts] = React.useState(null);

    const getHistory = async () => {
        setLoading(true);
        //const AuctionHouseProgram = await ggoconnection.AuctionHouseProgram(new PublicKey(ENV_AH)); // loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
        //const AuctionHouseProgram =  AuctionHouse.fromAccountAddress(ggoconnection, new PublicKey(ENV_AH)); //.fromAccountInfo(info)[0];
        
        //AuctionHouseProgram.LISTINE_RECEIPT

        //const AHP = await AuctionHouseProgram;
        //spok(t, AuctionHouseProgram, expected);
        
        {    
            /**
             * Allocated data size on auction_house program per PDA type
             * CreateAuctionHouse: 459
             * PrintListingReceipt: 236
             * PrintBidReceipt: 269
             * PrintPurchaseReceipt: 193
             */
            
            const PrintListingReceiptSize = 236;
            const PrintBidReceiptSize = 269;
            const PrintPurchaseReceiptSize = 193;

            const ReceiptAccountSizes = [
                PrintListingReceiptSize,
                PrintBidReceiptSize,
                PrintPurchaseReceiptSize,
            ] as const;
            
            const ReceiptAccounts = await (Promise.all(ReceiptAccountSizes.map(async size => {
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
                
                const parsedAccounts = accounts.map(async account => {
                  switch (size) {
                    case PrintListingReceiptSize:
                      const [
                        ListingReceipt,
                      ] = AuctionHouseProgram.accounts.ListingReceipt.fromAccountInfo(
                        account.account
                      );
                       
                      return {
                        ...ListingReceipt,
                        receipt_type: ListingReceipt.canceledAt
                          ? 'cancel_listing_receipt'
                          : 'listing_receipt',
                      }; //as TransactionReceipt;
                      break;
                    case PrintBidReceiptSize:
                      const [
                        BidReceipt,
                      ] = AuctionHouseProgram.accounts.BidReceipt.fromAccountInfo(
                        account.account
                      );
                      
                      return {
                        ...BidReceipt,
                        receipt_type: 'bid_receipt',
                      }; //as TransactionReceipt;
                      break;
                    case PrintPurchaseReceiptSize:
                      const [
                        PurchaseReceipt,
                      ] = AuctionHouseProgram.accounts.PurchaseReceipt.fromAccountInfo(
                        account.account
                      );
                      
                      return {
                        ...PurchaseReceipt,
                        receipt_type: 'purchase_receipt',
                      } //as TransactionReceipt;
                      break;
                    default:
                      return undefined;
                      break;
                  }
                });
                
                return await Promise.all(parsedAccounts);
              })));

              const receipts = (await Promise.all(ReceiptAccounts))
                .flat()
                .map(receipt => ({
                    ...receipt,
                    tokenSize: new BN(receipt.tokenSize).toNumber(),
                    price: new BN(receipt.price).toNumber() / LAMPORTS_PER_SOL,
                    createdAt: new BN(receipt.createdAt).toNumber(),
                    //cancelledAt: receipt?.canceledAt,
                }));
            
            setReceipts(receipts);
            
        }
        setLoading(false);
    }

    const ShowListings = (props: any) => {
        const [open_listing_collapse, setOpenListingCollapse] = React.useState(false);
        const [openListing, setOpenListing] = React.useState(0);
        const listing = props.listing;
        const title = props.title;

        const handleClick = () => {
            setOpenListingCollapse(!open_listing_collapse);
        }

        return (
            <>
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
                            <Typography variant="caption"><strong>{0}</strong></Typography>
                            {open_listing_collapse ? <ExpandLess /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={open_listing_collapse} timeout="auto" unmountOnExit>
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
                                                    <TableCell><Typography variant="caption">tradeState</Typography></TableCell>
                                                    <TableCell><Typography variant="caption">bookkeeper</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">auctionHouse</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">seller</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">metadata</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">price</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">createdAt</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">purchaseReceipt</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">receipt_type</Typography></TableCell>
                                                </TableRow>

                                            </TableHead>

                                            <TableBody>
                                                {listing && listing.map((item: any) => (
                                                    <TableRow>
                                                        <TableCell>
                                                            {item?.tradeState &&
                                                                <Tooltip title={JSON.stringify(item)}>
                                                                    <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.tradeState.toBase58()}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                        {trimAddress(item?.tradeState.toBase58(),3)}
                                                                    </Button>   
                                                                </Tooltip>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.bookkeeper &&
                                                                <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.bookkeeper.toBase58()}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                    {trimAddress(item?.bookkeeper.toBase58(),3)}
                                                                </Button>   
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.auctionHouse &&
                                                                <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.auctionHouse.toBase58()}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                    {trimAddress(item?.auctionHouse.toBase58(),3)}
                                                                </Button>   
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.seller &&
                                                                <>
                                                                {trimAddress(item?.seller.toBase58(),3)}
                                                                </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.metadata &&
                                                                <>
                                                                {trimAddress(item?.metadata.toBase58(),3)}
                                                                </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.price &&
                                                                <>
                                                                {item?.price} 
                                                                </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.createdAt &&
                                                                <>
                                                               {moment.unix(item?.createdAt).format('YYYY-MM-DD h:mma')} 
                                                               </>
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.purchaseReceipt &&
                                                                <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item?.purchaseReceipt.toBase58()}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                    {trimAddress(item?.purchaseReceipt.toBase58(),3)}
                                                                </Button>   
                                                            }  
                                                        </TableCell>
                                                        <TableCell>
                                                            {item?.receipt_type &&
                                                                <>
                                                                {item?.receipt_type} 
                                                                </>
                                                            }  
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

            </>
        );
    }

    React.useEffect(() => {
        if (!loading){
            if (!receipts){
                getHistory();
            }
        }
    },[]);

    if (loading){
        
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
                {receipts &&
                    <>
                        <ShowListings listing={receipts} title="Receipts"/>
                    </>
                }
            </>
        )
    }

}