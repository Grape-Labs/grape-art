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

import { getRealm, 
    getRealms, 
    getTokenOwnerRecordsByOwner,
    getTokenOwnerRecord, 
} from '@solana/spl-governance';
//import { ShdwDrive } from "@shadow-drive/sdk";

import { gql } from '@apollo/client'
import gql_client from '../gql_client'

import { programs, tryGetAccount, withSend, findAta } from '@cardinal/token-manager';

import GovernanceDetailsView from './plugins/GovernanceDetails';
import { SquadsView } from './plugins/Squads';
import { GovernanceView } from './plugins/Governance';
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
} from '@mui/material';

import {
    TabContext,
    TabList,
    TabPanel,
} from '@mui/lab';

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

import { ValidateAddress, ValidateCurve, trimAddress, timeAgo, formatBlockTime } from '../utils/grapeTools/WalletAddress'; // global key handling
import { GRAPE_RPC_ENDPOINT, 
    GRAPE_PROFILE, 
    GRAPE_PREVIEW, 
    DRIVE_PROXY,
    HELIUS_API } from '../utils/grapeTools/constants';
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
    const [solanaUSDC, setSolanaUSDC] = React.useState(null);
    const [solanaTransactions, setSolanaTransactions] = React.useState(null);
    const [loadingWallet, setLoadingWallet] = React.useState(false);
    const [loadingTokens, setLoadingTokens] = React.useState(false);
    const [loadingTransactions, setLoadingTransactions] = React.useState(false);
    
    const [loadingStorage, setLoadingStorage] = React.useState(false);
    const [loadingStreamingPayments, setLoadingStreamingPayments] = React.useState(false);
    const [loadingPosition, setLoadingPosition] = React.useState('');
    
    const { publicKey } = useWallet();
    const [pubkey, setPubkey] = React.useState(props.pubkey || null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const ticonnection = new Connection(GRAPE_RPC_ENDPOINT);
    const {handlekey} = useParams<{ handlekey: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlParams = searchParams.get("pkey") || searchParams.get("address") || handlekey;
    const [value, setValue] = React.useState('1');
    const [tokenMap, setTokenMap] = React.useState<Map<string,TokenInfo>>(undefined);
    const [nftMap, setNftMap] = React.useState(null);
    const [selectionModel, setSelectionModel] = React.useState([]);
    const [selectionModelClose, setSelectionModelClose] = React.useState([]);
    const [tokensNetValue, setTokensNetValue] = React.useState(null);

    const { t, i18n } = useTranslation();

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70, hide: true },
        { field: 'mint', headerName: 'Mint', width: 70, align: 'center', hide: true },
        { field: 'logo', headerName: '', width: 50, 
            renderCell: (params) => {
                //console.log(params);
                return (<>
                        <Avatar
                            sx={{backgroundColor:'#222'}}
                                src={
                                    params.value.logo ||
                                    tokenMap.get(params.value.mint)?.logoURI || 
                                    params.value.mint}
                                alt={
                                    tokenMap.get(params.value.mint)?.name || 
                                    params.value.mint}
                        >
                            <QrCode2Icon sx={{color:'white'}} />
                        </Avatar>
                    
                </>);
            }
        },
        { field: 'name', headerName: 'Token', minWidth: 200, flex: 1, },
        { field: 'balance', headerName: 'Balance', width: 130, align: 'right',
            renderCell: (params) => {
                return (params.value)
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
        { field: 'value', headerName: 'Value', width: 130, align: 'right'},
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
                //console.log(params);
                return (
                    <>
                        <Avatar
                            sx={{backgroundColor:'#222'}}
                                src={
                                    params.value.logo ||
                                    tokenMap.get(params.value.mint)?.logoURI || 
                                    params.value.mint}
                                alt={
                                    tokenMap.get(params.value.mint)?.name || 
                                    params.value.mint}
                        >
                            <QrCode2Icon sx={{color:'white'}} />
                        </Avatar>
                </>);
            }
        },
        { field: 'name', headerName: 'Token', minWidth: 250, flex: 1, },
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
      
      
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const fetchSolanaBalance = async () => {
        setLoadingPosition('SOL Balance');
        const response = await ggoconnection.getBalance(new PublicKey(pubkey));
        const converted = await getTokenPrice('SOL','USDC');
        setSolanaUSDC(converted.data.price);
        setSolanaBalance(response);
    }

    const fetchSolanaTransactions = async () => {
        setLoadingTransactions(true);
        setLoadingPosition(' last (100) Transactions');
        
        let helius_results = null;

        if (HELIUS_API){
            const tx: any[] = [];
            const url = "https://api.helius.xyz/v0/addresses/"+pubkey+"/transactions?api-key="+HELIUS_API
            const parseTransactions = async () => {
                const { data } = await axios.get(url)
                console.log("parsed transactions: ", data)

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
        } 
        
        {
            const response = await ggoconnection.getSignaturesForAddress(new PublicKey(pubkey));

            const memos: any[] = [];
            const signatures: any[] = [];
            let counter = 0;
            // get last 100
            for (const value of response){
                if (counter<100){
                    signatures.push(value.signature);
                    memos.push(value.memo);
                }
                counter++;
            }
            const getTransactionAccountInputs2 = await ggoconnection.getParsedTransactions(signatures, 'confirmed');

            

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
                for (const item of helius_results){
                    if ((signatures[cnt] === item.signature) && (item.type !== 'UNKNOWN')){
                        description = item.description + " ("+ item.type+ ")";
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
        }
        
        setLoadingTransactions(false);
    }

    const getGqlNfts = async(publicKeys: any) => {
        
            const GET_NFTS = gql`
                query nftsByMintAddress($addresses: [PublicKey!]!) {
                    nftsByMintAddress(addresses: $addresses) {
                    address
                    name
                    sellerFeeBasisPoints
                    mintAddress
                    primarySaleHappened
                    updateAuthorityAddress
                    description
                    category
                    parser
                    image
                    animationUrl
                    externalUrl
                    }
                }
                `
            
            const using = publicKeys;
            const usequery = GET_NFTS;
            
            return await gql_client
                .query({
                    query: usequery,
                    variables: {
                        addresses: using
                    }
                }).then((res) => {
                    
                    //console.log("res: "+JSON.stringify(res.data.nftsByMintAddress))
                    
                    const response = res.data.nftsByMintAddress;
                    
                    const final = new Array();

                    const nftMapValues = response.reduce(function(map: Map<any,any>, item:any) {
                        map[item.mintAddress] = item;
                        return map;
                    }, new Map())
                    
                    //console.log("final: "+JSON.stringify(final))
                    setGQLMints(nftMapValues)
                    return nftMapValues;
                }).catch((err) => {
                    console.log("ERR: "+JSON.stringify(err))
                })
            //console.log("QUERY: "+JSON.stringify(results))

            //return results;
    }

    const getGqlRealms = async(publicKeys: any) => {
        
        const GET_REALMS = gql`
            query realms($addresses: [PublicKey!], $communityMints: [PublicKey!]) {
                realms(addresses: $addresses, communityMints: $communityMints) {
                address
                communityMint
                votingProposalCount
                authority
                name
                realmConfig {
                    ...RealmConfigFragment
                }
                }
            }    
        `
        
        const using = publicKeys;
        const usequery = GET_REALMS;
        
        return await gql_client
            .query({
                query: usequery,
                variables: {
                    addresses: using
                }
            }).then((res) => {
                
                //console.log("res: "+JSON.stringify(res.data.nftsByMintAddress))
                
                const response = res.data.nftsByMintAddress;
                
                const final = new Array();

                const nftMapValues = response.reduce(function(map: Map<any,any>, item:any) {
                    map[item.mintAddress] = item;
                    return map;
                }, new Map())
                
                //console.log("final: "+JSON.stringify(final))
                setGQLRealms(nftMapValues)
                return nftMapValues;
            }).catch((err) => {
                console.log("ERR: "+JSON.stringify(err))
            })
        //console.log("QUERY: "+JSON.stringify(results))

        //return results;
}

    function clearSelectionModels(){
        try{
            setSelectionModel([]);
            setSelectionModelClose([]);
        }catch(e){console.log("ERR: "+e)}
    }

    const fetchSolanaTokens = async () => {
        setLoadingPosition('Tokens');
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
        const resp = await window.fetch(GRAPE_RPC_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        })
        const json = await resp.json();
        const resultValues = json.result.value
        //return resultValues;

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
        const nftMeta = await fetchNFTMetadata(resultValues);

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

            for (const nft of nftMeta){
                //console.log('meta: '+JSON.stringify(nft));
                if (nft.meta.mint === item.account.data.parsed.info.mint){
                    //console.log("nft: "+JSON.stringify(nft))

                    metadata_decoded = decodeMetadata(nft.data);
                    //console.log("meta_final: "+JSON.stringify(metadata_decoded))
                    
                    name = nft.meta.data.name;
                    metadata = nft.meta.data.uri;
                    // fetch
                    if (nft?.image)
                        logo = nft.image;
                    else if (nft?.urimeta?.image)
                        logo = nft.urimeta?.image;
                    foundMetaName = true;
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
                balance:itemBalance,
                price:item.account.data.parsed.info.tokenAmount.decimals === 0 ? 0 : cgPrice[item?.coingeckoId]?.usd || 0,
                change:item.account.data.parsed.info.tokenAmount.decimals === 0 ? 0 : cgPrice[item?.coingeckoId]?.usd_24h_change || 0,
                value: +itemValue,
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
            for (const nft of nftMeta){
                //console.log('meta: '+JSON.stringify(nft));
                if (nft.meta.mint === item.account.data.parsed.info.mint){
                    //console.log("nft: "+JSON.stringify(nft))
                    
                    name = nft.meta.data.name;
                    metadata = nft.meta.data.uri;
                    // fetch
                    if (nft?.image)
                        logo = nft.image;
                    else if (nft?.urimeta?.image)
                        logo = nft.urimeta?.image;
                    foundMetaName = true;
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
    } 

    const fetchProfilePicture = async () => {
        const { isAvailable, url } = await getProfilePicture(ggoconnection, new PublicKey(pubkey));
        let img_url = url;
        if (url)
            img_url = url.replace(/width=100/g, 'width=256');

        const solcdn = DRIVE_PROXY;
        if (img_url.indexOf(solcdn) > -1){
                img_url = img_url.slice(solcdn.length, img_url.length);
        }

        setProfilePictureUrl(img_url);
    }
    
    const fetchSolanaDomain = async () => {
        setLoadingPosition('SNS Records');
        const domain = await findDisplayName(ggoconnection, pubkey);
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

            //console.log("pushed pdas: "+JSON.stringify(mintsPDAs));
            const final_meta = new Array();
            const metadata = await ggoconnection.getMultipleAccountsInfo(mintsPDAs);
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
    
    const fetchNFTMetadata = async (holdings:any) => {
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
            
            for (let x = 0; x < loops; x++) {
                const tmpcollectionmeta = await getCollectionData(x, sholdings);
                //console.log('tmpcollectionmeta: ' + JSON.stringify(tmpcollectionmeta));
                collectionmeta = collectionmeta.concat(tmpcollectionmeta);
            }

            const mintarr = sholdings
                .map((value: any, index: number) => {
                    return value.account.data.parsed.info.mint;
                });
            
            let nftMap = null;
            if (mintarr){
                //console.log("mintarr: "+JSON.stringify(mintarr))
                const gql_result = await getGqlNfts(mintarr);
                nftMap = gql_result;
                //console.log('gql_results: ' + JSON.stringify(nftMap));
            }
            
            const final_collection_meta: any[] = [];
            for (let i = 0; i < collectionmeta.length; i++) {
                //console.log(i+": "+JSON.stringify(collectionmeta[i])+" --- with --- "+JSON.stringify(collectionmeta[i]));
                if (collectionmeta[i]) {
                    collectionmeta[i]['wallet'] = sholdings[i];
                    try {
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
                                        collectionmeta[i]['urimeta'] = await window.fetch(meta_final.data.uri).then((res: any) => res.json());
                                        collectionmeta[i]['image'] = DRIVE_PROXY+collectionmeta[i]['urimeta'].image;
                                    //}
                                }
                            } 
                        }catch(err){
                            console.log("ERR: "+err);
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

            setNftMap(final_collection_meta);
            return final_collection_meta;
            //console.log('final_collection_meta: ' + JSON.stringify(final_collection_meta));

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

    /*
    const fetchStoragePools = async () => {
        setLoadingStorage(true);
        await fetchStorage();
        setLoadingStorage(false);
    }
    */

    const fetchTokenPositions = async () => {
        setLoadingTokens(true);
        await fetchSolanaTokens();
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
        if (pubkey && tokenMap){
            fetchTokenPositions();
        }
    }, [tokenMap]);

    React.useEffect(() => {
        if (pubkey){
            fetchWalletPositions();
        }
    }, [pubkey]);

    {

        return (
            <Container sx={{mt:4}}>
                    <Box
                        sx={{
                            background: 'rgba(0, 0, 0, 0.60)',
                            borderRadius: '17px',
                            p:2
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
                                        alignItems="center"
                                    > 
                                        <Typography
                                            variant="h5"
                                            color="inherit"
                                            display='flex'
                                            sx={{mb:3}}
                                        >
                                            <SolIcon sx={{fontSize:'20px',mr:1}} />WALLET
                                        </Typography>
                                        {publicKey && pubkey !== publicKey.toBase58() &&
                                            <Button
                                                component={Link} to={`./`}
                                                sx={{borderRadius:'17px'}}
                                            >Show my wallet</Button>
                                        }

                                    </Grid>
                            </Grid>
                            
                            <>
                                {pubkey ?
                                    <>  
                                    <Grid container>
                                        <Typography
                                            variant="h6"
                                        >
                                            {t('ADDRESS')}:
                                        </Typography>   
                                        <List dense={true}>
                                            <ListItem>
                                                <Grid container>
                                                    <Grid item>
                                                        <ExplorerView showSolanaProfile={true} showAddress={true} grapeArtProfile={true} address={pubkey} type='address' shorten={8} hideTitle={false} style='text' color='white' fontSize='14px' />
                                                    </Grid>
                                                </Grid>
                                            </ListItem>
                                        </List>
                                    </Grid>

                                    <Grid container>
                                        <Grid item sm={12} md={4}>
                                            <Typography
                                                variant="h6"
                                            >
                                                SOL:
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
                                                                    <Typography variant='h4'>
                                                                        {solanaBalance  && 
                                                                            <>
                                                                            {solanaBalance/(10 ** 9)}
                                                                            </>
                                                                        }
                                                                    </Typography>}
                                                                secondary={
                                                                    <>
                                                                    {solanaUSDC &&
                                                                        <Typography variant='caption'>
                                                                            {((solanaBalance/(10 ** 9)) * solanaUSDC).toFixed(2)}USDC <i>(1 SOL = {solanaUSDC.toFixed(2)} USDC)</i>
                                                                        </Typography>
                                                                    }
                                                                    </>
                                                                }
                                                            />
                                                        </Grid>

                                                        {publicKey && pubkey === publicKey.toBase58() &&
                                                            <Grid item xs sx={{ml:2}} alignContent='middle' textAlign='center'>
                                                                <SendToken mint={'So11111111111111111111111111111111111111112'} name={'SOL'} logoURI={'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'} balance={new TokenAmount(solanaBalance, 9).format()} conversionrate={0} showTokenName={false} sendType={0} fetchSolanaBalance={fetchSolanaBalance} />
                                                            </Grid>
                                                        }
                                                    </Grid>
                                                </ListItem>
                                            </List>
                                        </Grid>
                                        {solanaHoldings && tokensNetValue && 
                                            <Grid item sm={12} md={4}>
                                                <Typography
                                                    variant="h6"
                                                >
                                                    Token Value:
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
                                                                    <Typography variant='h4'>
                                                                        {(tokensNetValue/solanaUSDC).toFixed(9)}
                                                                    </Typography>}
                                                                secondary={
                                                                    <>
                                                                    {solanaUSDC &&
                                                                        <Typography variant='caption'>
                                                                            {tokensNetValue.toFixed(2)} USDC
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

                                        {solanaHoldings && tokensNetValue && 
                                            <Grid item sm={12} md={4}>
                                                <Typography
                                                    variant="h6"
                                                >
                                                    TTV:
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
                                                                    <Typography variant='h4'>
                                                                        {((tokensNetValue/solanaUSDC) + solanaBalance/(10 ** 9)).toFixed(9)}
                                                                    </Typography>}
                                                                secondary={
                                                                    <>
                                                                    {solanaUSDC &&
                                                                        <Typography variant='caption'>
                                                                            {(((solanaBalance/(10 ** 9)) * solanaUSDC) + tokensNetValue).toFixed(2)} USDC
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
                                    </Grid>

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

                                        {solanaHoldings &&
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
                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                            icon={<Hidden smUp><AccountBalanceIcon /></Hidden>}
                                                            label={<Hidden smDown><Typography variant="h6">{t('Governance')}</Typography></Hidden>
                                                        } value="4" />
                                                        
                                                        {solanaDomain && 
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><Badge badgeContent={solanaDomain.length} color="primary"><LanguageIcon /></Badge></Hidden>}
                                                                label={<Hidden smDown><Badge badgeContent={solanaDomain.length} color="primary"><Typography variant="h6">{t('Domains')}</Typography></Badge></Hidden>
                                                            } value="5" />
                                                        }
                                                        
                                                        {publicKey && publicKey.toBase58() === pubkey &&
                                                            <Tab sx={{color:'white', textTransform:'none'}} 
                                                                    icon={<Hidden smUp><StorageIcon /></Hidden>}
                                                                    label={<Hidden smDown><Typography variant="h6">{t('Storage')}</Typography></Hidden>
                                                                } value="6" />
                                                        }

                                                        <Tab sx={{color:'white', textTransform:'none'}} 
                                                                icon={<Hidden smUp><OpacityIcon /></Hidden>}
                                                                label={<Hidden smDown><Typography variant="h6">{t('Streaming')}</Typography></Hidden>
                                                        } value="7" />

                                                        <Tab sx={{color:'white', textTransform:'none'}} disabled={true}
                                                                icon={<Hidden smUp><ViewComfyIcon /></Hidden>}
                                                                label={<Hidden smDown><Typography variant="h6">{t('Squads')}</Typography></Hidden>
                                                        } value="8" />

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
                                                                                        {item.description &&
                                                                                            <Typography variant='subtitle1' sx={{mt:1}}>
                                                                                                {item.description}
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
                                                                                        {item?.memo && <Typography variant="caption">{item?.memo}</Typography>}
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
                                                                            <BulkBurnClose tokensSelected={selectionModelClose} solanaHoldingRows={solanaClosableHoldingsRows} tokenMap={tokenMap} nftMap={nftMap} fetchSolanaTokens={fetchSolanaTokens} type={1}  />
                                                                        :
                                                                            <Typography variant="caption">Currently limited to 100 token accounts</Typography>
                                                                        }
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        }
                                                    </TabPanel>

                                                    {tokenMap &&
                                                        <TabPanel value="4">
                                                            <GovernanceView pubkey={pubkey} setLoadingPosition={setLoadingPosition} tokenMap={tokenMap} />
                                                        </TabPanel>
                                                    }
                                                    
                                                    <TabPanel value="5">
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
                                                    
                                                    <TabPanel value="6">
                                                        <StorageView pubkey={pubkey} setLoadingPosition={setLoadingPosition} />
                                                    </TabPanel>

                                                    <TabPanel value="7">
                                                        <StreamingPaymentsView pubkey={pubkey} setLoadingPosition={setLoadingPosition} tokenMap={tokenMap} />
                                                    </TabPanel>

                                                    <TabPanel value="8">
                                                        <SquadsView pubkey={pubkey} setLoadingPosition={setLoadingPosition} tokenMap={tokenMap} />
                                                    </TabPanel>

                                                </TabContext>
                                            </Box>
                                        }
                                    </>
                                :
                                    <Typography variant="h5">
                                        Connect your wallet or search an address
                                    </Typography>    
                                }
                            </>
                            
                    </Box>
                </Container>
        );
    }
}