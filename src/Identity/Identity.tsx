
import React, { useEffect, Suspense } from "react";
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
    Tab,
} from '@mui/material';

import {
    TabContext,
    TabList,
    TabPanel,
} from '@mui/lab';

import PortraitIcon from '@mui/icons-material/Portrait';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PublicIcon from '@mui/icons-material/Public';
import QrCode2Icon from '@mui/icons-material/QrCode2';

import SolIcon from '../components/static/SolIcon';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';

import { ValidateAddress, trimAddress, timeAgo, formatBlockTime } from '../utils/grapeTools/WalletAddress'; // global key handling
import { GRAPE_RPC_ENDPOINT, GRAPE_PROFILE, GRAPE_PREVIEW } from '../utils/grapeTools/constants';
import { ConstructionOutlined, JavascriptRounded } from "@mui/icons-material";

import { useTranslation } from 'react-i18next';

export function IdentityView(props: any){
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [solanaHoldings, setSolanaHoldings] = React.useState(null);
    const [solanaBalance, setSolanaBalance] = React.useState(null);
    const [solanaTransactions, setSolanaTransactions] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [loadingTransactions, setLoadingTransactions] = React.useState(false);
    const { publicKey } = useWallet();
    const [pubkey, setPubkey] = React.useState(props.pubkey || null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlParams = searchParams.get("pkey") || searchParams.get("address") || handlekey;
    const [value, setValue] = React.useState('1');

    const { t, i18n } = useTranslation();

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const fetchSolanaBalance = async () => {
        const response = await ggoconnection.getBalance(new PublicKey(pubkey));
        setSolanaBalance(response);
    }

    const fetchSolanaTransactions = async () => {
        setLoadingTransactions(true);
        const response = await ggoconnection.getSignaturesForAddress(new PublicKey(pubkey));

        let memos: any[] = [];
        let signatures: any[] = [];
        let counter = 0;
        // get last 100
        for (var value of response){
            if (counter<100){
                signatures.push(value.signature);
                memos.push(value.memo);
            }
            counter++;
        }
        const getTransactionAccountInputs2 = await ggoconnection.getParsedTransactions(signatures, 'confirmed');

        let cnt=0;
        let tx: any[] = [];
        for (var tvalue of getTransactionAccountInputs2){

            //if (cnt===0)
            //    console.log(signatures[cnt]+': '+JSON.stringify(tvalue));
            
            let txtype = "";
            if (tvalue.meta?.logMessages){
                for (var logvalue of tvalue.meta.logMessages){
                    //console.log("txvalue: "+JSON.stringify(logvalue));
                    if (logvalue.includes("Program log: Instruction: ")){
                        if (txtype.length > 0)
                            txtype += ", ";
                        txtype += logvalue.substring(26,logvalue.length);
                        
                    }
                }
            }

            tx.push({
                signature:signatures[cnt],
                blockTime:tvalue.blockTime,
                //amount:tx_cost,
                //owner:owner,
                memo:memos[cnt],
                source:null,
                type:txtype,
            });
            
            cnt++;
        }

        //setSolanaTransactions(response);
        setSolanaTransactions(tx);
        setLoadingTransactions(false);
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
                fetchSolanaTransactions();
            setLoading(false);
        }
    }, [pubkey]);



    if (loading){
        return (
            <>
                {t('Loading your solana profile')}
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
                                    <Tooltip title={t('Back go Profile')}>
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
                                        ><SolIcon sx={{fontSize:'20px',mr:1}} /> {t('SOLANA IDENTITY')}</Typography>

                                    </Grid>
                            </Grid>
           
           
                            <>

                                <Typography
                                    variant="h6"
                                >
                                    {t('ADDRESS')}:
                                </Typography>   
                                    <List dense={true}>
                                        <ListItem>
                                            <Tooltip title={t('View on Solana Explorer')}>
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
                                                        secondary={t('Solana Address')}
                                                    />
                                                </ListItemButton>
                                            </Tooltip>
                                        </ListItem>
                                    </List>

                                <Typography
                                    variant="h6"
                                >
                                    {t('PROFILE')}:
                                </Typography>   
                                    <List dense={true}>
                                        {profilePictureUrl &&
                                            <ListItem>
                                                {(profilePictureUrl.toLocaleUpperCase().indexOf("HTTPS://") > -1) ? (
                                                    <Tooltip title={t('View Image')}>
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
                                                                secondary={t('Solana Profile Picture')}
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
                                                            secondary={t('Solana Profile Picture')}
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
                                            {t('DOMAINS/REGISTRATIONS')}: 
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
                                                            <Tooltip title={t('View registration')}>
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
                                                                        secondary={t('Solana Domain')}
                                                                        
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
                                                                    secondary={(item.slice(0,1) === '@') && <>{t('Twitter Handle')}</>}
                                                                    
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

                                    {solanaHoldings &&

                                        <Box sx={{ width: '100%', typography: 'body1' }}>
                                            <TabContext value={value}>
                                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                                    <Tab sx={{color:'white'}} label={
                                                        <Typography variant="h6">{t('Tokens')} {solanaHoldings.length}</Typography>
                                                    } value="1" />
                                                    <Tab sx={{color:'white'}} label={
                                                        <Typography variant="h6">{t('Transactions')}</Typography>
                                                    } value="2" />
                                                </TabList>
                                                </Box>
                                                <TabPanel value="1">
                                                    
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
                                                    <ListItem key={0}>{t('No tokens on this address!')}</ListItem>    
                                                </List>
                                                }
                                                </TabPanel>
                                                <TabPanel value="2">
                                                {solanaTransactions ?
                                                    <List dense={true}>
                                                        {solanaTransactions.length > 0 ? solanaTransactions.map((item: any) => (
                                                            <ListItem>
                                                                <>
                                                                    <ListItemText
                                                                        primary={
                                                                            <>
                                                                                <Tooltip title={formatBlockTime(item.blockTime,true,true)}>
                                                                                    <Button>
                                                                                    {timeAgo(item.blockTime)}
                                                                                    </Button>
                                                                                </Tooltip> - {item.type}<br/> 
                                                                                <ListItemButton 
                                                                                    component="a" 
                                                                                    href={`https://explorer.solana.com/address/${item.signature}`}
                                                                                    target="_blank"
                                                                                    sx={{borderRadius:'24px'}}
                                                                                >
                                                                                    {item.signature}
                                                                                </ListItemButton>
                                                                            </>}
                                                                        secondary={
                                                                            <>
                                                                                {item?.memo && <Typography variant="caption">{item?.memo}</Typography>}
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
                                                        {loadingTransactions ?
                                                            <ListItem key={0}>{t('Loading transactions...')}</ListItem>    
                                                        :
                                                            <ListItem key={0}>{t('No transactions for this address!')}</ListItem>    
                                                        }
                                                    </List>
                                                }

                                                </TabPanel>
                                            </TabContext>
                                        </Box>
                                    }
                            </>
                            
                    </Box>
                </Container>
        );
    }
}