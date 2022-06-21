import React, { FC, ReactNode, useCallback, useMemo, Suspense } from 'react';
import { styled, ThemeProvider } from '@mui/material/styles';
import { HashRouter, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
//import { LogView } from "./Log/Log";
import { ProfileView } from './Profile/Profile';
import { PreviewView } from './Preview/Preview';
import { FeaturedView } from './Featured/Featured';
import { IdentityView } from './Identity/Identity';
import { SplashView } from './Splash/Splash';
import { StoreFrontView } from './StoreFront/StoreFront';
import { MessagesView } from './Messages/Messages';
//import { NotificationsView } from "./NotificationsTest/NotificationsTest";
import CssBaseline from '@mui/material/CssBaseline';

import '@dialectlabs/react-ui/lib/index.css';

import { Box, Grid, Paper, Container, Typography, AppBar } from '@mui/material';

import Header from './Header/Header';
import { SnackbarProvider } from 'notistack';
import { useConnection, ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { Connection, Keypair, SystemProgram, Transaction, clusterApiUrl } from '@solana/web3.js';
import { Helmet } from 'react-helmet';

import { useSnackbar } from 'notistack';

import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';

import { useTranslation } from 'react-i18next';

//import { WalletDialogProvider, WalletDisconnectButton, WalletMultiButton } from '../WalletAdapterMui';

import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    GlowWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SlopeWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
    CloverWalletAdapter,
    MathWalletAdapter,
    Coin98WalletAdapter,
    SolongWalletAdapter,
    BitKeepWalletAdapter,
    TokenPocketWalletAdapter,
    BitpieWalletAdapter,
    SafePalWalletAdapter,
    ExodusWalletAdapter,
} from '@solana/wallet-adapter-wallets';

//import { mainListItems, secondaryListItems } from './components/SidebarList/SidebarList';
import grapeTheme from './utils/config/theme';
//import "./App.less";
import { GRAPE_RPC_ENDPOINT, TX_RPC_ENDPOINT, GENSYSGO_RPC_ENDPOINT } from './utils/grapeTools/constants';
import { BottomChat as DialectBottomChat, DialectUiManagementProvider } from '@dialectlabs/react-ui';
import { getDialectVariables, GRAPE_BOTTOM_CHAT_ID } from './utils/ui-contants';
import { ClassNames } from '@emotion/react';

function BottomChat() {
    const wallet = useWallet();

    return (
        <ClassNames>
            {({ css }) => (
                <DialectBottomChat
                    dialectId={GRAPE_BOTTOM_CHAT_ID}
                    wallet={wallet}
                    rpcUrl={GENSYSGO_RPC_ENDPOINT}
                    theme="dark"
                    network="mainnet"
                    variables={getDialectVariables(css, 'popup')}
                />
            )}
        </ClassNames>
    );
}

function Copyright(props: any): JSX.Element {
    const { t, i18n } = useTranslation();
    return (
        <Typography sx={{ background: 'transparent' }} variant="body2" color="text.secondary" align="center" {...props}>
            {t('Powered by Grape on Solana')}
            {/*
      <Link color="inherit" href="https://verify.grapes.network">
        Grape Network | Dashboard v1.1.5
      </Link>
      */}
        </Typography>
    );
}

function DashboardContent() {
    const [open, setOpen] = React.useState(true);
    const toggleDrawer = () => {
        setOpen(!open);
    };

    // You can also provide a custom RPC endpoint
    const network = WalletAdapterNetwork.Mainnet; //.Devnet; //.Mainnet;
    // You can also provide a custom RPC endpoint
    //const endpoint =  useMemo(() => clusterApiUrl(network), [network]); // GRAPE_RPC_ENDPOINT;
    //const endpoint =  GRAPE_RPC_ENDPOINT;
    const endpoint = TX_RPC_ENDPOINT;
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new GlowWalletAdapter(),
            new SolflareWalletAdapter(),
            new SlopeWalletAdapter(),
            new LedgerWalletAdapter(),
            new ExodusWalletAdapter(),
            new SolletWalletAdapter({ network }),
            new SolletExtensionWalletAdapter({ network }),
            new TorusWalletAdapter(),
            new CloverWalletAdapter(),
            new MathWalletAdapter(),
            new Coin98WalletAdapter(),
            new SolongWalletAdapter(),
            new BitKeepWalletAdapter(),
            new TokenPocketWalletAdapter(),
            new SafePalWalletAdapter(),
            new BitpieWalletAdapter(),
        ],
        [network]
    );

    /*
  const { enqueueSnackbar } = useSnackbar();
  const onError = useCallback(
      (error) => {
          enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
          console.error(error);
      },
      [enqueueSnackbar]
  );
  */

    return (
        <>
            <Suspense fallback="loading">
                <DialectUiManagementProvider>
                    <ThemeProvider theme={grapeTheme}>
                        <div className="grape-gradient-background">
                            <SnackbarProvider>
                                <ConnectionProvider endpoint={endpoint}>
                                    <WalletProvider wallets={wallets} autoConnect>
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
                                                        <ConfirmDialog />
                                                        <Routes>
                                                            <Route path="/splash" element={<SplashView />} />

                                                            <Route path="/featured" element={<FeaturedView />} />

                                                            <Route path="/messages" element={<MessagesView />} />

                                                            {/*<Route path="/solflaretest" element={<NotificationsView/>} />*/}

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

                                                            <Route path="*" element={<NotFound />} />
                                                        </Routes>
                                                        <BottomChat />
                                                        <Copyright sx={{ mt: 4 }} />
                                                    </Container>
                                                </Grid>
                                            </Router>
                                        </Grid>
                                    </WalletProvider>
                                </ConnectionProvider>
                            </SnackbarProvider>
                        </div>
                    </ThemeProvider>
                </DialectUiManagementProvider>
            </Suspense>
        </>
    );
}

export const NotFound = () => {
    return (
        <div style={{ height: '100%', overflow: 'auto' }}>
            <Paper className="grape-paper-background">
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

//export const Dashboard: FC<{ children: ReactNode }> = ({ children }) => {
export default function Dashboard() {
    return <DashboardContent />;
}
