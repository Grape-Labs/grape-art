
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils'
// @ts-ignore
import fetch from 'node-fetch'
import { PublicKey } from '@solana/web3.js';

import { styled, alpha } from '@mui/material/styles';

import {
    Pagination,
    Stack,
    Tooltip,
    Typography,
    Grid,
    Box,
    Skeleton,
    ListItemButton,
    ImageListItemBar,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';

import {
    METAPLEX_PROGRAM_ID,
} from '../utils/auctionHouse/helpers/constants';

import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import { GRAPE_PREVIEW } from '../utils/grapeTools/constants';
import { getImageOrFallback } from '../utils/grapeTools/WalletAddress';

import { PreviewView } from "../Preview/Preview";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
}));

export default function GalleryItem(props: any){
    const MD_PUBKEY = METAPLEX_PROGRAM_ID;
    const collectionitem = props.collectionitem || [];
    const mode = props?.mode || 0;
    const mint = collectionitem?.wallet?.account?.data.parsed.info.mint || collectionitem?.wallet?.address || collectionitem?.meta?.mint || null;
    const [expanded, setExpanded] = React.useState(false);
    const [open, setOpenDialog] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [collectionmeta, setCollectionMeta] = React.useState(null);
    const isparent = props?.isparent || false;
        //const [collectionrawdata, setCollectionRaw] = React.useState(props.collectionitemmeta || null);
        
        const handleClickOpenDialog = () => {
            setOpenDialog(true);
        };
        
        const handleCloseDialog = () => {
            setOpenDialog(false);
        };

        const handleExpandClick = () => {
            setExpanded(!expanded);
        };
        
        const getCollectionData = async () => {
            if (collectionitem){
                try {
                    //let meta_primer = collectionitem;
                    //let buf = Buffer.from(meta_primer.data, 'base64');
                    //let meta_final = decodeMetadata(buf);
                    let meta_final = collectionitem.meta;
                    try{
                        const metadata = await window.fetch(meta_final.data.uri)
                        .then(
                            (res: any) => res.json()
                        );
                        return metadata;
                    }catch(ie){
                        // not on Arweave:
                        //console.log("ERR: "+JSON.stringify(meta_final));
                        return null;
                    }
                } catch (e) { // Handle errors from invalid calls
                    console.log(e);
                    return null;
                }
            }
        }

        const setImageUrl = async (image_url:string, image:string) => {
            await getImageOrFallback(image_url, image).then(validUrl => {
                return validUrl
            });
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
            if (mode === 0){
                const interval = setTimeout(() => {

                    if (mint)
                        getCollectionMeta();
                }, 500);
                return () => clearInterval(interval); 
            }
        }, [collectionitem]);
        
        if (mode === 0){
            if ((!collectionmeta)||
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
            }
        }
        {   
            let image = collectionmeta?.collectionmeta?.image || collectionitem?.image || null;
            try{
                if (image){
                    if ((image?.toLocaleUpperCase().indexOf('?EXT=PNG') > -1) ||
                        (image?.toLocaleUpperCase().indexOf('?EXT=JPEG') > -1) ||
                        (image?.toLocaleUpperCase().indexOf('.JPEG') > -1) ||
                        (image?.toLocaleUpperCase().indexOf('.PNG') > -1)){
                            let image_url = 'https://solana-cdn.com/cdn-cgi/image/width=256/'+image;
                            image = image_url;
                            //image = setImageUrl(image_url, image);
                    }
                }
            }catch(e){console.log("ERR: "+e)}
            
            if (!image){
                //console.log("!image ERR: " + JSON.stringify(collectionmeta));
                return null;
            } else {
            //console.log("Mint: "+mint);
            //if ((collectionmeta)&&(!loading)){
            //if (image){
                return (
                        <>
                            
                            {mode === 0 ?
                                <>
                                {collectionmeta &&
                                    <Grid 
                                        container 
                                        alignItems="center"
                                        justifyContent="center">
                                        {!isparent ? (
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
                                                        loading="lazy"
                                                        height="auto"
                                                        style={{
                                                            width:'100%',
                                                            borderRadius:'24px'
                                                        }}
                                                    />
                                                </ListItemButton>
                                            </Grid>
                                        ):(
                                            <>
                                                <ListItemButton
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
                                                    loading="lazy"
                                                    height="auto"
                                                    style={{
                                                        width:'100%',
                                                        borderRadius:'24px'
                                                    }}
                                                />
                                                {collectionitem.groupBySymbol > 1 && (
                                                    <ImageListItemBar
                                                        sx={{
                                                            p:0,
                                                            m:0,
                                                            borderBottomRightRadius:'26px',
                                                            borderBottomLeftRadius:'26px',
                                                        }}
                                                        actionIcon={
                                                        <IconButton
                                                            sx={{ 
                                                                color: 'rgba(255, 255, 255, 0.25)',
                                                                borderTopLeftRadius:'0px',
                                                                borderTopRightRadius:'0px',
                                                                borderBottomLeftRadius:'0px',
                                                                borderBottomRightRadius:'26px',
                                                            }}
                                                        >
                                                            {collectionitem.groupBySymbol}
                                                        </IconButton>
                                                        }
                                                    />
                                                )}
                                                </ListItemButton>
                                            </>

                                        )}
                                        <Grid item sx={{display:'flex'}}>
                                            <Box
                                                sx={{p:1}}
                                            >
                                                <Typography variant="caption">
                                                    {!isparent ? (
                                                        <>
                                                        {collectionmeta.collectionmeta?.name}
                                                        </>
                                                    ):(
                                                        <>
                                                        {collectionmeta.collectionmeta?.name.substring(0,collectionmeta.collectionmeta?.name.indexOf('#')).trim()}
                                                        </>
                                                    )}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                }
                                </>
                            :
                            <>
                                <Grid 
                                    container 
                                    alignItems="center"
                                    justifyContent="center">
                                        <Grid item sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                                            <ListItemButton
                                                //component={Link} to={`${GRAPE_PREVIEW}${collectionitem?.address}`}
                                                onClick={handleClickOpenDialog}
                                                sx={{
                                                    width:'100%',
                                                    borderRadius:'25px',
                                                    p: '2px'
                                                }}
                                            >
                                                <img
                                                    src={`${image}`}
                                                    srcSet={`${image}`}
                                                    alt={collectionitem?.name}
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
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12}>
                                                    <Typography variant="subtitle1" textAlign="center">
                                                        {collectionitem?.name}
                                                    </Typography> 
                                                </Grid>
                                                
                                                <Grid item xs={6}>
                                                    
                                                    {collectionitem?.price ?
                                                        
                                                        <Tooltip title={collectionitem?.listedTimestamp}> 
                                                            <Button sx={{color:'white',borderRadius:'17px'}}>  
                                                            <Typography variant="h6">
                                                            {collectionitem?.price}  <SolCurrencyIcon sx={{fontSize:"16px"}} />
                                                            </Typography>
                                                            </Button>
                                                        </Tooltip>
                                                    :
                                                        <Typography variant="caption" sx={{color:'#666'}}>
                                                            Not listed
                                                        </Typography>
                                                    }
                                                    
                                                </Grid>
                                                <Grid item xs={6}>
                                                    {collectionitem?.highestOffer > 0 &&
                                                        <>
                                                            <Typography variant="body2" textAlign="right">
                                                                Offer for
                                                            </Typography>
                                                            <Typography variant="body1" textAlign="right" sx={{color:'yellow'}}>
                                                                {collectionitem?.highestOffer} <SolCurrencyIcon sx={{fontSize:"11px"}} />
                                                            </Typography>
                                                        </>
                                                    }
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Grid>
                                </Grid>
                                <BootstrapDialog 
                                    fullWidth={true}
                                    maxWidth={"lg"}
                                    open={open} onClose={handleCloseDialog}
                                    PaperProps={{
                                        style: {
                                            background: '#13151C',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '20px'
                                        }
                                    }}
                                >
                                    <DialogContent>
                                        <PreviewView handlekey={collectionitem?.address} />
                                    </DialogContent>
                                </BootstrapDialog>
                            </>
                            }
                        </>
                );
            }
            //}
        }
}