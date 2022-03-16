import React, { useState } from "react";
import { Link } from "react-router-dom";
// @ts-ignore

import CyberConnect, { Env, Blockchain, solana } from '@cyberlab/cyberconnect';
import { LikeListInfoResp, FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';
import { removeDuplicate } from '../utils/cyberConnect/helper';
import { followListInfoQuery, likeListInfoQuery } from '../utils/cyberConnect/query';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProfilePicture } from '@solflare-wallet/pfp';

import { Connection, PublicKey} from '@solana/web3.js';

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

import { GRAPE_RPC_ENDPOINT, GRAPE_RPC_REFRESH, GRAPE_PREVIEW, GRAPE_PROFILE, FEATURED_DAO_ARRAY } from '../utils/grapeTools/constants';
import { trimAddress } from '../utils/grapeTools/WalletAddress'; // global key handling

export default function CurationView(props: any){
    const [pubkey, setPubKey] = React.useState<string>(props.pubkey || null);
    const [type, setType] = React.useState<number>(props.type || 0);
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const rpclimit = 100;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [likeListInfo, setLikeListInfo] = useState<LikeListInfoResp | null>(null);
    const [followListInfo, setFollowListInfo] = useState<FollowListInfoResp | null>(null);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const solanaProvider = useWallet();
    const { publicKey } = useWallet();

    const NAME_SPACE = 'Grape';
    const GLOBAL_NAME_SPACE = '';
    const NETWORK = Network.SOLANA;
    const FIRST = 12; // The number of users in followings/followers list for each fetch

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
            followerAfter: likeListInfo.liked.pageInfo.endCursor,
          }
        : {
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            followingFirst: FIRST,
            followingAfter: likeListInfo.like.pageInfo.endCursor,
          };

    const resp = await likeListInfoQuery(params);
    if (resp) {
      type === 'likes'
        ? setLikeListInfo({
            ...likeListInfo,
            like: {
              pageInfo: resp.like.pageInfo,
              list: removeDuplicate(
                likeListInfo.like.list.concat(resp.like.list)
              ),
            },
          })
        : setLikeListInfo({
            ...likeListInfo,
            liked: {
              pageInfo: resp.liked.pageInfo,
              list: removeDuplicate(
                likeListInfo.liked.list.concat(resp.liked.list)
              ),
            },
          });
    }
  };

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

                        {type === 0 ?
                        <>
                            {likeListInfo &&
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                                    {likeListInfo?.liked && likeListInfo.liked.list?.map((item: any, key: number) => (
                                        <>
                                        {JSON.stringify(item)}
                                        {/*
                                        <SocialItem followitem={item} followitemkey={key} key={key} following={false} />
                                        */}
                                        </>
                                        
                                    ))}
                                </Grid>
                            }
                            
                            {likeListInfo?.liked.pageInfo.hasNextPage &&
                                <Button onClick={() => fetchMore('likeds')}>more</Button>
                            }
                        </>
                        :
                        <>
                            {likeListInfo &&
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                                    {likeListInfo?.like && likeListInfo.like.list?.map((item: any, key: number) => (
                                        <>
                                        {JSON.stringify(item)}
                                        {/*
                                        <SocialItem followitem={item} followitemkey={key} key={key} following={false} />
                                        */}
                                        </>
                                    ))}
                                </Grid>
                            }
                            {likeListInfo?.like.pageInfo?.hasNextPage &&
                                <Button onClick={() => fetchMore('likes')}>more</Button>
                            }
                        </>
                        }
                    
                    </Grid>

                </Box>
            </>
        );
    }
}