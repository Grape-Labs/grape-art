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
    Typography
} from '@mui/material';

import { PreviewView } from "../Preview/Preview";

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import ActivityView from './Activity';

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletConnectButton } from "@solana/wallet-adapter-material-ui";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';

import {
    METAPLEX_PROGRAM_ID,
} from '../utils/auctionHouse/helpers/constants';

import { decodeMetadata } from '../utils/grapeTools/utils';
import { GRAPE_RPC_ENDPOINT, GRAPE_PREVIEW } from '../utils/grapeTools/constants';

import { useTranslation } from 'react-i18next';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
}));

export default function ListForCollectionView(props: any){
    const logo = props.logo;
    const collectionAuthority = props.collectionAuthority;
    const entangleFrom = props.entangleFrom;
    const entangleTo = props.entangleTo;
    const enforceEntangle = props.enforceEntangle;
    const entangleUrl = props.entangleUrl;

    const MD_PUBKEY = METAPLEX_PROGRAM_ID;
    const [open, setOpenDialog] = React.useState(false);
    const { t, i18n } = useTranslation();
    const { publicKey } = useWallet();
    const [walletCollection, setWalletCollection] = React.useState(null);
    const [collectionMetaFinal,setCollectionMetaFinal] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const rpclimit = 100;

    const handleClickOpenPreviewDialog = () => {
        setOpenPreviewDialog(true);
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
                let walletCollection = new Array();
                let wallet = resultValues && resultValues?.map((collectionInfo: any) => {
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
        
        for (var item of collection){
            //console.log('item '+JSON.stringify(item))
            wallet_collection.push(item.account.data.parsed.info.mint);
        }

        try {
            let mintsPDAs = new Array();
            
            let mintarr = wallet_collection.slice(rpclimit*(start), rpclimit*(start+1)).map((value:any, index:number) => {
                //console.log("mint: "+JSON.stringify(value.address));
                //return value.account.data.parsed.info.mint;
                return value;
            });

            for (var value of mintarr){
                if (value){
                    let mint_address = new PublicKey(value);
                    let [pda, bump] = await PublicKey.findProgramAddress([
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
            for (var x=0; x < metadata.length; x++){
                //console.log("Metaplex val: "+JSON.stringify(metavalue));
                if (metadata[x]?.data){
                    try{
                        let meta_primer = JSON.parse(JSON.stringify(metadata[x]));
                        let buf = Buffer.from(meta_primer.data.data);
                        let meta_final = decodeMetadata(buf);
                        metadata[x]["decoded"] = meta_final;
                        
                        if (meta_final.updateAuthority === entangleFrom ||
                            meta_final.updateAuthority === entangleTo){
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

        const [collectionMeta] = await Promise.all([getCollectionData(0, collection)]);
        //console.log("collectionMeta: "+JSON.stringify(collectionMeta));
        setCollectionMetaFinal(collectionMeta);
        setLoading(false);
    }

    React.useEffect(() => {
        getCollectionGallery();
    }, [publicKey]);

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
                    {t('Just list it')}
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
                <ActivityView collectionAuthority={collectionAuthority} logo={logo} mode={1} />
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
                    {t('List')}
                </DialogTitle>
                <DialogContent>
                    <List>
                    {!publicKey || loading ?
                        <>
                            {publicKey ?
                            <>
                                loading
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
                                <ListItem 
                                    sx={{borderRadius:'17px'}}
                                    >
                                    <ListItemAvatar>
                                        <Avatar
                                            src={item.decodeMetadata?.image}
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
                                            {item.decodeMetadata?.name} 
                                        </Typography>
                                        {(item.decoded.updateAuthority === entangleFrom) && (enforceEntangle) ?
                                            <Typography
                                                variant='subtitle2'>
                                                You need to reload this Bear first to list
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
                                                <Button
                                                    onClick={handleClickOpenPreviewDialog}
                                                    //component={Link} to={`${GRAPE_PREVIEW}${item.decoded?.mint}`}
                                                    size="large"
                                                    variant="outlined"
                                                    sx={{
                                                        borderRadius: '17px',
                                                        color:'white'
                                                    }}
                                                >
                                                    <AccountBalanceWalletIcon sx={{mr:1}}/>Sell Now
                                                </Button>
                                            </Typography>
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
                                                        <PreviewView handlekey={item.decoded?.mint} />
                                                    </DialogContent>
                                                </BootstrapDialog>
                                            </>
                                        }

                                    </ListItemText>
                                </ListItem>
                            ))}
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