
import React, { useEffect } from "react";
import { Global } from '@emotion/react';
import { Link, useParams, useSearchParams } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils';
// @ts-ignore
import { PublicKey, Connection, Commitment } from '@solana/web3.js';

import { styled } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

import { findDisplayName } from '../utils/name-service';
import { getProfilePicture } from '@solflare-wallet/pfp';
import { TokenAmount } from '../utils/grapeTools/safe-math';
import { useWallet } from '@solana/wallet-adapter-react';

import {
    Button,
    Stack,
    Typography,
    Grid,
    Box,
    Container,
    Skeleton,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Tooltip,
    SwipeableDrawer,
    CssBaseline,
} from '@mui/material';

import PortraitIcon from '@mui/icons-material/Portrait';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PublicIcon from '@mui/icons-material/Public';
import QrCode2Icon from '@mui/icons-material/QrCode2';

import SolIcon from '../components/static/SolIcon';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';

import { ValidateAddress, trimAddress, timeAgo, formatBlockTime } from '../utils/grapeTools/WalletAddress'; // global key handling
import { GRAPE_RPC_ENDPOINT, GRAPE_PROFILE, GRAPE_PREVIEW } from '../utils/grapeTools/constants';

export function IdentityView(props: any){
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [solanaHoldings, setSolanaHoldings] = React.useState(null);
    const [solanaBalance, setSolanaBalance] = React.useState(null);
    const [solanaTransactions, setSolanaTransactions] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const { publicKey } = useWallet();
    const [pubkey, setPubkey] = React.useState(props.pubkey || null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlParams = searchParams.get("pkey") || searchParams.get("address") || handlekey;

    const fetchSolanaBalance = async () => {
        const response = await ggoconnection.getBalance(new PublicKey(pubkey));
        setSolanaBalance(response);
    }

    const fetchSolanaTransactions = async () => {
        const response = await ggoconnection.getSignaturesForAddress(new PublicKey(pubkey));
        setSolanaTransactions(response);
    }

    const fetchSolanaTokens = async () => {
        //const response = await ggoconnection.getTokenAccountsByOwner(new PublicKey(pubkey), {programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")});
        /*
            let meta_final = JSON.parse(item.account.data);
            let buf = Buffer.from(JSON.stringify(item.account.data), 'base64');
        */
        // Use JSONParse for now until we decode 
        const body = {
            method: "getTokenAccountsByOwner",
            jsonrpc: "2.0",
            params: [
              pubkey,
              { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
              { encoding: "jsonParsed", commitment: "processed" },
            ],
            id: "35f0036a-3801-4485-b573-2bf29a7c77d2",
        };
        const resp = await fetch(GRAPE_RPC_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        })
        const json = await resp.json();
        const resultValues = json.result.value
        //return resultValues;

        let holdings: any[] = [];
        for (var item of resultValues){
            //let buf = Buffer.from(item.account, 'base64');
            //console.log("item: "+JSON.stringify(item));
            if (item.account.data.parsed.info.tokenAmount.amount > 0)
                holdings.push(item);
            // consider using https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json to view more details on the tokens held
        }

        let sortedholdings = JSON.parse(JSON.stringify(holdings));
        sortedholdings.sort((a:any,b:any) => (b.account.data.parsed.info.tokenAmount.amount - a.account.data.parsed.info.tokenAmount.amount));

        setSolanaHoldings(sortedholdings);
    } 

    const fetchProfilePicture = async () => {
        const { isAvailable, url } = await getProfilePicture(ggoconnection, new PublicKey(pubkey));
        let img_url = url;
        if (url)
            img_url = url.replace(/width=100/g, 'width=256');

        const solcdn = 'https://solana-cdn.com/cdn-cgi/image/width=256/';
        if (img_url.indexOf(solcdn) > -1){
                img_url = img_url.slice(solcdn.length, img_url.length);
        }

        setProfilePictureUrl(img_url);
    }
    
    const fetchSolanaDomain = async () => {
        const domain = await findDisplayName(ggoconnection, pubkey);
        if (domain){
            if (domain.toString()!==pubkey)
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
                fetchSolanaTokens();
                fetchSolanaBalance();
                //fetchSolanaTransactions();
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
                <Container>
                    <Box
                        className="grape-art-generic-placeholder-container"
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
                                    <Tooltip title="Back go Profile">
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
                                    </Tooltip>
                                    </Grid>
                                    <Grid 
                                        item xs={12}
                                        alignItems="center"
                                    > 
                                        <Typography
                                            variant="h5"
                                            color="inherit"
                                            display='flex'
                                            sx={{mb:3}}
                                        ><SolIcon sx={{fontSize:'20px',mr:1}} /> SOLANA IDENTITY</Typography>

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
                                            <Tooltip title="View on Solana Explorer">
                                                <ListItemButton 
                                                    component="a" 
                                                    href={`https://explorer.solana.com/address/${pubkey}`}
                                                    target="_blank"
                                                    sx={{borderRadius:'24px'}}
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar
                                                            sx={{backgroundColor:'#222'}}
                                                        >
                                                            <AccountBalanceWalletIcon sx={{color:'white'}} />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={pubkey}
                                                        secondary="Solana Address"
                                                    />
                                                </ListItemButton>
                                            </Tooltip>
                                        </ListItem>
                                    </List>

                                <Typography
                                    variant="h6"
                                >
                                    PROFILE:
                                </Typography>   
                                    <List dense={true}>
                                        {profilePictureUrl &&
                                            <ListItem>
                                                {(profilePictureUrl.toLocaleUpperCase().indexOf("HTTPS://") > -1) ? (
                                                    <Tooltip title="View Image">
                                                        <ListItemButton
                                                            component="a" 
                                                            href={profilePictureUrl}
                                                            target="_blank"
                                                            sx={{borderRadius:'24px'}}                                           
                                                        >
                                                            <ListItemAvatar>
                                                                <Avatar
                                                                    sx={{backgroundColor:'#222'}}
                                                                    src={profilePictureUrl}
                                                                    alt='PFP'
                                                                />
                                                            </ListItemAvatar>
                                                            <ListItemText
                                                                primary={profilePictureUrl}
                                                                secondary="Solana Profile Picture"
                                                            />
                                                        </ListItemButton>
                                                    </Tooltip>
                                                )
                                                :(
                                                    <>
                                                        <ListItemAvatar>
                                                            <Avatar
                                                                sx={{backgroundColor:'#222'}}
                                                                src={profilePictureUrl}
                                                                alt='PFP'
                                                            />
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={profilePictureUrl}
                                                            secondary="Solana Profile Picture"
                                                        />
                                                    </>
                                                )}
                                            </ListItem>
                                        }
                                    </List>
                                
                                
                                {solanaDomain &&
                                    <>
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
                                                        {(item.toLocaleUpperCase().indexOf(".SOL") > -1) ? (
                                                            <Tooltip title="View registration">
                                                                <ListItemButton
                                                                    component="a" 
                                                                    href={`https://naming.bonfida.org/#/domain/${item.slice(0,item.indexOf(".sol"))}`}
                                                                    target="_blank"
                                                                    sx={{borderRadius:'24px'}}                                           
                                                                >
                                                                    <ListItemAvatar>
                                                                        <Avatar
                                                                            sx={{backgroundColor:'#222'}}
                                                                        >
                                                                            <PublicIcon sx={{color:'white'}} />
                                                                        </Avatar>
                                                                    </ListItemAvatar>
                                                                    <ListItemText
                                                                        primary={JSON.stringify(item)}
                                                                        secondary='Solana Domain'
                                                                        
                                                                    />
                                                                </ListItemButton>
                                                            </Tooltip>
                                                        ):(
                                                            <>
                                                                <ListItemAvatar>
                                                                    <Avatar
                                                                        sx={{backgroundColor:'#222'}}
                                                                    >
                                                                        <PublicIcon sx={{color:'white'}} />
                                                                    </Avatar>
                                                                </ListItemAvatar>
                                                                <ListItemText
                                                                    primary={JSON.stringify(item)}
                                                                    secondary={(item.slice(0,1) === '@') && <>Twitter Handle</>}
                                                                    
                                                                />
                                                            </>
                                                        )}
                                                    </ListItem>
                                                ))}
                                        </List>
                                    </>
                                }
                                
                                <Typography
                                    variant="h6"
                                >
                                    SOL:
                                </Typography>   
                                 
                                    <List dense={true}>
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar
                                                    sx={{backgroundColor:'#222'}}
                                                >
                                                    <SolCurrencyIcon sx={{color:'white'}} />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={(parseFloat(new TokenAmount(solanaBalance, 9).format()))}
                                                secondary="Solana"
                                            />
                                        </ListItem>
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
                                                {item.account.data.parsed.info.tokenAmount.decimals === 0 ?
                                                <>
                                                    <Tooltip title="NFT">
                                                        <ListItemButton 
                                                            component={Link} to={`${GRAPE_PREVIEW}${item.account.data.parsed.info.mint}`}
                                                            sx={{borderRadius:'24px'}}
                                                        >
                                                            <ListItemAvatar>
                                                                <Avatar
                                                                    sx={{backgroundColor:'#222'}}
                                                                >
                                                                    <PortraitIcon sx={{color:'white'}} />
                                                                </Avatar>
                                                            </ListItemAvatar>
                                                            <ListItemText
                                                                primary={item.account.data.parsed.info.mint}
                                                                secondary={`x${item.account.data.parsed.info.tokenAmount.amount}`}
                                                                
                                                            />
                                                        </ListItemButton>
                                                    </Tooltip>
                                                </>
                                                :
                                                <>
                                                        <ListItemAvatar>
                                                        <Avatar
                                                            sx={{backgroundColor:'#222'}}
                                                        >
                                                            <QrCode2Icon sx={{color:'white'}} />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={((new TokenAmount(item.account.data.parsed.info.tokenAmount.amount, item.account.data.parsed.info.tokenAmount.decimals).format()))}
                                                        secondary={item.account.data.parsed.info.mint}
                                                    />
                                                </>
                                                }
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

                                {solanaTransactions &&
                                    <>
                                        <Typography
                                            variant="h6"
                                        >
                                            RECENT TX: 
                                            <Typography
                                                variant="body2"
                                                sx={{ml:2}}
                                            >{solanaTransactions && <>{solanaTransactions.length}</>}
                                            </Typography>
                                        </Typography> 
                                        {solanaTransactions ?
                                            <List dense={true}>
                                                {solanaTransactions.length > 0 ? solanaTransactions.map((item: any) => (
                                                    <ListItem>
                                                        <>
                                                            <ListItemText
                                                                primary={item.signature}
                                                                secondary={
                                                                    <>
                                                                        <Tooltip title={formatBlockTime(item.blockTime,true,true)}>
                                                                            <Button>
                                                                            {timeAgo(item.blockTime)}{item?.memo && <> | {item?.memo}</>}
                                                                            </Button>
                                                                        </Tooltip>
                                                                    </>
                                                                }
                                                            />
                                                        </>
                                                    </ListItem>
                                                ))
                                                :
                                                <></>}
                                            </List>
                                        :
                                        <List dense={true}>
                                            <ListItem key={0}>No transactions for this address!</ListItem>    
                                        </List>
                                        }
                                    </>
                                }
                            </>
                            
                    </Box>
                </Container>
        );
    }
}