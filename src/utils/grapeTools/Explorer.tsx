import React from "react"
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { Link } from "react-router-dom";
import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import axios from "axios";
import QRCode from "react-qr-code";

import { 
    tryGetName,
} from '@cardinal/namespaces';
import { getProfilePicture } from '@solflare-wallet/pfp';
import { findDisplayName } from '../name-service';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';

import { 
    RPC_CONNECTION,
    TWITTER_PROXY } from './constants';

import { 
    Avatar,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Paper,
    Divider,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Grid,
} from '@mui/material';

import {
    GRAPE_PREVIEW,
    GRAPE_PROFILE,
    GRAPE_IDENTITY,
    GRAPE_COLLECTIONS_DATA,
    SHYFT_KEY,
} from '../grapeTools/constants';

import { decodeMetadata } from '../grapeTools/utils';

import { ValidateCurve } from '../grapeTools/WalletAddress';

import SolIcon from '../../components/static/SolIcon';
import SolCurrencyIcon from '../../components/static/SolCurrencyIcon';

import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import TwitterIcon from '@mui/icons-material/Twitter';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExploreIcon from '@mui/icons-material/Explore';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { trimAddress } from "./WalletAddress";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface DialogTitleProps {
    id: string;
    children?: React.ReactNode;
    onClose: () => void;
  }
  
const BootstrapDialogTitle = (props: DialogTitleProps) => {
    const { children, onClose, ...other } = props;
  
    return (
      <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
        {children}
        {onClose ? (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
    );
};

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
    '& .MuiMenu-root': {
    },
    '& .MuiMenu-paper': {
        backgroundColor:'rgba(0,0,0,0.95)',
        borderRadius:'17px'
    },
}));

export default function ExplorerView(props:any){
    const address = props.address;
    //const [address, setAddress] = React.useState(props.address);
    const title = props.title || null;
    const showAddress = props.showAddress || false;
    const type = props.type || 'address';
    const buttonStyle = props?.style || 'outlined';
    const buttonColor = props?.color || 'white';
    const hideTitle = props?.hideTitle || false;
    const fontSize = props?.fontSize || '14px';
    const useLogo = props?.useLogo || null;
    const grapeArtProfile = props?.grapeArtProfile || false;
    const shorten = props?.shorten || 0;
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const showSolanaProfile = props.showSolanaProfile || null;
    const showNftData = props.showNftData || null;
    const showSolBalance = props.showSolBalance || null;
    const connection = RPC_CONNECTION;
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [hasSolanaDomain, setHasSolanaDomain] = React.useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [twitterRegistration, setTwitterRegistration] = React.useState(null);
    const [hasProfilePicture, setHasProfilePicture] = React.useState(null);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [solBalance, setSolBalance] = React.useState(null);

    const handleClickOpenDialog = (event:any) => {
        setOpenDialog(true);
    };
    const handleCloseDialog = () => {
        setOpenDialog(false);
        handleClose();
    };

    const handleClick = (event:any) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [open_snackbar, setSnackbarState] = React.useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const handleCopyClick = () => {
        enqueueSnackbar(`Copied!`,{ variant: 'success' });
        handleClose();
    };

    const fetchSolBalance = async() => {
        try{
            const balance = await connection.getBalance(new PublicKey(address));
            const adjusted_balance = +(balance/(10 ** 9)).toFixed(3)
            console.log("balance: "+adjusted_balance)
            setSolBalance(adjusted_balance);
        }catch(e){
            console.log("ERR: "+e);
        }
    }

    const fetchTokenData = async() => {
        try{
            const uri = `https://rpc.shyft.to/?api_key=${SHYFT_KEY}`;

            const response = await fetch(uri, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'rpc-id',
                    method: 'getAsset',
                    params: {
                    id: address
                    },
                }),
                });
            const { result } = await response.json();
            //console.log("Asset: ", result);

            if (result){
                if (result?.content?.metadata?.name){
                    setSolanaDomain(result?.content?.metadata?.name);
                }
                const image = result?.content?.links?.image;
                
                if (image){
                    if (image){
                        setProfilePictureUrl(image);
                        setHasProfilePicture(true);
                    }
                }
            } else {

                const MD_PUBKEY = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
                const [pda, bump] = await PublicKey.findProgramAddress(
                    [Buffer.from('metadata'), MD_PUBKEY.toBuffer(), new PublicKey(address).toBuffer()],
                    MD_PUBKEY
                );
                
                const tokendata = await connection.getParsedAccountInfo(new PublicKey(pda));

                if (tokendata){
                    //console.log("tokendata: "+JSON.stringify(tokendata));
                    const buf = Buffer.from(tokendata.value.data, 'base64');
                    const meta_final = decodeMetadata(buf);
                    
                    if (meta_final?.data?.name){
                        setSolanaDomain(meta_final.data.name);
                        if (meta_final.data?.uri){
                            const urimeta = await window.fetch(meta_final.data.uri).then((res: any) => res.json());
                            const image = urimeta?.image;
                            if (image){
                                setProfilePictureUrl(image);
                                setHasProfilePicture(true);
                            }
                        }
                    }
                    //console.log("meta_final: "+JSON.stringify(meta_final));
                }
            }
        }catch(e){
            console.log("ERR: "+e)
        }
    }

    const fetchProfilePicture = async () => {
        //setLoadingPicture(true);  
            try{
                const { isAvailable, url } = await getProfilePicture(connection, new PublicKey(address));
                
                let img_url = url;
                if (url)
                    img_url = url.replace(/width=100/g, 'width=256');
                setProfilePictureUrl(img_url);
                setHasProfilePicture(isAvailable);
                //countRef.current++;
            }catch(e){
                console.log("ERR: "+e)
            }
        //setLoadingPicture(false);
    }

    const fetchSolanaDomain = async () => {
        console.log("fetching tryGetName: "+address);
        setTwitterRegistration(null);
        setHasSolanaDomain(false);
        let found_cardinal = false;
        //const cardinalResolver = new CardinalTwitterIdentityResolver(ggoconnection);
        try{
            //const cardinal_registration = await cardinalResolver.resolve(new PublicKey(address));
            //const identity = await cardinalResolver.resolveReverse(address);
            //console.log("identity "+JSON.stringify(cardinal_registration))
            const cardinal_registration = await tryGetName(
                connection, 
                new PublicKey(address)
            );
            
            if (cardinal_registration){
                found_cardinal = true;
                console.log("cardinal_registration: "+JSON.stringify(cardinal_registration));
                setHasSolanaDomain(true);
                setSolanaDomain(cardinal_registration[0]);
                setTwitterRegistration(cardinal_registration[0]);
                const url = `${TWITTER_PROXY}https://api.twitter.com/2/users/by&usernames=${cardinal_registration[0].slice(1)}&user.fields=profile_image_url,public_metrics`;
                const response = await axios.get(url);
                //const twitterImage = response?.data?.data[0]?.profile_image_url;
                if (response?.data?.data[0]?.profile_image_url){
                    setProfilePictureUrl(response?.data?.data[0]?.profile_image_url);
                    setHasProfilePicture(true);
                }
            }
        }catch(e){
            console.log("ERR: "+e);
        }

        if (!found_cardinal){
            const domain = await findDisplayName(connection, address);
            if (domain) {
                if (domain[0] !== address) {
                    setHasSolanaDomain(true);
                    setSolanaDomain(domain[0]);
                }
            }
        }
    };

    function GetEscrowName(props:any){
        const thisAddress = props.address;
        const [escrowName, setEscrowName] = React.useState(null);
      
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

                  for (let itemAuctionHouse of json){
                    //console.log("itemAuctionHouse: " + itemAuctionHouse.address + " vs " + thisAddress)
                    if (itemAuctionHouse.address === thisAddress){
                      setEscrowName(itemAuctionHouse.name);
                    }
                  }
                
                return json;
            } catch(e){
                console.log("ERR: "+e)
                return null;
            }
        }
        
        React.useEffect(() => {   
            if (thisAddress)
                fetchVerifiedAuctionHouses();
        }, [thisAddress]);
          
        return (
            <>
                {escrowName && <Typography variant='caption' sx={{ml:1}}>({escrowName})</Typography>}
            </>
        );
    }

    React.useEffect(() => {   
        if (showSolanaProfile){

            {(shorten && shorten > 0) ? 
                setSolanaDomain(trimAddress(address,shorten))
            : 
                setSolanaDomain(address)
            } 

            setHasProfilePicture(null);
            setProfilePictureUrl(null);

            fetchProfilePicture();
            fetchSolanaDomain();
        }
    }, [showSolanaProfile, address]);

    React.useEffect(() => {   
        if (showNftData){
            fetchTokenData()
        }
    }, [showNftData, address]);

    React.useEffect(() => {   
        if (showSolBalance){
            fetchSolBalance()
        }
    }, [showSolBalance, address]);

    return (
        <>
            <Button
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                variant={buttonStyle}
                color='inherit'
                sx={{m:0,borderRadius:'17px',color:`${buttonColor}`, textTransform:'none' }}
                startIcon={
                    <>
                        {profilePictureUrl ?
                            <Avatar alt={address} src={profilePictureUrl} sx={{ width: 30, height: 30, bgcolor: 'rgb(0, 0, 0)' }}>
                                {address.substr(0,2)}
                            </Avatar>
                        :
                            <>
                            {useLogo ?
                                <Avatar alt={address} src={useLogo} sx={{ width: 30, height: 30, bgcolor: 'rgb(0, 0, 0)' }}>
                                    {address.substr(0,2)}
                                </Avatar>
                            :
                                <ExploreIcon sx={{color:`${buttonColor}`,fontSize:`${fontSize}`}} />
                            }
                            </>
                        }
                    </>
                }
            >
                <Typography sx={{color:`${buttonColor}`,fontSize:`${fontSize}`,textAlign:'left'}}>
                    {title ?
                        <>{title.length > 30 ? trimAddress(title,5) : title }</>
                    :
                        <>
                            {!hideTitle &&
                                <>
                                    {solanaDomain ?
                                        <>
                                            {solanaDomain}
                                            {showAddress && hasSolanaDomain &&
                                            <><br/><Typography variant='caption' sx={{textTransform:'none'}}>{(shorten && shorten > 0) ? trimAddress(address,shorten) : address}</Typography></>}
                                        </>
                                    :
                                    <>
                                    {(shorten && shorten > 0) ? 
                                        trimAddress(address,shorten) : address
                                    }
                                    </>
                                    }
                                </>
                            }
                        </>
                    }
                    
                    {address && type === 'address' && !ValidateCurve(address) &&
                        <>
                            <GetEscrowName address={address} />
                        </>
                    }
                    
                </Typography>
            </Button>
            <Paper sx={{backgroundColor:'rgba(255,255,255,0.5)'}}>
                <StyledMenu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                        'aria-labelledby': 'basic-button',
                    }}
                    sx={{
                    }}
                >
                    <CopyToClipboard 
                            text={address} 
                            onCopy={handleCopyClick}
                        >
                        <MenuItem 
                            onClick={handleClose}
                        >

                            <ListItemIcon>
                                <ContentCopyIcon fontSize="small" />
                            </ListItemIcon>
                            Copy
                        </MenuItem>
                    </CopyToClipboard>
                    {grapeArtProfile &&
                        <>
                        <Divider />
                        <MenuItem 
                            onClick={handleClickOpenDialog}>
                                <ListItemIcon>
                                    <QrCode2Icon fontSize="small" />
                                </ListItemIcon>
                                QR Code
                        </MenuItem>

                        <BootstrapDialog
                            onClose={handleCloseDialog}
                            aria-labelledby="customized-dialog-title"
                            open={openDialog}
                            PaperProps={{
                                style: {
                                    boxShadow: '3',
                                    borderRadius: '17px',
                                    },
                                }}
                        >
                            <DialogContentText id="alert-dialog-description">
                                <div style={{ height: "auto", margin: "0 auto", maxWidth: "100%", width: "100%", borderRadius: "10px", padding:10, backgroundColor:'#fff' }}>
                                    <QRCode
                                    size={256}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={address}
                                    viewBox={`0 0 256 256`}
                                    />
                                </div>

                                <Grid container>
                                    <Grid item xs={12} textAlign={'center'}>
                                        <Typography variant='body2'>{address}</Typography>
                                    </Grid>
                                    <Grid item xs={12} textAlign={'center'}>
                                        <Typography variant='caption'>Send to this SOL Address</Typography>
                                    </Grid>
                                </Grid>
                                
                            </DialogContentText>
                        </BootstrapDialog>
                        
                        </>
                    }
                    <Divider />
                    
                    {showNftData &&
                        <>
                            <MenuItem 
                                component={Link}
                                to={`${GRAPE_PREVIEW}${address}`}
                                onClick={handleClose}>
                                    <ListItemIcon>
                                        <ImageIcon fontSize="small" />
                                    </ListItemIcon>
                                    Grape Preview
                            </MenuItem>
                            <Divider />
                        </>
                    }
                    
                    {grapeArtProfile && 
                        <>
                        {ValidateCurve(address) ?
                                <>
                                {/*
                                <MenuItem 
                                    component={Link}
                                    to={`${GRAPE_PROFILE}${address}`}
                                    onClick={handleClose}>
                                        <ListItemIcon>
                                            <ImageIcon fontSize="small" />
                                        </ListItemIcon>
                                        Grape Profile
                                </MenuItem>
                                */}
                                <MenuItem 
                                    //component={Link}
                                    //to={`${GRAPE_IDENTITY}${address}`}
                                    component='a'
                                    href={`https://grape.art/${GRAPE_IDENTITY}${address}`}
                                    onClick={handleClose}>
                                        <ListItemIcon>
                                            <AccountBalanceWalletIcon fontSize="small" />
                                        </ListItemIcon>
                                        Grape Wallet
                                </MenuItem>

                            {solBalance &&
                            <>
                                <Tooltip title="SOL balance in wallet">
                                    <MenuItem>
                                            <ListItemIcon>
                                                <SubdirectoryArrowRightIcon sx={{color:'#555'}} />
                                            </ListItemIcon>
                                            <SolCurrencyIcon sx={{color:'white',mr:1,fontSize:'12px'}} />{solBalance}
                                    </MenuItem>
                                </Tooltip>
                            </>
                            }

                            <Divider/>
                            </>
                        :
                            <Tooltip title='The address is off-curve (this address does not lie on a Ed25519 curve - typically a valid curve is generated when creating a new wallet), the address here is off-curve and can be a program derived address (PDA) like a multi-sig or escrow'>
                                <MenuItem >
                                    <ListItemIcon>
                                        <WarningAmberIcon sx={{ color: 'yellow' }} fontSize="small" />
                                    </ListItemIcon>
                                    Off-Curve
                                </MenuItem>
                            </Tooltip>
                        }
                        </>
                    }
                    
                    <MenuItem 
                        component='a'
                        href={`https://translator.shyft.to/${type === 'address' ? 'address' : 'tx'}/${address}`}
                        target='_blank'
                        onClick={handleClose}>
                            <ListItemIcon>
                                <ExploreOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            Shyft
                    </MenuItem>
                    <MenuItem 
                        component='a'
                        href={`https://solscan.io/${type === 'address' ? 'account' : type}/${address}`}
                        target='_blank'
                        onClick={handleClose}>
                            <ListItemIcon>
                                <ExploreOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            SolScan
                    </MenuItem>
                    <MenuItem 
                        component='a'
                        href={`https://solana.fm/${type}/${address}`}
                        target='_blank'
                        onClick={handleClose}>
                            <ListItemIcon>
                                <ExploreOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            SolanaFM
                    </MenuItem>
                    <MenuItem 
                        component='a'
                        href={`https://solanabeach.io/${type === 'address' ? 'address' : 'transaction'}/${address}`}
                        target='_blank'
                        onClick={handleClose}>
                            <ListItemIcon>
                                <ExploreOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            Solana Beach
                    </MenuItem>
                    <MenuItem 
                        component='a'
                        href={`https://explorer.solana.com/${type}/${address}`}
                        target='_blank'
                        onClick={handleClose}
                    >
                        <ListItemIcon>
                            <ExploreOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Explorer
                    </MenuItem>
                    <MenuItem 
                        component='a'
                        href={`https://xray.helius.xyz/${type === 'address' ? 'account' : 'tx'}/${address}`}
                        target='_blank'
                        onClick={handleClose}>
                            <ListItemIcon>
                                <ExploreOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            XRay
                    </MenuItem>

                   

                    {twitterRegistration &&
                        <>
                            <Divider />
                            <MenuItem 
                                component='a'
                                href={`https://twitter.com/${twitterRegistration}`}
                                target='_blank'
                                onClick={handleClose}>
                                    <ListItemIcon>
                                        <TwitterIcon fontSize="small" />
                                    </ListItemIcon>
                                    Twitter
                            </MenuItem>
                        </>
                    }

                </StyledMenu>
            </Paper>
        </>
        
    ); 
}