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
        setOpenDialog(true);
    };
    
    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const fetchAllActivity = async () => {
        
        try {
            if (!recentActivity){
                const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
                const auctionHouseKey = new web3.PublicKey(collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS);
                const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
                //let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mint)).toBuffer())], auctionHouseKey);
                //let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((publicKey).toBuffer())], auctionHouseKey);
                //let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
                let derivedUpdateAuthorityPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(collectionAuthority.address)).toBuffer())], auctionHouseKey);
                


                /*
                console.log("derivedMintPDA: "+derivedMintPDA);
                console.log("derivedBuyerPDA: "+derivedBuyerPDA);
                console.log("derivedOwnerPDA: "+derivedOwnerPDA);
                */
                
                let result = await ggoconnection.getSignaturesForAddress(derivedUpdateAuthorityPDA[0], {limit: 500});
                
                let activityResults: any[] = [];
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
                                /*
                                if (cntr === limit-1){
                                    //console.log(value.signature);
                                    setBeforeSignature(value.signature);
                                    setMaxPage(true);
                                }
                                */
                                     
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
                                            memo_str = submemo.substring(init,fin+1); // include brackets
                                            memo_arr.push(memo_str);
                                            submemo = submemo.replace(memo_str, "");
                                            //console.log("pushed ("+mx+"):: "+memo_str + " init: "+init+" fin: "+fin);
                                            //console.log("submemo: "+submemo);
                                        }
                                    } else{
                                        let init = memo_str.indexOf('{');
                                        let fin = memo_str.indexOf('}');
                                        memo_str = memo_str.substring(init,fin); // include brackets
                                        memo_arr.push(memo_str);
                                    }
                                    
                                    for (var memo_item of memo_arr){
                                        try{
                                            const memo_json = JSON.parse(memo_item);
                                            
                                            console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_item);
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
                                                    activityResults.push({buyeraddress: feePayer.toBase58(), offeramount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});
                                            }
                                        } catch(er){
                                            console.log("ERR: "+er)
                                        }
                                    }
                                    
                                    return activityResults;
                                    
                                }
                            }
                        } catch(err){
                            console.log("ERR: "+err)
                        }
                    }
                }
            }
            return null;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getAllActivity = async () => {
        setLoading(true);
        
        const [activityResults] = await Promise.all([fetchAllActivity()]);
        setRecentActivity(activityResults);
        
        setLoading(false);
    }

    React.useEffect(() => {
        getAllActivity();
    }, []);

    return (
        <>
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
                    {/* !publicKey || loading ?
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
                    */}
                    {loading ?
                        <>
                            loading
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
                                                {convertSolVal(item.offeramount)} <SolCurrencyIcon sx={{fontSize:"10.5px"}} />
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
                                                    <Tooltip title={formatBlockTime(item.timestamp, true, true)}>
                                                        <Button size='small' sx={{borderRadius:'24px'}}>{timeAgo(item.timestamp)}</Button>
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
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>{t('Close')}</Button>
                </DialogActions>
            </BootstrapDialog> 

        </>
  );
}