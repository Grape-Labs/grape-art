import React from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
// @ts-ignore
import { PublicKey, Connection } from '@solana/web3.js';

import ExplorerView from '../../utils/grapeTools/Explorer';

import axios from "axios";

import {
    Button,
    LinearProgress,
    Typography,
    Tooltip,
    Grid,
    Box,
    Badge,
    Avatar,
} from '@mui/material';

import { 
    RPC_CONNECTION,
    HELIUS_API,
} from '../../utils/grapeTools/constants';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../../utils/grapeTools/WalletAddress'; // global key handling

const transactionscolumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    { field: 'signature', headerName: 'Signature', width: 150,
        renderCell: (params) => {
            return (
                <ExplorerView address={params.value} type='tx' shorten={4} hideTitle={false} style='text' color='white' fontSize='14px' />
            )
        }    
    },
    { field: 'blockTime', headerName: 'Date', width: 150,
        renderCell: (params) => {
            return (
                <>
                    <Tooltip title={timeAgo(params.value)}>
                        <Button 
                            color='inherit'
                            sx={{borderRadius:'17px'}}>
                            <Typography variant="caption">{formatBlockTime(params.value, true, true)}</Typography>
                        </Button>
                    </Tooltip>
                </>
            )
        }
    },
    { field: 'info', headerName: 'Type', width: 350, flex:1,
        renderCell: (params) => {
            return (
                <>
                    {(params.value.description && params.value.description.length > 0) ?
                        <Tooltip title={params.value.type}>
                            <Button 
                                color='inherit'
                                sx={{borderRadius:'17px'}}>
                                <Typography variant="caption"><strong>{params.value.description}</strong></Typography>
                            </Button>
                        </Tooltip>
                    :
                        <Typography variant="caption">{params.value.type}</Typography>
                    }
                </>
            )
        }
    },
    { field: 'memo', headerName: 'Memo', width: 150, hide: true,
        renderCell: (params) => {
            return (
                <>
                <Typography variant="caption">{params.value}</Typography>
                </>
            )
        }
    },
    { field: 'source', headerName: 'Source', width: 150, hide: true,
        renderCell: (params) => {
            return (
                <>{params.value}</>
            )
        }
    },
    
  ];

export function TransactionsView(props: any){
    const setLoadingPosition = props.setLoadingPosition;
    const pubkey = props.pubkey;
    const [loading, setLoading] = React.useState(false);
    const [transactions, setTransactions] = React.useState(null);
    const connection = RPC_CONNECTION;

    const getTransactions = async () => {
        
        if ((!loading) && (pubkey)){
            setLoading(true);

            console.log("Fetching transaction history")
            setLoadingPosition("Fetching transaction history");

            let helius_results = null;
            
            if (HELIUS_API){
                try{
                    const tx: any[] = [];
                    const url = "https://api.helius.xyz/v0/addresses/"+pubkey+"/transactions?api-key="+HELIUS_API
                    const parseTransactions = async () => {
                        const { data } = await axios.get(url)
                        //console.log("parsed transactions: ", data)

                        helius_results = data;
                        /*
                        for (const item of data){
                            tx.push({
                                signature:item.signature,
                                blockTime:item.timestamp,
                                //amount:tx_cost,
                                //owner:owner,
                                memo:'',
                                source:null,
                                type:item.description + ' | ' + item.type,
                            });
                        }*/

                    }
                    await parseTransactions();
                //setSolanaTransactions(tx);
                }catch(terr){
                    console.log("ERR: "+terr);
                }
            }


            const response = await connection.getSignaturesForAddress(new PublicKey(pubkey));

            const memos: any[] = [];
            const signatures: any[] = [];
            let counter = 0;
            // get last 100
            for (const value of response){
                if (counter<100){
                    signatures.push(value.signature);
                    if (value.memo){
                        //let start_memo = value.memo.indexOf('[');
                        //let end_memo = value.memo.indexOf(']');

                    }
                    memos.push(value.memo);
                }
                counter++;
            }

            //console.log("signatures: "+JSON.stringify(signatures))

            console.log("fetching parsed transactions")
            const tx: any[] = [];
            try{
                const getTransactionAccountInputs2 = await connection.getParsedTransactions(signatures, {commitment:'confirmed', maxSupportedTransactionVersion:0});
                //console.log("getTransactionAccountInputs2: "+JSON.stringify(getTransactionAccountInputs2))
                let cnt=0;
                
                for (const tvalue of getTransactionAccountInputs2){
                    //if (cnt===0)
                    //    console.log(signatures[cnt]+': '+JSON.stringify(tvalue));
                    
                    let txtype = "";
                    if (tvalue?.meta?.logMessages){
                        for (const logvalue of tvalue.meta.logMessages){
                            //console.log("txvalue: "+JSON.stringify(logvalue));
                            if (logvalue.includes("Program log: Instruction: ")){
                                if (txtype.length > 0)
                                    txtype += ", ";
                                txtype += logvalue.substring(26,logvalue.length);
                                
                            }
                        }
                    }

                    let description = null;
                    if (helius_results){
                        for (const item of helius_results){
                            if ((signatures[cnt] === item.signature) && (item.type !== 'UNKNOWN')){
                                description = item.description + " ("+ item.type+ ")";
                            }
                        }
                    }

                    tx.push({
                        id:cnt,
                        signature:signatures[cnt],
                        blockTime:tvalue?.blockTime,
                        //amount:tx_cost,
                        //owner:owner,
                        memo:memos[cnt],
                        source:null,
                        description:description,
                        type:txtype,
                        info:{
                            description:description,
                            type:txtype,
                        }
                    });
                    
                    cnt++;
                }
            } catch(err){
                console.log("ERR: "+err);
            }   
            
            setTransactions(tx); 
        }
        setLoading(false);
    }

    React.useEffect(() => {
        if (pubkey){
            getTransactions();
        }
    }, [pubkey]);

    return(
        <>
        {loading ?
            <LinearProgress />
        :
            <>
                {transactions && 
                    <div style={{ height: 600, width: '100%' }}>
                        <div style={{ display: 'flex', height: '100%' }}>
                            <div style={{ flexGrow: 1 }}>
                                
                                <DataGrid
                                    rows={transactions}
                                    columns={transactionscolumns}
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