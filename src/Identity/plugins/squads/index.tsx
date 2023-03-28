import React, { useEffect } from 'react';
// import squadTemp from '/squadTemp.json';
import { Squad, useSquads } from '../../../hooks/useSquads';
// @ts-ignore
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { useSnackbar } from 'notistack';

import { styled } from '@mui/material/styles';
import { TablePaginationActionsProps } from '@mui/material/TablePagination/TablePaginationActions';

import {
    Box,
    Collapse,
    Dialog,
    DialogTitle,
    IconButton,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TablePagination,
    TableHead,
    TableRow,
    Typography,
    Button,
} from '@mui/material';

import { RPC_CONNECTION } from '../../../utils/grapeTools/constants';
import { MsRow } from './MsRow';

export interface DialogTitleProps {
    id: string;
    children?: React.ReactNode;
    onClose: () => void;
}

export function SquadsView(props: any) {
    const setLoadingPosition = props.setLoadingPosition;
    const [squadsRows, setSquadsRows] = React.useState(null);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const wallet = useWallet();
    const pubkey = props?.pubkey;
    const { publicKey } = useWallet();
    const connection = RPC_CONNECTION;
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const { squads, loading } = useSquads(connection, wallet, pubkey);

    const rows = squads.length;
    const emptyRows = rowsPerPage - rows > 0 ? rowsPerPage - rows : 0;

    const renderEmptyRows = (rows: number) => {
        const emptyRowArray = [];
        for (let i = 0; i < rows; i++) {
            emptyRowArray.push(
                <TableRow sx={{ height: '73.3px' }}>
                    <TableCell colSpan={6}></TableCell>
                </TableRow>
            );
        }
        return emptyRowArray;
    };

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    function TablePaginationActions(props: TablePaginationActionsProps) {
        const { count, page, rowsPerPage, onPageChange } = props;

        const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            onPageChange(event, 0);
        };

        const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            onPageChange(event, page - 1);
        };

        const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            onPageChange(event, page + 1);
        };

        const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
        };

        return <Box sx={{ flexShrink: 0, ml: 2.5, flexGrow: 1 }}></Box>;
    }

    useEffect(() => {
        if (squads) {
            setLoadingPosition('squads');
            setSquadsRows(squads);
        }
    }, [squads]);

    return (
        <>
            {loading ? (
                <LinearProgress />
            ) : (
                <>
                    {!loading && squadsRows && (
                        <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', height: '100%' }}>
                                <div
                                    style={{
                                        flexGrow: 1,
                                        overflow: 'scroll',
                                        borderRadius: '20px',
                                        border: 'solid 0.5px  rgba(81, 81, 81, 1)',
                                    }}
                                >
                                    <TableContainer>
                                        <Table aria-label="squads table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Squad</TableCell> {/* Should be name of squad */}
                                                    <TableCell align="left">Members</TableCell> {/* Number of keys */}
                                                    <TableCell align="center">
                                                        <Box alignItems="center" display="flex" justifyContent="center">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 24 24"
                                                                height={16}
                                                                width={16}
                                                                stroke="rgb(192,192,192"
                                                                fill="none"
                                                                aria-hidden="true"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                                                                />
                                                            </svg>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box alignItems="center" display="flex" justifyContent="center">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 24 24"
                                                                height={16}
                                                                width={16}
                                                                fill="rgb(192,192,192"
                                                                aria-hidden="true"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody sx={{ height: '100%' }}>
                                                {publicKey &&
                                                    squads.map((sqd) => (
                                                        <MsRow
                                                            row={sqd}
                                                            wallet={wallet}
                                                            key={String(sqd.publicKey.toBase58())}
                                                        />
                                                    ))}
                                                {emptyRows > 0 && renderEmptyRows(emptyRows)}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow>
                                                    <TablePagination
                                                        rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                                                        colSpan={4}
                                                        count={rows}
                                                        rowsPerPage={rowsPerPage}
                                                        page={page}
                                                        SelectProps={{
                                                            inputProps: {
                                                                'aria-label': 'rows per page',
                                                            },
                                                            native: true,
                                                        }}
                                                        onPageChange={handleChangePage}
                                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                                        ActionsComponent={TablePaginationActions}
                                                    />
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </TableContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}