import ReactXnft, { AnchorDom, View, Text } from "react-xnft";
import React, { FC, ReactNode, useCallback, useMemo, Suspense, lazy, Component } from 'react';
import { styled, ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
//import { LogView } from "./Log/Log";

import { inject } from '@vercel/analytics';

import { MyCollectionsView } from "./MyCollections/MyCollections";
import { ProfileView } from './Profile/Profile';
import { PreviewView } from './Preview/Preview';
import { FeaturedView } from './Featured/Featured';
import { IdentityView } from './Identity/Identity';
import { StorageView } from './Identity/plugins/Storage';

//import FeedView from './Profile/FeedView';
/*
const ProfileView = lazy(() => import('./Profile/Profile'));
const PreviewView = lazy(() => import('./Preview/Preview'));
const FeaturedView = lazy(() => import('./Featured/Featured'));
const IdentityView = lazy(() => import('./Identity/Identity'));
*/
//import { SplashView } from './Splash/Splash';
import { StoreFrontView } from './StoreFront/StoreFront';
//import { MessagesView } from './Messages/Messages';
//import { NotificationsView } from "./NotificationsTest/NotificationsTest";
import CssBaseline from '@mui/material/CssBaseline';

//import STATIC_APPLE_TOUCH from './public/apple-touch-icon.png';
//import STATIC_FAVICON_32x32 from './public/favicon-32x32.png';
//import STATIC_FAVICON_16x16 from './public/favicon-16x16.png';
//import STATIC_GRAPEDEX from './public/grapedex.png';

import './dialect.css';

import { Box, Grid, Paper, Container, Typography, AppBar } from '@mui/material';

import Header from './Header/Header';
import { SnackbarProvider } from 'notistack';
import {
    ConnectionProvider,
    useConnection,
    WalletProvider,
    useWallet,
    WalletContextState,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { Connection } from '@solana/web3.js';
//import { Helmet } from 'react-helmet';
//import { useSnackbar } from 'notistack';

//import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';

import { useTranslation } from 'react-i18next';

//import { WalletDialogProvider, WalletDisconnectButton, WalletMultiButton } from '../WalletAdapterMui';

import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    GlowWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    BackpackWalletAdapter,
    WalletConnectWalletAdapter,
    SlopeWalletAdapter,
    SolletWalletAdapter,
    BraveWalletAdapter,
    TorusWalletAdapter,
    CloverWalletAdapter,
    MathWalletAdapter,
    CoinbaseWalletAdapter,
    //MagicEdenWalletAdapter,
    Coin98WalletAdapter,
    //SolongWalletAdapter,
    //BitKeepWalletAdapter,
    //TokenPocketWalletAdapter,
    //BitpieWalletAdapter,
    //SafePalWalletAdapter,
    ExodusWalletAdapter,
    NightlyWalletAdapter,
    SpotWalletAdapter,
    UnsafeBurnerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { CrossmintSolanaWalletAdapter, networkToCrossmintEnvironment } from "@crossmint/connect"

//import { mainListItems, secondaryListItems } from './components/SidebarList/SidebarList';
import grapeTheme from './utils/config/theme';
//import "./App.less";
import { GRAPE_RPC_ENDPOINT, TX_RPC_ENDPOINT, GENSYSGO_RPC_ENDPOINT } from './utils/grapeTools/constants';
import {
    BottomChat as DialectBottomChat,
    DialectUiManagementProvider,
    DialectContextProvider,
    DialectThemeProvider,
    DialectWalletAdapter,
    useDialectUiId,
    ThemeProvider as DThemeProvider,
    Config,
    ChatNavigationHelpers,
    Backend,
} from '@dialectlabs/react-ui';
import { DialectDappsIdentityResolver } from '@dialectlabs/identity-dialect-dapps';
import { SNSIdentityResolver } from '@dialectlabs/identity-sns';
import { CardinalTwitterIdentityResolver } from '@dialectlabs/identity-cardinal';

import { getDialectVariables, GRAPE_BOTTOM_CHAT_ID } from './utils/ui-contants';
import { ClassNames } from '@emotion/react';

const walletToDialectWallet = (wallet: WalletContextState): DialectWalletAdapter => ({
    publicKey: wallet.publicKey,
    connected: wallet.connected && !wallet.connecting && !wallet.disconnecting && Boolean(wallet.publicKey),
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

function DialectProviders({ children }: { children: ReactNode }): JSX.Element {
    const connection = new Connection(GENSYSGO_RPC_ENDPOINT);
    const wallet = useWallet();
    const [dialectWalletAdapter, setDialectWalletAdapter] = React.useState<DialectWalletAdapter>(() =>
        walletToDialectWallet(wallet)
    );

    React.useEffect(() => {
        inject();
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
        <DialectContextProvider wallet={dialectWalletAdapter} config={dialectConfig}>
            <DialectUiManagementProvider>{children}</DialectUiManagementProvider>
        </DialectContextProvider>
    );
}

function BottomChatElement() {
    const { navigation } = useDialectUiId<ChatNavigationHelpers>('dialect-inbox');

    return (
        <ClassNames>
            {({ css }) => (
                <>
                    <Container
                        sx={{
                            zIndex: 'tooltip',
                        }}
                    >
                        <DialectThemeProvider variables={getDialectVariables(css, 'popup')} theme="dark">
                            <DialectBottomChat dialectId={GRAPE_BOTTOM_CHAT_ID} />
                        </DialectThemeProvider>
                    </Container>
                </>
            )}
        </ClassNames>
    );
}

function Copyright(props: any): JSX.Element {
    const { t, i18n } = useTranslation();
    return (
        <Typography sx={{ background: 'transparent' }} variant="body2" color="text.secondary" align="center" {...props}>
            {t('Powered by Grape on Solana')}
        </Typography>
    );
}

function DashboardContent() {
    const [open, setOpen] = React.useState(true);
    const toggleDrawer = () => {
        setOpen(!open);
    };

    // You can also provide a custom RPC endpoint
    const network = WalletAdapterNetwork.Mainnet; //.Devnet;
    // You can also provide a custom RPC endpoint
    //const endpoint =  useMemo(() => clusterApiUrl(network), [network]); // GRAPE_RPC_ENDPOINT;
    //const endpoint =  GRAPE_RPC_ENDPOINT;
    const endpoint = TX_RPC_ENDPOINT;
    const wallets = useMemo(
        () => [
            new SolflareWalletAdapter(),
            new PhantomWalletAdapter(),
            new LedgerWalletAdapter(),
            new WalletConnectWalletAdapter({
                network,
                options: {
                    relayUrl: 'wss://relay.walletconnect.com',
                    // example WC dapp project ID
                    projectId: 'f84d0a55da814eb378cc432010765260',
                    metadata: {
                        name: 'GrapeArt',
                        description: 'Grape Art | Social. Stateless. Marketplace. on Solana',
                        url: 'https://grape.art',
                        icons: ['https://shdw-drive.genesysgo.net/5pKmUSyh4VEpVhCCYon1kFf6fn5REtmk1rz4sGXyMrAZ/8upjSpvjc.logo.png'],
                    },
                },
            }),
            new CrossmintSolanaWalletAdapter({
                apiKey: "grape-verification",
                environment: networkToCrossmintEnvironment(network),
            }),
            new ExodusWalletAdapter(),
            new SolletWalletAdapter({ network }),
            new SolletExtensionWalletAdapter({ network }),
            new BraveWalletAdapter(),
            new CoinbaseWalletAdapter(),
            new TorusWalletAdapter(),
            new CloverWalletAdapter(),
            new MathWalletAdapter(),
            new Coin98WalletAdapter(),
            //new SolongWalletAdapter(),
            //new BitKeepWalletAdapter(),
            //new TokenPocketWalletAdapter(),
            //new SafePalWalletAdapter(),
            //new BitpieWalletAdapter(),
            new NightlyWalletAdapter(),
            //new MagicEdenWalletAdapter(),
            new SpotWalletAdapter(),
            new UnsafeBurnerWalletAdapter(),
            new SlopeWalletAdapter(),
        ],
        [network]
    );

    const renderLoader = () => <p>Loading</p>;

    return (
        <>
            <Suspense fallback={renderLoader()}>
                <ThemeProvider theme={grapeTheme}>
                    <div className="grape-gradient-background">
                        <SnackbarProvider>
                            <ConnectionProvider endpoint={endpoint}>
                                <WalletProvider wallets={wallets} autoConnect>
                                    <DialectProviders>
                                        <Grid
                                            //color={grapeTheme.palette.primary.light}
                                            sx={{
                                                flex: 1,
                                            }}
                                        >
                                            <CssBaseline />
                                            <Router>
                                                <AppBar
                                                    position="fixed"
                                                    color="primary"
                                                    style={{ background: 'rgba(0,0,0,0.5)' }}
                                                >
                                                    <Header open={open} toggleDrawer={toggleDrawer} />
                                                </AppBar>

                                                <Grid
                                                    component="main"
                                                    sx={{
                                                        mt: 6,
                                                        display: 'flex',
                                                        flexGrow: 1,
                                                    }}
                                                >
                                                    <Container maxWidth="xl" sx={{ mb: 4 }}>
                                                        <BottomChatElement />

                                                        <Routes>
                                                            {/*<Route path="/splash" element={<SplashView />} />*/}

                                                            <Route path="/featured" element={<FeaturedView />} />

                                                            {/*<Route path="/feed" element={<FeedView />} />*/}

                                                            {/*<Route path="/messages" element={<MessagesView />} />*/}

                                                            {/*<Route path="/solflaretest" element={<NotificationsView/>} />*/}

                                                            <Route path="boarding" element={<MyCollectionsView />} >
                                                                <Route path=":handlekey" element={<MyCollectionsView />} />
                                                            </Route>
                                                            
                                                            <Route path="/" element={<ProfileView />}>
                                                                <Route path=":handlekey" element={<ProfileView />} />
                                                            </Route>
                                                            <Route index element={<ProfileView />} />

                                                            <Route path="store/*" element={<StoreFrontView />}>
                                                                <Route path=":handlekey" element={<StoreFrontView />} />
                                                            </Route>
                                                            <Route path="collection/*" element={<StoreFrontView />}>
                                                                <Route path=":handlekey" element={<StoreFrontView />} />
                                                            </Route>

                                                            <Route path="profile/*" element={<ProfileView />}>
                                                                <Route path=":handlekey" element={<ProfileView />} />
                                                            </Route>

                                                            <Route path="preview/*" element={<PreviewView />}>
                                                                <Route path=":handlekey" element={<PreviewView />} />
                                                            </Route>

                                                            <Route path="identity/*" element={<IdentityView />}>
                                                                <Route path=":handlekey" element={<IdentityView />} />
                                                            </Route>

                                                            <Route path="dashboard/*" element={<IdentityView />}>
                                                                <Route path=":handlekey" element={<IdentityView />} />
                                                            </Route>

                                                            <Route path="wallet/*" element={<IdentityView />}>
                                                                <Route path=":wallet" element={<IdentityView />} />
                                                            </Route>

                                                            <Route path="storage/*" element={<StorageView />}>
                                                                <Route path=":handlekey" element={<StorageView />} />
                                                            </Route>

                                                            <Route path="*" element={<NotFound />} />
                                                        </Routes>

                                                        <Copyright sx={{ mt: 4 }} />
                                                    </Container>
                                                </Grid>
                                            </Router>
                                        </Grid>
                                    </DialectProviders>
                                </WalletProvider>
                            </ConnectionProvider>
                        </SnackbarProvider>
                    </div>
                </ThemeProvider>
            </Suspense>
        </>
    );
}

export const NotFound = () => {
    return (
        <div style={{ height: '100%', overflow: 'auto' }}>
            <Paper className="grape-paper-background" sx={{ borderRadius: '17px', mt: 5, p: 2 }}>
                <Grid
                    className="grape-paper"
                    container
                    alignContent="center"
                    justifyContent="center"
                    direction="column"
                >
                    <Grid item>
                        <Typography align="center" variant="h3">
                            {'No Grapes Here...'}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </div>
    );
};

export default function Dashboard() {
    return <DashboardContent />;
}
/*
const App = () => {
    return (
      <View>
        <DashboardContent />
      </View>
    );
};
*/