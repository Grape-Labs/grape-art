import React, { useEffect, useState, useCallback, memo, Suspense } from "react";

import {
    Box,
    TextField,
    Button,
    ButtonGroup,
    LinearProgress,
    Typography,
    Stack,
    Tooltip
} from '@mui/material';

import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { LinearProgressProps } from '@mui/material/LinearProgress';

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ShdwDrive, ShadowFile } from "@shadow-drive/sdk";
import { decodeMetadata } from '../../utils/grapeTools/schema';
//import { decodeMetadata } from '@metaplex-foundation/mpl-auction-house'
import { useSnackbar } from 'notistack';

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletError } from '@solana/wallet-adapter-base';

import {
    GRAPE_RPC_ENDPOINT,
    THEINDEX_RPC_ENDPOINT,
    PROXY,
    CLOUDFLARE_IPFS_CDN
} from '../../utils/grapeTools/constants';

import CircularProgress from '@mui/material/CircularProgress';

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

export function CollectionSnapshotView (this: any, props: any) {
	const wallet = useWallet();
    const [mintAddress, setMintAddress] = React.useState(null);
    const [collectionAddress, setCollectionAddress] = React.useState(null);
    const [updateAuthorityAddress, setUpdateAuthorityAddress] = React.useState(null);
    const [progress, setProgress] = React.useState(0);
    const [status, setStatus] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [fileGenerated, setFileGenerated] = React.useState(null);
    const [csvGenerated, setCSVGenerated] = React.useState(null);
    const [stringGenerated, setStringGenerated] = React.useState(null);
    const [MAX, setMax] = React.useState(100);
    const MIN = 0;
    const [thisDrive, setThisDrive] = React.useState(null);
    const ticonnection = new Connection(THEINDEX_RPC_ENDPOINT);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const qnconnection = new Connection(GRAPE_RPC_ENDPOINT);


    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );

    const fetchIndexedMintListByUA = async(updateAuthority:string) => {

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
                //console.log("pushing: "+JSON.stringify(meta_final))
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
                //console.log("item: "+JSON.stringify(item));
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
            setStatus("Fetching "+x+" of "+length);
            x++;
            setProgress((prevProgress) => (prevProgress >= 100 ? 0 : normalise(x)));

            let image = null;
            let attributes = null;
            try {


                let file_metadata = item.json;
                let file_metadata_url = new URL(file_metadata);

                const IPFS = 'https://ipfs.io';
                const IPFS_2 = "https://nftstorage.link/ipfs";

                if (file_metadata.startsWith(IPFS) || file_metadata.startsWith(IPFS_2)){
                    file_metadata = CLOUDFLARE_IPFS_CDN+file_metadata_url.pathname;
                }

                const metadata = await window.fetch(PROXY+file_metadata)
                .then(
                    (res: any) => res.json()
                );
                image = metadata.image;
                attributes = metadata?.attributes;
                //return metadata;
            } catch (e) { // Handle errors from invalid calls
            }
            item.image = image;
            item.attributes = attributes;
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

    const exportFile = async(finalList:string, csvFile:string, fileName:string) => {
        setStatus("File generated!");
            const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                JSON.stringify(finalList)
            )}`;

            setStringGenerated(JSON.stringify(finalList));
            setFileGenerated(jsonString);

            const jsonCSVString = `data:text/csv;chatset=utf-8,${csvFile}`;

            setCSVGenerated(jsonCSVString);
            //const link = document.createElement("a");
            //link.href = jsonString;
            //link.download = fileName+".json";
            //link.click();
    }


    const returnJSON = async(generatedString:string, fileName:string) => {
        setStatus("File generated!");

        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(generatedString, null, 2)
        )}`;

        const bytes = new TextEncoder().encode(jsonString);

        const blob_json = new Blob([bytes], {
            type: "application/json;charset=utf-8"
        });

        const blob = new Blob([generatedString], {
            type: "application/text"
        });

        const text = await new Response(blob).text()
        console.log("text: "+text);
        console.log("size: "+blob.size);

        //const url = URL.createObjectURL(blob);
        //console.log("blob size: "+blob.size);
        //const buff = Buffer.from(jsonString);
        //console.log("jsonString: " + JSON.stringify(jsonString));
        //console.log("blob: " + JSON.stringify(blob));
        //console.log("buff: " + JSON.stringify(buff));
        return blob;
    }

    const fileToDataUri = (file:any) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result)
        };
        reader.readAsDataURL(file);
        })

    const uploadToStoragePool = async (files: File, storagePublicKey: PublicKey) => {
        try{
            enqueueSnackbar(`Preparing to upload some files to ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.uploadMultipleFiles(storagePublicKey, [files]);

            let count = 0;
            for (var file of signedTransaction){
                if (file.status === "Uploaded."){
                    count++;
                }
            }

            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <>
                    Uploaded {count} files
                </>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${JSON.stringify(e)}`,{ variant: 'error' });
            console.log("Error: "+JSON.stringify(e));
            //console.log("Error: "+JSON.stringify(e));
        }
    }

    const uploadReplaceToStoragePool = async (newFile: File, existingFileUrl: string, storagePublicKey: PublicKey, version: string) => {
        try{
            enqueueSnackbar(`Preparing to upload/replace some files to ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });

            const signedTransaction = await thisDrive.editFile(new PublicKey(storagePublicKey), existingFileUrl, newFile, version || 'v2');

            if (signedTransaction?.finalized_location){
                closeSnackbar(cnfrmkey);
                const snackaction = (key:any) => (
                    <Button>
                        File replaced
                    </Button>
                );
                enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            } else{

            }
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${JSON.stringify(e)}`,{ variant: 'error' });
            console.log("Error: "+JSON.stringify(e));
            //console.log("Error: "+JSON.stringify(e));
        }
    }

    const processCollection = async(updateAuthority:string) => {
        const METAPLEX_PROGRAM_ID = new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        );

        const drive = await new ShdwDrive(new Connection(GRAPE_RPC_ENDPOINT), wallet).init();
        //console.log("drive: "+JSON.stringify(drive));
        setThisDrive(drive);

        if (collectionAddress || updateAuthority){
            let finalList = null;
            setFileGenerated(null);

            setLoading(true);
            if ((!collectionAddress) || (collectionAddress === updateAuthority))
                finalList = await fetchIndexedMintListByUA(updateAuthority);
            else
                finalList = await fetchIndexedMintList(collectionAddress);

            if (finalList){
                const finalMintList = await fetchMintListMetaData(finalList);

                if (finalMintList){
                    const csvArrayFile = new Array();
                    let csvFile = '';
                    var counter = 0;
                    for (var item of finalList){
                        csvArrayFile.push(item.address);
                        if (counter > 0)
                            csvFile += ',';
                        csvFile += item.address;
                        counter++;
                    }
                    //setCSVGenerated(csvFile);
                    const fileName = updateAuthority.substring(0,9)+'.json';
                    exportFile(finalList, csvFile, fileName);
                }
            }
            setLoading(false);
        }
    }

    function blobToFile(theBlob: Blob, fileName: string){
        return new File([theBlob], fileName, { lastModified: new Date().getTime(), type: theBlob.type })
    }

    const handleUploadToStoragePool = async () => {
        const fileName = updateAuthorityAddress.substring(0,9)+'.json';
        //exportJSON(fileGenerated, fileName);

        if (!thisDrive){
            // set drive again here?
            alert("Drive not initialized...");
        } else{
            const storageAccountPK = '5pKmUSyh4VEpVhCCYon1kFf6fn5REtmk1rz4sGXyMrAZ';
            const uploadFile = await returnJSON(stringGenerated, fileName);
            //const fileBlob = await fileToDataUri(uploadFile);
            // auto check if this file exists (now we manually do this)

            const response = await thisDrive.listObjects(new PublicKey(storageAccountPK))

            let found = false;
            if (response?.keys){
                for (var item of response.keys){
                    if (item === fileName){
                        found = true;
                    }
                }
            }

            console.log("File found: "+JSON.stringify(found))

            const fileType = null;
            /*
            const fd = new FormData();
            fd.append("file",
                new Blob([uploadFile], {type: fileType}),
                fileName
            );*/

            //const fileStream = new File([uploadFile], fileName);
            const fileStream = blobToFile(uploadFile, fileName);
            //const altStream = <ShadowFile>{uploadFile, fileName}
            /*
            const fileStream = new File([uploadFile], fileName,
                {
                    lastModified: new Date().getTime()
                });
            */
            if (found){
                const storageAccountFile = 'https://shdw-drive.genesysgo.net/'+storageAccountPK+'/'+fileName;
                uploadReplaceToStoragePool(fileStream, storageAccountFile, new PublicKey(storageAccountPK), 'v2');
            }else{
                uploadToStoragePool(fileStream, new PublicKey(storageAccountPK));
            }
        }
    }

    const processMintAddress = async(updateAuthority:string) => {
        const METAPLEX_PROGRAM_ID = new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        );

        setFileGenerated(null);

        if(mintAddress){
            // get from mint address the collectionaddress and/or update authority and then pass this call again
            let mint_address = new PublicKey(mintAddress);
            let [pda, bump] = await PublicKey.findProgramAddress([
                Buffer.from("metadata"),
                METAPLEX_PROGRAM_ID.toBuffer(),
                new PublicKey(mint_address).toBuffer(),
            ], METAPLEX_PROGRAM_ID)

            console.log("PDA ("+mintAddress+"): "+pda);
            const metadata = await qnconnection.getAccountInfo(pda);

            if (metadata?.data){
                try{
                    let meta_primer = metadata;
                    let buf = Buffer.from(metadata.data);
                    //console.log("HERE!")
                    let meta_final = decodeMetadata(buf);
                    //console.log("meta_final: "+JSON.stringify(meta_final));

                    if (meta_final.updateAuthority){
                        setUpdateAuthorityAddress(meta_final.updateAuthority);
                        if (meta_final?.collection){
                            setCollectionAddress(meta_final?.collection.key);
                        } else{
                            setCollectionAddress(meta_final.updateAuthority)
                        }
                    }
                } catch(e){
                    console.log("ERR: "+e);
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
                    width: '35ch',
                }}
                spacing={2}
                noValidate
                autoComplete="off"
                >
                <TextField
                    fullWidth
                    label="Enter a mint address"
                    onChange={(e) => setMintAddress(e.target.value)}/>

                <Button
                    onClick ={() => processMintAddress(updateAuthorityAddress)}
                    disabled={!mintAddress}
                    variant='contained'
                >
                    Fetch Collection &amp; Update Authority
                </Button>


                <>OR</>


                <TextField
                    fullWidth
                    //defaultValue ={'GoLMLLR6iSUrA6KsCrFh7f45Uq5EHFQ3p8RmzPoUH9mb'}
                    placeholder='Enter a Collection Address'
                    value={collectionAddress}
                    onChange={(e) => setCollectionAddress(e.target.value)}/>
                <TextField
                    fullWidth
                    //defaultValue ={'trshC9cTgL3BPXoAbp5w9UfnUMWEJx5G61vUijXPMLH'}
                    placeholder='Enter a Update Authority Address'
                    value={updateAuthorityAddress}
                    onChange={(e) => setUpdateAuthorityAddress(e.target.value)}/>
                <Button
                    onClick ={() => processCollection(updateAuthorityAddress)}
                    disabled={(!updateAuthorityAddress || !collectionAddress || (!fileGenerated && loading))}
                    variant='contained'
                >
                    Generate Snapshot
                </Button>

                <Typography variant='h6'>{status}</Typography>

                {fileGenerated &&
                    <ButtonGroup>
                        <Tooltip title="Download Grape.art JSON file">
                            <Button
                                download={`${updateAuthorityAddress.substring(0,9)}.json`}
                                href={fileGenerated}
                            >
                                <DownloadIcon /> JSON
                            </Button>
                        </Tooltip>
                        <Tooltip title="Download Verification CSV file">
                            <Button
                                download={`${updateAuthorityAddress}.csv`}
                                href={csvGenerated}
                            >
                                <DownloadIcon /> CSV
                            </Button>
                        </Tooltip>
                        <Tooltip title="Upload to Grape.art decentralized storage pool (used for grape.art collections)">
                            <Button
                                onClick={handleUploadToStoragePool}
                                sx={{ml:1}}
                            >
                                <CloudUploadIcon />
                            </Button>
                        </Tooltip>
                    </ButtonGroup>

                }

                <Box sx={{ width: '100%' }}>
                    <LinearProgressWithLabel value={progress} />
                </Box>
            </Stack>

        </Box>
    );
}
