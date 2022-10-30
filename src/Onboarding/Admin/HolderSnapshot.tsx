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

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

import { decodeMetadata } from '../../utils/grapeTools/schema';


import {
    GRAPE_RPC_ENDPOINT,
    THEINDEX_RPC_ENDPOINT,
} from '../../utils/grapeTools/constants';


function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.value,
          )}%`}</Typography>
        </Box>
      </Box>
    );
  }

export function HolderSnapshotView (this: any, props: any) {
    const [collectionAddress, setCollectionAddress] = React.useState(null);
    const [updateAuthorityAddress, setUpdateAuthorityAddress] = React.useState(null);
    const [progress, setProgress] = React.useState(0);
    const [status, setStatus] = React.useState(null);
    const [MAX, setMax] = React.useState(100);
    const MIN = 0;

    const fetchIndexedMintListByUA = async(updateAuthority:string) => {

        const ticonnection = new Connection(THEINDEX_RPC_ENDPOINT);

        let response = await ticonnection.getProgramAccounts(
            new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
            {
                //commitment: 'confirmed',
                filters: [
                    {"memcmp":{"offset":0,"bytes":"5"}},{"memcmp":{"offset":1,"bytes":`${updateAuthority}`}}
                ],
            }
        );

        //console.log("response: "+JSON.stringify(response))
        const finalAccounts = new Array();
        for (let value of response) {
            try {
                const buf = Buffer.from(value.account.data.toString(), 'base64');
                const meta_final = decodeMetadata(value.account.data);
                console.log("pushing: "+JSON.stringify(meta_final))
                if (meta_final.data.uri && meta_final.data.uri.length > 0){



                    finalAccounts.push({
                        address:meta_final.mint,
                        name:meta_final.data.name,
                        collection:meta_final.data.symbol,
                        image:null,
                        json:meta_final.data.uri,
                        metadata:value.pubkey.toBase58()
                    });
                }
            } catch(e){
                console.log("ERR: "+e)
            }
        }
        return finalAccounts;

    }


    const fetchIndexedMintList = async(address:string) => {
        const body = {
            method: "getNFTsByCollection",//"getNFTsByCollection",
            jsonrpc: "2.0",
            params: [
              address
            ],
            id: "1",
        };

        setStatus("Fetching Indexed Mints");
        const response = await window.fetch(THEINDEX_RPC_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        })
        const json = await response.json();
        const resultValues = json.result;
        // transpose values to our format
        const finalList = new Array();
        //console.log("jsonToImage: "+jsonToImage);
        for (var item of resultValues){
            if (item.metadata.uri && item.metadata.uri.length > 0){
                finalList.push({
                    address:item.metadata.mint.toString(),
                    name:item.metadata.name,
                    collection:item.metadata.symbol,
                    image:null,
                    json:item.metadata.uri,
                    metadata:item.metadata.pubkey.toString()
                });
            }
        }

        setMax(finalList.length);
        return finalList;
    }

    const fetchMintListMetaData = async(finalList:any) => {

        let x=0;
        let length = finalList.length;
        setMax(length);
        const normalise = (value:number) => ((value - MIN) * 100) / (length - MIN);

        for (var item of finalList){
            setStatus("Fetching Metadata from Mints "+x+" of "+length);
            x++;
            setProgress((prevProgress) => (prevProgress >= 100 ? 0 : normalise(x)));

            let image = null;
            try {
                const metadata = await window.fetch('https://corsproxy.io/?'+item.json)
                .then(
                    (res: any) => res.json()
                );
                image = metadata.image;
                //return metadata;
            } catch (e) { // Handle errors from invalid calls
            }
            item.image = image;
        }
            // prepare to export if this is fetched (will take a good 10mins to fetch 10k collection)
            /*
            if (!jsonToImage && item.metadata.uri){
                const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                    JSON.stringify(finalList)
                )}`;
                const link = document.createElement("a");
                link.href = jsonString;
                link.download = updateAuthority.substring(0,9)+".json";
                link.click();
            }*/
        return finalList;
    }

    const exportJSON = async(finalList:any, fileName:string) => {
        setStatus("File generated!");
            const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                JSON.stringify(finalList)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = fileName+".json";
            link.click();

    }

    // step 1. finalList = fetchIndexedMintList(collectionAddress)
    // step 2. fetchMintListMetaData(finalList)
    // step 3. export file (fileName)
    const processCollection = async(updateAuthority:string) => {
        if (collectionAddress || updateAuthority){
            let finalList = null;
            if ((!collectionAddress) || (collectionAddress === updateAuthority))
                finalList = await fetchIndexedMintListByUA(updateAuthority);
            else
                finalList = await fetchIndexedMintList(collectionAddress);

            if (finalList){
                const finalMintList = await fetchMintListMetaData(finalList);
                if (finalMintList){
                    const fileName = updateAuthority.substring(0,9);
                    exportJSON(finalList,fileName);
                }
            }
        }
    }

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
                    maxWidth: '25ch',
                }}
                spacing={2}
                noValidate
                autoComplete="off"
                >
                <TextField
                    fullWidth
                    //defaultValue ={'GoLMLLR6iSUrA6KsCrFh7f45Uq5EHFQ3p8RmzPoUH9mb'}
                    label="Enter a collection address"
                    onChange={(e) => setCollectionAddress(e.target.value)}/>
                <TextField
                    fullWidth
                    //defaultValue ={'trshC9cTgL3BPXoAbp5w9UfnUMWEJx5G61vUijXPMLH'}
                    label="Enter a update authority address"
                    onChange={(e) => setUpdateAuthorityAddress(e.target.value)}/>
                <Button
                    onClick ={() => processCollection(updateAuthorityAddress)}
                    disabled={!updateAuthorityAddress || !collectionAddress}
                    variant='contained'
                >
                    Generate Snapshot
                </Button>

                <Typography variant='h6'>{status}</Typography>

                <Box sx={{ width: '100%' }}>
                    <LinearProgressWithLabel value={progress} />
                </Box>
            </Stack>

        </Box>
    );
}
