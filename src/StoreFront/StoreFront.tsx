import React, { useEffect, useState, useCallback, memo, Suspense } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils';
// @ts-ignore
import fetch from 'node-fetch';
import BN from "bn.js";

import { findDisplayName } from '../utils/name-service';
import { FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProfilePicture } from '@solflare-wallet/pfp';

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
    getReceiptsFromAuctionHouse
} from '../utils/grapeTools/helpers';

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

const StoreIdentityView = (props: any) => {
    const [expanded_collection, setExpandedCollection] = React.useState(true);
    const [pubkey, setPubKey] = React.useState<string>(props.pubkey || null);
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const rowsperpage = 1500;
    const rpclimit = 100;
    //const [wallet_collection, setCollectionArray] = React.useState(props.collection.collection)
    //const [wallet_collection] = React.useState(props.collection.collection);
    //const [wallet_collection, setCollectionArray] = React.useState(props.collection.collection);
    //const [wallet_collection_meta, setCollectionMeta] = React.useState(null);
    //const [final_collection, setCollectionMetaFinal] = React.useState(null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const [featuredObj, setFeaturedObj] = React.useState(null);
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [hasProfilePicture, setHasProfilePicture] = React.useState(false);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [loadCount, setLoadCount] = React.useState(0);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const solanaProvider = useWallet();
    const { publicKey } = useWallet();
    
    let ref = React.createRef()
    
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        //getCollectionMeta(value);
        //count={(Math.ceil(wallet_collection.length / rowsperpage))}
    };

    const handleExpandCollectionClick = () => {
        setExpandedCollection(!expanded_collection);
    };
    
    const fetchProfilePicture = async () => {
        const { isAvailable, url } = await getProfilePicture(ggoconnection, new PublicKey(pubkey));

        let img_url = url;
        if (url)
            img_url = url.replace(/width=100/g, 'width=256');
        setProfilePictureUrl(img_url);
        setHasProfilePicture(isAvailable);
    }

    const fetchSolanaDomain = async () => {
        const domain = await findDisplayName(ggoconnection, pubkey);
        if (domain){
            if (domain[0] !== pubkey){
                setSolanaDomain(domain[0]);
            }
        }
    }

    const { t, i18n } = useTranslation();
    
    React.useEffect(() => { 
        if (pubkey){
            if (ValidateAddress(pubkey)){
                if (loadCount < 1){
                    fetchProfilePicture();
                    //getCollectionMeta(0);
                    fetchSolanaDomain();

                    // get featured
                    for (var featured of FEATURED_DAO_ARRAY){
                        if (featured.address === pubkey){
                            setFeaturedObj(featured);
                        }
                    }
                }
            }
        }
    }, [pubkey]);

    /*
    React.useEffect(() => {
        if (publicKey){
            if (pubkey === publicKey.toBase58()){
                if (solanaDomain){
                    let sppicon = '';
                    if (profilePictureUrl)
                        sppicon = '<i class="wallet-adapter-button-start-icon"><img style="border-radius:24px" src="'+profilePictureUrl+'" alt="Solana Profile Icon"></i>';
                    document.getElementsByClassName("wallet-adapter-button")[0].innerHTML = sppicon+'<span class="wallet-adapter-solana-domain">'+solanaDomain+'</span>';
                }
            }
        }
    }, [solanaDomain, profilePictureUrl])
    */

    if (loading){
        return <>{t('Loading...')}</>
    } else {

        return (
            <React.Fragment>
                <Box>
                    
                        <Box
                            sx={{
                                mb:4,
                                mt:3,
                                //background:'green'
                            }}
                        >
                            {featuredObj && (
                                <Card sx={{borderRadius:'26px',mb:2}}>

                                        {/*component={Link} to={`${GRAPE_PROFILE}${featuredObj.address}`}*/}
                                    <CardActionArea
                                        component="a" href={`${featuredObj.daourl}`} target="_blank"
                                    >
                                        <CardMedia
                                        component="img"
                                        image={featuredObj.img}
                                        alt={featuredObj.title}
                                            sx={{
                                                maxHeight: '250',
                                                background: 'rgba(0, 0, 0, 1)',
                                                m:0,
                                                p:0,
                                            }} 
                                        />
                                    </CardActionArea>
                                </Card>
                            )}


                                <Grid 
                                    container 
                                    spacing={2}
                                    rowSpacing={3}
                                    >    
                                    <Grid item xs={12} sm={5} md={3} lg={3} xl={3}
                                    sx={{
                                    }}
                                    >
                                    
                                        <Box
                                            className='grape-profile-background'
                                        >
                                            TEST
                                        </Box>
                                        <MainMenu pubkey={pubkey} />

                                    </Grid>
                                    <Grid item xs={12} sm={7} md={9} lg={9} xl={9}
                                    sx={{
                                    }}
                                    >
                                    
                                        <Container
                                            sx={{
                                                minHeight: '225px',
                                                m:0,
                                                p:0,
                                            }} 
                                        >
                                            TEST
                                        </Container>
                                    </Grid>
                                
                                
                            </Grid>
                        </Box>
                        
                    </Box>
            </React.Fragment>
        );
    }
    
}

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

    const StoreProfile = (props: any) => {
        return (
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
                        display="flex-grow"
                        justifyContent="center"
                    >
                        <StoreIdentityView collectionMintList={collectionMintList} />
                    </Box>
                </Grid>
            </Grid>
        );
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
                    fetchMintStates(collectionAuthority);
                }
            //}
        }
    }, [collectionMintList]);

    const getCollectionStates = async (address:string) => {
        
        if (!stateLoading){
            setStateLoading(true);
            //const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
            const auctionHouseKey = new PublicKey(AUCTION_HOUSE_ADDRESS);
            //const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
            //let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mint)).toBuffer())], auctionHouseKey);
            //let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((publicKey).toBuffer())], auctionHouseKey);
            //let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
            let derivedUAPDA = await PublicKey.findProgramAddress([Buffer.from((new PublicKey(collectionAuthority.address)).toBuffer())], auctionHouseKey);
            /*
            console.log("derivedMintPDA: "+derivedMintPDA);
            console.log("derivedBuyerPDA: "+derivedBuyerPDA);
            console.log("derivedOwnerPDA: "+derivedOwnerPDA);
            */
            let result = await ggoconnection.getSignaturesForAddress(derivedUAPDA[0], {limit: 250});
            let ahListings: any[] = [];
            let ahListingsMints: any[] =[];
            let exists = false;
            let cntr = 0;
            let cnt = 0;
            
            let signatures: any[] = [];
            for (var value of result){
                signatures.push(value.signature);
            }
            
            const getTransactionAccountInputs2 = await ticonnection.getParsedTransactions(signatures, 'confirmed');
            
            let featured = null;
            for (var value of result){
            
                if (value.err === null){
                    try{
                        //console.log('value: '+JSON.stringify(value));
                        const getTransactionAccountInputs = getTransactionAccountInputs2[cnt];
                        
                        if (getTransactionAccountInputs?.transaction && getTransactionAccountInputs?.transaction?.message){
                            
                            let feePayer = new PublicKey(getTransactionAccountInputs?.transaction.message.accountKeys[0].pubkey); // .feePayer.toBase58();                            
                            //let progAddress = getTransactionAccountInputs.meta.logMessages[0];

                            exists = false;
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
                                        memo_str = submemo.slice(init,fin+1); // include brackets
                                        memo_arr.push(memo_str);
                                        submemo = submemo.replace(memo_str, "");
                                        //console.log("pushed ("+mx+"):: "+memo_str + " init: "+init+" fin: "+fin);
                                        //console.log("submemo: "+submemo);
                                    }
                                } else{
                                    let init = memo_str.indexOf('{');
                                    let fin = memo_str.indexOf('}');
                                    memo_str = memo_str.slice(init,fin+1); // include brackets
                                    memo_arr.push(memo_str);
                                }
                                
                                for (var memo_item of memo_arr){
                                    try{

                                        const memo_json = JSON.parse(memo_item);

                                        console.log('MEM:: ('+memo_json?.amount+'): ' +memo_str);
                                        for (var i = 0; i < ahListings.length; i++){
                                            if ((memo_json?.mint === ahListings[i].mint)){ // match same
                                                // if match then add
                                                if (memo_json.state === 1)
                                                    ahListings[i].offers = ahListings[i].offers+1;
                                                exists = true;
                                            }
                                        }

                                        //if (!exists){
                                            let forSaleDate = ''+value.blockTime;
                                            if (forSaleDate){
                                                let timeago = timeAgo(''+value.blockTime);
                                                forSaleDate = timeago;
                                            }

                                            let solvalue = convertSolVal(memo_json?.amount || memo_json?.offer, null);
                                            if (memo_json?.mint){
                                                let offer = 0;
                                                if (memo_json.state === 1)
                                                    offer = 1;
                                                // 1. score will need to be decayed according to time
                                                // 2. score will need to be decayed if reported and if reported > threshhold dont show
                                                ahListings.push({buyeraddress: feePayer.toBase58(), amount: memo_json?.amount || memo_json?.offer, solvalue: solvalue, mint: memo_json?.mint, timestamp: forSaleDate, blockTime:value.blockTime, state: memo_json?.state || memo_json?.status, offers: offer, score: memo_json?.score || 0});  
                                                ahListingsMints.push(memo_json.mint);
                                                
                                            }
                                        //}
                                    }catch(merr){console.log("ERR: "+merr + " - "+memo_item)}
                                }
                                setAuctionHouseListings(ahListings);
                            }
                        }
                    } catch (e){console.log("ERR: "+e)}
                }
            } 

            // IMPORTANT
            // loop and set the list price, highest offer, and date of the listing
            // sort first by blockTime
            collectionMintList.sort((a:any,b:any) => (a.blockTime > b.blockTime) ? 1 : -1);

            // we need to remove listing history for those that have been sold
            for (var listing of ahListings){
                let exists = false;
                Object.keys(collectionMintList).map(function(key) {
                    collectionMintList[key].price = 0;
                    if (collectionMintList[key].address === listing.mint){
                        exists = true;
                        if (listing.state === 1){
                            if ((!collectionMintList[key]?.highestOffer) || (listing.solvalue > +collectionMintList[key]?.highestOffer)){
                                if ((!collectionMintList[key]?.soldBlockTime) || (listing.blockTime > +collectionMintList[key]?.soldBlockTime))
                                    collectionMintList[key].highestOffer = listing.solvalue;
                                // add offer count?
                            }
                        } else if (listing.state === 2){
                            collectionMintList[key].price = listing.solvalue;
                            collectionMintList[key].listedTimestamp = listing.timestamp;
                            collectionMintList[key].listedBlockTime = listing.blockTime;
                        } else if (listing.state === 3){
                            if ((!collectionMintList[key]?.soldBlockTime) || (listing.blockTime > +collectionMintList[key]?.soldBlockTime))
                                collectionMintList[key].soldBlockTime = listing.blockTime;
                        }
                    }
                });
                if (!exists){
                    //console.log("not exists ahListings "+JSON.stringify(listing));
                    if (listing.state === 1){
                        collectionMintList.push({
                            address: listing.mint,
                            highestOffer: listing.solvalue,
                            name:null,
                            image:'',
                            price:0,
                        })
                    } else if (listing.state === 2){
                        collectionMintList.push({
                            address: listing.mint,
                            price: listing.solvalue,
                            listedTimestamp: listing.timestamp,
                            listedBlockTime: listing.blockTime,
                            name:null,
                            image:'',
                        })
                    }
                }
            }

            //console.log("collectionMintList "+JSON.stringify(collectionMintList));

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
            
            /*
            let finalmeta = missing_meta;//JSON.parse(JSON.stringify(final_collection_meta));
            try{
                finalmeta.sort((a:any, b:any) => a?.meta.data.name.toLowerCase().trim() > b?.meta.data.name.toLowerCase().trim() ? 1 : -1);   
            }catch(e){console.log("Sort ERR: "+e)}
            */

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
            //collectionMintList.sort((a:any,b:any) => (a?.price < b?.price) ? 1 : -1);
            collectionMintList.sort((a:any,b:any) => (a.price < b.price) ? 1 : -1);

            //console.log("collection sorted: "+JSON.stringify(collectionMintList));
             
            //collectionMintList.sort((a:any,b:any) => ((a.price - b.price) ));
            // now inverse the list
            //Array.prototype.reverse.call(collectionMintList);
            //console.log("collection reversed: "+JSON.stringify(collectionMintList));

            /*
            let collectionmeta = await getCollectionData(ahListingsMints);

            setFeaturedMeta(collectionmeta);
            setFeatured(ahListings);

            for (var i = 0; i < collectionmeta.length; i++){
                collectionmeta[i]["memo"] = ahListings[i];
            }
            
            try{
                let finalmeta = JSON.parse(JSON.stringify(collectionmeta));

                for (var item_meta of finalmeta){
                    let meta_primer = item_meta.data;
                    let buf = Buffer.from(meta_primer.data, 'base64');
                    let meta_final = decodeMetadata(buf);
                    //console.log(JSON.stringify(meta_final));
                }
                
                //finalmeta.sort((a:any,b:any) => (b.memo.score - a.memo.score) || (b.memo.blockTime - a.memo.blockTime));
                //setMergedFeaturedMeta(finalmeta);
            }catch(e){
                //setMergedFeaturedMeta(collectionmeta);
            }
            */
            
            
            setStateLoading(false);                                      
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
                    console.log("value "+JSON.stringify(value))
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
                            console.log("meta_final: "+JSON.stringify(meta_final));
                            
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
                console.log("... " + JSON.stringify(finalData));
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
                    
                    console.log("verified checking: "+verified.name.replaceAll(" ", "").toLowerCase() + " vs "+withPubKey.replaceAll(" ", "").toLowerCase());
                    //if (verified.address === mintOwner){
                    if (verified.address === withPubKey){
                        setCollectionAuthority(verified);
                        // get collection mint list
                        const fml = fetchMintList(verified.address);
                        break;
                    } else if (verified.name.replaceAll(" ", "").toLowerCase() === (withPubKey.replaceAll(" ", "").toLowerCase())){ // REMOVE SPACES FROM verified.name
                        console.log("found: "+verified.name);
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
                                {!stateLoading &&
                                    <ActivityView collectionAuthority={collectionAuthority} collectionMintList={collectionMintList} activity={auctionHouseListings} mode={0} />
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
