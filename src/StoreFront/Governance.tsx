import { getRealm, getAllProposals, getProposalsByGovernance } from '@solana/spl-governance';
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

//import {formatAmount, getFormattedNumberToLocale} from '../Meanfi/helpers/ui';
//import { PretifyCommaNumber } from '../../components/Tools/PretifyCommaNumber';

import moment from 'moment';

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

import PropTypes from 'prop-types';
import { GRAPE_RPC_ENDPOINT, THEINDEX_RPC_ENDPOINT } from '../utils/grapeTools/constants';
import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

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

function RenderGovernanceTable(props:any) {
    const [loading, setLoading] = React.useState(false);
    //const [proposals, setProposals] = React.useState(props.proposals);
    const proposals = props.proposals;
    const token = props.token;
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const tokenDecimals = token?.decimals || 6;

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - proposals.length) : 0;

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
                                <TableCell><Typography variant="caption">Name</Typography></TableCell>
                                <TableCell align="center" sx={{width:"1%"}}><Typography variant="caption">Yes</Typography></TableCell>
                                <TableCell align="center" sx={{width:"1%"}}><Typography variant="caption">No</Typography></TableCell>
                                <TableCell align="center" sx={{width:"1%"}}><Typography variant="caption">Status</Typography></TableCell>
                                {/*
                                <TableCell align="center"><Typography variant="caption">Ending</Typography></TableCell>
                                */}
                                <TableCell align="center"><Typography variant="caption">Vote</Typography></TableCell>
                                
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/*proposals && (proposals).map((item: any, index:number) => (*/}
                            {proposals && 
                            <>  
                                {(rowsPerPage > 0
                                    ? proposals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : proposals
                                ).map((item:any, index:number) => (
                                <>
                                    {console.log("item: "+JSON.stringify(item))}
                                    {item?.pubkey && item?.account &&
                                        <TableRow key={index} sx={{borderBottom:"none"}}>
                                            <TableCell>
                                                <Typography variant="h6">
                                                {item.account?.name}
                                                {item.account?.descriptionLink && 
                                                    <Tooltip title={item.account?.descriptionLink}>
                                                        <Button sx={{ml:1,borderRadius:'17px'}}><HelpOutlineIcon sx={{ fontSize:16, color:'white' }}/></Button>
                                                    </Tooltip>
                                                }
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.account?.options && item.account?.options[0]?.voteWeight && 
                                                    <Typography variant="h6">
                                                        {console.log("vote: "+JSON.stringify(item.account))}
                                                        <Tooltip title={item.account?.options[0].voteWeight.toNumber() <= 1 ?
                                                            <>
                                                                {item.account?.options[0].voteWeight.toNumber()}
                                                            </>
                                                            :
                                                            <>
                                                                {(item.account?.options[0].voteWeight.toNumber()/Math.pow(10, tokenDecimals)).toFixed(0)}
                                                            </>
                                                            }
                                                        >
                                                            <Button sx={{color:'white'}}>
                                                                {item.account?.options[0].voteWeight.toNumber() > 0 ?
                                                                <>
                                                                {`${(((item.account?.options[0].voteWeight.toNumber()/Math.pow(10, tokenDecimals))/((item.account?.denyVoteWeight.toNumber()/Math.pow(10, tokenDecimals))+(item.account?.options[0].voteWeight.toNumber()/Math.pow(10, tokenDecimals))))*100).toFixed(2)}%`}
                                                                </>
                                                                :
                                                                <>0%</>
}
                                                            </Button>
                                                        </Tooltip>
                                                    </Typography>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {item.account?.denyVoteWeight && 
                                                    <Typography variant="h6">
                                                        <Tooltip title={item.account?.denyVoteWeight.toNumber() <= 1 ?
                                                            <>
                                                                {item.account?.denyVoteWeight.toNumber()}
                                                            </>
                                                            :
                                                            <>
                                                                {(item.account?.denyVoteWeight.toNumber()/Math.pow(10, tokenDecimals)).toFixed(0)}
                                                            </>
                                                            }
                                                        >
                                                            <Button sx={{color:'white'}}>
                                                                {item.account?.denyVoteWeight.toNumber() > 0 ?
                                                                <>
                                                                {`${(((item.account?.denyVoteWeight.toNumber()/Math.pow(10, tokenDecimals))/((item.account?.denyVoteWeight.toNumber()/Math.pow(10, tokenDecimals))+(item.account?.options[0].voteWeight.toNumber()/Math.pow(10, tokenDecimals))))*100).toFixed(2)}%`}
                                                                </>:
                                                                <>0%</>
                                                                }
                                                            </Button>
                                                        </Tooltip>
                                                    </Typography>
                                                }
                                            </TableCell>
                                            <TableCell  align="center">
                                                <Typography variant="h6">
                                                    {GOVERNANNCE_STATE[item.account?.state]}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="caption">
                                                    {item.account?.votingCompletedAt ?
                                                    (
                                                        <Typography variant="caption">
                                                            <Tooltip title={`Started: ${item.account?.votingAt && (moment.unix((item.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))} - Ended: ${item.account?.votingAt && (moment.unix((item.account?.votingCompletedAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}>
                                                                <Button sx={{color:'white',borderRadius:'17px'}}>
                                                                    {item.account?.votingAt && (moment.unix((item.account?.votingCompletedAt).toNumber()).format("MMMM D, YYYY"))}
                                                                </Button>
                                                            </Tooltip>
                                                        </Typography>
                                                    ): (<>
                                                        { item.account?.state === 2 ?
                                                            <Tooltip title={`Started: ${item.account?.votingAt && (moment.unix((item.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}>
                                                                <Button sx={{color:'white',borderRadius:'17px'}}>
                                                                    <TimerIcon sx={{ fontSize:"small"}} />
                                                                </Button>
                                                            </Tooltip>
                                                        : 
                                                            <Tooltip title={`Started: ${item.account?.votingAt && (moment.unix((item.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}>
                                                                <Button sx={{color:'white',borderRadius:'17px'}}>
                                                                    <CancelOutlinedIcon sx={{ fontSize:"small", color:"red"}} />
                                                                </Button>
                                                            </Tooltip>
                                                        }
                                                        </>
                                                    )}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    }
                                </>

                            ))}
                            {/*emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                    <TableCell colSpan={5} />
                                </TableRow>
                            )*/}
                            </>
                            }
                        </TableBody>
                        
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                                colSpan={5}
                                count={proposals && proposals.length}
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

export function GovernanceView(props: any) {
    const collectionAuthority = props.collectionAuthority;
    const [loading, setLoading] = React.useState(false);
    const [tokenMap, setTokenMap] = React.useState(null);
    const [realm, setRealm] = React.useState(null);
    const [tokenArray, setTokenArray] = React.useState(null);
    const [token, setToken] = React.useState(null);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [proposals, setProposals] = React.useState(null);
    
    const GOVERNANCE_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';

    const getTokens = async () => {
        const tarray:any[] = [];
        try{
        
            const tlp = await new TokenListProvider().resolve().then(tokens => {
                const tokenList = tokens.filterByChainId(ENV.MainnetBeta).getList();
                //console.log("tokenList: "+JSON.stringify(tokenList));
                setTokenMap(tokenList.reduce((map, item) => {
                    tarray.push({address:item.address, decimals:item.decimals})
                    map.set(item.address, item);
                    return map;
                },new Map()));
                setTokenArray(tarray);
                //console.log("tokenMap::: "+JSON.stringify(tokenArray))
            });
        } catch(e){console.log("ERR: "+e)}
    }

    const getGovernance = async () => {
        if (!loading){
            setLoading(true);
            try{

                console.log("with governance: "+collectionAuthority.governance);
                
                const grealm = await getRealm(new Connection(THEINDEX_RPC_ENDPOINT), new PublicKey(collectionAuthority.governance))
                setRealm(grealm);
                console.log("realm: "+JSON.stringify(grealm));

                //const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);

                //const gpbgprops = await getProposalsByGovernance(new Connection(THEINDEX_RPC_ENDPOINT), programId, new PublicKey(collectionAuthority.governancePublicKey || collectionAuthority.governance));
                //console.log("gpbgprops: "+JSON.stringify(gpbgprops));
                
                const realmPk = grealm.pubkey;
                const gprops = await getAllProposals(new Connection(THEINDEX_RPC_ENDPOINT, "recent"), grealm.owner, realmPk);
                
                let allprops: any[] = [];
                for (let props of gprops){
                    for (let prop of props){
                        if (prop){
                            allprops.push(prop);
                        }
                    }
                }

                const sortedResults = allprops.sort((a:any, b:any) => (a.account?.votingAt != null && b.account?.votingAt != null && a.account?.votingAt.toNumber() < b.account?.votingAt.toNumber()) ? 1 : -1)
                //const sortedResults = allprops.sort((a,b) => (a.account?.votingAt.toNumber() < b.account?.votingAt.toNumber()) ? 1 : -1);
                
                console.log("allprops: "+JSON.stringify(allprops));

                setProposals(sortedResults);

                if (!tokenArray)
                    await getTokens();

                
                /*
                try{
                    let decimals = 0;
                    for (var item of tokenArray){
                        if (item?.address === tokenOwnerRecordsByOwner[index].account.governingTokenMint.toBase58())
                            decimals = item.decimals;
                    }
                    console.log(tokenOwnerRecordsByOwner[index].account.governingTokenMint.toBase58()+" found: "+decimals);
    
                    setToken({address:tokenOwnerRecordsByOwner[index].account.governingTokenMint.toBase58(), decimals:decimals});
                } catch(e){
                    setToken({address:tokenOwnerRecordsByOwner[index].account.governingTokenMint.toBase58(),decimals:0})
                }
                */
                

            }catch(e){console.log("ERR: "+e)}
        } else{

        }
        setLoading(false);
    }

    React.useEffect(() => { 
        if (publicKey && !loading)
            getGovernance();
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
            if (proposals){
                return (
                    <Box
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                            p:4
                        }} 
                    > 
                        {realm &&
                            <>
                            <Typography variant="h4">
                                {realm.account.name}

                                <Button
                                    size='small'
                                    sx={{ml:1, color:'white', borderRadius:'17px'}}
                                    href={'https://realms.today/dao/'+collectionAuthority.governanceVanityUrl}
                                >
                                    <OpenInNewIcon/>
                                </Button>
                            </Typography>
                            {/*
                            <Typography variant="caption">
                                <Tooltip title={
                                    <>
                                        Council Mint: {realm.account.config.councilMint.toBase58()}<br/>
                                        Community Mint Max Vote Weight: {realm.account.config.communityMintMaxVoteWeightSource.value.toNumber()/1000000}<br/>
                                        <>Min Community Tokens to Create Governance: {realm.account.config.minCommunityTokensToCreateGovernance.toNumber()/1000000}</>
                                    </>
                                }>
                                    <Button>
                                    {realm.pubkey.toBase58()}
                                    </Button>
                                </Tooltip>
                            </Typography>
                            */}
                            </>
                        }

                        <RenderGovernanceTable proposals={proposals} />
                    </Box>
                                
                );
            }else{
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