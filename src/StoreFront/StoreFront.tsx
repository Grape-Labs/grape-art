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

import {
    METAPLEX_PROGRAM_ID,
} from '../utils/auctionHouse/helpers/constants';

import { GRAPE_RPC_ENDPOINT, VERIFIED_COLLECTION_ARRAY, GRAPE_PREVIEW, GRAPE_PROFILE, GRAPE_IDENTITY, FEATURED_DAO_ARRAY } from '../utils/grapeTools/constants';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';

import GalleryView from '../Profile/GalleryView';

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
    const [ thisCollection, setThisCollection] = React.useState(props.thisCollection || null);
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
                    TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST 
                </Container>
            </Grid>
        );
    }
}

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
    //const [provider, setProvider] = React.useState(getParam('provider'));
    const [gallery, setGallery] = React.useState(null);
    const [collectionMintList, setCollectionMintList] = React.useState(null);
    const [collectionAuthority, setCollectionAuthority] = React.useState(null);
    const [wallet_collection_meta, setCollectionMeta] = React.useState(null);
    const [final_collection, setCollectionMetaFinal] = React.useState(null);
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
    
    const fetchMintList = async(address:string) => {
        try{
            const url = './'+address+'.json';
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                }
              });
              const string = await response.text();
              const json = string === "" ? {} : JSON.parse(string);
              console.log(JSON.stringify(json));
              setCollectionMintList(json);   
              return json;
            
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

    React.useEffect(() => { 
        if (collectionAuthority){
            console.log("with collectionAuthority: "+JSON.stringify(collectionAuthority));
            //if (ValidateAddress(collectionAuthority.address)){
                if (collectionMintList)
                    getCollectionMeta(0);
            //}
        }
    }, [collectionMintList]);

    React.useEffect(() => { 
        
        if (withPubKey){
            console.log("using: "+withPubKey)
            
            // check if this is a valid address using VERIFIED_COLLECTION_ARRAY
            // check both .name and .address
            for (var verified of VERIFIED_COLLECTION_ARRAY){
                //if (verified.address === mintOwner){
                if (verified.address === withPubKey){
                    setCollectionAuthority(verified);
                    // get collection mint list
                    const fml = fetchMintList(verified.address);
                } else if (verified.name.replaceAll("\\s", "").toLowerCase().localeCompare(withPubKey.replaceAll("\\s", "").toLowerCase())){ // REMOVE SPACES FROM verified.name
                    setCollectionAuthority(verified);
                    // get collection mint list
                    const fml = fetchMintList(verified.address);
                }
            } 

            // IMPORTANT HANDLE INVALID COLLECTION ENTRY

            /*
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
                    console.log("Nothing sent reverting to default profile");
                    navigate({
                        pathname: '/profile'
                    },
                        { replace: true }
                    );
                }
            }*/
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
        if((loading)){
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
                    mb:4,
                    mt:0,
                    ml:0,
                    mr:0,
                    width:'100%',
                }}
                >
                    <Box>
                        <img
                            src={`solbears/bearssplash.png`}
                            srcSet={`solbears/bearssplash.png`}
                            alt='Bears Reloaded'
                            //onClick={ () => openImageViewer(0) }
                            loading="lazy"
                            height="auto"
                            style={{
                                width:'100%',
                                borderBottomRightRadius:'24px',
                                borderBottomLeftRadius:'24px',
                            }}
                        />
                    </Box>
                    

                    <Box
                        className='grape-store-info'
                        sx={{
                            m:10,
                            mb:4,
                            mt:-12,
                            p:1,
                            textAlign:'center',
                            borderRadius:'24px'
                        }}
                    >

                        <img
                            src={`solbears/bearlogo1000px.png`}
                            srcSet={`solbears/bearlogo1000px.png`}
                            alt='Bears Reloaded'
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
                                Bears Reloaded
                            </Typography>

                            <Typography variant="h6">
                                The Sanctuary
                            </Typography>
                        </Box>
                        
                        <Grid container spacing={0.5}>
                            <Grid item xs={12} sm={12} md={4} key={1}>
                                <Box
                                    className='grape-store-stat-item'
                                    sx={{borderRadius:'24px',m:2,p:2}}
                                >
                                    <Typography variant="body2" sx={{color:'yellow'}}>
                                        ITEMS
                                    </Typography>
                                    <Typography variant="subtitle2">
                                        10k
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={4} key={1}>
                                <Box
                                    className='grape-store-stat-item'
                                    sx={{borderRadius:'24px',m:2,p:2}}
                                >
                                    <Typography variant="body2" sx={{color:'yellow'}}>
                                        OWNERS
                                    </Typography>
                                    <Typography variant="subtitle2">
                                        5.5k
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={4} key={1}>
                                <Box
                                    className='grape-store-stat-item'
                                    sx={{borderRadius:'24px',m:2,p:2}}
                                >
                                    <Typography variant="body2" sx={{color:'yellow'}}>
                                        VOLUME
                                    </Typography>
                                    <Typography variant="subtitle2">
                                        80k SOL
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
            </Box>
            <Box
                sx={{
                    
                }}
            >
                <Box>  
                    {collectionMintList &&
                        <GalleryView mode={1} collectionMintList={collectionMintList}/>
                    }

                    {/*wallet_collection_meta && final_collection &&
                        <GalleryView mode={0} finalCollection={final_collection} walletCollection={wallet_collection_meta} />
                    */}

                </Box>
            </Box>
        </React.Fragment>
    );
}
