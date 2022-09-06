import React, { useEffect, Suspense } from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import moment from 'moment';
import { Global } from '@emotion/react';
import { Link, useParams, useSearchParams } from "react-router-dom";
// @ts-ignore
import { Signer, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import {ENV, TokenInfo, TokenListProvider} from '@solana/spl-token-registry';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSnackbar } from 'notistack';

import { styled } from '@mui/material/styles';

import {
    Button,
    ButtonGroup,
    Stack,
    Typography,
    Grid,
    Box,
    Container,
    Skeleton,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    IconButton,
    TextField,
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

import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DownloadingIcon from '@mui/icons-material/Downloading';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import OpacityIcon from '@mui/icons-material/Opacity';

import { GRAPE_RPC_ENDPOINT, THEINDEX_RPC_ENDPOINT, GRAPE_PROFILE, GRAPE_PREVIEW, DRIVE_PROXY } from '../../utils/grapeTools/constants';
import { load } from "../../browser";
import { PanoramaVerticalSelect } from "@mui/icons-material";
import { trimAddress } from "../../utils/grapeTools/WalletAddress";

function secondsToHms(d:number) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour " : " hours ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute " : " minutes ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay; 
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
  }));
  
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

export function SquadsView(props: any){
    const setLoadingPosition = props.setLoadingPosition;
    const pubkey = props.pubkey;
    const tokenMap = props.tokenMap;
    const [selectionModel, setSelectionModel] = React.useState(null);
    const [squads, setSquads] = React.useState(null);
    const [squadsRows, setSquadsRows] = React.useState(null);
    const [loadingSquads, setLoadingSquads] = React.useState(false);
    const wallet = useWallet();
    
    const { publicKey, sendTransaction } = useWallet();
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    React.useEffect(() => {
        if (pubkey){
            fetchSquads();
        }
    }, [pubkey]);

    const squadscolumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70, hide: true },
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
        { field: 'address', headerName: 'Address', width: 75, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                        {params.value}
                    </>
                ) 
            }
        },
        { field: 'manage', headerName: '', width: 270,  align: 'center',
            renderCell: (params) => {
                return (
                    <>
                    {publicKey && pubkey === publicKey.toBase58() ?
                        <>            
                            <Tooltip title="Manage this squad">
                                <Button
                                    variant='outlined'
                                    size='small'
                                    component='a'
                                    href={`https://v3.squads.so`}
                                    target='_blank'
                                    sx={{borderTopRightRadius:'17px',borderBottomRightRadius:'17px'}}
                                >
                                    <SettingsIcon />
                                </Button>
                            </Tooltip>
                        </>
                    :
                        <></>
                    }
                    </>
                )
            }
        },
        
      ];

      
      const fetchSquads = async () => {
        setLoadingSquads(true);
        setLoadingPosition('Squads');
        
        try {
            // add loading code here...
            setLoadingSquads(false);
            //console.log("squads: "+JSON.stringify(squads))
        } catch (exception) {
            // handle exception
        }


        setLoadingSquads(false);
    }

    return (
        <>
        {loadingSquads ?
            <LinearProgress />
        :
            <>
                {loadingSquads && squadsRows &&
                    <div style={{ height: 600, width: '100%' }}>
                        <div style={{ display: 'flex', height: '100%' }}>
                            <div style={{ flexGrow: 1 }}>
                                {publicKey && publicKey.toBase58() === pubkey ?
                                    <DataGrid
                                        rows={squadsRows}
                                        columns={squadscolumns}
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
                                        rows={squadsRows}
                                        columns={squadscolumns}
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
                }
                </>
            }
        </>

    )
}