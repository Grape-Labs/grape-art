import React, { useEffect, useState, useCallback, memo, Suspense } from "react";

import {
    Box,
    TextField,
    Button,
    LinearProgress,
    Typography,
    Stack
} from '@mui/material';

import { LinearProgressProps } from '@mui/material/LinearProgress';

import { 
    GRAPE_RPC_ENDPOINT,
    THEINDEX_RPC_ENDPOINT, 
} from '../utils/grapeTools/constants';

export function CollectionCaptureView (this: any, props: any) {
    const [collectionAddress, setCollectionAddress] = React.useState(null);
    const [updateAuthorityAddress, setUpdateAuthorityAddress] = React.useState(null);
    const [progress, setProgress] = React.useState(0);
    const [status, setStatus] = React.useState(null);
    const [MAX, setMax] = React.useState(100);
    const MIN = 0;

    return (
        <Box
            m={1}
            display = "flex"
            justifyContent='center'
            alignItems='center'
            sx={{
                mt:2,
                maxWidth: '100%',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '24px'
            }}
        >
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
                    //onChange={(e) => setCollectionAddress(e.target.value)}
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
                    label="url" 
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />

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

                <TextField 
                    fullWidth 
                    label="Governance Address"
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />

                <TextField 
                    fullWidth 
                    label="Random Mint Sample"
                    //onChange={(e) => setUpdateAuthorityAddress(e.target.value)}
                />


                
            </Stack>
            
        </Box>
    );
}