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
  List,
  ListItem,
} from '@mui/material/';

import {  
    getTokenPrice,
    getCoinGeckoPrice } from '../utils/grapeTools/helpers';

import { Provider, AnchorProvider } from "@project-serum/anchor";

import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getAssociatedAccountBalance, SplTokenMetadata, getMintInfo, getTokenAccount } from "@strata-foundation/spl-utils";
import StrataSwap from "./StrataSwap";

import BackedTokenSwap from "./BackedTokenSwap";
import JupiterSwap from "./Swap";
import SendToken from "./Send";

import { formatAmount, getFormattedNumberToLocale } from '../utils/grapeTools/helpers'
//import { PretifyCommaNumber } from '../../components/Tools/PretifyCommaNumber';

import ExplorerView from '../utils/grapeTools/Explorer';

import { RPC_CONNECTION, GRAPE_RPC_ENDPOINT } from '../utils/grapeTools/constants';
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { BatteryUnknown, ConstructionOutlined } from '@mui/icons-material';
//import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

export function BackedTokenView(props: any) {
    const collectionAuthority = props.collectionAuthority;
    const [loading, setLoading] = React.useState(false);
    const [token, setToken] = React.useState(null);
    const connection = RPC_CONNECTION;
    const { publicKey } = useWallet();
    const [realm, setRealm] = React.useState(null);
    const [tokenMap, setTokenMap] = React.useState<Map<string,TokenInfo>>(undefined);
    const [backedTokenMap, setBackedTokenMap] = React.useState<Map<string,TokenInfo>>(undefined);
    const [tokenPrice, setTokenPrice] = React.useState(null);
    const [coinGeckoPrice,setCoinGeckoPrice] = React.useState(null);
    const [myToken, setMyToken] = React.useState(null);
    const [portfolioPositions, setPortfolioPositions] = React.useState(null);
    const [tokenSupply, setTokenSupply] = React.useState(null);
    const [tokenBonding, setTokenBonding] = React.useState(null);
    const [tokenBondingPricing, setTokenBondingPricing] = React.useState(null);
    const [quoteAmount, setQuoteAmount] = React.useState(1);

    const [loadingStrata, setLoadingStrata] = React.useState(false);
    const [loadingPosition, setLoadingPosition] = React.useState('');
    const [strataTokenMetadata, setStrataTokenMedatada] = React.useState(null);
    const wallet = useWallet();
    const provider = new AnchorProvider(connection, wallet, {});

    const fetchStrataMetadata = async () => {
        setLoadingStrata(true);
        const tokenMetadataSdk = await SplTokenMetadata.init(provider);
        const tokenBondingSdk = await SplTokenBonding.init(provider);
        const tokenCollectiveSdk = await SplTokenCollective.init(provider);
        
        console.log("getting minttoken refkey")
        const mintTokenRef = (await SplTokenCollective.mintTokenRefKey(new PublicKey(collectionAuthority.address)))[0];
        console.log("mintTokenRef: "+JSON.stringify(mintTokenRef));

        const tokenRef = await tokenCollectiveSdk.getTokenRef(mintTokenRef);

        //console.log("tokenRef: "+JSON.stringify(tokenRef));

        const collective = await tokenCollectiveSdk.getCollective(new PublicKey(tokenRef.collective));
        console.log("collective: "+JSON.stringify(collective))
        const tokenMetadata = await tokenMetadataSdk.getMetadata(tokenRef.tokenMetadata)
        console.log("tokenMetadata: "+JSON.stringify(tokenMetadata))
        const meta = await tokenMetadataSdk.getTokenMetadata(tokenRef.tokenMetadata)

        const collectiveMint = await getMintInfo(provider, collective.mint);
        console.log("collectiveMint: "+JSON.stringify(collectiveMint))

        const tknBonding = await tokenBondingSdk.getTokenBonding(tokenRef.tokenBonding);
        console.log("tknBonding: "+JSON.stringify(tknBonding))
        const buyBaseRoyalties = await getTokenAccount(
            provider,
            tknBonding.buyBaseRoyalties
        );
        console.log("buyBaseRoyalties: "+JSON.stringify(buyBaseRoyalties))
        console.log("buyBaseRoyalties amount: "+buyBaseRoyalties.amount.toNumber())

        const tokenBondingKey = (await SplTokenBonding.tokenBondingKey(new PublicKey(collectionAuthority.address)))[0];
        //console.log("getting bonding")
        const tbonding = await tokenBondingSdk.getTokenBonding(tokenBondingKey)
        console.log("gbonding: "+JSON.stringify(tbonding));
        setTokenBonding(tbonding);

        const tbondingpricing = await tokenBondingSdk.getPricing(tokenBondingKey)
        
        console.log("tbondingpricing: "+JSON.stringify(tbondingpricing));
        
        var currentBuyPriceSol = tbondingpricing.buyTargetAmount(1);
        var currentSellPriceSol = tbondingpricing.sellTargetAmount(1);
        var amountPerOneSol = tbondingpricing.buyWithBaseAmount(1);

        console.log("currentBuyPriceSol (GRAPE FOR 1GAN): "+JSON.stringify(currentBuyPriceSol));
        console.log("currentSellPriceSol (GAN TO GRAPE): "+JSON.stringify(currentSellPriceSol));
        console.log("amountPerOneSol (GRAPE TO GAN): "+JSON.stringify(amountPerOneSol));
        
        
        
        setTokenBondingPricing(tbondingpricing);

        //const bonding = await tokenBondingSdk.getPricing(tokenBondingKey)
        //console.log("bonding: "+JSON.stringify(bonding));
        //console.log("meta: "+JSON.stringify(meta))
        
        setStrataTokenMedatada(meta);
        setLoadingStrata(false);

        return meta;
    }

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
                const tknMap = await fetchTokens();

                const tkn = tknMap.get(collectionAuthority.address);
                if (tkn){
                    setToken(tkn);
                }

                if (!tkn && collectionAuthority.tokenType === 'BSPL'){
                    const btkn = await fetchStrataMetadata();
                    
                    const thisToken = {
                        address: collectionAuthority.address,
                        name: btkn.metadata.data.name,
                        symbol: btkn.metadata.data.symbol,
                        decimals: btkn.mint.decimals,
                        logoURI: btkn.data.image
                    }

                    setToken(thisToken);
                    console.log("btkn: "+JSON.stringify(thisToken))
                } 
                
                const tknSupply = await connection.getTokenSupply(new PublicKey(collectionAuthority.address));
                console.log("tknSupply: "+JSON.stringify(tknSupply));
                setTokenSupply(tknSupply);
                
                if (collectionAuthority.tokenType === 'SPL'){
                    const tknPrice = await getTokenPrice(tkn.symbol, "SOL");
                    
                    setTokenPrice(tknPrice);
                    const cgPrice = await getCoinGeckoPrice(tkn.extensions.coingeckoId);

                    setCoinGeckoPrice(cgPrice);
                }
                
                

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
                                    <Avatar alt={token?.address || collectionAuthority.address} src={token?.logoURI ? token?.logoURI : token.image} sx={{ width: 40, height: 40, bgcolor: 'rgb(0, 0, 0)' }}>
                                        {token?.address ? token.address.substr(0,2) : collectionAuthority.address.substr(0,2)}
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </Typography>
                        <Typography variant="caption" component='div'>
                            Address: 
                                <ExplorerView address={token?.address || collectionAuthority.address} type='address' shorten={0} hideTitle={false} style='text' color='white' fontSize='12px' />
                        </Typography>
                        {token.symbol &&
                            <Typography variant="caption" component='div'>
                                Symbol: {token.symbol}
                            </Typography>
                        }
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
                                            1 SOL = {1/tokenPrice.data.price} {token.name}
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
                                                1 USD = {1/coinGeckoPrice[token.extensions.coingeckoId]?.usd} {token.name}
                                            </Typography>
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary" variant="caption">
                                        Source: CoinGecko
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        }

                        {tokenBondingPricing &&
                            <Grid item xs={12} md={6}>
                                <Card sx={{borderRadius:'17px'}}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                            Backed Token Details
                                        </Typography>

                                        <Typography variant="h5" component="div">
                                            <Grid container direction="row">
                                                <Grid item>
                                                    <Typography variant="h5" component="div">
                                                        <Typography sx={{color:'green'}} component="span">BUY</Typography> GRAPE to {quoteAmount} {token.symbol}: {tokenBondingPricing.buyTargetAmount(quoteAmount)}
                                                    </Typography>
                                                
                                                    <Typography variant="h5" component="div">
                                                        <Typography sx={{color:'red'}} component="span">SELL</Typography> {quoteAmount} {token.symbol} to GRAPE: {tokenBondingPricing.sellTargetAmount(quoteAmount)}
                                                    </Typography>
                                                    <Typography variant="body2" component="div">
                                                        {quoteAmount} GRAPE can be converted to {tokenBondingPricing.buyWithBaseAmount(quoteAmount)} {token.symbol}
                                                    </Typography>
                                                </Grid>
                                            </Grid>

                                            <Typography sx={{ mb: 1.5 }} color="text.secondary" variant="caption">
                                                Backed by: 
                                                <ExplorerView address={tokenBondingPricing.hierarchy.tokenBonding.baseMint.toBase58()} type='address' shorten={0} hideTitle={false} style='text' color='white' fontSize='12px' />
                                            </Typography>
                                            
                                            {/*
                                            <List>
                                                <ListItem>GRAPE for {quoteAmount} {token.symbol}: {tokenBondingPricing.buyTargetAmount(quoteAmount)}</ListItem>
                                                <ListItem>{quoteAmount} {token.symbol} to GRAPE: {tokenBondingPricing.sellTargetAmount(quoteAmount)}</ListItem>
                                                <ListItem>{quoteAmount} GRAPE to {token.symbol}: {tokenBondingPricing.buyWithBaseAmount(quoteAmount)}</ListItem>
                                                
                                                <ListItem>Base Mint: {tokenBondingPricing.hierarchy.tokenBonding.baseMint.toBase58()}</ListItem>
                                                <ListItem>Royalty (Buy/Sell): {getFormattedNumberToLocale(formatAmount(+((tokenBondingPricing.hierarchy.tokenBonding.buyBaseRoyaltyPercentage)/Math.pow(10, tokenSupply.value.decimals)).toFixed(tokenSupply.value.decimals)))}/{getFormattedNumberToLocale(formatAmount(+((tokenBondingPricing.hierarchy.tokenBonding.sellBaseRoyaltyPercentage)/Math.pow(10, tokenSupply.value.decimals)).toFixed(tokenSupply.value.decimals)))}</ListItem>
                                                <ListItem>Supply from Bonding: {getFormattedNumberToLocale(formatAmount(+((tokenBondingPricing.hierarchy.tokenBonding.supplyFromBonding.toNumber())/Math.pow(10, tokenSupply.value.decimals)).toFixed(tokenSupply.value.decimals)))}</ListItem>
                                                <ListItem>Reserve Balance from Bonding: {getFormattedNumberToLocale(formatAmount(+((tokenBondingPricing.hierarchy.tokenBonding.reserveBalanceFromBonding.toNumber())/Math.pow(10, tokenSupply.value.decimals)).toFixed(tokenSupply.value.decimals)))}</ListItem>
                                                <ListItem>Base Amount: {((+((tokenBondingPricing.hierarchy.pricingCurve.baseAmount)/Math.pow(10, tokenSupply.value.decimals))))}</ListItem>
                                                <ListItem></ListItem>

                                            </List>
                                            */}
                                        </Typography>
                                    </CardContent>
                                    <CardActions 
                                        sx={{
                                            justifyContent:'flex-end',
                                            alignContent: 'flex-end'}}
                                    >
                                        <StrataSwap swapfrom={token.parentTokenAddress} swapto={token.address} swapfromlabel={'Grape'} swaptolabel={token.symbol} swapAmount={quoteAmount} refreshCallback={null} />
                                    </CardActions>
                                </Card>
                            </Grid>
                        }

                        {publicKey && myToken &&
                            <Grid item xs={12} md={6}>
                                <Card sx={{borderRadius:'17px'}}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                        Wallet Balance
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                        
                                        {myToken.account.data.parsed.info.tokenAmount.uiAmount}
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
                                        {/*portfolioPositions &&
                                            <JupiterSwap swapfrom={'So11111111111111111111111111111111111111112'} swapto={token.address} portfolioPositions={portfolioPositions} tokenMap={tokenMap}/>
                                        */}
                                        
                                        <SendToken mint={token.address} name={token.name} logoURI={token.logoURI} balance={myToken.account.data.parsed.info.tokenAmount.uiAmount} showTokenName={false} sendType={0} />
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
                                        {/*portfolioPositions &&
                                            <JupiterSwap swapfrom={'So11111111111111111111111111111111111111112'} swapto={token.address} portfolioPositions={portfolioPositions} tokenMap={tokenMap}/>
                                        */}
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