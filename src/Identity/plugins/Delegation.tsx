import React from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
// @ts-ignore
import { PublicKey, Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';

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

const delegationcolumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    { field: 'voterAccount', headerName: 'Voter Account', width: 150,
        renderCell: (params) => {
            return (
                <ExplorerView address={params.value} type='address' shorten={4} hideTitle={false} style='text' color='white' fontSize='14px' />
            )
        }    
    },
    { field: 'stakeAccount', headerName: 'Stake Account', width: 150,
        renderCell: (params) => {
            return (
                <ExplorerView address={params.value} type='address' shorten={4} hideTitle={false} style='text' color='white' fontSize='14px' />
            )
        }
    }, { field: 'amount', headerName: 'Amount', width: 150, hide: true,
        renderCell: (params) => {
            return (
                <>{params.value ? (params.value/(10 ** 9)).toFixed(3) : '-'}</>
            )
        }
    },
  ];

export function DelegationView(props: any){
    const setLoadingPosition = props.setLoadingPosition;
    const pubkey = props.pubkey;

    const [loading, setLoading] = React.useState(false);
    const [history, setHistory] = React.useState(null);
    const [loanSummary, setLoanSummary] = React.useState(null);
    const [delegationAccounts, setDelegationAccounts] = React.useState(null);
    const connection = RPC_CONNECTION;
    
    const getDelegationAccounts = async () => {
        
        if ((!loading) && (pubkey)){
            setLoading(true);

            console.log("Fetching delegation data")

            setLoadingPosition("Fetching wallet delegations");

            // do something...
        }
        setLoading(false);
    }

    React.useEffect(() => {
        if (pubkey){
            getDelegationAccounts();
        }
    }, [pubkey]);

    return(
        <>
        {loading ?
            <LinearProgress />
        :
            <>
                {delegationAccounts && 
                    <div style={{ height: 600, width: '100%' }}>
                        <div style={{ display: 'flex', height: '100%' }}>
                            <div style={{ flexGrow: 1 }}>
                                
                                <DataGrid
                                    rows={delegationAccounts}
                                    columns={delegationcolumns}
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