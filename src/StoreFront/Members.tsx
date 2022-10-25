import { getRealm, getAllTokenOwnerRecords, getTokenOwnerRecordsByOwner } from '@solana/spl-governance';
import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import { ENV, TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import axios from "axios";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

import { 
    tryGetName,
} from '@cardinal/namespaces';

import { CardinalTwitterIdentityResolver } from '@dialectlabs/identity-cardinal';
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

import { formatAmount, getFormattedNumberToLocale } from '../utils/grapeTools/helpers'
import ExplorerView from '../utils/grapeTools/Explorer';
import { getProfilePicture } from '@solflare-wallet/pfp';
import { findDisplayName } from '../utils/name-service';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';

import Chat from '@mui/icons-material/Chat';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import IconButton from '@mui/material/IconButton';

import { ChatNavigationHelpers, useDialectUiId } from '@dialectlabs/react-ui';
import { GRAPE_BOTTOM_CHAT_ID } from '../utils/ui-contants';

import PropTypes from 'prop-types';
import { 
    GRAPE_RPC_ENDPOINT, 
    THEINDEX_RPC_ENDPOINT,
    TWITTER_PROXY } from '../utils/grapeTools/constants';

import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
//import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

const GOVERNANNCE_STATE = {
    0:'Draft',
    1:'Signing Off',
    2:'Voting',
    3:'Succeeded',
    4:'Executing',
    5:'Completed',
    6:'Cancelled',
    7:'Defeated',
    8:'Executing with Errors!',
}

TablePaginationActions.propTypes = {
    count: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
};

function TablePaginationActions(props) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;
  
    const handleFirstPageButtonClick = (event) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event) => {
        onPageChange(event, page - 1);
    };
  
    const handleNextButtonClick = (event) => {
        onPageChange(event, page + 1);
    };
  
    const handleLastPageButtonClick = (event) => {
        onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };
    
    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton
                onClick={handleFirstPageButtonClick}
                disabled={page === 0}
                aria-label="first page"
            >
                {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="previous page"
            >
                {theme.direction === "rtl" ? (
                    <KeyboardArrowRight />
                ) : (
                    <KeyboardArrowLeft />
                )}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
            >
                {theme.direction === "rtl" ? (
                    <KeyboardArrowLeft />
                ) : (
                    <KeyboardArrowRight />
                )}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
            >
                {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
            </IconButton>
        </Box>
    );
  }

function RenderGovernanceMembersTable(props:any) {
    const tokenMap = props.tokenMap;
    const [loading, setLoading] = React.useState(false);
    //const [proposals, setProposals] = React.useState(props.proposals);
    const participating = props.participating;
    const members = props.members;
    const connection = new Connection(GRAPE_RPC_ENDPOINT);//useConnection();
    const { publicKey } = useWallet();
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - members.length) : 0;
    const token = props.token;
    const tokenDecimals = token?.decimals || 6;
    const { navigation, open } = useDialectUiId<ChatNavigationHelpers>(GRAPE_BOTTOM_CHAT_ID);

    const handleChangePage = (event:any, newPage:number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event:any) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    /*
    const getProposals = async (GOVERNANCE_PROGRAM_ID:string) => {
        if (!loading){
            setLoading(true);
            
        }
        setLoading(false);
    }*/

    //React.useEffect(() => { 
        //if (publicKey && !loading && realm)
        //    getProposals(realm);
    //}, [realm]);

    if(loading){
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress sx={{borderRadius:'10px;'}} />
            </Box>
        )
    }
    
    return (
        <Table>
            <TableContainer component={Paper} sx={{background:'none'}}>
                <StyledTable sx={{ minWidth: 500 }} size="small" aria-label="Portfolio Table">
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography variant="caption">Member</Typography></TableCell>
                            <TableCell><Typography variant="caption">Votes</Typography></TableCell>
                            <TableCell><Typography variant="caption">Votes Cast</Typography></TableCell>
                            {/*<TableCell><Typography variant="caption">Outstanding Proposals</Typography></TableCell>*/}
                            <TableCell><Typography variant="caption"></Typography></TableCell>
                            
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/*proposals && (proposals).map((item: any, index:number) => (*/}
                        {members && 
                        <>  
                            {(rowsPerPage > 0
                                ? members.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : members
                            ).map((item:any, index:number) => (
                            <>
                                {item?.pubkey && item?.account &&
                                    <TableRow key={index} sx={{borderBottom:"none"}}>
                                        <TableCell>
                                            <Typography variant="h6">
                                                <ExplorerView showSolanaProfile={true} grapeArtProfile={true} address={item.account.governingTokenOwner.toBase58()} type='address' shorten={8} hideTitle={false} style='text' color='white' fontSize='16px' />
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                               {getFormattedNumberToLocale(formatAmount(parseInt(item.account.governingTokenDepositAmount.toNumber())/Math.pow(10, tokenMap.get(item.account.governingTokenMint?.toBase58())?.decimals || 0)))}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                                {item.account.totalVotesCount}
                                            </Typography>
                                        </TableCell>
                                        {/*
                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                                {item.account.outstandingProposalCount}
                                            </Typography>
                                        </TableCell>
                                        */}
                                        <TableCell>
                                            <Typography variant="h6">
                                               
                                                {ValidateAddress(item.account.governingTokenOwner.toBase58()) &&
                                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        {participating ?
                                                            <Tooltip title="Send a direct message">
                                                                <Button
                                                                    onClick={() => {
                                                                        open();
                                                                        navigation?.showCreateThread(item.account.governingTokenOwner.toBase58());
                                                                    }}
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        borderRadius: '17px',
                                                                        transition:
                                                                            'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                                                                    
                                                                    }}
                                                                >
                                                                    <Chat
                                                                        sx={{ fontSize: 16, color: 'white' }}
                                                                    />
                                                                </Button>
                                                            </Tooltip>
                                                        :
                                                            <Tooltip title="Join this community governance to direct message">
                                                                <Button
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        borderRadius: '17px',
                                                                        transition:
                                                                            'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                                                                    
                                                                    }}
                                                                >
                                                                    <Chat
                                                                        sx={{ fontSize: 16, color: 'white' }}
                                                                    />
                                                                </Button>
                                                            </Tooltip>
                                                        }
                                                    </Box>
                                                }
                                                
                                                

                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                }
                            </>

                        ))}
                        </>
                        }
                    </TableBody>
                    
                    <TableFooter>
                        <TableRow>
                            <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            colSpan={5}
                            count={members && members.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            SelectProps={{
                                inputProps: {
                                'aria-label': 'rows per page',
                                },
                                native: true,
                            }}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            ActionsComponent={TablePaginationActions}
                            />
                        </TableRow>
                    </TableFooter>
                    
                    
                </StyledTable>
            </TableContainer>
        </Table>
    )
}

export function MembersView(props: any) {
    const collectionAuthority = props.collectionAuthority;
    const [loading, setLoading] = React.useState(false);
    const [members, setMembers] = React.useState(null);
    const connection = new Connection(GRAPE_RPC_ENDPOINT)//useConnection();
    const { publicKey } = useWallet();
    const [realm, setRealm] = React.useState(null);
    const [participating, setParticipating] = React.useState(false)
    const [participatingRealm, setParticipatingRealm] = React.useState(null)
    const GOVERNANCE_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';
    const [tokenMap, setTokenMap] = React.useState(null);
    const [tokenArray, setTokenArray] = React.useState(null);
    
    const getTokens = async () => {
        const tarray:any[] = [];
        try{
            const tlp = await new TokenListProvider().resolve().then(tokens => {
                const tokenList = tokens.filterByChainId(ENV.MainnetBeta).getList();
                setTokenMap(tokenList.reduce((map, item) => {
                    tarray.push({address:item.address, decimals:item.decimals})
                    map.set(item.address, item);
                    return map;
                },new Map()));
                setTokenArray(tarray);
            });
        } catch(e){console.log("ERR: "+e)}
    }

    const getGovernanceMembers = async () => {
        if (!loading){
            setLoading(true);
            try{
                
                if (!tokenArray)
                    await getTokens();
                
                const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);
                
                console.log("with governance: "+collectionAuthority.governance);
                
                const ownerRecordsbyOwner = await getTokenOwnerRecordsByOwner(connection, programId, publicKey);
                // check if part of this realm
                var pcp = false;
                for (var realm of ownerRecordsbyOwner){
                    console.log("realm: "+JSON.stringify(realm))
                    if (realm.account.realm.toBase58() === collectionAuthority.governance){
                        pcp = true;
                        setParticipatingRealm(realm);
                    }
                }
                setParticipating(pcp);

                const grealm = await getRealm(new Connection(THEINDEX_RPC_ENDPOINT), new PublicKey(collectionAuthority.governance))
                setRealm(grealm);

                const realmPk = grealm.pubkey;

                //console.log("realm: "+JSON.stringify(realm));
                const trecords = await getAllTokenOwnerRecords(new Connection(THEINDEX_RPC_ENDPOINT), grealm.owner, realmPk)
                //console.log("trecords: "+JSON.stringify(trecords));

                //let sortedResults = trecords.sort((a,b) => (a.account?.outstandingProposalCount < b.account?.outstandingProposalCount) ? 1 : -1);
                //const sortedResults = trecords.sort((a,b) => (a.account?.totalVotesCount < b.account?.totalVotesCount) ? 1 : -1);
                const sortedResults = trecords.sort((a,b) => (a.account?.governingTokenDepositAmount.toNumber() < b.account?.governingTokenDepositAmount.toNumber()) ? 1 : -1);
                
                var memberArray = new Array();
                for (var member of sortedResults){
                    var found = false;
                    if (member.account.governingTokenOwner.toBase58() === 'B98e2BdhvvkxtBTwsu97HCmot93kjg9kEKSVYL6YnjjK')
                        console.log("member: "+JSON.stringify(ma))
                    for (var ma of memberArray){
                        if (ma.account.governingTokenOwner.toBase58() === member.account.governingTokenOwner.toBase58()){
                            found = true;
                        }    
                    }
                    
                    if (!found)
                        memberArray.push(member);
                }

                console.log("ma len: "+memberArray.length);


                //console.log("trecords: "+JSON.stringify(trecords));
                setMembers(sortedResults);
            
            }catch(e){console.log("ERR: "+e)}
        } else{

        }
        setLoading(false);
    }

    React.useEffect(() => { 
        if (publicKey && !loading){   
            getGovernanceMembers();
        }
    }, [publicKey]);
    
    if (publicKey){
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
            if (members){
                return (
                    <Box
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                            overflow: 'hidden',
                            p:4
                        }} 
                    > 
                        {realm &&
                            <>
                                <Typography variant="h4">
                                    {realm.account.name} Governance Members

                                    <Button
                                        size='small'
                                        sx={{ml:1, color:'white', borderRadius:'17px'}}
                                        href={'https://realms.today/dao/'+(collectionAuthority.governanceVanityUrl || collectionAuthority.governance)}
                                        target='blank'
                                    >
                                        <OpenInNewIcon/>
                                    </Button>
                                </Typography>
                            </>
                        }
                        <RenderGovernanceMembersTable members={members} participating={participating} tokenMap={tokenMap} />
                    </Box>
                                
                );
            }else{
                /*
                if (!participating){
                    return (
                        <Box
                            sx={{
                                background: 'rgba(0, 0, 0, 0.6)',
                                borderRadius: '17px',
                                p:4
                            }} 
                        > 
                            <Typography variant="h4">
                                You are not participating in this governance
                            </Typography>
                        </Box>
                    );
                } else {
                    */
                return (<></>);
                
            }
            
        }
    } else{
        // check if participant in this governance
        return (
            <Box
                sx={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '17px',
                    p:4
                }} 
            > 
                Connect your wallet
            </Box>
        )
    }
}