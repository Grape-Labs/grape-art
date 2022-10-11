import { getRealm, getAllProposals, getGovernance, getTokenOwnerRecordsByOwner, getVoteRecord, getRealmConfigAddress, getGovernanceAccount, getAccountTypes, GovernanceAccountType, tryGetRealmConfig  } from '@solana/spl-governance';
import { getVoteRecords } from '../utils/governanceTools/getVoteRecords';
import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import { ENV, TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import {
  Typography,
  Button,
  Grid,
  Box,
  Paper,
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TablePagination,
  Tooltip,
  LinearProgress,
  DialogTitle,
  Dialog,
  DialogContent,
} from '@mui/material/';

import moment from 'moment';

import CloseIcon from '@mui/icons-material/Close';
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
import { formatAmount, getFormattedNumberToLocale } from '../utils/grapeTools/helpers'
//import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

export interface DialogTitleProps {
    id: string;
    children?: React.ReactNode;
    onClose: () => void;
}
  
const BootstrapDialogTitle = (props: DialogTitleProps) => {
    const { children, onClose, ...other } = props;
  
    return (
      <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
        {children}
        {onClose ? (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
    );
  };

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
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
    8:'Executing w/errors!',
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
    const collectionAuthority = props.collectionAuthority;
    const proposals = props.proposals;
    const nftBasedGovernance = props.nftBasedGovernance;
    const token = props.token;
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
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

    const filecolumns: GridColDef[] = [
        { field: 'pubkey', headerName: 'PublicKey', width: 70, hide: true},
        { field: 'proposal', headerName: 'Proposal', width: 70, hide: true},
        { field: 'governingTokenOwner', headerName: 'governingTokenOwner', width: 70},
        { field: 'voteType', headerName: 'voteType', width: 70},
        { field: 'voterWeight', headerName: 'voterWeight', width: 70},
    ];

    function GetParticipants(props: any){
        const thisitem = props.item;
        const [solanaVotingResultRows,setSolanaVotingResultRows] = React.useState(null);
        const [open, setOpen] = React.useState(false);
        //const [thisGovernance, setThisGovernance] = React.useState(null);

        const handleCloseDialog = () => {
            setOpen(false);
        }
    
        const handleClickOpen = () => {
            setOpen(true);
            getVotingParticipants();
        };
    
        const handleClose = () => {
            setOpen(false);
        };

        const getVotingParticipants = async () => {
            
            //const governance = await getGovernance(connection, thisitem.account.governance);

            console.log("Sending with Governance "+thisitem.owner + " with Proposal PK "+thisitem.pubkey);

            const voteRecord = await getVoteRecords({
                connection: connection,
                programId: new PublicKey(thisitem.owner),
                proposalPk: new PublicKey(thisitem.pubkey),
            });

            const votingResults = [];
            if (voteRecord?.value){
                for (const item of voteRecord.value){
                    votingResults.push({
                        pubkey:item.pubkey.toBase58(),
                        proposal:item.account.proposal.toBase58(),
                        governingTokenOwner:item.account.governingTokenOwner.toBase58(),
                        voteType:item.account.vote.voteType, // 0 yes - 1 no
                        voterWeight:item.account.voterWeight,
                    })
                }
            }
            
            setSolanaVotingResultRows(votingResults)
            console.log("Vote Record: "+JSON.stringify(voteRecord));

            //setVotingParticipants(governance);
            //const starts = thisitem.account?.votingAt.toNumber();
            ///const ends = thisitem.account?.votingAt.toNumber()+governance?.account?.config?.maxVotingTime;
            //console.log("ending at : " + moment.unix(thisitem.account?.votingAt.toNumber()+governance?.account?.config?.maxVotingTime).format("MMMM Da, YYYY, h:mm a"));
        }
        
        return (
            <>
                <Tooltip title='Get Voting Participants for this proposal'>
                    <Button 
                        onClick={handleClickOpen}
                        sx={{color:'white',textTransform:'none',borderRadius:'17px'}}>
                        VR
                    </Button>
                </Tooltip>

                <BootstrapDialog 
                    maxWidth={"lg"}
                    open={open} onClose={handleClose}
                    PaperProps={{
                        style: {
                            background: '#13151C',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px'
                        }
                        }}
                    >
                    <BootstrapDialogTitle id="create-storage-pool" onClose={handleCloseDialog}>
                        {t('Voting Results')}
                    </BootstrapDialogTitle>
                        <DialogContent>
                            
                            <div style={{ height: 600, width: '100%' }}>
                                <div style={{ display: 'flex', height: '100%' }}>
                                    <div style={{ flexGrow: 1 }}>
                                            
                                            <DataGrid
                                                rows={solanaVotingResultRows}
                                                columns={votingresultcolumns}
                                                pageSize={25}
                                                rowsPerPageOptions={[]}
                                                initialState={{
                                                    sorting: {
                                                        sortModel: [{ field: 'file', sort: 'desc' }],
                                                    },
                                                }}
                                                sx={{
                                                    borderRadius:'17px',
                                                    borderColor:'rgba(255,255,255,0.25)',
                                                    '& .MuiDataGrid-cell':{
                                                        borderColor:'rgba(255,255,255,0.25)'
                                                    }}}
                                                sortingOrder={['asc', 'desc', null]}
                                                disableSelectionOnClick
                                            />
                                    </div>
                                </div>
                            </div>
                            
                        </DialogContent> 
                </BootstrapDialog>
            </>
        )
    }

    function GetProposalStatus(props: any){
        const thisitem = props.item;
        const [thisGovernance, setThisGovernance] = React.useState(null);

        const getGovernanceProps = async () => {
            const governance = await getGovernance(connection, thisitem.account.governance);
            setThisGovernance(governance);
            //const starts = thisitem.account?.votingAt.toNumber();
            ///const ends = thisitem.account?.votingAt.toNumber()+governance?.account?.config?.maxVotingTime;
            //console.log("ending at : " + moment.unix(thisitem.account?.votingAt.toNumber()+governance?.account?.config?.maxVotingTime).format("MMMM Da, YYYY, h:mm a"));

            console.log("Single governance: "+JSON.stringify(governance));
        }

        React.useEffect(() => { 
            if (thisitem.account?.state === 2){ // if voting state
                getGovernanceProps()
            }
        }, [thisitem]);

        // calculate time left
        // /60/60/24 to get days
        
        return (
            <>
                <TableCell  align="center">
                    <Typography variant="h6">
                        <Tooltip title={
                            
                            <>
                            {thisGovernance?.account?.config?.maxVotingTime ?
                                `Ending ${moment.unix(thisitem.account?.votingAt.toNumber()+thisGovernance?.account?.config?.maxVotingTime).fromNow()}`
                            :
                                `Status`
                            }    
                            </>
                            }>
                            <Button sx={{color:'white',textTransform:'none'}}>
                                {GOVERNANNCE_STATE[thisitem.account?.state]}
                            </Button>
                        </Tooltip>
                    </Typography>
                </TableCell>
            </>
        )
    }

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
                                <TableCell align="center"><Typography variant="caption">Participants</Typography></TableCell>
                                
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
                                    {/*console.log("item: "+JSON.stringify(item))*/}
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
                                                        {/*console.log("vote: "+JSON.stringify(item.account))*/}
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
                                                {item.account?.options && item.account?.options[0]?.voterWeight && 
                                                    <Typography variant="h6">
                                                        {/*console.log("vote: "+JSON.stringify(item.account))*/}
                                                        <Tooltip title={item.account?.options[0].voterWeight.toNumber() <= 1 ?
                                                            <>
                                                                {item.account?.options[0].voterWeight.toNumber()}
                                                            </>
                                                            :
                                                            <>
                                                                {(item.account?.options[0].voterWeight.toNumber()/Math.pow(10, tokenDecimals)).toFixed(0)}
                                                            </>
                                                            }
                                                        >
                                                            <Button sx={{color:'white'}}>
                                                                {item.account?.options[0].voterWeight.toNumber() > 0 ?
                                                                <>
                                                                {`${(((item.account?.options[0].voterWeight.toNumber()/Math.pow(10, tokenDecimals))/((item.account?.denyVoteWeight.toNumber()/Math.pow(10, tokenDecimals))+(item.account?.options[0].voterWeight.toNumber()/Math.pow(10, tokenDecimals))))*100).toFixed(2)}%`}
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
                                            <GetProposalStatus item={item}/>
                                            <TableCell align="center">
                                                <Typography variant="caption">
                                                    {item.account?.votingCompletedAt ?
                                                    (
                                                        <Typography variant="caption">
                                                            <Tooltip title={`Started: ${item.account?.votingAt && (moment.unix((item.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))} - Ended: ${item.account?.votingAt && (moment.unix((item.account?.votingCompletedAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}>
                                                                <Button sx={{color:'white',borderRadius:'17px'}} href={`https://realms.today/dao/${collectionAuthority.governanceVanityUrl || collectionAuthority.governance}/proposal/${item?.pubkey}`} target='_blank'>
                                                                    {item.account?.votingAt && (moment.unix((item.account?.votingCompletedAt).toNumber()).format("MMMM D, YYYY"))}
                                                                </Button>
                                                            </Tooltip>
                                                        </Typography>
                                                    ): (<>
                                                        { item.account?.state === 2 ?
                                                            <Tooltip title={`Started: ${item.account?.votingAt && (moment.unix((item.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}>
                                                                <Button sx={{color:'white',borderRadius:'17px'}} href={`https://realms.today/dao/${collectionAuthority.governanceVanityUrl || collectionAuthority.governance}/proposal/${item?.pubkey}`} target='_blank'>
                                                                    <TimerIcon sx={{ fontSize:"small"}} />
                                                                </Button>
                                                            </Tooltip>
                                                        : 
                                                            <Tooltip title={`Started: ${item.account?.votingAt && (moment.unix((item.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}>
                                                                <Button sx={{color:'white',borderRadius:'17px'}} href={`https://realms.today/dao/${collectionAuthority.governanceVanityUrl || collectionAuthority.governance}/proposal/${item?.pubkey}`} target='_blank'>
                                                                    <CancelOutlinedIcon sx={{ fontSize:"small", color:"red"}} />
                                                                </Button>
                                                            </Tooltip>
                                                        }
                                                        </>
                                                    )}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <GetParticipants item={item} />
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
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [proposals, setProposals] = React.useState(null);
    const [participating, setParticipating] = React.useState(false)
    const [participatingRealm, setParticipatingRealm] = React.useState(null)
    const [nftBasedGovernance, setNftBasedGovernance] = React.useState(false);

    const GOVERNANCE_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';

    function VotingPower(props: any){
        const tArray = props.tokenArray;
        const pRealm = props.participatingRealm;
        const [thisToken, setThisToken] = React.useState(null);

        React.useEffect(() => { 
            if (tArray){
                for (const token of tArray){
                    if (token.address === participatingRealm?.account?.governingTokenMint.toBase58()){
                        setThisToken(token);
                    }
                }
            }
        }, [pRealm]);

        return (
            <>
            {thisToken && 
                <>
                    {getFormattedNumberToLocale(formatAmount(parseInt(participatingRealm?.account?.governingTokenDepositAmount)/Math.pow(10, +thisToken?.decimals)))} votes
                </>
            }
            </>
        );

    }

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

    const getGovernance = async () => {
        if (!loading){
            setLoading(true);
            try{

                if (!tokenArray)
                    await getTokens();
                    
                console.log("with governance: "+collectionAuthority.governance);
                const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);

                const ownerRecordsbyOwner = await getTokenOwnerRecordsByOwner(connection, programId, publicKey);
                // check if part of this realm
                let pcp = false;
                let partOf = null;
                for (const realm of ownerRecordsbyOwner){
                    //console.log("owner record realm: "+JSON.stringify(realm))
                    if (realm.account.realm.toBase58() === collectionAuthority.governance){
                        pcp = true;
                        partOf = realm;
                        setParticipatingRealm(realm);
                        console.log("realm: "+JSON.stringify(realm))
                    }
                }
                setParticipating(pcp);

                const grealm = await getRealm(new Connection(THEINDEX_RPC_ENDPOINT), new PublicKey(collectionAuthority.governance))
                setRealm(grealm);
                console.log("B realm: "+JSON.stringify(grealm));

                const realmPk = grealm.pubkey;

                if (grealm?.account?.config?.useCommunityVoterWeightAddin){
                    const realmConfigPk = await getRealmConfigAddress(
                        programId,
                        realmPk
                    )
                    try{
                        const realmConfig = await tryGetRealmConfig(
                            connection,
                            programId,
                            realmPk,//realmConfigPk,//realmPk
                        )
                        
                        console.log("config: "+JSON.stringify(realmConfig));
                        //setRealmConfig(realmConfigPK)

                        if (realmConfig && realmConfig?.account && realmConfig?.account?.communityTokenConfig.maxVoterWeightAddin){
                            if (realmConfig?.account?.communityTokenConfig.maxVoterWeightAddin.toBase58() === 'GnftV5kLjd67tvHpNGyodwWveEKivz3ZWvvE3Z4xi2iw'){ // NFT based community
                                setNftBasedGovernance(true);
                            }
                        }
                    }catch(errs){
                        console.log("ERR: "+errs)
                    }
                }

                //const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);

                //const gpbgprops = await getProposalsByGovernance(new Connection(THEINDEX_RPC_ENDPOINT), programId, new PublicKey(collectionAuthority.governancePublicKey || collectionAuthority.governance));
                //console.log("gpbgprops: "+JSON.stringify(gpbgprops));
                
                
                const gprops = await getAllProposals(new Connection(THEINDEX_RPC_ENDPOINT), grealm.owner, realmPk);
                
                const allprops: any[] = [];
                for (const props of gprops){
                    for (const prop of props){
                        if (prop){
                            allprops.push(prop);
                        }
                    }
                }

                //const sortedResults = allprops.sort((a:any, b:any) => (a.account?.votingAt != null && b.account?.votingAt != null && a.account?.votingAt.toNumber() < b.account?.votingAt.toNumber()) ? 1 : -1)
                const sortedResults = allprops.sort((a:any, b:any) => ((b.account?.votingAt != null ? b.account?.votingAt : 0) - (a.account?.votingAt != null ? a.account?.votingAt : 0)))
                
                //const sortedResults = allprops.sort((a,b) => (a.account?.votingAt.toNumber() < b.account?.votingAt.toNumber()) ? 1 : -1);
                
                console.log("allprops: "+JSON.stringify(allprops));

                setProposals(sortedResults);

            }catch(e){console.log("ERR: "+e)}
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
                            overflow: 'hidden',
                            p:4
                        }} 
                    > 
                        {realm &&
                            <>
                            <Grid container>
                                <Grid item xs={12} sm={6} container justifyContent="flex-start">
                                    <Typography variant="h4">
                                        {realm.account.name}

                                        <Button
                                            size='small'
                                            sx={{ml:1, color:'white', borderRadius:'17px'}}
                                            href={'https://realms.today/dao/'+(collectionAuthority.governanceVanityUrl || collectionAuthority.governance)}
                                            target='blank'
                                        >
                                            <OpenInNewIcon/>
                                        </Button>
                                    
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} container justifyContent="flex-end">
                                    <Typography variant="h4" align="right">
                                        <VotingPower tokenArray={tokenArray} participatingRealm={participatingRealm} />
                                    </Typography>
                                </Grid>
                            </Grid>
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

                        <RenderGovernanceTable proposals={proposals} nftBasedGovernance={nftBasedGovernance} collectionAuthority={collectionAuthority} />
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