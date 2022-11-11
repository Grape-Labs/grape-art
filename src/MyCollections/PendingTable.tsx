import * as React from 'react';
import { CollectionBoardingInfo } from 'grape-art-listing-request';
import {
    Paper,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    Typography,
    Table,
    TableBody,
    Button,
    Box,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { PublicKey } from '@solana/web3.js';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
}));

export function PendingTable({
    info,
    isAdmin,
    approve,
    wallet,
    refund,
}: {
    info: CollectionBoardingInfo[] | undefined;
    isAdmin: boolean;
    approve: (seed: PublicKey) => Promise<string>;
    wallet: PublicKey;
    refund: (seed: PublicKey) => Promise<string>;
}) {
    const boardingcols = [
        { field: 'collectionName', headerName: 'Collection Name', width: 70, flex: 1 },
        { field: 'listingRequestor', headerName: 'Listing Requestor', width: 50 },
        { field: 'updateAuthority', headerName: 'Update Authority', width: 50 },
    ];

    const [boardingRows, setBoardingRows] = React.useState(null);

    React.useEffect(() => {
        const theseRows = new Array();
        for (var listing of info) {
            theseRows.push({
                collectionName: listing.name,
                listingRequestor: listing.listing_requester.toBase58(),
                updateAuthority: listing.collection_update_authority.toBase58(),
            });
        }
        setBoardingRows(theseRows);
    }, [info]);

    return (
        <div>
            {/*boardingRows && boardingRows.length > 0 &&
                <Box sx={{mt:2,p:1}}>
                    <div style={{ height: 600, width: '100%' }}>
                        <div style={{ display: 'flex', height: '100%' }}>
                            <div style={{ flexGrow: 1 }}>
                                
                                {JSON.stringify(boardingRows)}
                                {
                                <DataGrid
                                    rows={boardingRows}
                                    columns={boardingcols}
                                    rowsPerPageOptions={[25, 50, 100, 250]}
                                    sx={{
                                        borderRadius:'17px',
                                        borderColor:'rgba(255,255,255,0.25)',
                                        '& .MuiDataGrid-cell':{
                                            borderColor:'rgba(255,255,255,0.25)'
                                        }}}
                                    sortingOrder={['asc', 'desc', null]}
                                    //checkboxSelection
                                    disableSelectionOnClick
                                />
                                }
                                
                            </div>
                        </div>
                    </div>
                    
                </Box>
            */}

            <Table>
                <TableContainer component={Paper} sx={{ background: 'none' }}>
                    <StyledTable sx={{ minWidth: 500 }} size="small" aria-label="Approved Collections Table">
                        <TableHead sx={{ backgroundColor: 'inherit' }}>
                            <TableRow sx={{ backgroundColor: 'inherit' }}>
                                <TableCell sx={{ minWidth: '180px', backgroundColor: 'inherit' }}>
                                    <Typography variant="caption">Collection Name</Typography>
                                </TableCell>
                                <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                    <Typography variant="caption">Listing Requestor</Typography>
                                </TableCell>
                                <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                    <Typography variant="caption" sx={{ marginRight: '30px' }}>
                                        Update Authority
                                    </Typography>
                                </TableCell>
                                {isAdmin && (
                                    <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                        <Typography variant="caption" sx={{ marginRight: '30px' }}>
                                            Approve
                                        </Typography>
                                    </TableCell>
                                )}
                                {info.find((listing) => listing.listing_requester.equals(wallet)) && (
                                    <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                        <Typography variant="caption" sx={{ marginRight: '30px' }}>
                                            Refund
                                        </Typography>
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {info &&
                                info.map((listing: any, key: number) => (
                                    <TableRow sx={{ backgroundColor: 'inherit' }} key={key}>
                                        <TableCell sx={{ minWidth: '180px', backgroundColor: 'inherit' }}>
                                            <Typography variant="caption">{listing.name}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                            <Typography variant="caption">
                                                {listing.listing_requester.toBase58()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                            <Typography variant="caption" sx={{ marginRight: '30px' }}>
                                                {listing.collection_update_authority.toBase58()}
                                            </Typography>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                                <Button
                                                    onClick={() =>
                                                        approve(
                                                            listing.verified_collection_address ||
                                                                listing.collection_update_authority
                                                        )
                                                    }
                                                >
                                                    Approve
                                                </Button>
                                            </TableCell>
                                        )}
                                        {listing.listing_requester.equals(wallet) && (
                                            <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                                <Button
                                                    onClick={() =>
                                                        refund(
                                                            listing.verified_collection_address ||
                                                                listing.collection_update_authority
                                                        )
                                                    }
                                                >
                                                    Request Refund
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                        </TableBody>
                    </StyledTable>
                </TableContainer>
            </Table>
        </div>
    );
}
