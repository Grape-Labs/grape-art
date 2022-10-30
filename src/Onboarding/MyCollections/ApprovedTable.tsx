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
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { PublicKey } from '@solana/web3.js';

const StyledTable = styled(Table)(() => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
}));

export function ApprovedTable({
    info,
    isAdmin,
    enable,
    deny,
}: {
    info: CollectionBoardingInfo[] | undefined;
    isAdmin: boolean;
    enable: (seed: PublicKey, enable: boolean) => Promise<string>;
    deny: (seed: PublicKey) => Promise<string>;
}) {
    return (
        <div>
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
                                <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                    <Typography variant="caption" sx={{ marginRight: '30px' }}>
                                        Enable
                                    </Typography>
                                </TableCell>
                                {isAdmin && (
                                    <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                        <Typography variant="caption" sx={{ marginRight: '30px' }}>
                                            Deny
                                        </Typography>
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {info &&
                                info.map((listing) => (
                                    <TableRow sx={{ backgroundColor: 'inherit' }}>
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
                                                        enable(
                                                            listing.verified_collection_address ||
                                                                listing.collection_update_authority,
                                                            !listing.enabled
                                                        )
                                                    }
                                                >
                                                    {listing.enabled ? 'Disable' : 'Enable'}
                                                </Button>
                                            </TableCell>
                                        )}
                                        {!isAdmin && (
                                            <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                                <Typography variant="caption" sx={{ marginRight: '30px' }}>
                                                    {listing.enabled ? 'Enabled' : 'Disabled'}
                                                </Typography>
                                            </TableCell>
                                        )}
                                        {isAdmin && (
                                            <TableCell sx={{ minWidth: '100px', backgroundColor: 'inherit' }}>
                                                <Button
                                                    onClick={() =>
                                                        deny(
                                                            listing.verified_collection_address ||
                                                                listing.collection_update_authority
                                                        )
                                                    }
                                                >
                                                    Deny
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
