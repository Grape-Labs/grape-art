import React, { useEffect } from 'react';
import { defaultVariables, DialectThemeProvider, Inbox } from '@dialectlabs/react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { ApiProvider, connected, DialectProvider, useApi } from '@dialectlabs/react';
import { GENSYSGO_RPC_ENDPOINT } from '../utils/grapeTools/constants';
import { Box } from '@mui/material';
import { ClassNames } from '@emotion/react';

function InnerInboxView({ wrapperClassName }: { wrapperClassName?: string }) {
    const wallet = useWallet();
    const { setNetwork, setRpcUrl, setWallet } = useApi();
    const isWalletConnected = connected(wallet);

    useEffect(() => setWallet(isWalletConnected ? wallet : null), [setWallet, wallet, isWalletConnected]);
    useEffect(() => setNetwork('localnet'), [setNetwork]);
    useEffect(() => setRpcUrl(GENSYSGO_RPC_ENDPOINT), [setRpcUrl]);

    return (
        <Box width="100%" height={550}>
            <Inbox dialectId="grape-inbox" wallet={wallet} wrapperClassName={wrapperClassName} />
        </Box>
    );
}

export default function InboxView() {
    return (
        <ApiProvider>
            <DialectProvider>
                <ClassNames>
                    {({ css }) => (
                        <DialectThemeProvider
                            theme="dark"
                            variables={{
                                dark: {
                                    colors: {
                                        bg: css({ backgroundColor: 'rgba(0, 0, 0, 0.6)' }),
                                        highlightSolid: css({
                                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                            svg: { marginTop: '2px' }, // small hack to move down Dialect logo in Powered by
                                        }),
                                    },
                                    textStyles: {
                                        header: css({ fontSize: 16, fontWeight: 800 }),
                                    },
                                    divider: css({ borderColor: 'rgba(255, 255, 255, 0.2)' }),
                                    header: `${defaultVariables.dark.header} dt-border-neutral-600`,
                                    outlinedInput: `${defaultVariables.dark.outlinedInput} ${css({
                                        fontFamily: 'inherit',
                                    })}`,
                                    input: `${defaultVariables.dark.input} ${css({ fontFamily: 'inherit' })}`,
                                },
                            }}
                        >
                            <InnerInboxView
                                wrapperClassName={css({
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    fontFamily: 'inherit',
                                })}
                            />
                        </DialectThemeProvider>
                    )}
                </ClassNames>
            </DialectProvider>
        </ApiProvider>
    );
}
