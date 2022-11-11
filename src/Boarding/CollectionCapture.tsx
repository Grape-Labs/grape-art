import React, { useEffect, useState, useCallback, memo, Suspense } from 'react';

import { Box, TextField, Button, LinearProgress, Typography, Stack } from '@mui/material';

import { PublicKey } from '@solana/web3.js';

import { LinearProgressProps } from '@mui/material/LinearProgress';
import { CollectionBoardingInfo } from 'grape-art-listing-request';

export function CollectionCaptureView(
    this: any,
    props: {
        setGovernance: (governance: PublicKey) => void;
        setName: (name: string) => void;
        setVanityUrl: (url: string) => void;
        setMetaDataUrl: (url: string) => void;
        setVerifiedCollectionAddress: (address: PublicKey) => void;
        setUpdateAuthority: (address: PublicKey) => void;
        setAuctionHouse: (address: PublicKey) => void;
        setCreatorAddress: (address: PublicKey) => void;
        setTokenType: (type: string) => void;
        collectionBoardingInfo: CollectionBoardingInfo;
    }
) {
    const [collectionAddress, setCollectionAddress] = React.useState(null);
    const [updateAuthorityAddress, setUpdateAuthorityAddress] = React.useState(null);
    const [progress, setProgress] = React.useState(0);
    const [status, setStatus] = React.useState(null);
    const [MAX, setMax] = React.useState(100);
    const MIN = 0;

    return (
        <Stack
            component="form"
            m={2}
            sx={{
                width: '25ch',
            }}
            spacing={2}
            noValidate
            autoComplete="off"
        >
            <TextField
                fullWidth
                label="Collection Name"
                value={props.collectionBoardingInfo.name}
                onChange={(e) => props.setName(e.target.value)}
            />
            <TextField
                fullWidth
                label="Author (leave blank if the name is the same as the collection name)"
                //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
            />
            <TextField
                fullWidth
                label="Description"
                //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
            />

            <TextField
                fullWidth
                label="Meta-data URL"
                value={props.collectionBoardingInfo.meta_data_url}
                onChange={(e) => props.setMetaDataUrl(e.target.value)}
            />
            <TextField
                fullWidth
                label="Vanity URL"
                value={props.collectionBoardingInfo.vanity_url}
                onChange={(e) => props.setVanityUrl(e.target.value)}
            />
            <TextField
                fullWidth
                label="Token Type"
                value={props.collectionBoardingInfo.token_type}
                onChange={(e) => props.setTokenType(e.target.value)}
            />
            {/*
                <TextField 
                    fullWidth 
                    label="Discord" 
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />

                <TextField 
                    fullWidth 
                    label="Twitter" 
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />
                */}

            <TextField
                fullWidth
                label="Governance Address"
                value={props.collectionBoardingInfo.governance}
                onChange={(e) => {
                    if (e.target.value.length != 44) return;
                    props.setGovernance(new PublicKey(e.target.value));
                }}
            />
            <TextField
                fullWidth
                label="Auction House"
                value={props.collectionBoardingInfo.auction_house}
                onChange={(e) => {
                    if (e.target.value.length != 44) return;
                    props.setAuctionHouse(new PublicKey(e.target.value));
                }}
            />
            <TextField
                fullWidth
                label="Update Authority"
                value={props.collectionBoardingInfo.collection_update_authority}
                onChange={(e) => {
                    if (e.target.value.length != 44) return;
                    props.setUpdateAuthority(new PublicKey(e.target.value));
                }}
            />

            <TextField
                fullWidth
                label="Verified Collection Address"
                value={props.collectionBoardingInfo.verified_collection_address}
                onChange={(e) => {
                    if (e.target.value.length != 44) return;
                    props.setVerifiedCollectionAddress(new PublicKey(e.target.value));
                }}
            />

            <TextField
                fullWidth
                label="Creator Address (for editions)"
                onChange={(e) => {
                    if (e.target.value.length != 44) return;
                    props.setCreatorAddress(new PublicKey(e.target.value));
                }}
            />
            <TextField
                fullWidth
                label="Random Mint Sample"
                //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
            />
        </Stack>
    );
}
