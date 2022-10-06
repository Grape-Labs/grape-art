import React from "react"
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { Link } from "react-router-dom";

import { 
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
    GRAPE_PROFILE
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

    return (
        <>
            <Button
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                variant={buttonStyle}
                sx={{m:0,borderRadius:'17px',color:`${buttonColor}` }}
                startIcon={
                    <ExploreIcon sx={{color:`${buttonColor}`,fontSize:`${fontSize}`}} />
                }
            >
                <Typography sx={{color:`${buttonColor}`,fontSize:`${fontSize}`}}>
                    {title ?
                        <>{title}</>
                    :
                        <>
                            {!hideTitle &&
                                <>
                                    {(shorten && shorten > 0) ? 
                                        trimAddress(address,shorten) : address
                                    } 
                                </>
                            }
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