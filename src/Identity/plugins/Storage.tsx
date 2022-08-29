import React, { useEffect, Suspense, useCallback } from "react";
import { styled } from '@mui/material/styles';
import { DataGridPro } from '@mui/x-data-grid-pro';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Global } from '@emotion/react';
import { Link, useParams, useSearchParams } from "react-router-dom";
// @ts-ignore
import { BN } from '@project-serum/anchor';
import { PublicKey, Connection, Commitment } from '@solana/web3.js';
import {ENV, TokenInfo, TokenListProvider} from '@solana/spl-token-registry';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletError } from '@solana/wallet-adapter-base';
import { useTranslation } from 'react-i18next';
import { ShdwDrive } from "@shadow-drive/sdk";
import { useSnackbar } from 'notistack';

import file_size_url from 'file_size_url';
import FileUpload from "react-material-file-upload";
import {CopyToClipboard} from 'react-copy-to-clipboard';

import {
    Button,
    ButtonGroup,
    Stack,
    Typography,
    Grid,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    TextField,
    InputLabel,
    Select,
    MenuItem,
    FormLabel,
    FormControlLabel,
    Radio,
    RadioGroup,
    IconButton,
    Container,
    Skeleton,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Tooltip,
    SwipeableDrawer,
    CssBaseline,
    Tab,
    Hidden,
    Badge,
    LinearProgress,
    CircularProgress,
} from '@mui/material';

import { SelectChangeEvent } from '@mui/material/Select';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import RestoreIcon from '@mui/icons-material/Restore';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import ExpandIcon from '@mui/icons-material/Expand';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';

import { GRAPE_RPC_ENDPOINT, 
    THEINDEX_RPC_ENDPOINT, 
    GRAPE_PROFILE, 
    GRAPE_PREVIEW, 
    DRIVE_PROXY,
    PROXY } from '../../utils/grapeTools/constants';
import { load } from "../../browser";
import { ParaglidingSharp } from "@mui/icons-material";
import { stateDiscriminator } from "@project-serum/anchor/dist/cjs/coder";
import { UniqueOperationNamesRule } from "graphql";

const Input = styled('input')({
    display: 'none',
});

LinearProgressWithLabel.propTypes = {
    /**
     * The value of the progress indicator for the determinate and buffer variants.
     * Value between 0 and 100.
     */
    value: PropTypes.number.isRequired,
};

function LinearProgressWithLabel(props:any) {
    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress color="inherit" variant="determinate" {...props} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(
                props.value,
                )}%`}</Typography>
            </Box>
            </Box>
            <Box sx={{ alignItems: 'center', textAlign: 'center', mt:-2}}>
                <Typography variant="caption">
                    storage used
                </Typography>
            </Box>
        </>
    );
  }

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
    const setLoadingPosition = props.setLoadingPosition;
    const { connection } = useConnection();
    const [selectionModel, setSelectionModel] = React.useState(null);
    const [selectionModelClose, setSelectionModelClose] = React.useState(null);
    const [solanaStorage, setSolanaStorage] = React.useState(null);
    const [solanaStorageRows, setSolanaStorageRows] = React.useState(null);
    const [loadingStorage, setLoadingStorage] = React.useState(false);
    const { publicKey } = useWallet();
    const pubkey = props.pubkey || publicKey?.toBase58();
    const [thisDrive, setThisDrive] = React.useState(null);
    const [accountV1, setAccountV1] = React.useState(null);
	const [accountV2, setAccountV2] = React.useState(null);
    
    const wallet = useWallet();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );


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
                fetchStorage();
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
                fetchStorage();
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
                fetchStorage();
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
                fetchStorage();
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
                fetchStorage();
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
                fetchStorage();
            }, 2000);
            
        }catch(e){
            closeSnackbar();
            enqueueSnackbar(`${e}`,{ variant: 'error' });
            console.log("Error: "+e);
            //console.log("Error: "+JSON.stringify(e));
        } 
    }

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
                <Grid container sx={{mt:1,mb:1}}>
                    <Grid item xs={12} alignContent={'right'} textAlign={'right'}>
                        <Button
                            variant="contained"
                            color="success" 
                            title={`Add Storage Pool`}
                            onClick={handleClickOpen}
                            size="large"
                            fullWidth
                            sx={{borderRadius:'17px'}}
                            >
                            Add Storage Pool
                        </Button>
                    </Grid>
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
                    <BootstrapDialogTitle id="create-storage-pool" onClose={handleCloseDialog}>
                        {t('Create new storage pool')}
                    </BootstrapDialogTitle>
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
                            <Button variant="text" onClick={handleCloseDialog}>Cancel</Button>
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
                <Tooltip title="Resize Storage Pool">
                    <Button 
                        onClick={handleClickOpen} 
                        sx={{color:'white',borderTopRightRadius:'17px',borderBottomRightRadius:'17px'}}
                    >
                        <ExpandIcon />
                    </Button>
                </Tooltip>
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
                    <BootstrapDialogTitle id="resize-storage-pool" onClose={handleCloseDialog}>
                        {t('Resize storage pool')}
                    </BootstrapDialogTitle>
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
                            <Button variant="text" onClick={handleCloseDialog}>Cancel</Button>
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

    function StoragePoolDetails(props:any){
        const { t, i18n } = useTranslation();
        const storageAccount = props.storageAccount;
        const version = props.version || 'V2';
        const current_usage = props.current_usage || 0;
        const [open_snackbar, setSnackbarState] = React.useState(false);
        const { enqueueSnackbar } = useSnackbar();
        const { publicKey, wallet } = useWallet();
        const [currentFiles, setCurrentFiles] = React.useState(null);
        const [solanaStorageFileRows, setSolanaStorageFileRows] = React.useState(null);
        const [loadingStorageFiles, setLoadingStorageFiles] = React.useState(false);
        const [open, setOpen] = React.useState(false);
        const [uploadFiles, setUploadFiles] = React.useState(null);

        const available = storageAccount.account.storage - current_usage;
        const allocated = storageAccount.account.storage;

        const handleCloseDialog = () => {
            setOpen(false);
        }
    
        const handleClickOpen = () => {
            setOpen(true);
            getStorageFiles(storageAccount.publicKey);
        };
    
        const handleClose = () => {
            setOpen(false);
        };

        const handleCopyClick = () => {
            enqueueSnackbar(`Copied!`,{ variant: 'success' });
        };

        const getStorageFiles = async (storagePublicKey: PublicKey) => { 
            setLoadingStorageFiles(true);
            setUploadFiles(null);
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
            
            console.log("Fetching files for: "+storagePublicKey.toBase58())

            const body = {
                storageAccount: storagePublicKey.toBase58()
            };

            const response = await thisDrive.listObjects(storagePublicKey)

            //console.log("response: "+JSON.stringify(response));

            var file_items = new Array();
            if (response?.keys){
                for (var item of response.keys){

                    file_items.push({
                        id:item,
                        file:item,
                        created:'',
                        size:item,
                        manage:item,
                    })
                }
            }

            setSolanaStorageFileRows(file_items);
            setCurrentFiles(response.keys);
            setLoadingStorageFiles(false);
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
                    getStorageFiles(storageAccount.publicKey);
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
                    getStorageFiles(storageAccount.publicKey);
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
                    getStorageFiles(storageAccount.publicKey);
                }, 2000);
            }catch(e){
                closeSnackbar();
                enqueueSnackbar(`${JSON.stringify(e)}`,{ variant: 'error' });
                console.log("Error: "+JSON.stringify(e));
                //console.log("Error: "+JSON.stringify(e));
            } 
        }

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



        const filecolumns: GridColDef[] = [
            { field: 'id', headerName: '', width: 70, hide: true,
                renderCell: (params) => {
                    return(
                        <>
                            .
                        </>
                    )
                }
            },
            { field: 'file', headerName: 'File', minWidth: 200, flex: 1, 
                renderCell: (params) => {
                    return(
                        <>
                        {isImage(`https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${params.value}`) ?
                            <Avatar alt={params.value} src={`https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${params.value}`} sx={{ width: 20, height: 20, bgcolor: 'rgb(0, 0, 0)', mr:1 }}>
                                {params.value.substr(0,2)}
                            </Avatar>
                            :
                            <TextSnippetIcon />
                        }
                        
                        {params.value}
                    </>
                    )
                }
            },
            { field: 'date', headerName: 'Date', width: 100, hide: true,
                renderCell: (params) => {
                    return(
                        <>
                            ...
                        </>
                    )
                }
            },
            { field: 'size', headerName: 'Size', width: 100, hide: true,
                renderCell: (params) => {
                    return(
                        <>
                            ...
                        </>
                    )
                }
            },
            { field: 'manage', headerName: '', width: 200, 
                renderCell: (params) => {
                    return(
                        <>
                            {publicKey && publicKey.toBase58() === pubkey &&
                                <>
                                    <CopyToClipboard 
                                        text={`https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${params.value}`} 
                                        onCopy={handleCopyClick}
                                        >
                                        <Button sx={{color:'white',borderRadius:'17px'}} title="Copy" size="small">
                                            <ContentCopyIcon />
                                        </Button>
                                    </CopyToClipboard> 
                                    <Button 
                                        sx={{color:'white',borderRadius:'17px'}} 
                                        href={`https://shdw-drive.genesysgo.net/${storageAccount.publicKey}/${params.value}`}
                                        target="_blank"
                                        title="View"
                                    >   
                                        <OpenInNewIcon />
                                    </Button>
                                    
                                    <Button 
                                        onClick={(e) => 
                                            deleteStoragePoolFile(new PublicKey(storageAccount.publicKey), params.value, version)
                                        } 
                                        color="error" title="delete" size="small" sx={{borderRadius:'17px'}} >
                                        <DeleteIcon />
                                    </Button>
                                </>
                            }
                        </>

                    )
                }
            }
        ]

        return (
            <>
                <Tooltip title="Files">
                    <Button 
                        onClick={handleClickOpen} 
                        sx={{color:'white',borderRadius:'17px',p:0,m:0,minWidth:0}}
                    >
                        <AddCircleOutlineIcon />
                    </Button>
                </Tooltip>
                <BootstrapDialog 
                    maxWidth={"xl"}
                    fullWidth={true}
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
                    <BootstrapDialogTitle id="manage-storage-files" onClose={handleCloseDialog}>
                        View/Manage Files: {storageAccount.account.identifier}
                        <Box sx={{ width: '100%' }}>
                            <LinearProgressWithLabel value={100-(+available/+allocated*100)} />
                        </Box>
                    </BootstrapDialogTitle>
                        <DialogContent>
                           {!loadingStorageFiles && solanaStorageFileRows ?
                                <>
                                    {!storageAccount.account.toBeDeleted && 
                                        <>
                                            {publicKey && publicKey.toBase58() === pubkey &&
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
                                                {uploadFiles &&
                                                    <Grid 
                                                        item xs={12}
                                                        textAlign='right'
                                                        sx={{mt:1,mb:1}}
                                                    >
                                                            <Button 
                                                                disabled={!uploadFiles ||(uploadFiles.length < 1)}
                                                                variant="outlined"
                                                                component="span" 
                                                                onClick={handleFileUpload}
                                                                sx={{borderRadius:'17px'}}>
                                                                    <SaveIcon sx={{mr:1}} /> Upload File
                                                            </Button>
                                                    </Grid>
                                                }
                                            </>
                                            }
                                        </>
                                    }
                                    <div style={{ height: 600, width: '100%' }}>
                                        <div style={{ display: 'flex', height: '100%' }}>
                                            <div style={{ flexGrow: 1 }}>
                                                {publicKey && publicKey.toBase58() === pubkey ?
                                                    
                                                    <DataGrid
                                                        rows={solanaStorageFileRows}
                                                        columns={filecolumns}
                                                        pageSize={25}
                                                        rowsPerPageOptions={[]}
                                                        initialState={{
                                                            sorting: {
                                                                sortModel: [{ field: 'file', sort: 'desc' }],
                                                            },
                                                        }}
                                                        sx={{
                                                            borderRadius:'17px',
                                                            borderColor:'rgba(255,255,255,0.25)',
                                                            '& .MuiDataGrid-cell':{
                                                                borderColor:'rgba(255,255,255,0.25)'
                                                            }}}
                                                        sortingOrder={['asc', 'desc', null]}
                                                        disableSelectionOnClick
                                                    />
                                                    
                                                :
                                                    <DataGrid
                                                        rows={solanaStorageFileRows}
                                                        columns={filecolumns}
                                                        initialState={{
                                                            sorting: {
                                                                sortModel: [{ field: 'file', sort: 'desc' }],
                                                            },
                                                        }}
                                                        sx={{
                                                            borderRadius:'17px',
                                                            borderColor:'rgba(255,255,255,0.25)',
                                                            '& .MuiDataGrid-cell':{
                                                                borderColor:'rgba(255,255,255,0.25)'
                                                            }}}
                                                        pageSize={25}
                                                        rowsPerPageOptions={[]}
                                                    />
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </>
                            :
                                <LinearProgress />
                            }

                        </DialogContent>  

                </BootstrapDialog>
            </>
            
        ); 
    }

    React.useEffect(() => {
        if (pubkey){
            fetchStorage();
        }
    }, [pubkey]);

    const storagecolumns: GridColDef[] = [
        { field: 'expand', headerName: '', width: 25, 
            renderCell: (params) => {
                return(
                    <>
                        <StoragePoolDetails storageAccount={params.value.storageAccount} version={params.value.version} current_usage={params.value.current_usage} />
                    </>
                )
            }
        },
        { field: 'id', headerName: 'Pool', width: 70, hide: true },
        { field: 'source', headerName: 'Source', width: 150,
            renderCell: (params) => {
                return(
                    <>
                        <Avatar alt={params.value} src={params.value.logoURI} sx={{ width: 20, height: 20, bgcolor: 'rgb(0, 0, 0)', mr:1 }}>
                            {params.value.name.substr(0,2)}
                        </Avatar>
                        {params.value.name}
                    </>
                )
            }
        },
        { field: 'name', headerName: 'Name', minWidth: 200, flex: 1, align: 'left', 
            renderCell: (params) => {
                return(
                    params.value
                )
            }
        },
        { field: 'created', headerName: 'Created', width: 170, align: 'center',
            renderCell: (params) => {
                return(
                    <Typography variant='caption'>
                        {moment.unix(+params.value).format("MMMM Do YYYY, h:mm a")}
                    </Typography>
                )
            }
        },
        { field: 'storage', headerName: 'Storage', width: 100, align: 'center',
            renderCell: (params) => {
                return (
                    formatBytes(+params.value)
                )
            } 
        },
        { field: 'used', headerName: 'Used', width: 100, align: 'center',
            renderCell: (params) => {
                return (
                    formatBytes(+params.value)
                )
            } 
        },
        { field: 'available', headerName: 'Available', width: 100, align: 'center',
            renderCell: (params) => {
                return (
                    formatBytes(+params.value)
                )
            } 
        },
        { field: 'immutable', headerName: 'Immutable', width: 130, align: 'center', hide:true},
        { field: 'manage', headerName: '', width: 200,  align: 'center',
            renderCell: (params) => {
                return (
                    <>
                        {publicKey && pubkey === publicKey.toBase58() ?
                            <ButtonGroup>
                                {!params.value.storageAccount.account.immutable && !params.value.storageAccount.account.toBeDeleted ?
                                     <Tooltip title='Lock Storage Pool'>
                                        <Button onClick={
                                            (e) =>
                                                //e.preventDefault();
                                                lockStoragePool(new PublicKey(params.value.id), params.value.version)
                                            } 
                                            sx={{color:'white',borderTopLeftRadius:'17px',borderBottomLeftRadius:'17px'}} >
                                            <LockOpenIcon />
                                        </Button>
                                    </Tooltip>
                                :
                                    <Tooltip title='Storage Pool is locked'>
                                        <Button 
                                            sx={{color:'white',borderTopLeftRadius:'17px',borderBottomLeftRadius:'17px'}}
                                            disabled>
                                            <LockIcon/>
                                        </Button>
                                    </Tooltip>
                                }

                                <ResizeStoragePool storageAccount={params.value.storageAccount} />
                                
                                {!params.value.storageAccount.account.toBeDeleted ?
                                    <Tooltip title='Delete Storage Pool'>
                                        <Button onClick={(e) =>
                                            //e.preventDefault();
                                            deleteStoragePool(new PublicKey(params.value.id), params.value.version)
                                        }  color="error">
                                            <DeleteIcon />
                                        </Button>
                                    </Tooltip>
                                :
                                    <Tooltip title='Restore Storage Pool'>
                                        <Button onClick={(e) =>
                                            //e.preventDefault();
                                            cancelDeleteStoragePool(new PublicKey(params.value.id), params.value.version)
                                        }  color="warning">
                                            <RestoreIcon />
                                        </Button>
                                    </Tooltip>
                                }
                                
                            </ButtonGroup>
                        :
                            <></>
                        }
                    </>
                )
            }
        },
      ];

      const fetchStorage = async () => {
        setLoadingStorage(true);
        setLoadingPosition('Storage');
        
            const drive = await new ShdwDrive(new Connection(GRAPE_RPC_ENDPOINT), wallet).init();
            //console.log("drive: "+JSON.stringify(drive));
            setThisDrive(drive);
            //const asa = await drive.getStorageAccounts();

            const asa_v1 = await drive.getStorageAccounts('v1');
            const asa_v2 = await drive.getStorageAccounts('v2');
            
            //console.log("all storage accounts: "+JSON.stringify(asa_v2))
            
            const storageTable = new Array();
            if (asa_v2){
                var asa_v2_array = new Array();
                for (var item of asa_v2){
                    const body = {
                        storage_account: item.publicKey
                    };
                    //console.log("body: "+JSON.stringify(body))
                    
                    const response = await window.fetch('https://shadow-storage.genesysgo.net/storage-account-info', {
                        method: "POST",
                        body: JSON.stringify(body),
                        headers: { "Content-Type": "application/json" },
                    });
                
                    const json = await response.json();

                    var storage = {
                        publicKey:item.publicKey,
                        account:item.account,
                        additional:{
                            currentUsage:json.current_usage,
                            version:json.version,
                        }

                    }
                    
                    asa_v2_array.push(storage);

                    storageTable.push({
                        id:item.publicKey.toBase58(),
                        expand:{
                            storageAccount:item,
                            version:json.version,
                            current_usage:json.current_usage,
                        },
                        source:{
                            name: 'Shadow Drive',
                            logoURI: 'https://shdw-drive.genesysgo.net/5VhicqNTPgvJNVPHPp8PSH91YQ6KnVAeukW1K37GJEEV/genesysgo.png'
                        },
                        name:item.account.identifier,
                        created:item.account.creationTime,
                        storage:item.account.storage,
                        used:json.current_usage,
                        available:+item.account.storage - +json.current_usage,
                        immutable:item.account.immutable,
                        manage:{
                            id:item.publicKey.toBase58(),
                            version:json.version,
                            storageAccount:item,
                        }
                    });

                    console.log("storage: "+JSON.stringify(storage));
                }

                //setAccountV2(asa_v2);
                setAccountV2(asa_v2_array);
                
                setSolanaStorage(asa_v2_array);
                
            } else{
                //createStoragePool('grape-test-storage', '1MB');
            }

            if (asa_v1){
                setAccountV1(asa_v1);

                for (var item of asa_v1){
                    storageTable.push({
                        id:item.publicKey.toBase58(),
                        expand:{
                            storageAccount:item,
                            version:"v1",
                            current_usage:+item.account.storage - +item.account.storageAvailable,
                        },
                        source:{
                            name: 'Shadow Drive',
                            logoURI: 'https://shdw-drive.genesysgo.net/5VhicqNTPgvJNVPHPp8PSH91YQ6KnVAeukW1K37GJEEV/genesysgo.png'
                        },
                        name:item.account.identifier,
                        created:item.account.creationTime,
                        storage:item.account.storage,
                        used:+item.account.storage - +item.account.storageAvailable,
                        available:+item.account.storageAvailable,
                        immutable:item.account.immutable,
                        manage:{
                            id:item.publicKey.toBase58(),
                            version:"v1",
                            storageAccount:item,
                        }
                    })
                }

                console.log("asa_v1: "+JSON.stringify(asa_v1));
            }
            setSolanaStorageRows(storageTable);
        setLoadingStorage(false);
    }

    return (
        <>
        {loadingStorage ?
            <LinearProgress />
        :
            <>
                {solanaStorage && solanaStorageRows &&
                    
                    <>
                        {publicKey && publicKey.toBase58() === pubkey &&
                            <AddStoragePool />
                        }
                    
                        <div style={{ height: 600, width: '100%' }}>
                            <div style={{ display: 'flex', height: '100%' }}>
                                <div style={{ flexGrow: 1 }}>
                                    {publicKey && publicKey.toBase58() === pubkey ?
                                        
                                        <DataGrid
                                            rows={solanaStorageRows}
                                            columns={storagecolumns}
                                            pageSize={25}
                                            rowsPerPageOptions={[]}
                                            onSelectionModelChange={(newSelectionModel) => {
                                                setSelectionModel(newSelectionModel);
                                            }}
                                            initialState={{
                                                sorting: {
                                                    sortModel: [{ field: 'name', sort: 'desc' }],
                                                },
                                            }}
                                            sx={{
                                                borderRadius:'17px',
                                                borderColor:'rgba(255,255,255,0.25)',
                                                '& .MuiDataGrid-cell':{
                                                    borderColor:'rgba(255,255,255,0.25)'
                                                }}}
                                            sortingOrder={['asc', 'desc', null]}
                                            disableSelectionOnClick
                                        />
                                        
                                    :
                                        <DataGrid
                                            rows={solanaStorageRows}
                                            columns={storagecolumns}
                                            initialState={{
                                                sorting: {
                                                    sortModel: [{ field: 'name', sort: 'desc' }],
                                                },
                                            }}
                                            sx={{
                                                borderRadius:'17px',
                                                borderColor:'rgba(255,255,255,0.25)',
                                                '& .MuiDataGrid-cell':{
                                                    borderColor:'rgba(255,255,255,0.25)'
                                                }}}
                                            pageSize={25}
                                            rowsPerPageOptions={[]}
                                        />
                                    }
                                </div>
                            </div>
                        </div>
                    </>
                }
                </>
            }
        </>

    )
}