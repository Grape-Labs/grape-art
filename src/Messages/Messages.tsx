import React from 'react';
import '../dialect.css';
//import '@dialectlabs/react-ui/lib/index.css';
import {
    ChatButton,
    NotificationsButton,
    IncomingThemeVariables,
    defaultVariables,
    Inbox as DialectInbox, 
    ThemeProvider
  } from '@dialectlabs/react-ui';
import {
    ApiProvider,
    connected,
    DialectProvider,
    useApi,
} from '@dialectlabs/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { GRAPE_RPC_ENDPOINT, TX_RPC_ENDPOINT, GENSYSGO_RPC_ENDPOINT } from '../utils/grapeTools/constants';

import {
    Box,
  } from '@mui/material';
  import {
    AUCTION_HOUSE_PROGRAM_ID,
    AUCTION_HOUSE_ADDRESS,
  } from '../utils/auctionHouse/helpers/constants';

  export const themeVariables: IncomingThemeVariables = {
    dark: {
      bellButton:
        'w-10 h-10 shadow-xl shadow-neutral-800 border border-neutral-600 hover:shadow-neutral-700 bg-white text-black',
      modal: `${defaultVariables.dark.modal} sm:rounded-3xl shadow-xl shadow-neutral-900 sm:border border-[#ABABAB]/40`, // 0.4 opacity based on trial-and-error
    },
    animations: {
      popup: {
        enter: 'transition-all duration-300 origin-top-right',
        enterFrom: 'opacity-0 scale-75',
        enterTo: 'opacity-100 scale-100',
        leave: 'transition-all duration-100 origin-top-right',
        leaveFrom: 'opacity-100 scale-100',
        leaveTo: 'opacity-0 scale-75',
      },
    },
  };

  function AuthedHome() {
    const wallet = useWallet();
    const isWalletConnected = connected(wallet);
    

    const { setNetwork, setRpcUrl, setWallet } = useApi();
  
    React.useEffect(
      () => setWallet(connected(wallet) ? wallet : null),
      [setWallet, wallet, isWalletConnected]
    );
    React.useEffect(() => setNetwork('mainnet'), [setNetwork]);
    React.useEffect(() => setRpcUrl(null), [setRpcUrl]);
  
    return (
      <div className="dialect">
        <div className="flex flex-col h-screen bg-black">
          <div className="w-full lg:max-w-[1048px] px-6 h-[calc(100vh-8rem)] mt-8 mx-auto">
            <DialectInbox
              wrapperClassName="p-2 h-full overflow-hidden rounded-2xl shadow-2xl shadow-neutral-800 border border-neutral-600"
              wallet={wallet}
            />
          </div>
        </div>
      </div>
    );
  }

export function MessagesView(){
    // ...
    const wallet = useWallet();
    const theme: 'dark' | 'light' = 'dark';
    //const YOUR_PROJECT_PUBLIC_KEY = new PublicKey(AUCTION_HOUSE_ADDRESS);
    const DIALECT_PUBLIC_KEY = new PublicKey(
        'D2pyBevYb6dit1oCx6e8vCxFK9mBeYCRe8TTntk2Tm98'
    );
    
    return (
        <Box
            sx={{ 
                p: 1, 
                mt: 6, 
                mb: 3, 
                width: '100%',
                background: '#13151C',
                borderRadius: '24px'
            }}
        > 
            
            <NotificationsButton
                wallet={wallet}
                network={'mainnet'}
                publicKey={DIALECT_PUBLIC_KEY}
                theme={theme}
                variables={themeVariables}
                rpcUrl={GENSYSGO_RPC_ENDPOINT}
                notifications={[
                    { name: 'Welcome message', detail: 'On thread creation' },
                ]}
                channels={['web3', 'email', 'sms', 'telegram']}
                />
            <ChatButton wallet={wallet} network={'mainnet'} theme={theme} rpcUrl={GENSYSGO_RPC_ENDPOINT} />
        </Box>



    );
}