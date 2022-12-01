import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import { ENV, TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token-v2';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as React from 'react';
import BN from 'bn.js';
import { styled, useTheme } from '@mui/material/styles';
//import { Swap } from '@strata-foundation/react'
import {
  Typography,
  Button,
  Grid,
  Box,
  Card,
  CardActions,
  CardContent,
  Avatar,
  Table,
  LinearProgress,
} from '@mui/material/';

import {  
    getTokenPrice,
    getCoinGeckoPrice } from '../utils/grapeTools/helpers';

import JupiterSwap from "./Swap";
import SendToken from "./Send";

import { formatAmount, getFormattedNumberToLocale } from '../utils/grapeTools/helpers'
//import { PretifyCommaNumber } from '../../components/Tools/PretifyCommaNumber';

import ExplorerView from '../utils/grapeTools/Explorer';

import { GRAPE_RPC_ENDPOINT } from '../utils/grapeTools/constants';
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
//import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

export function TokenView(props: any) {
    const collectionAuthority = props.collectionAuthority;
    const [loading, setLoading] = React.useState(false);
    const [token, setToken] = React.useState(null);
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const { publicKey } = useWallet();
    const [realm, setRealm] = React.useState(null);
    const [tokenMap, setTokenMap] = React.useState<Map<string,TokenInfo>>(undefined);
    const [tokenPrice, setTokenPrice] = React.useState(null);
    const [coinGeckoPrice,setCoinGeckoPrice] = React.useState(null);
    const [myToken, setMyToken] = React.useState(null);
    const [portfolioPositions, setPortfolioPositions] = React.useState(null);
    const [tokenSupply, setTokenSupply] = React.useState(null);

    const fetchTokens = async () => {
        const tokens = await new TokenListProvider().resolve();
        const tokenList = tokens.filterByChainId(ENV.MainnetBeta).getList();
        const tokenMapValue = tokenList.reduce((map, item) => {
            map.set(item.address, item);
            return map;
        }, new Map())
        setTokenMap(tokenMapValue);
        return tokenMapValue;
    }

    const getMyTokenInfo = async () => {
        const body = {
            method: "getTokenAccountsByOwner",
            jsonrpc: "2.0",
            params: [
                publicKey.toBase58(),
              { programId: TOKEN_PROGRAM_ID },
              { encoding: "jsonParsed", commitment: "processed" },
            ],
            id: "35f0036a-3801-4485-b573-2bf29a7c77d2",
        };
        const resp = await window.fetch(GRAPE_RPC_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        })
        const json = await resp.json();
        
        const pp = new Array;
        
        if (json?.result?.value){
            for (let item of json.result?.value){
                pp.push(item);
            }

            setPortfolioPositions(pp);

            for (let token of json.result?.value){
                if (token.account.data.parsed.info.mint === collectionAuthority.address){
                    setMyToken(token);
                }
            }
            //console.log("myTokens: "+JSON.stringify(json));
        }
    }

    const getTokenInfo = async () => {
        if (!loading){
            setLoading(true);
            try{

                const tknSupply = await connection.getTokenSupply(new PublicKey(collectionAuthority.address));

                setTokenSupply(tknSupply);
                //console.log("tknSupply: "+JSON.stringify(tknSupply));

                const tknMap = await fetchTokens();

                const tkn = tknMap.get(collectionAuthority.address);
                setToken(tkn)

                const tknPrice = await getTokenPrice(tkn.symbol, "SOL");
                
                setTokenPrice(tknPrice);
                const cgPrice = await getCoinGeckoPrice(tkn.extensions.coingeckoId);

                setCoinGeckoPrice(cgPrice);

                
                //src={tokenMap.get(item.account.data.parsed.info.mint)?.logoURI}

                //const tkn = TokenInfo()
                //console.log("trecords: "+JSON.stringify(trecords));
            
            }catch(e){console.log("ERR: "+e)}
        }
        setLoading(false);
    }

    React.useEffect(() => { 
        if (!loading){
            getTokenInfo();
        }
        if (publicKey)
            getMyTokenInfo();
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
        if (token){
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
                                    {token.name}
                                </Grid>
                                <Grid item sx={{ml:1}}>
                                    <Avatar alt={token.address} src={token.logoURI} sx={{ width: 40, height: 40, bgcolor: 'rgb(0, 0, 0)' }}>
                                        {token.address.substr(0,2)}
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </Typography>
                        <Typography variant="caption" component='div'>
                            Address: 
                                <ExplorerView address={token.address} type='address' shorten={0} hideTitle={false} style='text' color='white' fontSize='12px' />
                        </Typography>
                        <Typography variant="caption" component='div'>
                            Symbol: {token.symbol}
                        </Typography>
                        {tokenSupply &&
                            <Typography variant="caption" component='div'>
                                Supply: {getFormattedNumberToLocale(formatAmount(+((tokenSupply.value.amount)/Math.pow(10, tokenSupply.value.decimals)).toFixed(0)))}
                            </Typography>
                        }
                    </>
                    

                    <Box sx={{mt:2}}>

                        <Grid container spacing={2}>
                        
                        {tokenPrice &&
                            <Grid item xs={6}>
                                <Card sx={{borderRadius:'17px'}}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                        Token Price
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            1 SOL = {(1/tokenPrice.data.price).toFixed(tokenPrice.data?.decimals || 6)} {token.name}
                                        </Typography>
                                        <Typography variant="body2" component="div">
                                            1 {token.name} = {tokenPrice.data.price} SOL
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary" variant="caption">
                                        Source: Jupiter Aggregator
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        }

                        {coinGeckoPrice &&
                            <Grid item xs={6}>
                                <Card sx={{borderRadius:'17px'}}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                        Token Price
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            <Grid container direction="row">
                                                <Grid item>
                                                    {coinGeckoPrice[token.extensions.coingeckoId]?.usd} USD
                                                </Grid>
                                                <Grid item>
                                                    {coinGeckoPrice[token.extensions.coingeckoId]?.usd_24h_change < 0 ?
                                                        <Typography sx={{color:'red'}}>
                                                        {coinGeckoPrice[token.extensions.coingeckoId]?.usd_24h_change.toFixed(2)}%
                                                        </Typography>
                                                    :
                                                        <Typography sx={{color:'green'}}>
                                                        +{coinGeckoPrice[token.extensions.coingeckoId]?.usd_24h_change.toFixed(2)}%
                                                        </Typography>
                                                    }
                                                </Grid>
                                            </Grid>
                                            <Typography variant="body2" component="div">
                                                1 USD = {(1/coinGeckoPrice[token.extensions.coingeckoId]?.usd).toFixed(tokenPrice.data?.decimals || 6)} {token.name}
                                            </Typography>
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary" variant="caption">
                                        Source: CoinGecko
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        }

                        {publicKey && myToken &&
                            <Grid item xs={12}>
                                <Card sx={{borderRadius:'17px'}}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                        Wallet Balance
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                        
                                        {myToken.account.data.parsed.info.tokenAmount.uiAmount}
                                        </Typography>
                                        <Typography variant="body2" component="div">
                                            {(myToken.account.data.parsed.info.tokenAmount.uiAmount*coinGeckoPrice[token.extensions.coingeckoId]?.usd).toFixed(6)} USD
                                        </Typography>
                                        <Typography variant="body2" component="div">
                                            {(myToken.account.data.parsed.info.tokenAmount.uiAmount * tokenPrice.data.price).toFixed(6)} SOL
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary" variant="caption">
                                        Source: 
                                        <ExplorerView showSolanaProfile={true} grapeArtProfile={true} showAddress={true} address={publicKey.toBase58()} type='address' shorten={0} hideTitle={false} style='text' color='white' fontSize='11px' />
                                        </Typography>
                                    </CardContent>
                                    <CardActions
                                        sx={{
                                            justifyContent:'flex-end',
                                            alignContent: 'flex-end'}}
                                    >
                                        {portfolioPositions &&
                                            <JupiterSwap swapfrom={'So11111111111111111111111111111111111111112'} swapto={token.address} portfolioPositions={portfolioPositions} tokenMap={tokenMap}/>
                                        }
                                        {coinGeckoPrice &&
                                            <SendToken mint={token.address} name={token.name} logoURI={token.logoURI} balance={myToken.account.data.parsed.info.tokenAmount.uiAmount} conversionrate={+coinGeckoPrice[token.extensions.coingeckoId]?.usd} showTokenName={false} sendType={0} />
                                        }
                                        {/*
                                        <Swap id={token.address} />
                                        */}
                                    </CardActions>
                                </Card>
                            </Grid>
                        }
                        {publicKey && !myToken &&
                            <Grid item xs={12}>
                                <Card sx={{borderRadius:'17px'}}>
                                    <CardContent>
                                        <Typography variant="h5" component="div">
                                        YOU DO NOT HAVE THIS TOKEN IN YOUR CONNECTED WALLET | CHECK GOVERNANCE TAB FOR COMMUNITY PARTICIPATION
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{}}>
                                        {portfolioPositions &&
                                            <JupiterSwap swapfrom={'So11111111111111111111111111111111111111112'} swapto={token.address} portfolioPositions={portfolioPositions} tokenMap={tokenMap}/>
                                        }
                                    </CardActions>
                                </Card>
                            </Grid>
                        }
                        </Grid>
                    </Box>
                </Box>
                            
            );
        }else{
            return (<></>);
        }
        
    }
}