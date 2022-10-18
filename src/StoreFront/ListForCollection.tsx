import * as React from 'react';
import { styled } from '@mui/material/styles';

import { Link, useLocation, NavLink } from 'react-router-dom';

import {
    Button,
    ButtonGroup,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Typography,
    LinearProgress,
    Hidden
} from '@mui/material';

import { PreviewView } from "../Preview/Preview";

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ActivityView from './Activity';

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletConnectButton } from "@solana/wallet-adapter-material-ui";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';

import {
    METAPLEX_PROGRAM_ID,
} from '../utils/auctionHouse/helpers/constants';

import { decodeMetadata } from '../utils/grapeTools/utils';
import { GRAPE_RPC_ENDPOINT, GRAPE_PREVIEW, DRIVE_PROXY } from '../utils/grapeTools/constants';

import { useTranslation } from 'react-i18next';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
}));

export default function ListForCollectionView(props: any){
    const floorPrice = props.floorPrice || null;
    //const [floorPrice, setFloorPrice] = React.useState(props.floorPrice || null);
    const logo = props.logo;
    const creatorAddress = props?.creatorAddress || null;
    const collectionAuthority = props.collectionAuthority;
    const updateAuthority = props.updateAuthority;
    const collectionMintList = props.collectionMintList;
    const entangleFrom = props.entangleFrom;
    const entangleTo = props.entangleTo;
    const enforceEntangle = props.enforceEntangle;
    const entangleUrl = props.entangleUrl;
    const auctionHouseListings = props.activity;
    const MD_PUBKEY = METAPLEX_PROGRAM_ID;
    const [open, setOpenDialog] = React.useState(false);
    const { t, i18n } = useTranslation();
    const { publicKey } = useWallet();
    const [walletCollection, setWalletCollection] = React.useState(null);
    const [collectionMetaFinal, setCollectionMetaFinal] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [selectedMint, setSelectedMint] = React.useState(null);
    const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const rpclimit = 100;

    const handleClickOpenPreviewDialog = (mint:string) => {
        setSelectedMint(null);
        if (mint){
            setSelectedMint(mint)
            // if (selectedMint)
            setOpenPreviewDialog(true);
        }
    };
    
    const handleClosePreviewDialog = () => {
        setOpenPreviewDialog(false);
    };

    const handleClickOpenDialog = () => {
        setOpenDialog(true);
    };
    
    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    // fetch NFTs matching in the collection
    // filter by updateAuthority

    const fetchWalletCollection = async () => { 
        /*
        try{
            const results = await ggoconnection.getTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            })

            return results.value.map((r) => {
                const publicKey = r.pubkey
                const data = Buffer.from(r.account.data)
                const tokenAccount = await ggoconnection.getParsedAccountInfo(publicKey))
                return { publicKey, tokenAccount }
            })
        } catch(e){
            console.log("ERR: "+e);
        } 
        */    
        
        const body = {
          method: "getTokenAccountsByOwner",
          jsonrpc: "2.0",
          params: [
            // Get the public key of the account you want the balance for.
            publicKey,
            { programId: TOKEN_PROGRAM_ID },
            { encoding: "jsonParsed", commitment: "processed" },
          ],
          id: "35f0036a-3801-4485-b573-2bf29a7c77d4",
        };
        
        const response = await window.fetch(GRAPE_RPC_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        
        const json = await response.json();
        try{
                const resultValues = json.result.value
                const walletCollection = new Array();
                const wallet = resultValues && resultValues?.map((collectionInfo: any) => {
                    (+collectionInfo.account.data.parsed.info.tokenAmount.amount >= 1) &&
                        (+collectionInfo.account.data.parsed.info.tokenAmount.decimals === 0) && 
                            walletCollection.push(collectionInfo);    
                            return collectionInfo;
                });
                return walletCollection;
        } catch(e){console.log(e);}
        
        return [];
    };

    const getCollectionData = async (start:number, collection:any) => {
        const wallet_collection = new Array();
        
        for (const item of collection){
            wallet_collection.push(item.account.data.parsed.info.mint);
            //console.log("pushed: "+item.account.data.parsed.info.mint)
        }

        try {
            let mintsPDAs = new Array();
            
            // we should loop entire collection user has

            let mintarr = wallet_collection.slice(rpclimit*(start), rpclimit*(start+1)).map((value:any, index:number) => {
                //console.log("mint: "+JSON.stringify(value.address));
                //return value.account.data.parsed.info.mint;
                return value;
            });


            for (const value of mintarr){
                if (value){
                    const mint_address = new PublicKey(value);
                    const [pda, bump] = await PublicKey.findProgramAddress([
                        Buffer.from("metadata"),
                        MD_PUBKEY.toBuffer(),
                        new PublicKey(mint_address).toBuffer(),
                    ], MD_PUBKEY)

                    if (pda){
                        //console.log("pda: "+pda.toString());
                        mintsPDAs.push(pda);
                    }
                }
            }
            
            //console.log("pushed pdas: "+JSON.stringify(mintsPDAs));
            const metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
        
            //console.log("returned: "+JSON.stringify(metadata));
            // LOOP ALL METADATA WE HAVE
            //for (var metavalue of metadata){
            for (const x=0; x < metadata.length; x++){
                //console.log("Metaplex val: "+JSON.stringify(metavalue));
                if (metadata[x]?.data){
                    try{
                        const meta_primer = JSON.parse(JSON.stringify(metadata[x]));
                        const buf = Buffer.from(meta_primer.data.data);
                        const meta_final = decodeMetadata(buf);
                        metadata[x]["decoded"] = meta_final;
                        
                        if (updateAuthority){
                            if ((meta_final.updateAuthority === updateAuthority)||
                                (enforceEntangle && (meta_final.updateAuthority === entangleFrom || meta_final.updateAuthority === entangleTo))){
                                
                                if ((meta_final?.collection?.key === collectionAuthority.collection)||
                                    (collectionAuthority.collection === updateAuthority)||
                                    (collectionAuthority.address === updateAuthority)){
                                    //console.log("meta_final "+JSON.stringify(meta_final))
                                    //console.log("collectionAuthority: "+JSON.stringify(collectionAuthority.collection))

                                    try{
                                        const metadataFetch = await window.fetch(meta_final.data.uri)
                                        .then(
                                            (res: any) => res.json()
                                        );
                                        metadata[x]["decodeMetadata"] = metadataFetch;
                                    }catch(ie){
                                        // not on Arweave:
                                        //console.log("ERR: "+JSON.stringify(meta_final));
                                        // return null;
                                    }
                                } 
                            }
                        }/* else if (creatorAddress){
                            if (meta_final.data?.creators[0]?.address === creatorAddress){
                                    try{
                                        const metadataFetch = await window.fetch(meta_final.data.uri)
                                        .then(
                                            (res: any) => res.json()
                                        );
                                        metadata[x]["decodeMetadata"] = metadataFetch;
                                    }catch(ie){
                                        // not on Arweave:
                                        //console.log("ERR: "+JSON.stringify(meta_final));
                                        // return null;
                                    } 
                            }
                        }*/
                    }catch(etfm){console.log("ERR: "+etfm + " for "+ JSON.stringify(metadata[x]));}
                } else{
                    console.log("Something not right...");
                }
            }

            const thisCollection = new Array();
            for (var thisitem of metadata){
                let final_primer = JSON.parse(JSON.stringify(thisitem)); 
                if (final_primer?.decodeMetadata){
                    thisCollection.push(final_primer);
                }
            }

            return thisCollection;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getCollectionGallery = async () => {
        setLoading(true);
        const [collection] = await Promise.all([fetchWalletCollection()]);
        setWalletCollection({
            collection
        });

        const loops = Math.ceil(collection.length / rpclimit);
        let collectionmeta: any[] = [];

        console.log('lps: ' + loops);
        for (let x = 0; x < loops; x++) {
            //const interval = setTimeout(() => {
            const tmpcollectionmeta = await getCollectionData(x, collection);
            //collectionmeta.push(tmpcollectionmeta);
            collectionmeta = collectionmeta.concat(tmpcollectionmeta);
            //}, 200);
        }
        //console.log(collectionmeta.length + ' vs '+wallet_collection.length);

        //const [collectionMeta] = await Promise.all([getCollectionData(0, collection)]);
        
        console.log("collectionMeta: "+JSON.stringify(collectionmeta));
        setCollectionMetaFinal(collectionmeta);
        setLoading(false);
    }

    React.useEffect(() => {
        getCollectionGallery();
    }, [publicKey]);

    function SellNowButton(props:any){
        const item = props.item;
        const [isListed, setIsListed] = React.useState(false);
        const [listedPrice, setListedPrice] = React.useState(null);
        
        React.useEffect(() => {
            if (item){
                try{
                //console.log("collectionMintList: "+JSON.stringify(collectionMintList))
                    for (const mintItem of collectionMintList){
                        if (mintItem.address === item.decoded?.mint){
                            if (mintItem?.listingPrice){
                                setIsListed(true)
                                setListedPrice(mintItem?.listingPrice)
                            }
                        }
                    }
                }catch(e){console.log("ERR: "+e)}
            }
        }, [item]);

        


        return(
            
            <Button
                onClick={() => handleClickOpenPreviewDialog(item.decoded?.mint)}
                //component={Link} to={`${GRAPE_PREVIEW}${item.decoded?.mint}`}
                size="large"
                variant="outlined"
                sx={{
                    borderRadius: '17px',
                    color:'white'
                }}
            >
                {isListed ?
                    <>
                        <LocalOfferIcon sx={{mr:1, color:'green'}}/> Listed {listedPrice} <SolCurrencyIcon sx={{ml:1,fontSize:'12px'}} />
                    </>
                :
                    <>
                        <AccountBalanceWalletIcon sx={{mr:1}}/> Sell Now
                    </>
                }
            </Button>
        )
    }


    return (
        <>
            <ButtonGroup variant="outlined" aria-label="outlined primary button group">
                <Button 
                    onClick={handleClickOpenDialog}
                    sx={{
                        color:'white',
                        verticalAlign: 'middle',
                        display: 'inline-flex',
                        borderRadius:'17px'
                    }}
                >
                    
                    <Hidden smDown>
                        {t('Just list it')}
                    </Hidden>
                    <Hidden smUp>
                        {` ${t('List')}`}
                    </Hidden>
                    <Avatar
                        variant="square"
                        src={logo}
                        sx={{
                            ml:1,
                            width: 24, 
                            height: 24
                        }}
                    ></Avatar>
                </Button>
                <ActivityView collectionAuthority={collectionAuthority} collectionMintList={collectionMintList} logo={logo} mode={1} activity={auctionHouseListings} />
                <ActivityView collectionAuthority={collectionAuthority} collectionMintList={collectionMintList} logo={logo} mode={2} activity={auctionHouseListings} />
            </ButtonGroup>
            <BootstrapDialog 
                fullWidth={true}
                maxWidth={"sm"}
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
                <DialogTitle>
                    {t('List')} {floorPrice && <Typography variant='caption'>- Current Floor: {floorPrice} <SolCurrencyIcon sx={{ml:0.5,mr:0.5,fontSize:'10px'}} /></Typography>}
                </DialogTitle>
                <DialogContent>
                    <List>
                    {!publicKey || loading ?
                        <>
                            {publicKey ?
                            <>
                                <LinearProgress />
                            </>
                            :
                            <>
                                <WalletConnectButton />
                            </>
                            }
                        </>
                    : 
                        <>
                            {collectionMetaFinal && collectionMetaFinal.map((item: any) => (
                                <>
                                    {item?.decodeMetadata ?
                                    <ListItem 
                                        sx={{borderRadius:'17px'}}
                                        key={0}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={DRIVE_PROXY+item?.decodeMetadata?.image}
                                                sx={{
                                                    backgroundColor:'#222',
                                                    width: 75, 
                                                    height: 75,
                                                    mr:1
                                                }}
                                            ></Avatar>
                                        </ListItemAvatar>

                                        <ListItemText>
                                            <Typography variant="h5">
                                                {item?.decodeMetadata?.name} 
                                            </Typography>
                                            {(item.decoded.updateAuthority === entangleFrom) && (enforceEntangle) ?
                                                <Typography
                                                    variant='subtitle2'>
                                                    Entangle/Reload this NFT first and then you can list
                                                    <Button
                                                        component="a" href={entangleUrl} target="_blank"
                                                        size="large" 
                                                        variant="outlined"
                                                        sx={{
                                                            ml:1,
                                                            borderRadius: '17px',
                                                            color:'white'
                                                        }}
                                                    >
                                                        <SwapHorizIcon sx={{mr:1}}/> Reload
                                                    </Button>
                                                </Typography>
                                            :
                                                <>
                                                <Typography
                                                    variant='subtitle2'>
                                                    <SellNowButton item={item} />
                                                </Typography>
                                                
                                                </>
                                            }

                                        </ListItemText>
                                    </ListItem>
                                    :
                                            <>
                                            {console.log("item.decodeMetadata "+JSON.stringify(item))}
                                            </>
                                    }
                                </>
                            ))}

                            {selectedMint &&
                                <BootstrapDialog 
                                    fullWidth={true}
                                    maxWidth={"lg"}
                                    open={openPreviewDialog} onClose={handleClosePreviewDialog}
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
                                        <PreviewView handlekey={selectedMint} floorPrice={floorPrice || null} />
                                    </DialogContent>
                                    <DialogActions>
                                        <Button variant="text" onClick={handleClosePreviewDialog}>{t('Close')}</Button>
                                    </DialogActions>
                                </BootstrapDialog>
                            }
                        </>
                    }
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>{t('Close')}</Button>
                </DialogActions>
            </BootstrapDialog> 
        </>
  );
}