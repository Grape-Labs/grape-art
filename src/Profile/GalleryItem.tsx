
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
// @ts-ignore

import { styled, alpha } from '@mui/material/styles';

import {
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
    DialogContent,
    DialogActions
} from '@mui/material';

import {
    METAPLEX_PROGRAM_ID,
} from '../utils/auctionHouse/helpers/constants';

import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import { GRAPE_PREVIEW, DRIVE_PROXY, SHDW_PROXY, CLOUDFLARE_IPFS_CDN } from '../utils/grapeTools/constants';
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
    const tokenPrice = props?.tokenPrice || null;
    const tokenToSymbol = props?.tokenToSymbol || 'USDC';
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

                        let file_metadata = meta_final.data.uri;
                        const file_metadata_url = new URL(file_metadata);

                        const IPFS = 'https://ipfs.io';
                        if (file_metadata.startsWith(IPFS)){
                            file_metadata = CLOUDFLARE_IPFS_CDN+file_metadata_url.pathname;
                        }

                        const metadata = await window.fetch(file_metadata)
                        .then(
                            (res: any) => res.json()
                        );
                        return metadata;
                    }catch(ie){
                        // not found
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
                    
                    let img_url_string = image;
                    let full_url = new URL(img_url_string);
                    const ARWEAVE = 'https://arweave.net';
                    const IPFS = 'https://ipfs.io';
                    /*
                    if (SHDW_PROXY) {
                        if (img_url_string.startsWith(ARWEAVE)) {
                            img_url_string = image.replace(ARWEAVE, SHDW_PROXY);

                            img_url_string = img_url_string.replace(/\?.* /, "");
                            console.log("SHDW UPLOAD: "+image);
                            // full_url.pathname
                        }
                    }*/
                    
                    if ((img_url_string?.toLocaleUpperCase().indexOf('?EXT=PNG') > -1) ||
                        (img_url_string?.toLocaleUpperCase().indexOf('?EXT=JPEG') > -1) ||
                        (img_url_string?.toLocaleUpperCase().indexOf('.JPEG') > -1) ||
                        (img_url_string?.toLocaleUpperCase().indexOf('.PNG') > -1) ||
                        (img_url_string?.startsWith(IPFS))){
                            
                            /*
                            if (img_url_string.startsWith(IPFS)){
                                img_url_string = CLOUDFLARE_IPFS_CDN+full_url.pathname;
                            }
                            */
                            let image_url = DRIVE_PROXY+img_url_string;
                            if (img_url_string.startsWith(IPFS)){
                                image_url = CLOUDFLARE_IPFS_CDN+'/'+img_url_string;
                            }
                            
                            image = image_url;
                            //console.log("DRIVE_PROXY: "+image);
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
                                                        {collectionitem.name.length > 15 ?
                                                            <>{collectionitem?.name.substring(0,16)+'...'}</>
                                                        :
                                                            <>{collectionitem?.name}</>
                                                        }
                                                    </Typography> 
                                                </Grid>
                                                
                                                <Grid item xs={7}>
                                                    
                                                    {collectionitem?.listingPrice ?
                                                        
                                                        <Tooltip title={
                                                            <>
                                                            {tokenPrice &&
                                                                <strong>{(collectionitem.listingPrice*tokenPrice).toFixed(2)} {tokenToSymbol}<br/></strong>
                                                            }

                                                            {collectionitem?.marketplaceListing ? 
                                                                <> {collectionitem?.listedTimestamp}</>
                                                            : 
                                                                `Third party listing - see NFT history for details`
                                                            }
                                                            </>
                                                        }> 
                                                            <Button sx={{color:collectionitem?.marketplaceListing ? `white` : `gray`,borderRadius:'17px'}}>  
                                                                <Typography variant="h6">
                                                                {+collectionitem.listingPrice.toFixed(3)}  <SolCurrencyIcon sx={{fontSize:"16px"}} />
                                                                </Typography>
                                                            </Button>
                                                        
                                                        </Tooltip>
                                                    :
                                                        <Typography variant="caption" sx={{color:'#666'}}>
                                                            Not listed
                                                        </Typography>
                                                    }
                                                </Grid>
                                                <Grid item xs={5}>
                                                    {collectionitem?.highestOffer > 0 &&
                                                        <>
                                                            <Typography variant="body2" textAlign="right">
                                                                Offer for
                                                            </Typography>
                                                            <Typography variant="body1" textAlign="right" sx={{color:'yellow'}}>
                                                                {+collectionitem.highestOffer.toFixed(3)} <SolCurrencyIcon sx={{fontSize:"11px"}} />
                                                            </Typography>
                                                        </>
                                                    }
                                                    
                                                    {collectionitem.rarity && 
                                                        <Tooltip title={
                                                            <>
                                                            <strong>Grape Rarity Score: {collectionitem.rarity_score.toFixed(0)}</strong><br/>
                                                            Rarity is calculated on the collection attribute commonality, lower percentage = higher score.
                                                            </>}
                                                        >
                                                            <Button sx={{borderRadius:'17px'}}>  
                                                                <Typography variant="caption" textAlign="right" sx={{color:'yellow'}}>
                                                                    {(collectionitem.rarity*100).toFixed(2)}%
                                                                </Typography>
                                                            </Button>
                                                        </Tooltip>
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
                                    <DialogActions>
                                        <Button variant="text" onClick={handleCloseDialog}>Close</Button>
                                    </DialogActions>
                                </BootstrapDialog>
                            </>
                            }
                        </>
                );
            }
            //}
        }
}