import React, { useEffect, useState, useCallback, memo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils'
// @ts-ignore
import fetch from 'node-fetch'

import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { TokenAmount, lt } from '../utils/grapeTools/safe-math';
import { Connection, PublicKey } from '@solana/web3.js';

import { Button } from '@mui/material';

import {
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
  } from '../utils/auctionHouse/helpers/constants';
import {
    loadAuctionHouseProgram,
  } from '../utils/auctionHouse/helpers/accounts';

import { web3 } from '@project-serum/anchor';

import {
    Typography,
    Grid,
    Box,
    ListItemButton,
    Container,
} from '@mui/material';

import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';

import { GRAPE_RPC_ENDPOINT, GRAPE_PREVIEW } from '../utils/grapeTools/constants';
import { trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling

function convertSolVal(sol: any){
    return parseFloat(new TokenAmount(sol, 9).format());
}

function solanaCDN(image:string){
    if ((image?.toLocaleUpperCase().indexOf('?EXT=PNG') > -1) ||
        (image?.toLocaleUpperCase().indexOf('?EXT=JPEG') > -1)){
            //image = image.slice(0, image.indexOf('?'));
            image = 'https://solana-cdn.com/cdn-cgi/image/width=500/'+image;
    }
    return image;
}

export default function FeedView(props: any){
    const [loading, setLoading] = React.useState(false);
    const [limit, setLimit] = React.useState(25);
    const [maxPage, setMaxPage] = React.useState(false);
    const [beforeSignature, setBeforeSignature] = React.useState(null);
    const [featured, setFeatured] = React.useState(null);
    const [featuredmeta, setFeaturedMeta] = React.useState(null);
    const [mergedfeaturedmeta, setMergedFeaturedMeta] = React.useState(null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();

    const [saleTimeAgo, setSaleTimeAgo] = React.useState(null);
    const MD_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    
    const statestruct = ['Withdraw', 'Offer', 'Sale', 'Accepted from listing', 'Buy Now', 'Cancel', ''];

    const FeaturedItem = (props: any) => {
        const [finalMeta, setFinalMeta] = React.useState(null);
        const itemraw = props.itemmeta;
        //const itemdata = props.itemdata;

        const getCollectionItemData = async () => {
            try {
                //console.log("RAW: "+JSON.stringify(itemraw));
                let meta_primer = itemraw;
                let buf = Buffer.from(itemraw.data, 'base64');
                let meta_final = decodeMetadata(buf);
                //setCollectionRaw({meta_final,meta_primer});
    
                const metadata = await fetch(meta_final.data.uri).then(
                    (res: any) => res.json());
                
                return metadata;
            } catch (e) { // Handle errors from invalid calls
                console.log(e);
                return null;
            }
        }

        const getMeta = async () => {
            let final_meta = await getCollectionItemData();
            setFinalMeta(final_meta);
        }

        React.useEffect(() => { 
            if ((itemraw)&&(!finalMeta)){
                getMeta();
            }
        }, [itemraw]);


        //console.log("HERE: "+JSON.stringify(item));

        if (!finalMeta){
            return <><CircularProgress /></>
        } else{
            return (
                <Container
                    style={{overflow:'hidden', position:'relative', margin:0, padding:0}}
                >
                    <Container
                        sx={{
                            position:'relative',
                            background: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '26px',
                            overflow:'hidden',
                            mt:2,
                            mb:2,
                            ml:0,
                            mr:0,
                            p:0,
                            backgroundSize: "cover",
                        }} 
                    >
                    <img
                        src={solanaCDN(finalMeta?.image)}
                        alt=""
                        style={{
                            opacity: '0.1',
                            position: 'absolute',
                            borderRadius: '26px',
                            marginTop:2,
                            marginBottom:2,
                            padding:1,
                            top:'-20%',
                            left:'-20%',
                            width:'150%'
                        }}
                    />
                    
                    <Grid 
                        container 
                        direction='row'
                        >
                            <Grid item xs={12} sm={12} md={6}>
                                <Grid 
                                    container 
                                    alignItems="center"
                                    justifyContent="center">
                                    <Grid item sx={{display:'column',justifyContent:'center',alignItems:'center', p:0}}>
                                        <Box
                                            sx={{
                                                background: 'rgba(0, 0, 0, 0.6)',
                                                borderRadius: '26px',
                                                width:'100%',
                                                p:'2px',
                                            }} 
                                        >
                                            <ListItemButton
                                                component={Link} to={`${GRAPE_PREVIEW}${itemraw.memo.mint}`}
                                                sx={{
                                                    borderRadius:'25px',
                                                    p: 0
                                                }}
                                            >
                                                <img
                                                    src={`${solanaCDN(finalMeta?.image)}`}
                                                    srcSet={`${solanaCDN(finalMeta?.image)}`}
                                                    alt={finalMeta?.name}
                                                    //onClick={ () => openImageViewer(0) }
                                                    loading="lazy"
                                                    height="auto"
                                                    style={{
                                                        width:'100%',
                                                        borderRadius:'24px',
                                                        padding:0
                                                    }}
                                                />
                                            </ListItemButton>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Grid>
                            
                            <Grid item xs={12} sm={12} md={6}>
                                <Container
                                    sx={{
                                        minWidth: '100%',
                                        minHeight:'100%',
                                        m:1,
                                        p:0
                                    }} 
                                >
                                    <Container>
                                    {finalMeta?.symbol &&
                                        <Typography variant="caption">
                                            {finalMeta?.symbol}
                                        </Typography>
                                        }
                                        <Typography variant="h4">
                                            {finalMeta?.name}
                                        </Typography>
                                        
                                        <Box
                                            className='grape-art-generic-dark-box'
                                        >
                                            <Typography sx={{fontSize:'30px'}}>
                                                {statestruct[itemraw.memo.state]} <strong>{itemraw.memo.amount}</strong> <SolCurrencyIcon sx={{fontSize:"18px", mr:0.5 }}/>
                                            </Typography>
                                            <Typography variant="caption">
                                            - {itemraw.memo.timestamp} 
                                            </Typography>
                                            <Typography variant="caption">
                                                <Button size="small" sx={{fontSize:'10px'}} component="a" href={`https://explorer.solana.com/address/${itemraw.memo.mint}`} target="_blank">{trimAddress(itemraw.memo.mint,5)} <OpenInNewIcon sx={{fontSize:'14px', ml:1}} /></Button>
                                            </Typography>
                                            <Typography component="div" variant="caption" sx={{mt:1,mb:1}}>
                                            {finalMeta?.description}
                                            </Typography>
                                            
                                            <Button 
                                                className="buyNowButton"
                                                component={Link} 
                                                to={`${GRAPE_PREVIEW}${itemraw.memo.mint}`}
                                            >
                                                View
                                            </Button>
                                        </Box>
                                    </Container>
                                </Container>
                            </Grid>
                            
                        </Grid>
                    </Container>
                </Container>
            )
        }
    }
    
    const getCollectionData = async (mintarr:string[]) => {
        try {
            let mintsPDAs = new Array();
            
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

            const metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
            
            // LOOP ALL METADATA WE HAVE
            for (var metavalue of metadata){
                
                try{
                    let meta_primer = metavalue;
                    let buf = Buffer.from(metavalue.data);
                    let meta_final = decodeMetadata(buf);
                    
                }catch(etfm){console.log("ERR: "+etfm + " for "+ JSON.stringify(metavalue));}
            }

            return metadata;
            
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getFeatured = async () => {
        
        if (!loading){
            setLoading(true);
            const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
            const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
            const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
            //let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mint)).toBuffer())], auctionHouseKey);
            //let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((publicKey).toBuffer())], auctionHouseKey);
            //let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
            
            /*
            console.log("derivedMintPDA: "+derivedMintPDA);
            console.log("derivedBuyerPDA: "+derivedBuyerPDA);
            console.log("derivedOwnerPDA: "+derivedOwnerPDA);
            */
        
            let result = await ggoconnection.getSignaturesForAddress(auctionHouseKey, {limit: 100});
            let ahListings: any[] = [];
            let ahListingsMints: any[] =[];
            let exists = false;
            let cntr = 0;
            let cnt = 0;

            let signatures: any[] = [];
            for (var value of result){
                signatures.push(value.signature);
            }

            const getTransactionAccountInputs2 = await ggoconnection.getParsedTransactions(signatures, 'confirmed');
            let featured = null;
            for (var value of result){

                if (value.err === null){
                    try{
                        //console.log('value: '+JSON.stringify(value));
                        const getTransactionAccountInputs = getTransactionAccountInputs2[cnt];
                        
                        if (getTransactionAccountInputs?.transaction && getTransactionAccountInputs?.transaction?.message){
                        
                            let feePayer = new PublicKey(getTransactionAccountInputs?.transaction.message.accountKeys[0].pubkey); // .feePayer.toBase58();                            
                            let progAddress = getTransactionAccountInputs.meta.logMessages[0];

                            // get last signature
                            if (cntr === limit-1){
                                setBeforeSignature(value.signature);
                                setMaxPage(true);
                            }
                            
                            exists = false;
                            if ((value) && (value.memo)){
                                
                                let memo_arr: any[] = [];
                                let memo_str = value.memo;
                                let memo_instances = ((value.memo.match(/{/g)||[]).length);
                                if (memo_instances > 0) {
                                    // multi memo
                                    let mcnt = 0;
                                    let submemo = memo_str;
                                    //console.log("STR full (instance "+memo_instances+"): "+submemo);
                                    for (var mx=0;mx<memo_instances;mx++){
                                        let init = submemo.indexOf('{');
                                        let fin = submemo.indexOf('}');
                                        memo_str = submemo.substr(init,fin-(init-1)); // include brackets
                                        memo_arr.push(memo_str);
                                        submemo = submemo.replace(memo_str, "");
                                        //console.log("pushed ("+mx+"):: "+memo_str + " init: "+init+" fin: "+fin);
                                        //console.log("submemo: "+submemo);
                                    }
                                } else{
                                    let init = memo_str.indexOf('{');
                                    let fin = memo_str.indexOf('}');
                                    memo_str = memo_str.substr(init,fin); // include brackets
                                    memo_arr.push(memo_str);
                                }
                                

                                for (var memo_item of memo_arr){
                                    try{
                                        const memo_json = JSON.parse(memo_item);

                                        //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_str);
                                        for (var i = 0; i < ahListings.length; i++){
                                            if ((memo_json?.mint === ahListings[i].mint)){ // match same
                                                // if match then add
                                                if (memo_json.state === 1)
                                                    ahListings[i].offers = ahListings[i].offers+1;
                                                exists = true;
                                            }
                                        }

                                        if (!exists){
                                            let forSaleDate = ''+value.blockTime;
                                            if (forSaleDate){
                                                let timeago = timeAgo(''+value.blockTime);
                                                forSaleDate = timeago;
                                            }

                                            let solvalue = convertSolVal(memo_json?.amount || memo_json?.offer);
                                            if (memo_json?.mint){
                                                let offer = 0;
                                                if (memo_json.state === 1)
                                                    offer = 1;
                                                ahListings.push({amount: solvalue, mint: memo_json?.mint, timestamp: forSaleDate, blockTime:value.blockTime, state: memo_json?.state || memo_json?.status, offers: offer, score: memo_json?.score || 0});  
                                                ahListingsMints.push(memo_json.mint);
                                                
                                            }
                                        }
                                    }catch(merr){console.log("ERR: "+merr)}
                                }
                            }
                        }
                    } catch (e){console.log("ERR: "+e)}
                }
            } 

            let collectionmeta = await getCollectionData(ahListingsMints);

            setFeaturedMeta(collectionmeta);
            setFeatured(ahListings);

            for (var i = 0; i < collectionmeta.length; i++){
                collectionmeta[i]["memo"] = ahListings[i];
            }
            
            try{
                let finalmeta = JSON.parse(JSON.stringify(collectionmeta));
                finalmeta.sort((a:any,b:any) => (b.memo.score - a.memo.score) || (b.memo.blockTime - a.memo.blockTime));
                setMergedFeaturedMeta(finalmeta);
            }catch(e){
                setMergedFeaturedMeta(collectionmeta);
            }
            
            
            setLoading(false);                                      
        }
    }

    //React.useEffect(() => { 
        if ((!loading) && (!featured))
            getFeatured();
    //}, []);

    if (loading){
        return (
            <Grid 
                container 
                direction="column" 
                spacing={0} 
                alignItems="center"
                rowSpacing={8}
                width="100%"
                minWidth="400px"
            >
                <Grid 
                    item xs={12}
                >
                    <Box
                        height="100%"
                        display="flex-grow"
                        justifyContent="center"
                    >
                        <CircularProgress />
                    </Box>
                </Grid>
            </Grid>
        )
    } else{
        return (
            <Grid 
                container 
                direction="column" 
                spacing={0} 
                alignItems="center"
                rowSpacing={8}
            >
                <Grid 
                    item xs={12}
                >
                    <Box
                        height="100%"
                        display="flex-grow"
                        justifyContent="center"
                    >
                        {mergedfeaturedmeta &&
                            <>
                                <>
                                {mergedfeaturedmeta.map((item: any, key: number) => (
                                    <>
                                    {item.memo.state === 2 && 
                                        <FeaturedItem itemmeta={item} />
                                    }
                                    </>
                                ))}
                                </>

                                <>
                                {mergedfeaturedmeta.map((item: any, key: number) => (
                                    <>
                                    {item.memo.state === 1 && 
                                        <FeaturedItem itemmeta={item} />
                                    }
                                    </>
                                ))}
                                </>
                            </>
                        }
                    </Box>
                </Grid>
            </Grid>
        );
    }
}