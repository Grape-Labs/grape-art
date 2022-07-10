import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import { ENV, TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as React from 'react';
import BN from 'bn.js';
import { styled, useTheme } from '@mui/material/styles';
import {
  Typography,
  Button,
  Grid,
  Box,
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
} from '@mui/material/';

import {  
    getTokenPrice,
    getCoinGeckoPrice } from '../utils/grapeTools/helpers';

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
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [realm, setRealm] = React.useState(null);
    const [tokenMap, setTokenMap] = React.useState<Map<string,TokenInfo>>(undefined);
    const [tokenPrice, setTokenPrice] = React.useState(null);
    const [coinGeckoPrice,setCoinGeckoPrice] = React.useState(null);

    const fetchTokens = async () => {
        const tokens = await new TokenListProvider().resolve();
        const tokenList = tokens.filterByChainId(ENV.MainnetBeta).getList();
        const tokenMapValue = tokenList.reduce((map, item) => {
            map.set(item.address, item);
            return map;
        }, new Map())
        setTokenMap(tokenMapValue);
    }



    const getTokenInfo = async () => {
        if (!loading){
            setLoading(true);
            try{

                await fetchTokens();

                const tkn = tokenMap.get(collectionAuthority.address);
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
        if (!loading)
            getTokenInfo();
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
                            {token.name}
                        </Typography>
                        <Typography variant="caption">
                            {token.address}
                        </Typography>
                    </>
                    

                    <Box>
                    {JSON.stringify(token)}

                    {tokenPrice &&
                        <>
                            {JSON.stringify(tokenPrice)}
                        </>
                    }

                    {coinGeckoPrice &&
                        <>
                            {JSON.stringify(coinGeckoPrice)}
                        </>
                    }
                    </Box>
                </Box>
                            
            );
        }else{
            return (<></>);
        }
        
    }
}