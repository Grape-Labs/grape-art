import React, { useEffect } from "react";
import { ShdwDrive } from "@shadow-drive/sdk";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Connection, PublicKey } from '@solana/web3.js'
import { 
    GRAPE_RPC_ENDPOINT
} from '../utils/grapeTools/constants';
import {
    Box,
    Grid,
} from '@mui/material';

export function DriveView(props: any){
	const { connection } = useConnection();
	const wallet = useWallet();
	const [account, setAccount] = React.useState(null);

    useEffect(() => {
		(async () => {
			if (wallet?.publicKey) {
				const drive = await new ShdwDrive(new Connection(GRAPE_RPC_ENDPOINT), wallet).init();
                //console.log("drive: "+JSON.stringify(drive));
                
                const asa = await drive.getStorageAccounts(); // .getStorageAccount(wallet.publicKey);
                console.log("all storage accounts: "+JSON.stringify(asa))
                const sa = await drive.getStorageAccount(new PublicKey('4qJn9DbegUmQfP8bsgpUWZQWN4SeMu4S2EcNhSPk5cBf'))
                console.log("existing storage account: "+JSON.stringify(sa))
                
                if (sa){
                    setAccount(sa);
                } else{
                    const storage = await drive.createStorageAccount('grape-test-storage', '1MB')
                    const storedAccount = await drive.getStorageAccounts();
                    setAccount(storedAccount);
                    console.log("new storage account: "+JSON.stringify(storedAccount));
                }
			}
		})();
	}, [wallet?.publicKey])
	
    return (
        <>
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
                    <Grid 
                        container 
                        direction="column" 
                        spacing={2} 
                        alignItems="center"
                        justifyContent={'center'}
                        rowSpacing={8}
                    >
                        
                        <Grid 
                            item xs={12}
                            alignItems="center"
                        >

                            {account ?
                                <>{JSON.stringify(account)}</>
                            :
                                <>loading...</>
                            }
                        </Grid>
                    </Grid>
                </Box>
        </>
	)
}