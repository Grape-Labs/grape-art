import React, { useEffect, useState, useCallback, memo, Suspense } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils';
// @ts-ignore
import fetch from 'node-fetch';
import BN from "bn.js";

import { findDisplayName } from '../utils/name-service';
import { FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { TokenAmount, lt } from '../utils/grapeTools/safe-math';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';

import { useNavigate } from 'react-router';
import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';

import { useSnackbar } from 'notistack';

import {
    Pagination,
    Stack,
    Typography,
    Grid,
    Box,
    Skeleton,
    Avatar,
    Table,
    Card,
    CardActionArea,
    CardMedia,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Tab,
    Tabs,
    InputBase,
    Tooltip,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Container,
    ListItemIcon,
    SpeedDial,
    Hidden,
    ButtonGroup,
} from '@mui/material';

import MuiAlert, { AlertProps } from '@mui/material/Alert';

import LanguageIcon from '@mui/icons-material/Language';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';

import DiscordIcon from '../components/static/DiscordIcon';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArtTrackOutlinedIcon from '@mui/icons-material/ArtTrackOutlined';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';
import RssFeedOutlinedIcon from '@mui/icons-material/RssFeedOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import ExploreIcon from '@mui/icons-material/Explore';
import MessageIcon from '@mui/icons-material/Message';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import HomeIcon from '@mui/icons-material/Home';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';

import {
    METAPLEX_PROGRAM_ID,
    AUCTION_HOUSE_ADDRESS,
} from '../utils/auctionHouse/helpers/constants';

import { 
    GRAPE_RPC_ENDPOINT, 
    GRAPE_PREVIEW,
    REPORT_ALERT_THRESHOLD,
    THEINDEX_RPC_ENDPOINT, 
    GRAPE_PROFILE, 
    FEATURED_DAO_ARRAY, 
    GRAPE_COLLECTIONS_DATA
} from '../utils/grapeTools/constants';

import { 
    getReceiptsFromAuctionHouse,
    getMintFromVerifiedMetadata
} from '../utils/grapeTools/helpers';

import { getProfilePicture } from '@solflare-wallet/pfp';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';

import GalleryView from '../Profile/GalleryView';
import ListForCollectionView from './ListForCollection';
import ActivityView from './Activity';

import { MakeLinkableAddress, ValidateAddress, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { ConstructionOutlined, SettingsRemoteOutlined } from "@mui/icons-material";

import { useTranslation } from 'react-i18next';

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

function convertSolVal(sol: any, precision: number){
    return parseFloat(new TokenAmount(sol, 9).format());
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

const PubKeyDialog = (props: any) => {
    const [open_dialog, setOpenPKDialog] = React.useState(false);
    const [walletPKId, setInputPKValue] = React.useState('');

    const handleClickOpenDialog = () => {
        setOpenPKDialog(true);
    };
    
    const handleCloseDialog = () => {
        setInputPKValue("");
        setOpenPKDialog(false);
    };

    function HandlePKSubmit(event: any) {
        event.preventDefault();
        if ((walletPKId.length >= 32) && 
            (walletPKId.length <= 44)){
            // WalletId is base58 validate the type too later on
            props.setPubkey(walletPKId);
            handleCloseDialog();
        } else{
            // Invalid Wallet ID
            console.log("INVALID WALLET ID");
        }
    }

    const { t, i18n } = useTranslation();
    
    return (
      <React.Fragment>
        <Button size="small" variant="text" value="Search with WalletID" onClick={handleClickOpenDialog}
            sx={{borderRadius:'24px'}}
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
                {t('Public Key')}
            </DialogTitle>
            <form onSubmit={HandlePKSubmit}>
            <DialogContent>
                <TextField
                    autoFocus
                    autoComplete='off'
                    margin="dense"
                    id="collection_wallet_id"
                    label={t('Paste a public key')}
                    type="text"
                    fullWidth
                    variant="standard"
                    value={walletPKId}
                    onChange={(e) => setInputPKValue(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog}>{t('Cancel')}</Button>
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


/*
  LAYOUT:
    0 ['key', 'u8'] (Uninitialized=0, MetadataV1=4)
    1 ['updateAuthority', 'pubkey'], (ignore)
    33 ['mint', 'pubkey'], (filter)
    65 ['data', Data],
    72+0 name (borsh string)
    72+x symbol (borsh string)
    72+x uri (borsh string)
 */

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

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
    >
        {value === index && (
        <Box sx={{ p: 0 }}>
            <Typography>{children}</Typography>
        </Box>
        )}
    </div>
    );
}

const StyledSpeedDial = styled(SpeedDial)(({ theme }) => ({
    position: 'absolute',
    '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
      top: theme.spacing(2),
      left: theme.spacing(2),
    },
  }));
  
const MainMenu = (props:any) => {
    const pubkey = props.pubkey;
    const { publicKey } = useWallet();

    const { t, i18n } = useTranslation();

    if ((publicKey) && (publicKey.toBase58() != pubkey)){
        return (
        
            <List
                sx={{m:1,p:1}}
            >
                <ListItem disablePadding>
                    <ListItemButton
                        title={t('Back Home')}
                        component={Link} to={`${GRAPE_PROFILE}${publicKey.toBase58()}`}
                        sx={{
                            width:'100%',
                            borderRadius:'25px',
                            p: 1
                        }}
                    >
                        <ListItemIcon>
                            <HomeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Home" />
                    </ListItemButton>
                </ListItem>
    
                <ListItem disablePadding>
                    <ListItemButton
                        title={t('Visit Solana Explorer')}
                        component="a" href={`https://explorer.solana.com/address/${pubkey}`} target="_blank"
                        sx={{
                            width:'100%',
                            borderRadius:'25px',
                            p: 1
                        }}
                    >
                        <ListItemIcon>
                            <ExploreIcon />
                        </ListItemIcon>
                        <ListItemText primary="Explore" />
                    </ListItemButton>
                </ListItem>
    
                <ListItem disablePadding>
                    <ListItemButton
                        title="Messaging coming soon"
                        disabled
                        sx={{
                            width:'100%',
                            borderRadius:'25px',
                            p: 1
                        }}
                    >
                        <ListItemIcon>
                            <MessageIcon />
                        </ListItemIcon>
                        <ListItemText primary={`Messages`} />
                    </ListItemButton>
                </ListItem>
            </List>
    
        );
    } else{
        return (<></>);
    }
    
    /*
    const actions = [
        { icon: <HomeIcon />, name: 'Home' },
        { icon: <ExploreIcon />, name: 'Explore' },
        { icon: <MessageIcon />, name: 'Messages *coming soon' },
    ];
    
    return (
        <Box sx={{ height: 230, transform: 'translateZ(0px)', flexGrow: 1 }}>
            <SpeedDial
                ariaLabel="Menu"
                sx={{ position: 'absolute', bottom: 16, left: 16 }}
                icon={<SpeedDialIcon sx={{color:'white'}} />}
                direction='down'
            >
                {actions.map((action) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                />
                ))}
            </SpeedDial>
        </Box>
    )
    */
}

export const TabActiveContext = React.createContext({
    activeTab: 0,
    setActiveTab: (at:number) => {}
});

export const TabActiveProvider = ({ children, initialActiveKey }) => {
    const [activeTab, setActiveTab] = useState(initialActiveKey);
    return (
      <TabActiveContext.Provider
        value={{
          activeTab,
          setActiveTab
        }}
      >
        {children}
      </TabActiveContext.Provider>
    );
};


export async function findOwnedNameAccountsForUser(
    connection: Connection,
    userAccount: PublicKey
  ): Promise<PublicKey[]> {
    const NAME_PROGRAM_ID = new PublicKey('namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX');
    const filters = [
      {
        memcmp: {
          offset: 32,
          bytes: userAccount.toBase58(),
        },
      },
    ];
    const accounts = await connection.getProgramAccounts(NAME_PROGRAM_ID, {
      filters,
    });
    
    return accounts.map((a) => a.pubkey);    
}

export function StoreFrontView(this: any, props: any) {
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const ticonnection = new Connection(THEINDEX_RPC_ENDPOINT);
    //const [provider, setProvider] = React.useState(getParam('provider'));
    const [gallery, setGallery] = React.useState(null);
    const [collectionMintList, setCollectionMintList] = React.useState(null);
    const [collectionAuthority, setCollectionAuthority] = React.useState(null);
    const [verifiedCollectionArray, setVerifiedCollectionArray] = React.useState(null);
    const [auctionHouseListings, setAuctionHouseListings] = React.useState(null);
    const [auctionHouseActivity, setAuctionHouseActivity] = React.useState(null);
    const [wallet_collection_meta, setCollectionMeta] = React.useState(null);
    const [final_collection, setCollectionMetaFinal] = React.useState(null);
    //const isConnected = session && session.isConnected;
    const [loading, setLoading] = React.useState(false);
    const [stateLoading, setStateLoading] = React.useState(false);
    const [rdloading, setRDLoading] = React.useState(false);
    const [loadCount, setLoadCount] = React.useState(0);
    //const [success, setSuccess] = React.useState(false);
    const [withPubKey, setWithPubKey] = React.useState(null);
    const [pubkey, setPubkey] = React.useState(null);
    const [newinputpkvalue, setNewInputPKValue] = React.useState(null);
    const [solWebUrl, setSolWebUrl] = React.useState(null);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [hasProfilePicture, setHasProfilePicture] = React.useState(false);
    const [solanaDomain, setSolanaDomain] = React.useState(null);

    //const { handlekey } = useParams() as { 
    //    handlekey: string;
    //}
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const urlParams = searchParams.get("pkey") || searchParams.get("address") || handlekey;
    
    const navigate = useNavigate();
    //const location = useLocation();

    const { t, i18n } = useTranslation();
    
    const fetchVerifiedCollection = async(address:string) => {
        try{
            //const url = './verified_collections.json';
            const url = GRAPE_COLLECTIONS_DATA+'verified_collections.json';
            const response = await window.fetch(url, {
                method: 'GET',
                headers: {
                }
              });
              const string = await response.text();
              const json = string === "" ? {} : JSON.parse(string);
              //console.log(">>> "+JSON.stringify(json));
              setVerifiedCollectionArray(json); 
              return json;
            
        } catch(e){console.log("ERR: "+e)}
    }

    const fetchMintList = async(address:string) => {
        try{
            const url = GRAPE_COLLECTIONS_DATA+address.substring(0,9)+'.json';
            console.log("with: "+url);
            const response = await window.fetch(url, {
                method: 'GET',
                headers: {
                }
              });
              const string = await response.text();
              const json = string === "" ? {} : JSON.parse(string);
              //console.log("::: "+JSON.stringify(json));
              setCollectionMintList(json);   
              return json;
            
        } catch(e){console.log("ERR: "+e)}   
    }

    const fetchMintStates = async(address:string) => {
        try{
            await getCollectionStates(address);
        } catch(e){console.log("ERR: "+e)}
        
    }

    const getCollectionData = async (start:number) => {
        const wallet_collection = collectionMintList;//likeListInfo.likes.list;
        let rpclimit = 100;
        const MD_PUBKEY = METAPLEX_PROGRAM_ID;
        const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
        
        try {
            let mintsPDAs = new Array();
            //console.log("RPClim: "+rpclimit);
            //console.log("Paging "+(rpclimit*(start))+" - "+(rpclimit*(start+1)));
            
            let mintarr = wallet_collection.slice(rpclimit*(start), rpclimit*(start+1)).map((value:any, index:number) => {
                //console.log("mint: "+JSON.stringify(value.address));
                //return value.account.data.parsed.info.mint;
                return value.address;
            });
            
            for (var value of mintarr){
                if (value){
                    let mint_address = new PublicKey(value);
                    let [pda, bump] = await PublicKey.findProgramAddress([
                        Buffer.from("metadata"),
                        MD_PUBKEY.toBuffer(),
                        new PublicKey(mint_address).toBuffer(),
                    ], MD_PUBKEY)

                    if (pda){
                        //console.log("pda: "+pda.toString());
                        mintsPDAs.push(pda);
                    }
                }
            }
            //console.log("pushed pdas: "+JSON.stringify(mintsPDAs));
            const metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
            //console.log("returned: "+JSON.stringify(metadata));
            // LOOP ALL METADATA WE HAVE
            for (var metavalue of metadata){
                //console.log("Metaplex val: "+JSON.stringify(metavalue));
                if (metavalue?.data){
                    try{
                        let meta_primer = metavalue;
                        let buf = Buffer.from(metavalue.data);
                        let meta_final = decodeMetadata(buf);
                        //console.log("meta_final: "+JSON.stringify(meta_final));
                    }catch(etfm){console.log("ERR: "+etfm + " for "+ JSON.stringify(metavalue));}
                } else{
                    console.log("Something not right...");
                }
            }
            return metadata;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getCollectionMeta = async (start:number) => {
        const wallet_collection = collectionMintList;//likeListInfo.likes.list;
        
        
        let tmpcollectionmeta = await getCollectionData(start);
        setCollectionMeta(tmpcollectionmeta);
        
        let final_collection_meta: any[] = [];
        
        if (tmpcollectionmeta){
            for (var i = 0; i < tmpcollectionmeta.length; i++){
                //console.log(i+": "+JSON.stringify(collectionmeta[i])+" --- with --- "+JSON.stringify(wallet_collection[i]));
                if (tmpcollectionmeta[i]){
                    tmpcollectionmeta[i]["wallet"] = wallet_collection[i].address;
                    try{
                        
                        let meta_primer = tmpcollectionmeta[i];
                        let buf = meta_primer.data;
                        //Buffer.from(meta_primer.data, 'base64');
                        let meta_final = decodeMetadata(buf);
                        tmpcollectionmeta[i]["meta"] = meta_final;
                        tmpcollectionmeta[i]["groupBySymbol"] = 0;
                        tmpcollectionmeta[i]["floorPrice"] = 0;
                        final_collection_meta.push(tmpcollectionmeta[i]);
                        
                    }catch(e){
                        console.log("ERR:"+e)
                    }
                }
            }
            let finalmeta = final_collection_meta;//JSON.parse(JSON.stringify(final_collection_meta));
            try{
                finalmeta.sort((a:any, b:any) => a?.meta.data.name.toLowerCase().trim() > b?.meta.data.name.toLowerCase().trim() ? 1 : -1);   
            }catch(e){console.log("Sort ERR: "+e)}

            setCollectionMetaFinal(finalmeta);
        }
    }

    React.useEffect(() => { 
        if (collectionAuthority){
            console.log("with collectionAuthority: "+JSON.stringify(collectionAuthority));
            //if (ValidateAddress(collectionAuthority.address)){
                if (collectionMintList){
                    getCollectionMeta(0);
                    console.log("collectionAuthority: "+JSON.stringify(collectionAuthority))
                    fetchMintStates(collectionAuthority);
                }
            //}
        }
    }, [collectionMintList]);

    const getCollectionStates = async (address:string) => {
        
        if (!stateLoading){
            setStateLoading(true);

            const results = await getReceiptsFromAuctionHouse(collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS, null, null, null);

            const ahActivity = new Array();
            const ahListingsMints = new Array();

            for (var item of results){
                const mintitem = await getMintFromVerifiedMetadata(item.metadata.toBase58(), collectionMintList);
                console.log("item: "+JSON.stringify(item));
                console.log("mintitem: "+JSON.stringify(mintitem));
                if (mintitem){
                    ahActivity.push({buyeraddress: item.bookkeeper.toBase58(), bookkeeper: item.bookkeeper.toBase58(), amount: item.price, price: item.price, mint: mintitem?.address, metadataParsed:mintitem, isowner: false, createdAt: item.createdAt, cancelledAt: item.canceledAt, timestamp: timeAgo(item.createdAt), blockTime: item.createdAt, state: item?.receipt_type, purchaseReceipt: item?.purchaseReceipt});
                    ahListingsMints.push(mintitem.address);
                }
            }

            // sort by date
            ahActivity.sort((a:any,b:any) => (a.createdAt < b.createdAt) ? 1 : -1);

            // remove duplicate offers
            //const dupRemovedResults = ahListings;
            
            
            //console.log("offerListings: "+JSON.stringify(offerListings));
            //setAuctionHouseActivity(ahActivity);

            // remove all with purchaseReceipt
            //const ahListings = ahActivity.filter( (ele, ind) => ind === ahListings.findIndex( elem => (elem.purchaseReceipt === ele.purchaseReceipt && elem.bookkeeper=== 'bid_receipt')))
            
            setAuctionHouseListings(ahActivity);

            //activityResults.push({buyeraddress: feePayer.toBase58(), amount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: forSaleDate, blockTime: value.blockTime, state: memo_json?.state || memo_json?.status});
            

            for (var mintElement of collectionMintList){
                mintElement.listingPrice = null;
                mintElement.listingCancelled = false;
            }

            // we need to remove listing history for those that have been sold
            for (var listing of ahActivity){
                let exists = false;
                let offer_exists = false;
                for (var mintElement of collectionMintList){
                    if (mintElement.address === listing.mint){
                        exists = true;
                        if (listing.state === 'bid_receipt'){
                            
                            if ((!mintElement?.highestOffer) || (+listing.price > +mintElement?.highestOffer)){
                                if (!listing?.cancelledAt){
                                    // if there is a cancelled offer though?
                                    if (mintElement.listedTimestampCheck && mintElement.listedBookkeeperCheck){
                                        mintElement.highestOffer = 0;
                                    //    console.log("found dup bid_receipt: "+JSON.stringify(listing));
                                    } else{
                                        mintElement.highestOffer = +listing.price;
                                    }
                                }
                                // add offer count?
                            }
                            mintElement.listedTimestampCheck = listing.timestamp;
                            mintElement.listedBookkeeperCheck = listing.bookkeeper;
                        } else if (listing.state === 'listing_receipt'){
                            if (!listing?.cancelledAt){                                
                                if (!mintElement?.listingCancelled){
                                    if ((!mintElement?.listedBlockTime) || (+listing.createdAt > +mintElement?.listedBlockTime)){
                                        if (!listing?.purchaseReceipt){
                                            mintElement.listingPrice = +listing.price;
                                            mintElement.listedTimestamp = listing.timestamp;
                                            mintElement.listedBlockTime = listing.blockTime;
                                        }
                                    }
                                }
                            }
                        } else if (listing.state === 'cancel_listing_receipt'){
                            if (!listing?.cancelledAt){
                                if ((!mintElement?.listedBlockTime) || (+listing.createdAt > +mintElement?.listedBlockTime)){
                                    mintElement.listingPrice = 0;
                                    mintElement.listedTimestamp = listing.timestamp;
                                    mintElement.listedBlockTime = listing.blockTime;
                                    mintElement.listingCancelled = true;
                                }
                            }
                        }
                    }
                }
                if (!exists){
                    //console.log("not exists ahListings "+JSON.stringify(listing));
                    //if (listing.state === 1){
                    if (listing.state === 'bid_receipt'){
                        if (!listing?.cancelledAt){
                            if (!listing?.purchaseReceipt){
                                collectionMintList.push({
                                    address: listing.mint,
                                    highestOffer: listing.price,
                                    name:null,
                                    image:'',
                                })
                            }
                        }
                    } else if (listing.state === 'listing_receipt'){
                        if (!listing?.cancelledAt){
                            if (!mintElement?.listingCancelled){
                                if (!listing?.purchaseReceipt){
                                    collectionMintList.push({
                                        address: listing.mint,
                                        listingPrice: listing.price,
                                        listedTimestamp: listing.timestamp,
                                        listedBlockTime: listing.blockTime,
                                        name:null,
                                        image:'',
                                    })
                                }
                            }
                        }
                    } else if (listing.state === 'cancel_listing_receipt'){
                        if (!listing?.cancelledAt){
                            collectionMintList.push({
                                address: listing.mint,
                                listingPrice: null,
                                listedTimestamp: listing.timestamp,
                                listedBlockTime: listing.blockTime,
                                name:null,
                                image:'',
                                listingCancelled: true
                            })
                        }
                    }
                }
            }
            
            // check all that do not have an image or name and group them
            const mintsToGet = new Array();
            for (var mintListItem of collectionMintList){
                if (!mintListItem.name){
                    mintsToGet.push({address:mintListItem.address})
                }
            }
            // Now we should get the metadata for all the addresses and then load it back to the collectionMintList
            // like we are doing with the likes

            const missing_meta = await getMissingCollectionData(0, mintsToGet);
            
            for (var mintListItem of collectionMintList){
                for (var missed of missing_meta){
                    if (mintListItem.address === missed.mint){
                        //console.log("pushing: "+JSON.stringify(missed));
                        mintListItem.name = missed.name,
                        mintListItem.image = missed.image
                    }
                }
            }

            // now with missing meta populate it to collectionMintList
            //collectionMintList.sort((a:any,b:any) => (+a.listingPrice > +b.listingPrice) ? 1 : -1); 
            
            collectionMintList.sort((a:any, b:any) => (a.listingPrice != null ? a.listingPrice : Infinity) - (b.listingPrice != null ? b.listingPrice : Infinity)) 
            
            setTimeout(function() {
                setStateLoading(false);                                      
            }, 500); 
            
        }
    }

    const getMissingCollectionData = async (start:number, missing_collection:any) => {
        const MD_PUBKEY = METAPLEX_PROGRAM_ID;
        const rpclimit = 100;
        const wallet_collection = missing_collection;
        
        if (wallet_collection){
            try {
                let mintsPDAs = new Array();
                //console.log("RPClim: "+rpclimit);
                //console.log("Paging "+(rpclimit*(start))+" - "+(rpclimit*(start+1)));
                
                let mintarr = wallet_collection.slice(rpclimit*(start), rpclimit*(start+1)).map((value:any, index:number) => {
                    //console.log("mint: "+JSON.stringify(value.address));
                    //return value.account.data.parsed.info.mint;
                    //console.log("value "+JSON.stringify(value))
                    return value.address;
                });
                
                for (var value of mintarr){
                    if (value){
                        let mint_address = new PublicKey(value);
                        let [pda, bump] = await PublicKey.findProgramAddress([
                            Buffer.from("metadata"),
                            MD_PUBKEY.toBuffer(),
                            new PublicKey(mint_address).toBuffer(),
                        ], MD_PUBKEY)

                        if (pda){
                            //console.log("pda: "+pda.toString());
                            mintsPDAs.push(pda);
                        }
                    }
                }

                //console.log("pushed pdas: "+JSON.stringify(mintsPDAs));
                const metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
                //console.log("returned: "+JSON.stringify(metadata));
                // LOOP ALL METADATA WE HAVE
                const finalData = new Array();
                for (var metavalue of metadata){
                    //console.log("Metaplex val: "+JSON.stringify(metavalue));
                    if (metavalue?.data){
                        try{
                            let meta_primer = metavalue;
                            let buf = Buffer.from(metavalue.data);
                            let meta_final = decodeMetadata(buf);
                            //console.log("meta_final: "+JSON.stringify(meta_final));
                            
                            if (meta_final){
                                try {
                                    //let meta_primer = collectionitem;
                                    //let buf = Buffer.from(meta_primer.data, 'base64');
                                    //let meta_final = decodeMetadata(buf);
                                    try{
                                        const metadata = await window.fetch(meta_final.data.uri)
                                        .then(
                                            (res: any) => res.json()
                                        );
                                        
                                        const newObj = {...meta_final, ...metadata};
                                        finalData.push(
                                            newObj
                                        );
                                    }catch(ie){
                                        // not on Arweave:
                                        //console.log("ERR: "+JSON.stringify(meta_final));
                                        return null;
                                    }
                                } catch (e) { // Handle errors from invalid calls
                                    console.log(e);
                                    return null;
                                }
                            }
                            
                            
                        }catch(etfm){console.log("ERR: "+etfm + " for "+ JSON.stringify(metavalue));}
                    } else{
                        console.log("Something not right...");
                    }
                }
                //console.log("... " + JSON.stringify(finalData));
                return finalData;
            } catch (e) { // Handle errors from invalid calls
                console.log(e);
                return null;
            }
        } else {
            return null;
        }
    }

    React.useEffect(() => { 
        if ((verifiedCollectionArray)&&(!collectionAuthority)){
            if (withPubKey){
                console.log("using: "+withPubKey)
                
                //console.log("verified_collection_array: "+JSON.stringify(verified_collection_array))
                
                // check if this is a valid address using VERIFIED_COLLECTION_ARRAY
                // check both .name and .address
                for (var verified of verifiedCollectionArray){
                    
                    //console.log("verified checking: "+verified.name.replaceAll(" ", "").toLowerCase() + " vs "+withPubKey.replaceAll(" ", "").toLowerCase());
                    //if (verified.address === mintOwner){
                    if (verified.address === withPubKey){
                        setCollectionAuthority(verified);
                        // get collection mint list
                        const fml = fetchMintList(verified.address);
                        break;
                    } else if (verified.name.replaceAll(" ", "").toLowerCase() === (withPubKey.replaceAll(" ", "").toLowerCase())){ // REMOVE SPACES FROM verified.name
                        //console.log("found: "+verified.name);
                        setCollectionAuthority(verified);
                        // get collection mint list
                        console.log("f ADDRESS: "+verified.address)
                        const fml = fetchMintList(verified.address);
                        break;
                    }
                } 
    
                // IMPORTANT HANDLE INVALID COLLECTION ENTRY
            }
        }
    }, [verifiedCollectionArray]);

    const fetchProfilePicture = async () => {
        const { isAvailable, url } = await getProfilePicture(ggoconnection, publicKey);

        let img_url = url;
        if (url)
            img_url = url.replace(/width=100/g, 'width=256');
        setProfilePictureUrl(img_url);
        setHasProfilePicture(isAvailable);
    }

    const fetchSolanaDomain = async () => {
        const domain = await findDisplayName(ggoconnection, publicKey.toBase58());
        if (domain){
            if (domain[0] !== publicKey.toBase58()){
                setSolanaDomain(domain[0]);
            }
        }
    }

    React.useEffect(() => {
        if (publicKey){
            if (solanaDomain){
                let sppicon = '';
                try{
                    if (profilePictureUrl)
                        sppicon = '<i class="wallet-adapter-button-start-icon"><img style="border-radius:24px"" src="'+profilePictureUrl+'" alt="Solana Profile Icon"></i>';
                    document.getElementsByClassName("grape-wallet-button")[0].innerHTML = sppicon+'<span class="wallet-adapter-solana-domain">'+solanaDomain+'</span>';
                }catch(e){

                }
            }
        }
    }, [solanaDomain, profilePictureUrl])

    React.useEffect(() => {
        if (publicKey){
            
            fetchProfilePicture();
            fetchSolanaDomain();
        }
    }, [publicKey])


    React.useEffect(() => { 
        if ((withPubKey)&&(!verifiedCollectionArray)){
            fetchVerifiedCollection(withPubKey);
            
        }
    }, [withPubKey]);

    React.useEffect(() => { 
        if (urlParams){
            setWithPubKey(urlParams);
        } else if (pubkey){
        } else if (publicKey){
        //    setWithPubKey(publicKey.toBase58());
        }
    }, [urlParams]);

    
    if (!pubkey){ 
        // ...
    } else {
        if((loading)&&(!collectionAuthority)){
            return (
            <React.Fragment>
                <Box
                    sx={{ 
                        p: 1, 
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
                            rowSpacing={8}
                        >
                            <Grid 
                                item xs={12}
                            >
                                <Box
                                    height="100%"
                                    display="flex"
                                    justifyContent="center"
                                >
                                    <CircularProgress color="inherit" />
                                </Box>
                            </Grid>
                        </Grid>
                </Box>
            </React.Fragment>
            )
        }
    }

    return (
        <React.Fragment>
            {collectionAuthority &&
            <Box
                sx={{
                    mb:4,
                    mt:0,
                    ml:0,
                    mr:0,
                    width:'100%',
                }}
                >
                    <Box
                        className='grape-store-splash'
                        sx={{
                            mt:-16
                        }}
                    >
                        <img
                            src={GRAPE_COLLECTIONS_DATA+collectionAuthority.splash}
                            srcSet={GRAPE_COLLECTIONS_DATA+collectionAuthority.splash}
                            alt={collectionAuthority.name}
                            loading="lazy"
                            height="auto"
                            style={{
                                width:'100%',
                                borderBottomRightRadius:'24px',
                                borderBottomLeftRadius:'24px',
                                boxShadow:'0px 0px 5px 0px #000000',
                            }}
                        />
                    </Box>
                    

                    <Box
                        className='grape-store-info'
                        sx={{
                            m:10,
                            mb:4,
                            mt:-14,
                            p:1,
                            textAlign:'center',
                            borderRadius:'24px',
                            background: 'rgba(0, 0, 0, 0.6)',
                        }}
                    >

                        <img
                            src={GRAPE_COLLECTIONS_DATA+collectionAuthority.logo}
                            srcSet={GRAPE_COLLECTIONS_DATA+collectionAuthority.logo}
                            alt={collectionAuthority.name}
                            //onClick={ () => openImageViewer(0) }
                            loading="lazy"
                            height="auto"
                            style={{
                                width:'100px',
                            }}
                        />

                        <Box
                            sx={{m:0}}
                        >
                            <Typography variant="h4">
                                {collectionAuthority.name}
                            </Typography>

                            <Typography variant="h6">
                                {collectionAuthority.author}
                            </Typography>

                            <Typography variant="caption">
                                {collectionAuthority.description}
                            </Typography>

                            <Box sx={{ justifyContent: 'flex-end' }}>
                                {collectionAuthority.links?.url &&
                                    <Button 
                                        target='_blank' href={collectionAuthority.links.url}
                                        sx={{
                                            verticalAlign: 'middle',
                                            display: 'inline-flex',
                                            borderRadius:'17px'}}
                                    >
                                        <LanguageIcon sx={{m:0.75,color:'white',borderRadius:'17px'}} />
                                    </Button>
                                }
                                {collectionAuthority.links?.discord &&
                                    <Button 
                                        target='_blank' href={`https://${collectionAuthority.links.discord}`}
                                        sx={{
                                        verticalAlign: 'middle',
                                        display: 'inline-flex',
                                        borderRadius:'17px'
                                    }}>
                                        <DiscordIcon sx={{mt:1,fontSize:27.5,color:'white'}} />
                                    </Button>
                                }
                                {collectionAuthority.links?.twitter &&
                                    <Button 
                                        target='_blank' href={`https://twitter.com/${collectionAuthority.links.twitter}`}
                                        sx={{
                                            verticalAlign: 'middle',
                                            display: 'inline-flex',
                                            borderRadius:'17px'
                                        }}
                                    >
                                        <TwitterIcon sx={{m:0.75,color:'white'}} />
                                    </Button>
                                }
                                
                            </Box>
                        </Box>

                        <Box
                            sx={{m:2}}
                        >
                            <ListForCollectionView 
                                logo={GRAPE_COLLECTIONS_DATA+collectionAuthority.logo} 
                                entangleTo={collectionAuthority.entangleTo} 
                                entangleFrom={collectionAuthority.entangleFrom} 
                                entangled={collectionAuthority.entangled} 
                                enforceEntangle={collectionAuthority.entangleEnforce}
                                entangleUrl={collectionAuthority.entangleUrl}
                                collectionAuthority={collectionAuthority}
                                collectionMintList={collectionMintList} />
                        </Box>
                        
                        <Grid container spacing={0} sx={{mt:-2}}>
                            <Grid item xs={12} sm={12} md={4} key={1}>
                                <Box
                                    className='grape-store-stat-item'
                                    sx={{borderRadius:'24px',m:2,p:1}}
                                >
                                    <Typography variant="body2" sx={{color:'yellow'}}>
                                        ITEMS
                                    </Typography>
                                    <Typography variant="subtitle2">
                                        {collectionMintList?.length || `${(collectionAuthority.size/1000).toFixed(1)}k`}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={4} key={1}>
                                <Box
                                    className='grape-store-stat-item'
                                    sx={{borderRadius:'24px',m:2,p:1}}
                                >
                                    <Typography variant="body2" sx={{color:'yellow'}}>
                                        OWNERS
                                    </Typography>
                                    <Typography variant="subtitle2">
                                        {(collectionAuthority.owners/1000).toFixed(1)}k
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={4} key={1}>
                                {!stateLoading ?
                                    <ActivityView collectionAuthority={collectionAuthority} collectionMintList={collectionMintList} activity={auctionHouseListings} mode={0} />
                                :
                                    <CircularProgress />
                                }
                            </Grid>
                        </Grid>
                    </Box>
            </Box>
            }
                <Box
                    sx={{
                        
                    }}
                >
                    <Box> 

                        {collectionMintList &&  
                            <GalleryView mode={1} collectionMintList={collectionMintList} collectionAuthority={collectionAuthority}/>
                        }
                    </Box>
                </Box>
        </React.Fragment>
    );
}
