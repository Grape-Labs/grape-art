import React from "react"
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';

import { 
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';

import ExploreIcon from '@mui/icons-material/Explore';

import { trimAddress } from "./WalletAddress";

export default function ExplorerView(props:any){
    const address = props.address;
    const title = props.title || address;
    const type = props.type || 'address';
    const buttonStyle = props?.style || 'outlined';
    const buttonColor = props?.color || 'white';
    const hideTitle = props?.hideTitle || false;
    const fontSize = props?.fontSize || '14px';
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
                    sx={{borderRadius:'17px',color:`${buttonColor}` }}
                    startIcon={
                        <ExploreIcon sx={{color:`${buttonColor}`,fontSize:`${fontSize}`}} />
                    }
            >
                <Typography sx={{color:`${buttonColor}`,fontSize:`${fontSize}`}}>
                    {!hideTitle &&
                        <>
                            {(shorten && shorten > 0) ? 
                                trimAddress(title,shorten) : title
                            } 
                        </>
                    }
                </Typography>
            </Button>
            <Menu
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
                        Copy
                        
                    </MenuItem>
                </CopyToClipboard>
                <MenuItem 
                    component='a'
                    href={`https://explorer.solana.com/${type}/${address}`}
                    target='_blank'
                    onClick={handleClose}
                >
                    Explorer
                </MenuItem>
                <MenuItem 
                    component='a'
                    href={`https://solscan.io/${type === 'address' ? 'account' : type}/${address}`}
                    target='_blank'
                    onClick={handleClose}>
                        SolScan
                </MenuItem>
                <MenuItem 
                    component='a'
                    href={`https://solana.fm/${type}/${address}`}
                    target='_blank'
                    onClick={handleClose}>
                        Solana.FM
                </MenuItem>
            </Menu>
        </>
        
    ); 
}