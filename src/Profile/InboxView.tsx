import {
    Backend,
    ChatNavigationHelpers,
    Config,
    DialectContextProvider,
    DialectThemeProvider,
    DialectUiManagementProvider,
    DialectWalletAdapter,
    Inbox as DialectInbox,
    ThemeProvider as DThemeProvider,
    useDialectUiId,
    BottomChat as DialectBottomChat,
  } from '@dialectlabs/react-ui';
  import { Box } from '@mui/material';
  import {
    useConnection,
    useWallet,
    WalletContextState,
  } from '@solana/wallet-adapter-react';
  import { useEffect, useMemo, useState } from 'react';
  import { Connection } from '@solana/web3.js';
  import { ClassNames } from '@emotion/react';
  import { getDialectVariables, GRAPE_INBOX_ID } from '../utils/ui-contants';
  
  import { DialectDappsIdentityResolver } from '@dialectlabs/identity-dialect-dapps';
  import { SNSIdentityResolver } from '@dialectlabs/identity-sns';
  import { CardinalTwitterIdentityResolver } from '@dialectlabs/identity-cardinal';
  import { GRAPE_RPC_ENDPOINT, TX_RPC_ENDPOINT, GENSYSGO_RPC_ENDPOINT } from '../utils/grapeTools/constants';

  const walletToDialectWallet = (
    wallet: WalletContextState
  ): DialectWalletAdapter => ({
    publicKey: wallet.publicKey!,
    connected:
      wallet.connected &&
      !wallet.connecting &&
      !wallet.disconnecting &&
      Boolean(wallet.publicKey),
    signMessage: wallet.signMessage,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    diffieHellman: wallet.wallet?.adapter?._wallet?.diffieHellman
      ? async (pubKey) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          return wallet.wallet?.adapter?._wallet?.diffieHellman(pubKey);
        }
      : undefined,
  });
  
  function InboxElement() {
    const { navigation } = useDialectUiId<ChatNavigationHelpers>('dialect-inbox');
  
    return (
        <ClassNames>
            {({ css }) => (
                <>
                    <DialectThemeProvider theme="dark" variables={getDialectVariables(css)}>
                        <Box width="100%" height={550}>
                        <DialectInbox
                            dialectId={GRAPE_INBOX_ID}
                            wrapperClassName={css({
                                width: '100%',
                                height: '100%',
                                borderRadius: 16,
                                overflow: 'hidden',
                                fontFamily:
                                    'GrapeFont, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
                                })}
                        />
                        </Box>

                    </DialectThemeProvider>
                </>
            )}
        </ClassNames>

    );
  }
  
  export default function InboxView(): JSX.Element {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [dialectWalletAdapter, setDialectWalletAdapter] = useState<DialectWalletAdapter>(() => walletToDialectWallet(wallet));
  
    useEffect(() => {
      setDialectWalletAdapter(walletToDialectWallet(wallet));
    }, [wallet]);
  
    const dialectConfig = useMemo(
      (): Config => ({
        backends: [Backend.DialectCloud, Backend.Solana],
        environment: 'production',
        dialectCloud: {
          tokenStore: 'local-storage',
        },
        solana: {
          rpcUrl: connection.rpcEndpoint,
        },
        identity: {
          resolvers: [
            new DialectDappsIdentityResolver(),
            new SNSIdentityResolver(new Connection(GENSYSGO_RPC_ENDPOINT)),
            new CardinalTwitterIdentityResolver(new Connection(GENSYSGO_RPC_ENDPOINT)),
          ],
        },
      }),
      [connection]
    );
  
    return (
      <DialectContextProvider
        wallet={dialectWalletAdapter}
        config={dialectConfig}
      >
        <DialectUiManagementProvider>
          <DThemeProvider theme={'dark'}>
            <InboxElement />
          </DThemeProvider>
        </DialectUiManagementProvider>
      </DialectContextProvider>
    );
  }