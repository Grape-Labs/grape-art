import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import { ENV, TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token-v2';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getOwnedTokenAccounts } from '../utils/governanceTools/tokens';
import * as React from 'react';
import BN from 'bn.js';
import { styled, useTheme } from '@mui/material/styles';
import {
  Typography,
  Button,
  Grid,
  Box,
  Card,
  CardActions,
  CardContent,
  Paper,
  Avatar,
  Skeleton,
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TablePagination,
  Collapse,
  Tooltip,
  CircularProgress,
  LinearProgress,
  ButtonGroup,
} from '@mui/material/';

import {  
    getTokenPrice,
    getCoinGeckoPrice } from '../utils/grapeTools/helpers';

import JupiterSwap from "./Swap";
import SendToken from "./Send";

//import {formatAmount, getFormattedNumberToLocale} from '../Meanfi/helpers/ui';
//import { PretifyCommaNumber } from '../../components/Tools/PretifyCommaNumber';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';

import moment from 'moment';

import Chat from '@mui/icons-material/Chat';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TimerIcon from '@mui/icons-material/Timer';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

import { ChatNavigationHelpers, useDialectUiId } from '@dialectlabs/react-ui';
import { GRAPE_BOTTOM_CHAT_ID } from '../utils/ui-contants';

import PropTypes from 'prop-types';
import { GRAPE_RPC_ENDPOINT, THEINDEX_RPC_ENDPOINT } from '../utils/grapeTools/constants';
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

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
        
        setPortfolioPositions(json.result.value);

        for (var token of json.result.value){
            if (token.account.data.parsed.info.mint === collectionAuthority.address){
                setMyToken(token);
            }
        }

        console.log("myTokens: "+JSON.stringify(json));
    }

    const getTokenInfo = async () => {
        if (!loading){
            setLoading(true);
            try{
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
        } else{

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
                            Address: {token.address}
                        </Typography>
                        <Typography variant="caption" component='div'>
                            Symbol: {token.symbol}
                        </Typography>
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
                                                        {coinGeckoPrice[token.extensions.coingeckoId]?.usd_24h_change.toFixed(2)}%
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

                        {publicKey && myToken &&
                            <Grid item xs={12}>
                                <Card sx={{borderRadius:'17px'}}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                        Balance
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                        
                                        {myToken.account.data.parsed.info.tokenAmount.uiAmount}
                                        </Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary" variant="caption">
                                        Source: {publicKey.toBase58()}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <JupiterSwap swapfrom={'So11111111111111111111111111111111111111112'} swapto={token.address} portfolioPositions={portfolioPositions} tokenMap={tokenMap}/>
                                        {coinGeckoPrice &&
                                            <SendToken mint={token.address} name={token.name} logoURI={token.logoURI} balance={myToken.account.data.parsed.info.tokenAmount.uiAmount} conversionrate={+coinGeckoPrice[token.extensions.coingeckoId]?.usd} showTokenName={false} sendType={0} />
                                        }
                                    </CardActions>
                                </Card>
                            </Grid>
                        }
                        {publicKey && !myToken &&
                            <Grid item xs={12}>
                                <Card sx={{borderRadius:'17px'}}>
                                    <CardContent>
                                        <Typography variant="h5" component="div">
                                        YOU ARE NOT PARTICIPATING IN THIS TOKENIZED COMMUNITY
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small">SWAP &amp; GET TOKENS TO PARTICIPATE</Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        }
                        </Grid>
                    </Box>
                </Box>
                            
            );
        }else{
            return (<>???</>);
        }
        
    }
}