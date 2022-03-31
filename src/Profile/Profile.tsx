import React, { useEffect, useState, useCallback, memo, Suspense } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils';
// @ts-ignore
import fetch from 'node-fetch';
import BN from "bn.js";

import { findDisplayName } from '../utils/name-service';
//import { performReverseLookup } from '../utils/web3/naming';
import {
    getHashedName,
    getNameAccountKey,
    NameRegistryState,
    performReverseLookup,
    getTwitterRegistry,
  } from "@bonfida/spl-name-service";

import CyberConnect, { Env, Blockchain, solana, ConnectionType } from '@cyberlab/cyberconnect';
import { FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';
import { formatAddress, removeDuplicate, isValidAddr } from '../utils/cyberConnect/helper';
import { followListInfoQuery, searchUserInfoQuery } from '../utils/cyberConnect/query';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProfilePicture } from '@solflare-wallet/pfp';

import { TokenAmount, lt } from '../utils/grapeTools/safe-math';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';

import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'

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

import { GRAPE_RPC_ENDPOINT, GRAPE_RPC_REFRESH, GRAPE_PREVIEW, GRAPE_PROFILE, GRAPE_IDENTITY, FEATURED_DAO_ARRAY } from '../utils/grapeTools/constants';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';
import FeedView from './FeedView';
import OffersView from './OffersView';
import SocialView from './SocialView';
import GalleryView from './GalleryView';
import CurationView from './CurationView';
import { MakeLinkableAddress, ValidateAddress, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { ConstructionOutlined } from "@mui/icons-material";

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

function convertSolVal(sol: any){
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

const GalleryItem = (props: any) => {
    const collectionitem = props.collectionitem || [];
    const mint = collectionitem?.wallet?.account.data.parsed.info.mint || null;
    const [expanded, setExpanded] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [collectionmeta, setCollectionMeta] = React.useState(null);
        //const [collectionrawdata, setCollectionRaw] = React.useState(props.collectionitemmeta || null);
        
        const handleExpandClick = () => {
            setExpanded(!expanded);
        };

        const MD_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
        const getCollectionData = async () => {
            try {
                let meta_primer = collectionitem;
                let buf = Buffer.from(meta_primer.data, 'base64');
                let meta_final = decodeMetadata(buf);
                
                const metadata = await fetch(meta_final.data.uri).then(
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

                if (mint)
                    getCollectionMeta();
            }, 500);
            return () => clearInterval(interval); 
        }, [collectionitem]);
        
        if((!collectionmeta)||
            (loading)){
            //getCollectionMeta();
            //setTimeout(getCollectionMeta(), 250);
            return (
                <ListItemButton
                    sx={{
                        width:'100%',
                        borderRadius:'25px',
                        p: '2px',
                        mb: 5
                    }}
                >
                    <Skeleton 
                        sx={{
                            borderRadius:'25px',
                        }}
                        variant="rectangular" width={325} height={325} />
                </ListItemButton>
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
                    
                        <Grid 
                            container 
                            alignItems="center"
                            justifyContent="center">
                            <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                                <ListItemButton
                                    component={Link} to={`${GRAPE_PREVIEW}${mint}`}
                                    sx={{
                                        width:'100%',
                                        borderRadius:'25px',
                                        p: '2px'
                                    }}
                                >
                                    <img
                                        src={`${image}`}
                                        srcSet={`${image}`}
                                        alt={collectionmeta.collectionmeta?.name}
                                        //onClick={ () => openImageViewer(0) }
                                        loading="lazy"
                                        height="auto"
                                        style={{
                                            width:'100%',
                                            borderRadius:'24px'
                                        }}
                                    />
                                </ListItemButton>
                            </Grid>
                            <Grid item sx={{display:'flex'}}>
                                <Box
                                    sx={{p:1}}
                                >
                                    <Typography variant="caption">
                                        {collectionmeta.collectionmeta?.name}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                );
            }
            //}
        }
}

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

const MainPanel = (props: any) => {
    const [loading, setLoading] = React.useState(false);
    const [ thisPublicKey, setThisPublicKey] = React.useState(props.thisPublicKey || null);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [walletCollection, setWalletCollection] = React.useState(props.wallet_collection);
    const [walletCollectionMeta, setWalletCollectionMeta] = React.useState(props.wallet_collection_meta);
    const finalCollection = props.final_collection || null;
    const [page, setPage] = React.useState(1);
    const rowsperpage = 1500;
    //const { activeTab, setActiveTab } = React.useContext(TabActiveContext);
    const [tabvalue, setTabValue] = React.useState(props?.activeTab || 0);
    
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const { t, i18n } = useTranslation();

    function a11yProps(index: number) {
        return {
            id: `grapeart-tab-${index}`,
            'aria-controls': `grapeart-tabpanel-${index}`,
        };
    }

    React.useEffect(() => { 
        if (tabvalue!=props?.activeTab){
            setTabValue(props?.activeTab);
        }
    }, [props?.activeTab]);
    
    if(loading){
        return (
            <Grid item xs='auto' sm='auto' md='auto' lg='auto' xl='auto'>
                <Box
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                    }} 
                >
                    <CircularProgress />
                </Box>
            </Grid>
        )
    } else{
        return (
            <Grid item xs={12} sm={7} md={9} lg={9} xl={9}>
                <Container
                    sx={{
                        minHeight: '225px',
                        m:0,
                        p:0,
                    }} 
                >
                    <TabActiveProvider initialActiveKey="0">   
                        <Tabs 
                            variant="scrollable"
                            scrollButtons="auto"
                            value={tabvalue} 
                            onChange={handleTabChange} 
                            sx={{
                                background: 'rgba(0, 0, 0, 0.6)',
                                borderRadius: '17px',
                                mb:1,
                            }} 
                        >
                            <Tab icon={<Hidden smUp><CollectionsOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>{t('Collection')}</Hidden>} sx={{color:'white',minWidth:'25px'}} {...a11yProps(0)} />
                            <Tab icon={<Hidden smUp><RssFeedOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>{t('Feed')}</Hidden>} sx={{color:'white',minWidth:'25px'}} {...a11yProps(1)} />
                            <Tab icon={<Hidden smUp><ArrowCircleLeftOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>{t('Followers')}</Hidden>} sx={{color:'white',minWidth:'25px'}} {...a11yProps(2)} />
                            <Tab icon={<Hidden smUp><ArrowCircleRightOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>{t('Following')}</Hidden>} sx={{color:'white',minWidth:'25px'}} {...a11yProps(3)} />
                            {/*<Tab label="Bids" sx={{color:'white'}} {...a11yProps(4)} />*/}
                            <Tab icon={<Hidden smUp><GavelOutlinedIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>{t('Offers')}</Hidden>} sx={{color:'white',minWidth:'25px'}} {...a11yProps(5)} />
                            <Tab icon={<Hidden smUp><SolCurrencyIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>{t('Selling')}</Hidden>} sx={{color:'white',minWidth:'25px'}} {...a11yProps(6)} />
                            <Tab icon={<Hidden smUp><FavoriteBorderIcon sx={{fontSize:'18px'}}/></Hidden>} label={<Hidden smDown>{t('Likes')}</Hidden>} sx={{color:'white',minWidth:'25px'}} {...a11yProps(7)} />
                        </Tabs>

                        <TabPanel value={tabvalue} index={0}>
                            <GalleryView finalCollection={finalCollection} isparent={true} />
                        </TabPanel>
                        <TabPanel value={tabvalue} index={1}>
                            <FeedView />
                        </TabPanel>
                        <TabPanel value={tabvalue} index={2}>
                            <SocialView pubkey={thisPublicKey} type={0} />
                        </TabPanel>
                        <TabPanel value={tabvalue} index={3}>
                            <SocialView pubkey={thisPublicKey} type={1} />
                        </TabPanel>

                        <TabPanel value={tabvalue} index={4}>
                            <OffersView selectedstate={1} pubkey={thisPublicKey} wallet_collection={walletCollection} wallet_collection_meta={walletCollectionMeta} />
                        </TabPanel>
                        <TabPanel value={tabvalue} index={5}>
                            <OffersView selectedstate={2} pubkey={thisPublicKey} wallet_collection={walletCollection} wallet_collection_meta={walletCollectionMeta} />
                        </TabPanel>
                        <TabPanel value={tabvalue} index={6}>
                            <CurationView pubkey={thisPublicKey} type={1} />
                        </TabPanel>
                    </TabActiveProvider>
                </Container>
            </Grid>
        );
    }
}

const IdentityView = (props: any) => {
    const [expanded_collection, setExpandedCollection] = React.useState(true);
    const [pubkey, setPubKey] = React.useState<string>(props.pubkey || null);
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const rowsperpage = 1500;
    const rpclimit = 100;
    //const [wallet_collection, setCollectionArray] = React.useState(props.collection.collection)
    //const [wallet_collection] = React.useState(props.collection.collection);
    const [wallet_collection, setCollectionArray] = React.useState(props.collection.collection);
    const [wallet_collection_meta, setCollectionMeta] = React.useState(null);
    const [final_collection, setCollectionMetaFinal] = React.useState(null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const [featuredObj, setFeaturedObj] = React.useState(null);
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [hasProfilePicture, setHasProfilePicture] = React.useState(false);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [loadCount, setLoadCount] = React.useState(0);
    const [loadingFollowState, setLoadingFollowState] = React.useState(false);
    const [followListInfo, setFollowListInfo] = useState<FollowListInfoResp | null>(null);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const solanaProvider = useWallet();
    const { publicKey } = useWallet();
    //const { setActiveTab } = React.useContext(TabActiveContext);
    const [activeTab, setActiveTab] = React.useState(0);

    let ref = React.createRef()

    const NAME_SPACE = 'Grape';
    const NETWORK = Network.SOLANA;
    const FIRST = 10; // The number of users in followings/followers list for each fetch

    const cyberConnect = new CyberConnect({
        namespace: NAME_SPACE,
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    // Get the current user followings and followers list
  const initFollowListInfo = async () => {
    if (!pubkey) {
      return;
    }
    
    setLoading(true);
    const resp = await followListInfoQuery({
        address:pubkey,
        namespace: '',
        network: NETWORK,
        followingFirst: FIRST,
        followerFirst: FIRST
    });
    if (resp) {
      setFollowListInfo(resp);
    }
    setLoading(false);
  };
  
  const fetchMore = async (type: 'followings' | 'followers') => {
    if (!pubkey || !followListInfo) {
      return;
    }

    const params =
      type === 'followers'
        ? {
            address:pubkey,
            namespace: '',
            network: NETWORK,
            followerFirst: FIRST,
            followerAfter: followListInfo.followers.pageInfo.endCursor,
          }
        : {
            address:pubkey,
            namespace: '',
            network: NETWORK,
            followingFirst: FIRST,
            followingAfter: followListInfo.followings.pageInfo.endCursor,
          };

    const resp = await followListInfoQuery(params);
    if (resp) {
      type === 'followers'
        ? setFollowListInfo({
            ...followListInfo,
            followers: {
              pageInfo: resp.followers.pageInfo,
              list: removeDuplicate(
                followListInfo.followers.list.concat(resp.followers.list)
              ),
            },
          })
        : setFollowListInfo({
            ...followListInfo,
            followings: {
              pageInfo: resp.followings.pageInfo,
              list: removeDuplicate(
                followListInfo.followings.list.concat(resp.followings.list)
              ),
            },
          });
    }
  };
  
    const fetchSearchAddrInfo = async (fromAddr:string, toAddr: string) => {

        const resp = await searchUserInfoQuery({
            fromAddr:fromAddr,
            toAddr,
            namespace: NAME_SPACE,
            network: NETWORK,
            type: 'FOLLOW',
        });
        if (resp) {
            setSearchAddrInfo(resp);
        }
  
        return resp;
    };

    const followWalletConnect = async (followAddress:string, solanaAddress:string) => {
        // address:string, alias:string
        let tofollow = followAddress;  
        //console.log(followAddress+": "+solanaAddress);
        let promise = await cyberConnect.connect(followAddress, solanaAddress)
        .catch(function (error) {
            console.log(error);
        });
        getFollowStatus();
    };
    const followWalletDisconnect = async (followAddress:string) => {
        // address:string, alias:string

        let promise = await cyberConnect.disconnect(followAddress)
        .catch(function (error) {
            console.log(error);
        });
        getFollowStatus();
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        getCollectionMeta(value);
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

    const MD_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const getCollectionData = async (start:number) => {
        try {
            let mintsPDAs = new Array();
            //console.log("RPClim: "+rpclimit);
            //console.log("Paging "+(rpclimit*(start))+" - "+(rpclimit*(start+1)));
            
            let mintarr = wallet_collection.slice(rpclimit*(start), rpclimit*(start+1)).map((value:any, index:number) => {
                //console.log("mint: "+JSON.stringify(value.account.data.parsed.info.mint));
                return value.account.data.parsed.info.mint;
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

    const getFollowStatus = async () => {
        if (publicKey){
            if (pubkey){
                setLoadingFollowState(true);
                let socialconnection = await fetchSearchAddrInfo(publicKey.toBase58(), pubkey);
                if (socialconnection){
                    //if (socialconnection?.identity){
                    if (socialconnection?.connections[0]?.followStatus) {  
                        setIsFollowing(socialconnection?.connections[0].followStatus.isFollowing);
                    }
                }
                setLoadingFollowState(false);
            }
        }
    }

    const getCollectionMeta = async (start:number) => {
        if (!loading){
            setLoading(true);
            // see how many loops we will need to conduct
            let wallletlength = wallet_collection.length;
            
            let loops = (Math.ceil(wallet_collection.length/rpclimit));
            let collectionmeta: any[] = [];

            console.log("lps: "+loops);
            for (var x=0;x<loops;x++){
                //const interval = setTimeout(() => {
                    let tmpcollectionmeta = await getCollectionData(x);
                    //collectionmeta.push(tmpcollectionmeta);
                    collectionmeta = collectionmeta.concat(tmpcollectionmeta);
                //}, 200);
                
            }
            //console.log(collectionmeta.length + ' vs '+wallet_collection.length);

            setLoadCount(loadCount+1);
            setCollectionMeta({collectionmeta});

            let final_collection_meta: any[] = [];
            for (var i = 0; i < collectionmeta.length; i++){
                //console.log(i+": "+JSON.stringify(collectionmeta[i])+" --- with --- "+JSON.stringify(wallet_collection[i]));
                if (collectionmeta[i]){
                    collectionmeta[i]["wallet"] = wallet_collection[i];
                    try{
                        let meta_primer = collectionmeta[i];
                        let buf = Buffer.from(meta_primer.data, 'base64');
                        let meta_final = decodeMetadata(buf);
                        collectionmeta[i]["meta"] = meta_final;
                        collectionmeta[i]["groupBySymbol"] = 0;
                        collectionmeta[i]["groupBySymbolIndex"] = 0;
                        collectionmeta[i]["floorPrice"] = 0;
                        final_collection_meta.push(collectionmeta[i]);
                    }catch(e){
                        console.log("ERR:"+e)
                    }
                }
            }

            let finalmeta = final_collection_meta;//JSON.parse(JSON.stringify(collectionmeta));
            try{
                // add a groupable counter
                for (var i = 0; i < finalmeta.length; i++){
                    // using nft symbol
                    // query how many instances
                    if (finalmeta[i].meta.data.symbol.length > 0){
                        for (var metainstance of finalmeta){
                            if (finalmeta[i].meta.data.symbol === metainstance.meta.data.symbol){
                                finalmeta[i]["groupBySymbol"]++;
                            }
                        }
                    }
                }
                finalmeta.sort((a:any, b:any) => a?.meta.data.symbol.trim() > b?.meta.data.symbol.trim() ? 1 : -1);
                //finalmeta.sort((a:any, b:any) => a?.meta.data.name.toLowerCase().trim() > b?.meta.data.name.toLowerCase().trim() ? 1 : -1);
                
                let previousSymbol = null;
                let counter = 0;
                for (var i = 0; i < finalmeta.length; i++){
                    if (previousSymbol !== finalmeta[i].meta.data.symbol)
                        counter = 0;
                    
                    if (finalmeta[i]["groupBySymbol"] > 1){
                        finalmeta[i]["groupBySymbolIndex"] = counter;
                        counter++;
                    }
                    previousSymbol = finalmeta[i].meta.data.symbol;
                }

                for (var i = 0; i < finalmeta.length; i++){
                    if (finalmeta[i]["groupBySymbol"] > 1){
                        console.log(finalmeta[i].groupBySymbol+": "+finalmeta[i].meta.data.symbol+": "+finalmeta[i].meta.data.name);
                    }
                }

                finalmeta.sort((a:any, b:any) => (b.groupBySymbol - a.groupBySymbol));
            }catch(e){console.log("Sort ERR: "+e)}
            setCollectionMetaFinal(finalmeta);
            setLoading(false);
        }
    }
    const { t, i18n } = useTranslation();
    
    React.useEffect(() => { 
        if (pubkey){
            if (ValidateAddress(pubkey)){
                if (loadCount < 1){
                    fetchProfilePicture();
                    getCollectionMeta(0);
                    fetchSolanaDomain();
                    getFollowStatus();
                    initFollowListInfo();

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
                                    {featuredObj ? (  
                                        <img
                                            src={featuredObj.img}
                                            alt=""
                                            className="grape-art-profile-img"
                                        />
                                    )
                                    :(
                                        <>
                                            {(hasProfilePicture && profilePictureUrl) &&
                                                <img
                                                    src={profilePictureUrl}
                                                    alt=""
                                                    className="grape-art-profile-img"
                                                />
                                            }
                                        </>
                                        )
                                    }
                                    
                                        
                                        <List
                                            sx={{ 
                                                width: '100%',
                                                pl: 2,
                                                pr: 2,
                                                pb: 2
                                            }}
                                            component="nav"
                                            >       
                                            <ListItemText>

                                            <Grid 
                                                container 
                                                direction="column"
                                                alignItems="flex-end"
                                                justifyContent="flex-end"
                                            >
                                                <Grid item>
                                                    <Box sx={{ mt:-1.5,mr:-2 }}>
                                                        
                                                        <Typography component="div" variant="caption" alignItems="flex-end" justifyContent="flex-end">

                                                            <ButtonGroup variant="text">
                                                            <ShareSocialURL url={window.location.href} title={'Grape Profile | '+trimAddress(pubkey,4)} />

                                                            {publicKey && publicKey.toBase58() !== pubkey &&
                                                                <Typography component="div" variant="caption" align="center" sx={{ flexGrow: 1 }}>
                                                                {loadingFollowState ?
                                                                    <>
                                                                        <CircularProgress sx={{p:'14px',m:-0.75}} />
                                                                    </>
                                                                :
                                                                    <>
                                                                        {isFollowing ?  
                                                                            <Tooltip title={t('Unfollow')}>
                                                                                <Button 
                                                                                    variant="text" 
                                                                                    onClick={() => followWalletDisconnect(pubkey)}
                                                                                    size="small"
                                                                                    className="profileAvatarIcon"
                                                                                    sx={{borderRadius:'24px', color:'white'}}
                                                                                    >
                                                                                    <PersonRemoveOutlinedIcon />
                                                                                </Button>
                                                                            </Tooltip>
                                                                            :
                                                                            <Tooltip title={t('Follow')}>
                                                                                <Button 
                                                                                    variant="text" 
                                                                                    onClick={() => followWalletConnect(pubkey, solanaDomain)}
                                                                                    size="small"
                                                                                    className="profileAvatarIcon"
                                                                                    sx={{borderRadius:'24px', color:'white'}}
                                                                                    >
                                                                                    <PersonAddOutlinedIcon />
                                                                                </Button>
                                                                            </Tooltip>
                                                                        }
                                                                    </>
                                                                }
                                                                </Typography>
                                                            }
                                                            </ButtonGroup>
                                                        </Typography>
                                                    </Box>
                                                </Grid>  
                                            </Grid>  
                                            <Grid 
                                                container 
                                                direction="column"
                                                alignItems="center"
                                                justifyContent="center"
                                                sx={{mt:2}}
                                            >
                                                <Grid item>
                                                {(hasProfilePicture && profilePictureUrl) ?
                                                    <Avatar sx={{ width: 100, height: 100 }} alt="Profile" src={profilePictureUrl} />
                                                :
                                                    <Jazzicon diameter={100} seed={jsNumberForAddress(pubkey)} />
                                                }
                                                </Grid>
                                                <Grid item
                                                    alignItems="center"
                                                    justifyContent="center"
                                                >
                                                    <Typography gutterBottom variant="body1" component="div" sx={{ flexGrow: 1, color:'white' }}>
                                                        {solanaDomain && solanaDomain.length > 0 ?
                                                            <>
                                                                <Tooltip title={t('View Solana ID')}>
                                                                    <Button 
                                                                        sx={{borderRadius:'17px'}} 
                                                                        size="small" variant="text" 
                                                                        component={Link} 
                                                                        to={`${GRAPE_IDENTITY}${pubkey}`}>
                                                                        <Grid 
                                                                        container 
                                                                        direction="column"
                                                                        alignItems="center"
                                                                        justifyContent="center"
                                                                        >
                                                                            <Grid item>
                                                                                <Typography gutterBottom variant="body1" component="div" sx={{ flexGrow: 1, color:'white' }}><strong>{solanaDomain}</strong></Typography>
                                                                            </Grid>
                                                                            <Grid item sx={{mt:-1.5}}>
                                                                                <Typography gutterBottom variant="caption" component="div" sx={{ flexGrow: 1, color:'white' }}>{trimAddress(pubkey,4)}</Typography>
                                                                            </Grid>
                                                                        </Grid>
                                                                    </Button>
                                                                </Tooltip>
                                                            </>
                                                        :
                                                            <Tooltip title={t('View Solana ID')}>
                                                                <Button 
                                                                    sx={{borderRadius:'17px'}} 
                                                                    size="small" variant="text" 
                                                                    component={Link} 
                                                                    to={`${GRAPE_IDENTITY}${pubkey}`}>
                                                                    <Grid 
                                                                    container 
                                                                    direction="column"
                                                                    alignItems="center"
                                                                    justifyContent="center"
                                                                    >
                                                                        <Grid item>
                                                                            <Typography gutterBottom variant="body1" component="div" sx={{ flexGrow: 1, color:'white' }}>{trimAddress(pubkey,4)}</Typography>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Button>
                                                            </Tooltip>
                                                        }
                                                    </Typography>
                                                </Grid>
                                                <Grid item sx={{mt:1}}>
                                                    
                                                    {followListInfo && 
                                                        <>
                                                            
                                                            <Typography component="div" variant="caption" align="center" sx={{ flexGrow: 1 }}>
                                                                <Button
                                                                    onClick={() => setActiveTab(3)}
                                                                    sx={{fontSize:'12px',textTransform:'none',color:'white',border:'1px solid #fff', borderRadius:'17px',pl:5,pr:5,pt:0,pb:0, m:1}}
                                                                >
                                                                    <strong>{followListInfo.followingCount}</strong>&nbsp;  
                                                                    <Typography component="span" color="#aaa" variant="caption" align="center" sx={{ flexGrow: 1 }}>{t('Following')}</Typography>&nbsp; 
                                                                </Button>
                                                                <Button
                                                                    onClick={() => setActiveTab(2)}
                                                                    sx={{fontSize:'12px',textTransform:'none',color:'white',border:'1px solid #fff', borderRadius:'17px',pl:5,pr:5,pt:0,pb:0, m:1}}
                                                                >
                                                                    <strong>{followListInfo.followerCount}</strong>&nbsp;
                                                                    <Typography component="span" color="#aaa" variant="caption" align="center" sx={{ flexGrow: 1 }}>{t('Followers')}</Typography>
                                                                </Button>
                                                            </Typography>
                                                        </>
                                                    }
                                                    
                                                    { final_collection && final_collection.length > 0 && (
                                                        <>
                                                            <Typography component="div" variant="caption" align="center" color="#aaa"  sx={{ flexGrow: 1, mt:3 }}>
                                                                <strong>{final_collection.length}</strong> {t('items collected')}
                                                            </Typography>
                                                        </>
                                                    )}
                                                    
                                                    
                                                            
                                                </Grid>
                                            </Grid>
                                            </ListItemText>
                                        </List>
                                    </Box>
                                    <MainMenu pubkey={pubkey} />
                                </Grid>
                                
                                <MainPanel activeTab={activeTab} thisPublicKey={pubkey} final_collection={final_collection} wallet_collection={wallet_collection} wallet_collection_meta={wallet_collection_meta} />
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


export function ProfileView(this: any, props: any) {
    //const [provider, setProvider] = React.useState(getParam('provider'));
    const [gallery, setGallery] = React.useState(null);
    const [collection, setCollection] = React.useState(null);
    //const isConnected = session && session.isConnected;
    const [loading, setLoading] = React.useState(false);
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
    
    const fetchWalletCollection = async () => { 
        /*
        TokenAccountsFilter
        const response = await connection.getTokenAccountsByOwner(
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
        );*/

        const body = {
          method: "getTokenAccountsByOwner",
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            pubkey,
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { encoding: "jsonParsed", commitment: "processed" },
          ],
          id: "35f0036a-3801-4485-b573-2bf29a7c77d4",
        };
        
        const response = await fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
    
        const json = await response.json();
        try{
            //const err = json?.result || true;
            //if (!err){
            //    return [];
            //} else{
                const resultValues = json.result.value
                
                let walletCollection = new Array();
                let wallet = resultValues && resultValues?.map((collectionInfo: any) => {
                    (+collectionInfo.account.data.parsed.info.tokenAmount.amount >= 1) &&
                        (+collectionInfo.account.data.parsed.info.tokenAmount.decimals === 0) && 
                            walletCollection.push(collectionInfo);    
                            return collectionInfo;
                });
                return walletCollection;
            //}
        } catch(e){console.log(e);}
        return [];
    };

    const getWalletGallery = async () => {
        if (!loading){
            setLoading(true);
            setLoadCount(loadCount+1);

            let [collection] = await Promise.all([fetchWalletCollection()]);
            setCollection({
                collection
            })
            setLoading(false);
        } else{
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
                        <CircularProgress color="inherit" />
                    </Grid>
                </Grid>
            )
        }
    }

    const getReverseDomainLookup = async (url:string) => {
        if (!rdloading){
            setRDLoading(true);
            
            const SOL_TLD_AUTHORITY = new PublicKey("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx");
            const ROOT_TLD_AUTHORITY = new PublicKey("ZoAhWEqTVqHVqupYmEanDobY7dee5YKbQox9BNASZzU");
            const PROGRAM_ID = new PublicKey("jCebN34bUfdeUYJT13J1yG16XWQpt5PDx6Mse9GUqhR");
            const centralState = new PublicKey("33m47vH6Eav6jr5Ry86XjhRft2jRBLDnDgPSHoquXi2Z");
            
            const domainName = url.slice(0, url.indexOf('.'));
            const hashedName = await getHashedName(domainName);
            const domainKey = await getNameAccountKey(
                hashedName,
                undefined,
                SOL_TLD_AUTHORITY
            );
            const registry = await NameRegistryState.retrieve(connection, new PublicKey(domainKey));
            
            if (!registry?.owner) {
                throw new Error("Could not retrieve name data");
            }

            setPubkey(registry.owner.toBase58());
            setRDLoading(false);
        }
    }
    const getTwitterLookup = async (url:string) => {
        if ((!rdloading)&&(!pubkey)){
            setRDLoading(true);
            
            //const domainName = url.slice(url.indexOf('@'), url.length);
            const twitterHandle = "";
            //console.log("checking: "+twitterHandle);
            const registry = await getTwitterRegistry(connection, twitterHandle);
            
            // verify that this is working and then push live...
            //setPubkey(registry.owner.toBase58());
            setRDLoading(false);
        }
    }

    const CollectionProfile = (props: any) => {
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
                            <IdentityView gallery={gallery} collection={collection} pubkey={pubkey} setPubkey={setPubkey} />
                        </Box>
                    </Grid>
                </Grid>
        );
    }

    function handlePublicKeySubmit(event: any) {
        event.preventDefault();

        if ((newinputpkvalue && newinputpkvalue.length>0 && ValidateAddress(newinputpkvalue))||
            ((newinputpkvalue.toLocaleUpperCase().indexOf(".SOL") > -1) || (newinputpkvalue.slice(0,1) === '@'))){
            navigate({
                pathname: GRAPE_PROFILE+newinputpkvalue
            },
                { replace: true }
            );
            setNewInputPKValue('');
        } else if (newinputpkvalue && newinputpkvalue.length>0){
            if (newinputpkvalue.toLocaleUpperCase().indexOf("MINT:") > -1){
                let mint = newinputpkvalue.slice(5,newinputpkvalue.length);
                if (ValidateAddress(mint)){
                    navigate({
                        pathname: GRAPE_PREVIEW+mint
                    },
                        { replace: true }
                    );
                    setNewInputPKValue('');
                }
            }
        }else{
            setNewInputPKValue('');
        }
    }

    React.useEffect(() => { 
        if (pubkey){
            console.log("with address: "+pubkey);
            if (ValidateAddress(pubkey)){
                getWalletGallery();
            }
        }
    }, [pubkey]);

    React.useEffect(() => { 
        if (withPubKey){
            if (ValidateAddress(withPubKey)){
                setPubkey(withPubKey);
                navigate({
                    pathname: GRAPE_PROFILE+withPubKey
                },
                    { replace: true }
                );
            } else {
                if ((withPubKey.toLocaleUpperCase().indexOf(".SOL") > -1) || (withPubKey.slice(0,1) === '@')){
                    if (withPubKey.toLocaleUpperCase().endsWith(".SOL")){ // Solana Domain
                        getReverseDomainLookup(withPubKey);
                    } else if (withPubKey.toLocaleUpperCase().startsWith("@")){ // Twitter Handle
                        getTwitterLookup(withPubKey);
                    }
                } else{
                    console.log("Nothing send reverting to default profile");
                    navigate({
                        pathname: '/profile'
                    },
                        { replace: true }
                    );
                }
            }
        }
    }, [withPubKey]);

    React.useEffect(() => { 
        if (urlParams){
            setWithPubKey(urlParams);
        } else if (pubkey){
        } else if (publicKey){
            setWithPubKey(publicKey.toBase58());
        }
    }, [publicKey, urlParams]);

    
    if (!pubkey){ 
        // ...
    } else {
        if(((!gallery) && (!collection))||
            (loading)){
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
            <Box
                sx={{
                    mt: 2,
                    
                }}
            >
                <Box>  

                        { pubkey && ValidateAddress(pubkey) ?
                            <CollectionProfile />
                        : 
                        <>
                            <React.Fragment>
                                <Box
                                    className="grape-art-generic-placeholder-container"
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
                                        alignItems="center"
                                    >
                                        <Typography
                                            variant="h3"
                                            color="inherit"
                                            display='flex'
                                            sx={{mt:2}}
                                        >
                                            <img src="/grape_white_logo.svg" width="300px" className="header-logo" alt="Grape" />
                                            .art
                                            </Typography>
                                        </Grid>
                                        <Grid 
                                            item xs={12}
                                            alignItems="center"
                                        > 
                                            <Typography
                                                variant="h6"
                                                color="inherit"
                                                display='flex'
                                                sx={{mb:3}}
                                            >{t('Social. Stateless. Marketplace.')}</Typography>

                                        </Grid>
                                            
                                        <Grid>
                                            <Tooltip title={t('Search by mint address by entering: mint:address')}>
                                                <Paper
                                                    component="form"
                                                    onSubmit={handlePublicKeySubmit}
                                                    sx={{ m:2, p: 1, display: 'flex', alignItems: 'center', borderRadius: '24px' }}
                                                >    
                                                        <InputBase
                                                            fullWidth
                                                            sx={{ ml: 1, flex: 1 }}
                                                            placeholder={t('Enter a solana address')}
                                                            inputProps={{ 'aria-label': 'solana address' }}
                                                            value={newinputpkvalue}
                                                            onChange={(e) => setNewInputPKValue(e.target.value)}
                                                        />
                                                        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
                                                            <SearchIcon />
                                                        </IconButton>
                                                
                                                </Paper>
                                            </Tooltip>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </React.Fragment>
                        </>
                        }

                </Box>
            </Box>
        </React.Fragment>
    );
}
