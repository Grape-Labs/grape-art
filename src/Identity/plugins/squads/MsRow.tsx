import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Box, Collapse, IconButton, TableCell, TableRow } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Wallet } from '@project-serum/common';
import { right } from 'fp-ts/lib/EitherT';
import React, { useState } from 'react';
import { TxGrid } from './TxGrid';

interface Props {
    row: any;
    wallet: Wallet;
}

export const MsRow: React.FC<Props> = ({ row, wallet }) => {
    const [open, setOpen] = useState(false);
    const [availableAction, setAvailableAction] = useState(false);

    const setNotification = (bool: boolean) => {
        setAvailableAction(bool);
    };
    const openStyle = '#00000003';

    return (
        <>
            <TableRow
                sx={{
                    transition: 'all',
                    boxShadow: open && '0 2.5px 15px rgb(0 0 0 / 15%)',
                }}
            >
                <TableCell>
                    <div style={{}}>{row.name}</div>
                    <div style={{ color: 'rgb(192,192,192)' }}>{row.descText}</div>
                </TableCell>
                <TableCell align="left">
                    <div>
                        {row.keys.length} {row.keys.length === 1 ? 'key' : 'keys'}
                    </div>
                    <div style={{ color: 'rgb(192,192,192)' }}>
                        {row.creator === wallet.publicKey.toBase58() ? 'Creator' : ''}
                    </div>
                </TableCell>
                <TableCell align="center">
                    {availableAction && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            height={16}
                            width={16}
                            fill="rgb(192,192,192"
                            aria-hidden="true"
                        >
                            <path d="M4.214 3.227a.75.75 0 00-1.156-.956 8.97 8.97 0 00-1.856 3.826.75.75 0 001.466.316 7.47 7.47 0 011.546-3.186zM16.942 2.271a.75.75 0 00-1.157.956 7.47 7.47 0 011.547 3.186.75.75 0 001.466-.316 8.971 8.971 0 00-1.856-3.826z" />
                            <path
                                fillRule="evenodd"
                                d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.94 32.94 0 003.256.508 3.5 3.5 0 006.972 0 32.933 32.933 0 003.256-.508.75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6zm0 14.5a2 2 0 01-1.95-1.557 33.54 33.54 0 003.9 0A2 2 0 0110 16.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </TableCell>
                <TableCell align="center">
                    <IconButton onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow
                sx={{
                    bgcolor: open && openStyle,
                    transition: 'all',
                }}
            >
                <TableCell colSpan={4} style={{ padding: 0 }} sx={{ bgcolor: open && openStyle }}>
                    <TxGrid ms={row} open={open} setNotification={setNotification} availableAction={availableAction} />
                </TableCell>
            </TableRow>
        </>
    );
};