
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

import { GRAPE_PREVIEW } from '../utils/grapeTools/constants';

const GalleryItem = (props: any) => {
    const collectionitem = props.collectionitem || [];
    const mint = collectionitem?.wallet?.account.data.parsed.info.mint || null;
    const [expanded, setExpanded] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [collectionmeta, setCollectionMeta] = React.useState(null);
        //const [collectionrawdata, setCollectionRaw] = React.useState(props.collectionitemmeta || null);
        
        const handleExpandClick = () => {
            setExpanded(!expanded);
        };

        const MD_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
        const getCollectionData = async () => {
            try {
                let meta_primer = collectionitem;
                let buf = Buffer.from(meta_primer.data, 'base64');
                let meta_final = decodeMetadata(buf);
                
                const metadata = await fetch(meta_final.data.uri).then(
                    (res: any) => res.json());
                
                return metadata;
            } catch (e) { // Handle errors from invalid calls
                console.log(e);
                return null;
            }
        }

        const getCollectionMeta = async () => {
            if (!loading){
                setLoading(true);
                let [collectionmeta] = await Promise.all([getCollectionData()]);
                setCollectionMeta({
                    collectionmeta
                });
                setLoading(false);
            }
        }

        useEffect(() => {
            const interval = setTimeout(() => {

                if (mint)
                    getCollectionMeta();
            }, 500);
            return () => clearInterval(interval); 
        }, [collectionitem]);
        
        if((!collectionmeta)||
            (loading)){
            //getCollectionMeta();
            //setTimeout(getCollectionMeta(), 250);
            return (
                <ListItemButton
                    sx={{
                        width:'100%',
                        borderRadius:'25px',
                        p: '2px',
                        mb: 5
                    }}
                >
                    <Skeleton 
                        sx={{
                            borderRadius:'25px',
                        }}
                        variant="rectangular" width={325} height={325} />
                </ListItemButton>
            )
        } //else{
        {   
            let image = collectionmeta.collectionmeta?.image || null;
            
            try{
                if ((image.toLocaleUpperCase().indexOf('?EXT=PNG') > -1) ||
                    (image.toLocaleUpperCase().indexOf('?EXT=JPEG') > -1)){
                        image = image.slice(0, image.indexOf('?'));
                        image = 'https://solana-cdn.com/cdn-cgi/image/width=256/'+image;
                }
            }catch(e){console.log("ERR: "+e)}
            
            if (!image){
                console.log("ERR: " + JSON.stringify(collectionmeta));
                return null;
            }else{
            //console.log("Mint: "+mint);
            //if ((collectionmeta)&&(!loading)){
            //if (image){
                return (
                    
                        <Grid 
                            container 
                            alignItems="center"
                            justifyContent="center">
                            <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                                <ListItemButton
                                    component={Link} to={`${GRAPE_PREVIEW}${mint}`}
                                    sx={{
                                        width:'100%',
                                        borderRadius:'25px',
                                        p: '2px'
                                    }}
                                >
                                    <img
                                        src={`${image}`}
                                        srcSet={`${image}`}
                                        alt={collectionmeta.collectionmeta?.name}
                                        //onClick={ () => openImageViewer(0) }
                                        loading="lazy"
                                        height="auto"
                                        style={{
                                            width:'100%',
                                            borderRadius:'24px'
                                        }}
                                    />
                                </ListItemButton>
                            </Grid>
                            <Grid item sx={{display:'flex'}}>
                                <Box
                                    sx={{p:1}}
                                >
                                    <Typography variant="caption">
                                        {collectionmeta.collectionmeta?.name}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                );
            }
            //}
        }
}

export default function GalleryView(props: any){
    const [page, setPage] = React.useState(1);
    const rowsperpage = 1500;
    const finalCollection = props.finalCollection;
    const walletCollection = props.walletCollection;

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
                                <Grid item xs={12} sm={12} md={4} lg={3} key={key}>
                                    <Box
                                        sx={{
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            borderRadius: '26px',
                                            minWidth: '175px'
                                        }} 
                                    >
                                    <GalleryItem collectionitem={collectionInfo} listed={true} count={key} />
                                    
                                    </Box>
                                </Grid>
                                    
                            )
                        }
                    )}
                </Grid>
                
                { walletCollection.length > rowsperpage && 
                    <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Stack spacing={2}>
                            <Pagination
                                count={(Math.ceil(walletCollection.length / rowsperpage))}
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