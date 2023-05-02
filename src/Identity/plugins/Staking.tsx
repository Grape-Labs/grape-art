import React from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
// @ts-ignore
import { PublicKey, Connection } from '@solana/web3.js';

import ExplorerView from '../../utils/grapeTools/Explorer';
import { getBackedTokenMetadata } from '../../utils/grapeTools/strataHelpers';

import { RestClient } from "@hellomoon/api";
import axios from "axios";

import {
    Button,
    LinearProgress,
    Typography,
    Tooltip,
    Grid,
    Box,
    Badge,
} from '@mui/material';

import { 
    RPC_CONNECTION,
    HELLO_MOON_BEARER,
    RPC_ENDPOINT
} from '../../utils/grapeTools/constants';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../../utils/grapeTools/WalletAddress'; // global key handling

const stakecolumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    { field: 'address', headerName: 'Stake Wallet', width: 150,
        renderCell: (params) => {
            return (
                <ExplorerView address={params.value} type='address' shorten={4} hideTitle={false} style='text' color='white' fontSize='14px' />
            )
        }    
    },
    { field: 'voter', headerName: 'Delegation', width: 150,
        renderCell: (params) => {
            return (
                <ExplorerView address={params.value} type='address' shorten={4} hideTitle={false} style='text' color='white' fontSize='14px' />
            )
        }
    },
    { field: 'lamports', headerName: 'Balance', width: 150, flex: 1, align: 'right',
        renderCell: (params) => {
            return (
                <>{params.value ? `◎ ${(params.value/(10 ** 9)).toFixed(3)}` : '-'}</>
            )
        }
    },
    { field: 'epochAge', headerName: 'Age (Epochs)', width: 150, align: 'right',
        renderCell: (params) => {
            return (
                <>{params.value < 0 ? `${params.value}` : params.value}</>
            )
        }
    },
    { field: 'epochStart', headerName: 'Start', width: 150, hide: true },
    { field: 'epochCurrent', headerName: 'Current Epoch', width: 150, hide: true },
    { field: 'creditsObserved', headerName: 'creditsObserved', width: 150, hide: true },
    { field: 'activationEpoch', headerName: 'activationEpoch', width: 150, hide: true },
    { field: 'warmupCooldownRate', headerName: 'warmupCooldownRate', width: 150, hide: true },
    { field: 'stake', headerName: 'stake', width: 150, hide: true,
        renderCell: (params) => {
            return (
                <>{params.value ? (params.value/(10 ** 9)).toFixed(3) : '-'}</>
            )
        }
    },
  ];

export function StakingView(props: any){
    const setLoadingPosition = props.setLoadingPosition;
    const pubkey = props.pubkey;
    const [loading, setLoading] = React.useState(false);
    const [history, setHistory] = React.useState(null);
    const [loanSummary, setLoanSummary] = React.useState(null);
    const [stakeAccounts, setStakeAccounts] = React.useState(null);
    const connection = RPC_CONNECTION;
    
    const STAKE_PROGRAM_PK = new PublicKey('Stake11111111111111111111111111111111111111');
    const WALLET_OFFSET = 44;
    const DATA_SIZE = 200;

    const getStakeAccounts = async () => {
        
        if ((!loading) && (pubkey)){
            setLoading(true);

            console.log("Fetching staking data")

            setLoadingPosition("Fetching wallet staking");

            const stakeAccounts = await connection.getParsedProgramAccounts(
                STAKE_PROGRAM_PK, {
                filters: [
                    {
                      dataSize: DATA_SIZE, // number of bytes
                    },
                    {
                      memcmp: {
                        offset: WALLET_OFFSET, // number of bytes
                        bytes: pubkey, // base58 encoded string
                      },
                    },
                  ]
                }
            );

            const staking: any[] = [];
            let cnt = 0;
            for (let item of stakeAccounts){

                const epochStart = Number(item.account.data.parsed?.info.stake.delegation.activationEpoch);
                const epochCurrent = Number(item.account.rentEpoch);
                const epochAge = epochCurrent - epochStart;

                staking.push({
                    id: cnt,
                    voter: new PublicKey(item.account.data.parsed.info?.stake.delegation.voter).toBase58(),
                    address: new PublicKey(item.pubkey).toBase58(),
                    lamports: item.account.lamports,
                    creditsObserved: item.account.data.parsed?.info.stake.creditsObserved,
                    activationEpoch: item.account.data.parsed?.info.stake.delegation.activationEpoch,
                    warmupCooldownRate: item.account.data.parsed?.info.stake.delegation.warmupCooldownRate,
                    stake: item.account.data.parsed?.info.stake.delegation.stake,
                    epochStart: epochStart,
                    epochCurrent: epochCurrent,
                    epochAge: epochAge,
                })
                cnt++;
            }

            setStakeAccounts(staking); 
        }
        setLoading(false);
    }

    React.useEffect(() => {
        if (pubkey){
            getStakeAccounts();
        }
    }, [pubkey]);

    return(
        <>
        {loading ?
            <LinearProgress />
        :
            <>
                {/*loanSummary &&
                    <Grid container spacing={0}>
                        <Grid item xs={12} sm={6} md={2} lg={2} key={1}>
                            <Box
                                sx={{
                                    borderRadius:'24px',
                                    m:2,
                                    p:1,
                                    background: 'rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                <Typography variant="body2" sx={{color:'yellow'}}>
                                    <>TITLE</>
                                </Typography>
                                
                                <Typography textAlign='center'>
                                    <Tooltip title={<>some info</>}>
                                        <Button
                                            color='inherit'
                                            sx={{borderRadius:'17px'}}
                                        >
                                            <Typography variant="h4" textAlign='center'>
                                                data
                                            </Typography>
                                        </Button>
                                    </Tooltip>
                                </Typography>
                            </Box>
                        </Grid>
                
                */}


                {stakeAccounts && 
                    <div style={{ height: 600, width: '100%' }}>
                        <div style={{ display: 'flex', height: '100%' }}>
                            <div style={{ flexGrow: 1 }}>
                                
                                <DataGrid
                                    rows={stakeAccounts}
                                    columns={stakecolumns}
                                    initialState={{
                                        sorting: {
                                            sortModel: [{ field: 'value', sort: 'desc' }],
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
                                
                            </div>
                        </div>
                    </div>    
                }
            </>
        }
        </>
    );
}