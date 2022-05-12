import '@dialectlabs/react-ui/lib/index.css';
import {
    ChatButton,
    NotificationsButton,
    IncomingThemeVariables,
    defaultVariables,
  } from '@dialectlabs/react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

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
                notifications={[
                    { name: 'Welcome message', detail: 'On thread creation' },
                ]}
                channels={['web3', 'email', 'sms', 'telegram']}
                />
            <ChatButton wallet={wallet} network={'mainnet'} theme={theme} />
        </Box>
    );
}