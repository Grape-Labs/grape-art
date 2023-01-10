import React, { useEffect, Suspense, useCallback } from "react";
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { AnchorWallet, useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';

import {
    Typography,
    Grid,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    TextField,
    InputLabel,
    Select,
    MenuItem,
    FormLabel,
    FormControlLabel,
    Radio,
    RadioGroup,
    IconButton,
    Container,
    Skeleton,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Tooltip,
    SwipeableDrawer,
    CssBaseline,
    Tab,
    Hidden,
    Badge,
    LinearProgress,
    CircularProgress,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import { GRAPE_RPC_ENDPOINT } from '../../utils/grapeTools/constants';

const Input = styled('input')({
    display: 'none',
});

LinearProgressWithLabel.propTypes = {
    /**
     * The value of the progress indicator for the determinate and buffer variants.
     * Value between 0 and 100.
     */
    value: PropTypes.number.isRequired,
};

function LinearProgressWithLabel(props:any) {
    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress color="inherit" variant="determinate" {...props} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(
                props.value,
                )}%`}</Typography>
            </Box>
            </Box>
            <Box sx={{ alignItems: 'center', textAlign: 'center', mt:-2}}>
                <Typography variant="caption">
                    storage used
                </Typography>
            </Box>
        </>
    );
  }
  
export function SwapView(props: any){
    const setLoadingPosition = props.setLoadingPosition;
    const { connection } = useConnection();
    const [loadingSwap, setLoadingSwap] = React.useState(false);
    const { publicKey, wallet } = useWallet();
    
    const initJupiter = () => {
        if (wallet) {
            window?.Jupiter.init({
            mode: 'default',        
            displayMode: 'integrated',
            integratedTargetId: 'integrated-terminal',
            endpoint:GRAPE_RPC_ENDPOINT,
            passThroughWallet: wallet,
          });
        }
    }; 

    React.useEffect(() => {
        if (wallet){
            initJupiter();
        }
    }, [wallet]);

    return (
        <>
            {/*
            <Button
                variant="outlined"
                onClick={initJupiter}
                sx={{textTransform:'none'}}
            >Open Swap</Button>
            */}
            <Grid id='integrated-terminal'
                sx={{minHeight:'90vh',zIndex: 100}}
            ></Grid>
        </>
    )
}