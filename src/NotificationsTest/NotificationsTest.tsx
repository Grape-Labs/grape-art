import * as React from 'react';
import {
  Stack,
  Box,
  Button
} from '@mui/material';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { unicastGrapeSolflareMessage, unicastGrapeSolflareMessage2 } from "../utils/walletNotifications/walletNotifications";

export function NotificationsView(){
  
  const {publicKey} = useWallet();

  const handleSendTest = () => {
    unicastGrapeSolflareMessage('Test Notice', 'You have been outbid on grape.art', 'https://www.arweave.net/l3qZrNynwTv79nM4OH74_DOyjICIDF-ymBXa4IUy5d8?ext=png', publicKey.toBase58(), `https://grape.art/preview/5fp3nWXmAWXJuy31PNkCPARk7FPo1hnPfiH69oJtdskW`);
  };
  const handleSendTest2 = () => {
    unicastGrapeSolflareMessage2('Test Notice', 'You have been outbid on grape.art', 'https://www.arweave.net/l3qZrNynwTv79nM4OH74_DOyjICIDF-ymBXa4IUy5d8?ext=png', publicKey.toBase58(), `https://grape.art/preview/5fp3nWXmAWXJuy31PNkCPARk7FPo1hnPfiH69oJtdskW`);
  };

  return (
    <Box
        sx={{
            mt: 6,
            
        }}
    >
      <Box>  
          <Box
              className="grape-art-generic-placeholder-container"
          > 
            {publicKey ?
              <>
                <Stack spacing={2} direction="row">
                    <Button 
                    variant="outlined"
                    onClick={handleSendTest}>Send test notification to {publicKey?.toBase58()}</Button>
                </Stack>

                <Stack spacing={2} direction="row">
                    <Button 
                    variant="outlined"
                    onClick={handleSendTest2}>Send test notification 2 to {publicKey?.toBase58()}</Button>
                </Stack>
              </>
            :
            <>
              Connect your wallet
            </>
            }
          </Box>
        </Box>
      </Box>
  );
}