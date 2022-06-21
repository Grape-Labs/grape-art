import React, { useEffect } from 'react';
import { defaultVariables, DialectThemeProvider, Inbox } from '@dialectlabs/react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { ApiProvider, connected, DialectProvider, useApi } from '@dialectlabs/react';
import { GENSYSGO_RPC_ENDPOINT } from '../utils/grapeTools/constants';
import { Box } from '@mui/material';
import { ClassNames } from '@emotion/react';
import { getDialectVariables, GRAPE_INBOX_ID } from '../utils/ui-contants';

function InnerInboxView({ wrapperClassName }: { wrapperClassName?: string }) {
    const wallet = useWallet();
    const { setNetwork, setRpcUrl, setWallet } = useApi();
    const isWalletConnected = connected(wallet);

    useEffect(() => setWallet(isWalletConnected ? wallet : null), [setWallet, wallet, isWalletConnected]);
    useEffect(() => setNetwork('mainnet'), [setNetwork]);
    useEffect(() => setRpcUrl(GENSYSGO_RPC_ENDPOINT), [setRpcUrl]);

    return (
        <Box width="100%" height={550}>
            <Inbox dialectId={GRAPE_INBOX_ID} wallet={wallet} wrapperClassName={wrapperClassName} />
        </Box>
    );
}

export default function InboxView() {
    return (
        <ApiProvider>
            <DialectProvider>
                <ClassNames>
                    {({ css }) => (
                        <DialectThemeProvider theme="dark" variables={getDialectVariables(css)}>
                            <InnerInboxView
                                wrapperClassName={css({
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    fontFamily:
                                        'GrapeFont, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
                                })}
                            />
                        </DialectThemeProvider>
                    )}
                </ClassNames>
            </DialectProvider>
        </ApiProvider>
    );
}
