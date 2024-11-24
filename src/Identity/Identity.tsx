//import { Client, Token } from '@solflare-wallet/utl-sdk';
import React, { useEffect, Suspense } from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import moment from 'moment';
import { Global } from '@emotion/react';
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils';
// @ts-ignore
import { PublicKey, Connection, Commitment } from '@solana/web3.js';
import {ENV, TokenInfo, TokenListProvider} from '@solana/spl-token-registry';
import axios from "axios";
import { WalletDialogProvider, WalletMultiButton } from '@solana/wallet-adapter-material-ui';

import { RestClient, NftMintsByOwnerRequest, NftMintPriceByCreatorAvgRequest, CollectionFloorpriceRequest } from '@hellomoon/api';

import { programs, tryGetAccount, withSend, findAta } from '@cardinal/token-manager';
//import { tryGetAccount } from '@cardinal/common';

import GovernanceDetailsView from './plugins/GovernanceDetails';
import { IntegratedSwapView } from './plugins/IntegratedSwap';
import { SquadsView } from './plugins/squads';
import { GovernanceView } from './plugins/Governance';
import { LendingView } from './plugins/Lending';
import { DelegationView } from './plugins/Delegation';
import { TransactionsView } from './plugins/Transactions';
import { StakingView } from './plugins/Staking';
import { StorageView } from './plugins/Storage';
import { StreamingPaymentsView } from './plugins/StreamingPayments';
import SendToken from '../StoreFront/Send';
//import JupiterSwap from '../StoreFront/Swap';
import BulkSend from './BulkSend';
import BulkBurnClose from './BulkBurnClose';
import TransferDomainView from './plugins/TransferDomain';
import BuyDomainView from './plugins/BuyDomain';
import ExplorerView from '../utils/grapeTools/Explorer';

import { findDisplayName } from '../utils/name-service';
import { getProfilePicture } from '@solflare-wallet/pfp';
import { TokenAmount } from '../utils/grapeTools/safe-math';
import { useWallet } from '@solana/wallet-adapter-react';

import {  
    getTokenPrice,
    getTokenTicker,
    getCoinGeckoPrice } from '../utils/grapeTools/helpers';

import {
    Button,
    ButtonGroup,
    Typography,
    Grid,
    Box,
    Container,
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemButton,
    Tooltip,
    Tab,
    Hidden,
    Badge,
    LinearProgress,
    FormGroup,
    FormControlLabel,
    Switch,
} from '@mui/material';

import {
    TabContext,
    TabList,
    TabPanel,
} from '@mui/lab';

import ReduceCapacityIcon from '@mui/icons-material/ReduceCapacity';
import PercentIcon from '@mui/icons-material/Percent';
import HandshakeIcon from '@mui/icons-material/Handshake';
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import OpacityIcon from '@mui/icons-material/Opacity';
import LanguageIcon from '@mui/icons-material/Language';
import StorageIcon from '@mui/icons-material/Storage';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PortraitIcon from '@mui/icons-material/Portrait';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PublicIcon from '@mui/icons-material/Public';
import QrCode2Icon from '@mui/icons-material/QrCode2';

import SolIcon from '../components/static/SolIcon';
import SolCurrencyIcon from '../components/static/SolCurrencyIcon';

import { formatAmount, getFormattedNumberToLocale } from '../utils/grapeTools/helpers'

import { ValidateAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../utils/grapeTools/WalletAddress'; // global key handling
import { 
    RPC_CONNECTION,
    RPC_ENDPOINT, 
    GRAPE_PROFILE, 
    GRAPE_PREVIEW, 
    DRIVE_PROXY,
    HELIUS_API,
    HELLO_MOON_BEARER,
    SQUADS_API,
    SHYFT_KEY,
} from '../utils/grapeTools/constants';
import { ConstructionOutlined, DoNotDisturb, JavascriptRounded, LogoDevOutlined } from "@mui/icons-material";

import { useTranslation } from 'react-i18next';
import { getByPlaceholderText } from "@testing-library/react";
import { parseMintAccount } from "@project-serum/common";
import { any } from "prop-types";

import {
    METAPLEX_PROGRAM_ID,
  } from '../utils/auctionHouse/helpers/constants';

function formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const isCardinalWrappedToken = async (
    connection: Connection,
    tokenAddress: string
  ) => {
    const [tokenManagerId] = await programs.tokenManager.pda.findTokenManagerAddress(
      new PublicKey(tokenAddress)
    );
    const tokenManagerData = await tryGetAccount(() =>
      programs.tokenManager.accounts.getTokenManager(connection, tokenManagerId)
    );
    if (tokenManagerData?.parsed && tokenManagerData?.parsed.transferAuthority) {
      try {
        programs.transferAuthority.accounts.getTransferAuthority(
          connection,
          tokenManagerData?.parsed.transferAuthority
        );
        return true;
      } catch (error) {
        console.log("Invalid transfer authority");
      }
    }
    return false;
};

function calculateStorageUsed(available: any, allocated: any){
    if (available && +available > 0){
        const percentage = 100-(+available/allocated.toNumber()*100);
        const storage_string = percentage.toFixed(2) + "% of " + formatBytes(allocated);
        return storage_string;
    } else{
        const storage_string = "0% of " + formatBytes(allocated);
        return storage_string;
    }   
}

enum NavPanel {
    Holdings,
    Transactions,
    Closable,
    Swap,
    Staking,
    Governance,
    Lending,
    Domains,
    Storage,
    Streaming,
    Squads,
}

export function IdentityView(props: any){
    const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [solanaDomainRows, setSolanaDomainRows] = React.useState(null);
    const [gqlMints, setGQLMints] = React.useState(null);
    const [gqlRealms, setGQLRealms] = React.useState(null);
    const [solanaHoldings, setSolanaHoldings] = React.useState(null);
    const [solanaHoldingRows, setSolanaHoldingRows] = React.useState(null);
    const [solanaClosableHoldings, setSolanaClosableHoldings] = React.useState(null);
    const [solanaClosableHoldingsRows, setSolanaClosableHoldingsRows] = React.useState(null);
    const [solanaBalance, setSolanaBalance] = React.useState(null);
    const [solanaBasicTicker, setSolanaBasicTicker] = React.useState(null);
    const [solanaTicker, setSolanaTicker] = React.useState(null);
    const [solanaUSDC, setSolanaUSDC] = React.useState(null);
    const [loadingWallet, setLoadingWallet] = React.useState(false);
    const [loadingTokens, setLoadingTokens] = React.useState(false);
    
    const [loadingStorage, setLoadingStorage] = React.useState(false);
    const [loadingStreamingPayments, setLoadingStreamingPayments] = React.useState(false);
    const [loadingPosition, setLoadingPosition] = React.useState('');
    
    const [loadNfts, setLoadNfts] = React.useState(false);
    const [loadNftFloor, setLoadNftFloor] = React.useState(false);

    const { publicKey } = useWallet();
    const [pubkey, setPubkey] = React.useState(props.pubkey || null);
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlParams = searchParams.get("pkey") || searchParams.get("address") || handlekey;
    
    const [tokenMap, setTokenMap] = React.useState<Map<string,TokenInfo>>(undefined);
    const [nftMap, setNftMap] = React.useState(null);
    const [selectionModel, setSelectionModel] = React.useState([]);
    const [selectionModelClose, setSelectionModelClose] = React.useState([]);
    const [tokensNetValue, setTokensNetValue] = React.useState(null);
    const [nftFloorValue, setNftFloorValue] = React.useState(null);
    
    const { hash } = useLocation();
    const [value, setValue] = React.useState(
        hash === '#holdings' ? NavPanel.Holdings.toString() : 
        hash === '#transactions' ? NavPanel.Transactions.toString() : 
        hash === '#closable' ? NavPanel.Closable.toString() : 
        hash === '#swap' ? NavPanel.Swap.toString() : 
        hash === '#staking' ? NavPanel.Staking.toString() : 
        hash === '#governance' ? NavPanel.Governance.toString() : 
        hash === '#lending' ? NavPanel.Lending.toString() : 
        hash === '#domains' ? NavPanel.Domains.toString() : 
        hash === '#storage' ? NavPanel.Storage.toString() : 
        hash === '#streaming' ? NavPanel.Streaming.toString() : 
        hash === '#squads' ? NavPanel.Squads.toString() : 
        NavPanel.Holdings.toString());
    //const [activeTab, setActiveTab] = React.useState(hash === '#lending' ? NavPanel.Lending : NavPanel.Holdings);

    const connection = RPC_CONNECTION;
    const { t, i18n } = useTranslation();

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70, hide: true },
        { field: 'mint', headerName: 'Mint', width: 70, align: 'center', hide: true },
        { field: 'logo', headerName: '', width: 50, 
            renderCell: (params) => {
                //console.log(params);
                //const logo = params.value.logo || tokenMap.get(params.value.mint)?.logoURI || params.value.mint;
                /*
                if (logo === params.value.mint){
                    let urimeta = window.fetch(params.value.metadata).then((res: any) => res.json());
                    if (urimeta && urimeta?.image)
                        logo = DRIVE_PROXY+urimeta?.image;
                }*/

                return (
                    <>
                        <Avatar
                            sx={{backgroundColor:'#222'}}
                                src={params.value.logo || tokenMap.get(params.value.mint)?.logoURI || params.value.mint}
                                alt={
                                    tokenMap.get(params.value.mint)?.name || 
                                    params.value.mint}
                        >
                            <QrCode2Icon sx={{color:'white'}} />
                        </Avatar> 
                    </>
                );
            }
        },
        { field: 'name', headerName: 'Token', minWidth: 200, flex: 1
            /*
            renderCell: (params) => {
                return (
                    <ExplorerView useLogo={params.value.logo} showAddress={true} address={params.value.address.mint} type='address' shorten={8} title={params.value.name} hideTitle={false} style='text' color='white' fontSize='14px' />                                  
                );
            }*/
        },
        { field: 'delegate', headerName: 'Delegate To', width: 130, align: 'center', hide: true, 
            renderCell: (params) => {
                return (
                    <>{params.value ?
                        <ExplorerView address={params.value} type='address' shorten={4} hideTitle={false} style='text' color='white' fontSize='14px' />
                        :
                        <></>}
                    </>
                )
            }                                                    
        },
        { field: 'delegateAmount', headerName: 'Delegated', width: 70, align: 'center', hide: true,
            renderCell: (params) => {
                return (
                    <>{(params.value && params.value?.amount > 0) ? 
                        <>{params.value.amount / (10 ** params.value.decimals)}</>
                        :<></>
                        }</>
                )
            }     
        },
        { field: 'balance', headerName: 'Balance', width: 130, align: 'right',
            renderCell: (params) => {
                return (getFormattedNumberToLocale(+params.value))
            }
        },
        { field: 'price', headerName: 'Price', width: 130, align: 'right'},
        { field: 'change', headerName: '24h Change', width: 130, align: 'right',
            renderCell: (params) => {
                return (
                    <>{+params.value > 0 ?
                        <Typography variant='caption' color='green'>{params.value.toFixed(4)}% <ArrowUpwardIcon sx={{ml:1,fontSize:'10px'}} /></Typography>
                        :
                        <>
                            {+params.value < 0 ?
                                <Typography variant='caption' color='error'>{params.value.toFixed(4)}% <ArrowDownwardIcon sx={{ml:1,fontSize:'10px'}} /></Typography>
                            :
                                <Typography variant='caption' color='green'>{params.value?.toFixed(4)}% <HorizontalRuleIcon sx={{ml:1,fontSize:'10px'}} /></Typography>
                            }
                        </>
                    }</>
                )
            }
        },
        { field: 'value', headerName: 'Value', width: 130, align: 'right',
            renderCell: (params) => {
                return (getFormattedNumberToLocale(+params.value))
            }
        },
        { field: 'send', headerName: '', width: 140,  align: 'center',
            renderCell: (params) => {
                return (
                    <>
                        {publicKey && pubkey === publicKey.toBase58() &&
                            <>
                            <SendToken 
                                mint={params.value.info.mint} 
                                name={params.value.name} 
                                logoURI={
                                    params.value.logo ||
                                    tokenMap.get(params.value.mint)?.logoURI || 
                                    params.value.mint
                                } 
                                balance={(new TokenAmount(params.value.info.tokenAmount.amount, params.value.info.tokenAmount.decimals).format())} 
                                conversionrate={0} 
                                showTokenName={false} 
                                sendType={0} 
                                fetchSolanaTokens={fetchSolanaTokens}
                                delegate={params.value.delegate}
                                delegateAmount={params.value.delegateAmount}
                                />
                            </>          
                        }
                   </>
                )
            }
        },/*
        { field: 'swap', headerName: '', width: 130,
            renderCell: (params) => {
                return (
                    <>
                        {publicKey && pubkey === publicKey.toBase58() &&
                            <>
                            <JupiterSwap swapfrom={'So11111111111111111111111111111111111111112'} swapto={params.value.mint} portfolioPositions={solanaHoldings} tokenMap={tokenMap}/>
                            </>          
                        }
                   </>
                )
            }
        }*/
      ];

      const closablecolumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70, hide: true },
        { field: 'mint', headerName: 'Mint', width: 70, align: 'center', hide: true },
        { field: 'logo', headerName: '', width: 50, 
            renderCell: (params) => {
                //const logo = params.value.logo || tokenMap.get(params.value.mint)?.logoURI || params.value.mint;
                //console.log(params);
                return (
                    <>
                        <Avatar
                            sx={{backgroundColor:'#222'}}
                                src={params.value.logo || tokenMap.get(params.value.mint)?.logoURI || params.value.mint}
                                alt={
                                    tokenMap.get(params.value.mint)?.name || 
                                    params.value.mint}
                        >
                            <QrCode2Icon sx={{color:'white'}} />
                        </Avatar>
                </>);
            }
        },
        { field: 'name', headerName: 'Token', minWidth: 200, flex: 1 
            /*
            renderCell: (params) => {
                return (
                    <ExplorerView useLogo={params.value.logo} showAddress={true} address={params.value.address.mint} type='address' shorten={8} title={params.value.name} hideTitle={false} style='text' color='white' fontSize='14px' />                                  
                );
            }*/
        },
        { field: 'balance', headerName: 'Balance', width: 130, align: 'right',
            renderCell: (params) => {
                return (params.value)
            }
        },
        { field: 'oncurve', headerName: 'onCurve', width: 130, align: 'right'},
        { field: 'nft', headerName: 'NFT', width: 130, align: 'center'},
        { field: 'preview', headerName: '', width: 150,  align: 'center',
            renderCell: (params) => {
                return (
                    <>
                        <ExplorerView address={params.value} type='address' title={'Explore'}/>
                    </>
                )
            }
        },
      ];

      const domaincolumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70, hide: true },
        { field: 'domain', headerName: 'Registration', minWidth: 250, flex: 1, },
        { field: 'type', headerName: 'Type', width: 150, align: 'center',
            renderCell: (params) => {
                return (
                    <>
                        {params.value.indexOf(".sol") > -1 ?
                            <>Domain</>
                        :
                            <>Twitter Handle</>
                        }
                    </>
                )
            }
        },
        { field: 'manage', headerName: '', width: 210, align: 'center',
            renderCell: (params) => {
                return (
                    <>
                        {publicKey && publicKey.toBase58() === pubkey &&
                        <>
                            {/*
                                <Tooltip title='Wrap Domain'>
                                    <Button
                                        variant='outlined'
                                        size='small'
                                        sx={{borderRadius:'17px',mr:1}}
                                    >
                                        <InventoryIcon />
                                    </Button>
                                </Tooltip>
                            */}
                            {params.value.indexOf(".sol") > -1 &&
                                <TransferDomainView snsDomain={params.value} fetchSolanaDomain={fetchSolanaDomain} />
                            }
                            <Tooltip title='Manage SNS Record'>
                                <Button
                                    variant='outlined'
                                    size='small'
                                    component='a'
                                    href={params.value.indexOf(".sol") > -1 ? `https://www.sns.id/domain?domain=${params.value.slice(0,params.value.indexOf(".sol"))}`: `https://naming.bonfida.org/twitter`}
                                    target='_blank'
                                    sx={{borderRadius:'17px',ml:1}}
                                >
                                    <SettingsIcon />
                                </Button>
                            </Tooltip>
                        </>
                        }
                    </>
                )
            }
        },
      ];
      
    const setLoadNftToggle = () => {
        setLoadNfts(!loadNfts);
    }

    const setLoadNftFloorToggle = () => {
        setLoadNftFloor(!loadNftFloor);
    }
      
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const fetchSolanaBalance = async () => {
        setLoadingPosition('SOL Balance');
        try{
            const response = await connection.getBalance(new PublicKey(pubkey));
            const converted = await getTokenPrice('So11111111111111111111111111111111111111112','EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // SOL > USDC
            /*
            const ticker = await getTokenTicker('So11111111111111111111111111111111111111112','EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // SOL > USDC
            //console.log("ticker: "+JSON.stringify(ticker))
            setSolanaTicker(ticker);
            //console.log("price converted: "+JSON.stringify(converted))
            //console.log("price ticker: "+JSON.stringify(ticker))
            if (converted?.data?.price)
                setSolanaUSDC(converted.data.price);
            else if (ticker?.last_price)
                setSolanaUSDC(+ticker.last_price);
            */
            setSolanaUSDC(converted.data["So11111111111111111111111111111111111111112"].price);
            setSolanaBasicTicker(converted);
            setSolanaBalance(response);
        }catch(e){
            console.log("ERR: "+e);
        }
    }

    function clearSelectionModels(){
        try{
            setSelectionModel([]);
            setSelectionModelClose([]);
        }catch(e){console.log("ERR: "+e)}
    }

    const fetchSolanaTokens = async (loadNftMeta: boolean) => {
        setLoadingPosition('Tokens');
        try{
            const resp = await connection.getParsedTokenAccountsByOwner(new PublicKey(pubkey), {programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")});
            const resultValues = resp.value
            
            const holdings: any[] = [];
            const allholdings: any[] = [];
            const closable: any[] = [];
            for (const item of resultValues){
                //let buf = Buffer.from(item.account, 'base64');
                //console.log("item: "+JSON.stringify(item));
                if (item.account.data.parsed.info.tokenAmount.amount > 0)
                    holdings.push(item);
                else
                    closable.push(item);
                // consider using https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json to view more details on the tokens held
            }

            const sortedholdings = JSON.parse(JSON.stringify(holdings));
            sortedholdings.sort((a:any,b:any) => (b.account.data.parsed.info.tokenAmount.amount - a.account.data.parsed.info.tokenAmount.amount));
            
            const solholdingrows: any[] = [];
            let cnt = 0;

            let cgArray = '';//new Array()
            for (const item of resultValues){
                //console.log("item: "+JSON.stringify(item))
                /*
                const accountInfo = await connection.getParsedAccountInfo(new PublicKey(item.account.data.parsed.info.mint));
                if (accountInfo) {
                    console.log(item.account.data.parsed.info.mint + ": "+JSON.stringify(accountInfo));
                    //const buffer = Buffer.from(accountInfo.data);
                    // Parse the buffer to extract the token metadata (you may need to adjust this based on the token standard)
                    //const metadata = JSON.parse(buffer.toString());
                    //console.log(item.account.data.parsed.info.mint + ": "+JSON.stringify(metadata));
                    //setMetadata(metadata);
                  }
                */

                const tm = tokenMap.get(item.account.data.parsed.info.mint)
                if (tm && tm?.extensions?.coingeckoId){
                    if (cgArray.length > 0)
                        cgArray += ',';
                    cgArray+=tm.extensions.coingeckoId
                    item.coingeckoId = tm.extensions.coingeckoId;
                    //cgArray.push(tm.extensions.coingeckoId)
                }
            }    

            setLoadingPosition('Prices');
            const cgPrice = await getCoinGeckoPrice(cgArray);

            setLoadingPosition('NFT & Token Metadata');
            let nftMeta =null;
            //if (loadNfts){
                nftMeta = await fetchNFTMetadata(resultValues, loadNftMeta || loadNfts, loadNftFloor);
            //}

            //console.log("nftMeta: "+JSON.stringify(nftMeta))

            let netValue = 0;

            let tokenMeta = null;
            let dasMeta = null;
            if (SHYFT_KEY) {

                try{
                    const uri = `https://api.shyft.to/sol/v1/wallet/all_tokens?network=mainnet-beta&wallet=${pubkey}`;
                
                    const response = await axios.get(uri, {
                        headers: {
                            'x-api-key': SHYFT_KEY
                        }
                        })
                        .then(response => {
                            if (response?.data?.result){
                                return response.data.result;
                            }
                            return null
                        })
                        .catch(error => {   
                                // revert to RPC
                                console.error(error);
                                return null;
                        });
                    
                    //const { results } = await response;
                    tokenMeta = response;
                    console.log("tokenMeta: "+JSON.stringify(tokenMeta));
                } catch(err){
                    console.log("AT API: Err")
                }
                
                //if (!tokenMeta){
                    try{
                        const uri = `https://rpc.shyft.to/?api_key=${SHYFT_KEY}`;
            
                        const response = await fetch(uri, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                id: 'rpc-id',
                                method: 'getAssetsByOwner',
                                params: {
                                    ownerAddress: pubkey,
                                    page: 1, // Starts at 1
                                    limit: 1000
                                },
                            }),
                        });
                        const { result } = await response.json();
                        dasMeta = result.items;
                        /*
                        console.log("Assets owned by a wallet: ", result.items);
                        */
                    } catch(err){
                        console.log("DAS API: Err")
                    }
                //}
            } else if (HELIUS_API){
                
                try{
                    const uri = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API}`;
                    const response = await fetch(uri, {
                        method: 'POST',
                        headers: {
                        "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                        "jsonrpc": "2.0",
                        "id": "text",
                        "method": "getAssetsByOwner",
                        "params": {
                            ownerAddress: pubkey,
                        }
                        }),
                    });
                    const { result } = await response.json();
                    return result?.items;
                } catch(err){
                    console.log("DAS: Err");
                    return null;
                }
                
            }

            for (const item of resultValues){
                /*
                try{
                    const tknPrice = await getTokenPrice(item.account.data.parsed.info.mint, "USDC");
                    item.account.data.parsed.info.tokenPrice = tknPrice.data.price
                }catch(e){}
                */
                
                const itemValue = cgPrice ? 
                    item?.coingeckoId ? +cgPrice[item?.coingeckoId]?.usd ? (cgPrice[item?.coingeckoId].usd * +item.account.data.parsed.info.tokenAmount.amount/Math.pow(10, +item.account.data.parsed.info.tokenAmount.decimals)).toFixed(item.account.data.parsed.info.tokenAmount.decimals) : 0 :0
                    : null;
                
                const itemBalance = Number(new TokenAmount(item.account.data.parsed.info.tokenAmount.amount, item.account.data.parsed.info.tokenAmount.decimals).format().replace(/[^0-9.-]+/g,""));
                let logo = null;
                let name = item.account.data.parsed.info.mint;
                let metadata = null;
                let metadata_decoded = null;

                let foundMetaName = false;
                let nftValue = 0;

                if (tokenMeta){
                    for (const token_item of tokenMeta){
                        console.log("checking: "+JSON.stringify(token_item))
                        if ((token_item.address === item.account.data.parsed.info.mint)){//||
                            //(token_tem.address === item.)){
                            if (token_item?.info?.name)
                                name = token_item.info.name;
                            
                            //if (das_item?.content?.metadata)
                            //    metadata = das_item.content.metadata;

                            if (token_item?.info?.image)
                                logo = token_item.info.image;
                        }
                    }
                    // add any assets that are not in the wallet i.e. compressed NFTs?
                    //console.log(name+" - "+logo)
                }

                if (dasMeta){

                    for (const das_item of dasMeta){
                        if (das_item.id === item.account.data.parsed.info.mint){
                            if (das_item?.content?.metadata?.name)
                                name = das_item.content.metadata.name;
                            
                            if (das_item?.content?.metadata)
                                metadata = das_item.content.metadata;

                            if (das_item?.content?.links?.image)
                                logo = das_item.content.links.image;
                        }
                    }
                    // add any assets that are not in the wallet i.e. compressed NFTs?
                    //console.log(name+" - "+logo)
                }

                if (nftMeta){
                    for (const nft of nftMeta){
                        if (nft?.meta && nft.meta.mint === item.account.data.parsed.info.mint){

                            if (!name && !logo){

                                //console.log("nft: "+JSON.stringify(nft))

                                if (nft?.data)
                                    metadata_decoded = decodeMetadata(nft.data);
                                //console.log("meta_final: "+JSON.stringify(metadata_decoded))
                                
                                name = nft.meta.data.name;
                                metadata = nft.meta.data.uri;
                                // fetch
                                if (nft?.image){
                                    logo = nft.image;
                                }else if (nft?.urimeta?.image){
                                    logo = nft.urimeta?.image;
                                }/*else if (nft?.meta){
                                    let urimeta = await window.fetch(metadata).then((res: any) => res.json());
                                    logo = DRIVE_PROXY+urimeta.image;
                                }*/

                                nftValue = nft?.floorPrice ? nft.floorPrice : 0;

                                foundMetaName = true;
                            }
                        }
                    }
                }
                
                if (!foundMetaName){
                    if (tokenMap.get(item.account.data.parsed.info.mint)){
                        name = tokenMap.get(item.account.data.parsed.info.mint)?.name;
                        logo = tokenMap.get(item.account.data.parsed.info.mint)?.logoURI;
                        if (name)
                            foundMetaName = true;
                    }
                }

                if (!foundMetaName){
                    if (loadNftMeta){

                        const mint_address = new PublicKey(item.account.data.parsed.info.mint)
                        const [pda, bump] = await PublicKey.findProgramAddress([
                            Buffer.from("metadata"),
                            METAPLEX_PROGRAM_ID.toBuffer(),
                            new PublicKey(mint_address).toBuffer(),
                        ], METAPLEX_PROGRAM_ID)
                        const meta_response = await connection.getAccountInfo(pda);
                        //console.log("meta_response: "+JSON.stringify(meta_response));

                        if (meta_response){
                            const meta_final = decodeMetadata(meta_response.data);
                            
                            //console.log("final: "+JSON.stringify(meta_final))

                            const file_metadata = meta_final.data.uri;

                            if (file_metadata && file_metadata.length > 0){
                                const file_metadata_url = new URL(file_metadata);

                                const IPFS = 'https://ipfs.io';
                                const IPFS_2 = "https://nftstorage.link/ipfs";
                                /*
                                if (file_metadata.startsWith(IPFS) || file_metadata.startsWith(IPFS_2)){
                                    file_metadata = CLOUDFLARE_IPFS_CDN+file_metadata_url.pathname;
                                }*/
                                
                                //setCollectionRaw({meta_final,meta_response});
                                try{
                                    const metadata = await window.fetch(file_metadata)
                                    .then(
                                        (res: any) => res.json())
                                    .catch((error) => {
                                        // Handle any errors that occur during the fetch or parsing JSON
                                        console.error("Error fetching data:", error);
                                        });
                                    
                                    if (metadata && metadata?.image){
                                        logo = metadata.image;
                                        name = meta_final.data.name;
                                        //const img_metadata_url = new URL(img_metadata);
                                        foundMetaName = true;
                                    }
                                }catch(err){
                                    console.log("ERR: ",err);
                                }
                            }
                        }
                    }
                }

                if ((name && name?.length <= 0) || (!name))
                    name = item.account.data.parsed.info.mint;
                
                solholdingrows.push({
                    id:cnt,
                    mint:item.account.data.parsed.info.mint,
                    logo: {
                        mint: item.account.data.parsed.info.mint,
                        logo: logo,
                        metadata: metadata
                    },
                    name:name,
                    /*
                    name:{
                        name:name,
                        logo:logo,
                        address:item.account.data.parsed.info
                    },*/
                    balance:itemBalance,
                    delegate:item.account.data.parsed.info?.delegate ? new PublicKey(item.account.data.parsed.info?.delegate).toBase58() : ``,
                    delegateAmount:item.account.data.parsed.info?.delegatedAmount,
                    //price:item.account.data.parsed.info.tokenAmount.decimals === 0 ? +(nftValue/(10 ** 9)*solanaUSDC).toFixed(2) : (cgPrice && cgPrice[item?.coingeckoId]?.usd) ? cgPrice[item?.coingeckoId]?.usd) : 0,
                    price: cgPrice && cgPrice[item?.coingeckoId] && cgPrice[item?.coingeckoId]?.usd
                        ? cgPrice[item?.coingeckoId]?.usd
                        : item.account.data.parsed.info.tokenAmount.decimals === 0
                            ? +(nftValue / (10 ** 9) * solanaUSDC).toFixed(2)
                            : 0,
                    //change:item.account.data.parsed.info.tokenAmount.decimals === 0 ? 0 : (cgPrice && cgPrice[item?.coingeckoId]?.usd_24h_change) ? cgPrice[item?.coingeckoId]?.usd_24h_change : 0,
                    change: item.account.data.parsed.info.tokenAmount.decimals === 0
                        ? 0
                        : (cgPrice && cgPrice[item?.coingeckoId]?.usd_24h_change)
                            ? cgPrice[item?.coingeckoId]?.usd_24h_change
                            : 0,
                    value: item.account.data.parsed.info.tokenAmount.decimals === 0 ?  +(nftValue/(10 ** 9)*solanaUSDC).toFixed(2) : +itemValue,
                    send:{
                        name:name,
                        logo:logo,
                        mint: item.account.data.parsed.info.mint,
                        info:item.account.data.parsed.info,
                        metadata: metadata,
                        tokenAmount:item.account.data.parsed.info.tokenAmount,
                        decimals:item.account.data.parsed.info.decimals,
                        delegate:item.account.data.parsed.info?.delegate ? new PublicKey(item.account.data.parsed.info?.delegate).toBase58() : null,
                        delegateAmount:item.account.data.parsed.info?.delegatedAmount,
                    },
                    metadata_decoded:metadata_decoded,
                    //swap:item.account.data.parsed.info
                });

                netValue += +itemValue;

                cnt++;
            }

            if (dasMeta){
                for (const dasItem of dasMeta){
                    let found = false;
                    for (const holdingItem of solholdingrows){
                        if (holdingItem.mint === dasItem.id){
                            found = true;
                        }
                    }
                    if (!found){
                        if (dasItem.id){

                            console.log("Add from DAS: "+dasItem.content.metadata.name+" - "+dasItem.id);
                            
                            /*
                            solholdingrows.push({
                                id: solholdingrows.length+1,
                                mint: dasItem.id,
                                logo: {
                                    mint: dasItem.id,
                                    logo: dasItem.content.links.image,
                                    metadata: dasItem.content.json_uri
                                },
                                name:"+++ "+dasItem.content.metadata.name,
                                balance:dasItem.supply.print_current_supply,
                                delegate:null,
                                delegateAmount:null,
                                price:null,
                                change:null,
                                value:null,
                                send:{
                                    name:dasItem.content.metadata.name,
                                    logo:dasItem.content.links.image,
                                    mint: dasItem.id,
                                    info:{
                                        mint:dasItem.id,
                                        tokenAmount:{
                                            amount:1,
                                            decimals:0,
                                        }
                                    },
                                    metadata: dasItem.content.json_uri,
                                    tokenAmount:1,
                                    decimals:0,
                                    delegate:null,
                                    delegateAmount:null,
                                },
                                metadata_decoded:dasItem.content.json_uri,
                            })
                            */
                        }
                    }
                }
            }

            setTokensNetValue(netValue);

            const closableholdingsrows = new Array();
            cnt = 0;
            for (const item of closable){
                /*
                try{
                    const tknPrice = await getTokenPrice(item.account.data.parsed.info.mint, "USDC");
                    item.account.data.parsed.info.tokenPrice = tknPrice.data.price
                }catch(e){}
                */
                
                const itemValue = 0;
                const itemBalance = 0;

                let logo = null;
                let name = item.account.data.parsed.info.mint;
                let metadata = null;
                
                let foundMetaName = false;
                if (nftMeta){
                    for (const nft of nftMeta){
                        //console.log('meta: '+JSON.stringify(nft));
                        if (nft.meta?.mint){
                            if (nft.meta.mint === item.account.data.parsed.info.mint){
                                //console.log("nft: "+JSON.stringify(nft))
                                
                                name = nft.meta.data.name;
                                metadata = nft.meta.data.uri;
                                // fetch
                                if (nft?.image){
                                    logo = nft.image;
                                }else if (nft?.urimeta?.image){
                                    logo = nft.urimeta?.image;
                                }/* else if (nft?.meta){
                                    let urimeta = await window.fetch(metadata).then((res: any) => res.json());
                                    logo = DRIVE_PROXY+urimeta.image;
                                }*/

                                if (name)
                                    foundMetaName = true;
                            }
                        }
                    }
                }
                
                if (!foundMetaName){
                    if (tokenMap.get(item.account.data.parsed.info.mint)){
                        name = tokenMap.get(item.account.data.parsed.info.mint)?.name;
                        logo = tokenMap.get(item.account.data.parsed.info.mint)?.logoURI;
                        if (name)
                            foundMetaName = true;
                    }
                }
                
                if (!foundMetaName){
                    const mint_address = new PublicKey(item.account.data.parsed.info.mint)
                    const [pda, bump] = await PublicKey.findProgramAddress([
                        Buffer.from("metadata"),
                        METAPLEX_PROGRAM_ID.toBuffer(),
                        new PublicKey(mint_address).toBuffer(),
                    ], METAPLEX_PROGRAM_ID)
                    const meta_response = await connection.getAccountInfo(pda);
                    //console.log("meta_response: "+JSON.stringify(meta_response));

                    if (meta_response){
                        const meta_final = decodeMetadata(meta_response.data);
                        
                        const file_metadata = meta_final.data.uri;
                        if (file_metadata && file_metadata.length > 0){
                            //const file_metadata_url = new URL(file_metadata);

                            const IPFS = 'https://ipfs.io';
                            const IPFS_2 = "https://nftstorage.link/ipfs";
                            /*
                            if (file_metadata.startsWith(IPFS) || file_metadata.startsWith(IPFS_2)){
                                file_metadata = CLOUDFLARE_IPFS_CDN+file_metadata_url.pathname;
                            }*/
                            
                            //setCollectionRaw({meta_final,meta_response});
                            
                            try{
                                const metadata = await window.fetch(file_metadata)
                                .then(
                                    (res: any) => res.json())
                                .catch((error) => {
                                        // Handle any errors that occur during the fetch or parsing JSON
                                        console.error("Error fetching data:", error);
                                });
                                
                                if (metadata && metadata?.image){
                                    logo = metadata.image;
                                    name = meta_final.data.name;
                                    //const img_metadata_url = new URL(img_metadata);
                                    foundMetaName = true;
                                }
                            }catch(err){
                                console.log("ERR: ",err);
                            }
                        }
                    }
                }

                if ((name && name?.length <= 0) || (!name))
                    name = item.account.data.parsed.info.mint;
                
                closableholdingsrows.push({
                    id:cnt,
                    mint:item.account.data.parsed.info.mint,
                    logo: {
                        mint: item.account.data.parsed.info.mint,
                        logo: logo,
                        metadata: metadata
                    },
                    name:name,
                    /*
                    name:{
                        name:name,
                        logo:logo,
                        address:item.account.data.parsed.info
                    },
                    */
                    balance:itemBalance,
                    oncurve: ValidateCurve(item.account.data.parsed.info.mint),
                    nft: item.account.data.parsed.info.tokenAmount.decimals === 0 ? true : false,
                    close:item.account.data.parsed.info,
                    preview:item.account.data.parsed.info.mint
                });
                cnt++;
            }

            setSolanaClosableHoldings(closable);
            setSolanaClosableHoldingsRows(closableholdingsrows);

            setSolanaHoldingRows(solholdingrows)
            setSolanaHoldings(sortedholdings);
        }catch(cerr){
            console.log("CERR: "+cerr);
        }
    } 
    
    const fetchSolanaDomain = async () => {
        setLoadingPosition('SNS Records');
        const domain = await findDisplayName(connection, pubkey);
        if (domain){
            if (domain.toString()!==pubkey){
                
                let cnt = 0;
                const domains = new Array();
                for (const item of domain){
                    domains.push({
                        id:cnt,
                        domain:item,
                        type:item,
                        manage:item,
                    });
                    cnt++;
                }
                setSolanaDomainRows(domains);
                setSolanaDomain(domain);
            }
        }
    }

    const fetchTokens = async () => {
        setLoadingPosition('Wallet');
        const tokens = await new TokenListProvider().resolve();
        const tokenList = tokens.filterByChainId(ENV.MainnetBeta).getList();
        const tokenMapValue = tokenList.reduce((map, item) => {
            map.set(item.address, item);
            return map;
        }, new Map())
        setTokenMap(tokenMapValue);
        return tokenMapValue;
    }

    const MD_PUBKEY = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    const rpclimit = 100;
    const getCollectionData = async (start: number, sholdings: any) => {
        try {
            const mintsPDAs = [];
            
            const mintarr = sholdings
                .slice(rpclimit * start, rpclimit * (start + 1))
                .map((value: any, index: number) => {
                    return value.account.data.parsed.info.mint;
                });
            

            for (const value of mintarr) {
                if (value) {
                    const mint_address = new PublicKey(value);
                    const [pda, bump] = await PublicKey.findProgramAddress(
                        [Buffer.from('metadata'), MD_PUBKEY.toBuffer(), new PublicKey(mint_address).toBuffer()],
                        MD_PUBKEY
                    );

                    if (pda) {
                        //console.log("pda: "+pda.toString());
                        mintsPDAs.push(pda);
                    }
                }
            }

            // fetch also NFTs per wallet
            
            //console.log("pushed pdas: "+JSON.stringify(mintsPDAs));
            //const final_meta = new Array();
            const metadata = await connection.getMultipleAccountsInfo(mintsPDAs);
            //console.log("returned: "+JSON.stringify(metadata));
            // LOOP ALL METADATA WE HAVE
            /*
            for (const metavalue of metadata) {
                //console.log("Metaplex val: "+JSON.stringify(metavalue));
                if (metavalue?.data) {
                    try {
                        const meta_primer = metavalue;
                        const buf = Buffer.from(metavalue.data);
                        const meta_final = decodeMetadata(buf);
                        final_meta.push(meta_final)
                    } catch (etfm) {
                        console.log('ERR: ' + etfm + ' for ' + JSON.stringify(metavalue));
                    }
                } else {
                    console.log('Something not right...');
                }
            }
            */
            return metadata;
            
        } catch (e) {
            // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    };  
    
    const fetchNFTMetadata = async (holdings:any, loadNftMeta: boolean, loadNftFloor: boolean) => {
        if (holdings){
            const walletlength = holdings.length;

            const loops = Math.ceil(walletlength / rpclimit);
            let collectionmeta: any[] = [];

            const sholdings: any[] = [];
            for (const item of holdings){
                if (item){
                    // comment to fetch social tokens which have metaplex metadata
                    //if (item.account.data.parsed.info.tokenAmount.decimals === 0)
                        sholdings.push(item)
                }
            }

            //console.log('sholdings: ' + JSON.stringify(sholdings));
            const final_collection_meta: any[] = [];            

            const client = new RestClient(HELLO_MOON_BEARER);
            let walletNfts = null;
            
            try{
                walletNfts = await client.send(new NftMintsByOwnerRequest({
                    ownerAccount: pubkey,
                    limit: 1000
                }))
            }catch(e){
                console.log("ERR: "+e);
            }

            let totalFloor = 0;
            
            // FloorpriceBatchedRequest
            const hmcid = new Array();
            if (walletNfts){
                for (let witem of walletNfts.data){
                    hmcid.push(witem.helloMoonCollectionId);
                }
            }

            let floorResults = null;
            try{
                /*
                const url = 'https://rest-api.hellomoon.io/v0/nft/collection/floorprice/batched';
                const config = {
                    headers:{
                    accept: `application/json`,
                    authorization: `Bearer ${HELLO_MOON_BEARER}`,
                    'content-type': `application/json`
                    }
                };
                const data = {
                    helloMoonCollectionId: JSON.stringify(hmcid),
                    limit: 1000
                }
                floorResults = await axios.post(url, data, config); 
                */
                /*
                floorResults = await client.send(new CollectionFloorpriceRequest({
                //floorResults = await client.send(new FloorpriceBatchedRequest({
                    helloMoonCollectionId: JSON.stringify(hmcid),
                    limit: 1000
                }))
                    .then(x => {
                        //console.log; 
                        return x;})
                    .catch(console.error);
                */
            }catch(e){
                console.log("ERR: "+e);
            }
            
            if (walletNfts){
                let count = 0;
                for (let walletItem of sholdings){
                    const collectionitem = {
                        wallet: walletItem,
                        meta:null,
                        groupBySymbol: 0,
                        groupBySymbolIndex: 0,
                        floorPrice: null,
                        helloMoonCollectionId: null,
                    }
                    for (let item of walletNfts.data){
                        //console.log("found: "+JSON.stringify(walletItem));
                        if (walletItem.account.data.parsed.info.mint === item.nftMint){
                            //console.log("found: "+JSON.stringify(item));
                            //console.log(">>>>>: "+JSON.stringify(walletItem));
                            
                            collectionitem.meta = {
                                mint: item.nftMint,
                                data: {
                                    name: item.metadataJson.name,
                                    uri: item.metadataJson.uri,
                                    symbol: item.metadataJson.symbol
                                }
                            }

                            //collectionitem.meta.data.symbol = item.metadataJson.symbol;
                            collectionitem.helloMoonCollectionId = item.helloMoonCollectionId;
                            if (!collectionitem.image){
                                if (loadNftMeta){
                                    collectionitem.urimeta = await window.fetch(item.metadataJson.uri)
                                    .then((res: any) => res.json())
                                    .catch((error) => console.error("Error fetching data:", error));
                                    if (collectionitem?.urimeta)
                                        collectionitem.image = DRIVE_PROXY+collectionitem.urimeta.image;
                                }
                            }

                            if (!collectionitem.floorPrice){
                                if (floorResults && floorResults?.data){
                                    for (let flritem of floorResults.data){
                                        if (collectionitem.helloMoonCollectionId === flritem.helloMoonCollectionId){
                                            //console.log("FLR price for: "+resitem.floorPriceLamports)
                                            collectionitem.floorPrice = +flritem.floorPriceLamports;
                                            totalFloor+= +flritem.floorPriceLamports;
                                        }
                                    }
                                } else{
                                    // check first if this collection has not already been fetched
                                    let floorCached = false;
                                    
                                    // check if we do have the floor price already fetched
                                    if (solanaHoldingRows){
                                        for (let shr of solanaHoldingRows){ 
                                            if (shr.mint === item.nftMint){
                                                //console.log("shr: "+JSON.stringify(shr))
                                                if (shr.price && shr.price > 0){
                                                    collectionitem.floorPrice = +shr.price;
                                                    totalFloor+= +shr.price;
                                                    floorCached = true;
                                                }
                                            }
                                        }
                                    }
                                    
                                    if (!floorCached){
                                        for (let reitem of final_collection_meta){
                                            if (reitem.helloMoonCollectionId === collectionitem.helloMoonCollectionId){
                                                if (reitem?.floorPrice && reitem.floorPrice > 0){
                                                    collectionitem.floorPrice = +reitem.floorPrice;
                                                    totalFloor+= +reitem.floorPrice;
                                                    floorCached = true;
                                                }
                                            }
                                        }
                                    }

                                    if (!floorCached && loadNftFloor){
                                        setLoadingPosition('NFT Floor Value ('+(count+1)+' of '+sholdings.length+')');
                                        const results = await client.send(new CollectionFloorpriceRequest({
                                            helloMoonCollectionId: collectionitem.helloMoonCollectionId,
                                            limit: 1
                                        }))
                                            .then(x => {
                                                //console.log; 
                                                return x;})
                                            .catch(console.error);
                    
                                        if (results?.data){
                                            for (let resitem of results.data){
                                                //console.log("FLR price for: "+resitem.floorPriceLamports)
                                                collectionitem.floorPrice = +resitem.floorPriceLamports;
                                                totalFloor+= +resitem.floorPriceLamports;
                                            }
                                        }
                                    }
                                }
                                
                            }
                            
                        }
                        
                    }
                    
                    count++;
                    final_collection_meta.push(collectionitem);
                }
            } else{
                



                for (let x = 0; x < loops; x++) {
                    const tmpcollectionmeta = await getCollectionData(x, sholdings);
                    console.log('tmpcollectionmeta: ' + JSON.stringify(tmpcollectionmeta));
                    collectionmeta = collectionmeta.concat(tmpcollectionmeta);
                }
    
                const mintarr = sholdings
                    .map((value: any, index: number) => {
                        return value.account.data.parsed.info.mint;
                    });
                
                if (mintarr){
                    //console.log("mintarr: "+JSON.stringify(mintarr))
                    // RETIRED HOLAPLEX INDEXER:
                    //const gql_result = await getGqlNfts(mintarr);
                    //nftMap = gql_result;
                    //console.log('gql_results: ' + JSON.stringify(nftMap));
                }

                for (let i = 0; i < collectionmeta.length; i++) {
                    //console.log(i+": "+JSON.stringify(collectionmeta[i])+" --- with --- "+JSON.stringify(collectionmeta[i]));
                    if (collectionmeta[i]) {
                        collectionmeta[i]['wallet'] = sholdings[i];
                        try {
                            if (collectionmeta[i]['wallet'].account?.data?.parsed?.info?.tokenAmount?.decimals === 0){
                                //console.log("NFT: "+JSON.stringify(collectionmeta[i]['wallet']))
                                const meta_primer = collectionmeta[i];
                                const buf = Buffer.from(meta_primer.data, 'base64');
                                const meta_final = decodeMetadata(buf);
                                collectionmeta[i]['meta'] = meta_final;
                                //console.log("meta: "+JSON.stringify(collectionmeta[i]['meta'].mint))
                            
                                try{
                                    //console.log("checking: "+collectionmeta[i]['meta'].mint);
                                    if (nftMap){
                                        //var index = Object.keys(nftMap).indexOf(collectionmeta[i]['meta'].mint);
                                        let found_from_map = false;
                                        for (const [key, value] of Object.entries(nftMap)){
                                            if (key === collectionmeta[i]['meta'].mint){
                                                collectionmeta[i]['image'] = DRIVE_PROXY+value?.image;
                                                found_from_map = true;
                                                //console.log("image: "+ value?.image);
                                            }
                                        }

                                        if (!found_from_map){
                                            //if (collectionmeta.length <= 25){ // limitd to 25 fetches (will need to optimize this so it does not delay)
                                                if (meta_final.data?.uri){
                                                    if (loadNftMeta){
                                                        setLoadingPosition('NFT Image from Metadata ('+(i+1)+' of '+collectionmeta.length+')');
                                                        collectionmeta[i]['urimeta'] = await window.fetch(meta_final.data.uri)
                                                        .then((res: any) => res.json())
                                                        .catch((error) => console.error("Error fetching data:", error));
                                                        collectionmeta[i]['image'] = DRIVE_PROXY+collectionmeta[i]['urimeta'].image;
                                                    }
                                                }
                                            //}
                                        }
                                    } else {
                                        if (meta_final.data?.uri){
                                            if (loadNftMeta){
                                                setLoadingPosition('NFT Image from Metadata ('+(i+1)+' of '+collectionmeta.length+')');
                                                collectionmeta[i]['urimeta'] = await window.fetch(meta_final.data.uri)
                                                .then((res: any) => res.json())
                                                .catch((error) => console.error("Error fetching data:", error));
                                                collectionmeta[i]['image'] = DRIVE_PROXY+collectionmeta[i]['urimeta'].image;
                                            }
                                        }
                                    }

                                    if (collectionmeta[i]['image']){
                                        /*
                                        const img_url_string = collectionmeta[i]['image'];
                                        const full_url = new URL(img_url_string);
                                        const ARWEAVE = 'https://arweave.net';
                                        const IPFS = 'https://ipfs.io';
                                        const IPFS_2 = "https://nftstorage.link/ipfs";
                                        const IPFS_3 = ".ipfs.nftstorage.link";
                                        
                                        if ((img_url_string?.toLocaleUpperCase().indexOf('?EXT=PNG') > -1) ||
                                            (img_url_string?.toLocaleUpperCase().indexOf('?EXT=JPEG') > -1) ||
                                            (img_url_string?.toLocaleUpperCase().indexOf('?EXT=GIF') > -1) ||
                                            (img_url_string?.toLocaleUpperCase().indexOf('.JPEG') > -1) ||
                                            (img_url_string?.toLocaleUpperCase().indexOf('.PNG') > -1) ||
                                            (img_url_string?.startsWith(IPFS))){
                                                
                                                let image_url = DRIVE_PROXY+img_url_string;

                                                if (img_url_string.startsWith(IPFS)){
                                                    //image_url = DRIVE_PROXY+CLOUDFLARE_IPFS_CDN+''+img_url_string.replace(IPFS,'');
                                                } else if (img_url_string.startsWith(IPFS_2)){
                                                    //image_url = DRIVE_PROXY+CLOUDFLARE_IPFS_CDN+'/ipfs/'+img_url_string.replace(IPFS_2,'');
                                                } else if (img_url_string.includes(IPFS_3)){
                                                    //https://solana-cdn.com/cdn-cgi/image/width=256/https://cloudflare-ipfs.com/ipfs///
                                                    //https://bafybeigi6scodcqz7wc2higrkfdmwt4tkyteoq4xxiy5olxpfh3pm4n3ue.ipfs.nftstorage.link/?ext=png
                                                    const host = full_url.hostname.split('.');
                                                    const folders = full_url.pathname.split('/');
                                                }

                                                
                                                collectionmeta[i]['image'] = image_url;
                                        }
                                        */

                                    }
                                }catch(err){
                                    console.log("ERR: "+err);
                                }
                            } else{ // push null if empty
                                collectionmeta[i]['meta'] = null;
                            }
                            collectionmeta[i]['groupBySymbol'] = 0;
                            collectionmeta[i]['groupBySymbolIndex'] = 0;
                            collectionmeta[i]['floorPrice'] = 0;
                            final_collection_meta.push(collectionmeta[i]);
                        } catch (e) {
                            console.log('ERR:' + e);
                        }
                    }
                }
            }
            //console.log('final_collection_meta: ' + JSON.stringify(final_collection_meta));
            
            setNftFloorValue(totalFloor);
            setNftMap(final_collection_meta);
            return final_collection_meta;
            

        }
    }

    React.useEffect(() => {
        if (urlParams){
            //console.log("urlParams: "+urlParams);
            //console.log("pubkey set?: "+pubkey);
            if (!pubkey){
                //if (ValidateAddress(urlParams))
                    setPubkey(urlParams);
            }
        } else if (publicKey) {
            setPubkey(publicKey.toBase58());
        }
    }, [urlParams, publicKey, pubkey]);

    const fetchTokenPositions = async (loadNftsMeta: boolean) => {
        setLoadingTokens(true);
        await fetchSolanaTokens(loadNftsMeta);
        setLoadingTokens(false);
    }

    const fetchWalletPositions = async () => {
        setLoadingWallet(true);
        const tmap = await fetchTokens();
        //await fetchProfilePicture();
        await fetchSolanaDomain();
        await fetchSolanaBalance();
        //await fetchStorage();
        setLoadingWallet(false);
    }

    React.useEffect(() => {
        if (pubkey && tokenMap && solanaUSDC){
            fetchTokenPositions(loadNfts);
        }
    }, [pubkey, tokenMap, loadNfts, loadNftFloor, solanaUSDC]);

    React.useEffect(() => {
        if (pubkey){
            //console.log("using pubkey: "+pubkey)
            fetchWalletPositions();
        }
    }, [pubkey]);

    {

        return (
            <Container sx={{mt:4}}>
                    <Box
                        sx={{
                            width: '100%',
                            background: 'rgba(0, 0, 0, 0.60)',
                            borderRadius: '17px',
                            p:1
                        }} 
                    > 
                            {publicKey && pubkey !== publicKey.toBase58() &&
                                <Grid 
                                    container 
                                    direction="row" 
                                    spacing={1} 
                                    alignItems="center"
                                    justifyContent="flex-start"
                                    rowSpacing={1}
                                >
                                        <Grid 
                                            item md={2} sm={3} xs={12}
                                            display="flex" justifyContent="center" alignItems="center"
                                        ></Grid>
                                        <Grid 
                                            item md={8} sm={6} xs={12}
                                            display="flex" justifyContent="center" alignItems="center"
                                        > 
                                            <Typography
                                                variant="h5"
                                                color="inherit"
                                                sx={{mb:3}}
                                            >
                                                <SolIcon sx={{fontSize:'20px',mr:1}} />WALLET
                                            </Typography>
                                            

                                        </Grid>
                                        <Grid 
                                            item md={2} sm={3} xs={12}
                                            display="flex" justifyContent="center" alignItems="center"
                                        > 
                                            {publicKey && pubkey !== publicKey.toBase58() &&
                                                <Button
                                                    color='inherit'
                                                    component={Link} to={`./`}
                                                    sx={{borderRadius:'17px',textTransform:'none'}}
                                                ><AccountBalanceWalletIcon sx={{mr:1}}/> Go to my wallet</Button>
                                            }
                                        </Grid>
                                        
                                </Grid>
                            }
                            
                            <>
                                {pubkey ?
                                    <>  
                                    <Box sx={{ width: '100%' }}>
                                        <Grid container>
                                            <Grid item xs={12} md={6}>
                                                <Typography
                                                    variant="h6"
                                                >
                                                    {t('ADDRESS')}:
                                                </Typography>   
                                                <List dense={true}>
                                                    <ListItem sx={{width:'100%'}}>
                                                        <Grid container>
                                                            <Grid item>
                                                                <ExplorerView showSolanaProfile={true} showAddress={true} grapeArtProfile={true} address={pubkey} type='address' shorten={8} hideTitle={false} style='text' color='white' fontSize='14px' />
                                                            </Grid>
                                                        </Grid>
                                                    </ListItem>
                                                </List>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                {solanaTicker ?
                                                    <Typography variant='caption'>
                                                        Rate: 1 SOL = {(+solanaTicker.last_price).toFixed(2)} USDC
                                                        <Typography variant='caption' sx={{color:'#999'}}>
                                                            <br/>
                                                            24h High/Low: {solanaTicker?.high}/{solanaTicker?.low}
                                                            <br/>
                                                            24h Volume: {solanaTicker?.base_volume}
                                                            <br/>
                                                            Timestamp: {moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}
                                                        </Typography>
                                                    </Typography>
                                                : 
                                                    <>
                                                        {solanaBasicTicker && 
                                                            <Typography variant='caption'>
                                                                Rate: 1 SOL = {(+solanaBasicTicker.data["So11111111111111111111111111111111111111112"]["price"]).toFixed(2)} USDC
                                                                <Typography variant='caption' sx={{color:'#999'}}>
                                                                    <br/>
                                                                    Timestamp: {moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}
                                                                </Typography>
                                                            </Typography>
                                                        }
                                                    </>
                                                }
                                                
                                                
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Box>
                                        <Grid container spacing={{ xs: 0 }} columns={{ xs: 4, sm: 4, md: 12 }}>
                                            <Grid item textAlign={'center'} xs={12} sm={12} md={nftFloorValue > 0 ? 3 : 4} lg={nftFloorValue > 0 ? 3 : 4} 
                                                sx={{
                                                    border:'1px solid rgba(0,0,0,0.15)',
                                                    borderRadius:'17px',
                                                    background:'rgba(0,0,0,0.05)',
                                                }}
                                            >   
                                                <Grid container>
                                                    <Grid item xs={1}>
                                                    </Grid>
                                                    <Grid item xs={8} alignContent='middle' textAlign='center'>
                                                        <Typography variant="h6">SOL</Typography>  
                                                    </Grid>
                                                    {publicKey && pubkey === publicKey.toBase58() &&
                                                        <Grid item xs={3} alignContent='middle' textAlign='center' sx={{mt:0.35}}>
                                                            <SendToken mint={'So11111111111111111111111111111111111111112'} name={'SOL'} logoURI={'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'} balance={new TokenAmount(solanaBalance, 9).format()} conversionrate={0} showTokenName={false} sendType={0} fetchSolanaBalance={fetchSolanaBalance} />
                                                        </Grid>
                                                    } 
                                                </Grid>
                                                <List dense={true}>
                                                    <ListItem>
                                                        <ListItemAvatar>
                                                            <Avatar
                                                                sx={{backgroundColor:'#222'}}
                                                            >
                                                                <SolCurrencyIcon sx={{color:'white'}} />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <Grid container>
                                                            <Grid item>
                                                                <ListItemText
                                                                    primary={
                                                                        <Typography variant='h5'>
                                                                            {solanaBalance  && 
                                                                                <>
                                                                                {(solanaBalance/(10 ** 9)).toFixed(4)}
                                                                                </>
                                                                            }
                                                                        </Typography>}
                                                                    secondary={
                                                                        <>
                                                                        {solanaUSDC &&
                                                                            <Typography variant='caption'>
                                                                                {getFormattedNumberToLocale(+((solanaBalance/(10 ** 9)) * solanaUSDC).toFixed(2))} USDC
                                                                            </Typography>
                                                                        }
                                                                        </>
                                                                    }
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    </ListItem>
                                                </List>
                                            </Grid>
                                            {tokensNetValue > 0 &&
                                                <>
                                                {(solanaUSDC) &&
                                                <Grid item textAlign={'center'} xs={12} sm={12} md={nftFloorValue > 0 ? 3 : 4} lg={nftFloorValue > 0 ? 3 : 4} 
                                                    sx={{
                                                        border:'1px solid rgba(0,0,0,0.15)',
                                                        borderRadius:'17px',
                                                        background:'rgba(0,0,0,0.05)'
                                                    }}
                                                >
                                                    <Typography
                                                        variant="h6"
                                                    >
                                                        Token Value
                                                    </Typography> 


                                                    <List dense={true}>
                                                    <ListItem sx={{width:'100%'}}>
                                                        <ListItemAvatar>
                                                            <Avatar
                                                                sx={{backgroundColor:'#222'}}
                                                            >
                                                                <SolCurrencyIcon sx={{color:'white'}} />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <Grid container sx={{width:'100%'}}>
                                                            <Grid item>
                                                                <ListItemText
                                                                    primary={
                                                                        <Typography variant='h5'>
                                                                            {(tokensNetValue/solanaUSDC).toFixed(4)}
                                                                        </Typography>}
                                                                    secondary={
                                                                        <>
                                                                        {solanaUSDC &&
                                                                            <Typography variant='caption'>
                                                                                {getFormattedNumberToLocale(+tokensNetValue.toFixed(2))} USDC
                                                                            </Typography>
                                                                        }
                                                                        </>
                                                                    }
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    </ListItem>
                                                </List>

                                                </Grid>
                                                }
                                                </>
                                            }

                                            {nftFloorValue > 0 &&
                                                <>
                                                {(solanaUSDC) &&
                                                <Grid item textAlign={'center'} xs={12} sm={12} md={3} lg={3} 
                                                    sx={{
                                                        border:'1px solid rgba(0,0,0,0.15)',
                                                        borderRadius:'17px',
                                                        background:'rgba(0,0,0,0.05)'
                                                    }}
                                                >
                                                    <Typography
                                                        variant="h6"
                                                    >
                                                        NFT Floor Value
                                                    </Typography> 


                                                    <List dense={true}>
                                                    <ListItem sx={{width:'100%'}}>
                                                        <ListItemAvatar>
                                                            <Avatar
                                                                sx={{backgroundColor:'#222'}}
                                                            >
                                                                <SolCurrencyIcon sx={{color:'white'}} />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <Grid container sx={{width:'100%'}}>
                                                            <Grid item>
                                                                <ListItemText
                                                                    primary={
                                                                        <Typography variant='h5'>
                                                                            {(nftFloorValue/(10 ** 9)).toFixed(4)}
                                                                        </Typography>}
                                                                    secondary={
                                                                        <>
                                                                        {solanaUSDC &&
                                                                            <Typography variant='caption'>
                                                                                {getFormattedNumberToLocale((+nftFloorValue/(10 ** 9)*solanaUSDC).toFixed(2))} USDC
                                                                            </Typography>
                                                                        }
                                                                        </>
                                                                    }
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    </ListItem>
                                                </List>

                                                </Grid>
                                                }
                                                </>
                                            }

                                            {(tokensNetValue > 0 && solanaBalance > 0 && solanaUSDC) &&
                                                <>
                                                {tokensNetValue && 
                                                    <Grid item xs={12} sm={12} md={nftFloorValue > 0 ? 3 : 4} lg={nftFloorValue > 0 ? 3 : 4} textAlign={'center'}
                                                        sx={{
                                                            border:'1px solid rgba(0,0,0,0.15)',
                                                            borderRadius:'17px',
                                                            background:'rgba(0,0,0,0.05)'
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="h6"
                                                        >
                                                            Total Value
                                                        </Typography> 


                                                        <List dense={true}>
                                                        <ListItem sx={{width:'100%'}}>
                                                            <ListItemAvatar>
                                                                <Avatar
                                                                    sx={{backgroundColor:'#222'}}
                                                                >
                                                                    <SolCurrencyIcon sx={{color:'white'}} />
                                                                </Avatar>
                                                            </ListItemAvatar>
                                                            <Grid container sx={{width:'100%'}}>
                                                                <Grid item>
                                                                    <ListItemText
                                                                        primary={
                                                                            <Typography variant='h5'>
                                                                                {((tokensNetValue/solanaUSDC) + solanaBalance/(10 ** 9) + nftFloorValue/(10 ** 9)).toFixed(4)}
                                                                            </Typography>}
                                                                        secondary={
                                                                            <>
                                                                            {solanaUSDC &&
                                                                                <Typography variant='caption'>
                                                                                    {getFormattedNumberToLocale(+(((solanaBalance/(10 ** 9)) * solanaUSDC) + tokensNetValue + (nftFloorValue/(10 ** 9) * solanaUSDC)).toFixed(2))} USDC
                                                                                </Typography>
                                                                            }
                                                                            </>
                                                                        }
                                                                        sx={{color:'yellow'}}
                                                                    />
                                                                </Grid>
                                                            </Grid>
                                                        </ListItem>
                                                    </List>

                                                    </Grid>
                                                }
                                                </>
                                            }
                                        </Grid>
                                    </Box>

                                        {(loadingWallet || loadingTokens || loadingStorage || loadingStreamingPayments) &&
                                            <Grid container spacing={0} sx={{}}>
                                                {/*
                                                a. {JSON.stringify(loadingWallet)}
                                                b. {JSON.stringify(loadingTokens)}
                                                c. {JSON.stringify(loadingGovernance)}
                                                d. {JSON.stringify(loadingStorage)}
                                                e. {JSON.stringify(loadingStreamingPayments)}
                                                */}
                                                <Grid item xs={12} key={1}>
                                                    <Box
                                                        className='grape-store-stat-item'
                                                        sx={{borderRadius:'24px',m:2,p:1}}
                                                        textAlign='center'
                                                    >
                                                        <Typography variant="body2" sx={{color:'yellow'}}>
                                                            loading {loadingPosition}...
                                                            <LinearProgress />
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        }

                                        {(solanaHoldings && solanaUSDC) &&
                                            <Box sx={{ width: '100%', typography: 'body1' }}>
                                                <TabContext value={value} >
                                                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                                    <TabList variant="scrollable" scrollButtons="auto" onChange={handleChange} aria-label="Wallet Navigation">
                                                        
                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                            icon={<Hidden smUp><Badge badgeContent={solanaHoldings.length} color="primary"><AccountBalanceWalletIcon /></Badge></Hidden>}
                                                            label={<Hidden smDown><Badge badgeContent={solanaHoldings.length} color="primary"><Typography variant="h6">{t('Tokens')}</Typography></Badge></Hidden>
                                                        } value={NavPanel.Holdings.toString()}/>

                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                            icon={<Hidden smUp><SwapHorizIcon /></Hidden>}
                                                            label={<Hidden smDown><Typography variant="h6">{t('Transactions')}</Typography></Hidden>
                                                        } value={NavPanel.Transactions.toString()} />

                                                        {solanaClosableHoldings && solanaClosableHoldings.length > 0 &&
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><Badge badgeContent={solanaClosableHoldings.length} color="error"><DoNotDisturbIcon /></Badge></Hidden>}
                                                                label={<Hidden smDown><Badge badgeContent={solanaClosableHoldings.length} color="error"><Typography variant="h6">{t('Closable')}</Typography></Badge></Hidden>
                                                            } value={NavPanel.Closable.toString()} />
                                                        }

                                                        {/*
                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                            icon={<Hidden smUp><ReduceCapacityIcon /></Hidden>}
                                                            label={<Hidden smDown><Typography variant="h6">{t('Delegated')}</Typography></Hidden>
                                                        } value="4" />
                                                        */}
                                                        {publicKey && publicKey.toBase58() === pubkey &&
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><SwapCallsIcon /></Hidden>}
                                                                label={<Hidden smDown><Typography variant="h6">{t('Swap')}</Typography></Hidden>
                                                            } value={NavPanel.Swap.toString()} />
                                                        }
                                                        
                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                            icon={<Hidden smUp><PercentIcon /></Hidden>}
                                                            label={<Hidden smDown><Typography variant="h6">{t('Staking')}</Typography></Hidden>
                                                        } value={NavPanel.Staking.toString()} />

                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                            icon={<Hidden smUp><AccountBalanceIcon /></Hidden>}
                                                            label={<Hidden smDown><Typography variant="h6">{t('Governance')}</Typography></Hidden>
                                                        } value={NavPanel.Governance.toString()} />

                                                        {HELLO_MOON_BEARER &&
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><HandshakeIcon /></Hidden>}
                                                                label={<Hidden smDown><Typography variant="h6">{t('Lending')}</Typography></Hidden>
                                                            } value={NavPanel.Lending.toString()} />
                                                        }
                                                        
                                                        {solanaDomain && 
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><Badge badgeContent={solanaDomain.length} color="primary"><LanguageIcon /></Badge></Hidden>}
                                                                label={<Hidden smDown><Badge badgeContent={solanaDomain.length} color="primary"><Typography variant="h6">{t('Domains')}</Typography></Badge></Hidden>
                                                            } value={NavPanel.Domains.toString()} />
                                                        }
                                                        
                                                        {publicKey && publicKey.toBase58() === pubkey &&
                                                            <Tab color='inherit' sx={{color:'white', textTransform:'none'}} 
                                                                    icon={<Hidden smUp><StorageIcon /></Hidden>}
                                                                    label={<Hidden smDown><Typography variant="h6">{t('Storage')}</Typography></Hidden>
                                                                } value={NavPanel.Storage.toString()} />
                                                        }

                                                        {ValidateCurve(pubkey) &&
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                    icon={<Hidden smUp><OpacityIcon /></Hidden>}
                                                                    label={<Hidden smDown><Typography variant="h6">{t('Streaming')}</Typography></Hidden>
                                                            } value={NavPanel.Streaming.toString()} />
                                                        }
                                                        
                                                        {(SQUADS_API && publicKey && (publicKey.toBase58() === pubkey)) &&
                                                            <Tab sx={{color:'white', textTransform:'none'}}
                                                                    icon={<Hidden smUp><ViewComfyIcon /></Hidden>}
                                                                    label={<Hidden smDown><Typography variant="h6">{t('Squads')}</Typography></Hidden>
                                                            } value={NavPanel.Squads.toString()} />
                                                        }

                                                    </TabList>
                                                    </Box>

                                                    <TabPanel value={NavPanel.Holdings.toString()}>
                                                    
                                                        {publicKey && publicKey.toBase58() === pubkey && selectionModel && selectionModel.length > 0 &&
                                                            <Grid container sx={{mt:1,mb:1}}>
                                                                <Grid item xs={12} alignContent={'right'} textAlign={'right'}>
                                                                    {selectionModel.length <= 500 &&
                                                                        <BulkSend tokensSelected={selectionModel} solanaHoldingRows={solanaHoldingRows} tokenMap={tokenMap} fetchSolanaTokens={fetchSolanaTokens}  />
                                                                    }
                                                                </Grid>
                                                            </Grid>
                                                        }

                                                        {solanaHoldingRows && 
                                                            <div style={{ height: 600, width: '100%' }}>
                                                                <div style={{ display: 'flex', height: '100%' }}>
                                                                    <div style={{ flexGrow: 1 }}>
                                                                        {publicKey && publicKey.toBase58() === pubkey ?
                                                                            <DataGrid
                                                                                rows={solanaHoldingRows}
                                                                                columns={columns}
                                                                                rowsPerPageOptions={[25, 50, 100, 250]}
                                                                                sx={{
                                                                                    borderRadius:'17px',
                                                                                    borderColor:'rgba(255,255,255,0.25)',
                                                                                    '& .MuiDataGrid-cell':{
                                                                                        borderColor:'rgba(255,255,255,0.25)'
                                                                                    }}}
                                                                                selectionModel={selectionModel}
                                                                                onSelectionModelChange={(newSelectionModel) => {
                                                                                    setSelectionModel(newSelectionModel);
                                                                                }}
                                                                                initialState={{
                                                                                    sorting: {
                                                                                        sortModel: [{ field: 'value', sort: 'desc' }],
                                                                                    },
                                                                                }}
                                                                                sortingOrder={['asc', 'desc', null]}
                                                                                checkboxSelection
                                                                            />
                                                                        :
                                                                        <DataGrid
                                                                            rows={solanaHoldingRows}
                                                                            columns={columns}
                                                                            initialState={{
                                                                                sorting: {
                                                                                    sortModel: [{ field: 'value', sort: 'desc' }],
                                                                                },
                                                                            }}
                                                                            sx={{
                                                                                borderRadius:'17px',
                                                                                borderColor:'rgba(255,255,255,0.25)',
                                                                                '& .MuiDataGrid-cell':{
                                                                                    borderColor:'rgba(255,255,255,0.25)'
                                                                                }}}
                                                                            pageSize={25}
                                                                            rowsPerPageOptions={[]}
                                                                        />
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <Box
                                                                    display="flex"
                                                                    justifyContent="flex-end"
                                                                    sx={{
                                                                        alignItems:"right",
                                                                        m:1
                                                                    }}
                                                                >
                                                                    <FormGroup row>
                                                                        <FormControlLabel control={<Switch defaultChecked disabled={loadingTokens} checked={loadNfts} onChange={setLoadNftToggle} size="small" />} label={<><Typography variant="caption">Load Token Metadata</Typography></>} />
                                                                        <FormControlLabel control={<Switch defaultChecked disabled={loadingTokens} checked={loadNftFloor} onChange={setLoadNftFloorToggle} size="small" />} label={<><Typography variant="caption">Load Floor Pricing</Typography></>} />
                                                                    </FormGroup>
                                                                </Box>
                                                            </div>    
                                                        }

                                                        {publicKey && publicKey.toBase58() === pubkey && selectionModel && selectionModel.length > 0 &&
                                                            <Grid container sx={{mt:1}}>
                                                                <Grid item xs={12} alignContent={'right'} textAlign={'right'}>
                                                                    <Grid item alignContent={'right'} textAlign={'right'}>
                                                                        {selectionModel.length <= 500 ?
                                                                            <BulkSend tokensSelected={selectionModel} solanaHoldingRows={solanaHoldingRows} tokenMap={tokenMap} nftMap={nftMap} fetchSolanaTokens={fetchSolanaTokens}  />
                                                                        :
                                                                            <Typography variant="caption">Currently limited to 500 token accounts</Typography>
                                                                        }
                                                                    </Grid>

                                                                    <Grid item alignContent={'right'} textAlign={'right'}>
                                                                
                                                                        {selectionModel.length > 0 &&
                                                                            <>
                                                                                <br />
                                                                                <Typography variant="caption">*If batch sending fails please try sending in bulks of 8</Typography>
                                                                            </>
                                                                        }
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        }

                                                        {publicKey && publicKey.toBase58() === pubkey && selectionModel && selectionModel.length > 0 && solanaHoldingRows && solanaHoldingRows.length > 0 &&
                                                            <Grid container sx={{mt:1}}>
                                                                <Grid item xs={12} alignContent={'right'} textAlign={'right'}>
                                                                    <Grid item alignContent={'right'} textAlign={'right'}>
                                                                        {selectionModel.length <= 100 ?
                                                                            <BulkBurnClose tokensSelected={selectionModel} clearSelectionModels={clearSelectionModels} solanaHoldingRows={solanaHoldingRows} tokenMap={tokenMap} nftMap={nftMap} fetchSolanaTokens={fetchSolanaTokens} type={0}  />
                                                                        :
                                                                            <Typography variant="caption">Currently limited to 100 token accounts</Typography>
                                                                        }
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        }
                                                    
                                                    </TabPanel>
                                                    <TabPanel value={NavPanel.Transactions.toString()}>
                                                        <TransactionsView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>

                                                    <TabPanel value={NavPanel.Closable.toString()}>
                                                        {solanaClosableHoldings && 
                                                            <div style={{ height: 600, width: '100%' }}>
                                                                <div style={{ display: 'flex', height: '100%' }}>
                                                                    <div style={{ flexGrow: 1 }}>
                                                                        {publicKey && publicKey.toBase58() === pubkey ?
                                                                            <DataGrid
                                                                                rows={solanaClosableHoldingsRows}
                                                                                columns={closablecolumns}
                                                                                rowsPerPageOptions={[25, 50, 100, 250]}
                                                                                selectionModel={selectionModelClose}
                                                                                onSelectionModelChange={(newCloseSelectionModel) => {
                                                                                    setSelectionModelClose(newCloseSelectionModel);
                                                                                }}
                                                                                sx={{
                                                                                    borderRadius:'17px',
                                                                                    borderColor:'rgba(255,255,255,0.25)',
                                                                                    '& .MuiDataGrid-cell':{
                                                                                        borderColor:'rgba(255,255,255,0.25)'
                                                                                    }}}
                                                                                checkboxSelection
                                                                            />
                                                                        :
                                                                        <DataGrid
                                                                            rows={solanaClosableHoldingsRows}
                                                                            columns={columns}
                                                                            sx={{
                                                                                borderRadius:'17px',
                                                                                borderColor:'rgba(255,255,255,0.25)',
                                                                                '& .MuiDataGrid-cell':{
                                                                                    borderColor:'rgba(255,255,255,0.25)'
                                                                                }}}
                                                                            pageSize={25}
                                                                            rowsPerPageOptions={[]}
                                                                        />
                                                                        }
                                                                    </div>
                                                                </div>

                                                            </div>    
                                                        }

                                                        {publicKey && publicKey.toBase58() === pubkey &&
                                                            <Grid container sx={{mt:1}}>
                                                                <Grid item xs={12} alignContent={'right'} textAlign={'right'}>
                                                                    <Grid item alignContent={'center'} textAlign={'center'}>
                                                                        <>
                                                                            <Typography variant="caption" color='error'>* IMPORTANT: By closing a token account you will be recovering the account rent, this is not reversable</Typography>
                                                                        </>
                                                                        
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        }

                                                        {publicKey && publicKey.toBase58() === pubkey && selectionModelClose && selectionModelClose.length > 0 &&
                                                            <Grid container sx={{mt:1}}>
                                                                <Grid item xs={12} alignContent={'right'} textAlign={'right'}>
                                                                    <Grid item alignContent={'right'} textAlign={'right'}>
                                                                        {selectionModelClose.length <= 100 ?
                                                                            <BulkBurnClose tokensSelected={selectionModelClose} clearSelectionModels={clearSelectionModels} solanaHoldingRows={solanaClosableHoldingsRows} tokenMap={tokenMap} nftMap={nftMap} fetchSolanaTokens={fetchSolanaTokens} type={1}  />
                                                                        :
                                                                            <Typography variant="caption">Currently limited to 100 token accounts</Typography>
                                                                        }
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        }
                                                    </TabPanel>
                                                    
                                                    {/*
                                                    <TabPanel value={NavPanel.Delegation.toString()} >
                                                        <DelegationView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>
                                                    */}

                                                    <TabPanel value={NavPanel.Swap.toString()}>
                                                        <IntegratedSwapView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>

                                                    <TabPanel value={NavPanel.Staking.toString()}>
                                                        <StakingView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>

                                                    {tokenMap &&
                                                        <TabPanel value={NavPanel.Governance.toString()}>
                                                            <GovernanceView pubkey={pubkey} setLoadingPosition={setLoadingPosition} tokenMap={tokenMap} />
                                                        </TabPanel>
                                                    }

                                                    <TabPanel value={NavPanel.Lending.toString()}>
                                                        <LendingView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>
                                                    
                                                    <TabPanel value={NavPanel.Domains.toString()}>
                                                        {/*
                                                        <BuyDomainView pubkey={pubkey} />
                                                        */}
                                                        {solanaDomain &&
                                                            <div style={{ height: 600, width: '100%' }}>
                                                                <div style={{ display: 'flex', height: '100%' }}>
                                                                    <div style={{ flexGrow: 1 }}>
                                                                        {publicKey && publicKey.toBase58() === pubkey ?
                                                                            <DataGrid
                                                                                rows={solanaDomainRows}
                                                                                columns={domaincolumns}
                                                                                pageSize={25}
                                                                                rowsPerPageOptions={[]}
                                                                                onSelectionModelChange={(newSelectionModel) => {
                                                                                    setSelectionModel(newSelectionModel);
                                                                                }}
                                                                                initialState={{
                                                                                    sorting: {
                                                                                        sortModel: [{ field: 'domain', sort: 'desc' }],
                                                                                    },
                                                                                }}
                                                                                sx={{
                                                                                    borderRadius:'17px',
                                                                                    borderColor:'rgba(255,255,255,0.25)',
                                                                                    '& .MuiDataGrid-cell':{
                                                                                        borderColor:'rgba(255,255,255,0.25)'
                                                                                    }}}
                                                                                sortingOrder={['asc', 'desc', null]}
                                                                                disableSelectionOnClick
                                                                            />
                                                                        :
                                                                            <DataGrid
                                                                                rows={solanaDomainRows}
                                                                                columns={domaincolumns}
                                                                                initialState={{
                                                                                    sorting: {
                                                                                        sortModel: [{ field: 'domain', sort: 'desc' }],
                                                                                    },
                                                                                }}
                                                                                sx={{
                                                                                    borderRadius:'17px',
                                                                                    borderColor:'rgba(255,255,255,0.25)',
                                                                                    '& .MuiDataGrid-cell':{
                                                                                        borderColor:'rgba(255,255,255,0.25)'
                                                                                    }}}
                                                                                pageSize={25}
                                                                                rowsPerPageOptions={[]}
                                                                            />
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }

                                                    </TabPanel>
                                                    
                                                    <TabPanel value={NavPanel.Storage.toString()}>
                                                        <StorageView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>

                                                    <TabPanel value={NavPanel.Streaming.toString()}>
                                                        <StreamingPaymentsView pubkey={pubkey} setLoadingPosition={setLoadingPosition} tokenMap={tokenMap} />
                                                    </TabPanel>
                                                    
                                                    <TabPanel value={NavPanel.Squads.toString()}>
                                                        <SquadsView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>
                                                    

                                                </TabContext>
                                            </Box>
                                        }
                                    </>
                                :
                                    <Grid container>
                                        <Grid item xs={12} textAlign={'center'}>
                                            <WalletDialogProvider className="grape-wallet-provider">
                                                <WalletMultiButton className="grape-wallet-button">
                                                    Connect your wallet
                                                </WalletMultiButton>
                                            </WalletDialogProvider>
                                        </Grid>

                                        <Grid item xs={12} textAlign={'center'}>
                                            <Typography variant="h5">
                                                Connect your wallet or search an address
                                            </Typography>
                                        </Grid>    
                                    </Grid>
                                }
                            </>
                            
                    </Box>
                </Container>
        );
    }
}