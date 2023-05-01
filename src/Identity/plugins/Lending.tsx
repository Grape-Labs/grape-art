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
    HELLO_MOON_BEARER
} from '../../utils/grapeTools/constants';


import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { MakeLinkableAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../../utils/grapeTools/WalletAddress'; // global key handling

const historycolumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    { field: 'market', headerName: 'Market', width: 70 },
    { field: 'type', headerName: 'Type', width: 130 },
    { field: 'lender', headerName: 'Lender', minWidth: 130, flex: 1, align: 'left',
        renderCell: (params) => {
            return (
                <ExplorerView showSolanaProfile={true} grapeArtProfile={true} address={params.value} type='address' shorten={4} hideTitle={false} style='text' color='white' fontSize='14px' />
            )
        }
    },
    { field: 'borrower', headerName: 'Borrower', width: 150, align: 'left',
        renderCell: (params) => {
            return (
                <ExplorerView showSolanaProfile={true} grapeArtProfile={true} address={params.value} type='address' shorten={4} hideTitle={false} style='text' color='white' fontSize='14px' />
            )
        }
    },
    { field: 'collateralMint', headerName: 'Mint', width: 175, align: 'left',
        renderCell: (params) => {
            return (
                <ExplorerView showNftData={true} address={params.value} type='address' shorten={4} hideTitle={false} style='text' color='white' fontSize='14px' />
            )
        }
    },
    { field: 'status', headerName: 'Status', width: 130, align: 'center'},
    { field: 'principalAmount', headerName: 'Principal', width: 130, align: 'center',
        renderCell: (params) => {
            return (
                <>{params.value ? (params.value/(10 ** 9)).toFixed(3) : '-'}</>
            )
        }
    },
    { field: 'amountToRepay', headerName: 'Repay Amount', width: 130, align: 'center',
        renderCell: (params) => {
            return (
                <>{params.value ? (params.value/(10 ** 9)).toFixed(3) : '-'}</>
            )
        }
    },
    { field: 'duration', headerName: 'Duration', width: 150,  align: 'center',
        renderCell: (params) => {
            return (
                <>{params.value} days</>
            )
        }
    },
    { field: 'acceptBlocktime', headerName: 'Accepted', width: 150,  align: 'center',
        renderCell: (params) => {
            return (
                <>
                    {(params.value && params.value > 0) ?
                        <Typography variant="caption">
                            <Tooltip
                                title={timeAgo(params?.value)}
                            >
                                <Button size="small">{formatBlockTime(params.value, true, true)}</Button>
                            </Tooltip>
                        </Typography>
                    :<></>}
                </>
            )
        }
    },
    { field: 'repayBlocktime', headerName: 'Repaid', width: 150,  align: 'center',
        renderCell: (params) => {
            return (
                <>
                    {(params.value && params.value > 0) ?
                        <Typography variant="caption">
                            <Tooltip
                                title={timeAgo(params?.value)}
                            >
                                <Button size="small">{formatBlockTime(params.value, true, true)}</Button>
                            </Tooltip>
                        </Typography>
                    :<></>}
                </>
            )
        }
    },
  ];

export function LendingView(props: any){
    const setLoadingPosition = props.setLoadingPosition;
    const pubkey = props.pubkey;
    const [loading, setLoading] = React.useState(false);
    const [history, setHistory] = React.useState(null);
    const [loanSummary, setLoanSummary] = React.useState(null);
    
    const getHistory = async () => {
        
        if ((!loading) && (pubkey)){
            setLoading(true);

            console.log("Fetching loan data")

            setLoadingPosition("Fetching wallet borrowing/lending history");

            const url = 'https://rest-api.hellomoon.io/v0/nft/loans';
            const config = {
                headers:{
                  accept: `application/json`,
                  authorization: `Bearer ${HELLO_MOON_BEARER}`,
                  'content-type': `application/json`
                }
            };
            const data = {
                borrower: pubkey,
                limit: 1000
            }
            const results = await axios.post(url, data, config); 

            const data2 = {
                lender: pubkey,
                limit: 1000
            }
            const results2 = await axios.post(url, data2, config); 

            /*
            const results = await client.send(new NftLoanSummaryRequest({
                collateralMint: mint,
                limit: 1000
            }))
                .then(console.log)
                .catch(console.error);
            */
            
            const activityResults = results?.data?.data;
            const activityResults2 = results2?.data?.data;
            
            const finalResults = [...activityResults,...activityResults2]

            // sort by date
            finalResults.sort((a:any,b:any) => (a.offerBlocktime < b.offerBlocktime) ? 1 : -1);
            
            const lending: any[] = [];
            let cnt = 0;
            const summary = {
                repaid: 0,
                defaults: 0,
                lender: 0,
                lended: 0,
                borrower: 0,
                borrowed: 0,
                totalBorrower: 0,
                totalLender: 0,
                extended: 0,
                totalAmountDefaulted: 0,
                totalAmountRepaid: 0,
            };
            for (const item of finalResults){
                let type = ``;
                if (pubkey === item.lender) {
                    type = `Lender`
                    summary.totalLender++;
                }else {
                    type = `Borrower`
                    summary.totalBorrower++;
                }

                lending.push({
                    id:cnt,
                    market:item.market,
                    type:type,
                    lender:item.lender,
                    borrower:item.borrower,
                    status:item.status,
                    collateralMint:item.collateralMint,
                    principalAmount:item.principalAmount,
                    amountToRepay:item.amountToRepay,
                    duration:(item.loanDurationSeconds/60/60/24).toFixed(0),
                    acceptBlocktime:item.acceptBlocktime,
                    repayBlocktime:item.repayBlocktime,
                });

                if (item.status === 'repaid'){
                    summary.repaid++;
                    summary.totalAmountRepaid+=item.principalAmount;
                } else if (item.status === 'defaulted' || item.status === 'default' || item.status === 'liquidated'){
                    summary.defaults++;
                    summary.totalAmountDefaulted+=item.principalAmount;
                } else if (item.status === 'active' || item.status === 'extended'){
                    if (item.status === 'extended')
                        summary.extended++;

                    if (pubkey === item.lender){
                        summary.lender++;
                        summary.lended = item.principalAmount;
                    }else{
                        summary.borrower++;
                        summary.borrowed = item.principalAmount;
                    }
                }

                cnt++;
            }

            setLoanSummary(summary);
            setHistory(lending);
        }
        setLoading(false);
    }

    React.useEffect(() => {
        if (pubkey){
            getHistory();
        }
    }, [pubkey]);

    return(
        <>
        {loading ?
            <LinearProgress />
        :
            <>
                {loanSummary &&
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
                                    <>Active Loans</>
                                </Typography>
                                
                                <Typography textAlign='center'>
                                    <Tooltip title={<>Lender / Borrower ({loanSummary.extended} extended)</>}>
                                        <Button
                                            color='inherit'
                                            sx={{borderRadius:'17px'}}
                                        >
                                            <Typography variant="h4" textAlign='center'>
                                                <Badge badgeContent={<ArrowUpwardIcon sx={{ fontSize: 10 }} />} color="success">{loanSummary.lender}</Badge>
                                                /
                                                <Badge badgeContent={<ArrowDownwardIcon sx={{ fontSize: 10 }} />} color="error">{loanSummary.borrower}</Badge>
                                            </Typography>
                                        </Button>
                                    </Tooltip>
                                </Typography>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={6} lg={6} key={1}>
                            <Box
                                sx={{
                                    borderRadius:'24px',
                                    m:2,
                                    p:1,
                                    background: 'rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                <Typography variant="body2" sx={{color:'yellow'}}>
                                    <>Total Active Loan Amount</>
                                </Typography>
                                
                                <Typography textAlign='center'>
                                    <Tooltip title='Lender / Borrower'>
                                        <Button
                                            color='inherit'
                                            sx={{borderRadius:'17px'}}
                                        >
                                            <Typography variant="h4" textAlign='center'>
                                                <Badge badgeContent={<ArrowUpwardIcon sx={{ fontSize: 10 }} />} color="success"> {(loanSummary.lended/(10 ** 9)).toFixed(3)}</Badge>
                                                /
                                                <Badge badgeContent={<ArrowDownwardIcon sx={{ fontSize: 10 }} />} color="error">{(loanSummary.borrowed/(10 ** 9)).toFixed(3)}</Badge>
                                            </Typography>
                                        </Button>
                                    </Tooltip>
                                </Typography>
                            </Box>
                        </Grid>

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
                                    <>Repaid</>
                                </Typography>
                                
                                <Typography textAlign='center'>
                                    <Tooltip title={
                                        <>Total Loans Repaid
                                        <br/>
                                         Total Amount Repaid: <strong>{((loanSummary.totalAmountRepaid/(10 ** 9))).toFixed(3)} sol</strong>
                                    </>}>
                                        <Button
                                            color='inherit'
                                            sx={{borderRadius:'17px'}}
                                        >
                                            <Typography variant="h4" textAlign='center'>
                                                {loanSummary.repaid}
                                           </Typography>
                                        </Button>
                                    </Tooltip>
                                </Typography>
                            </Box>
                        </Grid>

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
                                    <>Defaults</>
                                </Typography>
                                
                                <Typography textAlign='center'>
                                    <Tooltip title={
                                        <>Total Loans Defaulted<br/>
                                            Default Rate: <strong>{((loanSummary.defaults/loanSummary.totalBorrower)*100).toFixed(1)}%</strong><br/>
                                            Total Amount Defaulted: <strong>{((loanSummary.totalAmountDefaulted/(10 ** 9))).toFixed(3)} sol</strong>
                                        </>}>
                                        <Button
                                            color='inherit'
                                            sx={{borderRadius:'17px'}}
                                        >
                                            <Typography variant="h4" textAlign='center'>
                                                {loanSummary.defaults}
                                           </Typography>
                                        </Button>
                                    </Tooltip>
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                }


                {history && 
                    <div style={{ height: 600, width: '100%' }}>
                        <div style={{ display: 'flex', height: '100%' }}>
                            <div style={{ flexGrow: 1 }}>
                                
                                <DataGrid
                                    rows={history}
                                    columns={historycolumns}
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