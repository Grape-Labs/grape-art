import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import { ENV, TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token-v2';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getOwnedTokenAccounts } from '../utils/governanceTools/tokens';
import * as React from 'react';
import axios from "axios";
import { styled, useTheme } from '@mui/material/styles';
import {
  Typography,
  Button,
  Grid,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Card,
  CardActions,
  CardContent,
  Paper,
  Avatar,
  Skeleton,
  Tooltip,
  CircularProgress,
  LinearProgress,
  ButtonGroup,
} from '@mui/material/';

import moment from 'moment';

import TwitterIcon from '@mui/icons-material/Twitter';
import SyncIcon from '@mui/icons-material/Sync';
import PropTypes from 'prop-types';
import {  
    PROXY,
    TWITTER_BEARER,
    TWITTER_PROXY } from '../utils/grapeTools/constants';
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
//import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

export function SocialMediaView(props: any) {
    const collectionAuthority = props.collectionAuthority;
    const twitterHandle = props.twitterHandle;
    const [socialMediaFeed, setSocialMediaFeed] = React.useState(null);
    const [twitterProfile, setTwitterProfile] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const { publicKey } = useWallet();
    
    const Timeout = (time:number) => {
        let controller = new AbortController();
        setTimeout(() => controller.abort(), time * 1000);
        return controller;
    };

    const getTwitterFeed = async () => {
        
        const url = `${TWITTER_PROXY}https://api.twitter.com/2/users/by&usernames=${twitterHandle.slice(1)}&user.fields=profile_image_url,public_metrics,created_at,description`;
        const responseProfile = await axios.get(url);
        //const twitterImage = response?.data?.data[0]?.profile_image_url;
        if (responseProfile?.data?.data[0]?.id){
            
            setTwitterProfile(responseProfile?.data?.data[0]);
            
            //const params = new URLSearchParams([['expansions', "created_at"]]);
            const apiUrl = `${TWITTER_PROXY}https://api.twitter.com/2/users/${responseProfile?.data?.data[0]?.id}/tweets&tweet.fields=created_at,public_metrics,organic_metrics,promoted_metrics`;
            
            const response = await axios.get(
                apiUrl
            );
            
            console.log("response: "+JSON.stringify(response))

            return (response?.data?.data);
        }
        
    }

    const getSocialMedia = async () => {
        if (!loading){
            setLoading(true);
            try{
                const ssm = await getTwitterFeed();
                setSocialMediaFeed(ssm);
            }catch(e){console.log("ERR: "+e)}
        } else{

        }
        setLoading(false);
    }

    React.useEffect(() => { 
        if (!loading){
            getSocialMedia();
        }
    }, [publicKey]);
    
    
    if(loading){
        return (
            <Box
                sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '17px',
                    p:4
                }} 
            > 
                <LinearProgress />
            </Box>
        )
    } else{
        if (socialMediaFeed){
            return (
                <Box
                    sx={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '17px',
                        p:4
                    }} 
                > 
                    <>
                        
                            <Grid container direction="row">
                                <Grid item>
                                    <Tooltip title={twitterProfile && twitterProfile.description}>
                                        <Button
                                            sx={{borderRadius:'17px', color:'white',textTransform:'none', fontSize:'30px'}}
                                            href={`https://twitter.com/${twitterHandle}`}
                                            target="_blank"
                                        >
                                            <Grid container direction="column">
                                                <Grid container direction="row">
                                                {twitterProfile &&
                                                    <Grid item>
                                                        <Avatar alt={twitterHandle} src={twitterProfile.profile_image_url} sx={{ width: 50, height: 50, bgcolor: 'rgb(0, 0, 0)' }}>
                                                            {twitterHandle}
                                                        </Avatar>
                                                    </Grid>
                                                }

                                                    <Grid item sx={{ml:1}}>
                                                        {twitterProfile ?
                                                            <>
                                                                <Typography variant="h5" sx={{mb:-3}}>
                                                                    {twitterProfile?.name}
                                                                </Typography>
                                                                <Typography variant='caption'>
                                                                    {twitterProfile?.username}
                                                                </Typography>
                                                            </>
                                                        :
                                                            <Typography variant="h5">
                                                                {twitterHandle} 
                                                                <TwitterIcon sx={{ml:1}}/>
                                                            </Typography>
                                                        }
                                                        
                                                    </Grid>
                                                </Grid>
                                                
                                                {twitterProfile &&
                                                    <Grid container direction="row" sx={{mt:-3}}>
                                                            <Grid item>
                                                                <Typography variant="caption">
                                                                <strong>{twitterProfile?.public_metrics?.following_count}</strong> Following
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Typography variant="caption">
                                                                &nbsp;|&nbsp;<strong>{twitterProfile?.public_metrics?.followers_count}</strong> Followers
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Typography variant="caption">
                                                                &nbsp;|&nbsp;<strong>{twitterProfile?.public_metrics?.tweet_count}</strong> Tweets
                                                                </Typography>
                                                            </Grid>
                                                        
                                                    </Grid>
                                                }
                                            </Grid>

                                        </Button>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                    </>
                    

                    <Box sx={{mt:2}}>

                        <List>
                            {socialMediaFeed.map((post:any) => (
                                <ListItemButton
                                    sx={{borderRadius:'17px'}}
                                    href={`https://twitter.com/${twitterHandle.slice(1)}/status/${post.id}`}
                                    target="_blank"
                                >
                                    <ListItemText 
                                        primary={
                                            <>
                                            {post.text.slice(0,2) === 'RT' ?
                                                <Typography variant='subtitle1'><SyncIcon fontSize="small" /> {post.text.slice(3)}</Typography>
                                            :
                                                <Typography variant='h6'>{post.text}</Typography>
                                            }
                                            </>
                                        }
                                        secondary={`${timeAgo(moment(post.created_at).format('X'))} - View Tweet`}
                                    />
                                </ListItemButton>
                            ))}
                        </List>

                    </Box>
                        
                </Box>
                            
            );
        }else{
            return (<></>);
        }
        
    }
}