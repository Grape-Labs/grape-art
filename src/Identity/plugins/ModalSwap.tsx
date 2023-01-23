import React, { useEffect, Suspense, useCallback } from "react";
import { AnchorWallet, useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getPlatformFeeAccounts } from '@jup-ag/core';
import { PublicKey } from '@solana/web3.js';

import {
    Button,
} from '@mui/material';

import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import { GRAPE_RPC_ENDPOINT } from '../../utils/grapeTools/constants';
  
export default function ModalSwapView(props: any){
    const refreshCallback = props.refreshCallback;
    const setLoadingPosition = props?.setLoadingPosition;
    const { connection } = useConnection();
    const [loadingSwap, setLoadingSwap] = React.useState(false);
    const { publicKey, wallet } = useWallet();
    const swapfrom = props?.swapfrom;
    const swapto = props?.swapto;
    const toTokenLabel = props?.toTokenLabel
    const [platformFeeAndAccounts, setPlatformFeeAndAccounts] = React.useState(null);
    
    const fetchPlatformFeeAndAccounts = async () => {
        const pfaa = {
            feeBps: 10,
            feeAccounts: await getPlatformFeeAccounts(
                connection,
                new PublicKey('9Y1EEuwtxk2JTe8TkvxMfA27A9sY4WVbymroSd5upGiW') // The platform fee account owner
            ) // map of mint to token account pubkey
        }

        setPlatformFeeAndAccounts(pfaa)
    }

    const initJupiter = () => {
        fetchPlatformFeeAndAccounts();
        
        if (wallet) {
            window?.Jupiter.init({
                mode: 'default',        
                displayMode: 'modal',
                mint: swapto,
                endpoint:GRAPE_RPC_ENDPOINT,
                passThroughWallet: wallet,
                //platformFeeAndAccounts,
                containerStyles: {height: 500,zIndex:1},
                onSuccess: ({ txid }) => {
                    try{
                        console.log('onSuccess', txid);
                        if (refreshCallback)
                            refreshCallback();
                    }catch(err:any){console.log("ERR: "+err)}
                }
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