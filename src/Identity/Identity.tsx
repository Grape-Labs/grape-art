import React, { useEffect, Suspense } from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import moment from 'moment';
import { Global } from '@emotion/react';
import { Link, useParams, useSearchParams } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils';
// @ts-ignore
import { PublicKey, Connection, Commitment } from '@solana/web3.js';
import {ENV, TokenInfo, TokenListProvider} from '@solana/spl-token-registry';
import axios from "axios";
import { WalletDialogProvider, WalletMultiButton } from '@solana/wallet-adapter-material-ui';

import { RestClient, NftMintsByOwnerRequest, NftMintPriceByCreatorAvgRequest, CollectionFloorpriceRequest } from '@hellomoon/api';

import { gql } from '@apollo/client'
import gql_client from '../gql_client'

import { programs, tryGetAccount, withSend, findAta } from '@cardinal/token-manager';
//import { tryGetAccount } from '@cardinal/common';

import GovernanceDetailsView from './plugins/GovernanceDetails';
import { IntegratedSwapView } from './plugins/IntegratedSwap';
import { SquadsView } from './plugins/squads';
import { GovernanceView } from './plugins/Governance';
import { LendingView } from './plugins/Lending';
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
    SQUADS_API } from '../utils/grapeTools/constants';
import { ConstructionOutlined, DoNotDisturb, JavascriptRounded, LogoDevOutlined } from "@mui/icons-material";

import { useTranslation } from 'react-i18next';
import { getByPlaceholderText } from "@testing-library/react";
import { parseMintAccount } from "@project-serum/common";
import { any } from "prop-types";

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
    const [solanaTicker, setSolanaTicker] = React.useState(null);
    const [solanaUSDC, setSolanaUSDC] = React.useState(null);
    const [solanaTransactions, setSolanaTransactions] = React.useState(null);
    const [loadingWallet, setLoadingWallet] = React.useState(false);
    const [loadingTokens, setLoadingTokens] = React.useState(false);
    const [loadingTransactions, setLoadingTransactions] = React.useState(false);
    
    const [loadingStorage, setLoadingStorage] = React.useState(false);
    const [loadingStreamingPayments, setLoadingStreamingPayments] = React.useState(false);
    const [loadingPosition, setLoadingPosition] = React.useState('');
    
    const [loadNfts, setLoadNfts] = React.useState(false);
    const [loadNftFloor, setLoadNftFloor] = React.useState(true);

    const { publicKey } = useWallet();
    const [pubkey, setPubkey] = React.useState(props.pubkey || null);
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlParams = searchParams.get("pkey") || searchParams.get("address") || handlekey;
    const [value, setValue] = React.useState('1');
    const [tokenMap, setTokenMap] = React.useState<Map<string,TokenInfo>>(undefined);
    const [nftMap, setNftMap] = React.useState(null);
    const [selectionModel, setSelectionModel] = React.useState([]);
    const [selectionModelClose, setSelectionModelClose] = React.useState([]);
    const [tokensNetValue, setTokensNetValue] = React.useState(null);
    const [nftFloorValue, setNftFloorValue] = React.useState(null);
    
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
                                fetchSolanaTokens={fetchSolanaTokens} />
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
                                    href={params.value.indexOf(".sol") > -1 ? `https://naming.bonfida.org/domain/${params.value.slice(0,params.value.indexOf(".sol"))}`: `https://naming.bonfida.org/twitter`}
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
            const ticker = await getTokenTicker('So11111111111111111111111111111111111111112','EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // SOL > USDC
            //console.log("ticker: "+JSON.stringify(ticker))
            setSolanaTicker(ticker);
            //console.log("price converted: "+JSON.stringify(converted))
            //console.log("price ticker: "+JSON.stringify(ticker))
            if (converted?.data?.price)
                setSolanaUSDC(converted.data.price);
            else if (ticker?.last_price)
                setSolanaUSDC(+ticker.last_price);
            setSolanaBalance(response);
        }catch(e){
            console.log("ERR: "+e);
        }
    }

    const fetchSolanaTransactions = async () => {
        setLoadingTransactions(true);
        setLoadingPosition(' last (100) Transactions');
        try{
            let helius_results = null;
            
            if (HELIUS_API){
                try{
                    const tx: any[] = [];
                    const url = "https://api.helius.xyz/v0/addresses/"+pubkey+"/transactions?api-key="+HELIUS_API
                    const parseTransactions = async () => {
                        const { data } = await axios.get(url)
                        //console.log("parsed transactions: ", data)

                        helius_results = data;
                        /*
                        for (const item of data){
                            tx.push({
                                signature:item.signature,
                                blockTime:item.timestamp,
                                //amount:tx_cost,
                                //owner:owner,
                                memo:'',
                                source:null,
                                type:item.description + ' | ' + item.type,
                            });
                        }*/

                    }
                    await parseTransactions();
                //setSolanaTransactions(tx);
                }catch(terr){
                    console.log("ERR: "+terr);
                }
            } 
            
            {
                const response = await connection.getSignaturesForAddress(new PublicKey(pubkey));

                const memos: any[] = [];
                const signatures: any[] = [];
                let counter = 0;
                // get last 100
                for (const value of response){
                    if (counter<100){
                        signatures.push(value.signature);
                        if (value.memo){
                            //let start_memo = value.memo.indexOf('[');
                            //let end_memo = value.memo.indexOf(']');

                        }
                        memos.push(value.memo);
                    }
                    counter++;
                }

                //console.log("signatures: "+JSON.stringify(signatures))

                console.log("fetching parsed transactions")
                try{
                    const getTransactionAccountInputs2 = await connection.getParsedTransactions(signatures, {commitment:'confirmed', maxSupportedTransactionVersion:0});
                    //console.log("getTransactionAccountInputs2: "+JSON.stringify(getTransactionAccountInputs2))
                    let cnt=0;
                    const tx: any[] = [];
                    for (const tvalue of getTransactionAccountInputs2){
                        //if (cnt===0)
                        //    console.log(signatures[cnt]+': '+JSON.stringify(tvalue));
                        
                        let txtype = "";
                        if (tvalue?.meta?.logMessages){
                            for (const logvalue of tvalue.meta.logMessages){
                                //console.log("txvalue: "+JSON.stringify(logvalue));
                                if (logvalue.includes("Program log: Instruction: ")){
                                    if (txtype.length > 0)
                                        txtype += ", ";
                                    txtype += logvalue.substring(26,logvalue.length);
                                    
                                }
                            }
                        }

                        let description = null;
                        if (helius_results){
                            for (const item of helius_results){
                                if ((signatures[cnt] === item.signature) && (item.type !== 'UNKNOWN')){
                                    description = item.description + " ("+ item.type+ ")";
                                }
                            }
                        }

                        tx.push({
                            signature:signatures[cnt],
                            blockTime:tvalue?.blockTime,
                            //amount:tx_cost,
                            //owner:owner,
                            memo:memos[cnt],
                            source:null,
                            description:description,
                            type:txtype,
                        });
                        
                        cnt++;
                    }

                    setSolanaTransactions(tx);
                } catch(err){
                    console.log("ERR: "+err);
                }   
            }
        }catch(e){
            console.log("ERR: "+e);
        }
        
        setLoadingTransactions(false);
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

            setLoadingPosition('NFT Metadata');
            let nftMeta =null;
            //if (loadNfts){
                nftMeta = await fetchNFTMetadata(resultValues, loadNftMeta || loadNfts, loadNftFloor);
            //}

            //console.log("nftMeta: "+JSON.stringify(nftMeta))

            let netValue = 0;
            for (const item of resultValues){
                /*
                try{
                    const tknPrice = await getTokenPrice(item.account.data.parsed.info.mint, "USDC");
                    item.account.data.parsed.info.tokenPrice = tknPrice.data.price
                }catch(e){}
                */
                
                const itemValue = item?.coingeckoId ? +cgPrice[item?.coingeckoId]?.usd ? (cgPrice[item?.coingeckoId].usd * +item.account.data.parsed.info.tokenAmount.amount/Math.pow(10, +item.account.data.parsed.info.tokenAmount.decimals)).toFixed(item.account.data.parsed.info.tokenAmount.decimals) : 0 :0;
                const itemBalance = Number(new TokenAmount(item.account.data.parsed.info.tokenAmount.amount, item.account.data.parsed.info.tokenAmount.decimals).format().replace(/[^0-9.-]+/g,""));
                let logo = null;
                let name = item.account.data.parsed.info.mint;
                let metadata = null;
                let metadata_decoded = null;

                let foundMetaName = false;
                let nftValue = 0;
                if (nftMeta){
                    for (const nft of nftMeta){
                        if (nft?.meta && nft.meta.mint === item.account.data.parsed.info.mint){
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
                
                if (!foundMetaName){
                    name = tokenMap.get(item.account.data.parsed.info.mint)?.name;
                    logo = tokenMap.get(item.account.data.parsed.info.mint)?.logoURI;
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
                    price:item.account.data.parsed.info.tokenAmount.decimals === 0 ? +(nftValue/(10 ** 9)*solanaUSDC).toFixed(2) : cgPrice[item?.coingeckoId]?.usd || 0,
                    change:item.account.data.parsed.info.tokenAmount.decimals === 0 ? 0 : cgPrice[item?.coingeckoId]?.usd_24h_change || 0,
                    value: item.account.data.parsed.info.tokenAmount.decimals === 0 ?  +(nftValue/(10 ** 9)*solanaUSDC).toFixed(2) : +itemValue,
                    send:{
                        name:name,
                        logo:logo,
                        mint: item.account.data.parsed.info.mint,
                        info:item.account.data.parsed.info,
                        metadata: metadata,
                        tokenAmount:item.account.data.parsed.info.tokenAmount,
                        decimals:item.account.data.parsed.info.decimals,
                    },
                    metadata_decoded:metadata_decoded,
                    //swap:item.account.data.parsed.info
                });

                netValue += +itemValue;

                cnt++;
            }

            setTokensNetValue(netValue);

            let closableholdingsrows = new Array();
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
                                foundMetaName = true;
                            }
                        }
                    }
                }

                if (!foundMetaName){
                    name = tokenMap.get(item.account.data.parsed.info.mint)?.name;
                    logo = tokenMap.get(item.account.data.parsed.info.mint)?.logoURI;
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
            for (let witem of walletNfts.data){
                hmcid.push(witem.helloMoonCollectionId);
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
                                    collectionitem.urimeta = await window.fetch(item.metadataJson.uri).then((res: any) => res.json());
                                    if (collectionitem.urimeta)
                                        collectionitem.image = DRIVE_PROXY+collectionitem.urimeta.image;
                                }
                            }

                            if (!collectionitem.floorPrice){
                                setLoadingPosition('NFT Floor Value ('+(count+1)+' of '+sholdings.length+')');
                                
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
                                    for (let reitem of final_collection_meta){
                                        if (reitem.helloMoonCollectionId === collectionitem.helloMoonCollectionId){
                                            if (reitem?.floorPrice && reitem.floorPrice > 0){
                                                collectionitem.floorPrice = +reitem.floorPrice;
                                                totalFloor+= +reitem.floorPrice;
                                                floorCached = true;
                                            }
                                        }
                                    }
                                    
                                    if (!floorCached && loadNftFloor){
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
                                                        collectionmeta[i]['urimeta'] = await window.fetch(meta_final.data.uri).then((res: any) => res.json());
                                                        collectionmeta[i]['image'] = DRIVE_PROXY+collectionmeta[i]['urimeta'].image;
                                                    }
                                                }
                                            //}
                                        }
                                    } else {
                                        if (meta_final.data?.uri){
                                            if (loadNftMeta){
                                                collectionmeta[i]['urimeta'] = await window.fetch(meta_final.data.uri).then((res: any) => res.json());
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
    }, [urlParams, publicKey]);

    const fetchTokenPositions = async (loadNftsMeta: boolean) => {
        setLoadingTokens(true);
        await fetchSolanaTokens(loadNftsMeta);
        await fetchSolanaTransactions();
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
                                                {solanaTicker && 
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
                                                }
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Box sx={{ width: '100%' }}>
                                        <Grid container>
                                            <Grid item xs={12} sm={12} md={3} lg={3} textAlign={'center'}
                                                sx={{
                                                    border:'1px solid rgba(0,0,0,0.15)',
                                                    borderRadius:'17px',
                                                    background:'rgba(0,0,0,0.05)'
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
                                                <Grid item xs={12} sm={12} md={3} lg={3} textAlign={'center'}
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
                                                <Grid item xs={12} sm={12} md={3} lg={3} textAlign={'center'}
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
                                                    <Grid item xs={12} sm={12} md={3} lg={3} textAlign={'center'}
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
                                                        } value="1" />

                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                            icon={<Hidden smUp><SwapHorizIcon /></Hidden>}
                                                            label={<Hidden smDown><Typography variant="h6">{t('Transactions')}</Typography></Hidden>
                                                        } value="2" />

                                                        {solanaClosableHoldings && solanaClosableHoldings.length > 0 &&
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><Badge badgeContent={solanaClosableHoldings.length} color="error"><DoNotDisturbIcon /></Badge></Hidden>}
                                                                label={<Hidden smDown><Badge badgeContent={solanaClosableHoldings.length} color="error"><Typography variant="h6">{t('Closable')}</Typography></Badge></Hidden>
                                                            } value="3" />
                                                        }

                                                        {publicKey && publicKey.toBase58() === pubkey &&
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><SwapCallsIcon /></Hidden>}
                                                                label={<Hidden smDown><Typography variant="h6">{t('Swap')}</Typography></Hidden>
                                                            } value="4" />
                                                        }
                                                        
                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                            icon={<Hidden smUp><PercentIcon /></Hidden>}
                                                            label={<Hidden smDown><Typography variant="h6">{t('Staking')}</Typography></Hidden>
                                                        } value="5" />

                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                            icon={<Hidden smUp><AccountBalanceIcon /></Hidden>}
                                                            label={<Hidden smDown><Typography variant="h6">{t('Governance')}</Typography></Hidden>
                                                        } value="6" />

                                                        {HELLO_MOON_BEARER &&
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><HandshakeIcon /></Hidden>}
                                                                label={<Hidden smDown><Typography variant="h6">{t('Lending')}</Typography></Hidden>
                                                            } value="7" />
                                                        }
                                                        
                                                        {solanaDomain && 
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><Badge badgeContent={solanaDomain.length} color="primary"><LanguageIcon /></Badge></Hidden>}
                                                                label={<Hidden smDown><Badge badgeContent={solanaDomain.length} color="primary"><Typography variant="h6">{t('Domains')}</Typography></Badge></Hidden>
                                                            } value="8" />
                                                        }
                                                        
                                                        {publicKey && publicKey.toBase58() === pubkey &&
                                                            <Tab color='inherit' sx={{color:'white', textTransform:'none'}} 
                                                                    icon={<Hidden smUp><StorageIcon /></Hidden>}
                                                                    label={<Hidden smDown><Typography variant="h6">{t('Storage')}</Typography></Hidden>
                                                                } value="9" />
                                                        }

                                                        {ValidateCurve(pubkey) &&
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                    icon={<Hidden smUp><OpacityIcon /></Hidden>}
                                                                    label={<Hidden smDown><Typography variant="h6">{t('Streaming')}</Typography></Hidden>
                                                            } value="10" />
                                                        }
                                                        
                                                        {(SQUADS_API && publicKey && (publicKey.toBase58() === pubkey)) &&
                                                            <Tab sx={{color:'white', textTransform:'none'}}
                                                                    icon={<Hidden smUp><ViewComfyIcon /></Hidden>}
                                                                    label={<Hidden smDown><Typography variant="h6">{t('Squads')}</Typography></Hidden>
                                                            } value="11" />
                                                        }

                                                    </TabList>
                                                    </Box>

                                                    <TabPanel value="1">
                                                    
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
                                                                    <FormControlLabel control={<Switch defaultChecked checked={loadNfts} onChange={setLoadNftToggle} size="small" />} label={<><Typography variant="caption">Load NFT Metadata</Typography></>} />
                                                                    <FormControlLabel control={<Switch defaultChecked checked={loadNftFloor} onChange={setLoadNftFloorToggle} size="small" />} label={<><Typography variant="caption">Load NFT Floor Pricing</Typography></>} />
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
                                                    <TabPanel value="2">
                                                    {solanaTransactions ?
                                                        <List dense={true}>
                                                            {solanaTransactions.length > 0 ? solanaTransactions.map((item: any,key:any) => (
                                                                <>
                                                                    {key > 0 &&
                                                                        <Divider variant="fullWidth" component="li" />
                                                                    }
                                                                    <ListItem key={key}>
                                                                        <>
                                                                            <ListItemText
                                                                                primary={
                                                                                    <>
                                                                                        <ExplorerView address={item.signature} type='tx' title={item.signature}/>
                                                                                        {item?.description &&
                                                                                            <Typography variant='subtitle1' sx={{mt:1}}>
                                                                                                {item?.description}
                                                                                            </Typography>
                                                                                        }
                                                                                        <Typography variant='body2'>
                                                                                            <Tooltip title={formatBlockTime(item.blockTime,true,true)}>
                                                                                                <Button sx={{borderRadius:'17px'}}>
                                                                                                {timeAgo(item.blockTime)}
                                                                                                </Button>
                                                                                            </Tooltip> - {item.type}
                                                                                        </Typography>
                                                                                        
                                                                                        
                                                                                    </>}
                                                                                secondary={
                                                                                    <>
                                                                                        {item?.memo && 
                                                                                            <Typography variant="caption">{item?.memo}</Typography>
                                                                                        }
                                                                                    </>
                                                                                }
                                                                            />
                                                                        </>
                                                                    </ListItem>
                                                                </>
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

                                                    <TabPanel value="3">
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
                                                                            <Typography variant="caption" color='error'>* IMPORTANT: Prior to closing any accounts; verify that you have removed any deposited positions in SPL Governance, Staking, Farming, Streaming services; visit those services and withdraw/transfer positions and deposits from those accounts first, i.e. SPL Governance Council Tokens should be withdrawn from the respective Realms first to avoid any permanent loss of those positions, Streaming services support transfering of streams to a new account</Typography>
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
                                                    
                                                    <TabPanel value="4">
                                                        <IntegratedSwapView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>

                                                    <TabPanel value="5">
                                                        <StakingView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>

                                                    {tokenMap &&
                                                        <TabPanel value="6">
                                                            <GovernanceView pubkey={pubkey} setLoadingPosition={setLoadingPosition} tokenMap={tokenMap} />
                                                        </TabPanel>
                                                    }

                                                    <TabPanel value="7">
                                                        <LendingView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>
                                                    
                                                    <TabPanel value="8">
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
                                                    
                                                    <TabPanel value="9">
                                                        <StorageView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>

                                                    <TabPanel value="10">
                                                        <StreamingPaymentsView pubkey={pubkey} setLoadingPosition={setLoadingPosition} tokenMap={tokenMap} />
                                                    </TabPanel>
                                                    
                                                    <TabPanel value="11">
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