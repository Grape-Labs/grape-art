import React, { useCallback } from "react";
import { Link } from "react-router-dom";

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletError } from '@solana/wallet-adapter-base';
import { BN, web3 } from '@project-serum/anchor';
//import spok from 'spok';
import { RestClient } from "@hellomoon/api";
import axios from "axios";

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
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    CircularProgress,
} from '@mui/material';

import { 
    RPC_CONNECTION,
    GRAPE_PROFILE,
    PROXY,
    HELLO_MOON_BEARER,
} from '../utils/grapeTools/constants';

import { 
    getReceiptsFromAuctionHouse,
    } from '../utils/grapeTools/helpers';

import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../utils/grapeTools/WalletAddress'; // global key handling
import ExplorerView from '../utils/grapeTools/Explorer';

import { gah_cancelListingReceipt } from '../utils/auctionHouse/gah_cancelListingReceipt';

import { TokenAmount } from '../utils/grapeTools/safe-math';
import { useTranslation } from 'react-i18next';

import HandshakeIcon from '@mui/icons-material/Handshake';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
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
    const [mint, setMint] = React.useState(props.mint || null);
    
    const handleClick = () => {
        setOpenHistoryCollapse(!open_history_collapse);
    }

    const getHistory = async () => {
        if ((!loading) && (mint)){
            setLoading(true);

            console.log("Fetching loan data")

            const client = new RestClient(HELLO_MOON_BEARER);

            // 1. find out how many in the collection (hint we already have this fetched in our cache)
            // 2. loop and push data per loop (1000 p/loop)
            // 3. data here will not have the mint image, additional fetch will be required if we would like to show that
            
            const url = 'https://rest-api.hellomoon.io/v0/nft/loans';
            const config = {
                headers:{
                  accept: `application/json`,
                  authorization: `Bearer ${HELLO_MOON_BEARER}`,
                  'content-type': `application/json`
                }
              };
            const data = {
                collateralMint: mint,
                limit: 1000
            }

            
            const results = await axios.post(url, data, config); 

            /*
            const results = await client.send(new NftLoanSummaryRequest({
                collateralMint: mint,
                limit: 1000
            }))
                .then(console.log)
                .catch(console.error);
            */
            console.log("results: "+JSON.stringify(results));
            
            const activityResults = results?.data?.data;


            // sort by date
            //offerResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);
            //listingResults.sort((a:any,b:any) => (a.blockTime < b.blockTime) ? 1 : -1);

            // sort by date
            activityResults.sort((a:any,b:any) => (a.offerBlocktime < b.offerBlocktime) ? 1 : -1);
            
            setHistory(activityResults);
            setOpenHistory(activityResults.length);

        }
        setLoading(false);
    }

    const Timeout = (time:number) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), time * 1000);
        return controller;
    };

    React.useEffect(() => {
        if (mint){
            if (!loading){
                getHistory();
            }
        }
    }, [mint]);

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
                            <HandshakeIcon />
                            </ListItemIcon>
                            <ListItemText 
                                primary='Loan History'
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
                                                        <TableCell><Typography variant="caption">Market</Typography></TableCell>
                                                        <TableCell><Typography variant="caption">Lender</Typography></TableCell>
                                                        <TableCell><Typography variant="caption">Borrower</Typography></TableCell>
                                                        <TableCell><Typography variant="caption">Status</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Principal</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Repay Amount</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Accepted</Typography></TableCell>
                                                        <TableCell align="center"><Typography variant="caption">Repaid</Typography></TableCell>
                                                    </TableRow>

                                                </TableHead>

                                                <TableBody>
                                                    {history && history.map((item: any, key: number) => (
                                                        
                                                        <TableRow key={key}>
                                                            
                                                            <TableCell>
                                                                {item.market}
                                                            </TableCell>

                                                            <TableCell>
                                                                <ExplorerView showSolanaProfile={true} grapeArtProfile={true} address={item.lender} type='address' shorten={5} hideTitle={false} style='text' color='white' fontSize='14px' />
                                                            </TableCell>
                                                            
                                                            <TableCell>
                                                                <ExplorerView showSolanaProfile={true} grapeArtProfile={true} address={item.borrower} type='address' shorten={5} hideTitle={false} style='text' color='white' fontSize='14px' />
                                                            </TableCell>

                                                            <TableCell>
                                                                {item.status}
                                                            </TableCell>

                                                            <TableCell>
                                                                {item?.principalAmount ? (item.principalAmount/(10 ** 9)).toFixed(3) : ''}
                                                            </TableCell>

                                                            <TableCell>
                                                                {item?.amountToRepay ? (item.amountToRepay/(10 ** 9)).toFixed(3) : '-'}
                                                            </TableCell>

                                                            <TableCell>
                                                                <Typography variant="caption">
                                                                    <Tooltip
                                                                        title={timeAgo(item?.acceptBlocktime)}
                                                                    >
                                                                        <Button size="small">{formatBlockTime(item.acceptBlocktime, true, true)}</Button>
                                                                    </Tooltip>
                                                                </Typography>
                                                            </TableCell>

                                                            <TableCell>
                                                                {(item.repayBlocktime && item.repayBlocktime > 0) ?
                                                                    <Typography variant="caption">
                                                                        <Tooltip
                                                                            title={timeAgo(item?.repayBlocktime)}
                                                                        >
                                                                            <Button size="small">{formatBlockTime(item.repayBlocktime, true, true)}</Button>
                                                                        </Tooltip>
                                                                    </Typography>
                                                                :<></>}
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