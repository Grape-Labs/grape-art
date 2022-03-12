import React from "react";
import { Link } from "react-router-dom";

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BN, web3 } from '@project-serum/anchor';

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

import { 
    GRAPE_RPC_ENDPOINT,
    GRAPE_PROFILE,
} from '../utils/grapeTools/constants';

import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../utils/grapeTools/WalletAddress'; // global key handling

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
import { ConstructionOutlined } from "@mui/icons-material";

export default function HistoryView(props: any){
    const [history, setHistory] = React.useState(null);
    const [historyME, setMEHistory] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [open_history_collapse, setOpenHistoryCollapse] = React.useState(false);
    const [openHistory, setOpenHistory] = React.useState(0);
    const [mint, setMint] = React.useState(props.mint || null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();

    const handleClick = () => {
        setOpenHistoryCollapse(!open_history_collapse);
    }

    const getMEHistory = async (mint:string) => {
        setLoading(true);
        
        if (mint){

            var requestOptions = {
                method: 'GET',
                //redirect: 'follow'
            };

            //let response = null;
            const url = "https://api-mainnet.magiceden.dev/v2/tokens/"+mint+"/activities?offset=0&limit=100";
            const response = await fetch(url, requestOptions);
            
            //  const json = await response.json();
            /*
            fetch(url, requestOptions)
                .then(response => response.text())
                .then(result => console.log(result))
                .catch(error => console.log('error', error));
            */

            try{
                const json = await response.json();
                setMEHistory(json);
                setOpenHistory(json.length);
            }catch(e){return null;}
        }
        setLoading(false);
    }

    const getHistory = async () => {
        setLoading(true);
        //const anchorProgram = await loadAuctionHouseProgram(pubkey, ENV_AH, GRAPE_RPC_ENDPOINT);
        
        if (mint){

            const confirmedsignatures = await ggoconnection.getConfirmedSignaturesForAddress2(new PublicKey(mint), {"limit":25});
            // then get parsed txs
            //console.log("Signatures: "+JSON.stringify(confirmedsignatures));
            // with signatures get txs
            let signatures: any[] = [];
            for (var value of confirmedsignatures){
                signatures.push(value.signature);
            }
            const getTransactionAccountInputs2 = await ggoconnection.getParsedTransactions(signatures, 'confirmed');
            //console.log("getTransactionAccountInputs2: "+JSON.stringify(getTransactionAccountInputs2));
            
            for (var tvalue of getTransactionAccountInputs2){
                //if (value.)
                console.log("TX: "+JSON.stringify(tvalue));
                // check if we find : hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk
                //console.log("auctionHouseKey: "+AUCTION_HOUSE_PROGRAM_ID);
            }

            // loop through getTransactionAccountInputs2
            
            //console.log("getTransactionAccountInputs2: "+JSON.stringify(getTransactionAccountInputs2));


        }
        setLoading(false);
    }

    React.useEffect(() => {
        if (mint){
            //if (!history){
                //getHistory();
                getMEHistory(mint);
            //}
        }
    }, [mint]);

    if ((!history)&&(loading)){
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
                                                    <TableCell><Typography variant="caption">Seller</Typography></TableCell>
                                                    <TableCell><Typography variant="caption">Buyer</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">Amount</Typography></TableCell>
                                                    <TableCell align="center"><Typography variant="caption">Date</Typography></TableCell>
                                                    <TableCell>Signature</TableCell>
                                                </TableRow>

                                            </TableHead>

                                            <TableBody>
                                                {historyME && historyME.map((item: any) => (
                                                    <TableRow>
                                                        
                                                        
                                                        <TableCell>
                                                            <Button size="small" variant="text" component={Link} to={`${GRAPE_PROFILE}${item.seller}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                {trimAddress(item.seller,3)}
                                                            </Button>    
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
                                                            <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/signature/${item.signature}`} target="_blank" sx={{ml:1,color:'white',borderRadius:'24px'}}>
                                                                {trimAddress(item.signature,3)}
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
            </>
        )
    }

}