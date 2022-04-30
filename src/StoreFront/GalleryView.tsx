
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils'
// @ts-ignore
import fetch from 'node-fetch'
import { PublicKey } from '@solana/web3.js';

import {
    Pagination,
    Stack,
    Typography,
    Grid,
    Box,
    Skeleton,
    ListItemButton,
} from '@mui/material';

import GalleryItem from './GalleryItem';
import { GRAPE_PREVIEW } from '../utils/grapeTools/constants';
import { ConstructionOutlined } from "@mui/icons-material";

export default function GalleryView(props: any){
    const [page, setPage] = React.useState(1);
    const rowsperpage = 1500;
    const finalCollection = props.finalCollection;
    const isparent = props?.isparent || false;
    const groupbysymbol = props?.groupbysymbol || null;
    //const walletCollection = props.walletCollection;

    // If a gallery item is groupBySymbol > 0
    // start searching how many are grouped so we can do this as a collective :) 

    return (
        <>
        {finalCollection && finalCollection.length > 0 && (
            <Box
                sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '17px',
                    p:4
                }} 
            > 
                <Grid container 
                    spacing={{ xs: 2, md: 3 }} 
                    justifyContent="center"
                    alignItems="center">
                    
                    { (finalCollection.length > 0 ? finalCollection
                        .slice((page - 1) * rowsperpage, page * rowsperpage):finalCollection)
                        .map((collectionInfo: any, key: any) => {
                            return(
                                <>
                                    <Grid item xs={12} sm={12} md={4} lg={3} key={key}>
                                        <Box
                                            sx={{
                                                background: 'rgba(0, 0, 0, 0.6)',
                                                borderRadius: '26px',
                                                minWidth: '175px'
                                            }} 
                                        >
                                            <GalleryItem collectionitem={collectionInfo} groupbysymbol={collectionInfo.groupBySymbol} isparent={false} finalCollection={finalCollection} listed={true} count={key} />
                                        </Box>
                                    </Grid>
                                </>   
                            )
                        }
                    )}
                </Grid>
                
                { finalCollection.length > rowsperpage && 
                    <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Stack spacing={2}>
                            <Pagination
                                count={(Math.ceil(finalCollection.length / rowsperpage))}
                                page={page}
                                //onChange={handlePageChange}
                                defaultPage={1}
                                color="primary"
                                size="small"
                                showFirstButton
                                showLastButton
                                //classes={{ ul: classes.paginator }}
                                />
                        </Stack>
                    </Grid>
                }
            </Box>
            
        )}
        </>);
}