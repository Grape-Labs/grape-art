import React, { useEffect, useState, useCallback, memo, Suspense } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from 'react-helmet';
import { decodeMetadata } from '../utils/grapeTools/utils';
// @ts-ignore

import { gql } from '@apollo/client'
import gql_client from '../gql_client'

import { findDisplayName } from '../utils/name-service';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { TokenAmount, lt } from '../utils/grapeTools/safe-math';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAccount, getMint } from "@solana/spl-token-v2";

import { useNavigate } from 'react-router';
import { styled } from '@mui/material/styles';
import { Button, LinearProgress } from '@mui/material';

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
import TelegramIcon from '@mui/icons-material/Telegram';
import InstagramIcon from '@mui/icons-material/Instagram';


import ForumIcon from '@mui/icons-material/Forum';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';

import HowToRegIcon from '@mui/icons-material/HowToReg';
import RateReviewIcon from '@mui/icons-material/RateReview';
import DiscordIcon from '../components/static/DiscordIcon';
import RefreshIcon from '@mui/icons-material/Refresh';
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
    GRAPE_COLLECTION, 
    FEATURED_DAO_ARRAY, 
    GRAPE_COLLECTIONS_DATA,
    PROXY,
    CLOUDFLARE_IPFS_CDN
} from '../utils/grapeTools/constants';

import { 
    getReceiptsFromAuctionHouse,
    getMintFromVerifiedMetadata,
    getTokenPrice
} from '../utils/grapeTools/helpers';

import { getProfilePicture } from '@solflare-wallet/pfp';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';

import GalleryView from '../Profile/GalleryView';
import ListForCollectionView from './ListForCollection';
import ActivityView from './Activity';
import { SocialMediaView } from './SocialMedia';
import { GovernanceView } from './Governance';
import { MembersView } from './Members';
import { HoldersView } from './Holders';
import { TokenView } from './Token';

import { MakeLinkableAddress, ValidateAddress, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { ConstructionOutlined, SettingsRemoteOutlined } from "@mui/icons-material";

import { useTranslation } from 'react-i18next';
import moment from "moment";

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
enum NavPanel {
    Token,
    Marketplace,
    Holders,
    Governance,
    Members,
    Topics,
    Chat,
    Work,
    SocialFeed
}

function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
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
    const effectCalled = React.useRef(false);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const ticonnection = new Connection(THEINDEX_RPC_ENDPOINT);
    //const [provider, setProvider] = React.useState(getParam('provider'));
    const [gallery, setGallery] = React.useState(null);
    const [collectionMintList, setCollectionMintList] = React.useState(null);
    const [fetchedCollectionMintList, setFetchedCollectionMintList] = React.useState(null);
    const [collectionChildren, setCollectionChildren] = React.useState(null);
    const [collectionParentAuthority, setCollectionParentAuthority] = React.useState(null);
    const [collectionAuthority, setCollectionAuthority] = React.useState(null);
    const [verifiedCollectionArray, setVerifiedCollectionArray] = React.useState(null);
    const [auctionHouseListings, setAuctionHouseListings] = React.useState(null);
    const [auctionHouseActivity, setAuctionHouseActivity] = React.useState(null);
    const [wallet_collection_meta, setCollectionMeta] = React.useState(null);
    const [final_collection, setCollectionMetaFinal] = React.useState(null);
    //const isConnected = session && session.isConnected;
    const [loading, setLoading] = React.useState(false);
    const [loadingPosition, setLoadingPosition] = React.useState(null);
    const [tokenPrice, setTokenPrice] = React.useState(null);
    const [floorPrice, setFloorPrice] = React.useState(0);
    const [crossListings, setCrossListings] = React.useState(0);
    const [totalListings, setTotalListings] = React.useState(0); 
    const [grapeFloorPrice, setGrapeFloorPrice] = React.useState(0);
    const [grapeTotalListings, setGrapeTotalListings] = React.useState(0); 
    const [meStats, setMEStats] = React.useState(null);
    const [ahStats, setAhStats] = React.useState(null);
    const [refreshGallery, setRefreshGallery] = React.useState(0);
    const [stateLoading, setStateLoading] = React.useState(false);
    const [escrowStateLoading, setEscrowStateLoading] = React.useState(false);
    const [rdloading, setRDLoading] = React.useState(false);
    const [loadCount, setLoadCount] = React.useState(0);
    //const [success, setSuccess] = React.useState(false);
    const [withPubKey, setWithPubKey] = React.useState(null);
    const [pubkey, setPubkey] = React.useState(null);
    const [newinputpkvalue, setNewInputPKValue] = React.useState(null);
    const [solWebUrl, setSolWebUrl] = React.useState(null);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [refresh, setRefresh] = React.useState(false);
    const [tabValue, setTabValue] = React.useState(0 || NavPanel.Marketplace);
    const [loadingVerifiedCollection, setLoadingVerifiedCollection] = React.useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [hasProfilePicture, setHasProfilePicture] = React.useState(false);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [marketplaceStates, setMarketplaceStates] = React.useState(null);

    //const { handlekey } = useParams() as { 
    //    handlekey: string;
    //}
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const urlParams = searchParams.get("pkey") || searchParams.get("address") || handlekey;
    
    const navigate = useNavigate();
    //const location = useLocation();

    const { t, i18n } = useTranslation();
    

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const fetchVerifiedCollection = async(address:string) => {
        setLoadingVerifiedCollection(true);
        setLoadingPosition("Verified Collection");
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
              setLoadingVerifiedCollection(false);
              return json;
            
        } catch(e){
            console.log("ERR: "+e)
            setLoadingVerifiedCollection(false);
        }
    }

    const fetchIndexedMintList = async(address:string, jsonToImage: boolean, updateAuthority:string) => {

        const body = {
            method: "getNFTsByCollection",
            jsonrpc: "2.0",
            params: [
              address
            ],
            id: "1",
        };
        try{
            setLoadingPosition("Dynamic Mint List");
            const staticMintList = await fetchMintList(updateAuthority)

            const response = await window.fetch(THEINDEX_RPC_ENDPOINT, {
                method: "POST",
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json",
                            "Cache-Control": "s-maxage=8640" }
            })
            const json = await response.json();
            const resultValues = json.result;
            // transpose values to our format
            
            console.log("jsonToImage: "+jsonToImage);

            if (staticMintList.length < resultValues.length){
                console.log("staticMintList: "+staticMintList.length);
                console.log("resultValues: "+resultValues.length);

                const extraList = new Array();
                for (var item of resultValues){

                    var found = false;
                    for (var staticItem of staticMintList){
                        if (staticItem.metadata.mint.toString() === item.metadata.mint.toString())
                            found = true;
                    }

                    if (!found){
                        //console.log("item: "+JSON.stringify(item))

                        // fetch from the JSON

                        let image = null;
                        if (jsonToImage)
                            image = item.metadata.uri.replaceAll(".json",".png");
                        
                        try {
                            /*
                            if (!jsonToImage && item.metadata.uri){ // this will take too long to 1+ collections
                                try{
                                    const metadata = await window.fetch(''+item.metadata.uri)
                                    .then(
                                        (res: any) => res.json()
                                    );
                                    image = metadata.image;
                                    //return metadata;
                                }catch(ie){
                                }
                            } else{
                                
                            }*/
                        } catch (e) { // Handle errors from invalid calls
                        }

                        //console.log("item.metadata "+JSON.stringify(item.metadata));

                        extraList.push({
                            address:item.metadata.mint.toString(),
                            name:item.metadata.name,
                            collection:item.metadata.symbol,
                            image:image,
                            metadata:item.metadata.pubkey.toString(),
                        });
                    }
                }
                
                //console.log("finalList: "+JSON.stringify(finalList))
                if (extraList && extraList.length > 0)
                    setFetchedCollectionMintList([...staticMintList, extraList]); 
                //return finalList;
            }

            
        } catch(e){
            console.log("ERROR fetching dynamic mint list: "+updateAuthority);
            return fetchMintList(updateAuthority);
        }
    }

    const fetchMintList = async(address:string) => {
        try{
            setLoadingPosition("Indexed Mints");
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
              setFetchedCollectionMintList(json);
              //setCollectionMintList(json);   
              return json;
            
        } catch(e){console.log("ERR: "+e)}   
    }


    const fetchMintStates = async(address:string) => {
        try{
            setLoadingPosition("Collection States");
            if (!stateLoading)
                await getCollectionStates(address);
        } catch(e){console.log("ERR: "+e)}
        
    }

    const fetchMintEscrowStates = async(address:string) => {
        try{
            setLoadingPosition("Escrow States");
            await getEscrowStates(address);
        } catch(e){console.log("ERR: "+e)}
        
    }

    const getCollectionData = async (start:number) => {
        const wallet_collection = fetchedCollectionMintList;//likeListInfo.likes.list;
        let rpclimit = 100;
        const MD_PUBKEY = METAPLEX_PROGRAM_ID;
        
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
            
            let metadata = null;
            setLoadingPosition("Collection Metadata");
            try{
                metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
            } catch(err){
                metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
            }
            
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
        const wallet_collection = fetchedCollectionMintList;
        
        
        let tmpcollectionmeta = await getCollectionData(start);
        setCollectionMeta(tmpcollectionmeta);
        
        let final_collection_meta: any[] = [];
        
        if (tmpcollectionmeta){

            for (var i = 0; i < tmpcollectionmeta.length; i++){
                //console.log(i+": "+JSON.stringify(tmpcollectionmeta[i])+" --- with --- "+JSON.stringify(wallet_collection[i]));
                if (tmpcollectionmeta[i]){
                    tmpcollectionmeta[i]["wallet"] = wallet_collection[i].address;
                    try{
                        
                        let meta_primer = tmpcollectionmeta[i];
                        let buf = meta_primer.data;
                        //Buffer.from(meta_primer.data, 'base64');
                        let meta_final = decodeMetadata(buf);
                        tmpcollectionmeta[i]["meta"] = meta_final;
                        tmpcollectionmeta[i]["groupBySymbol"] = 0;
                        tmpcollectionmeta[i]["floorPrice"] = floorPrice;
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

    const refreshMintStates = async () => {
        fetchMintStates(collectionAuthority);
    }

    React.useEffect(() => { 
        if (collectionAuthority){
            //console.log("with collectionAuthority: "+JSON.stringify(collectionAuthority));
            //if (ValidateAddress(collectionAuthority.address)){
                if (fetchedCollectionMintList){
                    getCollectionMeta(0);
                    //console.log("collectionAuthority: "+JSON.stringify(collectionAuthority))
                    fetchMintStates(collectionAuthority);
                }
            //}
        }
    }, [fetchedCollectionMintList, refresh]);

    React.useEffect(() => { 
        if (collectionAuthority){
            if (!stateLoading)
                fetchMintEscrowStates(collectionAuthority);
        }
    }, [stateLoading]);


    const getGqlCollectionFeaturedListings = async(auctionHouses: string, sellerExclusions: string, limitPerSeller: string, limit: string, offset: string) => {
        const GET_FEATURED = gql`
            query featuredListings($auctionHouses: [PublicKey!], $sellerExclusions: [PublicKey!], $limitPerSeller: Int, $limit: Int!, $offset: Int) {
                featuredListings(auctionHouses: $auctionHouses, sellerExclusions: $sellerExclusions, limitPerSeller: $limitPerSeller, limit: $limit, offset: $offset) {
                    id
                    tradeState
                    seller
                    metadata
                    purchaseId
                    price
                    tokenSize
                    tradeStateBump
                    createdAt
                    canceledAt
                    nft {
                        name
                        image
                        address
                    }
                }
            }
        `;

        let using = auctionHouses;
            let usequery = GET_FEATURED;
            
            return await gql_client
                .query({
                query: usequery,
                variables: {
                    auctionHouses: [using],
                    sellerExclusions: null,
                    limitPerSeller: 987,
                    limit: 123,
                    offset: 987,
                }
                })
                .then(res => {
                    console.log("FEAT: "+JSON.stringify(res))
                    //setMarketplaceStates(res.data.featuredListings)
                    return res.data.featuredListings;
                }).catch(err => console.log("ERR: "+err))
    }

    const getGqlCollectionStates = async(auctionHouses: string) => {
            const GET_ACTIVITIES = gql`
                query GetActivities($auctionHouses: [PublicKey!]!) {
                    activities(auctionHouses: $auctionHouses) {
                    id
                    metadata
                    auctionHouse {
                        address
                        treasuryMint
                    }
                    price
                    createdAt
                    wallets {
                        address
                        profile {
                        handle
                        profileImageUrlLowres
                        }
                    }
                    activityType
                        nft {
                            name
                            image
                            address
                        }
                    }
                }
                `

            let using = auctionHouses;
            let usequery = GET_ACTIVITIES;
            
            return await gql_client
                .query({
                query: usequery,
                variables: {
                    auctionHouses: [using]
                }
                })
                .then(res => {
                    //console.log("RES: "+JSON.stringify(res))
                    setMarketplaceStates(res.data.activities)
                    return res.data.activities;
                }).catch(err => console.log("ERR: "+err))
    }

    const getCollectionStates = async (address:string) => {
        
        console.log("stateLoading: "+stateLoading);
        if (!stateLoading){
            setStateLoading(true);
            
            //const Featured = await getGqlCollectionFeaturedListings(collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS, null, null, null, null);
            
            /*
            setLoadingPosition("GQL Listing states");
            const gqlResults = await getGqlCollectionStates(collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS)
            //console.log("gqlResults "+JSON.stringify(gqlResults));
            
            // map gql to listing receipt:
            const mappedReceipts = new Array()
            
            for (var item of gqlResults){
                var receipt_type = item.activityType;
                var purchase_receipt = null;
                if (item.activityType === 'listing'){
                    receipt_type = 'listing_receipt';
                    console.log("listing_receipt: "+JSON.stringify(item));
                }else if (item.activityType === 'purchase'){
                    receipt_type = 'purchase_receipt';
                    purchase_receipt = new PublicKey(1);
                    console.log("purchase: "+JSON.stringify(item));
                }else{
                    console.log("other? - listing: "+JSON.stringify(item));
                }

                var createdAt = moment(item.createdAt).valueOf();
                var canceledAt = null;
                if (item.canceledAt) 
                    canceledAt = moment(item.canceledAt).valueOf()
                
                mappedReceipts.push({
                    tradeState: '',
                    bookkeeper: new PublicKey(item.wallets[0].address),
                    auctionHouse: new PublicKey(item.auctionHouse.address),
                    seller: new PublicKey(item.wallets[0].address),
                    metadata: new PublicKey(item.metadata),
                    purchaseReceipt: purchase_receipt,
                    price: item.price/(1000000000),
                    tokenSize: 1,
                    bump: 255,
                    tradeStateBump: 255,
                    createdAt: createdAt,
                    canceledAt: canceledAt,
                    receipt_type: receipt_type
                });
            }
            const results = mappedReceipts;
            //console.log("mappedReceipts "+JSON.stringify(mappedReceipts));
            
            */

            setLoadingPosition("Auction House states");
            const results = await getReceiptsFromAuctionHouse(collectionAuthority.auctionHouse || AUCTION_HOUSE_ADDRESS, null, null, null, null, false, null);

            //console.log("results "+JSON.stringify(results));
            // if we have a secondary auction house?
            if (collectionAuthority?.otherAuctionHouses){
                //for (var x of collectionAuthority.otherAuctionHouses){
                //    console.log("listings: "+JSON.stringify(results));
                    //const results = await getReceiptsFromAuctionHouse(x, null, null, null, null, false, null);
                //    console.log("other: "+x);
                //}
            }


            const ahActivity = new Array();
            const ahListingsMints = new Array();
            let totalSales = 0;

            for (var item of results){
                setLoadingPosition("Mint verified metadata");
                const mintitem = await getMintFromVerifiedMetadata(item.metadata.toBase58(), fetchedCollectionMintList);
                //console.log("item: "+JSON.stringify(item));
                //console.log("mintitem: "+JSON.stringify(mintitem));
                if (mintitem){
                    let purchaseReceipt = item?.purchaseReceipt;
                    if (purchaseReceipt){ // do this in order to filter out sold items but show the sale
                        if (purchaseReceipt.toBase58().length <= 0)
                            purchaseReceipt = null; 
                        //console.log("found: "+purchaseReceipt.toBase58().length+": "+purchaseReceipt.toBase58());
                    }
                    if (!purchaseReceipt){ // push only null receipts
                        //console.log("push "+JSON.stringify(item))
                        ahActivity.push({
                            buyeraddress: item.bookkeeper.toBase58(), 
                            bookkeeper: item.bookkeeper.toBase58(), 
                            amount: item.price, 
                            price: item.price, 
                            mint: mintitem?.address, 
                            metadataParsed:mintitem, 
                            isowner: false, 
                            createdAt: item.createdAt, 
                            cancelledAt: item.canceledAt, 
                            timestamp: timeAgo(item.createdAt), 
                            blockTime: item.createdAt, 
                            state: item?.receipt_type, 
                            purchaseReceipt: purchaseReceipt,
                            marketplaceListing:true});
                        ahListingsMints.push(mintitem.address);

                        if (item?.receipt_type === "purchase_receipt"){
                            //console.log("pushing: "+item.price);
                            totalSales += +item.price;
                        }
                    }
                }
            }

            setAhStats(totalSales);

            // sort by date
            ahActivity.sort((a:any,b:any) => (a.createdAt < b.createdAt) ? 1 : -1);
            
            setAuctionHouseListings(ahActivity);
            
            const tempCollectionMintList = fetchedCollectionMintList;
            for (var mintElement of tempCollectionMintList){
                mintElement.listingPrice = null;
                mintElement.listingCancelled = false;
                mintElement.highestOffer = 0;
            }

            // we need to remove listing history for those that have been sold
            let thisFloorPrice = null;
            let thisTotalListings = 0;
            let crossTotalListings = 0;

            for (var listing of ahActivity){
                let exists = false;
                let offer_exists = false;
                for (var mintElement of tempCollectionMintList){
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
                                    if ((!mintElement?.listedBlockTime) || (+listing.createdAt >= +mintElement?.listedBlockTime)){
                                        //console.log("listing_receipt 2... "+mintElement?.listedBlockTime+" @"+listing.price);
                                        if (!listing?.purchaseReceipt){
                                            mintElement.listingPrice = +listing.price;
                                            mintElement.listedTimestamp = listing.timestamp;
                                            mintElement.listedBlockTime = listing.blockTime;
                                            mintElement.marketplaceListing = true;
                                            thisTotalListings++;
                                            if (!thisFloorPrice){
                                                thisFloorPrice = +listing.price;
                                            }else if (thisFloorPrice > +listing.price){
                                                thisFloorPrice = +listing.price;
                                            }

                                        }
                                    }
                                }
                            }
                        } else if (listing.state === 'cancel_listing_receipt'){
                            if (!listing?.cancelledAt){
                                if ((!mintElement?.listedBlockTime) || (+listing.createdAt >= +mintElement?.listedBlockTime)){
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
                                tempCollectionMintList.push({
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
                                    tempCollectionMintList.push({
                                        address: listing.mint,
                                        listingPrice: listing.price,
                                        listedTimestamp: listing.timestamp,
                                        listedBlockTime: listing.blockTime,
                                        name:null,
                                        image:'',
                                        marketplaceListing: true
                                    })
                                    thisTotalListings++;
                                    if (!thisFloorPrice)
                                        thisFloorPrice = +listing.price;
                                    else if (thisFloorPrice > +listing.price)
                                        thisFloorPrice = +listing.price;
                                }
                            }
                        }
                    } else if (listing.state === 'cancel_listing_receipt'){
                        if (!listing?.cancelledAt){
                            tempCollectionMintList.push({
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

            setGrapeTotalListings(thisTotalListings);
            setGrapeFloorPrice(thisFloorPrice);
            
            console.log("Cross Listings: "+crossTotalListings);
            setTotalListings(thisTotalListings);
            setFloorPrice(thisFloorPrice);

            //console.log("items: "+tempCollectionMintList.length)

            //console.log("FLOOR: "+thisFloorPrice);

            // check all that do not have an image or name and group them
            const mintsToGet = new Array();
            for (const mintListItem of tempCollectionMintList){
                if (!mintListItem.name){
                    mintsToGet.push({address:mintListItem.address})
                }
            }
            // Now we should get the metadata for all the addresses and then load it back to the collectionMintList
            // like we are doing with the likes

            const missing_meta = await getMissingCollectionData(0, mintsToGet);
            
            for (const mintListItem of tempCollectionMintList){
                for (const missed of missing_meta){
                    if (mintListItem.address === missed.mint){
                        //console.log("pushing: "+JSON.stringify(missed));
                        mintListItem.name = missed.name,
                        mintListItem.image = missed.image
                    }
                }
            }

            // now with missing meta populate it to collectionMintList
            //collectionMintList.sort((a:any,b:any) => (+a.listingPrice > +b.listingPrice) ? 1 : -1); // this will sort descending
            
            //const sortedCollectionMintList = tempCollectionMintList.sort((a:any, b:any) => (a.listingPrice != null ? a.listingPrice : Infinity) - (b.listingPrice != null ? b.listingPrice : Infinity)) 
            
            //setTimeout(function() {
                setCollectionMintList(tempCollectionMintList);
                setStateLoading(false);    
                
            //}, 500);
            return tempCollectionMintList; 
            
        }
    }

    const getEscrowStates = async (address:string) => {
        
        if (!escrowStateLoading){
            setEscrowStateLoading(true);
            
            let tempCollectionMintList = collectionMintList;
            let thisTotalListings = totalListings;
            let thisFloorPrice = floorPrice; 
            let crossTotalListings = 0;

            try{
                if (collectionAuthority.me_symbol){
                    
                    const jsonStats = await fetchMEStatsWithTimeout(collectionAuthority.me_symbol);

                    if (jsonStats){
                        setMEStats(jsonStats);
                    }
                    
                    let json1 = [];
                    let json2 = [];
                    let json3 = [];
                    let json4 = [];
                    let json5 = [];
                    let json6 = [];
                    try{
                        json1 = await fetchMEWithTimeout(collectionAuthority.me_symbol,0);
                    } catch(erf){ console.log("ERR: "+erf);}
                    try{
                        json2 = await fetchMEWithTimeout(collectionAuthority.me_symbol,20);
                    } catch(erf){ console.log("ERR: "+erf);}
                    try{
                        json3 = await fetchMEWithTimeout(collectionAuthority.me_symbol,40);
                    } catch(erf){ console.log("ERR: "+erf);}
                    try{
                        json4 = await fetchMEWithTimeout(collectionAuthority.me_symbol,60);
                    } catch(erf){ console.log("ERR: "+erf);}
                    try{
                        json5 = await fetchMEWithTimeout(collectionAuthority.me_symbol,80);
                    } catch(erf){ console.log("ERR: "+erf);}
                    try{
                        json6 = await fetchMEWithTimeout(collectionAuthority.me_symbol,100);
                    } catch(erf){ console.log("ERR: "+erf);}
                    
                    const json = [...json1,...json2,...json3,...json4,...json5,...json6];
                    
                    try{
                        let found = false;
                        for (var item of json){
                            for (var mintListItem of tempCollectionMintList){
                                if (mintListItem.address === item.tokenMint){
                                    if (mintListItem.listingPrice === null){
                                        thisTotalListings++;
                                    } else{
                                        crossTotalListings++;
                                    }
                                    // no need to check date as this is an escrow check
                                    mintListItem.listingPrice = item.price;
                                    mintListItem.marketplaceListing = false;
                                }
                            }
                            if ((thisFloorPrice > +item.price)||(!thisFloorPrice))
                                thisFloorPrice = +item.price;
                        }
                    }catch(e){console.log("ERR: "+e);}
                }
            }catch(err){console.log("ERR: "+err)}
            
            setCollectionMintList(tempCollectionMintList);
            console.log("thisTotalListings: "+thisTotalListings + " crossTotalListings: "+crossTotalListings + " totalListings: "+totalListings)
            setTotalListings(thisTotalListings+crossTotalListings);
            setFloorPrice(thisFloorPrice);
            setEscrowStateLoading(false);
            setRefreshGallery(1);
        }
    }


    const Timeout = (time:number) => {
        let controller = new AbortController();
        setTimeout(() => controller.abort(), time * 1000);
        return controller;
    };

    const fetchMEWithTimeout = async (symbol:string,start:number) => {
        const apiUrl = PROXY+"https://api-mainnet.magiceden.dev/v2/collections/"+symbol+"/listings?offset="+start+"&limit=20";
        const resp = await window.fetch(apiUrl, {
            method: 'GET',
            redirect: 'follow',
            signal: Timeout(5).signal,
        })
        const json = await resp.json(); 
        return json
    }
    const fetchMEStatsWithTimeout = async (symbol:string) => {
        const apiUrl = PROXY+"https://api-mainnet.magiceden.dev/v2/collections/"+symbol+"/stats";
        const resp = await window.fetch(apiUrl, {
            method: 'GET',
            redirect: 'follow',
            signal: Timeout(5).signal,
        })
        const json = await resp.json(); 
        return json
    }

    const fetchTokenPrice = async (fromToken:string,toToken:string) => {
        const tpResponse = await getTokenPrice(fromToken, toToken);
        if (tpResponse?.data?.price){
            setTokenPrice(
                tpResponse.data.price
            );
        }
    }

    const getMissingCollectionData = async (start:number, missing_collection:any) => {
        const MD_PUBKEY = METAPLEX_PROGRAM_ID;
        const rpclimit = 100;
        const wallet_collection = missing_collection;
        
        console.log("Fetching missing collection data...")

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
                let metadata = null;
                try{
                    metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
                } catch(err){
                    metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
                }
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

                                        let file_metadata = meta_final.data.uri;
                                        let file_metadata_url = new URL(file_metadata);

                                        const IPFS = 'https://ipfs.io';
                                        const IPFS_2 = "https://nftstorage.link/ipfs";
                                        if (file_metadata.startsWith(IPFS) || file_metadata.startsWith(IPFS_2)){
                                            file_metadata = CLOUDFLARE_IPFS_CDN+file_metadata_url.pathname;
                                        }

                                        const metadata = await window.fetch(PROXY+file_metadata)
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
        if ((verifiedCollectionArray)){ //&&(!collectionAuthority)){ // using a router makes checking collectionAuthority pointless for seach
            if (withPubKey){
                fetchTokenPrice('SOL','USDC');
                
                console.log("using: "+withPubKey)
                //console.log("verified_collection_array: "+JSON.stringify(verified_collection_array))
                
                // check if this is a valid address using VERIFIED_COLLECTION_ARRAY
                // check both .name and .address
                
                for (var verified of verifiedCollectionArray){
                    //console.log("verified checking: "+verified.name.replaceAll(" ", "").toLowerCase() + " vs "+withPubKey.replaceAll(" ", "").toLowerCase());
                    //if (verified.address === mintOwner){
                    if (verified.address === withPubKey){
                        //setCollectionAuthority(verified);
                        // get collection mint list

                        // TODO: to speed things up take an incremental approach first fetch from indexed mint list and then refetch list dynamically
                        if (verified?.tokenType === "NFT"){
                            if ((verified.collection) && (!verified.staticMintList))
                                var oml = fetchIndexedMintList(verified.collection, verified?.jsonToImage, verified.updateAuthority);
                            else 
                                var fml = fetchMintList(verified.address);
                        }
                        break;
                    } else if (verified.name.replaceAll(" ", "").toLowerCase() === (withPubKey.replaceAll(" ", "").toLowerCase())){ // REMOVE SPACES FROM verified.name
                        //console.log("found: "+verified.name);
                        setCollectionAuthority(verified);
                        // get collection mint list
                        console.log("f ADDRESS: "+verified.address)

                        // TODO: to speed things up take an incremental approach first fetch from indexed mint list and then refetch list dynamically
                        if (verified?.tokenType === "NFT"){
                            if ((verified.collection) && (!verified.staticMintList))
                                var oml = fetchIndexedMintList(verified.collection, verified?.jsonToImage, verified.updateAuthority);
                            else 
                                var fml = fetchMintList(verified.address);
                        }
                        break;
                    }
                    
                }
                
                if (verified?.tokenType === "NFT"){
                    if ((verified?.collection) && (verified?.parentCollection)){
                        for (var item of verifiedCollectionArray){
                            if (item.collection === verified?.parentCollection){
                                setCollectionParentAuthority(item);
                            }
                        }
                    }

                    // check if any other collection
                    const children = new Array();
                    for (var item of verifiedCollectionArray){
                        if (verified?.collection != null && verified?.collection.length > 0){
                            if (item.parentCollection === verified?.collection){
                                children.push(item);
                            }
                        }
                    }
                    
                    if (children.length > 0){
                        setCollectionChildren(children);
                    }
                }

                if(verified?.tokenType === "SPL"){
                    setTabValue(NavPanel.Token);
                    // fetch data for SPL token
                    //var tspl = fetchTokenData(verified.address);
                }
            }
        }
    }, [verifiedCollectionArray, withPubKey]);

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
                        sppicon = '<i class="wallet-adapter-button-start-icon"><img class="css-9uy14h" style="border-radius:24px;margin-right:2px!important;margin-top:2px!important;" src="'+profilePictureUrl+'" alt="Solana Profile Icon"></i>';
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
            if (!loadingVerifiedCollection)
                fetchVerifiedCollection(withPubKey);
        }
    }, [withPubKey]);

    React.useEffect(() => { 
        if (urlParams){
            setWithPubKey(urlParams);
        } else if (pubkey){
        } else if (publicKey){
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

                <>
                    <Helmet>
                        <title>{`${collectionAuthority.name} | ${t('Grape Social. Stateless. Marketplace.')}`}</title>
                        <link href={GRAPE_COLLECTIONS_DATA+collectionAuthority.logo} rel="apple-touch-icon" sizes="180x180"></link>
                        <meta name="description" content={collectionAuthority.description} />
                        <meta property="og:title" content={`${collectionAuthority.name} Community on Grape`} />
                        <meta property="og:type" content="website" />
                        <meta property="og:url" content={window.location.href} />
                        <meta property="og:image" content={GRAPE_COLLECTIONS_DATA+collectionAuthority.logo} />
                        <meta property="og:description" content={collectionAuthority.name} />
                        <meta name="theme-color" content="#000000" />

                        <meta name="twitter:card" content="summary" />
                        {collectionAuthority.links?.twitter &&
                            <meta name="twitter:site" content={`${collectionAuthority.links.twitter}`} />
                        }
                        <meta name="twitter:title" content={collectionAuthority.name} />
                        <meta name="twitter:description" content={collectionAuthority.description} />
                        <meta name="twitter:image" content={GRAPE_COLLECTIONS_DATA+collectionAuthority.logo} />

                        {collectionAuthority.theme &&
                            <style>{'html, body { background: '+collectionAuthority.theme+' fixed!important;height: 100%; }'}</style>
                        }

                        {collectionAuthority.theme && collectionAuthority.themeImage &&
                            <style>{'html, body { background: '+collectionAuthority.theme+' fixed!important;height: 100%; background-image:'+collectionAuthority.themeImage+'!important; background-size: 10px 10px!important; }'}</style>
                        
                        }

                    </Helmet>
                

                    <Box
                        sx={{
                            mb:4,
                            mt:0,
                            ml:0,
                            mr:0,
                            width:'100%',
                        }}
                        >
                            <Hidden smDown>
                                <Box
                                    className='grape-store-splash'
                                    sx={{
                                        mt:collectionAuthority?.splashOffset || -16,
                                    }}
                                >
                                    {collectionAuthority.videoUrl ?
                                    <Box>
                                        <video 
                                            loop={true} 
                                            muted={true}
                                            autoPlay={true}
                                            style={{
                                                width:"100%",
                                                borderBottomRightRadius:'24px',
                                                borderBottomLeftRadius:'24px',
                                                boxShadow:'0px 0px 5px 0px #000000',
                                            }}>
                                            <source 
                                                src={GRAPE_COLLECTIONS_DATA+collectionAuthority.videoUrl}
                                                type="video/mp4"/>
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
                                        </video>
                                    </Box>
                                    :
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
                                    }
                                </Box>
                            </Hidden>
                            <Hidden smUp>
                                <Box
                                    className='grape-store-splash'
                                    sx={{
                                        mt:-4,
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
                            </Hidden>
                            
                            <Box
                                className='grape-store-info'
                                sx={{
                                    m:4,
                                    mb:4,
                                    mt:-0.75,
                                    p:1,
                                    textAlign:'center',
                                    borderRadius:'24px',
                                    borderTopLeftRadius:'0px',
                                    borderTopRightRadius:'0px',
                                    background: 'rgba(0, 0, 0, 0.6)',
                                }}
                            >

                            <Hidden smDown>
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
                            </Hidden>
                            <Hidden smUp>
                                <img
                                    src={GRAPE_COLLECTIONS_DATA+collectionAuthority.logo}
                                    srcSet={GRAPE_COLLECTIONS_DATA+collectionAuthority.logo}
                                    alt={collectionAuthority.name}
                                    //onClick={ () => openImageViewer(0) }
                                    loading="lazy"
                                    height="auto"
                                    style={{
                                        width:'50px',
                                    }}
                                />
                            </Hidden>

                                <Box
                                    sx={{m:0}}
                                >
                                    <Typography variant="h4">
                                        {collectionAuthority.name}
                                    </Typography>

                                    {collectionAuthority?.author && collectionAuthority.author !== collectionAuthority.name &&
                                        <Typography variant="h6">
                                            {collectionAuthority.author}
                                        </Typography>
                                    }

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
                                        {collectionAuthority.links?.telegram &&
                                            <Button 
                                                target='_blank' href={`${collectionAuthority.links.telegram}`}
                                                sx={{
                                                    verticalAlign: 'middle',
                                                    display: 'inline-flex',
                                                    borderRadius:'17px'
                                                }}
                                            >
                                                <TelegramIcon sx={{m:0.75,color:'white'}} />
                                            </Button>
                                        }
                                        
                                    </Box>
                                </Box>

                                
                                {collectionAuthority.tokenType === "NFT" &&
                                    <>
                                        <Box
                                            sx={{m:2}}
                                        >
                                            {!stateLoading &&
                                                <ListForCollectionView 
                                                    floorPrice={floorPrice}
                                                    logo={GRAPE_COLLECTIONS_DATA+collectionAuthority.logo} 
                                                    entangleTo={collectionAuthority.entangleTo} 
                                                    entangleFrom={collectionAuthority.entangleFrom} 
                                                    entangled={collectionAuthority.entangled} 
                                                    enforceEntangle={collectionAuthority.entangleEnforce}
                                                    entangleUrl={collectionAuthority.entangleUrl}
                                                    updateAuthority={collectionAuthority.updateAuthority}
                                                    collectionAuthority={collectionAuthority}
                                                    collectionMintList={collectionMintList}
                                                    activity={auctionHouseListings} />
                                            }
                                        </Box>
                                        
                                        {collectionParentAuthority && 
                                            <Box
                                                
                                                sx={{m:2}}
                                            >
                                                <Button 
                                                    //component={a} 
                                                    href={`${GRAPE_COLLECTION}${collectionParentAuthority.vanityUrl}`}
                                                    variant="outlined"
                                                    sx={{
                                                        color:'white',
                                                        verticalAlign: 'middle',
                                                        display: 'inline-flex',
                                                        borderRadius:'17px'
                                                    }}
                                                >
                                                    {collectionParentAuthority.name}
                                                    <Avatar
                                                        variant="square"
                                                        src={GRAPE_COLLECTIONS_DATA+collectionParentAuthority.logo}
                                                        sx={{
                                                            ml:1,
                                                            width: 24, 
                                                            height: 24
                                                        }}
                                                    ></Avatar>
                                                </Button>
                                            </Box>
                                        }

                                        {collectionChildren && 
                                            <Box       
                                                sx={{m:2}}
                                            >
                                                <ButtonGroup>
                                                    {collectionChildren.map((child:any) => (
                                                        <Button 
                                                            //component={a} 
                                                            href={`${GRAPE_COLLECTION}${child.vanityUrl}`}
                                                            variant="outlined"
                                                            sx={{
                                                                color:'white',
                                                                verticalAlign: 'middle',
                                                                display: 'inline-flex',
                                                                borderRadius:'17px'
                                                            }}
                                                        >
                                                            {child.name}
                                                            <Avatar
                                                                variant="square"
                                                                src={GRAPE_COLLECTIONS_DATA+child.logo}
                                                                sx={{
                                                                    ml:1,
                                                                    width: 24, 
                                                                    height: 24
                                                                }}
                                                            ></Avatar>
                                                    </Button>
                                                    ))}
                                                </ButtonGroup>
                                            </Box>
                                        }
                                    </>
                                }
                                
                                {collectionAuthority.tokenType === "NFT" &&
                                    <Grid container spacing={0} sx={{mt:-2}}>
                                        <Grid item xs={12} sm={6} md={4} key={1}>
                                            <Box
                                                className='grape-store-stat-item'
                                                sx={{borderRadius:'24px',m:2,p:1}}
                                            >
                                                <Typography variant="body2" sx={{color:'yellow'}}>
                                                    {stateLoading ?
                                                        <>loading {loadingPosition}</>
                                                    :
                                                        <>FLOOR/LISTINGS</>
                                                    }
                                                    {!stateLoading ?
                                                        <Button
                                                            onClick={refreshMintStates}
                                                            sx={{color:'yellow', borderRadius:'24px',p:0,m:0,ml:1,minWidth:'10px'}}
                                                        >
                                                            <RefreshIcon fontSize="small" sx={{p:0,m:0}} />
                                                        </Button>
                                                    :
                                                        <LinearProgress />
                                                    }
                                                    
                                                        
                                                    
                                                </Typography>
                                                <Typography variant="subtitle2">
                                                    <Tooltip title={`${grapeFloorPrice || 0} SOL floor / ${grapeTotalListings} listings on Grape`}>
                                                        <Button
                                                            sx={{color:'white',m:0,p:0}}
                                                        >
                                                            {floorPrice ? `${(floorPrice).toFixed(2)} SOL` : `-`} / {totalListings}
                                                        </Button>
                                                    </Tooltip>
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4} key={1}>
                                            <Box
                                                className='grape-store-stat-item'
                                                sx={{borderRadius:'24px',m:2,p:1}}
                                            >
                                                <Typography variant="body2" sx={{color:'yellow'}}>
                                                    ITEMS
                                                </Typography>
                                                <Typography variant="subtitle2">
                                                    {collectionMintList?.length || `${(collectionAuthority.size/1000).toFixed(1)}`}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        {/*
                                        <Grid item xs={12} sm={6} md={3} key={1}>
                                        <Tooltip title={collectionAuthority.entangled ? `All time for both collections` : `Unique owners for this collections`}>
                                            <Button 
                                                variant="text"
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
                                                        OWNERS
                                                    </Typography>
                                                    <Typography variant="subtitle2">
                                                        {(collectionAuthority.owners/1000).toFixed(1)}k
                                                    </Typography>
                                                </Box>
                                            </Button>
                                        </Tooltip>
                                        </Grid>
                                        */}
                                        <Grid item xs={12} sm={6} md={4} key={1}>
                                            {!stateLoading ?
                                                <ActivityView collectionAuthority={collectionAuthority} collectionMintList={collectionMintList} activity={auctionHouseListings} ahStats={ahStats} meStats={meStats} tokenPrice={tokenPrice} mode={0} />
                                            :
                                                <CircularProgress sx={{color:'yellow',p:'2px'}} />
                                            }
                                        </Grid>
                                    </Grid>
                                }
                            </Box>
                    </Box>
                </>
            }
                <Box
                    sx={{
                        background:'rgba(0,0,0,0.2)',
                        borderRadius:'17px'
                    }}
                >

                    {/*collectionMintList &&  
                            <GalleryView mode={1} collectionMintList={collectionMintList} collectionAuthority={collectionAuthority} tokenPrice={tokenPrice}/>
                    */}
                    
                    
                    <Tabs variant="scrollable" scrollButtons="auto" value={tabValue} onChange={handleTabChange} aria-label="grape community tabs" sx={{pl:2,color:'white'}} className="grape-community-tab">
                        {collectionAuthority?.tokenType && collectionAuthority?.tokenType === 'SPL' &&
                            <Tab icon={<SolCurrencyIcon />} aria-label="Token" value={NavPanel.Token} sx={{color:'white'}} title="Tokenized Community" />
                        }
                        {collectionAuthority?.tokenType && collectionAuthority?.tokenType === 'NFT' &&
                            <Tab icon={<StorefrontIcon />} aria-label="Marketplace" value={NavPanel.Marketplace} sx={{color:'white'}} title="Marketplace" />
                        }
                        {collectionAuthority?.tokenType && collectionAuthority?.tokenType === 'NFT' &&
                            <Tab icon={<PeopleIcon />} aria-label="Holders" value={NavPanel.Holders} sx={{color:'white'}} title="Holders" />
                        }
                        {collectionAuthority?.governance &&
                            <Tab icon={<AccountBalanceIcon />} aria-label="Governance" value={NavPanel.Governance} sx={{color:'white'}} title="Governance" />
                        }
                        {collectionAuthority?.governance &&
                            <Tab icon={<HowToRegIcon />} aria-label="Members" value={NavPanel.Members} sx={{color:'white'}} title="Members" />
                        }

                        <Tab icon={<RateReviewIcon />} aria-label="Topics" disabled={true} value={NavPanel.Topics} sx={{color:'white'}} />
                        <Tab icon={<ForumIcon />} aria-label="Chat" disabled={true} value={NavPanel.Chat} sx={{color:'white'}} />
                        <Tab icon={<WorkIcon />} aria-label="Work" disabled={true} value={NavPanel.Work} sx={{color:'white'}} />

                        

                        {collectionAuthority?.links?.twitter &&
                            <Tab icon={<TwitterIcon />} aria-label="Holders" value={NavPanel.SocialFeed} sx={{color:'white'}} title="Twitter Feed" />
                        }
                        
                    </Tabs>

                    <TabPanel value={tabValue} index={NavPanel.Token}>
                        <Box> 
                            {collectionAuthority &&  
                                <TokenView mode={1} collectionAuthority={collectionAuthority} tokenPrice={tokenPrice}/>
                            }
                        </Box>
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={NavPanel.Marketplace}>
                        <Box> 
                            {collectionMintList &&  
                                <GalleryView floorPrice={floorPrice} mode={1} collectionMintList={collectionMintList} collectionAuthority={collectionAuthority} tokenPrice={tokenPrice} refreshGallery={refreshGallery}/>
                            }
                        </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={NavPanel.Holders}>
                        <Box> 
                            {collectionAuthority &&  
                                <HoldersView collectionAuthority={collectionAuthority} />
                            }
                        </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={NavPanel.Governance}>
                        <Box> 
                            {collectionAuthority &&  
                                <GovernanceView collectionAuthority={collectionAuthority} />
                            }
                        </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={NavPanel.Members}>
                        <Box> 
                            {collectionAuthority &&  
                                <MembersView collectionAuthority={collectionAuthority} />
                            }
                        </Box>
                    </TabPanel>
                    {collectionAuthority?.links?.twitter &&
                        <TabPanel value={tabValue} index={NavPanel.SocialFeed}>
                            <Box> 
                                {collectionAuthority &&  
                                    <SocialMediaView collectionAuthority={collectionAuthority} twitterHandle={collectionAuthority?.links?.twitter} />
                                }
                            </Box>
                        </TabPanel>
                    }
                    
                </Box>
        </React.Fragment>
    );
}
