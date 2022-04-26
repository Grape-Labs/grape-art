import React, { useEffect, useState, useCallback, memo, Suspense } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils';
// @ts-ignore
import fetch from 'node-fetch';
import BN from "bn.js";

import { findDisplayName } from '../utils/name-service';
//import { performReverseLookup } from '../utils/web3/naming';
import {
    getHashedName,
    getNameAccountKey,
    NameRegistryState,
    performReverseLookup,
    getTwitterRegistry,
  } from "@bonfida/spl-name-service";

import CyberConnect, { Env, Blockchain, solana, ConnectionType } from '@cyberlab/cyberconnect';
import { FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';
import { formatAddress, removeDuplicate, isValidAddr } from '../utils/cyberConnect/helper';
import { followListInfoQuery, searchUserInfoQuery } from '../utils/cyberConnect/query';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProfilePicture } from '@solflare-wallet/pfp';

import { TokenAmount, lt } from '../utils/grapeTools/safe-math';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';

import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'

import { useNavigate } from 'react-router';
import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';

import { useSnackbar } from 'notistack';

import {
    Pagination,
    Stack,
    Typography,
    Grid,
    Box,
    Skeleton,
    Avatar,
    Table,
    Card,
    CardActionArea,
    CardMedia,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Tab,
    Tabs,
    InputBase,
    Tooltip,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Container,
    ListItemIcon,
    SpeedDial,
    Hidden,
    ButtonGroup,
} from '@mui/material';

import MuiAlert, { AlertProps } from '@mui/material/Alert';

import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArtTrackOutlinedIcon from '@mui/icons-material/ArtTrackOutlined';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';
import RssFeedOutlinedIcon from '@mui/icons-material/RssFeedOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import ExploreIcon from '@mui/icons-material/Explore';
import MessageIcon from '@mui/icons-material/Message';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import HomeIcon from '@mui/icons-material/Home';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';

import { GRAPE_RPC_ENDPOINT, GRAPE_RPC_REFRESH, GRAPE_PREVIEW, GRAPE_PROFILE, GRAPE_IDENTITY, FEATURED_DAO_ARRAY } from '../utils/grapeTools/constants';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';
import { MakeLinkableAddress, ValidateAddress, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { ConstructionOutlined } from "@mui/icons-material";

import { useTranslation } from 'react-i18next';

import GlobalView from './GlobalView';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
    ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
  }));

export function SplashView(this: any, props: any) {
    //const [provider, setProvider] = React.useState(getParam('provider'));
    const [gallery, setGallery] = React.useState(null);
    const [collection, setCollection] = React.useState(null);
    //const isConnected = session && session.isConnected;
    const [loading, setLoading] = React.useState(false);
    const [rdloading, setRDLoading] = React.useState(false);
    const [loadCount, setLoadCount] = React.useState(0);
    //const [success, setSuccess] = React.useState(false);
    const [withPubKey, setWithPubKey] = React.useState(null);
    const [pubkey, setPubkey] = React.useState(null);
    const [newinputpkvalue, setNewInputPKValue] = React.useState(null);
    const [solWebUrl, setSolWebUrl] = React.useState(null);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    //const { handlekey } = useParams() as { 
    //    handlekey: string;
    //}
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const urlParams = searchParams.get("pkey") || searchParams.get("address") || handlekey;
    
    const navigate = useNavigate();
    //const location = useLocation();

    const { t, i18n } = useTranslation();
    
    function handlePublicKeySubmit(event: any) {
        event.preventDefault();

        if ((newinputpkvalue && newinputpkvalue.length>0 && ValidateAddress(newinputpkvalue))||
            ((newinputpkvalue.toLocaleUpperCase().indexOf(".SOL") > -1) || (newinputpkvalue.slice(0,1) === '@'))){
            navigate({
                pathname: GRAPE_PROFILE+newinputpkvalue
            },
                { replace: true }
            );
            setNewInputPKValue('');
        } else if (newinputpkvalue && newinputpkvalue.length>0){
            if (newinputpkvalue.toLocaleUpperCase().indexOf("MINT:") > -1){
                let mint = newinputpkvalue.slice(5,newinputpkvalue.length);
                if (ValidateAddress(mint)){
                    navigate({
                        pathname: GRAPE_PREVIEW+mint
                    },
                        { replace: true }
                    );
                    setNewInputPKValue('');
                }
            }
        }else{
            setNewInputPKValue('');
        }
    }

    React.useEffect(() => { 
        if (urlParams){
            setWithPubKey(urlParams);
        } else if (pubkey){
        } else if (publicKey){
            setWithPubKey(publicKey.toBase58());
        }
    }, [publicKey, urlParams]);
    
    return (
        <React.Fragment>
            <Box
                sx={{
                    mt: 2,
                    
                }}
            >
                <Box>  

                        <>
                            <React.Fragment>
                                <Box
                                    className="grape-art-generic-placeholder-container"
                                > 
                                        <Grid 
                                            container 
                                            direction="column" 
                                            spacing={2} 
                                            alignItems="center"
                                            rowSpacing={8}
                                        >
                                            <Grid 
                                        item xs={12}
                                        alignItems="center"
                                    >
                                        <Typography
                                            variant="h3"
                                            color="inherit"
                                            display='flex'
                                            sx={{mt:2}}
                                        >
                                            <img src="/grape_white_logo.svg" width="300px" className="header-logo" alt="Grape" />
                                            .art
                                            </Typography>
                                        </Grid>
                                        <Grid 
                                            item xs={12}
                                            alignItems="center"
                                        > 
                                            <Typography
                                                variant="h6"
                                                color="inherit"
                                                display='flex'
                                                sx={{mb:3}}
                                            >{t('Social. Stateless. Marketplace.')}</Typography>

                                        </Grid>
                                        
                                        <Grid>
                                            <GlobalView />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </React.Fragment>
                        </>
                </Box>
            </Box>
        </React.Fragment>
    );
}
