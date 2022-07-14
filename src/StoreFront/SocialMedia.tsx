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

import SyncIcon from '@mui/icons-material/Sync';
import PropTypes from 'prop-types';
import {  
    PROXY,
    TWITTER_BEARER } from '../utils/grapeTools/constants';
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
//import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

export function SocialMediaView(props: any) {
    const collectionAuthority = props.collectionAuthority;
    const twitterHandle = props.twitterHandle;
    const [socialMediaFeed, setSocialMediaFeed] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const { publicKey } = useWallet();
    
    const Timeout = (time:number) => {
        let controller = new AbortController();
        setTimeout(() => controller.abort(), time * 1000);
        return controller;
    };

    const getTwitterFeed = async () => {
        
        const url = `https://api.cardinal.so/twitter/proxy?url=https://api.twitter.com/2/users/by&usernames=${twitterHandle.slice(1)}&user.fields=profile_image_url`;
        const responseProfile = await axios.get(url);
        //const twitterImage = response?.data?.data[0]?.profile_image_url;
        if (responseProfile?.data?.data[0]?.id){
            //const params = new URLSearchParams([['expansions', "created_at"]]);
            const apiUrl = `https://api.cardinal.so/twitter/proxy?url=https://api.twitter.com/2/users/${responseProfile?.data?.data[0]?.id}/tweets&tweet.fields=created_at`;
            
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
                        <Typography variant="h4">
                            <Grid container direction="row">
                                <Grid item>
                                    {/*
                                    <Button
                                        sx={{borderRadius:'17px', color:'white'}}
                                        href={`https://twitter.com/${twitterHandle}`}
                                        target="_blank"
                                    >
                                    {twitterHandle}
                                    </Button>
                                    */}
                                    {twitterHandle}
                                </Grid>
                            </Grid>
                        </Typography>
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
                                        secondary={'View Tweet'}
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