import React, { useEffect, Suspense, useCallback } from "react";
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { AnchorWallet, useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';

import {
    Typography,
    Grid,
    Box,
    Button,
    LinearProgress,
} from '@mui/material';

import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import { GRAPE_RPC_ENDPOINT } from '../../utils/grapeTools/constants';
  
export default function ModalSwapView(props: any){
    const setLoadingPosition = props?.setLoadingPosition;
    const [loadingSwap, setLoadingSwap] = React.useState(false);
    const { publicKey, wallet } = useWallet();
    const swapfrom = props?.swapfrom;
    const swapto = props?.swapto;
    const toTokenLabel = props?.toTokenLabel
    
    const initJupiter = () => {
        if (wallet) {
            window?.Jupiter.init({
            mode: 'default',        
            displayMode: 'modal',
            mint: swapto,
            endpoint:GRAPE_RPC_ENDPOINT,
            passThroughWallet: wallet,
            containerStyles: {height: 500},
          });
        }
    }; 

    return (
        <>
            <Button
                variant="outlined"
                color='inherit'
                onClick={initJupiter}
                size="small"
                sx={{borderRadius:'17px',mr:1}}
            > Swap <SwapHorizIcon /> {toTokenLabel}</Button>
            
        </>
    )
}