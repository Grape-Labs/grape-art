import React, { useEffect, Suspense } from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import moment from 'moment';
import { Global } from '@emotion/react';
import { Link, useParams, useSearchParams } from "react-router-dom";
// @ts-ignore
import { PublicKey, Connection, Commitment } from '@solana/web3.js';
import {ENV, TokenInfo, TokenListProvider} from '@solana/spl-token-registry';
import { useWallet } from '@solana/wallet-adapter-react';

import { ShdwDrive } from "@shadow-drive/sdk";

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

import { GRAPE_RPC_ENDPOINT, THEINDEX_RPC_ENDPOINT, GRAPE_PROFILE, GRAPE_PREVIEW, DRIVE_PROXY } from '../../utils/grapeTools/constants';
import { load } from "../../browser";

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
    const pubkey = props.pubkey;
    const [selectionModel, setSelectionModel] = React.useState(null);
    const [selectionModelClose, setSelectionModelClose] = React.useState(null);
    const [solanaStorage, setSolanaStorage] = React.useState(null);
    const [solanaStorageRows, setSolanaStorageRows] = React.useState(null);
    const [loadingStorage, setLoadingStorage] = React.useState(false);
    const { publicKey } = useWallet();
    const [thisDrive, setThisDrive] = React.useState(null);
    const [accountV1, setAccountV1] = React.useState(null);
	const [accountV2, setAccountV2] = React.useState(null);
    const wallet = useWallet();

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
        { field: 'link', headerName: '', width: 150,  align: 'center',
            renderCell: (params) => {
                return (
                    <>
                    {publicKey && pubkey === publicKey.toBase58() ?
                        <Button
                            variant='outlined'
                            size='small'
                            component='a'
                            href={`https://grapedrive.vercel.app`}
                            target='_blank'
                            sx={{borderRadius:'17px'}}
                        >Manage</Button>
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
                        link:item.publicKey.toBase58()
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
                }
                </>
            }
        </>

    )
}