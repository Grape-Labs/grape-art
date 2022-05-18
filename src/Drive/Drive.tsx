import React, { useEffect } from "react";
import { ShdwDrive } from "@shadow-drive/sdk";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from '@solana/web3.js'
import moment from 'moment';

import { 
    GRAPE_RPC_ENDPOINT
} from '../utils/grapeTools/constants';
import {
    Box,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
} from '@mui/material';

import CloudCircleIcon from '@mui/icons-material/CloudCircle';

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

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
                //const sa = await drive.getStorageAccount(new PublicKey('...'))
                //console.log("existing storage account: "+JSON.stringify(sa))
                
                if (asa){
                    setAccount(asa);
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
                                <List sx={{ width: '100%' }}>
                                {account.map((storageAccount: any, key: number) => (
                                    <ListItem>
                                      <ListItemAvatar>
                                        <Avatar>
                                          <CloudCircleIcon />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText 
                                      primary={`${storageAccount.account.identifier} ${storageAccount.publicKey}`} 
                                      secondary={`${formatBytes(storageAccount.account.storageAvailable)} of ${formatBytes(storageAccount.account.storage)} - ${moment.unix(+storageAccount.account.creationTime).format("MMMM Do YYYY, h:mm a")}`} />
                                    </ListItem>
                                ))}
                                </List>
                            :
                                <>loading...</>
                            }
                        </Grid>
                    </Grid>
                </Box>
        </>
	)
}