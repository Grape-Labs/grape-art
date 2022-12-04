// ADD CODE FOR JUPITER SWAP IMPLEMENTATION
import React, {useEffect, useState} from 'react';
import JSBI from 'jsbi';
import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { styled } from '@mui/material/styles';
import {
    Dialog,
    Button,
    ButtonGroup,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    Grid,
    InputLabel,
    Tooltip,
    Typography,
    MenuItem,
    Autocomplete,
    Stack,
} from '@mui/material';

import { 
    GRAPE_RPC_ENDPOINT, 
} from '../utils/grapeTools/constants';

import CircularProgress from '@mui/material/CircularProgress';
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { JupiterProvider, useJupiter } from "@jup-ag/react-hook";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import {RegexTextField} from "../utils/grapeTools/RegexTextField";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import {ENV, TokenInfo, TokenListProvider} from "@solana/spl-token-registry";
import {useSnackbar} from "notistack";

export interface Token {
    chainId: number; // 101,
    address: string; // 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: string; // 'USDC',
    name: string; // 'Wrapped USDC',
    decimals: number; // 6,
    logoURI: string; // 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW/logo.png',
    tags: string[]; // [ 'stablecoin' ]
}


const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

export interface DialogTitleProps {
    id: string;
    children?: React.ReactNode;
    onClose: () => void;
}

export interface DialogTitleProps {
    id: string;
    children?: React.ReactNode;
    onClose: () => void;
}

const BootstrapDialogTitle = (props: DialogTitleProps) => {
    const { children, onClose, ...other } = props;

    return (
        <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
            {children}
            {onClose ? (
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
};

/*
interface JupiterProps {
    connection: Connection;
    cluster: Cluster;
    userPublicKey?: PublicKey;
    platformFeeAndAccounts?: PlatformFeeAndAccounts;
    quoteMintToReferrer?: QuoteMintToReferrer;
    routeCacheDuration?: number;
    onlyDirectRoutes?: boolean;
    marketUrl?: string;
    restrictIntermediateTokens?: boolean;
    children?: ReactNode; // <- Add this here
}*/

export default function JupiterSwap(props: any ){
    //export const JupiterSwap = (props: any) => {
    //const connection = useConnection();
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const {connected, wallet, publicKey} = useWallet();
    const tokenMap = props?.tokenMap || null;

    return(
        <JupiterProvider
            connection={connection}
            cluster={WalletAdapterNetwork.Mainnet}
            tokenMap={tokenMap}
            userPublicKey={connected ? publicKey : undefined}>
                <JupiterForm {...props}/>
        </JupiterProvider>);
}


function JupiterForm(props: any) {
    const [tokenSwapAvailableBalance, setPortfolioSwapTokenAvailableBalance] = useState(0);
    const [open, setOpen] = useState(false);
    const [userTokenBalanceInput, setTokenBalanceInput] = useState(0);
    const [convertedAmountValue, setConvertedAmountValue] = useState(null);
    const [amounttoswap, setTokensToSwap] = useState(null);
    
    //const [swapfrom, setSwapFrom] = useState('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    //const [swapto, setSwapTo] = useState('8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA');
    
    const [swapfrom, setSwapFrom] = useState(props.swapfrom);
    const [swapto, setSwapTo] = useState(props.swapto);
    
    const [tokenMap, setTokenMap] = useState<Map<string,TokenInfo>>(props.tokenMap || undefined);
    const [inputValue, setInputValue] = useState('')
    const [selectedValue, setSelectedValue] = useState<TokenInfo>()
    const [minimumReceived, setMinimumReceived] = useState(0);
    const [tradeRoute, setTradeRoute] = useState("");
    const [lpfees, setLpFees] = useState<Array<string>>([]);
    const [priceImpacts, setPriceImpacts] = useState<Array<string>>([]);
    const [rate, setRate] = useState('');
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [ autoCompleteOptions, setAutoCompleteOptions ] = useState([]);
    const [ allAutoCompleteOptions, setAllAutoCompleteOptions ] = useState([]);
    const {publicKey, wallet, signAllTransactions, signTransaction, sendTransaction} = useWallet();
    const connection = useConnection();
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);

    const getPrices = async (path?: string): Promise<any> => {
        return fetch(path || "https://api.raydium.io/coin/price", {
          method: "GET",
        })
          .then((response) => response.json())
          .then((response) => {
            return response;
          })
          .catch((err) => {
            console.error(err);
          });
    };
      

    const getTokenList = async () => {
        const priceList = await getPrices();
        //console.log("priceList: "+JSON.stringify(priceList))
        if (priceList){    
            if (!tokenMap){
                const raydiumTokens = Object.keys(priceList);
                const tokens = await new TokenListProvider().resolve();
                const tokenList = tokens.filterByChainId(ENV.MainnetBeta).getList().filter(ti => ti.symbol === 'ORCA' || raydiumTokens.includes(ti.symbol) );
                const tokenMapValue = tokenList.reduce((map, item) => {
                        map.set(item.address, item);
                        return map;
                    }, new Map())
                setTokenMap(tokenMapValue);
                setAllAutoCompleteOptions(Array.from<TokenInfo>(tokenMapValue.values()).sort((a,b)=> a.symbol.localeCompare(b.symbol)));
            } else{
                
                setAllAutoCompleteOptions(Array.from<TokenInfo>(tokenMap.values()).sort((a,b)=> a.symbol.localeCompare(b.symbol)));
            }
            
        }
    }
    useEffect(() => {
        getTokenList()
    }, [setTokenMap]);

    React.useEffect(() => {
        getPortfolioTokenBalance(swapfrom);
    }, []);

    const jupiter = useJupiter({
        amount: JSBI.BigInt(tokenMap?.get(swapfrom) ? (amounttoswap * (10 ** tokenMap.get(swapfrom).decimals)).toFixed(0) : 0), // raw input amount of tokens
        inputMint: new PublicKey(swapfrom),
        outputMint: new PublicKey(swapto),
        slippage: 1, // 1% slippage
        debounceTime: 250, // debounce ms time before refresh
    })

    const {
        exchange, // exchange
        // refresh, // function to refresh rates
        // lastRefreshTimestamp, // timestamp when the data was last returned
        loading, // loading states1
        routes, // all the routes from inputMint to outputMint
        error,
    } = jupiter

    const handleClickOpen = () => {
        setTokenBalanceInput(0);
        setTokensToSwap(0);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleImageError = (ev) => ev.target.style.display = 'none';

    const swapIt = async () => {
        if(amounttoswap === 0)
        {
            enqueueSnackbar('Input a non-zero amount to swap.',{ variant: 'error' });
            return
        }
        if(amounttoswap > tokenSwapAvailableBalance)
        {
            enqueueSnackbar(`Your ${tokenMap.get(swapfrom).name} balance is not high enough to make this swap.`,{ variant: 'error' });
            return
        }
        if (
            !loading &&
            routes?.[0] &&
            signAllTransactions &&
            signTransaction &&
            sendTransaction &&
            publicKey
        ) {
            enqueueSnackbar(`Preparing to swap ${amounttoswap.toString()} ${tokenMap.get(swapfrom).name} for at least ${minimumReceived} ${tokenMap.get(swapto).name}`,{ variant: 'info' });

            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            
            const swapResult = await exchange({
                wallet: {
                    sendTransaction: sendTransaction,
                    //publicKey: publicKey,
                    signAllTransactions: signAllTransactions,
                    signTransaction: signTransaction,
                },
                routeInfo: routes[0],
                onTransaction: async (txid) => {

                    const latestBlockHash = await ggoconnection.getLatestBlockhash();
                    await ggoconnection.confirmTransaction({
                        blockhash: latestBlockHash.blockhash,
                        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                        signature: txid}, 
                        'processed'
                    );

                    //await connection.connection.confirmTransaction(txid);
                    return await connection.connection.getTransaction(txid, {
                        commitment: "confirmed",
                    });

                },
            });
            closeSnackbar(cnfrmkey);
            if ("error" in swapResult) {
                enqueueSnackbar(`${swapResult.error}`,{ variant: 'error' });
            } else if ("txid" in swapResult) {
                /*
                const action = (key:any) => (
                    <Button href={`https://explorer.solana.com/tx/${signature}`} target='_blank' sx={{color:'white'}} >
                        Signature: {signature}
                    </Button>
                );*/
                enqueueSnackbar(`Swapped: ${swapResult.txid}`,{ variant: 'success' });
                setOpen(false);
            }
        } else{
            enqueueSnackbar(`Unable to setup a valid swap`,{ variant: 'error' });
        }
    }

    function HandleSendSubmit(event: any) {
        event.preventDefault();
        swapIt();
    }

    function getPortfolioTokenBalance(swapingfrom:string){
        let balance = 0;
        //console.log("props.... "+JSON.stringify(props.portfolioPositions));

        props.portfolioPositions.map((token: any) => {
            if (token.account.data.parsed.info.mint === swapingfrom){
                if (+token.account.data.parsed.info.tokenAmount.uiAmount > 0)
                    balance = +token.account.data.parsed.info.tokenAmount.uiAmount;
            }
        });
        setPortfolioSwapTokenAvailableBalance(balance);
    }


    useEffect(() => {
        if(!routes || routes.length === 0) {
            return
        }
        setTradeRoute('');
        setLpFees([]);
        setPriceImpacts([]);
        
        try{
            setConvertedAmountValue(+(String(routes[0].outAmount)) / (10 ** (tokenMap.get(swapto)!.decimals || 6)));

            if (+(String(routes[0].outAmount)) > 0){
                routes[0].marketInfos.forEach(mi => {
                    console.log("rount: "+mi.amm.label)
                    setTradeRoute(tr => tr + (tr && " x ") + mi.amm.label)

                    setLpFees(lpf => [...lpf, `${mi.amm.label}: ${(+mi.lpFee.amount[0]/(10 ** tokenMap.get(mi.lpFee.mint)?.decimals))}` +
                    ` ${tokenMap.get(mi.lpFee.mint)?.symbol} (${mi.lpFee.pct * 100}%)`]);
                    setPriceImpacts(pi => [...pi, `${mi.amm.label}: ${mi.priceImpactPct * 100 < 0.1 ? '< 0.1' : (mi.priceImpactPct * 100).toFixed(2)}%` ])
                })
            }

            setMinimumReceived((+(String(routes[0].outAmount))-(+(String(routes[0].outAmount))*0.001)) / (10 ** (tokenMap.get(swapto)!.decimals || 6)) || null)

            const rate = ((+(String(routes[0].outAmount)) / (10 ** (tokenMap.get(swapto)!.decimals || 6)))/ (+routes[0].inAmount[0] / (10 ** tokenMap.get(swapfrom)!.decimals)) || null);
            if (rate)
                setRate(`${rate} ${tokenMap.get(swapto)!.symbol || ''} per ${tokenMap.get(swapfrom)!.symbol}`)
        }catch(e){
            console.log("ERR: "+e);
        }
    }, [routes, tokenMap])

    useEffect(()=>{
        setAutoCompleteOptions(allAutoCompleteOptions.filter( v => (v.name.toLowerCase() + v.symbol.toLowerCase()).includes(inputValue.toLowerCase())))
    },[inputValue])

    const getSolBalance = async () => {
        const sol = await ggoconnection.getBalance(publicKey);
        //console.log("Balance: "+JSON.stringify(sol))
        const adjustedAmountToSend = (sol / Math.pow(10, 9));
        setPortfolioSwapTokenAvailableBalance(adjustedAmountToSend);
    }

    useEffect(()=>{
        if(!selectedValue){
            return;
        }

        setSwapFrom(selectedValue.address);
        //console.log("swapfrom: "+selectedValue.address);
        if (selectedValue.address === 'So11111111111111111111111111111111111111112'){
            getSolBalance();
        } else{
            getPortfolioTokenBalance(selectedValue.address);
        }
        // @ts-ignore
        setTokenBalanceInput(0);
        setTokensToSwap(0);
    }, [selectedValue, swapfrom])

    useEffect(()=>{
        if(swapfrom && tokenMap && tokenMap.size > 0){
            setSelectedValue(tokenMap.get(swapfrom))
        }
    },[swapfrom, tokenMap])

    return (<div>
        {tokenMap &&
            <Button
                variant="outlined"
                color='inherit'
                title={`Swap ${tokenMap?.get(swapfrom)?.symbol} > ${tokenMap?.get(swapto)?.symbol}`}
                onClick={handleClickOpen}
                size="small"
                sx={{borderRadius:'17px'}}
            >
                {tokenMap?.get(swapfrom)?.symbol} <SwapHorizIcon sx={{mr:1,ml:1}} /> {tokenMap?.get(swapto)?.symbol}
            </Button>
        }
        <BootstrapDialog
            onClose={handleClose}
            aria-labelledby="customized-dialog-title"
            open={open}
            PaperProps={{
                style: {
                    boxShadow: '3',
                    borderRadius: '17px',
                },
            }}
        >
            <form onSubmit={HandleSendSubmit}>
                <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
                    Swap
                </BootstrapDialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Grid container>
                            <Grid item xs={6} justifyContent='center'>
                                <FormControl>
                                    <Autocomplete
                                        sx={{width:230}}
                                        value={selectedValue}
                                        onChange={(event, newValue) =>
                                        {
                                            setSelectedValue(newValue);
                                        }}
                                        filterOptions={(x, state) => x}
                                        fullWidth
                                        inputValue={inputValue}
                                        onInputChange={(e, newValue) => {
                                            setAutoCompleteOptions([]);
                                            setInputValue(newValue);
                                            }}
                                        selectOnFocus
                                        clearOnBlur
                                        handleHomeEndKeys
                                        id="from-select-dropdown"
                                        getOptionLabel={(option) => option.symbol}
                                        renderInput={(params) => <TextField {...params} label="From"/>}
                                        renderOption={(params, option) => <li {...params}><img width={40} onError={handleImageError} src={option.logoURI} style={{float:"left"}}/>
                                            <Stack spacing={0.1}>
                                                <div>{option.symbol}</div>
                                                <Typography variant="body2" sx={{color:"#aaaaaa"}}>{option.name}</Typography>
                                            </Stack></li>}
                                        options={autoCompleteOptions}/>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <RegexTextField
                                    regex={/[^0-9]+\.?[^0-9]/gi}
                                    autoFocus
                                    autoComplete='off'
                                    margin="dense"
                                    id="swap-token-amount"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={userTokenBalanceInput || 0}
                                    onChange={(e: any) => {
                                        let val = e.target.value.replace(/^0+/, '');
                                        if (val === '.'){
                                            setTokenBalanceInput(val)
                                        } else{
                                            setTokensToSwap(val)
                                            setTokenBalanceInput(val)
                                        }
                                    }
                                    }
                                    inputProps={{
                                        style: {
                                            textAlign:'right',
                                            marginTop:0
                                        }
                                    }}
                                    sx={{mt:0}}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container>
                            <Grid item xs={2}>

                            </Grid>
                            <Grid item xs={10}
                                  sx={{textAlign:'right'}}
                            >
                                <Typography
                                    variant="caption"
                                >
                                    Balance: {tokenSwapAvailableBalance} {tokenMap?.get(swapfrom)?.symbol}
                                    <ButtonGroup variant="text" size="small" aria-label="outlined primary button group" sx={{ml:1}}>
                                        <Button
                                            onClick={() => {
                                                setTokensToSwap(tokenSwapAvailableBalance);
                                                setTokenBalanceInput(tokenSwapAvailableBalance);
                                            }}
                                        >
                                            Max
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setTokensToSwap(+tokenSwapAvailableBalance/2);
                                                setTokenBalanceInput(+tokenSwapAvailableBalance/2);
                                            }}
                                        >
                                            Half
                                        </Button>
                                    </ButtonGroup>
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Grid container>
                            <Grid item xs={6}>
                                <FormControl>
                                    <InputLabel id="to-label">To</InputLabel>
                                    
                                    {/*
                                    <Autocomplete
                                        sx={{width:230}}
                                        value={selectedValue}
                                        onChange={(event, newValue) =>
                                        {
                                            setSelectedValue(newValue);
                                        }}
                                        filterOptions={(x, state) => x}
                                        fullWidth
                                        inputValue={inputValue}
                                        onInputChange={(e, newValue) => {
                                            setAutoCompleteOptions([]);
                                            setInputValue(newValue);
                                            }}
                                        selectOnFocus
                                        clearOnBlur
                                        handleHomeEndKeys
                                        id="to-select-dropdown"
                                        getOptionLabel={(option) => option.symbol}
                                        renderInput={(params) => <TextField {...params} label="From"/>}
                                        renderOption={(params, option) => <li {...params}><img width={40} onError={handleImageError} src={option.logoURI} style={{float:"left"}}/>
                                            <Stack spacing={0.1}>
                                                <div>{option.symbol}</div>
                                                <Typography variant="body2" sx={{color:"#aaaaaa"}}>{option.name}</Typography>
                                            </Stack></li>}
                                        options={autoCompleteOptions}/>
                                    */}
                                    <Select
                                        labelId="to-label"
                                        id="to-select-dropdown"
                                        fullWidth
                                        value={swapto}
                                        label="To"
                                        disabled
                                        defaultValue="Disabled"
                                    >
                                        <MenuItem value={tokenMap?.get(swapto)?.address}>{tokenMap?.get(swapto)?.symbol}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    id="swap-result"
                                    fullWidth
                                    autoComplete="off"
                                    value={convertedAmountValue}
                                    type="number"
                                    variant="outlined"
                                    disabled
                                    defaultValue="Disabled"
                                    InputProps={{
                                        inputProps: {
                                            style: {
                                                textAlign:'right'
                                            }
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                {!loading && routes?.length > 0?
                    <Grid sx={{mt:2}}>
                        <Typography variant="caption" sx={{color:"#aaaaaa"}}>
                            {tradeRoute &&
                                <Grid container spacing={1}>
                                    <Grid item xs={6}
                                        sx={{
                                            textAlign:'right'
                                        }}
                                    >
                                        Best Route <Tooltip title={`Best route chosen by Jup.ag`}><HelpOutlineIcon sx={{ fontSize:14  }}/></Tooltip>
                                    </Grid>
                                    <Grid item xs={6}
                                        sx={{
                                            textAlign:'right'
                                        }}
                                    >
                                        {tradeRoute}
                                    </Grid>
                                </Grid>
                            }
                            {priceImpacts &&
                                <Grid container spacing={1}>
                                    <Grid item xs={6}
                                        sx={{
                                            textAlign:'right'
                                        }}
                                    >
                                        Price Impact <Tooltip title={`Swaping shifts the ratio of tokens in the pool, which will cause a change in the price per token`}><HelpOutlineIcon sx={{ fontSize:14  }}/></Tooltip>
                                    </Grid>
                                    <Grid item xs={6}
                                        sx={{
                                            textAlign:'right'
                                        }}
                                    >
                                        {priceImpacts.map(pi => <>{pi}<br/></>)}
                                    </Grid>
                                </Grid>
                            }
                            {minimumReceived &&
                                <Grid container spacing={1}>
                                    <Grid item xs={6}
                                        sx={{
                                            textAlign:'right'
                                        }}
                                    >
                                        Minimum Received <Tooltip title={`1% slippage tolerance`}><HelpOutlineIcon sx={{ fontSize:14  }}/></Tooltip>
                                    </Grid>
                                    <Grid item xs={6}
                                        sx={{
                                            textAlign:'right'
                                        }}
                                    >
                                        {minimumReceived}
                                    </Grid>
                                </Grid>
                            }

                            {rate &&
                                <Grid container spacing={1}>
                                    <Grid item xs={6}
                                        sx={{
                                            textAlign:'right'
                                        }}
                                    >
                                        Rate
                                    </Grid>
                                    <Grid item xs={6}
                                        sx={{
                                            textAlign:'right'
                                        }}
                                    >
                                        {rate}
                                    </Grid>
                                </Grid>
                            }
                            {lpfees &&
                                <Grid container spacing={1}>
                                    <>
                                        <Grid item xs={6}
                                            sx={{
                                                textAlign:'right'
                                            }}
                                        >
                                            SWAP Fees <Tooltip title={`LP Fees for each exchange used in the route.`}><HelpOutlineIcon sx={{ fontSize:14  }}/></Tooltip>
                                        </Grid>
                                        <Grid item xs={6}
                                            sx={{
                                                textAlign:'right'
                                            }}
                                        >
                                            {lpfees.map(lp => <>{lp}<br/></>)}
                                        </Grid>
                                    </>
                                </Grid>
                            }
                        </Typography>
                    </Grid>
                    :
                    <Grid sx={{mt:2}}>
                        <Typography variant="caption" sx={{color:"#aaaaaa"}}>
                            <Grid container spacing={1}>
                                <Grid item xs={12}
                                    sx={{
                                        textAlign:'center'
                                    }}>
                                    not ready to swap...
                                </Grid>
                            </Grid>
                        </Typography>
                    </Grid>
                }
            </DialogContent>
            <DialogActions>
                <Button
                    fullWidth
                    color='inherit'
                    type="submit"
                    variant="outlined"
                    title="Swap"
                    sx={{
                        margin:1,
                        borderRadius: '17px',
                        color:'white'
                    }}>
                    Swap
                </Button>
            </DialogActions>
        </form>
        </BootstrapDialog>
    </div>)
}
