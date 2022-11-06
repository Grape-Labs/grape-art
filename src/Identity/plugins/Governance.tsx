import React from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
// @ts-ignore
import { PublicKey, Connection } from '@solana/web3.js';

import { 
    getRealms, 
    getTokenOwnerRecordsByOwner,
    getTokenOwnerRecord
} from '@solana/spl-governance';


import GovernanceDetailsView from './GovernanceDetails';
import { TokenAmount } from '../../utils/grapeTools/safe-math';
import { useWallet } from '@solana/wallet-adapter-react';

import {
    Button,
    LinearProgress
} from '@mui/material';

import { GRAPE_RPC_ENDPOINT, 
    THEINDEX_RPC_ENDPOINT, 
    TX_RPC_ENDPOINT
} from '../../utils/grapeTools/constants';


const governancecolumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    { field: 'pubkey', headerName: 'PublicKey', width: 70, hide: true },
    { field: 'realm', headerName: 'Realm', minWidth: 130, flex: 1, align: 'left' },
    { field: 'governingTokenMint', headerName: 'Governing Mint', width: 150, align: 'center'},
    { field: 'governingTokenDepositAmount', headerName: 'Votes', width: 130, align: 'center'},
    { field: 'unrelinquishedVotesCount', headerName: 'Unreliquinshed', width: 130, align: 'center'},
    { field: 'totalVotesCount', headerName: 'Total Votes', width: 130, align: 'center' },
    { field: 'details', headerName: '', width: 150,  align: 'center',
        renderCell: (params) => {
            return (
                <><GovernanceDetailsView governanceToken={params.value}/></>
            )
        }
    },
    { field: 'link', headerName: '', width: 150,  align: 'center',
        renderCell: (params) => {
            return (
                <Button
                    variant='outlined'
                    size='small'
                    component='a'
                    href={`https://realms.today/dao/${params.value}`}
                    target='_blank'
                    sx={{borderRadius:'17px'}}
                >Visit</Button>
            )
        }
    },
  ];

export function GovernanceView(props: any){
    const setLoadingPosition = props.setLoadingPosition;
    const pubkey = props.pubkey;
    const tokenMap = props.tokenMap;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const ticonnection = new Connection(THEINDEX_RPC_ENDPOINT);
    const txonnection = new Connection(TX_RPC_ENDPOINT);
    const [realms, setRealms] = React.useState(null);
    const [governanceRecord, setGovernanceRecord] = React.useState(null);
    const [governanceRecordRows, setGovernanceRecordRows] = React.useState(null);
    const [loadingGovernance, setLoadingGovernance] = React.useState(false);
    const { publicKey } = useWallet();
    const [selectionGovernanceModel, setSelectionGovernanceModel] = React.useState(null);
    
    const fetchGovernance = async () => {
        setLoadingPosition('Governance');
        const GOVERNANCE_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';
        const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);
        
        try{
            console.log("fetching tor ");
            const tor = await getTokenOwnerRecord(txonnection, new PublicKey(pubkey));
            console.log("tor "+JSON.stringify(tor));
        }catch(e){
            console.log("ERR: "+e);
        }

        try{
            //console.log("fetching realms ");
            const rlms = await getRealms(ticonnection, [programId]);
            //console.log("rlms "+JSON.stringify(rlms));

            const uTable = rlms.reduce((acc, it) => (acc[it.pubkey.toBase58()] = it, acc), {})
            setRealms(uTable);
            
            const ownerRecordsbyOwner = await getTokenOwnerRecordsByOwner(ggoconnection, programId, new PublicKey(pubkey));
        
            //console.log("ownerRecordsbyOwner "+JSON.stringify(ownerRecordsbyOwner))
            const governance: any[] = [];
            
            let cnt = 0;
            //console.log("all uTable "+JSON.stringify(uTable))
        
            for (const item of ownerRecordsbyOwner){
                const realm = uTable[item.account.realm.toBase58()];
                //console.log("realm: "+JSON.stringify(realm))
                const name = realm.account.name;
                let votes = item.account.governingTokenDepositAmount.toNumber().toString();
                
                if (realm.account.config?.councilMint?.toBase58() === item?.account?.governingTokenMint?.toBase58()){
                    votes = item.account.governingTokenDepositAmount.toNumber() + ' Council';
                }else{
                    const thisToken = tokenMap.get(item.account.governingTokenMint.toBase58());
                    if (thisToken){
                        votes = (new TokenAmount(+item.account.governingTokenDepositAmount, thisToken.decimals).format())
                    } else{
                        votes = 'NFT';
                    }
                } 

        
                governance.push({
                    id:cnt,
                    pubkey:item.pubkey,
                    realm:name,
                    governingTokenMint:item.account.governingTokenMint,
                    governingTokenDepositAmount:votes,
                    unrelinquishedVotesCount:item.account.unrelinquishedVotesCount,
                    totalVotesCount:item.account.totalVotesCount,
                    details:item.account.realm.toBase58(),
                    link:item.account.realm
                });
                cnt++;
            }
        
            setGovernanceRecord(ownerRecordsbyOwner);
            setGovernanceRecordRows(governance);

        }catch(e){
            console.log("ERR: "+e);
        }
        
    }

    const fetchGovernancePositions = async () => {
        setLoadingGovernance(true);
        await fetchGovernance();
        setLoadingGovernance(false);
    }

    React.useEffect(() => {
        if (pubkey && tokenMap){
            fetchGovernancePositions();
        }
    }, [tokenMap]);

    return(
        <>
        {loadingGovernance ?
            <LinearProgress />
        :
            <>
            {governanceRecord && governanceRecordRows && 
                <div style={{ height: 600, width: '100%' }}>
                    <div style={{ display: 'flex', height: '100%' }}>
                        <div style={{ flexGrow: 1 }}>
                            
                            <DataGrid
                                rows={governanceRecordRows}
                                columns={governancecolumns}
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
                            
                        </div>
                    </div>
                </div>    
            }
            </>
        }
        </>
    );
}