
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils'
// @ts-ignore
import fetch from 'node-fetch'
import { PublicKey, Connection } from '@solana/web3.js';

import { findDisplayName } from '../utils/name-service';
import { getProfilePicture } from '@solflare-wallet/pfp';

import {
    Stack,
    Typography,
    Grid,
    Box,
    Skeleton,
    ListItemButton,
} from '@mui/material';

import { GRAPE_RPC_ENDPOINT } from '../utils/grapeTools/constants';

export function IdentityView(props: any){
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const pubkey = props.pubkey;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    
    const fetchProfilePicture = async () => {
        const { isAvailable, url } = await getProfilePicture(ggoconnection, new PublicKey(pubkey));
    
        let img_url = url;
        if (url)
            img_url = url.replace(/width=100/g, 'width=256');
        setProfilePictureUrl(img_url);
    }
    
    const fetchSolanaDomain = async () => {
        const domain = await findDisplayName(ggoconnection, pubkey);
        if (domain){
            setSolanaDomain(domain)
            //if (domain[0] !== pubkey)
            //    setSolanaDomain(domain[0]);
        }
    }

    React.useEffect(() => {
        if (pubkey){
            setLoading(true);
            fetchProfilePicture();
            fetchSolanaDomain();
            setLoading(false);
        }
    }, [pubkey]);


    if (loading){
        return (
            <>
                Loading your solana profile
            </>
        );
    } else{
        return (
            <>
                
            </>
        );
    }
}