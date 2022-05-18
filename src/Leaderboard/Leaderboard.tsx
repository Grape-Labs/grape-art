import React, { useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import CyberConnect, { Env, Blockchain } from '@cyberlab/cyberconnect';
import { RankingListResp, Network } from '../utils/cyberConnect/types';
import { rankingListInfoQuery } from '../utils/cyberConnect/query';

import {
    Box,
    Grid,
} from '@mui/material';

export function LeaderboardView(props: any){
	const { connection } = useConnection();
	const wallet = useWallet();
    const [accounts, setAccounts] = React.useState(null);
    const solanaProvider = useWallet();
    const [loading, setLoading] = React.useState(false);
    const [rankingsList, setRankingsList] = React.useState(null);

    const NAME_SPACE = 'Grape';
    const GLOBAL_NAME_SPACE = '';
    const NETWORK = Network.SOLANA;
    const FIRST = 12; // The number of users in followings/followers list for each fetch

    const cyberConnect = new CyberConnect({
        namespace: NAME_SPACE,
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: "",//solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    // Get the current user followings and followers list
    const initRankingsListInfo = async () => {
        setLoading(true);
        
        const resp = await rankingListInfoQuery({
            namespace: GLOBAL_NAME_SPACE,
            network: NETWORK,
            type: 'FOLLOW'
        });
        console.log("rsp: "+JSON.stringify(resp));
        if (resp) {
            setRankingsList(resp);
        }
        
        setLoading(false);
    };
    
    useEffect(() => {
		(async () => {
			initRankingsListInfo();
		})();
	}, []);
	
    return (
        <Box
            sx={{mt:10}}
        >
            {!loading && rankingsList ?
                <>{JSON.stringify(rankingsList)}!</>
            :
                <>loading...</>
            }
        </Box>
	)
}