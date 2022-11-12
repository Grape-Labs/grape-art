import * as React from 'react';
import { useCallback } from 'react';

import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Tab,
    Tabs,
    Typography,
    Grid,
    Dialog,
    FormControl,
    TextField,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
} from '@mui/material';

import { styled } from '@mui/material/styles';

import { WalletError } from '@solana/wallet-adapter-base';

import { CollectionCaptureView } from '../Boarding/CollectionCapture';

import { useSnackbar } from 'notistack';

import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

import { PublicKey, Connection } from '@solana/web3.js';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogProvider, WalletMultiButton } from '@solana/wallet-adapter-material-ui';
import { CollectionBoardingInfo, useAdmin, useListingQuery, useListingRequest } from 'grape-art-listing-request';
import { AnchorProvider } from '@project-serum/anchor';
import { ApprovedTable } from './ApprovedTable';
import { useEffect, useState } from 'react';
import { PendingTable } from './PendingTable';

import { GRAPE_RPC_ENDPOINT, TX_RPC_ENDPOINT } from '../utils/grapeTools/constants';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

export interface DialogTitleProps {
    id: string;
    children?: React.ReactNode;
    onClose: () => void;
}

const BootstrapDialogTitle = (props: DialogTitleProps) => {
    const { children, onClose, ...other } = props;

    return (
        <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
            {children}
            {onClose ? (
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
};

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export function AddCollectionView() {
    const [open, setOpen] = React.useState(false);
    //const { connection } = useConnection();
    //const connection = new Connection('https://api.devnet.solana.com');
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const anchorWallet = useAnchorWallet();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );

    const { requestListingRefund, requestListing } = useListingRequest(
        anchorWallet ? new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions()) : null);

    const [collectionBoardingInfo, setCollectionBoardingInfo] = React.useState<CollectionBoardingInfo>({
        name: '',
        enabled: true,
        collection_update_authority: PublicKey.default,
        auction_house: PublicKey.default,
        meta_data_url: '',
        vanity_url: '',
        token_type: '',
				request_type: 0,
        listing_requester: PublicKey.default,
    });

    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    function HandleSendSubmit(event: any) {
        event.preventDefault();
        if (requestListing) {
            try {
                enqueueSnackbar(`Preparing to list`, { variant: 'info' });

                requestListing(collectionBoardingInfo)
                    .then(([tx, listingAddress]) => {
                        enqueueSnackbar(`Listing address ${tx} created with transaction ${listingAddress}`, {
                            variant: 'info',
                        });
                    })
                    .catch((e) => {
                        enqueueSnackbar(`Listing error: ${e.message}`);
                    });
            } catch (e) {
                enqueueSnackbar(`${JSON.stringify(e)}`, { variant: 'error' });
            }
        }
    }
    function getSetter<T>(field: string) {
        return (value: T) => {
            return setCollectionBoardingInfo((old) => {
                return {
                    ...old,
                    [field]: value,
                };
            });
        };
    }

    return (
        <div>
            <Grid container sx={{ mt: 1, mb: 1 }}>
                <Grid item xs={12}>
                    <Tooltip title="Add your collection on Grape Art">
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleClickOpen}
                            size="small"
                            sx={{ borderRadius: '17px' }}
                        >
                            <AddPhotoAlternateIcon />
                        </Button>
                    </Tooltip>
                </Grid>
            </Grid>
            <BootstrapDialog
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={open}
                PaperProps={{
                    style: {
                        boxShadow: '3',
                        borderRadius: '17px',
                    },
                }}
            >
                <form onSubmit={HandleSendSubmit}>
                    <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
                        Get Listed on Grape.art
                    </BootstrapDialogTitle>
                    <DialogContent dividers>
                        <CollectionCaptureView
                            setGovernance={getSetter('governance')}
                            setName={getSetter('name')}
                            setVanityUrl={getSetter('vanity_url')}
                            setMetaDataUrl={getSetter('meta_data_url')}
                            setVerifiedCollectionAddress={getSetter('verified_collection_address')}
                            setAuctionHouse={getSetter('auction_house')}
                            setTokenType={getSetter('token_type')}
                            setUpdateAuthority={getSetter('collection_update_authority')}
                            setCreatorAddress={getSetter('creator_address')}
                            collectionBoardingInfo={collectionBoardingInfo}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            fullWidth
                            type="submit"
                            variant="outlined"
                            title="Transfer"
                            //disabled={
                            //    (!snsDomain || snsDomain.length <= 0)
                            //}
                            sx={{
                                borderRadius: '17px',
                            }}
                        >
                            Submit
                        </Button>
                    </DialogActions>
                </form>
            </BootstrapDialog>
        </div>
    );
}

export function MyCollectionsView(this: any, props: any) {
    const { publicKey, connect } = useWallet();
    const { connection } = useConnection();

    const anchorWallet = useAnchorWallet();

    const [value, setValue] = React.useState(0);
    const [isAdminConnected, setIsAdminConnected] = useState<boolean | undefined>(undefined);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };
    const { requestListingRefund } = useListingRequest(
        anchorWallet ? new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions()) : null);
    const { getAllPendingListings, getAllApprovedListings } = useListingQuery(
        anchorWallet ? new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions()) : null);

    const { isAdmin, setEnableListing, approveListing, denyListing } = useAdmin(
        anchorWallet ? new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions()) : null);

    const [pendingListings, setPendingListings] = useState<CollectionBoardingInfo[]>(undefined);
    const [approvedListings, setApprovedListings] = useState<CollectionBoardingInfo[]>(undefined);

    const retrievePendingListings = async () => {
        const listings = await getAllPendingListings();
        setPendingListings(listings);
    };

    const retrieveApprovedListings = async () => {
        const listings = await getAllApprovedListings();
        setApprovedListings(listings);
    };

    const checkAdmin = async () => {
        const admin = await isAdmin(anchorWallet.publicKey);
        setIsAdminConnected(admin);
    };

    useEffect(() => {
        if (getAllPendingListings && pendingListings == undefined) {
            retrievePendingListings();
        }
        if (getAllApprovedListings && approvedListings == undefined) {
            retrieveApprovedListings();
        }
        if (isAdmin && isAdminConnected == undefined) {
            checkAdmin();
        }
    }, [anchorWallet, getAllPendingListings, getAllApprovedListings, isAdmin]);

    return (
        <Box sx={{ width: '100%', mt: 6 }}>
            {publicKey ? (
                <>
                    <Box
                        sx={{
                            p: 1,
                            m: 1,
                            width: '100%',
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: '24px',
                        }}
                    >
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Grid container>
                                <Grid item>
                                    <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                                        <Tab label="Approved Collections Featured" {...a11yProps(0)} />
                                        <Tab label="Pending Approval" {...a11yProps(1)} />
                                    </Tabs>
                                </Grid>
                                <Grid item xs textAlign={'right'}>
                                    <AddCollectionView />
                                </Grid>
                            </Grid>
                        </Box>

                        <TabPanel value={value} index={0}>
                            {!approvedListings && <p>Loading...</p>}
                            {approvedListings && (
                                <ApprovedTable
                                    deny={denyListing}
                                    enable={setEnableListing}
                                    isAdmin={isAdminConnected === undefined ? false : isAdminConnected}
                                    info={approvedListings}
                                />
                            )}
                        </TabPanel>
                        <TabPanel value={value} index={1}>
                            {!pendingListings && <p>Loading...</p>}
                            {pendingListings && (
                                <PendingTable
                                    wallet={anchorWallet.publicKey}
                                    refund={requestListingRefund}
                                    approve={approveListing}
                                    isAdmin={isAdminConnected === undefined ? false : isAdminConnected}
                                    info={pendingListings}
                                />
                            )}
                        </TabPanel>
                    </Box>
                </>
            ) : (
                <>
                    <WalletDialogProvider className="grape-wallet-provider">
                        <WalletMultiButton className="grape-wallet-button">
                            Connect your wallet to begin
                        </WalletMultiButton>
                    </WalletDialogProvider>
                </>
            )}
        </Box>
    );
}
