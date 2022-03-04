import React, { useState } from "react";
import { Link } from "react-router-dom";
// @ts-ignore

import CyberConnect, { Env, Blockchain, solana } from '@cyberlab/cyberconnect';
import { FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';
import { removeDuplicate } from '../utils/cyberConnect/helper';
import { followListInfoQuery } from '../utils/cyberConnect/query';

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

export default function SocialView(props: any){
    const [pubkey, setPubKey] = React.useState<string>(props.pubkey || null);
    const [type, setType] = React.useState<number>(props.type || 0);
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const rpclimit = 100;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const { connection } = useConnection();
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isFollowing, setIsFollowing] = React.useState(false);
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

        const resp = await followListInfoQuery({
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            followingFirst: FIRST,
            followerFirst: FIRST
        });
        if (resp) {
            setFollowListInfo(resp);
        }
        setLoading(false);
    };
  
  const fetchMore = async (type: 'followings' | 'followers') => {
    if (!pubkey || !followListInfo) {
      return;
    }

    const params =
      type === 'followers'
        ? {
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            followerFirst: FIRST,
            followerAfter: followListInfo.followers.pageInfo.endCursor,
          }
        : {
            address:pubkey,
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            followingFirst: FIRST,
            followingAfter: followListInfo.followings.pageInfo.endCursor,
          };

    const resp = await followListInfoQuery(params);
    if (resp) {
      type === 'followers'
        ? setFollowListInfo({
            ...followListInfo,
            followers: {
              pageInfo: resp.followers.pageInfo,
              list: removeDuplicate(
                followListInfo.followers.list.concat(resp.followers.list)
              ),
            },
          })
        : setFollowListInfo({
            ...followListInfo,
            followings: {
              pageInfo: resp.followings.pageInfo,
              list: removeDuplicate(
                followListInfo.followings.list.concat(resp.followings.list)
              ),
            },
          });
    }
  };

    const ProfilePicture = (props:any) => {
        const followitem = props.followitem;
        const [address, setAddress] = React.useState(followitem.address);
        const [loadingpicture, setLoadingPicture] = React.useState(false);
        const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
        const [hasProfilePicture, setHasProfilePicture] = React.useState(false);
        const countRef = React.useRef(0);

        const fetchProfilePicture = async () => {
            setLoadingPicture(true);  
                //console.log("trying: "+address)
                try{
                    //console.log(countRef.current+": "+address+" - "+loadingpicture);
                    const { isAvailable, url } = await getProfilePicture(ggoconnection, new PublicKey(address));
                    
                    let img_url = url;
                    if (url)
                        img_url = url.replace(/width=100/g, 'width=256');
                    setProfilePictureUrl(img_url);
                    setHasProfilePicture(isAvailable);
                    countRef.current++;
                }catch(e){}
            setLoadingPicture(false);
        }

        React.useEffect(() => {       
            if (!loadingpicture){
                //const interval = setTimeout(() => {
                    if (address)
                        fetchProfilePicture();
                //}, 500);
            }
        }, []);

        /*
        React.useEffect(() => { 
            if ((!loadingpicture)&&(countRef.current<1)){
                const interval = setTimeout(() => {
                    if (address)
                        fetchProfilePicture();
                }, 500);
                return () => clearInterval(interval); 
            }
        }, []);
        */

        
        if (loadingpicture){
            return (
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgb(0, 0, 0)' }}>
                    <CircularProgress sx={{ width: 56, height: 56, bgcolor: 'rgb(0, 0, 0)' }} />
                </Avatar>)
        }else{
            
            if (hasProfilePicture){
                return (  
                    <Avatar alt={address} src={profilePictureUrl} sx={{ width: 56, height: 56, bgcolor: 'rgb(0, 0, 0)' }}>
                        {address.substr(0,2)}
                    </Avatar>
                );
            
            } else{
                return (
                    <>
                    {followitem.avatar ?
                        <>
                            <Avatar alt={followitem.address} src={followitem.avatar} sx={{ width: 56, height: 56, bgcolor: 'rgb(0, 0, 0)' }}>
                                {followitem.address.substr(0,2)}
                            </Avatar>
                        </>
                    :
                        <>
                        {jsNumberForAddress(followitem.address) ?
                            <>
                            <Jazzicon diameter={56} seed={jsNumberForAddress(followitem.address)} />
                            </>
                        :
                            <>
                            <Jazzicon diameter={56} seed={Math.round(Math.random() * 10000000)} />
                            </>
                        }
                        </>
                    }
                    </>
                );
            }
        }
    }


    const SocialItem = (props: any) => {
        const [followitem, setFollowItem] = React.useState(props.followitem);
        const [followitemkey, setFollowItemKey] = React.useState(props.followitemkey);
        
        if (loading){
            return <Grid item xs={12} sm={6} md={4}><CircularProgress /></Grid>
        } else{
            return (
                
                <Grid item xs={12} sm={12} md={4} lg={3}>

                    <ListItem 
                        key={followitemkey}
                        sx={{ 
                            background:'rgba(0,0,0,0.5)',
                            borderRadius:'17px' }}>
                        <ListItemButton
                            component={Link} 
                            to={`${GRAPE_PROFILE}${followitem.address}`}
                            sx={{ 
                                m:1,
                                borderRadius:'17px'}}
                            >
                            <ListItemAvatar>
                                <ProfilePicture followitem={followitem} />
                            </ListItemAvatar>
                            <ListItemText
                                sx={{ml:1}}
                                primary={followitem.ens || trimAddress(followitem.address,4)}  
                                secondary={<Typography variant="caption" color="#777">From {followitem.namespace}</Typography>}
                            />
                        </ListItemButton>
                    </ListItem>
                </Grid>


            )
        }
    }

    React.useEffect(() => { 
        if (publicKey){
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
                            {followListInfo &&
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                                    {followListInfo?.followers && followListInfo.followers.list.map((item: any, key: number) => (
                                    <SocialItem followitem={item} followitemkey={key} />
                                    ))}
                                </Grid>
                            }
                            
                            {followListInfo?.followers.pageInfo.hasNextPage &&
                                <Button onClick={() => fetchMore('followers')}>more</Button>
                            }
                        </>
                        :
                        <>
                            {followListInfo &&
                                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                                    {followListInfo?.followings && followListInfo.followings.list.map((item: any, key: number) => (
                                    <SocialItem followitem={item} followitemkey={key} />
                                    ))}
                                </Grid>
                            }
                            {followListInfo?.followings.pageInfo.hasNextPage &&
                                <Button onClick={() => fetchMore('followings')}>more</Button>
                            }
                        </>
                        }
                    </Grid>

                </Box>
            </>
        );
    }
}