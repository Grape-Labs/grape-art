import React from "react"
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { Link } from "react-router-dom";
import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import axios from "axios";

import { 
    tryGetName,
} from '@cardinal/namespaces';
import { getProfilePicture } from '@solflare-wallet/pfp';
import { findDisplayName } from '../name-service';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';

import { 
    GRAPE_RPC_ENDPOINT, 
    THEINDEX_RPC_ENDPOINT,
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
} from '@mui/material';

import {
    GRAPE_PROFILE,
    GRAPE_COLLECTIONS_DATA
} from '../grapeTools/constants';

import { ValidateCurve } from '../grapeTools/WalletAddress';

import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExploreIcon from '@mui/icons-material/Explore';
import PersonIcon from '@mui/icons-material/Person';

import { trimAddress } from "./WalletAddress";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
    const title = props.title || null;
    const type = props.type || 'address';
    const buttonStyle = props?.style || 'outlined';
    const buttonColor = props?.color || 'white';
    const hideTitle = props?.hideTitle || false;
    const fontSize = props?.fontSize || '14px';
    const grapeArtProfile = props?.grapeArtProfile || false;
    const shorten = props?.shorten || 0;
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const showSolanaProfile = props.showSolanaProfile || null;
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [hasProfilePicture, setHasProfilePicture] = React.useState(null);

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

                setSolanaDomain(cardinal_registration[0]);
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

    return (
        <>
            <Button
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                variant={buttonStyle}
                color='inherit'
                sx={{m:0,borderRadius:'17px',color:`${buttonColor}` }}
                startIcon={
                    <>
                        {profilePictureUrl ?
                            <Avatar alt={address} src={profilePictureUrl} sx={{ width: 30, height: 30, bgcolor: 'rgb(0, 0, 0)' }}>
                                {address.substr(0,2)}
                            </Avatar>
                        :
                            <ExploreIcon sx={{color:`${buttonColor}`,fontSize:`${fontSize}`}} />
                        }
                    </>
                }
            >
                <Typography sx={{color:`${buttonColor}`,fontSize:`${fontSize}`}}>
                    {title ?
                        <>{title}</>
                    :
                        <>
                            {!hideTitle &&
                                <>
                                    {solanaDomain ?
                                        <>{solanaDomain}</>
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
                    <Divider />
                    {grapeArtProfile && 
                        <>
                        {ValidateCurve(address) ?
                                <MenuItem 
                                    component={Link}
                                    to={`${GRAPE_PROFILE}${address}`}
                                    onClick={handleClose}>
                                        <ListItemIcon>
                                            <PersonIcon fontSize="small" />
                                        </ListItemIcon>
                                        Grape Profile
                                </MenuItem>
                        :
                            <Tooltip title='The address is off-curve (this address does not lie on a Ed25519 curve - typically a valid curve is generated when creating a wallet from a wallet adapter), the address here is off-curve and can be a program derived address like an a multi-sig or escrow'>
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
                        href={`https://explorer.solana.com/${type}/${address}`}
                        target='_blank'
                        onClick={handleClose}
                    >
                        <ListItemIcon>
                            <ExploreOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Explorer
                    </MenuItem>
                </StyledMenu>
            </Paper>
        </>
        
    ); 
}