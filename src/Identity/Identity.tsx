
import React, { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils'
// @ts-ignore
import { PublicKey, Connection, Commitment } from '@solana/web3.js';

import { findDisplayName } from '../utils/name-service';
import { getProfilePicture } from '@solflare-wallet/pfp';

import { useWallet } from '@solana/wallet-adapter-react';

import {
    Button,
    Stack,
    Typography,
    Grid,
    Box,
    Skeleton,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    ListItemButton,
} from '@mui/material';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PublicIcon from '@mui/icons-material/Public';
import FolderIcon from '@mui/icons-material/Folder';
import QrCode2Icon from '@mui/icons-material/QrCode2';

import { ValidateAddress, trimAddress } from '../utils/grapeTools/WalletAddress'; // global key handling
import { GRAPE_RPC_ENDPOINT, GRAPE_PROFILE } from '../utils/grapeTools/constants';

export function IdentityView(props: any){
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [solanaHoldings, setSolanaHoldings] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const { publicKey } = useWallet();
    const [pubkey, setPubkey] = React.useState(props.pubkey || null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlParams = searchParams.get("pkey") || searchParams.get("address") || handlekey;

    const fetchSolanaHoldings = async () => {
        const response = await ggoconnection.getTokenAccountsByOwner(new PublicKey(pubkey), {programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")});
        
        let holdings: any[] = [];
        for (var item of response.value){

            //let buf = Buffer.from(item.account, 'base64');
            holdings.push({pubkey:item.pubkey});
            
            /*
            let buf = Buffer.from(item.account.data);
            
            let meta_final = JSON.parse(buf);
            //let meta_final = decodeMetadata(buf);
            console.log("meta_final: "+meta_final);
            */
            /*
            let buf = Buffer.from(JSON.stringify(item.account.data), 'base64');
            console.log("buf: "+JSON.stringify(buf));
            let meta_final = JSON.parse(JSON.stringify(buf));

            console.log("final: "+JSON.stringify(meta_final));
            let parsedData = meta_final;//JSON.parse(buf);
            */
        }
        console.log(JSON.stringify(holdings));
        setSolanaHoldings(holdings);
    } 

    const fetchProfilePicture = async () => {
        const { isAvailable, url } = await getProfilePicture(ggoconnection, new PublicKey(pubkey));
        let img_url = url;
        if (url)
            img_url = url.replace(/width=100/g, 'width=256');
        setProfilePictureUrl(img_url);
    }
    
    const fetchSolanaDomain = async () => {
        const domain = await findDisplayName(ggoconnection, pubkey);
        if (domain){
            setSolanaDomain(domain)
        }
    }

    React.useEffect(() => {
        if (urlParams){
            if (!pubkey){
                if (ValidateAddress(urlParams))
                    setPubkey(urlParams);
            }
        } else if (publicKey) {
            setPubkey(publicKey.toBase58());
        }
    }, [urlParams, publicKey]);


    React.useEffect(() => {
        if (pubkey){
            setLoading(true);
                fetchProfilePicture();
                fetchSolanaDomain();
                fetchSolanaHoldings();
            setLoading(false);
        }
    }, [pubkey]);



    if (loading){
        return (
            <>
                Loading your solana profile
            </>
        );
    } else{
        return (
                <React.Fragment>
                    <Box
                        sx={{ 
                            p: 1, 
                            mb: 3, 
                            width: '100%',
                            background: '#13151C',
                            borderRadius: '24px'
                        }}
                    > 
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
                                    <Button
                                        component={Link} 
                                        to={`${GRAPE_PROFILE}${pubkey}`}
                                        sx={{borderRadius:'24px',textTransform:'none',color:'white'}}
                                        >
                                        <Typography
                                            variant="h3"
                                            color="inherit"
                                            display='flex'
                                            sx={{mt:2}}
                                        >
                                            <img src="/grape_white_logo.svg" width="300px" className="header-logo" alt="Grape" />
                                            .art
                                            </Typography>
                                    </Button>
                                    </Grid>
                                    <Grid 
                                        item xs={12}
                                        alignItems="center"
                                    > 
                                        <Typography
                                            variant="h6"
                                            color="inherit"
                                            display='flex'
                                            sx={{mb:3}}
                                        >SOLANA IDENTITY</Typography>

                                    </Grid>
                            </Grid>
           
           
                            <>

                                <Typography
                                    variant="h6"
                                >
                                    ADDRESS:
                                </Typography>   
                                    <List dense={true}>
                                        <ListItem>
                                            <ListItemButton 
                                                component="a" 
                                                href={`https://explorer.solana.com/address/${pubkey}`}
                                                target="_blank"
                                            >
                                                <ListItemAvatar>
                                                    <Avatar
                                                    >
                                                        <AccountBalanceWalletIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={pubkey}
                                                    secondary="Solana Address"
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    </List>

                                <Typography
                                    variant="h6"
                                >
                                    PROFILE:
                                </Typography>   
                                    <List dense={true}>
                                        <ListItem>
                                                
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={profilePictureUrl}
                                                    alt='PFP'
                                                />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={profilePictureUrl}
                                                secondary="Solana Profile Picture"
                                            />
                                        </ListItem>
                                    </List>
                                
                                
                                <Typography
                                    variant="h6"
                                >
                                    DOMAINS/REGISTRATIONS: 
                                    <Typography
                                        variant="body2"
                                        sx={{ml:2}}
                                    >{solanaDomain && <>{solanaDomain.length}</>}
                                    </Typography>
                                </Typography> 
                                
                                <List dense={true}>
                                        {solanaDomain && solanaDomain?.map((item: any) => (
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <PublicIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={JSON.stringify(item)}
                                                    secondary="Solana Domain"
                                                />
                                            </ListItem>
                                        ))}
                                </List>
                                
                                <Typography
                                    variant="h6"
                                >
                                    TOKENS: 
                                    <Typography
                                        variant="body2"
                                        sx={{ml:2}}
                                    >{solanaHoldings && <>{solanaHoldings.length}</>}
                                    </Typography>
                                </Typography> 
                                {solanaHoldings ?
                                    <List dense={true}>
                                        {solanaHoldings.length > 0 ? solanaHoldings.map((item: any) => (
                                            <ListItem>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <QrCode2Icon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={JSON.stringify(item.pubkey)}
                                                secondary="token"
                                            />
                                            </ListItem>
                                        ))
                                        :
                                        <></>}
                                    </List>
                                :
                                <List dense={true}>
                                    <ListItem key={0}>No tokens on this address!</ListItem>    
                                </List>
                                }
                            </>
                        
                    </Box>
                </React.Fragment>
        );
    }
}