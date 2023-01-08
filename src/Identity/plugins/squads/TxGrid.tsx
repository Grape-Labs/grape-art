import React, { FC, useEffect, useState } from 'react';
import { Box, Button, Collapse } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Squad, TRANSACTIONS_PER_PAGE, useSquads } from '../../../hooks/useSquads';
import { useConnection, useWallet, WalletContextState } from '@solana/wallet-adapter-react';

const transactionsCols: GridColDef[] = [
    { field: 'id', flex: 1, headerName: 'ID', hide: true },
    { field: 'title', headerName: 'Title', align: 'left', minWidth: 250 },
    { field: 'description', headerName: 'Description', align: 'left', width: 500 },
    { width: 120, field: 'type', headerName: 'Type', align: 'center' },
    { width: 120, field: 'creator', headerName: 'Type', align: 'center' },
    { width: 120, field: 'status', headerName: 'Status', align: 'center' },
    {
        width: 100,
        field: 'createdTime',
        headerName: 'Created on',
        align: 'left',
        valueFormatter: ({ value }) => {
            const date = new Date(+value);

            return date.toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            });
        },
    },
    {
        width: 100,
        field: 'executedTime',
        headerName: 'Executed on',
        align: 'center',
        valueFormatter: ({ value }) => {
            if (+value > 0) {
                const date = new Date(+value);

                return date.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                });
            }

            return 'Open';
        },
    },
    {
        width: 100,
        field: 'TXKEY',
        headerName: '',
        renderCell: ({ value, row }) => {
            return (
                <Button
                    variant="outlined"
                    size="small"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://v3.squads.so/transactions/${row.MSKEY}/tx/${value}`}
                >
                    View
                </Button>
            );
        },
    },
    { width: 100, field: 'MSKEY', headerName: '', hide: true },
];

interface Props {
    ms: Squad;
    open: boolean;
    setNotification: (boolean: boolean) => void;
    availableAction: boolean;
}

export const TxGrid: FC<Props> = ({ ms, open, setNotification, availableAction }) => {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState(null);
    const wallet = useWallet();
    const { connection } = useConnection();
    const { getTransactions } = useSquads(connection, wallet);

    // todo: on load each txgrid fetches it's own initial state
    const handlePageChange = async (pageNumber: number) => {
        setLoading(true);
        const txs = await getTransactions(ms, pageNumber);
        setTransactions(txs);
        setLoading(false);
    };

    useEffect(() => {
        (async () => {
            console.log('running');

            // on load fetch first page
            if (!transactions) {
                await handlePageChange(1);
            }
        })();
    }, []);

    useEffect(() => {
        if (transactions) {
            const activeTxs = transactions.filter((t) => t.transaction.status != '');
            if (activeTxs?.length > 0 && !availableAction) {
                setNotification(true);
            }
        }
    }, [transactions]);

    return (
        <Box height="100%">
            <Collapse in={open} timeout="auto" unmountOnExit>
                <DataGrid
                    autoHeight={true}
                    rows={(transactions && transactions.map((t) => t.transaction)) || []}
                    columns={transactionsCols}
                    rowCount={ms.transactionIndex}
                    loading={loading}
                    paginationMode="server"
                    onPageChange={handlePageChange}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'createdTime', sort: 'desc' }],
                        },
                    }}
                    sx={{
                        borderColor: 'none',
                        border: 'none',
                        overflow: 'scroll',
                        width: '100%',
                        boxShadow: open && 'inset 0 0 6px rgb(0 0 0 / 25%)',
                    }}
                    pageSize={TRANSACTIONS_PER_PAGE}
                    rowsPerPageOptions={[]}
                />
            </Collapse>
        </Box>
    );
};