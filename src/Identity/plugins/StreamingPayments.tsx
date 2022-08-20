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

import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DownloadingIcon from '@mui/icons-material/Downloading';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import OpacityIcon from '@mui/icons-material/Opacity';

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

export function StreamingPaymentsView(props: any){
    const setLoadingPosition = props.setLoadingPosition;
    const pubkey = props.pubkey;
    const tokenMap = props.tokenMap;
    const [selectionModel, setSelectionModel] = React.useState(null);
    const [streamingPayments, setStreamingPayments] = React.useState(null);
    const [streamingPaymentsRows, setStreamingPaymentsRows] = React.useState(null);
    const [loadingStreamingPayments, setLoadingStreamingPayments] = React.useState(false);
    const wallet = useWallet();
    const { publicKey, sendTransaction, signTransaction } = useWallet();
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

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
        { field: 'id', headerName: 'ID', width: 70, hide: true },
        { field: 'source', headerName: 'Source', width: 100 },
        { field: 'mint', headerName: 'Mint', width: 150, align: 'center',
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
        { field: 'name', headerName: 'Name', width: 200, align: 'center' },
        { field: 'sender', headerName: 'Sender', width: 100, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                        {trimAddress(params.value,4)}
                    </>
                );
            }
        },
        { field: 'amountPerPeriod', headerName: 'Payout Period', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                        <Typography variant='body2' color='green'>
                        {+params.value.amountPerPeriod/(10 ** tokenMap.get(params.value.mint)?.decimals)} <OpacityIcon sx={{fontSize:'14px'}} /> every {secondsToHms(params.value.period)}
                        </Typography>
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
        { field: 'canceledAt', headerName: 'Canceled', width: 200, align: 'center',
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
        { field: 'end', headerName: 'End Date', width: 200, align: 'center',
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
        { field: 'lastWithdrawnAt', headerName: 'Last Withdraw', width: 200, align: 'center',
            renderCell: (params) => {
                return(
                    <>
                        {+params.value !== 0 &&
                            <>{moment.unix(+params.value).format("MMMM Do YYYY, h:mm a")}</>
                        }
                    </>
                )
            }
        },
        { field: 'withdrawalFrequency', headerName: 'withdrawalFrequency', width: 200, align: 'center', hide: true,
            renderCell: (params) => {
                return(
                    <>
                        {secondsToHms(+params.value)}
                    </>
                );
            } 
        },
        { field: 'transferableByRecipient', headerName: 'Transferable', width: 100, align: 'center',
            renderCell: (params) => {
                return(
                    <>  
                        {params.value ?
                            <CheckCircleIcon sx={{color:'green'}} />
                        :
                            <CancelIcon sx={{color:'red'}} />
                        }
                    </>
                )
            }
        },
        { field: 'manage', headerName: '', width: 250,  align: 'center',
            renderCell: (params) => {
                return (
                    <>
                    {publicKey && pubkey === publicKey.toBase58() ?
                        <ButtonGroup>
                            {/*
                            <Button
                                variant='outlined'
                                size='small'
                                onClick={(e) => withdrawStream(params.value.id)}
                                sx={{borderTopLeftRadius:'17px',borderBottomLeftRadius:'17px'}}
                            >Withdraw</Button>
                            {params.value?.transferableByRecipient === true &&
                                <Button
                                    variant='outlined'
                                    size='small'
                                >Transfer</Button>
                            }
                        */}
                            <Button
                                variant='outlined'
                                size='small'
                                component='a'
                                href={`https://app.streamflow.finance/all-streams`}
                                target='_blank'
                                sx={{borderTopRightRadius:'17px',borderBottomRightRadius:'17px'}}
                            >
                                <SettingsIcon />
                            </Button>
                        </ButtonGroup>
                    :
                        <></>
                    }
                    </>
                )
            }
        },
        
      ];

      async function withdrawStream(stream:string) {
        
        const withdrawStreamParams = {
            invoker: wallet, // Wallet/Keypair signing the transaction.
            id: stream, // Identifier of a stream to be withdrawn from.
            amount: null//getBN(100000000000, 9), // Requested amount to withdraw. If stream is completed, the whole amount will be withdrawn.
        };
        
        try {
            const { ixs, tx } = await StreamPaymentClient.withdraw(withdrawStreamParams);

            const transaction = new Transaction()
            .add(ixs[0])

            enqueueSnackbar(`Preparing to withdraw`,{ variant: 'info' });
            const signedTransaction = await sendTransaction(transaction, connection, {
                skipPreflight: true,
                preflightCommitment: "confirmed"
            });
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            //await connection.confirmTransaction(signature, 'processed');
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction}, 
                'processed'
            );
            closeSnackbar(cnfrmkey);
            const action = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                        Signature: {signedTransaction}
                    </Button>
            );
            enqueueSnackbar(`Withdraw complete`,{ variant: 'success', action });
            try{
                //refresh...
            }catch(err:any){console.log("ERR: "+err)}
        }catch(e:any){
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
        }   
    }

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
                        source:'Streamflow',
                        amountPerPeriod:{
                            mint:item[1].mint,
                            amountPerPeriod:item[1].amountPerPeriod,
                            period:item[1].period,
                        },
                        mint:item[1].mint,
                        createdAt:item[1].createdAt,
                        canceledAt:item[1].canceledAt,
                        end:item[1].end,
                        lastWithdrawnAt:item[1].lastWithdrawnAt,
                        withdrawalFrequency:item[1].withdrawalFrequency,
                        transferableByRecipient:item[1].transferableByRecipient,
                        manage:{
                            id:item[0],
                            transferableByRecipient:item[1].transferableByRecipient,
                        }
                    });
                    
                }
                setStreamingPayments(streams);
                setStreamingPaymentsRows(streamingTable);
                setLoadingStreamingPayments(false);
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