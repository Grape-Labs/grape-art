import React, { useEffect, useState, useCallback, memo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import CyberConnect, { Env, Blockchain, solana, ConnectionType } from '@cyberlab/cyberconnect';

import { Connection, ParsedAccountData, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
// @ts-ignore
import fetch from 'node-fetch'
import ImageViewer from 'react-simple-image-viewer';
import { Helmet } from 'react-helmet';

import { findDisplayName } from '../utils/name-service';
import { createSetProfilePictureTransaction } from '@solflare-wallet/pfp';

import { TokenAmount } from '../utils/grapeTools/safe-math';
import { 
    getTokenOwnerRecordForRealm, 
} from '@solana/spl-governance';
import { useNavigate } from 'react-router';
import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import { FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';
import { followListInfoQuery, searchUserInfoQuery } from '../utils/cyberConnect/query';

import { 
    MARKET_LOGO
} from '../utils/grapeTools/constants';

import {
    Avatar,
    Chip,
    Typography,
    Grid,
    Box,
    ButtonGroup,
    Paper,
    Divider,
    Skeleton,
    Collapse,
    Table,
    TableHead,
    TableCell,
    TableContainer,
    TableRow,
    InputBase,
    Tooltip,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Card,
} from '@mui/material';

import MuiAlert, { AlertProps } from '@mui/material/Alert';


import FlagIcon from '@mui/icons-material/Flag';
import EmojiFlagsIcon from '@mui/icons-material/EmojiFlags';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SegmentIcon from '@mui/icons-material/Segment';
import VerifiedIcon from '@mui/icons-material/Verified';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { WalletError } from '@solana/wallet-adapter-base';

import { UPDATE_AUTHORITIES } from '../utils/grapeTools/mintverification';
import { 
    TOKEN_REALM_PROGRAM_ID,
    TOKEN_REALM_ID,
    TOKEN_VERIFICATION_NAME,
    TOKEN_VERIFICATION_AMOUNT,
    TOKEN_VERIFICATION_ADDRESS,
    GRAPE_RPC_ENDPOINT, 
    OTHER_MARKETPLACES,
    TX_RPC_ENDPOINT, 
    GRAPE_RPC_REFRESH, 
    GRAPE_PREVIEW, 
    GRAPE_PROFILE,
    FEATURED_DAO_ARRAY,
    GRAPE_TREASURY,
    TOKEN_REPORT_AMOUNT,
} from '../utils/grapeTools/constants';

import {
    METAPLEX_PROGRAM_ID,
  } from '../utils/auctionHouse/helpers/constants';

import ItemOffers from './ItemOffers';
import { SocialLikes, SocialFlags } from './Social';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling

import "../App.less";

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { decodeMetadata } from '../utils/auctionHouse/helpers/schema';
import GrapeIcon from "../components/static/GrapeIcon";

import { useTranslation } from 'react-i18next';
import { JavascriptRounded } from "@mui/icons-material";

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

const Search = styled('div')(({ theme }) => ({
    /*
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(1),
      width: 'auto',
    },
    */
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        width: '12ch',
        '&:focus': {
          width: '20ch',
        },
      },
    },
  }));

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

function GrapeVerified(props:any){
    const [loading, setLoading] = React.useState(false);
    const [verifiedState, setVerifiedState] = React.useState(false);
    const [verifiedPK, setVerificationPK] = React.useState(null);
    const [collectionImage, setCollectionImage] = React.useState(null);
    const [collectionName, setCollectionName] = React.useState(props.symbol);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    let updateAuthority = props?.updateAuthority;
    let grape_verified = -1;

    const MD_PUBKEY = METAPLEX_PROGRAM_ID;
    
    const getCollectionData = async (collectionAddress:string) => {
        try {
            let mint_address = new PublicKey(collectionAddress)
            let [pda, bump] = await PublicKey.findProgramAddress([
                Buffer.from("metadata"),
                MD_PUBKEY.toBuffer(),
                new PublicKey(mint_address).toBuffer(),
            ], MD_PUBKEY)
            
            
            const meta_response = await ggoconnection.getAccountInfo(pda);

            let meta_final = decodeMetadata(meta_response.data);
            
            const metadata = await window.fetch(meta_final.data.uri).then(
                (res: any) => res.json());
            
            setCollectionName(metadata.name);
            setCollectionImage(metadata.image) 

            return null;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    React.useEffect(() => { 
        try{
            if (updateAuthority && !loading){
                let verified = false;
                let verified_creator = false;

                // first stage verification
                for (var item of updateAuthority.data.creators){
                    if (item.address === updateAuthority.updateAuthority)
                        if (item.verified === 1){
                            // now validate verify_collection in the collection results
                            verified_creator = true;
                        }
                }
                // second stage verification
                if (verified_creator){
                    if (updateAuthority?.collection?.verified){
                        if (updateAuthority.collection.verified === 1){
                            //console.log("updateAuthority: "+JSON.stringify(updateAuthority));
                            if (ValidateAddress(updateAuthority.collection.key)){
                                setVerifiedState(true);
                                if (!collectionImage){
                                    setVerificationPK(updateAuthority.collection.key)
                                    getCollectionData(updateAuthority.collection.key);
                                }
                            }
                        }
                    }
                }

                // third stage verification (coming soon)
                grape_verified = UPDATE_AUTHORITIES.indexOf(updateAuthority);
                //grape_verified = 1;
                if (grape_verified > -1){

                }
            }
        }catch(e){console.log("ERR: "+e)}
    }, [updateAuthority]);

    const { t, i18n } = useTranslation();

    if (verifiedState){
        
        return (
            <Tooltip title={`${props.symbol}: ${t('Update Authority/Creator Verified on Metaplex')}`} placement="top">
                <Button 
                    href={`${GRAPE_PREVIEW}${verifiedPK}`}
                    sx={{color:'white', borderRadius:'24px'}}>
                    {collectionName}
                    <Avatar 
                        component={Paper} 
                        elevation={4}
                        alt={updateAuthority.data.symbol}
                        src={collectionImage}
                        sx={{ width: 20, height: 20, bgcolor: "#222",ml:1}}
                    />
                    {grape_verified > -1 &&
                        <VerifiedIcon sx={{fontSize:"20px",ml:1}} />
                    }
                </Button>
            </Tooltip>
        );
    
    } else{
        return <>{collectionName}</>
    } 
}

function GalleryItemMeta(props: any) {
    const collectionrawprimer = props.collectionrawdata.meta_primer || [];
    const collectionrawdata = props.collectionrawdata.meta_final || [];
    const collectionitem = props.collectionitem.collectionmeta || [];
    const [mint, setMint] = React.useState(props.mint || null);
    const [refreshOwner, setRefreshOwner] = React.useState(false);
    const [loadingOwner, setLoadingOwner] = React.useState(false);
    const [mintAta, setMintATA] = React.useState(null);
    const [tokenOwners, setTokenOwners] = React.useState(null);
    const [grape_member_balance, setGrapeMemberBalance] = React.useState(null);
    const [sol_portfolio_balance, setSolPortfolioBalance] = React.useState(0);
    const [grape_weighted_score, setGrapeWeightedScore] = React.useState(0);
    const [grape_governance_balance, setGrapeGovernanceBalance] = React.useState(null);
    const [grape_offer_threshhold, setGrapeOfferThreshhold] = React.useState(TOKEN_VERIFICATION_AMOUNT);
    const [open_offers_collapse, setOpenOffersCollapse] = React.useState(false);
    const [grape_whitelisted, setGrapeWhitelisted] = React.useState(null);
    const [open_creator_collapse, setOpenCreatorCollapse] = React.useState(false);
    const [open_attribute_collapse, setOpenAttributeCollapse] = React.useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [collectionItemImages, setCollectionItemImages] = useState([]);
    //const [pubkey, setPubkey] = React.useState(null);
    const [open_meta, setOpenMeta] = React.useState(false);
    const [open_offers, setOpenOffers] = React.useState(false);
    const [open_description, setOpenDescription] = React.useState(true);
    const [open_traits, setOpenTraits] = React.useState(true);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const {publicKey, sendTransaction} = useWallet();
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [loadingFollowState, setLoadingFollowState] = React.useState(false);
    const navigate = useNavigate();
    const { enqueueSnackbar, closeSnackbar} = useSnackbar();
    
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const solanaProvider = useWallet();

    const cyberConnect = new CyberConnect({
        namespace: 'Grape',
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: "",//solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    const fetchSearchAddrInfo = async (fromAddr:string, toAddr: string) => {
        const resp = await searchUserInfoQuery({
            fromAddr:fromAddr,
            toAddr,
            namespace: 'Grape',
            network: Network.SOLANA,
            type: 'FOLLOW',
        });
        if (resp) {
            setSearchAddrInfo(resp);
        }
  
        return resp;
    };

    const followWalletConnect = async (followAddress:string, solanaAddress: string) => {
        // address:string, alias:string
        let tofollow = followAddress;   
        let promise = await cyberConnect.connect(tofollow, solanaAddress)
        .catch(function (error) {
            console.log(error);
        });
        if (tokenOwners)
            getFollowStatus(tokenOwners);
    };
    const followWalletDisconnect = async (followAddress:string) => {
        // address:string, alias:string
        let promise = await cyberConnect.disconnect(followAddress.toString())
        .catch(function (error) {
            console.log(error);
        });
        if (tokenOwners)
            getFollowStatus(tokenOwners);
    };
    
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );
        
    const salePrice = props.salePrice || null;
    //console.log('GalleryItemMeta salePrice:', salePrice);
    const handleClickOpenTraits = () => {
        setOpenTraits(!open_traits);
    }

    const handleClickOpenMeta = () => {
        setOpenMeta(!open_meta);
    };

    const handleClickOpenOffers = () => {
        setOpenOffers(!open_offers);
    };
    const handleClickOpenDescription = () => {
        setOpenDescription(!open_description);
    };

    const handleSendItem = () => {
        
    };

    const openImageViewer = useCallback((index) => {
        setCurrentImage(index);
        setIsViewerOpen(true);
    }, []);

    const closeImageViewer = () => {
        setCurrentImage(0);
        setIsViewerOpen(false);
    };

    // after owner we can get the signatures for the 

    const getGovernanceBalance = async () => {
        try{
            const programId = new PublicKey(TOKEN_REALM_PROGRAM_ID);
            const realmId = new PublicKey(TOKEN_REALM_ID);
            const governingTokenMint = new PublicKey(TOKEN_VERIFICATION_ADDRESS);
            const governingTokenOwner = publicKey;

            const ownerRecords = await getTokenOwnerRecordForRealm(
                ggoconnection, 
                programId,
                realmId,
                governingTokenMint,
                governingTokenOwner
            );
            
            return ownerRecords;
        } catch(e){console.log("ERR: "+e);}
    }

    const fetchBalances = async () => {
        const body = {
          method: "getTokenAccountsByOwner",
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            publicKey.toString(),
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { encoding: "jsonParsed", commitment: "processed" },
          ],
          id: "35f0036a-3801-4485-b573-2bf29a7c77d2",
        };
    
          const response = await window.fetch(GRAPE_RPC_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
          })
          const json = await response.json();
          const resultValues = json.result.value
          return resultValues;
    
      };

    const GetTokenOwner = async (tokenAddress:any) => {
        //alert("HERE!")
        //let token_owner = await connection.getTokenLargestAccounts(new PublicKey(tokenAddress));//  Promise.all([GetLargestTokenAccounts()]);
        //console.log("Token Owner: "+JSON.stringify(token_owner));

        const body = {
          method: "getAccountInfo", // getAccountInfo
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            tokenAddress,
            {"encoding":"jsonParsed",
            "commitment":"confirmed"}
            // add <object> (optional) Commitment
          ],
          "id":1,
        };
    
        const response = await window.fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        
        const json = await response.json();
        const resultValues = json.result.value
        return resultValues;
    };

    const GetLargestTokenAccounts = async () => {
        /*
        let { value: accounts } = await connection.getTokenLargestAccounts(new PublicKey(mint));
        let ownerTokenAccount = null;
        for (let { address, amount } of accounts)
          if (amount == "1") ownerTokenAccount = address;
        

        //if (!ownerTokenAccount)
        //  throw new Error(`Could not get current owner for ${mint}`);
      
        let parsedAccountInfo = await connection.getParsedAccountInfo(
          ownerTokenAccount
        );
        let parsed = parsedAccountInfo!.value!.data as ParsedAccountData;
        console.log("Parsed: "+JSON.stringify(parsed));
        return parsed.info.owner;
        */
        
        const body = {
          method: "getTokenLargestAccounts", // getAccountInfo
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            mint,
            {"commitment":"confirmed"}
          ],
          "id":1,
        };
    
        const response = await window.fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        
        const json = await response.json();
        const resultValues = json.result.value;
        return resultValues;
        
    };

    const fetchTokenAccountData = async () => {
        let [flargestTokenAccounts] = await Promise.all([GetLargestTokenAccounts()]);
        //console.log("settings setMintAta: "+JSON.stringify(flargestTokenAccounts));

        if (+flargestTokenAccounts[0].amount === 1){ // some NFTS are amount > 1
            setMintATA(flargestTokenAccounts[0].address);
        }
    }

    const fetchSOLBalance = async () => {
        const body = {
          method: "getBalance",
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            publicKey.toString()
          ],
          id: "35f0036a-3801-4485-b573-2bf29a7c77d3",
        };
    
        const response = await window.fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        
        const json = await response.json();
        const resultValues = json.result.value;
        return resultValues;
    };

    const getFollowStatus = async (towner:string) => {
        
        if (publicKey){
            if (towner){
                //if (tokenOwners.data.parsed.info.owner){
                    setLoadingFollowState(true);
                    let socialconnection = await fetchSearchAddrInfo(publicKey.toBase58(), towner);
                    if (socialconnection){
                        //if (socialconnection?.identity){
                        if (socialconnection?.connections[0]?.followStatus) {  
                            setIsFollowing(socialconnection?.connections[0].followStatus.isFollowing);
                        }
                    }
                    setLoadingFollowState(false);
                //}
            }
        }
    }

    const getMintOwner = async () => {
        setLoadingOwner(true);
        let [tokenowner] = await Promise.all([GetTokenOwner(mintAta)]);
        setTokenOwners(tokenowner);
        fetchSolanaDomain(tokenowner?.data.parsed.info.owner);
        getFollowStatus(tokenowner?.data.parsed.info.owner);
        setLoadingOwner(false);
    }

    React.useEffect(() => {
        if ((publicKey)&&(tokenOwners)){
            getFollowStatus(tokenOwners?.data.parsed.info.owner);
        }
    }, [publicKey]);

    const fetchTokenAccountOwnerHoldings = async () => {
        if (publicKey){ 
            let [sol_rsp, portfolio_rsp, governance_rsp] = await Promise.all([fetchSOLBalance(), fetchBalances(), getGovernanceBalance()]);
            //setGrapeWhitelisted(GRAPE_WHITELIST.indexOf(publicKey.toString()));
            if (sol_rsp){ // use sol calc for balance
                setSolPortfolioBalance(parseFloat(new TokenAmount(sol_rsp, 9).format()));
            }
            try{

                if (governance_rsp?.account?.governingTokenDepositAmount){
                    setGrapeGovernanceBalance(governance_rsp?.account?.governingTokenDepositAmount);
                }else{    
                    setGrapeGovernanceBalance(0);
                }
            }catch(e){
                setGrapeGovernanceBalance(0);
                console.log("ERR: "+e);
            }

            try{
                setGrapeMemberBalance(0);
                let final_weighted_score = 0;
                portfolio_rsp.map((token:any) => {
                    let mint = token.account.data.parsed.info.mint;
                    let balance = token.account.data.parsed.info.tokenAmount.uiAmount;
                    if (mint === '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA'){ // check if wallet has sol
                        if (governance_rsp?.account?.governingTokenDepositAmount){
                            const total_grape = +balance + (+governance_rsp?.account?.governingTokenDepositAmount)/1000000
                            setGrapeMemberBalance(total_grape);
                            if (+total_grape >= 1000){
                                const weighted_score = total_grape/1000;
                                if (weighted_score<=0)
                                    final_weighted_score = 0;
                                else if (weighted_score<6)
                                    final_weighted_score = 1; 
                                else if (weighted_score<25)
                                    final_weighted_score = 2; 
                                else if (weighted_score<50)
                                    final_weighted_score = 3; 
                                else if (weighted_score>=50)
                                    final_weighted_score = 4; 
                                setGrapeWeightedScore(final_weighted_score);
                            }
                        } else{
                            setGrapeMemberBalance(balance);
                            if (+balance >= 1000){
                                const weighted_score = +balance/1000;
                                if (weighted_score<=0)
                                    final_weighted_score = 0;
                                else if (weighted_score<6)
                                    final_weighted_score = 1; 
                                else if (weighted_score<25)
                                    final_weighted_score = 2; 
                                else if (weighted_score<50)
                                    final_weighted_score = 3; 
                                else if (weighted_score>=50)
                                    final_weighted_score = 4; 
                                setGrapeWeightedScore(final_weighted_score);
                            }
                        }
                    }
                });
            } catch(e){console.log("ERR: "+e);}
            
        }
    }

    const HandleSetAvatar = async () => {
        try{
            const transaction = await createSetProfilePictureTransaction(publicKey, new PublicKey(mint), new PublicKey(mintAta));
            //console.log("Transaction: "+JSON.stringify(transaction));
            enqueueSnackbar(`${t('Preparing set your avatar with')} ${mint} ${t('mint')}`,{ variant: 'info' });
            const signedTransaction = await sendTransaction(transaction, connection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`${t('Confirming transaction')}`,{ variant: 'info', action:snackprogress, persist: true });
            await ggoconnection.confirmTransaction(signedTransaction, 'processed');
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction}
                </Button>
            );
            enqueueSnackbar(`${t('Your avatar has been set')} `,{ variant: 'success', action:snackaction });
        } catch(e){
            closeSnackbar();
            enqueueSnackbar(`${t('Error')}: ${e}`,{ variant: 'error' });
            console.log("Error: "+e);
        } 
    }

    const SearchForMint = (props: any) => {
        const [open_dialog, setOpenPKDialog] = React.useState(false);
        const [mintKey, setInputMintValue] = React.useState('');
    
        const handleClickOpenDialog = () => {
            setOpenPKDialog(true);
        };
        
        const handleCloseDialog = () => {
            setOpenPKDialog(false);
        };
        
        function HandleMintAddressSubmit(event: any) {
            event.preventDefault();
            if ((mintKey.length >= 32) && 
                (mintKey.length <= 44)){
                // WalletId is base58 validate the type too later on
                props.setMintPubkey(mintKey);
                handleCloseDialog();
            } else{
                // Invalid Wallet ID
                console.log("INVALID MINT");
            }
        }
        
        return (
          <React.Fragment>
            <Button onClick={handleClickOpenDialog}
                sx={{borderRadius:'24px',color:'white'}}
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
                    {t('Mint')}
                </DialogTitle>
                <form onSubmit={HandleMintAddressSubmit}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            autoComplete='off'
                            margin="dense"
                            id="preview_mint_key"
                            label={t('Paste a mint address')}
                            type="text"
                            fullWidth
                            variant="standard"
                            value={mintKey}
                            onChange={(e) => setInputMintValue(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button 
                            type="submit"
                            variant="text" 
                            title="GO">
                                {t('Go')}
                        </Button>
                    </DialogActions>
                </form>
            </BootstrapDialog>   
          </React.Fragment>
        );
    }

    const fetchSolanaDomain = async (ownerPublicKey:string) => {
        if (ownerPublicKey){
            //console.log("checking domains for "+ownerPublicKey);
            const domain = await findDisplayName(ggoconnection, ownerPublicKey);
            if (domain){
                if (domain[0] !== ownerPublicKey)
                    setSolanaDomain(domain[0]);
            }
        }
    }
    
    React.useEffect(() => { 
        if (refreshOwner){
            //setTokenOwners(null);
            props.setRefresh(true);
        }
        if ((mintAta)||(refreshOwner)){
            getMintOwner();
            fetchTokenAccountOwnerHoldings();
        }
        if (refreshOwner){
            setRefreshOwner(!refreshOwner);
        }
    }, [mintAta, publicKey, refreshOwner]);
    
    React.useEffect(() => { 
        try{
            ( collectionitem?.image && 
                collectionItemImages.push(collectionitem.image)
            )
        } catch(e){
            console.log("ERR: "+e);
        }
        
        if (!tokenOwners){
            fetchTokenAccountData();
        }
    }, [mint]);

    const { t, i18n } = useTranslation();

    try{
        return (
            <Grid
                sx={{mt:6}}
            >
                <Helmet>
                    <title>{`${collectionitem.name} | ${t('Grape Social. Stateless. Marketplace.')}`}</title>
                    <meta property="og:title" content={`${collectionitem.name} @Grape`} />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content={window.location.href} />
                    <meta property="og:image" content={collectionitem.image} />
                    <meta property="og:description" content={collectionitem.name} />
                    <meta name="theme-color" content="#000000" />

                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:site" content={`${collectionitem.name} @Grape`} />
                    <meta name="twitter:title" content={collectionitem.name} />
                    <meta name="twitter:description" content={collectionitem.name} />
                    <meta name="twitter:image" content={collectionitem.image} />
                </Helmet>

                {isViewerOpen && (
                    <ImageViewer
                    src={ collectionItemImages }
                    currentIndex={ currentImage }
                    disableScroll={ false }
                    closeOnClickOutside={ true }
                    onClose={ closeImageViewer }
                    />
                )}

                <Box
                    sx={{
                        mt: 2,
                        
                    }}
                >
                    <Box
                        sx={{
                            borderRadius: '17px',
                            background: 'rgba(0, 0, 0, 0.6)',
                            mb: 4,
                            pl: 3,
                            pr: 3,
                            pt: 1,
                            pb: 1
                        }}
                        >
                            <Grid container direction="row" spacing={{ xs: 2, md: 3 }}>
                                <Grid item xs={6} md={8}>
                                    <ButtonGroup variant="text">
                                        <Button
                                            className="button icon-left"
                                            onClick={() => navigate(-1)}
                                            sx={{color:'white',borderRadius:'24px'}}
                                        >
                                            <ArrowBackIosIcon />
                                            {t('Back')}
                                        </Button>
                                        <SearchForMint setMintPubkey={props.setMintPubkey} />
                                    </ButtonGroup>
                                </Grid>
                                <Grid item  xs={6} md={4}>
                                    <Box display="flex" justifyContent="flex-end">
                                        <ButtonGroup variant="text">
                                            <SocialLikes mint={mint} />
                                            <SocialFlags mint={mint} />
                                                <Grid item sx={{borderRadius:'24px',background:'none'}}>
                                                    <Avatar 
                                                        component={Paper} 
                                                        elevation={4}
                                                        alt={collectionitem.name}
                                                        src={collectionitem.image}
                                                        sx={{ width: 30, height: 30, bgcolor: "#222", ml:1,mr:0.5}}
                                                    ></Avatar>
                                                </Grid>
                                                <Grid item>        
                                                    <ShareSocialURL fontSize={'24px'} url={window.location.href} title={'Grape DEX | '+trimAddress(mint,4)} />
                                                </Grid>

                                        </ButtonGroup>
                                    </Box>
                                </Grid>
                            </Grid> 
                    </Box>    
                    <Box
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                            p:3,
                            pl:4,
                            pr:4
                        }} 
                    >              
                        
                        <Grid container spacing={{ xs: 2, md: 3 }} >
                            <Grid item xs={12} sm={12} md={6}>
                                <Box
                                    sx={{ 
                                        width: '100%'
                                    }}
                                > 
                                    <List
                                        sx={{ 
                                            width: '100%'
                                        }}
                                        component="nav"
                                        >
                                        
                                            <ListItemText>
                                                <Grid 
                                                    container 
                                                    spacing={2}
                                                    direction="column"
                                                    alignItems="center"
                                                    justifyContent="center">
                                                        <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                                                            <ListItemButton
                                                                sx={{
                                                                    width:'100%',
                                                                    borderRadius:'25px',
                                                                    p: '2px'
                                                                }}
                                                            >
                                                                <img
                                                                    src={`${collectionitem.image}`}
                                                                    srcSet={`${collectionitem.image}`}
                                                                    alt={collectionitem.name}
                                                                    onClick={ () => openImageViewer(0) }
                                                                    loading="lazy"
                                                                    height="auto"
                                                                    style={{
                                                                        width:'100%',
                                                                        borderRadius:'24px'
                                                                    }}
                                                                />
                                                            </ListItemButton>
                                                        </Grid>
                                                        <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center', mt:'-15px'}}>
                                                            <Button
                                                                size="small" variant="text" 
                                                                onClick={ () => openImageViewer(0) }
                                                                sx={{color:'white',borderRadius:'24px'}}
                                                            >
                                                                {t('Preview')} <OpenInFullIcon sx={{ fontSize:'16px', ml:1 }}/></Button>
                                                        </Grid>
                                                    </Grid>
                                                
                                            </ListItemText>
                                        
                                    </List>
                                </Box>
                                
                                <List
                                    sx={{ 
                                        width: '100%',
                                    }}
                                    component="nav"
                                >

                                    <Box
                                        sx={{ 
                                            p: 1,
                                            mb: 3, 
                                            width: '100%',
                                            background: '#13151C',
                                            borderRadius: '24px'
                                        }}
                                    > 
                                        
                                            <ListItemButton onClick={handleClickOpenDescription}
                                                sx={{borderRadius:'20px'}}
                                            >
                                                <ListItemIcon>
                                                <SegmentIcon />
                                                </ListItemIcon>
                                                <ListItemText primary={t('Description')} />
                                                {open_description ? <ExpandLess /> : <ExpandMoreIcon />}
                                            </ListItemButton>
                                            <Collapse in={open_description} timeout="auto" unmountOnExit>
                                                <List component="div" disablePadding>
                                                    <ListItemText primary={collectionitem?.description} sx={{p:2}}  />
                                                </List>
                                            </Collapse>
                                            
                                    </Box>
                                    <Box
                                        sx={{ 
                                            p: 1, 
                                            width: '100%',
                                            background: '#13151C',
                                            borderRadius: '24px'
                                        }}
                                    >         
                                        
                                        <ListItemButton onClick={handleClickOpenMeta}
                                            sx={{borderRadius:'20px'}}
                                        >
                                            <ListItemIcon>
                                            <FormatListBulletedIcon />
                                            </ListItemIcon>
                                            <ListItemText primary={t('Details')} />
                                            {open_meta ? <ExpandLess /> : <ExpandMoreIcon />}
                                        </ListItemButton>
                                        <Collapse in={open_meta} timeout="auto" unmountOnExit>
                                            <List component="div" sx={{ pl: 0 }}>
                                                <ListItemText>

                                                <TableContainer component={Paper}
                                                    sx={{
                                                        background: 'rgba(255,255,255,0.015)',
                                                        boxShadow: 3,
                                                        borderRadius: '20px'
                                                    }}
                                                >
                                                    <StyledTable 
                                                        sx={{ }} 
                                                        size="small" 
                                                        aria-label="NFT Meta">
                                                        
                                                        {collectionitem?.attributes ?
                                                            <React.Fragment>

                                                                {collectionitem.attributes?.length  && collectionitem.attributes.length > 0 ? (
                                                                    <></>
                                                                    )
                                                                :
                                                                <>
                                                                    <TableRow
                                                                        onClick={() => setOpenAttributeCollapse(!open_attribute_collapse)}
                                                                    >
                                                                        <TableCell>
                                                                        {t('Attributes')}:
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {collectionitem.attributes.length}
                                                                            <IconButton
                                                                                aria-label="expand row"
                                                                                size="small"
                                                                                sx={{ textAlign:"right" }}
                                                                            >
                                                                                {open_attribute_collapse ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                            </IconButton>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                    <TableRow>
                                                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                                            <Collapse in={open_attribute_collapse} timeout="auto" unmountOnExit>
                                                                                <Box sx={{ margin: 1 }}>
                                                                                    <Table size="small" aria-label="purchases">

                                                                                        {collectionitem.attributes.length > 0 &&
                                                                                        <TableHead>
                                                                                            <TableRow>
                                                                                                <TableCell><Typography variant="subtitle1">{t('Attribute')}</Typography></TableCell>
                                                                                                <TableCell><Typography variant="subtitle1" >{t('Type')}</Typography></TableCell>
                                                                                            </TableRow>
                                                                                        </TableHead>
                                                                                        }
                                                                                        {collectionitem.attributes.length > 0 ? collectionitem.attributes?.map((item: any) => (
                                                                                            <TableRow>
                                                                                                <TableCell>{item?.trait_type}</TableCell>
                                                                                                <TableCell>{item?.value}</TableCell>
                                                                                            </TableRow>
                                                                                        ))  
                                                                                        :
                                                                                        <TableRow>
                                                                                            <TableCell>{t('Attributes')}:</TableCell>
                                                                                            <TableCell>
                                                                                            {collectionitem.attributes.itemType?.length > 0 &&
                                                                                                <Tooltip title={t('Type')}>
                                                                                                <Chip label={collectionitem.attributes?.itemType} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            {collectionitem.attributes.category?.length > 0 &&
                                                                                                <Tooltip title={t('Category')}>
                                                                                                <Chip label={collectionitem.attributes?.category} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            {collectionitem.attributes.rarity?.length > 0 &&
                                                                                                <Tooltip title={t('Rarity')}>
                                                                                                <Chip label={collectionitem.attributes?.rarity} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            {collectionitem.attributes.spec?.length > 0 &&
                                                                                                <Tooltip title={t('Spec')}>
                                                                                                <Chip label={collectionitem.attributes?.spec} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            {collectionitem.attributes.class?.length > 0 &&
                                                                                                <Tooltip title={t('Class')}>
                                                                                                <Chip label={collectionitem.attributes?.class} variant="outlined" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                            </TableCell>
                                                                                        </TableRow> 
                                                                                        }
                                                                                    </Table>
                                                                                </Box>
                                                                            </Collapse>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </>
                                                                }
                                                            </React.Fragment>
                                                        : null }

                                                        <TableRow>
                                                            <TableCell>{t('Mint')}:</TableCell>
                                                            <TableCell>
                                                                <MakeLinkableAddress addr={mint} trim={5} hasextlink={true} hascopy={true} fontsize={14} />
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        <TableRow>
                                                            <TableCell>{t('Owner')}:</TableCell>
                                                            <TableCell>
                                                                
                                                            {tokenOwners && (
                                                                <MakeLinkableAddress addr={tokenOwners?.data.parsed.info.owner} trim={5} hasextlink={true} hascopy={true} fontsize={14} />
                                                            )}  
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        {collectionitem?.symbol ? 
                                                            <TableRow>
                                                                <TableCell>{t('Symbol')}:</TableCell>
                                                                <TableCell>{collectionitem.symbol}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionitem.seller_fee_basis_points > 0 ?
                                                            <TableRow>
                                                                <TableCell>{t('Royalty')}:</TableCell>
                                                                <TableCell>
                                                                {(+collectionitem.seller_fee_basis_points/100).toFixed(2)}%
                                                                <Tooltip title={t('This is the rate at which royalties are shared with creators if this asset is sold using the Metaplex Auction program')}><HelpOutlineIcon sx={{ fontSize:16, ml: 1  }}/></Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        : null }

    {collectionitem.properties?.creators ?
                                                            <React.Fragment>
                                                                <TableRow
                                                                    onClick={() => setOpenCreatorCollapse(!open_creator_collapse)}
                                                                >
                                                                    <TableCell>{t('Creators')}:</TableCell>
                                                                    <TableCell>
                                                                        {collectionitem.properties.creators.length}
                                                                        <IconButton
                                                                            aria-label="expand row"
                                                                            size="small"
                                                                            sx={{ textAlign:"right" }}
                                                                        >
                                                                            {open_creator_collapse ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                        </IconButton>
                                                                        
                                                                    </TableCell>
                                                                </TableRow>
                                                                <TableRow>
                                                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                                        <Collapse in={open_creator_collapse} timeout="auto" unmountOnExit>
                                                                            <Box sx={{ margin: 1 }}>
                                                                                <Table size="small" aria-label="purchases">
                                                                                    <TableHead>
                                                                                        <TableRow>
                                                                                            <TableCell><Typography variant="caption">{t('Creator Address')}</Typography></TableCell>
                                                                                            <TableCell align="right"><Typography variant="caption">% {t('Royalty')}</Typography></TableCell>
                                                                                        </TableRow>
                                                                                    </TableHead>
                                                                                    {collectionitem.properties.creators.length > 0 && collectionitem.properties.creators.map((item: any) => (
                                                                                        <TableRow>
                                                                                            <TableCell>
                                                                                            <Button
                                                                                                title={t('Visit Profile')}
                                                                                                component={Link} 
                                                                                                to={`${GRAPE_PROFILE}${item.address}`}
                                                                                            >
                                                                                                <AccountCircleOutlinedIcon sx={{fontSize:'14px'}}/>
                                                                                            </Button>
                                                                                                <MakeLinkableAddress addr={item.address} trim={5} hasextlink={true} hascopy={false} fontsize={14} />
                                                                                            </TableCell>
                                                                                            <TableCell align="right">{item.share}%</TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </Table>
                                                                            </Box>
                                                                        </Collapse>
                                                                    </TableCell>
                                                                </TableRow>
                                                            </React.Fragment>
                                                        : null }


                                                        {collectionitem?.edition ?
                                                            <TableRow>
                                                                <TableCell>{t('Edition')}:</TableCell>
                                                                <TableCell>{collectionitem.edition}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionitem?.background_color ?
                                                            <TableRow>
                                                                <TableCell>{t('Background')}:</TableCell>
                                                                <TableCell>#{collectionitem.background_color}</TableCell>
                                                            </TableRow>
                                                        : null }

                                                        {collectionrawdata?.updateAuthority ?
                                                            <TableRow>
                                                                <TableCell>{t('Update Authority')}:</TableCell>
                                                                <TableCell>
                                                                    <MakeLinkableAddress addr={collectionrawdata.updateAuthority} trim={5} hasextlink={true} hascopy={false} fontsize={14} />
                                                                </TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionrawdata?.isMutable == 1 ?
                                                            <TableRow>
                                                                <TableCell>{t('Mutable')}:</TableCell>
                                                                <TableCell><LockOpenIcon /></TableCell>
                                                            </TableRow>
                                                        : 
                                                            <TableRow>
                                                                <TableCell>{t('Mutable')}:</TableCell>
                                                                <TableCell><Tooltip title={t('This is immutable')}><LockIcon /></Tooltip></TableCell>
                                                            </TableRow> }
                                                        {collectionrawdata?.primarySaleHappened ? 
                                                            <TableRow>
                                                                <TableCell>{t('Primary Sale')}:</TableCell>
                                                                <TableCell><CheckCircleIcon /></TableCell>
                                                            </TableRow>
                                                        : 
                                                        <TableRow>
                                                            <TableCell>{t('Primary Sale')}:</TableCell>
                                                            <TableCell><Tooltip title={t('Primary sale has not occured as of this fetch')}><BlockIcon /></Tooltip></TableCell>
                                                        </TableRow>
                                                        }

                                                        {collectionitem?.createdAt ?
                                                            <TableRow>
                                                                <TableCell>{t('Created At')}:</TableCell>
                                                                <TableCell>{formatBlockTime(collectionitem.createdAt, false, false)}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionitem?.updatedAt ?
                                                            <TableRow>
                                                                <TableCell>{t('Updated At')}:</TableCell>
                                                                <TableCell>{formatBlockTime(collectionitem.updatedAt, false, false)}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionitem?.deactivated ?
                                                            <TableRow>
                                                                <TableCell>{t('Deactivated')}:</TableCell>
                                                                <TableCell><Tooltip title={t('This is deactivated')}><CheckCircleIcon /></Tooltip></TableCell>
                                                            </TableRow>
                                                        : null }

                                                        {collectionitem.image ?
                                                            
                                                            <TableRow>
                                                                <TableCell>{t('Image')}:</TableCell>
                                                                <TableCell>
                                                                    <Button size="small" variant="text" component="a" href={`${collectionitem.image}`} target="_blank">
                                                                    {t('View Original')} <OpenInNewIcon sx={{fontSize:12, ml:1}} />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        : null}

                                                        {/*collectionrawprimer.owner ?
                                                            <TableRow>
                                                                <TableCell>Owner:</TableCell>
                                                                <TableCell>{collectionrawprimer.owner}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionrawprimer.executable ?
                                                            <TableRow>
                                                                <TableCell>Executable:</TableCell>
                                                                <TableCell>{collectionrawprimer.executable}</TableCell>
                                                            </TableRow>
                                                        : null */}
                                                    </StyledTable>
                                                </TableContainer>
                                                
                                                </ListItemText>
                                            </List>
                                        </Collapse>
                                    </Box>
                                </List>
                            </Grid>
                            <Grid item xs={12} sm={12} md={6}>
                                
                                <List
                                    sx={{ 
                                        width: '100%',
                                        p: 2
                                    }}
                                    component="nav"
                                    >       
                                    <ListItemText>

                                        <Box>
                                            <Typography component="div" variant="subtitle1">
                                               <GrapeVerified updateAuthority={collectionrawdata} symbol={collectionitem.symbol} />
                                            </Typography>
                                            <Typography component="div" variant="h4" sx={{fontWeight:'800'}}>
                                                <strong>
                                                {collectionitem.name}
                                                </strong>
                                            </Typography>
                                            <Typography component="div" variant="caption">
                                                {tokenOwners && 
                                                    (<>
                                                        {(OTHER_MARKETPLACES.filter(e => e.address === tokenOwners?.data.parsed.info.owner).length > 0) ? (
                                                            <>
                                                                {(OTHER_MARKETPLACES.filter(e => e.address === tokenOwners?.data.parsed.info.owner)).map(filteredMarket => (
                                                                <>
                                                                {t('Listed on')}
                                                                    {(filteredMarket.name.length > 0) ? (
                                                                        <>  
                                                                            
                                                                            {(filteredMarket.previewUrl.length > 0) ? (
                                                                                <>
                                                                                    <Button size="small" variant="text" component="a" href={`${filteredMarket.previewUrl}${mint}`} target="_blank" sx={{ml:1}}>
                                                                                        {filteredMarket.logo &&
                                                                                        <Avatar 
                                                                                            component={Paper} 
                                                                                            elevation={4}
                                                                                            alt={filteredMarket.name}
                                                                                            src={filteredMarket.logo}
                                                                                            sx={{ width: 14, height: 14, bgcolor: "#eee", mr:0.5}}
                                                                                        />
                                                                                        }
                                                                                        {filteredMarket.name} <OpenInNewIcon sx={{fontSize:'14px', ml:1}} />
                                                                                    </Button>
                                                                                </>
                                                                            ):(
                                                                                <>
                                                                                    <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/address/${mint}`} target="_blank" sx={{ml:1}}>
                                                                                        {filteredMarket.logo &&
                                                                                        <Avatar 
                                                                                            component={Paper} 
                                                                                            elevation={4}
                                                                                            alt={filteredMarket.name}
                                                                                            src={filteredMarket.logo}
                                                                                            sx={{ width: 14, height: 14, bgcolor: "#eee", mr:0.5}}
                                                                                        />
                                                                                        }
                                                                                        {filteredMarket.name} 
                                                                                        <OpenInNewIcon sx={{fontSize:'14px', ml:1}} />
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                        </>
                                                                    ):(
                                                                        <>
                                                                        {trimAddress(tokenOwners?.data.parsed.info.owner, 4)}
                                                                        </>
                                                                    )}
                                                                </>
                                                                ))}
                                                            </>
                                                        )
                                                        :
                                                        (
                                                            <>
                                                            {!loadingOwner ?
                                                            <Grid container direction="row">
                                                                <Grid item>
                                                                {solanaDomain && solanaDomain.length > 0 ?
                                                                <>
                                                                    {t('Owned by')} 
                                                                    <Tooltip title={t('Visit Profile')}>
                                                                        <Button
                                                                            component={Link} 
                                                                            to={`${GRAPE_PROFILE}${tokenOwners?.data.parsed.info.owner}`}
                                                                            sx={{borderRadius:'24px', color:'white'}}
                                                                        >
                                                                            <Typography variant="caption">
                                                                                <strong>{solanaDomain}</strong>
                                                                            </Typography>
                                                                        </Button>
                                                                    </Tooltip>
                                                                </>
                                                                :
                                                                <>
                                                                    {t('Owned by')} 
                                                                    <Tooltip title={t('Visit Profile')}>
                                                                        <Button
                                                                            component={Link} 
                                                                            to={`${GRAPE_PROFILE}${tokenOwners?.data.parsed.info.owner}`}
                                                                            sx={{borderRadius:'24px', color:'white'}}
                                                                        >
                                                                            <Typography variant="caption">
                                                                                <strong>{trimAddress(tokenOwners?.data.parsed.info.owner, 4)}</strong>
                                                                            </Typography>
                                                                        </Button>
                                                                    </Tooltip>

                                                                </>
                                                                }
                                                                
                                                                </Grid>
                                                                <Grid item 
                                                                    sx={{ 
                                                                        display: "flex",
                                                                        justifyContent: 'flex-end'
                                                                    }}>
                                                                    <Tooltip title={t('Explorer')}>
                                                                        <Button size="small" variant="text" component="a" href={`https://explorer.solana.com/address/${tokenOwners?.data.parsed.info.owner}`} target="_blank" sx={{borderRadius:'24px', color:'white', pl:0, pr:0}}> <OpenInNewIcon sx={{fontSize:'14px'}} /></Button>
                                                                    </Tooltip>
                                                                    {publicKey && publicKey.toBase58() === tokenOwners?.data.parsed.info.owner ?
                                                                        <Tooltip title={t('Set this NFT as your avatar')}>
                                                                            <Button 
                                                                                variant="text" 
                                                                                onClick={HandleSetAvatar}
                                                                                size="small"
                                                                                className="profileAvatarIcon"
                                                                                sx={{borderRadius:'24px', color:'white'}}
                                                                                >
                                                                                <AccountCircleOutlinedIcon 
                                                                                    sx={{
                                                                                        fontSize:'14px',
                                                                                    }} 
                                                                                />
                                                                            </Button>
                                                                        </Tooltip>
                                                                    :
                                                                    <>
                                                                        {loadingFollowState ?
                                                                            <Button 
                                                                                sx={{borderRadius:'24px'}}
                                                                            >
                                                                                <CircularProgress sx={{p:'14px',m:-2}} />
                                                                            </Button>
                                                                        :
                                                                            <>
                                                                            {isFollowing ?  
                                                                                    <Button 
                                                                                        variant="text" 
                                                                                        title={t('Unfollow')}
                                                                                        onClick={() => followWalletDisconnect(tokenOwners?.data.parsed.info.owner)}
                                                                                        size="small"
                                                                                        className="profileAvatarIcon"
                                                                                        sx={{borderRadius:'24px', color:'white'}}
                                                                                        >
                                                                                        <PersonRemoveOutlinedIcon sx={{fontSize:'14px'}} />
                                                                                    </Button>
                                                                                :
                                                                                    <Button 
                                                                                        variant="text" 
                                                                                        title={t('Follow')}
                                                                                        onClick={() => followWalletConnect(tokenOwners?.data.parsed.info.owner, solanaDomain || '')}
                                                                                        size="small"
                                                                                        className="profileAvatarIcon"
                                                                                        sx={{borderRadius:'24px', color:'white'}}
                                                                                        >
                                                                                        <PersonAddOutlinedIcon sx={{fontSize:'14px'}} />
                                                                                    </Button>
                                                                            }
                                                                            </>
                                                                        }
                                                                    </>
                                                                    }

                                                                </Grid>
                                                                
                                                            </Grid>
                                                            :<>{t('Loading owner')}</>}
                                                            </>
                                                        )
                                                    }
                                                    </>
                                                    )
                                                }  
                                            </Typography>
                                        </Box>
                                    </ListItemText>
                                </List>
                                
                                {tokenOwners?.data.parsed.info.owner &&
                                    <ItemOffers
                                        mintAta={mintAta} 
                                        updateAuthority={collectionrawdata?.updateAuthority}
                                        mintOwner={tokenOwners?.data.parsed.info.owner} 
                                        mint={mint} 
                                        image={collectionitem.image}
                                        refreshOwner={refreshOwner}
                                        setRefreshOwner={setRefreshOwner} 
                                        setRefresh={props.setRefresh} 
                                        grape_member_balance={grape_member_balance}
                                        grape_governance_balance={grape_governance_balance}
                                        grape_offer_threshhold={grape_offer_threshhold}
                                        grape_weighted_score={grape_weighted_score}
                                        grape_whitelisted={grape_whitelisted}
                                        sol_portfolio_balance={sol_portfolio_balance}
                                        />
                                }
                                
                                {collectionitem.attributes?.length && collectionitem.attributes.length > 0 ? (
                                    <Box
                                        sx={{ 
                                            p: 1, 
                                            width: '100%',
                                            background: '#13151C',
                                            borderRadius: '24px'
                                        }}
                                    > 
                                        <ListItemButton onClick={handleClickOpenTraits}
                                            sx={{borderRadius:'20px'}}
                                        >
                                            <ListItemIcon>
                                            <FormatListBulletedIcon />
                                            </ListItemIcon>
                                            <ListItemText primary={t('Traits')} />
                                            {open_traits ? <ExpandLess /> : <ExpandMoreIcon />}
                                        </ListItemButton>
                                        <Collapse in={open_traits} timeout="auto" unmountOnExit>
                                            <List
                                                sx={{ 
                                                    width: '100%'
                                                }}
                                                component="nav"
                                                >       
                                                <ListItemText>
                                                    <Grid item alignItems="center">
                                                        {collectionitem.attributes?.length && collectionitem.attributes.length > 0 && (
                                                            <>
                                                                {collectionitem.attributes?.map((item: any) => (
                                                                    <Chip 
                                                                        sx={{
                                                                            padding:'22.5px',
                                                                            margin: '5px',
                                                                            textAlign: 'center',
                                                                            background: '#272727',
                                                                            borderRadius: '10px'
                                                                        }}
                                                                        label={
                                                                            <>
                                                                                <strong>{item?.trait_type}</strong>
                                                                                <Divider />
                                                                                {item?.value}
                                                                            </>} />
                                                                        
                                                                ))}
                                                            </>  
                                                            )
                                                        }
                                                    </Grid>
                                                </ListItemText>
                                            </List>
                                        </Collapse>
                                    </Box>
                                )
                                : <></>
                                }
                                    
                            </Grid>
                        </Grid>    
                    
                    </Box>
                    {/*
                    <CardActions
                        sx={{
                            display: "flex",
                            justifyContent: 'flex-end',
                            padding: 1
                        }}
                    >
                        <OfferPrompt mint={mint} />
                    </CardActions>
                    */}
                </Box>  
            </Grid>
        );
    } catch(e){ 
        console.log("ERR: "+e);
        return null 
    }
}

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

export function PreviewView(this: any, props: any) {
    const [collection, setCollection] = React.useState(null);
    //const isConnected = session && session.isConnected;
    const [loading, setLoading] = React.useState(false);
    //const [success, setSuccess] = React.useState(false);
    const [mint, setMintPubkey] = React.useState(null);
    const [refresh, setRefresh] = React.useState(false);
    
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const urlParams = searchParams.get("pkey") || searchParams.get("mint") || handlekey;

    //const [pubkey, setPubkey] = React.useState(null);
    const [walletPKId, setInputPKValue] = React.useState(null);
    
    const history = useNavigate();
    //const location = useLocation();
    
    function HandlePKSubmit(event: any) {
        event.preventDefault();
        console.log("Sending: "+walletPKId);
        
        if (ValidateAddress(walletPKId)){
            // WalletId is base58 validate the type too later on
            setMintPubkey(walletPKId);
            //setPubkey(walletPKId);
            //props.setPubkey(walletPKId);
        } else{
            // Invalid Wallet ID
            console.log("INVALID MINT ID");
        }
    }
    const CollectionProfileClear = (props: any) => {
        // TODO:
        // Add button next to collection to clear navigation address
        // this should only appear if the user is logged in (has a pubkey from session)
        return (
            <React.Fragment></React.Fragment>
        );
    }

    const PreviewItem = (props: any) => {
        const [thismint, setThisMint] = React.useState(props.mint);
        const [expanded, setExpanded] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const [collectionmeta, setCollectionMeta] = React.useState(null);
        const [collectionrawdata, setCollectionRaw] = React.useState(null);
        const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
        const { connection } = useConnection();
        const MD_PUBKEY = METAPLEX_PROGRAM_ID;
        
        const handleExpandClick = () => {
            setExpanded(!expanded);
        };
        
        const getCollectionData = async () => {
            try {
                let mint_address = new PublicKey(mint)
                let [pda, bump] = await PublicKey.findProgramAddress([
                    Buffer.from("metadata"),
                    MD_PUBKEY.toBuffer(),
                    new PublicKey(mint_address).toBuffer(),
                ], MD_PUBKEY)
                
                const meta_response = await ggoconnection.getAccountInfo(pda);

                let meta_final = decodeMetadata(meta_response.data);
                
                setCollectionRaw({meta_final,meta_response});
                
                const metadata = await window.fetch(meta_final.data.uri).then(
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
                getCollectionMeta();
            }, 500);
            return () => clearInterval(interval); 
        }, [thismint]);
        
        if((!collectionmeta)||
            (loading)){
            
            return (
                <Card
                    sx={{
                        mt:4,
                        borderRadius: '20px',
                    }}
                >
                    <Skeleton 
                        sx={{
                            borderRadius: '20px',
                        }}
                        variant="rectangular" width="100%" height={325} />
                </Card>
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
                        <GalleryItemMeta collectionitem={collectionmeta} collectionrawdata={collectionrawdata} mint={mint} setRefresh={setRefresh} setMintPubkey={setMintPubkey} />
                );
            }
            //}
        }
    }

    React.useEffect(() => { 
        if (refresh)
            setRefresh(!refresh);
        
        if (mint && ValidateAddress(mint)){
            //props.history.push({
            history({
                pathname: GRAPE_PREVIEW+mint
            },
                { replace: true }
            );
        } else {
            history({
                pathname: '/preview'
            },
                { replace: true }
            );
        } 
        
    }, [mint, refresh]);

    if (!mint){
        if (urlParams?.length > 0){
            setMintPubkey(urlParams);
        }
    }

    const { t, i18n } = useTranslation();

    return (
        <React.Fragment>
                { mint && ValidateAddress(mint) ?
                    <PreviewItem mint={mint} />
                : 
                <>
                    <React.Fragment>
                        <Box
                            sx={{ 
                                p: 1, 
                                mt: 6,
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
                                    justifyContent={'center'}
                                    rowSpacing={8}
                                >
                                    
                                    <Grid 
                                        item xs={12}
                                        alignItems="center"
                                    >
                                        <Typography
                                            variant="h3"
                                            color="inherit"
                                            display='flex'
                                            sx={{mt:2,mb:3}}
                                        >
                                            <img src={MARKET_LOGO} width="300px" className="header-logo" alt="Grape" />
                                            .art
                                        </Typography>
                                    </Grid>
                                    <Grid 
                                        item xs={12}
                                        alignItems="center"
                                    > 
                                        <Typography
                                            variant="h3"
                                            color="inherit"
                                            display='flex'
                                            sx={{mb:3}}
                                        >{t('ooops... you entered an invalid address!')}</Typography>

                                    </Grid>
                                </Grid>
                            </Box>
                    </React.Fragment>
                </>
                }
                
        </React.Fragment>
    );
}