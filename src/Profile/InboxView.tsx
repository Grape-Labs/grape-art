import React, { useEffect } from 'react';
import { DialectThemeProvider, Inbox } from '@dialectlabs/react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { ApiProvider, connected, DialectProvider, useApi } from '@dialectlabs/react';
import { GENSYSGO_RPC_ENDPOINT } from '../utils/grapeTools/constants';
import { Box } from '@mui/material';

function InnerInboxView() {
    const wallet = useWallet();
    const { setNetwork, setRpcUrl, setWallet } = useApi();
    const isWalletConnected = connected(wallet);

    useEffect(() => setWallet(isWalletConnected ? wallet : null), [setWallet, wallet, isWalletConnected]);
    useEffect(() => setNetwork('mainnet'), [setNetwork]);
    useEffect(() => setRpcUrl(GENSYSGO_RPC_ENDPOINT), [setRpcUrl]);

    return (
        <Box width="100%" height={550}>
            <Inbox dialectId="grape-inbox" wallet={wallet} />
        </Box>
    );
}

export default function InboxView() {
    return (
        <ApiProvider>
            <DialectProvider>
                <DialectThemeProvider theme="dark">
                    <InnerInboxView />
                </DialectThemeProvider>
            </DialectProvider>
        </ApiProvider>
    );
}
