import React, { useEffect, Suspense, useCallback } from "react";
import { styled } from '@mui/material/styles';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import moment from 'moment';
import { Global } from '@emotion/react';
import { Link, useParams, useSearchParams } from "react-router-dom";
// @ts-ignore
import { PublicKey, Connection, Commitment } from '@solana/web3.js';
import {ENV, TokenInfo, TokenListProvider} from '@solana/spl-token-registry';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletError } from '@solana/wallet-adapter-base';
import { useTranslation } from 'react-i18next';
import { ShdwDrive } from "@shadow-drive/sdk";
import { useSnackbar } from 'notistack';

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

import ExpandIcon from '@mui/icons-material/Expand';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';

import { GRAPE_RPC_ENDPOINT, THEINDEX_RPC_ENDPOINT, GRAPE_PROFILE, GRAPE_PREVIEW, DRIVE_PROXY } from '../../utils/grapeTools/constants';
import { load } from "../../browser";

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
                        sx={{borderTopLeftRadius:'17px',borderBottomLeftRadius:'17px'}}
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

    React.useEffect(() => {
        if (pubkey){
            fetchStorage();
        }
    }, [pubkey]);

    const storagecolumns: GridColDef[] = [
        { field: 'id', headerName: 'Pool', width: 70, hide: true },
        { field: 'name', headerName: 'Name', width: 200, align: 'center' },
        { field: 'created', headerName: 'Created', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    moment.unix(+params.value).format("MMMM Do YYYY, h:mm a")
                )
            }
        },
        { field: 'storage', headerName: 'Storage', width: 130, align: 'center',
            renderCell: (params) => {
                return (
                    formatBytes(+params.value)
                )
            } 
        },
        { field: 'used', headerName: 'Used', width: 130, align: 'center',
            renderCell: (params) => {
                return (
                    formatBytes(+params.value)
                )
            } 
        },
        { field: 'available', headerName: 'Available', width: 130, align: 'center',
            renderCell: (params) => {
                return (
                    formatBytes(+params.value)
                )
            } 
        },
        { field: 'immutable', headerName: 'Immutable', width: 130, align: 'center'},
        { field: 'manage', headerName: '', width: 200,  align: 'center',
            renderCell: (params) => {
                return (
                    <>
                        {publicKey && pubkey === publicKey.toBase58() ?
                            <ButtonGroup>
                                <ResizeStoragePool storageAccount={params.value.storageAccount} />
                                <Tooltip title='Delete Storage Pool'>
                                    <Button onClick={(e) =>
                                        //e.preventDefault();
                                        deleteStoragePool(new PublicKey(params.value.id), params.value.version)
                                    } 
                                        color="error" 
                                        >
                                        <DeleteIcon/>
                                    </Button>
                                </Tooltip>
                                <Tooltip title='Manage Storage Pool'>
                                    <Button
                                        variant='outlined'
                                        component='a'
                                        href={`https://grapedrive.vercel.app`}
                                        target='_blank'
                                        sx={{borderTopRightRadius:'17px',borderBottomRightRadius:'17px'}}
                                    ><SettingsIcon /></Button>
                                </Tooltip>
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
                    console.log("body: "+JSON.stringify(body))
                    
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
                setSolanaStorageRows(storageTable);
            } else{
                //createStoragePool('grape-test-storage', '1MB');
            }

            if (asa_v1){
                setAccountV1(asa_v1);
            }
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
                                                    sortModel: [{ field: 'domain', sort: 'desc' }],
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
                                                sortModel: [{ field: 'domain', sort: 'desc' }],
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