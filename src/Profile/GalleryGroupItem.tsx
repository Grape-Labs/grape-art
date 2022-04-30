
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
    Button,
    Tooltip,
} from '@mui/material';

import GalleryItem from './GalleryItem';
import { GRAPE_PREVIEW } from '../utils/grapeTools/constants';
import { ConstructionOutlined } from "@mui/icons-material";

export default function GalleryGroupItem(props: any){
    const [page, setPage] = React.useState(1);
    const rowsperpage = 1500;
    const groupCollection = props.groupCollection;
    const isparent = props?.isparent || false;
    const symbol = props?.symbol || null;
    const [childCollection, setChildCollection] =  React.useState(null);
    const [expanded, setExpanded] = React.useState(false);
    //const walletCollection = props.walletCollection;
    
    // If a gallery item is groupBySymbol > 0
    // start searching how many are grouped so we can do this as a collective :) 

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    React.useEffect(() => { 
        if (symbol){
            // check if symbol has been shown before
            let count = 0;
            let tmpcollection: any[] = [];
            for (var child of groupCollection){
                
                if (child.meta.data.symbol === symbol){ // check if previous symbol shown
                    //console.log("Checking: "+child.groupBySymbolIndex+" - "+child.meta.data.name);
                    //if (child.groupBySymbolIndex === 0){
                        tmpcollection.push(child);
                    //}
                    count++;
                }
            }
            if (count>0)
                setChildCollection(tmpcollection);
        }
    }, [groupCollection, symbol]);

    return (
        <>
        {childCollection && childCollection.length > 0 && (
            <>
                    {expanded ? (
                        <></>
                    ):(
                        
                            <Grid item xs={12} sm={12} md={4} lg={3} xl={2} key={childCollection[0].groupBySymbolIndex}>
                                <Box
                                    sx={{
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        borderRadius: '26px',
                                        minWidth: '175px'
                                    }} 
                                >
                                    <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                                        <Tooltip title='Expand Group'>
                                            <Button
                                                onClick={ () => handleExpandClick() }
                                                sx={{p:0,m:0,borderRadius:'26px', color:'white',display:'flex',justifyContent:'center',alignItems:'center'}}
                                                >
                                                <GalleryItem collectionitem={childCollection[0]} groupbysymbol={childCollection[0].groupBySymbol} isparent={true} listed={true} count={0} />
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                </Box>
                            </Grid>
                    )}

                    { (childCollection.length > 0 ? childCollection
                        .slice((page - 1) * rowsperpage, page * rowsperpage):childCollection)
                        .map((collectionInfo: any, key: any) => {
                            return(
                                <>
                                {expanded && (
                                    <Grid item xs={12} sm={12} md={4} lg={3} key={key}>
                                        <Box
                                            sx={{
                                                background: 'rgba(0, 0, 0, 0.6)',
                                                borderRadius: '26px',
                                                minWidth: '175px'
                                            }} 
                                        >
                                            <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                                                <GalleryItem collectionitem={collectionInfo} groupbysymbol={collectionInfo.groupBySymbol} isparent={false} listed={true} count={key} />
                                            </Grid>
                                        </Box>
                                    </Grid>
                                )}
                                </>  
                            )
                        }
                    )}
            </>
            
        )}
        </>);
}