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

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
import { getReceiptsFromAuctionHouse } from '../utils/grapeTools/helpers';
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
    const auctionHouseListings = props.activity;

    const MD_PUBKEY = METAPLEX_PROGRAM_ID;
    const [open, setOpenDialog] = React.useState(false);
    const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);
    const { t, i18n } = useTranslation();
    const { publicKey } = useWallet();
    const [walletCollection, setWalletCollection] = React.useState(null);
    const [collectionMetaFinal,setCollectionMetaFinal] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [loadingActivity, setLoadingActivity] = React.useState(false);
    const [recentActivity, setRecentActivity] = React.useState(null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const rpclimit = 100;

    const handleClickOpenPreviewDialog = () => {
        setOpenPreviewDialog(true);
    };
    
    const handleClosePreviewDialog = () => {
        setOpenPreviewDialog(false);
    };
    
    const handleClickOpenDialog = () => {
        getAllActivity();
        setOpenDialog(true);
    };
    
    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const fetchAllActivity = async () => {
        
        try {
            
            if (!recentActivity){
                console.log("with aH: "+ collectionAuthority.auctionHouse)

                const results = getReceiptsFromAuctionHouse(new web3.PublicKey(collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS));

                console.log("results: "+JSON.stringify(results));
                /*
                for (var item of results){
                    activityResults.push({buyeraddress: item.bookkeeper, amount: item.price, mint: item?.mint , isowner: false, timestamp: item.createdAt, blockTime: item.createdAt, state: item?.receipt_type});
                }*/

                //activityResults.push({buyeraddress: feePayer.toBase58(), amount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: forSaleDate, blockTime: value.blockTime, state: memo_json?.state || memo_json?.status});
                


            }
            return null;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getAllActivity = async () => {
        setLoading(true);
        
        if (!auctionHouseListings){
            console.log("fetching recent activity");
            const [activityResults] = await Promise.all([fetchAllActivity()]);
            setRecentActivity(activityResults);
        } else{
            console.log("using recent activity");
            // transpose auctionHouseListings
            const activityResults = new Array();
            for (var item of auctionHouseListings){
                activityResults.push({
                    buyeraddress: item.buyeraddress, 
                    amount: item.amount, 
                    mint: item?.mint, 
                    isowner: false, 
                    blockTime: item.blockTime, 
                    timestamp: item.timestamp, 
                    state: item?.state
                })
            }
            
            setRecentActivity(auctionHouseListings);
            
            console.log("auctionHouseListings "+JSON.stringify(auctionHouseListings))
        }

        setLoading(false);
    }

    /*
    React.useEffect(() => {
        getAllActivity();
    }, []);
    */
    return (
        <>

            {mode === 0 ?
                <>
                {loading ?
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
                                {(collectionAuthority.volume/1000).toFixed(1)}k SOL
                            </Typography>
                        </Box>
                    </Button>
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
                            {t('My Activity')}
                            </>
                        :
                            <>Connect your wallet</>
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
                    {t('Recent Activity')}
                </DialogTitle>
                <DialogContent>
                    <List>

                        {mode === 0 ?
                            <>
                                {loading ?
                                    <>
                                        loading...
                                    </>
                                : 
                                <>
                                    {!recentActivity &&
                                        <>no activity</>
                                    }
                                    
                                    
                                    <Table size="small" aria-label="offers">

                                        {recentActivity && recentActivity.map((item: any,key:number) => (
                                        <>
                                                <>
                                                    <TableRow sx={{border:'none'}} key={key}>
                                                        <TableCell>
                                                            <Tooltip title={t('Visit Profile')}>
                                                                <Button
                                                                    variant="text"
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
                                                            {item.state === 1 && <>Offer</>}
                                                            {item.state === 2 && <>Listed</>}
                                                            {item.state === 3 && <>Sale</>}
                                                            {item.state === 4 && <>Sale</>}
                                                            {item.state === 5 && <>Cancel</>}
                                                        </Typography></TableCell>
                                                        <TableCell  align="center"><Typography variant="h6">
                                                            {convertSolVal(item.amount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
                                                        </Typography></TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title={t('View NFT')}>
                                                                <Button
                                                                    variant="text"
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
                                                                <Tooltip title={formatBlockTime(item.blockTime, true, true)}>
                                                                    <Button 
                                                                    variant="text" size='small' sx={{borderRadius:'24px'}}>{item.timestamp}</Button>
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
                                                </>
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
                                                </BootstrapDialog>
                                            </>
                                        ))}
                                    </Table>

                                </>
                                }
                            </>
                        :
                        <>
                        { !publicKey || loading ?
                            <>
                                {publicKey ?
                                <>
                                    loading
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
                            
                            
                            <Table size="small" aria-label="offers">

                                {recentActivity && recentActivity.map((item: any,key:number) => (
                                <>
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
                                                    {item.state === 1 && <>Offer</>}
                                                    {item.state === 2 && <>Listed</>}
                                                    {item.state === 3 && <>Sale</>}
                                                    {item.state === 4 && <>Sale</>}
                                                </Typography></TableCell>
                                                <TableCell  align="center"><Typography variant="h6">
                                                    {convertSolVal(item.amount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
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
                                                        <Tooltip title={formatBlockTime(item.blockTime, true, true)}>
                                                            <Button size='small' sx={{borderRadius:'24px'}}>{item.timestamp}</Button>
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
                                        </>
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
                                        </BootstrapDialog>
                                    </>
                                ))}
                            </Table>

                        </>
                        }
                    </>
                    }
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>{t('Close')}</Button>
                </DialogActions>
            </BootstrapDialog> 

        </>
  );
}