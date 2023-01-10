import React, { useEffect, Suspense, useCallback } from "react";
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { AnchorWallet, useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';

import {
    Typography,
    Grid,
    Box,
    LinearProgress,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import { GRAPE_RPC_ENDPOINT } from '../../utils/grapeTools/constants';
  
export function IntegratedSwapView(props: any){
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
            containerStyles: {height: 500},
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