import React, { useEffect, useCallback, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ShdwDrive } from "@shadow-drive/sdk";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, Connection, PublicKey } from '@solana/web3.js';
import { Schema, deserializeUnchecked, deserialize } from "borsh";
import { BN } from '@project-serum/anchor';

import FileUpload from "react-material-file-upload";
import {CopyToClipboard} from 'react-copy-to-clipboard';

import { useSnackbar } from 'notistack';
import { WalletError } from '@solana/wallet-adapter-base';
import { WalletConnectButton } from "@solana/wallet-adapter-material-ui";

import { useTranslation } from 'react-i18next';

import moment from 'moment';

import { 
    GRAPE_RPC_ENDPOINT
} from '../../utils/grapeTools/constants';

import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import {
    Box,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    ListItemButton,
    Avatar,
    Tooltip,
    Typography,
    Collapse,
    ListSubheader,
    Button,
    ButtonGroup,
    Dialog,
    DialogActions,
    DialogTitle,
    DialogContent,
    TextField,
    FormControl,
    FormControlLabel,
    FormLabel,
    Select,
    MenuItem,
    InputLabel,
    Paper,
    Container,
    Radio,
    RadioGroup
} from '@mui/material';

import { SelectChangeEvent } from '@mui/material/Select';

import SolIcon from '../../components/static/SolIcon';
import SolCurrencyIcon from '../../components/static/SolCurrencyIcon';

import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SaveIcon from '@mui/icons-material/Save';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningIcon from '@mui/icons-material/Warning';
import RestoreIcon from '@mui/icons-material/Restore';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CloudCircleIcon from '@mui/icons-material/CloudCircle';
import { ConstructionOutlined, StorageTwoTone, StrikethroughS } from "@mui/icons-material";
import { buffer } from "node:stream/consumers";

const Input = styled('input')({
    display: 'none',
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
  }));

function isImage(url:string) {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
}
  
function formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function calculateStorageUsed(available: any, allocated: any){
    if (available && +available > 0){
        const percentage = 100-(+available/allocated.toNumber()*100);
        const storage_string = percentage.toFixed(2) + "% of " + formatBytes(allocated);
        return storage_string;
    } else{
        const storage_string = "0% of " + formatBytes(allocated);
        return storage_string;
    }   
}

export function StorageView(props: any){
	const { connection } = useConnection();
	const wallet = useWallet();
	const [accountV1, setAccountV1] = React.useState(null);
	const [accountV2, setAccountV2] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [thisDrive, setThisDrive] = React.useState(null);

    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlParams = searchParams.get("storage") || searchParams.get("address") || handlekey;

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );

    const fetchStorageAccounts = async () => { 
        const storedAccount = await thisDrive.getStorageAccounts('v2');
        //setAccountV2(storedAccount);
        if (storedAccount){
            var asa_v2_array = new Array();
            for (var account of storedAccount){
                const body = {
                    storage_account: account.publicKey
                };
                console.log("body: "+JSON.stringify(body))
                
                const response = await window.fetch('https://shadow-storage.genesysgo.net/storage-account-info', {
                    method: "POST",
                    body: JSON.stringify(body),
                    headers: { "Content-Type": "application/json" },
                });
            
                const json = await response.json();

                var storage = {
                    publicKey:account.publicKey,
                    account:account.account,
                    additional:{
                        currentUsage:json.current_usage,
                        version:json.version,
                    }

                }
                
                asa_v2_array.push(storage);

                console.log("storage: "+JSON.stringify(storage));
            }
            //setAccountV2(asa_v2);
            setAccountV2(asa_v2_array);
        } else{
            //createStoragePool('grape-test-storage', '1MB');
        }

        const storedAccountV1 = await thisDrive.getStorageAccounts('v1');
        setAccountV1(storedAccountV1);
    }

    const createStoragePool = async (name: string, size: string, version: string) => { 
        try{
            enqueueSnackbar(`Preparing to create storage ${name}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.createStorageAccount(name, size, version || 'v2')
            //const signedTransaction = await thisDrive.createStorageAccount(name, size)
            
            const latestBlockHash = await connection.getLatestBlockhash();
            console.log("Signature: "+JSON.stringify(signedTransaction));
            
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.transaction_signature}, 
                'max'
            );
            
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction?.transaction_signature}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction?.transaction_signature}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    const migrateStoragePool = async (storagePublicKey: PublicKey) => { 
        try{
            enqueueSnackbar(`Preparing to migrate storage pool ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            //const signedTransaction = await thisDrive.migrate(storagePublicKey);
            const signedTransaction = await thisDrive.migrateStep2(storagePublicKey);
            
            

            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.txid}, 
                'processed'
            );
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.txid}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.txid}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    const cancelDeleteStoragePool = async (storagePublicKey: PublicKey, version: string) => { 
        try{
            enqueueSnackbar(`Preparing to delete storage ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.cancelDeleteStorageAccount(storagePublicKey, version || 'v2');
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.txid}, 
                'processed'
            );
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.txid}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.txid}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    const cancelDeleteStoragePoolFile = async (storagePublicKey: PublicKey, file: string) => { 
        try{
            enqueueSnackbar(`Preparing to restore ${file}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            //console.log(storagePublicKey + "/"+storageAccount+" - file: "+file);
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.cancelDeleteFile(storagePublicKey, 'https://shdw-drive.genesysgo.net/'+storagePublicKey.toBase58()+'/'+file);
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.txid}, 
                'processed'
            );
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.txid}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.txid}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
            
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }
    
    const deleteStoragePoolFile = async (storagePublicKey: PublicKey, file: string, version: string) => { 
        try{
            enqueueSnackbar(`Preparing to delete ${file}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            //console.log(storagePublicKey + "/"+storageAccount+" - file: "+file);
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            
            const signedTransaction = await thisDrive.deleteFile(storagePublicKey, 'https://shdw-drive.genesysgo.net/'+storagePublicKey.toBase58()+'/'+file, version || 'v2');
            //const signedTransaction = await thisDrive.deleteFile(storagePublicKey, 'https://shdw-drive.genesysgo.net/'+storagePublicKey.toBase58()+'/'+file);
            console.log("signedTransaction; "+JSON.stringify(signedTransaction))
            //const latestBlockHash = await connection.getLatestBlockhash();
            /*
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.txid}, 
                'processed'
            );
            
            */
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.txid}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.message}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
            
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    const resizeAddStoragePool = async (storagePublicKey: PublicKey, size: string, version: string) => { 
        try{
            enqueueSnackbar(`Preparing to resize/add storage ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.addStorage(storagePublicKey, size, version || 'v2');
            //const signedTransaction = await thisDrive.addStorage(storagePublicKey, size);
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.txid}, 
                'processed'
            );
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.txid}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.txid}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
            
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    const resizeReduceStoragePool = async (storagePublicKey: PublicKey, size: string, version: string) => { 
        try{
            enqueueSnackbar(`Preparing to resize/reduce storage ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.reduceStorage(storagePublicKey, size, version || 'v2');
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.txid}, 
                'processed'
            );
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.txid}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.txid}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
            
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    const deleteStoragePool = async (storagePublicKey: PublicKey, version: string) => { 
        try{
            enqueueSnackbar(`Preparing to delete storage ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            
            console.log("version: "+version)
            const signedTransaction = await thisDrive.deleteStorageAccount(storagePublicKey, version || 'v2');
            
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.txid}, 
                'processed'
            );
            
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.txid}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.txid}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
            
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    const lockStoragePool = async (storagePublicKey: PublicKey, version: string) => { 
        try{
            enqueueSnackbar(`Preparing to lock storage ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.makeStorageImmutable(storagePublicKey, version || 'v2');
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.txid}, 
                'processed'
            );
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.txid}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.txid}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    const uploadToStoragePool = async (files: any, storagePublicKey: PublicKey) => { 
        try{
            enqueueSnackbar(`Preparing to upload some files to ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.uploadMultipleFiles(storagePublicKey, files);
            //const signedTransaction = await thisDrive.uploadFile(storagePublicKey, files[0]);
            
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

            /*
            const latestBlockHash = await connection.getLatestBlockhash();

            console.log("TX: "+JSON.stringify(signedTransaction))
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction}, 
                'max'
            );
            
            closeSnackbar(cnfrmkey);
            
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction[0].transaction_signature}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction[0].transaction_signature}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            
            */

            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${JSON.stringify(e)}`,{ variant: 'error' });
            console.log("Error: "+JSON.stringify(e));
            //console.log("Error: "+JSON.stringify(e));
        } 
    }
    
    const uploadReplaceToStoragePool = async (newFile: any, existingFileUrl: string, storagePublicKey: PublicKey, version: string) => { 
        try{
            enqueueSnackbar(`Preparing to upload/replace some files to ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.editFile(new PublicKey(storagePublicKey), existingFileUrl, newFile, version || 'v2');
            //const signedTransaction = await thisDrive.editFile(new PublicKey(storagePublicKey), existingFileUrl, newFile);
            //const latestBlockHash = await connection.getLatestBlockhash();
            
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
            /*
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.transaction_signature}, 
                'max'
            );
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.transaction_signature}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.transaction_signature}
                </Button>
            );
            
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            */
            setTimeout(function() {
                // IMPORTNAT: change to update / fetch only this account files
                fetchStorageAccounts();
            }, 2000);
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${JSON.stringify(e)}`,{ variant: 'error' });
            console.log("Error: "+JSON.stringify(e));
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    const claimStake = async (storagePublicKey: PublicKey) => { 
        try{
            enqueueSnackbar(`Preparing to claim stake ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.claimStake(storagePublicKey);
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction.txid}, 
                'processed'
            );
            closeSnackbar(cnfrmkey);
            const snackaction = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signedTransaction.txid}`} target='_blank'  sx={{color:'white'}}>
                    {signedTransaction.txid}
                </Button>
            );
            enqueueSnackbar(`Transaction Confirmed`,{ variant: 'success', action:snackaction });
            setTimeout(function() {
                fetchStorageAccounts();
            }, 2000);
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

    useEffect(() => {
		(async () => {
			

            if (urlParams){
                console.log("PARAMS: "+urlParams);

                setLoading(true);
                
                // get single storage account
                
                setLoading(false);

            } else if (wallet?.publicKey) {
                setLoading(true);
				const drive = await new ShdwDrive(new Connection(GRAPE_RPC_ENDPOINT), wallet).init();
                //console.log("drive: "+JSON.stringify(drive));
                setThisDrive(drive);
                //const asa = await drive.getStorageAccounts();

                const asa_v1 = await drive.getStorageAccounts('v1');
                const asa_v2 = await drive.getStorageAccounts('v2');
                
                //console.log("all storage accounts: "+JSON.stringify(asa_v2))
                
                if (asa_v2){
                    var asa_v2_array = new Array();
                    for (var account of asa_v2){
                        const body = {
                            storage_account: account.publicKey
                        };
                        console.log("body: "+JSON.stringify(body))
                        
                        const response = await window.fetch('https://shadow-storage.genesysgo.net/storage-account-info', {
                            method: "POST",
                            body: JSON.stringify(body),
                            headers: { "Content-Type": "application/json" },
                        });
                    
                        const json = await response.json();

                        var storage = {
                            publicKey:account.publicKey,
                            account:account.account,
                            additional:{
                                currentUsage:json.current_usage,
                                version:json.version,
                            }

                        }
                        
                        asa_v2_array.push(storage);

                        console.log("storage: "+JSON.stringify(storage));
                    }
                    //setAccountV2(asa_v2);
                    setAccountV2(asa_v2_array);
                } else{
                    //createStoragePool('grape-test-storage', '1MB');
                }

                if (asa_v1){
                    setAccountV1(asa_v1);
                }

                setLoading(false);
			}

		})();
	}, [wallet?.publicKey, urlParams])
	
    function AddStoragePool(props:any){
        const { t, i18n } = useTranslation();
        //const storageAccount = props.storageAccount;
        const [storageSize, setStorageSize] = React.useState(1);
        const [storageSizeUnits, setStorageSizeUnits] = React.useState('MB');
        const [storageLabel, setStorageLabel] = React.useState('My Storage');
        const [open_snackbar, setSnackbarState] = React.useState(false);
        const { enqueueSnackbar } = useSnackbar();
        const { publicKey, wallet } = useWallet();
    
        const [open, setOpen] = React.useState(false);
    
        const handleCloseDialog = () => {
            setOpen(false);
        }
    
        const handleClickOpen = () => {
            setOpen(true);
        };
    
        const handleClose = () => {
            setOpen(false);
        };

        const HandleAllocateNewStoragePool = (event: any) => {
            event.preventDefault();
            if (thisDrive && storageLabel && storageSizeUnits && storageSize){
                setOpen(false);
                createStoragePool(storageLabel, storageSize+storageSizeUnits, 'v2');
            }
        };

        const handleStorageSizeUnitsChange = (event: SelectChangeEvent) => {
            setStorageSizeUnits(event.target.value as string);
          };
    
        return (
            <>
                <Grid item xs={6}>
                    <Box
                        m={1}
                        display = "flex"
                        justifyContent='flex-end'
                        alignItems='center'
                    >
                        
                            <Button 
                                variant="outlined" 
                                onClick={handleClickOpen} 
                                sx={{borderRadius:'17px',}}>
                                <AddCircleIcon sx={{mr:1}} /> Storage
                            </Button>
                            
                    </Box>
                </Grid>
                <BootstrapDialog 
                    maxWidth={"lg"}
                    open={open} onClose={handleClose}
                    PaperProps={{
                        style: {
                            background: '#13151C',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px'
                        }
                        }}
                    >
                    <DialogTitle>
                    {t('Create new storage pool')}
                    </DialogTitle>
                    <form onSubmit={HandleAllocateNewStoragePool}>
                        <DialogContent>
                            <FormControl fullWidth>
                                <TextField
                                    autoFocus
                                    autoComplete='off'
                                    margin="dense"
                                    id=""
                                    label={t('Label')}
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    value={storageLabel}
                                    onChange={(e: any) => {
                                        setStorageLabel(e.target.value)
                                    }}
                                />
                                Label
                            </FormControl>

                            <FormControl sx={{ m: 1, minWidth: 120 }}>
                                <TextField
                                    autoFocus
                                    autoComplete='off'
                                    margin="dense"
                                    id=""
                                    label={t('Set your storage size')}
                                    type="number"
                                    variant="standard"
                                    value={storageSize}
                                    onChange={(e: any) => {
                                    setStorageSize(e.target.value)
                                    }}
                                />
                                Allocation
                            </FormControl>

                            <FormControl sx={{ m: 1, minWidth: 120 }}>
                                <InputLabel id="demo-simple-select-label">Units</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    value={storageSizeUnits}
                                    label="units"
                                    onChange={handleStorageSizeUnitsChange}
                                    >
                                    <MenuItem value={'KB'}>KB</MenuItem>
                                    <MenuItem value={'MB'}>MB</MenuItem>
                                    <MenuItem value={'GB'}>GB</MenuItem>
                                </Select>
                            </FormControl>
                            
                        </DialogContent> 
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button 
                                type="submit"
                                variant="text" 
                                //disabled={((+offer_amount > sol_balance) || (+offer_amount < 0.001) || (+offer_amount < props.highestOffer))}
                                title="Create">
                                    Create
                            </Button>
                        </DialogActions> 
                    </form>
                </BootstrapDialog>
            </>
            
        ); 
    }

    function ReplaceFileFromStorage(props:any){
        const { t, i18n } = useTranslation();
        const storageAccount = props.storageAccount;
        const storageAccountFile = props.storageAccountFile;
        const [uploadFile, setUploadFile] = React.useState(null);

        const [open, setOpen] = React.useState(false);
    
        const handleCloseDialog = () => {
            setOpen(false);
        }
    
        const handleClickOpen = () => {
            setOpen(true);
        };
    
        const handleClose = () => {
            setOpen(false);
        };

        const HandleAllocateReplaceFile = (event: any) => {
            event.preventDefault();
            uploadReplaceToStoragePool(uploadFile, storageAccountFile, new PublicKey(storageAccount.publicKey), 'v2');
            setOpen(false);
        };

        const handleFileUpload = (e:any) => {
            event.preventDefault();
            //console.log(">> Checking: "+JSON.stringify(uploadFile))
            if (uploadFile){
                console.log("Uploading file ("+JSON.stringify(uploadFile)+")...")
                uploadReplaceToStoragePool(uploadFile[0], storageAccountFile, new PublicKey(storageAccount.publicKey), 'v2');
                setOpen(false);
            }
        }
    
        return (
            <>
                <Button 
                    size="small"
                    onClick={handleClickOpen} 
                    sx={{borderRadius:'17px'}}
                    title="Swap"
                
                >
                    <SwapHorizIcon sx={{color:'white'}}/>
                </Button>
                <BootstrapDialog 
                    maxWidth={"lg"}
                    open={open} onClose={handleClose}
                    PaperProps={{
                        style: {
                            background: '#13151C',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px'
                        }
                        }}
                    >
                    <DialogTitle>
                        {t('Replace file')}
                    </DialogTitle>
                        <DialogContent>
                            <FormControl>
                                <FileUpload value={uploadFile} onChange={setUploadFile} />
                            </FormControl>
                            
                        </DialogContent> 
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button 
                                type="submit"
                                variant="text" 
                                title="Replace"
                                onClick={handleFileUpload}>
                                    Replace
                            </Button>
                        </DialogActions> 
                    
                </BootstrapDialog>
            </>
            
        ); 
    }

    function ResizeStoragePool(props:any){
        const { t, i18n } = useTranslation();
        const storageAccount = props.storageAccount;
        const [storageSize, setStorageSize] = React.useState(1);
        const [storageSizeUnits, setStorageSizeUnits] = React.useState('MB');
        const [storageLabel, setStorageLabel] = React.useState('My Storage');
        const [open_snackbar, setSnackbarState] = React.useState(false);
        const { enqueueSnackbar } = useSnackbar();
        const { publicKey, wallet } = useWallet();
        const [add, setAdd] = React.useState("1");

        const [open, setOpen] = React.useState(false);
    
        const handleCloseDialog = () => {
            setOpen(false);
        }
    
        const handleClickOpen = () => {
            setOpen(true);
        };
    
        const handleClose = () => {
            setOpen(false);
        };

        const HandleAllocateResizeStoragePool = (event: any) => {
            event.preventDefault();
            if (thisDrive && storageLabel && storageSizeUnits && storageSize){
                setOpen(false);
                
                if (add === "1")
                    resizeAddStoragePool(new PublicKey(storageAccount.publicKey), storageSize+storageSizeUnits, 'v2')
                else
                    resizeReduceStoragePool(new PublicKey(storageAccount.publicKey), storageSize+storageSizeUnits, 'v2')
            }
        };

        const handleStorageSizeUnitsChange = (event: SelectChangeEvent) => {
            setStorageSizeUnits(event.target.value as string);
          };

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const val = (event.target as HTMLInputElement).value;
            setAdd(val);
        };
    
        return (
            <>
                <Button 
                    onClick={handleClickOpen} 
                    sx={{borderRadius:'17px'}}
                >
                    <StorageIcon sx={{mr:1}} /> Resize
                </Button>
                <BootstrapDialog 
                    maxWidth={"lg"}
                    open={open} onClose={handleClose}
                    PaperProps={{
                        style: {
                            background: '#13151C',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px'
                        }
                        }}
                    >
                    <DialogTitle>
                        {t('Resize storage pool')}
                    </DialogTitle>
                    <form onSubmit={HandleAllocateResizeStoragePool}>
                        <DialogContent>
                            <FormControl>
                                <FormLabel id="demo-radio-buttons-group-label">Resize</FormLabel>
                                    <RadioGroup
                                        aria-labelledby="demo-radio-buttons-group-label"
                                        defaultValue="female"
                                        name="radio-buttons-group"

                                        value={add}
                                        onChange={handleChange}
                                    >
                                        <FormControlLabel control={<Radio />} label="Add" value="1"/>
                                        <FormControlLabel control={<Radio />} label="Remove" value="0"/>
                                </RadioGroup>
                            </FormControl>
                            <FormControl sx={{ m: 1, minWidth: 120 }}>
                                <TextField
                                    autoFocus
                                    autoComplete='off'
                                    margin="dense"
                                    id=""
                                    label={t('Set your storage size')}
                                    type="number"
                                    variant="standard"
                                    value={storageSize}
                                    onChange={(e: any) => {
                                    setStorageSize(e.target.value)
                                    }}
                                />
                                Allocation
                            </FormControl>

                            <FormControl sx={{ m: 1, minWidth: 120 }}>
                                <InputLabel id="demo-simple-select-label">Units</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    value={storageSizeUnits}
                                    label="units"
                                    onChange={handleStorageSizeUnitsChange}
                                    >
                                    <MenuItem value={'KB'}>KB</MenuItem>
                                    <MenuItem value={'MB'}>MB</MenuItem>
                                    <MenuItem value={'GB'}>GB</MenuItem>
                                </Select>
                            </FormControl>
                            
                        </DialogContent> 
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button 
                                type="submit"
                                variant="text" 
                                //disabled={((+offer_amount > sol_balance) || (+offer_amount < 0.001) || (+offer_amount < props.highestOffer))}
                                title="Create">
                                    Resize
                            </Button>
                        </DialogActions> 
                    </form>
                </BootstrapDialog>
            </>
            
        ); 
    }

    function FileItem(props: any){
        const storageAccount = props.storageAccount;
        const file = props.file;
        const version = props.version;
        const [uploadFiles, setUploadFiles] = React.useState(null);
        const key = props.key;
        const [open, setOpen] = React.useState(false);
        const [currentFiles, setCurrentFiles] = React.useState(null);

        const handleCopyClick = () => {
            enqueueSnackbar(`Copied!`,{ variant: 'success' });
        };

        const HandleDeleteStoragePoolFile = (event: any) => {
            event.preventDefault();
            deleteStoragePoolFile(new PublicKey(storageAccount.publicKey), file, 'v'+version);
        };

        const handleFileReplacePopup = () => {
            
        };

        return (

            <ListItemButton sx={{ pl: 4, borderRadius:'17px' }}>
                <ListItemIcon>
                    {isImage(`https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${file}`) ?
                        <Avatar src={`https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${file}`} />
                        :
                        <TextSnippetIcon />
                    }

                </ListItemIcon>
                <ListItemText>
                    {file}

                        <CopyToClipboard 
                            text={`https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${file}`} 
                            onCopy={handleCopyClick}
                            >
                            <Button sx={{color:'white',borderRadius:'17px'}} title="Copy" size="small">
                                <ContentCopyIcon />
                            </Button>
                        </CopyToClipboard> 
                        <ReplaceFileFromStorage storageAccount={storageAccount} storageAccountFile={`https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${file}`} />
                    <Button 
                        sx={{color:'white',borderRadius:'17px'}} 
                        href={`https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${file}`}
                        target="_blank"
                        title="View"
                    >   
                        <OpenInNewIcon />
                    </Button>
                    
                    <Button onClick={HandleDeleteStoragePoolFile} color="error" title="delete" size="small" sx={{borderRadius:'17px'}} >
                        <DeleteIcon />
                    </Button>
                
                </ListItemText>
            </ListItemButton>
        )

    }

    function RenderStorage(props: any){
        const account = props.account;
        const version = props.version;
        
        return (
            <>
            {account
            .sort((a:any, b:any) => a.account.creationTime < b.account.creationTime ? 1 : -1)
            .map((storageAccount: any, key: number) => (
                <RenderStorageRow storageAccount={storageAccount} key={key} version={version}/>
            ))}
            </>
        );
    }

    class Assignable {
        constructor(properties) {
          Object.keys(properties).map((key) => {
            return (this[key] = properties[key]);
          });
        }
    }
    class AccoundData extends Assignable {}
    const dataSchema = new Map([
        [
          AccoundData,
          {
            kind: "struct",
            fields: [
              ["initialized", "u8"],
              ["filetest", "u32"],
              ["test", "u64"],
            ],
          },
        ],
      ]);

    function RenderStorageRow(props: any){
        const storageAccount = props.storageAccount;
        const version = props.version;
        const [uploadFiles, setUploadFiles] = React.useState(null);
        //const key = props.key;
        const [open, setOpen] = React.useState(false);
        const [currentFiles, setCurrentFiles] = React.useState(null);
        const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);

        const getStorageFiles = async (storagePublicKey: PublicKey) => { 
            //const asa = await thisDrive.getStorageAccount(storagePublicKey);

            //const accountInfo = await ggoconnection.getAccountInfo(storagePublicKey);
            
            //for (const storageAccount of accountInfo) {
                
                let fileAccounts = []
                let fileCounter = new BN(storageAccount.account.initCounter).toNumber() - 1;
                for (let counter = 0; counter <= fileCounter; counter++) {
                  let fileSeed = new BN(counter).toTwos(64).toArrayLike(Buffer, "le", 4);
                  let [file, fileBump] = await PublicKey.findProgramAddress(
                    [storageAccount.publicKey.toBytes(), fileSeed],
                    new PublicKey("2e1wdyNhUvE76y6yUCvah2KaviavMJYKoRun8acMRBZZ")//programClient.programId
                  );
                  fileAccounts.push(file)
                }
                
            //}

            /*
            const fileInfo = await ggoconnection.getMultipleAccountsInfo(fileAccounts);
            
            //console.log("fileInfo: "+JSON.stringify(fileInfo));
            for (var metavalue of fileInfo){
                if (metavalue?.data){
const deserialized = deserializeUnchecked(dataSchema, AccoundData, metavalue?.data);
                    console.log("deserialized: "+JSON.stringify(deserialized));

                }
            }*/
            
            const body = {
                storageAccount: storagePublicKey.toString()
            };

            const response = await thisDrive.listObjects(storagePublicKey)

            setCurrentFiles(response.keys);
        }

        const handleClickExpandRow = () => {
            setOpen(!open);
            getStorageFiles(storageAccount.publicKey);
        };

        const handleFileUpload = (e:any) => {
            //console.log(">> Checking: "+JSON.stringify(uploadFiles))
            if (uploadFiles){
                // check if file name already exists, if it does then do a file replacement
                let found = false;
                for (let file of uploadFiles){
                    for (let cFile of currentFiles){
                        //console.log("comparing "+file?.path + " vs "+cFile)
                        if (file?.path === cFile){
                            // found === true
                            found = true;
                        }
                    }
                }
                if (!found){
                    console.log("Uploading file ("+JSON.stringify(uploadFiles)+")...")
                    uploadToStoragePool(uploadFiles, storageAccount.publicKey);
                } else{
                    console.log("Found: " +uploadFiles.length);
                    if (uploadFiles.length <= 1){
                        const path = `https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${uploadFiles[0].path}`;
                        console.log("Replacing: "+path)
                        uploadReplaceToStoragePool(uploadFiles[0], path, new PublicKey(storageAccount.publicKey), 'v'+version);
                    }
                }
            }
        }

        const HandleDeleteStoragePool = (event: any) => {
            event.preventDefault();
            deleteStoragePool(new PublicKey(storageAccount.publicKey), 'v'+version);
        };

        const HandleCancelDeleteStoragePool = (event: any) => {
            event.preventDefault();
            cancelDeleteStoragePool(new PublicKey(storageAccount.publicKey), 'v'+version);
        };

        const HandleMigrateStoragePool = (event: any) => {
            event.preventDefault();
            migrateStoragePool(new PublicKey(storageAccount.publicKey));
        };


        const HandleClaimStake = (event: any) => {
            event.preventDefault();
            claimStake(new PublicKey(storageAccount.publicKey));
        };

        const HandleLockStoragePool = (event: any) => {
            event.preventDefault();
            lockStoragePool(new PublicKey(storageAccount.publicKey), 'v'+version);
        };


        return (
            <Box sx={{borderBottom:'1px solid #333', borderRadius:'17px'}}>
                <ListItemButton sx={{borderRadius:'17px'}} onClick={handleClickExpandRow}>
                    <ListItemAvatar>
                    <Avatar>
                        {/*<SolanaIcon sx={{fontSize:"30px",ml:0.45,mt:1}} />*/}
                        
                        <CloudCircleIcon />
                    </Avatar>
                    </ListItemAvatar>
                    <ListItemText>
                        <Typography variant="h6">
                            
                            {storageAccount.account.toBeDeleted ?
                                <del>
                                    {`${storageAccount.account.identifier}`} 
                                    <Button sx={{borderRadius:'17px'}}>
                                        <WarningIcon color="error" />
                                    </Button>
                                </del>
                            :
                                <>
                                    {`${storageAccount.account.identifier}`}
                                </>
                            }
                        </Typography>
                        
                        <Typography variant="caption">
                            {console.log("storageAccount: "+JSON.stringify(storageAccount?.additional))}
                            <>
                                {storageAccount?.additional ?
                                    <>{calculateStorageUsed((+storageAccount.account.storage - storageAccount?.additional.currentUsage),storageAccount.account.storage)} - {moment.unix(+storageAccount.account.creationTime).format("MMMM Do YYYY, h:mm a")}</>
                                :
                                    <>
                                    {`${calculateStorageUsed(storageAccount.account?.storageAvailable,storageAccount.account.storage)} - ${moment.unix(+storageAccount.account.creationTime).format("MMMM Do YYYY, h:mm a")}`}
                                    </>
                                }
                            </>
                            
                        </Typography>
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </ListItemText>
                </ListItemButton>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListSubheader component="div" sx={{p:1, borderRadius:'17px'}}>
                        <Grid 
                            container 
                            direction="column" 
                            spacing={1} 
                            alignItems="center"
                            justifyContent={'center'}
                        >
                            <Paper 
                                sx={{p:0,background:'#000', borderRadius:'17px'}}
                            >
                                <Typography variant="caption">
                                    {`${storageAccount.publicKey}`} v{version}
                                </Typography>
                            </Paper>
                            {!storageAccount.account.toBeDeleted && 
                                <>
                                    <Grid 
                                        item xs={12}
                                    >
                                            <FileUpload value={uploadFiles} onChange={setUploadFiles} />
                                    </Grid>
                                    <Grid 
                                        item xs={12}
                                    >
                                            {/*uploadFiles && (uploadFiles.length > 0) && uploadFiles.length*/}
                                    </Grid>
                                    <Grid 
                                        item xs={12}
                                    >
                                            <Button 
                                                disabled={!uploadFiles ||(uploadFiles.length < 1)}
                                                variant="outlined"
                                                component="span" 
                                                onClick={handleFileUpload}
                                                sx={{borderRadius:'17px'}}>
                                                    <SaveIcon sx={{mr:1}} /> Save File
                                            </Button>
                                    </Grid>
                                </>
                            }
                            <Grid 
                                item xs={12}
                            >   
                                <ButtonGroup size="small" variant="outlined" aria-label="small outlined button group" sx={{ml:1, color:'white'}}>
                                    <>
                                        {!storageAccount.account.toBeDeleted &&
                                            <ResizeStoragePool storageAccount={storageAccount} />
                                        }
                                        
                                        {!storageAccount.account.immutable && !storageAccount.account.toBeDeleted ?
                                            <Button onClick={HandleLockStoragePool} sx={{borderRadius:'17px'}}>
                                                <LockOpenIcon sx={{mr:1}} /> Lock
                                            </Button>
                                        :
                                            <Button sx={{borderRadius:'17px'}} disabled>
                                                <LockIcon sx={{mr:1}} /> Locked
                                            </Button>
                                        }
                                        {!storageAccount.account.toBeDeleted ?
                                            <Button onClick={HandleDeleteStoragePool} color="error" sx={{borderRadius:'17px'}}>
                                                <DeleteIcon sx={{mr:1}} /> Delete
                                            </Button>
                                        :
                                            <Button onClick={HandleCancelDeleteStoragePool} color="warning" sx={{borderRadius:'17px'}}>
                                                <RestoreIcon sx={{mr:1}} /> Restore
                                            </Button>
                                        }
                                    </>

                                    {/*
                                    <Button onClick={HandleClaimStake} color="warning" sx={{borderRadius:'17px'}}>
                                        <DownloadIcon sx={{mr:1}} /> Claim Stake
                                    </Button>
                                    */}
                                </ButtonGroup>
                            </Grid>
                                {version === 1 &&
                                    <Grid 
                                        item xs={12}
                                    >
                                        <Button
                                            variant='outlined'
                                            onClick={HandleMigrateStoragePool} color="warning" sx={{borderRadius:'17px'}}
                                        >
                                            Migrate to v2
                                        </Button>
                                    </Grid>
                                }
                                
                            
                            <Paper
                                sx={{background:'#000'}}
                            >
                                <Grid container sx={{p:0,m:0}}>
                                    <Grid item xs={12}>   
                                        {storageAccount.account?.totalCostOfCurrentStorage &&
                                            <Button sx={{color:'#fff'}} title={`Last Fee Epoch: ${(storageAccount.account.lastFeeEpoch)}`}> 
                                                {(storageAccount.account.totalCostOfCurrentStorage/LAMPORTS_PER_SOL)}<SolCurrencyIcon sx={{ml:0.5,mr:1,fontSize:"12px"}}  /> Storage Cost
                                            </Button>
                                        }
                                        
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                        </ListSubheader>
                        
                        {currentFiles && currentFiles.map((file: any, key: number) => (
                            <FileItem storageAccount={storageAccount} file={file} version={version} />
                        ))}

                    </List>
                </Collapse>
            </Box>
        )    
        
    }

    return (
        <>
            <Box
                sx={{ 
                    p: 1, 
                    mt: 6,
                    mb: 3, 
                    width: '100%',
                    background: '#13151C',
                    borderRadius: '24px'
                }}
            > 
                    <Grid 
                        container 
                        direction="column" 
                        spacing={2} 
                        alignItems="center"
                        justifyContent={'center'}
                        rowSpacing={8}
                    >
                        
                        <Grid 
                            item sm={12}
                            alignItems="center"
                        >

                            {accountV2 && wallet.publicKey ?
                                <List 
                                    component="nav" 
                                    sx={{ width: '100%' }}
                                    subheader={
                                        <>
                                        {/*
                                            <ListSubheader component="div" id="nested-list-subheader" sx={{borderRadius:'17px'}}>
                                            Athens DAO/Hacker HouseX
                                                <Button
                                                    variant="outlined"
                                                    color="warning"
                                                    sx={{borderRadius:'17px',ml:1}}
                                                >
                                                    <LocalFireDepartmentIcon sx={{mr:1}} /> START
                                                </Button>
                                            </ListSubheader>
                                        */}
                                        <ListSubheader component="div" id="nested-list-subheader" sx={{borderRadius:'17px'}}>
                                          <Grid container direction="row">
                                                <Grid item xs={6}>
                                                    Shadow Storage
                                                </Grid>
                                                <AddStoragePool account={accountV2} />
                                            </Grid>
                                        </ListSubheader>
                                        
                                        </>
                                    }>
                                    <RenderStorage account={accountV2} version={2} />
                                </List>
                            :
                                <>
                                {loading ?
                                <>
                                    <CircularProgress />
                                </>
                                :
                                <>
                                    
                                    {wallet.publicKey ?
                                        <ListSubheader component="div" id="nested-list-subheader" sx={{borderRadius:'17px'}}>
                                            <Grid container direction="row">
                                                <Grid item xs={6}>
                                                    Shadow Storage
                                                </Grid>
                                                <AddStoragePool account={accountV2} />
                                            </Grid>
                                        </ListSubheader>
                                    :
                                        <WalletConnectButton />
                                    }
                                </>
                            }
                            </>
                            }


                            {accountV1 && wallet.publicKey &&
                                <List 
                                    component="nav" 
                                    sx={{ width: '100%' }}
                                    subheader={
                                        <>
                                        </>
                                    }>
                                    <RenderStorage account={accountV1} version={1} />
                                </List>
                            }
                        </Grid>
                    </Grid>
                </Box>
        </>
	)
}