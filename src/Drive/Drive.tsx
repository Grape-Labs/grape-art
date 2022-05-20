import React, { useEffect, useCallback } from "react";
import { ShdwDrive } from "@shadow-drive/sdk";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, Connection, PublicKey } from '@solana/web3.js';
import { TokenAmount } from '../utils/grapeTools/safe-math';

import { useSnackbar } from 'notistack';
import { WalletError } from '@solana/wallet-adapter-base';
import { WalletConnectButton } from "@solana/wallet-adapter-material-ui";

import { useTranslation } from 'react-i18next';

import moment from 'moment';

import { 
    MARKET_LOGO,
    GRAPE_RPC_ENDPOINT
} from '../utils/grapeTools/constants';

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
    Select,
    MenuItem,
    InputLabel,
    Paper,
} from '@mui/material';

import { SelectChangeEvent } from '@mui/material/Select';

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
import { StorageTwoTone } from "@mui/icons-material";

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

function formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function calculateStorageUsed(available: any, allocated: any){
    const percentage = 100-(+available.toNumber()/+allocated.toNumber()*100);
    const storage_string = percentage + "% of " + formatBytes(allocated);
    return storage_string;
}

export function DriveView(props: any){
	const { connection } = useConnection();
	const wallet = useWallet();
	const [account, setAccount] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [thisDrive, setThisDrive] = React.useState(null);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );

    const fetchStorageAccounts = async () => { 
        const storedAccount = await thisDrive.getStorageAccounts();
        setAccount(storedAccount);
    }

    const createStoragePool = async (name: string, size: string) => { 
        try{
            enqueueSnackbar(`Preparing to create storage ${name}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.createStorageAccount(name, size)
            await connection.confirmTransaction(signedTransaction.txid, 'processed');
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

    const cancelDeleteStoragePool = async (storagePublicKey: PublicKey) => { 
        try{
            enqueueSnackbar(`Preparing to delete storage ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.cancelDeleteStorageAccount(storagePublicKey);
            await connection.confirmTransaction(signedTransaction.txid, 'processed');
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

    const deleteStoragePool = async (storagePublicKey: PublicKey) => { 
        try{
            enqueueSnackbar(`Preparing to delete storage ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.deleteStorageAccount(storagePublicKey);
            await connection.confirmTransaction(signedTransaction.txid, 'processed');
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

    const lockStoragePool = async (storagePublicKey: PublicKey) => { 
        try{
            enqueueSnackbar(`Preparing to lock storage ${storagePublicKey.toString()}`,{ variant: 'info' });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const signedTransaction = await thisDrive.makeStorageImmutable(storagePublicKey);
            await connection.confirmTransaction(signedTransaction.txid, 'processed');
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
			if (wallet?.publicKey) {
                setLoading(true);
				const drive = await new ShdwDrive(new Connection(GRAPE_RPC_ENDPOINT), wallet).init();
                //console.log("drive: "+JSON.stringify(drive));
                setThisDrive(drive);
                const asa = await drive.getStorageAccounts(); // .getStorageAccount(wallet.publicKey);
                //console.log("all storage accounts: "+JSON.stringify(asa))
                
                if (asa){
                    setAccount(asa);
                } else{
                    //createStoragePool('grape-test-storage', '1MB');
                }

                setLoading(false);
			}
		})();
	}, [wallet?.publicKey])
	
    function AddStoragePool(props:any){
        const { t, i18n } = useTranslation();
        const storageAccount = props.storageAccount;
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
                createStoragePool(storageLabel, storageSize+storageSizeUnits);
            }
        };

        const handleStorageSizeUnitsChange = (event: SelectChangeEvent) => {
            setStorageSizeUnits(event.target.value as string);
          };
    
        return (
            <>
                <Tooltip title={t('Create new storage pool')}>
  
                    <Button variant="outlined" onClick={handleClickOpen} sx={{ml:1,borderRadius:'17px'}}>
                        <AddCircleIcon sx={{mr:1}} /> Storage
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
                                    label={t('Set your storage size in kb')}
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
                                    <MenuItem value={'TB'}>GB</MenuItem>
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

    function RenderStorageRow(props: any){
        const storageAccount = props.storageAccount;
        const [filesToUpload, setFilesToUpload] = React.useState(null);
        const key = props.key;
        const [open, setOpen] = React.useState(false);
        
        const handleClickExpandRow = () => {
            setOpen(!open);
        };

        const uploadToStoragePool = async (files: any, storagePublicKey: PublicKey) => { 
            try{
                enqueueSnackbar(`Preparing to upload some files to ${storagePublicKey.toString()}`,{ variant: 'info' });
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                const signedTransaction = await thisDrive.uploadMultipleFiles(storagePublicKey, files);
                //const signedTransaction = await thisDrive.uploadFile(storagePublicKey, files[0]);
                await connection.confirmTransaction(signedTransaction.txid, 'processed');
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
                enqueueSnackbar(`${JSON.stringify(e)}`,{ variant: 'error' });
                console.log("Error: "+JSON.stringify(e));
                //console.log("Error: "+JSON.stringify(e));
            } 
        }

        const handleFileUpload = (e:any) => {
            const file = e.target.files;
            console.log("Clouds are boring...")
            if (file){
                console.log("Taking this to web3...")
                uploadToStoragePool(file, storageAccount.publicKey)
            }
        }

        const HandleDeleteStoragePool = (event: any) => {
            event.preventDefault();
            deleteStoragePool(new PublicKey(storageAccount.publicKey));
        };

        const HandleCancelDeleteStoragePool = (event: any) => {
            event.preventDefault();
            cancelDeleteStoragePool(new PublicKey(storageAccount.publicKey));
        };

        const HandleLockStoragePool = (event: any) => {
            event.preventDefault();
            lockStoragePool(new PublicKey(storageAccount.publicKey));
        };

        return (
            <Box sx={{borderBottom:'1px solid #333', borderRadius:'17px'}}>
                <ListItemButton key={key} sx={{borderRadius:'17px'}} onClick={handleClickExpandRow}>
                    <ListItemAvatar>
                    <Avatar>
                        <CloudCircleIcon />
                    </Avatar>
                    </ListItemAvatar>
                    <ListItemText>
                        <Typography variant="h6">
                            {`${storageAccount.account.identifier}`} 
                            {storageAccount.account.toBeDeleted &&
                                <Tooltip title="Pending to be deleted">
                                    <Button sx={{borderRadius:'17px'}}>
                                        <WarningIcon color="error" />
                                    </Button>
                                </Tooltip>
                            }
                        </Typography>
                        
                        <Typography variant="caption">
                            {`${calculateStorageUsed(storageAccount.account.storageAvailable,storageAccount.account.storage)} - ${moment.unix(+storageAccount.account.creationTime).format("MMMM Do YYYY, h:mm a")}`}
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
                                sx={{p:1,background:'#000', borderRadius:'17px'}}
                            >
                                <Typography variant="caption">
                                    {`${storageAccount.publicKey}`}
                                </Typography>
                            </Paper>
                            {!storageAccount.account.toBeDeleted &&
                                <Grid 
                                    item xs={12}
                                >
                                    <label htmlFor="contained-shdw-file">
                                        <Input 
                                            //accept="image/*" 
                                            id="contained-shdw-file" 
                                            onChange={handleFileUpload}
                                            //multiple 
                                            type="file" />
                                        <Button 
                                            variant="outlined" 
                                            component="span" 
                                            sx={{borderRadius:'17px'}}>
                                            <AddCircleIcon sx={{mr:1}} /> File
                                        </Button>
                                    </label>
                                </Grid>
                            }
                            <Grid 
                                item xs={12}
                            >   
                                <ButtonGroup variant="outlined" aria-label="outlined primary button group">
                                    {!storageAccount.account.toBeDeleted &&
                                        <Button sx={{borderRadius:'17px'}} disabled>
                                            <StorageIcon sx={{mr:1}} /> Resize
                                        </Button>
                                    }
                                    {console.log(JSON.stringify(storageAccount))}
                                    {!storageAccount.account.immutable && !storageAccount.account.toBeDeleted ?
                                        <Tooltip title="Make Immutable">
                                            <Button onClick={HandleLockStoragePool}  sx={{borderRadius:'17px'}}>
                                                <LockOpenIcon sx={{mr:1}} /> Lock
                                            </Button>
                                        </Tooltip>
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

                                </ButtonGroup>
                                
                            </Grid>
                            <Paper
                                sx={{background:'#000'}}
                            >
                                <Typography variant="caption">
                                    Storage Cost: {(storageAccount.account.totalCostOfCurrentStorage/LAMPORTS_PER_SOL)}
                                </Typography>
                            </Paper>
                        </Grid>
                        </ListSubheader>
                    
                        
                        <ListItemButton sx={{ pl: 4, borderRadius:'17px' }}>
                            <ListItemIcon>
                                <TextSnippetIcon />
                            </ListItemIcon>
                            <ListItemText primary="Test" />
                        </ListItemButton>
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
                            item xs={12}
                            alignItems="center"
                        >

                            {account && wallet.publicKey ?
                                <List 
                                    component="nav" 
                                    sx={{ width: '100%' }}
                                    subheader={
                                        <ListSubheader component="div" id="nested-list-subheader" sx={{borderRadius:'17px'}}>
                                          SHDW Storage Allocation
                                            <AddStoragePool account={account} />
                                        </ListSubheader>
                                    }>
                                    {account.map((storageAccount: any, key: number) => (
                                        <RenderStorageRow storageAccount={storageAccount} key={key}/>
                                    ))}
                                </List>
                            :
                                <>
                                {loading ?
                                <>
                                    <CircularProgress />
                                </>
                                :
                                <>
                                    <WalletConnectButton />
                                </>
                            }
                            </>
                            }
                        </Grid>
                    </Grid>
                </Box>
        </>
	)
}