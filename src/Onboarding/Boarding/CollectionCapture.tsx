import React from 'react';

import { TextField, Stack } from '@mui/material';

import { PublicKey } from '@solana/web3.js';

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
    }
) {
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
            <TextField fullWidth label="Collection Name" onChange={(e) => props.setName(e.target.value)} />
            <TextField
                fullWidth
                label="Author (leave blank if the name is the same as the collection name)"
                //TODO: send to metadata
            />
            <TextField
                fullWidth
                label="Description"
                //TODO: send to metadata
            />

            <TextField fullWidth label="Meta-data URL" onChange={(e) => props.setMetaDataUrl(e.target.value)} />
            <TextField fullWidth label="Vanity URL" onChange={(e) => props.setVanityUrl(e.target.value)} />
            <TextField fullWidth label="Token Type" onChange={(e) => props.setTokenType(e.target.value)} />
            <TextField
                fullWidth
                label="Governance Address"
                onChange={(e) => props.setGovernance(new PublicKey(e.target.value))}
            />
            <TextField
                fullWidth
                label="Auction House"
                onChange={(e) => props.setAuctionHouse(new PublicKey(e.target.value))}
            />
            <TextField
                fullWidth
                label="Update Authority"
                onChange={(e) => props.setUpdateAuthority(new PublicKey(e.target.value))}
            />

            <TextField
                fullWidth
                label="Verified Collection Address"
                onChange={(e) => props.setVerifiedCollectionAddress(new PublicKey(e.target.value))}
            />

            <TextField
                fullWidth
                label="Creator Address (for editions)"
                onChange={(e) => props.setCreatorAddress(new PublicKey(e.target.value))}
            />

            <TextField
                fullWidth
                label="Random Mint Sample"
                //TODO: send to metadata
            />
        </Stack>
    );
}
