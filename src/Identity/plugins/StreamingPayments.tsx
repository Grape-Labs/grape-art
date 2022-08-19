import React, { useEffect, Suspense } from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import moment from 'moment';
import { Global } from '@emotion/react';
import { Link, useParams, useSearchParams } from "react-router-dom";
// @ts-ignore
import { PublicKey, Connection, Commitment } from '@solana/web3.js';
import {ENV, TokenInfo, TokenListProvider} from '@solana/spl-token-registry';
import { useWallet } from '@solana/wallet-adapter-react';

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

import {
    StreamClient,
    Stream,
    CreateParams,
    CreateMultiParams,
    WithdrawParams,
    TransferParams,
    TopupParams,
    CancelParams,
    GetAllParams,
    StreamDirection,
    StreamType,
    Cluster,
    TxResponse,
    CreateResponse,
    BN,
    getBN,
    getNumberFromBN,
} from "@streamflow/stream";

import { GRAPE_RPC_ENDPOINT, THEINDEX_RPC_ENDPOINT, GRAPE_PROFILE, GRAPE_PREVIEW, DRIVE_PROXY } from '../../utils/grapeTools/constants';
import { load } from "../../browser";

export function StreamingPaymentsView(props: any){
    const setLoadingPosition = props.setLoadingPosition;
    const pubkey = props.pubkey;
    const tokenMap = props.tokenMap;
    const [selectionModel, setSelectionModel] = React.useState(null);
    const [streamingPayments, setStreamingPayments] = React.useState(null);
    const [streamingPaymentsRows, setStreamingPaymentsRows] = React.useState(null);
    const [loadingStreamingPayments, setLoadingStreamingPayments] = React.useState(false);
    const { publicKey } = useWallet();
    const wallet = useWallet();
    const connection = new Connection(GRAPE_RPC_ENDPOINT);

    const StreamPaymentClient = new StreamClient(
        GRAPE_RPC_ENDPOINT, // "https://api.mainnet-beta.solana.com",
        Cluster.Mainnet,
        "confirmed"
    );

    React.useEffect(() => {
        if (pubkey){
            fetchStreamingPayments();
        }
    }, [pubkey]);

    const streamingcolumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'name', headerName: 'Name', width: 200, align: 'center' },
        { field: 'sender', headerName: 'sender', width: 200, align: 'center' },
        { field: 'mint', headerName: 'Mint', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                        <Avatar alt={params.value} src={tokenMap.get(params.value).logoURI} sx={{ width: 40, height: 40, bgcolor: 'rgb(0, 0, 0)', mr:1 }}>
                            {params.value.substr(0,2)}
                        </Avatar>
                        {tokenMap.get(params.value).name}
                    </>
                )
            }
        },
        { field: 'amountPerPeriod', headerName: 'amountPerPeriod', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                        {+params.value.amountPerPeriod/(10 ** tokenMap.get(params.value.mint)?.decimals)}
                    </>
                );
            }
        },
        { field: 'period', headerName: 'period', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                        {moment.utc(params.value*1000).format('HH:mm:ss')}
                    </>
                );
            }
        },
        { field: 'createdAt', headerName: 'Created', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                    {+params.value !== 0 ?
                        moment.unix(+params.value).format("MMMM Do YYYY, h:mm a")
                    :
                        <></>
                    }
                    </>
                )
            }
        },
        { field: 'canceledAt', headerName: 'canceledAt', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                    {+params.value !== 0 ?
                        moment.unix(+params.value).format("MMMM Do YYYY, h:mm a")
                    :
                        <></>
                    }
                    </>
                )
            }
        },
        { field: 'end', headerName: 'end', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                    {+params.value !== 0 ?
                        moment.unix(+params.value).format("MMMM Do YYYY, h:mm a")
                    :
                        <></>
                    }
                    </>
                )
            }
        },
        { field: 'lastWithdrawnAt', headerName: 'lastWithdrawnAt', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                        {+params.value !== 0 &&
                            <>{params.value}</>
                        }
                    </>
                )
            }
        },
        { field: 'withdrawalFrequency', headerName: 'withdrawalFrequency', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                        {moment.utc(params.value*1000).format('HH:mm:ss')}
                    </>
                );
            } 
        },
        { field: 'transferableByRecipient', headerName: 'transferableByRecipient', width: 200, align: 'center' },
        { field: 'link', headerName: '', width: 150,  align: 'center',
            renderCell: (params) => {
                return (
                    <>
                    {publicKey && pubkey === publicKey.toBase58() ?
                        <Button
                            variant='outlined'
                            size='small'
                            component='a'
                            href={`https://app.streamflow.finance/all-streams`}
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

      const fetchStreamingPayments = async () => {
        setLoadingStreamingPayments(true);
        setLoadingPosition('Streaming Payments');
        
        try {
            const streams = await StreamPaymentClient.get({
                wallet: new PublicKey(pubkey), // Wallet signing the transaction.
                type: StreamType.All, // (optional) Type, default is StreamType.All
                direction: StreamDirection.All, // (optional) Direction, default is StreamDirection.All)
            });

            if (streams){
                const streamingTable = new Array();
                for (var item of streams){
                    console.log("item: "+JSON.stringify(item))
                    
                    streamingTable.push({
                        id:item[0],
                        name:item[1].name,
                        sender:item[1].sender,
                        period:item[1].period,
                        amountPerPeriod:{
                            mint:item[1].mint,
                            amountPerPeriod:item[1].amountPerPeriod,
                        },
                        mint:item[1].mint,
                        createdAt:item[1].createdAt,
                        canceledAt:item[1].canceledAt,
                        end:item[1].end,
                        lastWithdrawnAt:item[1].lastWithdrawnAt,
                        withdrawalFrequency:item[1].withdrawalFrequency,
                        transferableByRecipient:item[1].transferableByRecipient,
                        manage:item[0]
                    });
                    
                }
                setStreamingPayments(streams);
                setStreamingPaymentsRows(streamingTable);
            }
            //console.log("streams: "+JSON.stringify(streams))
        } catch (exception) {
            // handle exception
        }


        setLoadingStreamingPayments(false);
    }

    return (
        <>
        {loadingStreamingPayments ?
            <LinearProgress />
        :
            <>
                {streamingPayments && streamingPaymentsRows &&
                    <div style={{ height: 600, width: '100%' }}>
                        <div style={{ display: 'flex', height: '100%' }}>
                            <div style={{ flexGrow: 1 }}>
                                {publicKey && publicKey.toBase58() === pubkey ?
                                    <DataGrid
                                        rows={streamingPaymentsRows}
                                        columns={streamingcolumns}
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
                                        rows={streamingPaymentsRows}
                                        columns={streamingcolumns}
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