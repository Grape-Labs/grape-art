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

import { formatAmount, getFormattedNumberToLocale } from '../utils/grapeTools/helpers';
import { getBackedTokenMetadata } from '../utils/grapeTools/strataHelpers';
import ExplorerView from '../utils/grapeTools/Explorer';
import { getProfilePicture } from '@solflare-wallet/pfp';
import { findDisplayName } from '../utils/name-service';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';

import DownloadIcon from '@mui/icons-material/Download';
import AssuredWorkloadIcon from '@mui/icons-material/AssuredWorkload';
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
import { A } from '../utils/auctionHouse/helpers/constants';
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
    const circulatingSupply = props.circulatingSupply;
    const totalDepositedVotes = props.totalDepositedVotes;
    const connection = new Connection(GRAPE_RPC_ENDPOINT);//useConnection();
    const { publicKey } = useWallet();
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - members.length) : 0;
    const token = props.token;
    const governingTokenMint = props?.governingTokenMint;
    const governingTokenDecimals = props?.governingTokenDecimals || 0;
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

    if(loading){
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress sx={{borderRadius:'10px;'}} />
            </Box>
        )
    }
    
    return (
        <TableContainer component={Paper} sx={{background:'none'}}>
            <Table>
                <StyledTable sx={{ minWidth: 500 }} size="small" aria-label="Portfolio Table">
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography variant="caption">Member</Typography></TableCell>
                            <TableCell><Typography variant="caption">Votes</Typography></TableCell>
                            {/*
                            <TableCell><Typography variant="caption">Votes Casted</Typography></TableCell>
                            <TableCell><Typography variant="caption">Council Votes Casted</Typography></TableCell>
                            */}
                            <TableCell><Typography variant="caption">% of Deposited Governance</Typography></TableCell>
                            <TableCell><Typography variant="caption">% of Supply</Typography></TableCell>
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
                                {item &&
                                    <TableRow key={index} sx={{borderBottom:"none"}}>
                                        <TableCell>
                                            <Grid container>
                                                <Grid item>
                                                    <Typography variant="h6">
                                                        <ExplorerView showSolanaProfile={true} grapeArtProfile={true} address={item.governingTokenOwner.toBase58()} type='address' shorten={8} hideTitle={false} style='text' color='white' fontSize='16px' />
                                                    </Typography>
                                                </Grid>
                                                    {item.governingCouncilDepositAmount.toNumber() > 0 &&
                                                        <Grid item>
                                                            <Tooltip title={`Council Member - Votes: ${item.governingCouncilDepositAmount.toNumber()}`}><Button color='inherit' sx={{ml:1,borderRadius:'17px'}}><AssuredWorkloadIcon /></Button></Tooltip>
                                                        </Grid>
                                                    }
                                            </Grid>
                                        </TableCell>
                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                                {governingTokenMint === item.governingTokenMint?.toBase58() ?
                                                    `${getFormattedNumberToLocale(+((item.governingTokenDepositAmount.toNumber())/Math.pow(10, governingTokenDecimals || 0)).toFixed(0))}`
                                                :
                                                    `${getFormattedNumberToLocale(+((item.governingTokenDepositAmount.toNumber())/Math.pow(10, tokenMap.get(item.governingTokenMint?.toBase58())?.decimals || 0)).toFixed(0))}`
                                                }
                                               
                                            </Typography>
                                        </TableCell>
                                        
                                        {/*
                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                                {item.totalVotesCount}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                                {item.councilVotesCount}
                                            </Typography>
                                        </TableCell>
                                        */}

                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                                {circulatingSupply &&
                                                    <>{+item.governingTokenDepositAmount.toNumber() > 0 ?
                                                    ((+item.governingTokenDepositAmount.toNumber()/totalDepositedVotes)*100).toFixed(2)
                                                    :
                                                        <>
                                                        -
                                                        </>
                                                    }
                                                    </>
                                                }%
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                                {circulatingSupply &&
                                                    <>{+item.governingTokenDepositAmount.toNumber() > 0 ?
                                                        ((+item.governingTokenDepositAmount.toNumber()/circulatingSupply.value.amount)*100).toFixed(2)
                                                    :
                                                        <>
                                                        -
                                                        </>
                                                    }
                                                    </>
                                                }%
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
                                               
                                                {ValidateAddress(item.governingTokenOwner.toBase58()) &&
                                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        {participating ?
                                                            <Tooltip title="Send a direct message">
                                                                <Button
                                                                    onClick={() => {
                                                                        open();
                                                                        navigation?.showCreateThread(item.governingTokenOwner.toBase58());
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
            </Table>
        </TableContainer>
    )
}

export function MembersView(props: any) {
    const collectionAuthority = props.collectionAuthority;
    const [loading, setLoading] = React.useState(false);
    const [members, setMembers] = React.useState(null);
    const connection = new Connection(GRAPE_RPC_ENDPOINT)//useConnection();
    const { publicKey, wallet } = useWallet();
    const [realm, setRealm] = React.useState(null);
    const [participating, setParticipating] = React.useState(false)
    const [participatingRealm, setParticipatingRealm] = React.useState(null)
    const GOVERNANCE_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';
    const [tokenMap, setTokenMap] = React.useState(null);
    const [tokenArray, setTokenArray] = React.useState(null);
    const [totalDepositedVotes, setTotalDepositedVotes] = React.useState(null);
    const [totalCouncilVotes, setTotalCouncilVotes] = React.useState(null);
    const [totalParticipants, setTotalParticipants] = React.useState(null);
    const [activeParticipants, setActiveParticipants] = React.useState(null);
    const [votingParticipants, setVotingParticipants] = React.useState(null);
    const [totalVotesCasted, setTotalVotesCasted] = React.useState(null);
    const [totalDepositedCouncilVotes, setDepositedTotalCouncilVotes] = React.useState(null);
    const [governingTokenMint, setGoverningTokenMint] = React.useState(null);
    const [governingTokenDecimals, setGoverningTokenDecimals] = React.useState(null);
    const [circulatingSupply, setCirculatingSupply] = React.useState(null);
    const [csvGenerated, setCSVGenerated] = React.useState(null);
    const getTokens = async () => {
        const tarray:any[] = [];
        try{
            let tmap  = null;
            const tlp = await new TokenListProvider().resolve().then(tokens => {
                const tokenList = tokens.filterByChainId(ENV.MainnetBeta).getList();
                const tokenMp = tokenList.reduce((map, item) => {
                    tarray.push({address:item.address, decimals:item.decimals})
                    map.set(item.address, item);
                    return map;
                },new Map());
                setTokenMap(tokenMp);
                setTokenArray(tarray);
                tmap = tokenMp;
            });
            return tmap;
        } catch(e){console.log("ERR: "+e); return null;}
    }

    

    const getGovernanceMembers = async () => {
        if (!loading){
            setLoading(true);
            try{
                
                const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);
                
                console.log("with governance: "+collectionAuthority.governance);
                
                const ownerRecordsbyOwner = await getTokenOwnerRecordsByOwner(connection, programId, publicKey);
                // check if part of this realm
                let pcp = false;
                for (let ownerRecord of ownerRecordsbyOwner){
                    
                    if (ownerRecord.account.realm.toBase58() === collectionAuthority.governance){
                        pcp = true;
                        setParticipatingRealm(realm);
                    }
                }
                setParticipating(pcp);

                const grealm = await getRealm(new Connection(GRAPE_RPC_ENDPOINT), new PublicKey(collectionAuthority.governance))
                setRealm(grealm);
                //console.log("realm: "+JSON.stringify(grealm))

                setGoverningTokenMint(grealm.account.communityMint.toBase58());
                // with realm check if this is a backed token
                if (tokenMap.get(grealm.account.communityMint.toBase58())){
                    setGoverningTokenDecimals(tokenMap.get(grealm.account.communityMint.toBase58()).decimals);
                } else{
                   const btkn = await getBackedTokenMetadata(grealm.account.communityMint.toBase58(), wallet);
                    if (btkn){
                        setGoverningTokenDecimals(btkn.decimals)
                    } else{
                        setGoverningTokenDecimals(0);
                    }
                }

                const tknSupply = await connection.getTokenSupply(grealm.account.communityMint);

                //const governingMintPromise = await connection.getParsedAccountInfo(grealm.account.communityMint);
                if (tknSupply)
                    setCirculatingSupply(tknSupply);
            
            
                const realmPk = grealm.pubkey;

                const trecords = await getAllTokenOwnerRecords(new Connection(GRAPE_RPC_ENDPOINT), grealm.owner, realmPk)
                
                //console.log("trecords: "+JSON.stringify(trecords));

                //let sortedResults = trecords.sort((a,b) => (a.account?.outstandingProposalCount < b.account?.outstandingProposalCount) ? 1 : -1);
                //const sortedResults = trecords.sort((a,b) => (a.account?.totalVotesCount < b.account?.totalVotesCount) ? 1 : -1);
                
                //const sortedResults = trecords.sort((a,b) => (a.account?.governingTokenDepositAmount.toNumber() < b.account?.governingTokenDepositAmount.toNumber()) ? 1 : -1);
                

                // generate a super array with merged information
                let participantArray = new Array();
                let tVotes = 0;
                let tCouncilVotes = 0;
                let tVotesCasted = 0;
                let tDepositedCouncilVotesCasted = 0;
                let tParticipants = 0;
                let aParticipants = 0;
                let lParticipants = 0;
                let csvFile = '';
                

                for (let record of trecords){
                    //console.log("record: "+JSON.stringify(record));
                    let foundParticipant = false;
                    for (let participant of participantArray){
                        if (participant.governingTokenOwner.toBase58() === record.account.governingTokenOwner.toBase58()){
                            foundParticipant = true;
                            participant.governingTokenMint = (record.account.governingTokenMint.toBase58() !== grealm.account.config?.councilMint.toBase58()) ? record.account.governingTokenMint : participant.governingTokenMint;
                            participant.totalVotesCount = (record.account.governingTokenMint.toBase58() !== grealm.account.config?.councilMint.toBase58()) ? record.account.totalVotesCount : participant.totalVotesCount;
                            participant.councilVotesCount = (record.account.governingTokenMint.toBase58() === grealm.account.config?.councilMint.toBase58()) ? record.account.totalVotesCount : participant.councilVotesCount;
                            participant.governingTokenDepositAmount = (record.account.governingTokenMint.toBase58() !== grealm.account.config?.councilMint.toBase58()) ? record.account.governingTokenDepositAmount : participant.governingTokenDepositAmount;
                            participant.governingCouncilDepositAmount = (record.account.governingTokenMint.toBase58() === grealm.account.config?.councilMint.toBase58()) ? record.account.governingTokenDepositAmount : participant.governingCouncilDepositAmount;
                            
                            if (record.account.governingTokenMint.toBase58() !== grealm.account.config.councilMint.toBase58()){
                                tVotes += record.account.governingTokenDepositAmount.toNumber();//record.account.totalVotesCount;
                                tVotesCasted += record.account.totalVotesCount;//record.account.governingTokenDepositAmount.toNumber();
                            } else{
                                tCouncilVotes += record.account.totalVotesCount;
                                tDepositedCouncilVotesCasted += record.account.governingTokenDepositAmount.toNumber();
                            }
                        }
                    }
                    if (!foundParticipant){
                            //console.log("record: "+JSON.stringify(record));
                            
                            if (grealm.account.config?.councilMint) {
                                participantArray.push({
                                    governingTokenMint:(record.account.governingTokenMint.toBase58() !== grealm.account.config?.councilMint.toBase58()) ? record.account.governingTokenMint : null,
                                    governingTokenOwner:record.account.governingTokenOwner,
                                    totalVotesCount:(record.account.governingTokenMint.toBase58() !== grealm.account.config?.councilMint.toBase58()) ? record.account.totalVotesCount : 0,
                                    councilVotesCount:(record.account.governingTokenMint.toBase58() === grealm.account.config?.councilMint.toBase58()) ? record.account.totalVotesCount : 0,
                                    governingTokenDepositAmount:(record.account.governingTokenMint.toBase58() !== grealm.account?.config.councilMint.toBase58()) ? record.account.governingTokenDepositAmount : new BN(0),
                                    governingCouncilDepositAmount:(record.account.governingTokenMint.toBase58() === grealm.account?.config.councilMint.toBase58()) ? record.account.governingTokenDepositAmount : new BN(0),
                                });

                                if (record.account.governingTokenMint.toBase58() !== grealm.account?.config.councilMint.toBase58()){
                                    tVotes += record.account.governingTokenDepositAmount.toNumber();
                                    tVotesCasted += record.account.totalVotesCount;
                                } else{
                                    tCouncilVotes += record.account.totalVotesCount;
                                    tDepositedCouncilVotesCasted += record.account.governingTokenDepositAmount.toNumber();
                                }
                            } else{
                                participantArray.push({
                                    governingTokenMint:record.account.governingTokenMint,
                                    governingTokenOwner:record.account.governingTokenOwner,
                                    totalVotesCount:record.account.totalVotesCount,
                                    councilVotesCount:0,
                                    governingTokenDepositAmount:record.account.governingTokenDepositAmount,
                                    governingCouncilDepositAmount:new BN(0),
                                });
                                tVotes += record.account.governingTokenDepositAmount.toNumber();
                                tVotesCasted += record.account.totalVotesCount;
                            }
                            if (record.account.totalVotesCount > 0)
                                aParticipants++;
                            if ((record.account.governingTokenDepositAmount.toNumber() > 0) || (record.account.governingTokenDepositAmount.toNumber() > 0))
                                lParticipants++;
                            tParticipants++; // all time
                        
                            if (tParticipants > 1)
                                csvFile += '\r\n';
                            else
                                csvFile = 'Member,Votes\r\n';
                            
                            csvFile += record.account.governingTokenOwner.toBase58()+','+record.account.governingTokenDepositAmount.toNumber();
                
                    }
                }

                const jsonCSVString = encodeURI(`data:text/csv;chatset=utf-8,${csvFile}`);
                //console.log("jsonCSVString: "+JSON.stringify(jsonCSVString));
                
                setCSVGenerated(jsonCSVString);
                
                setTotalDepositedVotes(tVotes > 0 ? tVotes : null);
                setTotalVotesCasted(tVotesCasted > 0 ? tVotesCasted : null);
                setTotalCouncilVotes(tCouncilVotes > 0 ? tCouncilVotes : null);
                setDepositedTotalCouncilVotes(tDepositedCouncilVotesCasted > 0 ? tDepositedCouncilVotesCasted : null);
                setTotalParticipants(tParticipants > 0 ? tParticipants : null);
                setActiveParticipants(lParticipants > 0 ? lParticipants : null);
                setVotingParticipants(aParticipants > 0 ? aParticipants : null);

                //console.log("participantArray: "+JSON.stringify(participantArray));
                const presortedResults = participantArray.sort((a,b) => (a.totalVotesCount > b.totalVotesCount) ? 1 : -1);
                const sortedResults = presortedResults.sort((a,b) => (a.governingTokenDepositAmount.toNumber() < b.governingTokenDepositAmount.toNumber()) ? 1 : -1);

                /*
                var memberArray = new Array();
                for (var member of sortedResults){
                    var found = false;
                    for (var ma of memberArray){
                        if (ma.account.governingTokenOwner.toBase58() === member.account.governingTokenOwner.toBase58()){
                            found = true;
                        }    
                    }
                    
                    if (!found)
                        memberArray.push(member);
                }

                console.log("ma len: "+memberArray.length);
                */

                //console.log("trecords: "+JSON.stringify(trecords));
                setMembers(sortedResults);
            
            }catch(e){console.log("ERR: "+e)}
        }
        setLoading(false);
    }

    React.useEffect(() => { 
        if (tokenMap){   
            getGovernanceMembers();
        }
    }, [tokenMap]);

    React.useEffect(() => { 
        if (publicKey && !loading){   
            getTokens();
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

                                    {csvGenerated &&
                                        <Tooltip title="Download Voter Participation CSV file">
                                            <Button
                                                sx={{ml:1, color:'white', borderRadius:'17px'}}
                                                download={`${(collectionAuthority.governanceVanityUrl || collectionAuthority.governance)}_Governance_Members.csv`}
                                                href={csvGenerated}
                                            >
                                                <DownloadIcon /> CSV
                                            </Button>
                                        </Tooltip>
                                    }
                                </Typography>
                            </>
                        }

                            {(totalDepositedVotes || totalCouncilVotes) &&
                                <Box sx={{ alignItems: 'center', textAlign: 'center',p:1}}>
                                    <Grid container spacing={0}>
                                        <Grid item xs={12} md={6} lg={3} key={1}>
                                            <Box
                                                className='grape-store-stat-item'
                                                sx={{borderRadius:'24px',m:2,p:1}}
                                            >
                                                <Typography variant="body2" sx={{color:'yellow'}}>
                                                    <>Active/Participating/All Participants</>
                                                </Typography>
                                                <Tooltip title={<>
                                                        <strong>Active:</strong> Currently Active Deposited<br/>
                                                        <strong>Participating:</strong> All time Participating votes<br/>
                                                        <strong>All:</strong> Total Lifetime Deposited in Governance</>
                                                    }>
                                                    <Button
                                                        color='inherit'
                                                        sx={{
                                                            borderRadius:'17px'
                                                        }}
                                                    >
                                                        <Typography variant="h3">
                                                            {activeParticipants}/{votingParticipants}/{totalParticipants}
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={6} lg={3} key={2}>
                                            <Box
                                                className='grape-store-stat-item'
                                                sx={{borderRadius:'24px',m:2,p:1}}
                                            >
                                                <Typography variant="body2" sx={{color:'yellow'}}>
                                                    <>Total Votes</>
                                                </Typography>
                                                <Tooltip title={<>
                                                            {totalVotesCasted && <>Total Votes Casted</>}
                                                            {(totalVotesCasted && totalDepositedCouncilVotes) &&
                                                                <>/</>
                                                            }
                                                            {totalCouncilVotes && <>Total Council Votes Casted</>}
                                                        </>
                                                    }>
                                                    <Button
                                                        color='inherit'
                                                        sx={{
                                                            borderRadius:'17px'
                                                        }}
                                                    >
                                                        <Typography variant="h3">
                                                            {totalVotesCasted && <>{totalVotesCasted}</>}
                                                            {(totalVotesCasted && totalDepositedCouncilVotes) &&
                                                                <>/</>
                                                            }
                                                            {totalCouncilVotes && <>{totalCouncilVotes}</>}
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </Box>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6} lg={3} key={3}>
                                            <Box
                                                className='grape-store-stat-item'
                                                sx={{borderRadius:'24px',m:2,p:1}}
                                            >
                                                <Typography variant="body2" sx={{color:'yellow'}}>
                                                    <>Total Votes Deposited</>
                                                </Typography>
                                                <Tooltip title={<>
                                                            {totalVotesCasted && <>Total Votes Deposited</>}
                                                            {(totalVotesCasted && totalDepositedCouncilVotes) &&
                                                                <>/</>
                                                            }
                                                            {totalCouncilVotes && <>Total Council Votes Deposited</>}
                                                        </>
                                                    }>
                                                    <Button
                                                        color='inherit'
                                                        sx={{
                                                            borderRadius:'17px'
                                                        }}
                                                    >
                                                        <Typography variant="h3">
                                                            {totalDepositedVotes &&
                                                                <>
                                                                    {getFormattedNumberToLocale(+((totalDepositedVotes)/Math.pow(10, governingTokenDecimals || 0)).toFixed(0))}
                                                                </>
                                                            }
                                                            {(totalDepositedVotes && totalDepositedCouncilVotes) &&
                                                                <>/</>
                                                            }
                                                            {totalDepositedCouncilVotes && <>{totalDepositedCouncilVotes}</>}
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </Box>
                                        </Grid>
                                        {circulatingSupply && 
                                            <Grid item xs={12} md={6} lg={3} key={4}>
                                                <Box
                                                    className='grape-store-stat-item'
                                                    sx={{borderRadius:'24px',m:2,p:1}}
                                                >
                                                    <Typography variant="body2" sx={{color:'yellow'}}>
                                                        <>% Circulating Supply</>
                                                    </Typography>
                                                    <Tooltip title={<>
                                                            Calculated from the total token circulating supply
                                                        </>
                                                    }>
                                                        <Button
                                                            color='inherit'
                                                            sx={{
                                                                borderRadius:'17px'
                                                            }}
                                                        >
                                                            <Typography variant="h3">
                                                                
                                                                {circulatingSupply.value.amount > 0 ?
                                                                    <>
                                                                        {((totalDepositedVotes/circulatingSupply.value.amount)*100).toFixed(1)}%
                                                                    </>
                                                                :
                                                                    <>-</>
                                                                }
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Box>
                                            </Grid>
                                        }
                                        
                                    </Grid>
                                    {/*
                                    <LinearProgress color={((totalMintsOnCurve)/totalMints*100) < 50 ?'error' : 'success'} variant="determinate" value={(totalMintsOnCurve)/totalMints*100} />
                                        <Typography variant='caption'>
                                            {((totalMintsOnCurve)/totalMints*100).toFixed(0)}% held on a valid wallet address (address on a Ed25519 curve)
                                        </Typography>
                                    */}
                                </Box>
                            }

                        <RenderGovernanceMembersTable members={members} participating={participating} tokenMap={tokenMap} governingTokenMint={governingTokenMint} governingTokenDecimals={governingTokenDecimals} circulatingSupply={circulatingSupply} totalDepositedVotes={totalDepositedVotes} />
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