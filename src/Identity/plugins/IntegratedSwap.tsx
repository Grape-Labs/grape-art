import React, { useEffect, Suspense, useCallback } from "react";
import { AnchorWallet, useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getPlatformFeeAccounts } from '@jup-ag/core';
import { PublicKey } from '@solana/web3.js';

import {
    Grid,
    LinearProgress,
} from '@mui/material';

import { GRAPE_RPC_ENDPOINT } from '../../utils/grapeTools/constants';

export function IntegratedSwapView(props: any){
    const refreshCallback = props.refreshCallback;
    const setLoadingPosition = props.setLoadingPosition;
    const { connection } = useConnection();
    const [loadingSwap, setLoadingSwap] = React.useState(false);
    const { publicKey, wallet } = useWallet();
    
    /*
    const platformFeeAndAccounts = {
        feeBps: 10,
        feeAccounts: await getPlatformFeeAccounts(
        connection,
        new PublicKey('9Y1EEuwtxk2JTe8TkvxMfA27A9sY4WVbymroSd5upGiW') // The platform fee account owner
        ) // map of mint to token account pubkey
    }*/

    const initJupiter = () => {
        if (wallet) {
            window?.Jupiter.init({
                mode: 'default',        
                displayMode: 'integrated',
                integratedTargetId: 'integrated-terminal',
                endpoint:GRAPE_RPC_ENDPOINT,
                passThroughWallet: wallet,
                //platformFeeAndAccounts,
                containerStyles: {minHeight: 500},
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
            >
            </Grid>
        </>
    )
}