import React, { useState } from "react";
import { Link } from "react-router-dom";
// @ts-ignore

import CyberConnect, { Env, Blockchain, solana } from '@cyberlab/cyberconnect';
import { LikeListInfoResp, FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';
import { removeDuplicate } from '../utils/cyberConnect/helper';
import { followListInfoQuery, likeListInfoQuery } from '../utils/cyberConnect/query';

import { decodeMetadata } from '../utils/grapeTools/utils';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProfilePicture } from '@solflare-wallet/pfp';

import { Connection, PublicKey} from '@solana/web3.js';

import {
    METAPLEX_PROGRAM_ID,
  } from '../utils/auctionHouse/helpers/constants';

import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'

import { Button } from '@mui/material';

import {
    Typography,
    Grid,
    Box,
    Avatar,
    ListItem,
    ListItemText,
    ListItemButton,
    ListItemAvatar,
} from '@mui/material';

import CircularProgress from '@mui/material/CircularProgress';

import GalleryItem from './GalleryItem';
import GalleryView from './GalleryView';
import { GRAPE_RPC_ENDPOINT, GRAPE_RPC_REFRESH, GRAPE_PREVIEW, GRAPE_PROFILE, FEATURED_DAO_ARRAY } from '../utils/grapeTools/constants';
import { trimAddress } from '../utils/grapeTools/WalletAddress'; // global key handling

export default function CurationView(props: any){
    const MD_PUBKEY = METAPLEX_PROGRAM_ID;
    const [pubkey, setPubKey] = React.useState<string>(props.pubkey || null);
    const [type, setType] = React.useState<number>(props.type || 0);
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const rpclimit = 100;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const [likeListInfo, setLikeListInfo] = useState<LikeListInfoResp | null>(null);
    const solanaProvider = useWallet();
    const { publicKey } = useWallet();
    const [wallet_collection_meta, setCollectionMeta] = React.useState(null);
    const [final_collection, setCollectionMetaFinal] = React.useState(null);
    const NAME_SPACE = 'Grape';
    const GLOBAL_NAME_SPACE = '';
    const NETWORK = Network.SOLANA;
    const FIRST = 12; // The number of users in followings/followers list for each fetch
    const rowsperpage = 1500;

    const cyberConnect = new CyberConnect({
        namespace: NAME_SPACE,
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    // Get the current user followings and followers list
    const initFollowListInfo = async () => {
        setLoading(true);
        if (!pubkey) {
            return;
        }

        const resp = await likeListInfoQuery({
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            likeFirst: FIRST,
            likedFirst: FIRST,
        });
        if (resp) {
            setLikeListInfo(resp);
        }
        setLoading(false);
    };
  
  const fetchMore = async (type: 'likes' | 'likeds') => {
    if (!pubkey || !likeListInfo) {
      return;
    }

    const params =
      type === 'likeds'
        ? {
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            followerFirst: FIRST,
            followerAfter: likeListInfo.likeds.pageInfo.endCursor,
          }
        : {
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            followingFirst: FIRST,
            followingAfter: likeListInfo.likes.pageInfo.endCursor,
          };

    const resp = await likeListInfoQuery(params);
    if (resp) {
      type === 'likes'
        ? setLikeListInfo({
            ...likeListInfo,
            likes: {
              pageInfo: resp.likes.pageInfo,
              list: removeDuplicate(
                likeListInfo.likes.list.concat(resp.likes.list)
              ),
            },
          })
        : setLikeListInfo({
            ...likeListInfo,
            likeds: {
              pageInfo: resp.likeds.pageInfo,
              list: removeDuplicate(
                likeListInfo.likeds.list.concat(resp.likeds.list)
              ),
            },
          });
    }
  };
  
  const getCollectionData = async (start:number) => {
        const wallet_collection = likeListInfo.likes.list;
        
        try {
            let mintsPDAs = new Array();
            //console.log("RPClim: "+rpclimit);
            //console.log("Paging "+(rpclimit*(start))+" - "+(rpclimit*(start+1)));
            
            let mintarr = wallet_collection.slice(rpclimit*(start), rpclimit*(start+1)).map((value:any, index:number) => {
                //console.log("mint: "+JSON.stringify(value.address));
                //return value.account.data.parsed.info.mint;
                return value.address;
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
            for (var metavalue of metadata){
                //console.log("Metaplex val: "+JSON.stringify(metavalue));
                if (metavalue?.data){
                    try{
                        let meta_primer = metavalue;
                        let buf = Buffer.from(metavalue.data);
                        let meta_final = decodeMetadata(buf);
                        //console.log("meta_final: "+JSON.stringify(meta_final));
                    }catch(etfm){console.log("ERR: "+etfm + " for "+ JSON.stringify(metavalue));}
                } else{
                    console.log("Something not right...");
                }
            }

            return metadata;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getCollectionMeta = async (start:number) => {
        const wallet_collection = likeListInfo.likes.list;

        let tmpcollectionmeta = await getCollectionData(start);
        setCollectionMeta(tmpcollectionmeta);

        for (var i = 0; i < tmpcollectionmeta.length; i++){
            //console.log(i+": "+JSON.stringify(collectionmeta[i])+" --- with --- "+JSON.stringify(wallet_collection[i]));
            if (tmpcollectionmeta[i]){
                tmpcollectionmeta[i]["wallet"] = wallet_collection[i];
            }
        }
        
        try{
            let finalmeta = JSON.parse(JSON.stringify(tmpcollectionmeta));
            setCollectionMetaFinal(finalmeta);
        }catch(e){}

    }

    // if likeListInfo set
    // iterate all and use a batch rpc call
    React.useEffect(() => {
        if (likeListInfo && likeListInfo.likes.list){
            getCollectionMeta(0);
        }
    }, [likeListInfo]);

    React.useEffect(() => { 
        if (pubkey){
            initFollowListInfo();
        }
    }, []);
    

    if (loading){
        return (
            <Grid 
                container 
                direction="column" 
                spacing={2} 
                alignItems="center"
                rowSpacing={8}
            >
                <Grid 
                    item xs={12}
                >
                    <CircularProgress />
                </Grid>
            </Grid>
        )
    } else {
        return (
            <> 
                {wallet_collection_meta && final_collection &&
                    <GalleryView finalCollection={final_collection} walletCollection={wallet_collection_meta} />
                }
            </>
        );
    }
}