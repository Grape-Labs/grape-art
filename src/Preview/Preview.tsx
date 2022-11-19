import React, { useEffect, useState, useCallback, memo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import CyberConnect, { Env, Blockchain, ConnectionType } from '@cyberlab/cyberconnect';

import { Connection, ParsedAccountData, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
// @ts-ignore
import ImageViewer from 'react-simple-image-viewer';
import { Helmet } from 'react-helmet';

import { ChatNavigationHelpers, useDialectUiId } from '@dialectlabs/react-ui';
import { GRAPE_BOTTOM_CHAT_ID } from '../utils/ui-contants';

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

import BlurOnIcon from '@mui/icons-material/BlurOn';
import BlurOffIcon from '@mui/icons-material/BlurOff';
import Chat from '@mui/icons-material/Chat';
import Mail from '@mui/icons-material/Mail';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
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
    GRAPE_COLLECTIONS_DATA,
    MARKET_LOGO,
    GRAPE_COLLECTION,
    THEINDEX_RPC_ENDPOINT,
    SHDW_PROXY,
    CLOUDFLARE_IPFS_CDN
} from '../utils/grapeTools/constants';

import {
    METAPLEX_PROGRAM_ID,
  } from '../utils/auctionHouse/helpers/constants';

import SendToken from '../StoreFront/Send';
import ItemOffers from './ItemOffers';
import { SocialLikes, SocialFlags } from './Social';
import ExplorerView from '../utils/grapeTools/Explorer';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling

import "../App.less";

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { decodeMetadata } from '../utils/auctionHouse/helpers/schema';
import GrapeIcon from "../components/static/GrapeIcon";

import { useTranslation } from 'react-i18next';
import { isValidAddr } from "../utils/cyberConnect/helper";

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
    const [grapeVerified, setGrapeVerified] = React.useState(false);
    const [verifiedState, setVerifiedState] = React.useState(false);
    const [verifiedPK, setVerificationPK] = React.useState(null);
    const [collectionImage, setCollectionImage] = React.useState(null);
    const [collectionName, setCollectionName] = React.useState(props?.symbol);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const ticonnection = new Connection(THEINDEX_RPC_ENDPOINT);
    const verifiedCollection = props.verifiedCollection;
    const [collectionRawData, setCollectionRawData]  = React.useState(props?.collectionRawData);
    
    let grape_verified = -1;

    const MD_PUBKEY = METAPLEX_PROGRAM_ID;
    
    const getCollectionData = async (collectionAddress:string) => {
        try {
            const mint_address = new PublicKey(collectionAddress)
            const [pda, bump] = await PublicKey.findProgramAddress([
                Buffer.from("metadata"),
                MD_PUBKEY.toBuffer(),
                new PublicKey(mint_address).toBuffer(),
            ], MD_PUBKEY)
            
            
            const meta_response = await ticonnection.getAccountInfo(pda);

            const meta_final = decodeMetadata(meta_response.data);
            
            let file_metadata = meta_final.data.uri;
            const file_metadata_url = new URL(file_metadata);

            const IPFS = 'https://ipfs.io';
            const IPFS_2 = "https://nftstorage.link/ipfs";
            if (file_metadata.startsWith(IPFS) || file_metadata.startsWith(IPFS_2)){
                file_metadata = CLOUDFLARE_IPFS_CDN+file_metadata_url.pathname;
            }

            const metadata = await window.fetch(file_metadata).then(
                (res: any) => res.json());
            
            setCollectionName(metadata.name);
            //console.log("found: "+metadata.image);
            //console.log("IPFS: "+IPFS);
            
            let thisImage = metadata.image;
            if (metadata.image.startsWith(IPFS)){
                const meta_image_url = new URL(metadata.image)
                thisImage = CLOUDFLARE_IPFS_CDN+meta_image_url.pathname;
            }

            setCollectionImage(thisImage) 

            //return metadata;
            return null;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    React.useEffect(() => { 
        try{
            if (collectionRawData && !loading){
                let verified = false;
                let verified_creator = false;
                //console.log("Verified: "+JSON.stringify(collectionRawData))
                // first stage verification
                
                if (collectionRawData?.data?.creators){
                    for (const item of collectionRawData.data.creators){
                        if (item.address === collectionRawData.updateAuthority)
                            if (item.verified === 1){
                                // now validate verify_collection in the collection results
                                verified_creator = true;
                            }
                    }
                }
                // second stage verification
                if (collectionRawData?.collection?.verified){
                    if (collectionRawData.collection.verified === 1){
                        //console.log("updateAuthority: "+JSON.stringify(updateAuthority));
                        if (ValidateAddress(collectionRawData.collection?.key)){
                            setVerifiedState(true);
                            if (!collectionImage){
                                setVerificationPK(collectionRawData.collection?.key)
                                getCollectionData(collectionRawData.collection?.key);
                                
                            }
                        }
                    }
                }
                
                
                // third stage verification
                // grape_verified = UPDATE_AUTHORITIES.indexOf(collectionRawData);
                // grape_verified = 1;
                
                if (verifiedCollection){
                    if (verifiedCollection.address === collectionRawData.updateAuthority) {
                        setGrapeVerified(true);
                    } else if (verifiedCollection?.creatorAddress === collectionRawData?.data?.creators[0]?.address) {
                        setGrapeVerified(true);
                    }
                }
            }
        }catch(e){console.log("ERR: "+e)}
    }, [collectionRawData]);

    const { t, i18n } = useTranslation();

    if (verifiedState){
        
        return (
            <Tooltip title={grapeVerified ? `${props.symbol}: ${t('Collection Verified on Metaplex & Grape')}` : `${props.symbol}: ${t('Collection Verified on Metaplex')}`} placement="top">
                <Button 
                    href={grapeVerified ? `${GRAPE_COLLECTION}${verifiedCollection.vanityUrl}` : `${GRAPE_PREVIEW}${verifiedPK}`}
                    sx={{color:'white', borderRadius:'24px'}}>
                    {collectionName}
                    {console.log("verifiedCollection: "+JSON.stringify(verifiedCollection))}
                    <Avatar 
                        component={Paper} 
                        elevation={4}
                        alt={collectionRawData?.data?.symbol}
                        src={verifiedCollection ?  GRAPE_COLLECTIONS_DATA+verifiedCollection.logo : collectionImage}
                        sx={{ width: 20, height: 20, bgcolor: "#222",ml:1}}
                    />
                    {grape_verified > -1 &&
                        <VerifiedIcon sx={{fontSize:"20px",ml:1}} />
                    }
                </Button>
            </Tooltip>
        );
    
    } else if (grapeVerified){
        return (
            <Tooltip title={`${verifiedCollection.name}: ${t('Collection Verified on Grape')}`} placement="top">
                <Button 
                    component={Link} to={`${GRAPE_COLLECTION}${verifiedCollection.vanityUrl}`}
                    sx={{color:'white', borderRadius:'24px'}}>
                    {verifiedCollection.name}
                    <Avatar 
                        component={Paper} 
                        elevation={4}
                        alt={verifiedCollection.name}
                        src={GRAPE_COLLECTIONS_DATA+verifiedCollection.logo}
                        sx={{ width: 20, height: 20, bgcolor: "#222",ml:1}}
                    />
                    {grape_verified > -1 &&
                        <VerifiedIcon sx={{fontSize:"20px",ml:1}} />
                    }
                </Button>
            </Tooltip>
        );
    } else {
        return ( 
            <>
                {collectionName || 
                    <>
                        Update Authority: {trimAddress(props?.collectionRawData?.updateAuthority,4)} <Tooltip title="Could not verify collection"><Button sx={{borderRadius:'17px'}}><ErrorOutlineIcon fontSize="small" sx={{color:'yellow'}} /></Button></Tooltip>
                    </>
                }
            </>
        );
    } 
}

function GalleryItemMeta(props: any) {
    const floorPrice = props.floorPrice || null;
    const viewMode = props.viewMode;
    const handlekey = props.handlekey || null;
    let mode_margin = 0;
    if (viewMode===0)
        mode_margin = 10;
    
    const [loadingTokenAccountAccountOwnerHoldings, setLoadingTokenAccountAccountOwnerHoldings] = React.useState(false);
    const [loadingMintAta, setLoadingMintAta] = React.useState(false);
    const verifiedAuctionHouses = props.verifiedAuctionHouses;
    const verifiedCollection = props.verifiedCollection;
    const collectionrawprimer = props.collectionrawdata.meta_primer || [];
    const collectionrawdata = props.collectionrawdata.meta_final || [];
    const collectionitem = props.collectionitem.collectionmeta || [];
    const collectionAuctionHouse = props.collectionAuctionHouse || null;
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
    const { navigation, open } = useDialectUiId<ChatNavigationHelpers>(GRAPE_BOTTOM_CHAT_ID);
    const [previewBlur, setPreviewBlur] = React.useState(0);

    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const solanaProvider = useWallet();

    const NAME_SPACE = 'Grape';

    const cyberConnect = new CyberConnect({
        namespace: NAME_SPACE,
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
            //namespace: NAME_SPACE,
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
        const promise = await cyberConnect.disconnect(followAddress.toString())
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
        setLoadingMintAta(true);
        const [flargestTokenAccounts] = await Promise.all([GetLargestTokenAccounts()]);
        //console.log("settings setMintAta: "+JSON.stringify(flargestTokenAccounts));

        if (+flargestTokenAccounts[0].amount === 1){ // some NFTS are amount > 1
            setMintATA(flargestTokenAccounts[0].address);
        }
        setLoadingMintAta(false);
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
                    const socialconnection = await fetchSearchAddrInfo(publicKey.toBase58(), towner);
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
        const [tokenowner] = await Promise.all([GetTokenOwner(mintAta)]);
        setTokenOwners(tokenowner);
        //fetchSolanaDomain(tokenowner?.data.parsed.info.owner);
        getFollowStatus(tokenowner?.data.parsed.info.owner);
        setLoadingOwner(false);
    }

    React.useEffect(() => {
        if ((publicKey)&&(tokenOwners)){
            getFollowStatus(tokenOwners?.data.parsed.info.owner);
        }
    }, [publicKey]);

    const fetchTokenAccountOwnerHoldings = async () => {
        setLoadingTokenAccountAccountOwnerHoldings(true);
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
                        const mint = token.account.data.parsed.info.mint;
                        const balance = token.account.data.parsed.info.tokenAmount.uiAmount;
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
        setLoadingTokenAccountAccountOwnerHoldings(false);
    }

    const HandleSetAvatar = async () => {
        try{
            const transaction = await createSetProfilePictureTransaction(publicKey, new PublicKey(mint), new PublicKey(mintAta));
            //console.log("Transaction: "+JSON.stringify(transaction));
            enqueueSnackbar(`${t('Preparing set your avatar with')} ${mint} ${t('mint')}`,{ variant: 'info' });
            //transaction.feePayer = publicKey;
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
            enqueueSnackbar(`${t('Your avatar has been set')} `,{ variant: 'success', action:snackaction });
        } catch(e:any){
            closeSnackbar();
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
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
            <>
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
            </>
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
            if (!loadingOwner){
                getMintOwner();
                if (!loadingTokenAccountAccountOwnerHoldings)
                    fetchTokenAccountOwnerHoldings();
            }
        }
        if (refreshOwner){
            setRefreshOwner(!refreshOwner);
        }
    }, [mintAta, publicKey, refreshOwner]);
    
    React.useEffect(() => { 
        if (mint){
            if (!loadingMintAta){
                if (!mintAta){
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
                }
            }
        }
    }, [mint]);

    const { t, i18n } = useTranslation();

    try{
        return (
            <Grid
                sx={{mt:{mode_margin}}}
            >
                {viewMode === 0 &&
                    <>
                        <Helmet>
                            <title>{`${collectionitem.name} | ${t('Grape Social. Stateless. Marketplace.')}`}</title>
                            <meta property="og:title" content={`${collectionitem.name} @Grape`} />
                            <meta property="og:type" content="website" />
                            <meta property="og:url" content={window.location.href} />
                            <meta property="og:image" content={collectionitem.image} />
                            <meta property="og:description" content={collectionitem.name} />
                            <meta name="theme-color" content="#000000" />

                            <meta name="twitter:card" content="summary" />
                            <meta name="twitter:title" content={collectionitem.name} />
                            <meta name="twitter:description" content={collectionitem.name} />
                            <meta name="twitter:image" content={collectionitem.image} />

                            {verifiedCollection?.theme &&
                                <style>{'html, body { background: '+verifiedCollection.theme+' fixed!important;height: 100%; }'}</style>
                            }

                            {verifiedCollection?.theme && verifiedCollection.themeImage &&
                                <style>{'html, body { background: '+verifiedCollection.theme+' fixed!important;height: 100%; background-image:'+verifiedCollection.themeImage+'!important; background-size: 10px 10px!important; }'}</style>
                            }

                        </Helmet>
                    </>
                }


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
                        mt: {mode_margin},
                        
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
                                {(viewMode===0) ?
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
                                :
                                    <Grid item xs={6} md={8}></Grid>
                                }
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
                                                    <ShareSocialURL fontSize={'24px'} url={`https://grape.art${GRAPE_PREVIEW}${mint}`} title={`${collectionitem.name}`} />
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
                                                                        borderRadius:'24px',
                                                                        filter:`blur(${previewBlur}px)`,                                                                    }}
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
                                                            {/*previewBlur && previewBlur !== 0 ?
                                                                <Tooltip title="DeBlur / Clean this up">
                                                                    <Button
                                                                        size="small" variant="text" 
                                                                        sx={{color:'white',borderRadius:'24px'}}
                                                                        onClick={ () => setPreviewBlur(0) }
                                                                    >
                                                                        <BlurOffIcon />
                                                                    </Button>
                                                                </Tooltip>
                                                            :
                                                                <Tooltip title="Blur">
                                                                    <Button
                                                                        size="small" variant="text" 
                                                                        sx={{color:'white',borderRadius:'24px'}}
                                                                        onClick={ () => setPreviewBlur(20) }
                                                                    >
                                                                        <BlurOnIcon />
                                                                    </Button>
                                                                </Tooltip>
                                                            */}
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
                                                            <>

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
                                                                                        {collectionitem.attributes.length > 0 ? collectionitem.attributes?.map((item: any, key:any) => (
                                                                                            <TableRow key={key}>
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
                                                            </>
                                                        : null }

                                                        <TableRow>
                                                            <TableCell>{t('Mint')}:</TableCell>
                                                            <TableCell>
                                                                <ExplorerView address={mint} type='address' shorten={5} hideTitle={false} style='text' color='white' fontSize='14px' />
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        <TableRow>
                                                            <TableCell>{t('Owner')}:</TableCell>
                                                            <TableCell>
                                                                
                                                            {tokenOwners && (
                                                                <ExplorerView grapeArtProfile={true} address={tokenOwners?.data.parsed.info.owner} type='address' shorten={5} hideTitle={false} style='text' color='white' fontSize='14px' />
                                                            )}  
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        {collectionitem?.symbol ? 
                                                            <TableRow>
                                                                <TableCell>{t('Symbol')}:</TableCell>
                                                                <TableCell>{collectionitem.symbol}</TableCell>
                                                            </TableRow>
                                                        : null }
                                                        {collectionrawdata.data.sellerFeeBasisPoints > 0 ?
                                                            <TableRow>
                                                                <TableCell>{t('Royalty')}:</TableCell>
                                                                <TableCell>
                                                                {(+collectionrawdata.data.sellerFeeBasisPoints/100).toFixed(2)}%
                                                                <Tooltip title={t('This is the rate at which royalties are shared with creators if this asset is sold using the Metaplex Auction program')}><HelpOutlineIcon sx={{ fontSize:16, ml: 1  }}/></Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        : null }
                                                        
                                                        {collectionrawdata.data?.creators &&
                                                            <>
                                                                <TableRow
                                                                    onClick={() => setOpenCreatorCollapse(!open_creator_collapse)}
                                                                >
                                                                    <TableCell>{t('Creators')}:</TableCell>
                                                                    <TableCell>
                                                                        {collectionrawdata.data?.creators?.length}
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
                                                                                    {collectionrawdata.data.creators.length > 0 && collectionrawdata.data.creators.map((item: any, key:any) => (
                                                                                        <TableRow key={key}>
                                                                                            <TableCell>
                                                                                                
                                                                                                <ExplorerView grapeArtProfile={true} address={item.address} type='address' shorten={5} hideTitle={false} style='text' color='white' fontSize='14px' />
                                                                                            
                                                                                            </TableCell>
                                                                                            <TableCell align="right">{item.share}%</TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </Table>
                                                                            </Box>
                                                                        </Collapse>
                                                                    </TableCell>
                                                                </TableRow>
                                                            </>
                                                        }


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
                                                                    <ExplorerView address={collectionrawdata.updateAuthority} type='address' shorten={5} hideTitle={false} style='text' color='white' fontSize='14px' />
                                                                </TableCell>
                                                            </TableRow>
                                                        : null }

                                                        {collectionrawdata?.collection?.key ? 
                                                            <TableRow>
                                                                <TableCell>{t('Collection')}:</TableCell>
                                                                <TableCell>
                                                                    <ExplorerView address={collectionrawdata?.collection?.key} type='address' shorten={5} hideTitle={false} style='text' color='white' fontSize='14px' />
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
                                               <GrapeVerified verifiedCollection={verifiedCollection} collectionRawData={collectionrawdata} symbol={collectionitem.symbol} />
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
                                                                        <>&nbsp;
                                                                        {filteredMarket.name}

                                                                            {/*(filteredMarket.previewUrl.length > 0) ? (
                                                                                <>
                                                                                    <Button size="small" variant="text" component="a" href={`${filteredMarket.previewUrl}${mint}`} target="_blank" sx={{ml:1}}>
                                                                                    
                                                                                        {filteredMarket.logo &&
                                                                                            <Grid item>
                                                                                        <Avatar 
                                                                                            component={Paper} 
                                                                                            elevation={4}
                                                                                            alt={filteredMarket.name}
                                                                                            src={filteredMarket.logo}
                                                                                            sx={{ width: 14, height: 14, bgcolor: "#eee", mr:0.5}}
                                                                                        />
                                                                                        </Grid>
                                                                                        }
                                                                                        <Grid item>
                                                                                            {filteredMarket.name}
                                                                                        </Grid>
                                                                                    </Button>
                                                                                </>
                                                                            ):(
                                                                                <Grid item>
                                                                                    {filteredMarket.logo &&
                                                                                    <Avatar 
                                                                                        component={Paper} 
                                                                                        elevation={4}
                                                                                        alt={filteredMarket.name}
                                                                                        src={filteredMarket.logo}
                                                                                        sx={{ width: 14, height: 14, bgcolor: "#eee", mr:0.5}}
                                                                                    />
                                                                                    }
                                                                                    <ExplorerView address={mint} type='address' title={filteredMarket.name}/>
                                                                                </Grid>
                                                                            )}
                                                                        </Grid>
                                                                        */}
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
                                                                    {t('Owned by')} &nbsp;
                                                                    
                                                                    <ExplorerView showSolanaProfile={true} grapeArtProfile={true} title={solanaDomain} address={tokenOwners?.data.parsed.info.owner} type='address' hideTitle={false} style='text' color='white' fontSize={'12px'} />
                                                                    
                                                                </>
                                                                :
                                                                <>
                                                                    {t('Owned by')} &nbsp;
                                                                    <ExplorerView showSolanaProfile={true} grapeArtProfile={true} shorten={4} address={tokenOwners?.data.parsed.info.owner} type='address' hideTitle={false} style='text' color='white' fontSize={'12px'} />
                                                                </>
                                                                }
                                                                
                                                                </Grid>
                                                                <Grid item 
                                                                    sx={{ 
                                                                        display: "flex",
                                                                        justifyContent: 'flex-end'
                                                                    }}>
                                                                    {publicKey && publicKey.toBase58() === tokenOwners?.data.parsed.info.owner ?
                                                                    <>
                                                                        
                                                                        <Tooltip title={t('Set this NFT as your avatar')}>
                                                                            <Button 
                                                                                variant="text" 
                                                                                onClick={HandleSetAvatar}
                                                                                
                                                                                className="profileAvatarIcon"
                                                                                sx={{borderRadius:'17px', color:'white'}}
                                                                                >
                                                                                <AccountCircleOutlinedIcon 
                                                                                    sx={{
                                                                                        fontSize:'17px',
                                                                                    }} 
                                                                                />
                                                                            </Button>
                                                                        </Tooltip>
                                                                    </>
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
                                                                        {ValidateAddress(tokenOwners?.data.parsed.info.owner) &&
                                                                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                                                <Tooltip title="Send a direct message">
                                                                                    <Button
                                                                                        onClick={() => {
                                                                                            open();
                                                                                            navigation?.showCreateThread(tokenOwners?.data.parsed.info.owner);
                                                                                        }}
                                                                                        sx={{
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
                                                                            </Box>
                                                                        }
                                                                    </>
                                                                    }

                                                                </Grid>
                                                                
                                                                {publicKey && publicKey.toBase58() === tokenOwners?.data.parsed.info.owner &&
                                                                    <Grid item>
                                                                        <SendToken 
                                                                            mint={mint} 
                                                                            name={collectionitem.name} 
                                                                            logoURI={
                                                                                collectionitem.image ||
                                                                                mint
                                                                            } 
                                                                            balance={1} 
                                                                            conversionrate={0} 
                                                                            showTokenName={true} 
                                                                            sendType={0}
                                                                            buttonType={'text'}
                                                                            useAvatar={true}
                                                                            avatarSize={'10'}
                                                                            buttonSize={'medium'}  />
                                                                    </Grid>  
                                                                }

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
                                        floorPrice={floorPrice}
                                        mintAta={mintAta} 
                                        collectionItemData={collectionrawdata}
                                        collectionAuctionHouse={collectionAuctionHouse}
                                        verifiedAuctionHouses={verifiedAuctionHouses}
                                        verifiedCollection={verifiedCollection}
                                        mintOwner={tokenOwners?.data.parsed.info.owner} 
                                        mint={mint} 
                                        mintName={collectionitem.name}
                                        image={collectionitem.image}
                                        refreshOwner={refreshOwner}
                                        royalties={collectionrawdata.data.sellerFeeBasisPoints}
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
    const floorPrice = props.floorPrice || null;
    const [collection, setCollection] = React.useState(null);
    //const isConnected = session && session.isConnected;
    const [loading, setLoading] = React.useState(false);
    //const [success, setSuccess] = React.useState(false);
    const [mint, setMintPubkey] = React.useState(props.handlekey || null);
    const [refresh, setRefresh] = React.useState(false);
    const {handlekey} = props.handlekey || useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [counter, setCounter] = React.useState(0);
    const urlParams = searchParams.get("pkey") || searchParams.get("mint") || handlekey;
    
    //const [pubkey, setPubkey] = React.useState(null);
    const [walletPKId, setInputPKValue] = React.useState(null);
    
    const history = useNavigate();
    //const location = useLocation();

    let viewMode = 0;
    if (props?.handlekey)
        viewMode = 1;

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
            <></>
        );
    }

    const PreviewItem = (props: any) => {
        const [thismint, setThisMint] = React.useState(props.mint);
        const [expanded, setExpanded] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const [collectionmeta, setCollectionMeta] = React.useState(null);
        const [collectionrawdata, setCollectionRaw] = React.useState(null);
        const [collectionAuctionHouse, setCollectionAuctionHouse] = React.useState(null);
        const [verifiedAuctionHouses, setVerifiedAuctionHouses] = React.useState(null);
        const [vcLoading, setVcLoading] = React.useState(false);
        const [verifiedCollection, setVerifiedCollection] = React.useState(null);
        const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
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
                //console.log("meta_response: "+JSON.stringify(meta_response));

                if (meta_response){
                    let meta_final = decodeMetadata(meta_response.data);
                    
                    console.log("final: "+JSON.stringify(meta_final))

                    let file_metadata = meta_final.data.uri;
                    let file_metadata_url = new URL(file_metadata);

                    const IPFS = 'https://ipfs.io';
                    const IPFS_2 = "https://nftstorage.link/ipfs";
                    if (file_metadata.startsWith(IPFS) || file_metadata.startsWith(IPFS_2)){
                        file_metadata = CLOUDFLARE_IPFS_CDN+file_metadata_url.pathname;
                    }
                    
                    setCollectionRaw({meta_final,meta_response});
                    
                    const metadata = await window.fetch(file_metadata).then(
                        (res: any) => res.json());
                    

                    if (metadata?.image){
                        let img_metadata = metadata?.image;
                        let img_metadata_url = new URL(img_metadata);

                        const IPFS = 'https://ipfs.io';
                        const IPFS_2 = "https://nftstorage.link/ipfs";
                        if (img_metadata.startsWith(IPFS) || img_metadata.startsWith(IPFS_2)){
                            metadata.image = CLOUDFLARE_IPFS_CDN+img_metadata_url.pathname;
                        }
                    }

                    return metadata;
                } 
            } catch (e) { // Handle errors from invalid calls
                console.log(e);
                return null;
            }
        }

        const fetchVerifiedCollection = async(address:string) => {
            try{
                const url = GRAPE_COLLECTIONS_DATA+'verified_collections.json';
                const response = await window.fetch(url, {
                    method: 'GET',
                    headers: {
                    }
                  });
                  const string = await response.text();
                  const json = string === "" ? {} : JSON.parse(string);
                  //console.log(">>> "+JSON.stringify(json));
                  // filter to get only this ua
                  for (var item of json){
                    if (item.address === address){
                        //setVerifiedCollection(verified);
                        //console.log("found: "+item.address);
                        //console.log("auctionHouse: "+JSON.stringify(item));
                        return item;
                    }
                  }
                return null;
            } catch(e){
                console.log("ERR: "+e)
                return null;
            }
        }

        const fetchVerifiedAuctionHouses = async() => {
            try{
                const url = GRAPE_COLLECTIONS_DATA+'verified_auctionHouses.json';
                const response = await window.fetch(url, {
                    method: 'GET',
                    headers: {
                    }
                  });
                  const string = await response.text();
                  const json = string === "" ? {} : JSON.parse(string);
                  return json;
            } catch(e){
                console.log("ERR: "+e)
                return null;
            }
        }
    
        
        const getCollectionMeta = async () => {
            if (!loading){
                setLoading(true);
                let [collectionmeta, vAH] = await Promise.all([getCollectionData(), fetchVerifiedAuctionHouses()]);

                setCollectionMeta({
                    collectionmeta
                });

                setVerifiedAuctionHouses(vAH);

                setLoading(false);
            }
        }

        const getVerifiedCollection = async () => {
            if (!vcLoading){
                setVcLoading(true);
                let vcFinal = await fetchVerifiedCollection(collectionrawdata?.meta_final?.updateAuthority);
                
                if (vcFinal){
                    setVerifiedCollection(vcFinal);
                    setCollectionAuctionHouse(vcFinal?.auctionHouse);
                } else{ // if we could not find from UA check Creator Address
                    if (collectionrawdata?.meta_final?.data?.creators && collectionrawdata?.meta_final?.data?.creators.length > 0){
                        vcFinal = await fetchVerifiedCollection(collectionrawdata?.meta_final?.data?.creators[0]?.address);
                        if (vcFinal){
                            setVerifiedCollection(vcFinal);
                            setCollectionAuctionHouse(vcFinal?.auctionHouse);
                        }
                    }
                }
                setVcLoading(false);
            }
        }

        useEffect(() => {
            if ((collectionrawdata?.meta_final?.updateAuthority)&&(!vcLoading)){
                const interval = setTimeout(() => {
                    getVerifiedCollection();
                }, 500);
            }
        }, [collectionrawdata?.meta_final?.updateAuthority]);
    
        useEffect(() => {
            const interval = setTimeout(() => {
                getCollectionMeta();
            }, 500);
            return () => clearInterval(interval); 
        }, [thismint]);
        
        if((!collectionmeta)||(
            (loading)||
            (vcLoading))){
            
            return (
                <Card
                    sx={{
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
        } else{  
            const image = collectionmeta.collectionmeta?.image || null;
            if (!image){
                console.log("ERR: " + JSON.stringify(collectionmeta));
                return null;
            }else{
            //console.log("Mint: "+mint);
            //if ((collectionmeta)&&(!loading)){
            //if (image){
                if (!loading){
                    return (
                            <GalleryItemMeta floorPrice={floorPrice} verifiedAuctionHouses={verifiedAuctionHouses} viewMode={viewMode} verifiedCollection={verifiedCollection} collectionitem={collectionmeta} collectionrawdata={collectionrawdata} mint={mint} setRefresh={setRefresh} setMintPubkey={setMintPubkey} collectionAuctionHouse={collectionAuctionHouse} handlekey={handlekey} />
                    );
                }
            }
            //}
        }
    }

    React.useEffect(() => { 
        if (refresh){
            setRefresh(!refresh);
        }

        if (!props?.handlekey){
            setCounter(counter+1);
            
            if (mint){
                if (mint && ValidateAddress(mint)){
                    // check pathname
                    if (location.pathname !== GRAPE_PREVIEW+mint){
                        history({
                            pathname: GRAPE_PREVIEW+mint
                        },
                            { replace: true }
                        );
                    }
                } else {
                    history({
                        pathname: '/preview'
                    },
                        { replace: true }
                    );
                } 
            }
        }
        
    }, [mint, refresh]);

    React.useEffect(() => { 
        
        if ((urlParams) && (!mint) && (urlParams?.length > 0)){
            setMintPubkey(urlParams);
        }
    }, [urlParams]);

    const { t, i18n } = useTranslation();

    return (
        <>
                { mint && ValidateAddress(mint) ?
                    <>
                    {!loading && viewMode === 0 ?
                        <Box
                            sx={{mt:6}}
                        >
                            <PreviewItem mint={mint} />
                        </Box>
                    :
                        <PreviewItem mint={mint} />
                    }    
                    </>
                : 
                <>
                    <>
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
                    </>
                </>
                }
                
        </>
    );
    
}