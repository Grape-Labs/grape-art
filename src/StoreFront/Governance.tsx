import { getRealm, getAllProposals, getGovernance, getTokenOwnerRecordsByOwner, getAllTokenOwnerRecords, getRealmConfigAddress, getGovernanceAccount, getAccountTypes, GovernanceAccountType, tryGetRealmConfig, getRealmConfig  } from '@solana/spl-governance';
import { getVoteRecords } from '../utils/governanceTools/getVoteRecords';
import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import { ENV, TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogProvider, WalletMultiButton } from "@solana/wallet-adapter-material-ui";
import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import Gist from 'react-gist';
import { gistApi, resolveProposalDescription } from '../utils/grapeTools/github';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


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
  Chip,
  ButtonGroup,
} from '@mui/material/';

import { linearProgressClasses } from '@mui/material/LinearProgress';

import ExplorerView from '../utils/grapeTools/Explorer';
import moment from 'moment';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import GitHubIcon from '@mui/icons-material/GitHub';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AssuredWorkloadIcon from '@mui/icons-material/AssuredWorkload';
import PeopleIcon from '@mui/icons-material/People';
import DownloadIcon from '@mui/icons-material/Download';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
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

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 15,
    borderRadius: '17px',
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: '17px',
      backgroundColor: theme.palette.mode === 'light' ? '#1a90ff' : '#ffffff',
    },
  }));

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

function GetParticipants(props: any){
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const tokenMap = props.tokenMap;
    const memberMap = props.memberMap;
    const governanceToken = props.governanceToken;
    const thisitem = props.item;
    //const [thisitem, setThisItem] = React.useState(props.item);
    const realm = props.realm;
    const [csvGenerated, setCSVGenerated] = React.useState(null); 
    const [jsonGenerated, setJSONGenerated] = React.useState(null);
    const [solanaVotingResultRows,setSolanaVotingResultRows] = React.useState(null);
    const [open, setOpen] = React.useState(false);
    const [tokenDecimals, setTokenDecimals] = React.useState(null);
    const [voteType, setVoteType] = React.useState(null);
    const [propVoteType, setPropVoteType] = React.useState(null); // 0 council, 1 token, 2 nft
    const [uniqueYes, setUniqueYes] = React.useState(0);
    const [uniqueNo, setUniqueNo] = React.useState(0);
    const [gist, setGist] = React.useState(null);
    const [proposalDescription, setProposalDescription] = React.useState(null);
    const [thisGovernance, setThisGovernance] = React.useState(null);
    const [proposalAuthor, setProposalAuthor] = React.useState(null);
    const [governingMintInfo, setGoverningMintInfo] = React.useState(null);
    const [quorum, setQuorum] = React.useState(null);
    const [quorumTargetPercentage, setQuorumTargetPercentage] = React.useState(null);
    const [quorumTarget, setQuorumTarget] = React.useState(null);

    const votingresultcolumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70, hide: true},
        { field: 'pubkey', headerName: 'PublicKey', width: 170, hide: true,
            renderCell: (params) => {
                return(params.value)
            }
        },
        { field: 'proposal', headerName: 'Proposal', width: 170, hide: true,
            renderCell: (params) => {
                return(params.value)
            }
        },
        { field: 'governingTokenOwner', headerName: 'Token Owner', width: 170, flex: 1,
            renderCell: (params) => {
                return(
                    <ExplorerView showSolanaProfile={true} grapeArtProfile={true} address={params.value} type='address' shorten={8} hideTitle={false} style='text' color='white' fontSize='14px' />
                )
            }
        },
        { field: 'vote', headerName: 'Voting', headerAlign: 'center', width: 250, align: 'right',
            renderCell: (params) => {
                return(
                    <>
                        <Chip
                            variant="outlined"
                            color={params.value.vote.voteType === 0 ?
                                'success'
                                :
                                'error'
                            }
                            icon={params.value.vote.voteType === 0 ?
                                <ThumbUpIcon color='success' sx={{ml:1}} />
                                :
                                <ThumbDownIcon sx={{color:'red',ml:1}}/>
                            }
                            label={params.value.voterWeight > 1 ?
                                `${getFormattedNumberToLocale(formatAmount(+(parseInt(params.value.voterWeight)/Math.pow(10, params.value.decimals)).toFixed(0)))} votes` 
                                :
                                `${getFormattedNumberToLocale(formatAmount(+(parseInt(params.value.voterWeight)/Math.pow(10, params.value.decimals)).toFixed(0)))} vote` 
                            }
                        />
                        
                    </>
                );
            }
        },
    ];

    const getGovernanceProps = async () => {
        const governance = await getGovernance(connection, thisitem.account.governance);
        setThisGovernance(governance);
        
        //console.log("realm"+JSON.stringify(realm));
        //console.log("Single governance: "+JSON.stringify(governance));
        //console.log("thisitem "+JSON.stringify(thisitem))

        try{
            //console.log(">>>> "+JSON.stringify(thisitem.account))
            //const communityMintPromise = connection.getParsedAccountInfo(
            //    new PublicKey(governance.account.config.communityMint?.toBase58())
            //);

            const governingMintPromise = 
                await connection.getParsedAccountInfo(
                    new PublicKey(thisitem.account.governingTokenMint)
                );
            //console.log("communityMintPromise ("+thisitem.account.governingTokenMint+") "+JSON.stringify(governingMintPromise))
            setGoverningMintInfo(governingMintPromise);
            
            const communityWeight = governingMintPromise.value.data.parsed.info.supply - realm.account.config.minCommunityTokensToCreateGovernance.toNumber();
            //console.log("communityWeight: "+communityWeight);

            const communityMintMaxVoteWeightSource = realm.account.config.communityMintMaxVoteWeightSource
            const supplyFractionPercentage = communityMintMaxVoteWeightSource.fmtSupplyFractionPercentage();
            const communityVoteThreshold = governance.account.config.communityVoteThreshold
            const councilVoteThreshold = governance.account.config.councilVoteThreshold
            
            //console.log("supplyFractionPercentage: "+supplyFractionPercentage)
            //console.log("communityVoteThreshold: "+JSON.stringify(communityVoteThreshold))
            //console.log("councilVoteThreshold: "+JSON.stringify(councilVoteThreshold))

            //const mintSupply = governingMintPromise.value.data.data.parsed.info.supply;
            //const mintDecimals = governingMintPromise.value.data.data.parsed.info.decimals; 
            
            const voteThresholdPercentage=
                realm.account.config.councilMint.toBase58() === thisitem.account.governingTokenMint.toBase58()
                ? councilVoteThreshold.value
                : communityVoteThreshold.value
            
            const totalVotes =
                Number(governingMintPromise.value.data.parsed.info.supply/Math.pow(10, governingMintPromise.value.data.parsed.info.decimals))  *
                //Number(communityWeight/Math.pow(10, governingMintPromise.value.data.parsed.info.decimals))  *
                (voteThresholdPercentage * 0.01) *
                  (Number(supplyFractionPercentage) / 100);
            
            //console.log("totalVotes: "+totalVotes)
            //console.log("voteThresholdPercentage: "+(voteThresholdPercentage * 0.01))
            //console.log("supplyFractionPercentage: "+(Number(supplyFractionPercentage) / 100))

            setQuorum(totalVotes);
            
            const qt = totalVotes-thisitem.account.options[0].voteWeight.toNumber()/Math.pow(10, governingMintPromise.value.data.parsed.info.decimals);
            const yesVotes = thisitem.account.options[0].voteWeight.toNumber()/Math.pow(10, governingMintPromise.value.data.parsed.info.decimals);
            
            //console.log("yesVotes: "+yesVotes);
            const totalVotesNeeded = Math.ceil(totalVotes - yesVotes);

            if (qt < 0){
                setQuorumTargetPercentage(100);
            }else{
                setQuorumTargetPercentage((totalVotesNeeded / totalVotes) * 100);
                setQuorumTarget(totalVotesNeeded);
            }

        }catch(e){
            console.log('ERR: '+e)
        }
    }


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
        
        let td = 6; // this is the default for NFT mints
        let vType = null;
        try{
            td = tokenMap.get(thisitem.account.governingTokenMint?.toBase58()).decimals;
            vType = 'Token';
            //console.log("tokenMap: "+tokenMap.get(thisitem.account.governingTokenMint?.toBase58()).decimals);
        }catch(e){
            //console.log("ERR: "+e);
        }
        
        if (realm.account.config?.councilMint?.toBase58() === thisitem?.account?.governingTokenMint?.toBase58()){
            vType = 'Council';
            td = 0;
        }
        
        if (!vType){
            vType = 'NFT';
        }
        setTokenDecimals(td);
        setVoteType(vType)

        if (vType){
            setPropVoteType(vType);

            //thisitem.account.tokenOwnerRecord;
            for (const item of memberMap){
                if (item.pubkey.toBase58() === thisitem.account.tokenOwnerRecord.toBase58()){
                    setProposalAuthor(item.account.governingTokenOwner.toBase58())
                    //console.log("member:" + JSON.stringify(item));
                }
            }
        }

        //if (thisitem.account?.state === 2){ // if voting state
            getGovernanceProps()
        //}

        const voteRecord = await getVoteRecords({
            connection: connection,
            programId: new PublicKey(thisitem.owner),
            proposalPk: new PublicKey(thisitem.pubkey),
        });

        const voteResults = voteRecord;//JSON.parse(JSON.stringify(voteRecord));
        
        const votingResults = [];
        let csvFile = '';
        let uYes = 0;
        let uNo = 0;
        if (voteResults?.value){
            let counter = 0;

            for (let item of voteResults.value){
                counter++;
                if (item.account.vote.voteType === 0)
                    uYes++;
                else
                    uNo++;

                votingResults.push({
                    id:counter,
                    pubkey:item.pubkey.toBase58(),
                    proposal:item.account.proposal.toBase58(),
                    governingTokenOwner:item.account.governingTokenOwner.toBase58(),
                    vote:{
                        vote:item.account.vote,
                        voterWeight:item.account.voterWeight.toNumber(),
                        decimals:(realm.account.config?.councilMint?.toBase58() === thisitem.account.governingTokenMint?.toBase58() ? 0 : td),
                        councilMint:realm.account.config?.councilMint?.toBase58() ,
                        governingTokenMint:thisitem.account.governingTokenMint?.toBase58() 
                    }
                })
                if (counter > 1)
                    csvFile += '\r\n';
                else
                    csvFile = 'tokenOwner,voterWeight,tokenDecimals,voteType\r\n';
                
                csvFile += item.pubkey.toBase58()+','+item.account.voterWeight.toNumber()+','+tokenDecimals+','+item.account.vote.voteType+'';
                //    csvFile += item.pubkey.toBase58();
            }
        }

        if (thisitem.account?.descriptionLink){
            try{
                const url = new URL(thisitem.account?.descriptionLink);
                const pathname = url.pathname;
                const parts = pathname.split('/');
                //console.log("pathname: "+pathname)
                let tGist = null;
                if (parts.length > 1)
                    tGist = parts[2];
                
                setGist(tGist);

                const rpd = await resolveProposalDescription(thisitem.account?.descriptionLink);
                setProposalDescription(rpd);
            } catch(e){
                console.log("ERR: "+e)
            }
        }

        setUniqueYes(uYes);
        setUniqueNo(uNo);

        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(votingResults)
        )}`;

        //console.log("jsonString: "+JSON.stringify(jsonString));

        setJSONGenerated(jsonString);
        
        const jsonCSVString = encodeURI(`data:text/csv;chatset=utf-8,${csvFile}`);
        //console.log("jsonCSVString: "+JSON.stringify(jsonCSVString));
        
        setCSVGenerated(jsonCSVString); 
        
        setSolanaVotingResultRows(votingResults)
        //console.log("Vote Record: "+JSON.stringify(voteRecord));
        //console.log("This vote: "+JSON.stringify(thisitem));
    }


    
    return (
        <>
            <Tooltip title='Get Voting Details for this Proposal'>
                <Button 
                    onClick={handleClickOpen}
                    sx={{color:'white',textTransform:'none',borderRadius:'17px'}}>
                    <FileOpenIcon />
                </Button>
            </Tooltip>
            {propVoteType &&
            <BootstrapDialog 
                maxWidth={"xl"}
                fullWidth={true}
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
                    Proposal Details
                </BootstrapDialogTitle>
                <DialogContent>
                    
                    <Box sx={{ alignItems: 'center', textAlign: 'center',p:1}}>
                        <Typography variant='h5'>{thisitem.account?.name}</Typography>
                    </Box>
                    
                    {proposalAuthor &&
                        <Box sx={{ alignItems: 'center', textAlign: 'center'}}>
                            <Typography variant='caption'>Author: <ExplorerView showSolanaProfile={true} grapeArtProfile={true} address={proposalAuthor} type='address' shorten={8} hideTitle={false} style='text' color='white' fontSize='12px'/></Typography>
                        </Box>
                    }

                    <Box sx={{ alignItems: 'center', textAlign: 'center'}}>
                        {gist ?
                            <Box sx={{ alignItems: 'left', textAlign: 'left',p:1}}>
                                <Typography variant='body2'>
                                    <ReactMarkdown remarkPlugins={[[remarkGfm, {singleTilde: false}]]}>
                                        {proposalDescription}
                                    </ReactMarkdown>
                                </Typography>
                                
                                <Box sx={{ alignItems: 'right', textAlign: 'right',p:1}}>
                                    {/*
                                    <Gist id={gist} />
                                    */}
                                    <Button
                                        color='inherit'
                                        href={thisitem.account?.descriptionLink}
                                        sx={{borderRadius:'17px'}}
                                    >
                                        <GitHubIcon sx={{mr:1}} /> GIST
                                    </Button>
                                </Box>
                            </Box>
                            :
                            <>
                                {thisitem.account?.descriptionLink &&
                                    <>
                                        <Typography variant='caption'>{thisitem.account?.descriptionLink}</Typography>
                                    </>
                                }
                            </>
                        }
                        </Box>
                    

                    {propVoteType &&
                        <Box sx={{ alignItems: 'center', textAlign: 'center',p:1}}>
                            <Grid container spacing={0}>
                                
                                <Grid item xs={12} sm={6} md={6} key={1}>
                                    <Box
                                        className='grape-store-stat-item'
                                        sx={{borderRadius:'24px',m:2,p:1}}
                                    >
                                        <Typography variant="body2" sx={{color:'yellow'}}>
                                            <>For</>
                                        </Typography>
                                        <Typography variant="h3">
                                            {thisitem.account?.options && thisitem.account?.options[0]?.voteWeight && thisitem?.account?.denyVoteWeight && thisitem.account?.options[0].voteWeight.toNumber() > 0 ?
                                            <>
                                            {`${(((thisitem.account?.options[0].voteWeight.toNumber())/((thisitem.account?.denyVoteWeight.toNumber())+(thisitem.account?.options[0].voteWeight.toNumber())))*100).toFixed(2)}%`}
                                            </>
                                            :
                                            <>0%</>
                                            }                  
                                        </Typography>
                                        <Typography variant="caption">
                                            {getFormattedNumberToLocale(formatAmount(+(thisitem.account.options[0].voteWeight.toNumber()/Math.pow(10, tokenDecimals)).toFixed(0)))}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={6} key={1}>
                                    <Box
                                        className='grape-store-stat-item'
                                        sx={{borderRadius:'24px',m:2,p:1}}
                                    >
                                        <Typography variant="body2" sx={{color:'yellow'}}>
                                            <>Against</>
                                        </Typography>
                                        <Typography variant="h3">
                                            {thisitem.account?.options && thisitem.account?.options[0]?.voteWeight && thisitem?.account?.denyVoteWeight && thisitem.account?.options[0].voteWeight.toNumber() > 0 ?
                                            <>
                                            {`${(((thisitem.account?.denyVoteWeight.toNumber()/Math.pow(10, tokenDecimals))/((thisitem.account?.denyVoteWeight.toNumber()/Math.pow(10, tokenDecimals))+(thisitem.account?.options[0].voteWeight.toNumber()/Math.pow(10, tokenDecimals))))*100).toFixed(2)}%`}
                                            </>
                                            :
                                            <>0%</>
                                            }
                                        </Typography>
                                        <Typography variant="caption">
                                            {getFormattedNumberToLocale(formatAmount(+(thisitem.account.denyVoteWeight.toNumber()/Math.pow(10, tokenDecimals)).toFixed(0)))}
                                        </Typography>
                                    </Box>
                                </Grid>
                                
                                { 
                                    <Grid item xs={12}>
                                        {quorum &&
                                        <Box sx={{ width: '100%' }}>
                                            <BorderLinearProgress variant="determinate" 
                                                sx={{color:'white'}}
                                                value={quorumTargetPercentage < 100 ? 100-quorumTargetPercentage : 100} />
                                            {quorumTarget ? 
                                                <Typography variant='caption'>{getFormattedNumberToLocale(formatAmount(quorumTarget))} more votes remaining to reach quorum</Typography>
                                            :
                                                <Typography variant='caption'>Quorum Reached!</Typography>
                                            }
                                        </Box>
                                        }
                                    </Grid>
                                }
                                
                                <Grid item xs={12} sm={6} md={3} key={1}>
                                    <Box
                                        className='grape-store-stat-item'
                                        sx={{borderRadius:'24px',m:2,p:1}}
                                    >
                                        <Typography variant="body2" sx={{color:'yellow'}}>
                                            <>Type</>
                                        </Typography>
                                        <Typography variant="subtitle2">
                                            <Tooltip title={
                                                <>{governingMintInfo &&
                                                    <>
                                                    {`Mint: ${thisitem.account.governingTokenMint}`}
                                                    <br />
                                                    {`Supply: ${getFormattedNumberToLocale(formatAmount(+(governingMintInfo.value.data.parsed.info.supply/Math.pow(10, governingMintInfo.value.data.parsed.info.decimals)).toFixed(0)))}`}
                                                    {quorum &&
                                                        <>
                                                            <br />
                                                            {`Quorum: ${getFormattedNumberToLocale(formatAmount(+(quorum).toFixed(0)))}`}
                                                        </>
                                                    }
                                                    </>
                                                    }
                                                </>
                                                }>
                                                <Chip
                                                    variant="outlined"
                                                    label={propVoteType}
                                                />
                                            </Tooltip>
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3} key={1}>
                                    <Box
                                        className='grape-store-stat-item'
                                        sx={{borderRadius:'24px',m:2,p:1}}
                                    >
                                        <Typography variant="body2" sx={{color:'yellow'}}>
                                            <>Participants</>
                                        </Typography>
                                        <Typography variant="subtitle2">
                                            {solanaVotingResultRows && solanaVotingResultRows.length}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3} key={1}>
                                    <Box
                                        className='grape-store-stat-item'
                                        sx={{borderRadius:'24px',m:2,p:1}}
                                    >
                                        <Typography variant="body2" sx={{color:'yellow'}}>
                                            <>General Sentiment</>
                                        </Typography>
                                        <Typography variant="subtitle2">
                                            {uniqueYes}/{uniqueNo} (unique voters)
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3} key={1}>
                                    <Box
                                        className='grape-store-stat-item'
                                        sx={{borderRadius:'24px',m:2,p:1}}
                                    >
                                        <Typography variant="body2" sx={{color:'yellow'}}>
                                            Export
                                        </Typography>
                                        <Typography variant="subtitle2">
                                        <ButtonGroup size="small" color='inherit'>
                                            {jsonGenerated &&
                                                <Tooltip title="Download Voter Participation JSON file">
                                                    <Button
                                                        sx={{borderBottomLeftRadius:'17px',borderTopLeftRadius:'17px'}}
                                                        download={`${thisitem.pubkey.toBase58()}.csv`}
                                                        href={jsonGenerated}
                                                    >
                                                        <DownloadIcon /> JSON
                                                    </Button>
                                                </Tooltip>
                                            }

                                            {csvGenerated &&
                                                <Tooltip title="Download Voter Participation CSV file">
                                                    <Button
                                                        sx={{borderBottomRightRadius:'17px',borderTopRightRadius:'17px'}}
                                                        download={`${thisitem.pubkey.toBase58()}.csv`}
                                                        href={csvGenerated}
                                                    >
                                                        <DownloadIcon /> CSV
                                                    </Button>
                                                </Tooltip>
                                            }
                                        </ButtonGroup>
                                        
                                        </Typography>
                                    </Box>
                                </Grid>

                                {thisitem.account?.votingAt &&
                                    <Grid item xs={12} sm={6} md={3} key={1}>
                                        <Box
                                            className='grape-store-stat-item'
                                            sx={{borderRadius:'24px',m:2,p:1}}
                                        >
                                            <Typography variant="body2" sx={{color:'yellow'}}>
                                                <>Started At</>
                                            </Typography>
                                            <Typography variant="subtitle2">
                                                {moment.unix(thisitem.account?.votingAt.toNumber()).format("MMMM Da, YYYY, h:mm a")}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                }
                                
                                <Grid item xs={12} sm={6} md={3} key={1}>
                                    <Box
                                        className='grape-store-stat-item'
                                        sx={{borderRadius:'24px',m:2,p:1}}
                                    >
                                        <Typography variant="body2" sx={{color:'yellow'}}>
                                            {thisitem.account?.votingCompletedAt ?
                                                <>Ended At</>
                                            :
                                                <>Ends At</>
                                            }
                                        </Typography>
                                        <Typography variant="subtitle2">
                                                {thisGovernance && thisGovernance?.account?.config?.maxVotingTime ?
                                                    `${moment.unix(thisitem.account?.votingAt.toNumber()+thisGovernance?.account?.config?.maxVotingTime).format("MMMM Da, YYYY, h:mm a")}`
                                                :
                                                    <>
                                                    {thisitem.account?.votingCompletedAt ?
                                                        `${moment.unix(thisitem.account?.votingCompletedAt).format("MMMM Da, YYYY, h:mm a")}`
                                                    :
                                                        `Ended`
                                                    }
                                                    </>
                                                }
                                        </Typography>
                                    </Box>
                                </Grid>

                                {thisitem?.account?.options[0]?.voteWeight &&
                                    <Grid item xs={12} sm={6} md={3} key={1}>
                                        <Box
                                            className='grape-store-stat-item'
                                            sx={{borderRadius:'24px',m:2,p:1}}
                                        >
                                            <Typography variant="body2" sx={{color:'yellow'}}>
                                                <>Time Left</>
                                            </Typography>
                                            <Typography variant="subtitle2">
                                                {thisGovernance && thisGovernance?.account?.config?.maxVotingTime ?
                                                    `Ending ${moment.unix(thisitem.account?.votingAt.toNumber()+thisGovernance?.account?.config?.maxVotingTime).fromNow()}`
                                                :
                                                    `Ended`
                                                }
                        
                                            </Typography>
                                        </Box>
                                    </Grid>
                                }

                                {thisitem?.account?.denyVoteWeight &&
                                    <Grid item xs={12} sm={6} md={3} key={1}>
                                        <Box
                                            className='grape-store-stat-item'
                                            sx={{borderRadius:'24px',m:2,p:1}}
                                        >
                                            <Typography variant="body2" sx={{color:'yellow'}}>
                                                <>Status</>
                                            </Typography>
                                            <Typography variant="subtitle2">
                                                <Button color='inherit' sx={{color:'white',borderRadius:'17px'}} href={`https://realms.today/dao/${governanceToken?.governanceVanityUrl || governanceToken?.governance || governanceToken}/proposal/${thisitem?.pubkey}`} target='_blank'>
                                                    {GOVERNANNCE_STATE[thisitem.account?.state]} <OpenInNewIcon sx={{ml:1}} fontSize='small'/>
                                                </Button>
                                            </Typography>
                                        </Box>
                                    </Grid> 
                                }
                                
                            </Grid>

                        </Box>
                    }

                    {solanaVotingResultRows ?
                        <div style={{ height: 600, width: '100%' }}>
                            <div style={{ display: 'flex', height: '100%' }}>
                                <div style={{ flexGrow: 1 }}>
                                    
                                        <DataGrid
                                            rows={solanaVotingResultRows}
                                            columns={votingresultcolumns}
                                            pageSize={25}
                                            rowsPerPageOptions={[]}
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
                    :
                        <LinearProgress />
                    }
                    
                </DialogContent> 
            </BootstrapDialog>
            }
        </>
    )
}

function RenderGovernanceTable(props:any) {
    const realm = props.realm;
    const memberMap = props.memberMap;
    const thisToken = props.thisToken;
    const tokenMap = props.tokenMap;
    const [loading, setLoading] = React.useState(false);
    //const [proposals, setProposals] = React.useState(props.proposals);
    const governanceToken = props.governanceToken;
    const proposals = props.proposals;
    const nftBasedGovernance = props.nftBasedGovernance;
    const token = props.token;
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const { publicKey } = useWallet();
    const [propTokenDecimals, setPropTokenDecimals] = React.useState(token?.decimals || 6);
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
    
    function GetProposalStatus(props: any){
        const thisitem = props.item;
        const [thisGovernance, setThisGovernance] = React.useState(null);

        const getGovernanceProps = async () => {
            const governance = await getGovernance(connection, thisitem.account.governance);
            setThisGovernance(governance);
            //const starts = thisitem.account?.votingAt.toNumber();
            ///const ends = thisitem.account?.votingAt.toNumber()+governance?.account?.config?.maxVotingTime;
            //console.log("ending at : " + moment.unix(thisitem.account?.votingAt.toNumber()+governance?.account?.config?.maxVotingTime).format("MMMM Da, YYYY, h:mm a"));

            //console.log("Single governance: "+JSON.stringify(governance));
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
                                <>
                                {thisitem.account?.votingCompletedAt ?
                                    <>{`Started: ${thisitem.account?.votingAt && (moment.unix((thisitem.account?.votingAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))} - Ended: ${thisitem.account?.votingAt && (moment.unix((thisitem.account?.votingCompletedAt).toNumber()).format("MMMM Da, YYYY, h:mm a"))}`}</>
                                :
                                    `Created: ${thisitem.account?.votingAt && (moment.unix((thisitem.account?.votingAt).toNumber()).format("MMMM D, YYYY, h:mm a"))}`
                                }
                                </>
                            } 

                            </>
                            }>
                            
                            <Button sx={{borderRadius:'17px',color:'inherit',textTransform:'none'}}>
                                {GOVERNANNCE_STATE[thisitem.account?.state]}
                                    <>
                                    {thisitem.account?.votingCompletedAt ?
                                        <><CheckCircleOutlineIcon sx={{ fontSize:"small", color:"green",ml:1}} /></>
                                    :
                                        <>
                                        { thisitem.account?.state === 2 ?
                                            <TimerIcon sx={{ fontSize:"small",ml:1}} />
                                        
                                        : 
                                            <CancelOutlinedIcon sx={{ fontSize:"small", color:"red",ml:1}} />
                                        }
                                        </>
                                    }
                                    </>
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
            
            <TableContainer component={Paper} sx={{background:'none'}}>
                <Table sx={{ minWidth: 650 }}>
                    <StyledTable sx={{ minWidth: 500 }} size="small" aria-label="Portfolio Table">
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography variant="caption">Name</Typography></TableCell>
                                <TableCell align="center" sx={{width:"1%"}}><Typography variant="caption">Yes</Typography></TableCell>
                                <TableCell align="center" sx={{width:"1%"}}><Typography variant="caption">No</Typography></TableCell>
                                <TableCell align="center" sx={{width:"1%"}}><Typography variant="caption">Status</Typography></TableCell>
                                <TableCell align="center"><Typography variant="caption">Details</Typography></TableCell>
                                
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
                                                <Typography variant="h6" color={(item.account?.state === 2) ? `white` : `gray`}>
                                                {item.account?.name}
                                                {item.account?.descriptionLink && 
                                                    <Tooltip title={item.account?.descriptionLink}>
                                                        <Button sx={{ml:1,borderRadius:'17px'}} color='inherit' ><HelpOutlineIcon sx={{ fontSize:16 }}/></Button>
                                                    </Tooltip>
                                                }

                                                    {realm.account.config?.councilMint?.toBase58() === item.account?.governingTokenMint?.toBase58() ?
                                                        <Tooltip title='Council Vote'><Button color='inherit' sx={{ml:1,borderRadius:'17px'}}><AssuredWorkloadIcon sx={{ fontSize:16 }} /></Button></Tooltip>
                                                        :
                                                        <>
                                                        {tokenMap.get(item.account.governingTokenMint.toBase58()) ?
                                                            <></>
                                                        :
                                                            <Tooltip title='NFT Vote'><Button color='inherit' sx={{ml:1,borderRadius:'17px'}}><ImageOutlinedIcon sx={{ fontSize:16 }} /></Button></Tooltip>
                                                        }
                                                        </>
                                                    }
                                                    
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.account?.options && item.account?.options[0]?.voteWeight && 
                                                    <Typography variant="h6">
                                                        
                                                        {/*console.log("governingTokenMint: "+item.account.governingTokenMint.toBase58())*/}
                                                        {/*console.log("vote: "+JSON.stringify(item.account))*/}
                                                        
                                                        <Tooltip title={realm.account.config?.councilMint?.toBase58() === item.account?.governingTokenMint?.toBase58() ?
                                                                <>{item.account?.options[0].voteWeight.toNumber()}</>
                                                            :
                                                            <>
                                                                    <>
                                                                    {(item.account?.options[0].voteWeight.toNumber()/Math.pow(10, (tokenMap.get(item.account.governingTokenMint?.toBase58()) ? tokenMap.get(item.account.governingTokenMint?.toBase58()).decimals : 6) )).toFixed(0)}</>
                                                                

                                                            </>
                                                            }
                                                        >
                                                            <Button sx={{color:'white'}}>
                                                                {item.account?.options[0].voteWeight.toNumber() > 0 ?
                                                                <>
                                                                {`${(((item.account?.options[0].voteWeight.toNumber())/((item.account?.denyVoteWeight.toNumber())+(item.account?.options[0].voteWeight.toNumber())))*100).toFixed(2)}%`}
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
                                                        <Tooltip title={tokenMap.get(item.account.governingTokenMint.toBase58()) ?
                                                            <>
                                                               {(item.account?.options[0].voterWeight.toNumber()/Math.pow(10, (tokenMap.get(item.account.governingTokenMint?.toBase58()) ? tokenMap.get(item.account.governingTokenMint?.toBase58()).decimals : 6) )).toFixed(0)}
                                                            </>
                                                            :
                                                            <>
                                                                {item.account?.options[0].voterWeight.toNumber()}
                                                            </>
                                                            }
                                                        >
                                                            <Button sx={{color:'white'}}>
                                                                {item.account?.options[0].voterWeight.toNumber() > 0 ?
                                                                <>
                                                                {`${(((item.account?.options[0].voterWeight.toNumber())/((item.account?.denyVoteWeight.toNumber())+(item.account?.options[0].voterWeight.toNumber())))*100).toFixed(2)}%`}
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
                                                                {(item.account?.denyVoteWeight.toNumber()/Math.pow(10, (tokenMap.get(item.account.governingTokenMint?.toBase58()) ? tokenMap.get(item.account.governingTokenMint?.toBase58()).decimals : 6) )).toFixed(0)}
                                                            </>
                                                            }
                                                        >
                                                            <Button sx={{color:'white'}}>
                                                                {item.account?.denyVoteWeight.toNumber() > 0 ?
                                                                <>
                                                                {`${(((item.account?.denyVoteWeight.toNumber()/Math.pow(10, (tokenMap.get(item.account.governingTokenMint?.toBase58()) ? tokenMap.get(item.account.governingTokenMint?.toBase58()).decimals : 6) ))/((item.account?.denyVoteWeight.toNumber()/Math.pow(10, (tokenMap.get(item.account.governingTokenMint?.toBase58()) ? tokenMap.get(item.account.governingTokenMint?.toBase58()).decimals : 6) ))+(item.account?.options[0].voteWeight.toNumber()/Math.pow(10, (tokenMap.get(item.account.governingTokenMint?.toBase58()) ? tokenMap.get(item.account.governingTokenMint?.toBase58()).decimals : 6) ))))*100).toFixed(2)}%`}
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
                                                <GetParticipants item={item} realm={realm} tokenMap={tokenMap} memberMap={memberMap} governanceToken={governanceToken} />
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
                </Table>
            </TableContainer>
        )
}

export function GovernanceView(props: any) {
    const governanceToken = props.governanceToken;
    const [loading, setLoading] = React.useState(false);
    const [memberMap, setMemberMap] = React.useState(null);
    const [realm, setRealm] = React.useState(null);
    const [tokenMap, setTokenMap] = React.useState(null);
    const [tokenArray, setTokenArray] = React.useState(null);
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const { publicKey } = useWallet();
    const [proposals, setProposals] = React.useState(null);
    const [participating, setParticipating] = React.useState(false)
    const [participatingRealm, setParticipatingRealm] = React.useState(null)
    const [nftBasedGovernance, setNftBasedGovernance] = React.useState(false);
    const [thisToken, setThisToken] = React.useState(null);

    const GOVERNANCE_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';

    function VotingPower(props: any){
        const tArray = props.tokenArray;
        const pRealm = props.participatingRealm;
        //const [thisToken, setThisToken] = React.useState(null);

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
                    
                console.log("with governance: "+governanceToken?.governance || governanceToken);
                const programId = new PublicKey(GOVERNANCE_PROGRAM_ID);

                const ownerRecordsbyOwner = await getTokenOwnerRecordsByOwner(connection, programId, publicKey);
                //console.log("ownerRecordsbyOwner: "+JSON.stringify(ownerRecordsbyOwner))
                // check if part of this realm
                let pcp = false;
                let partOf = null;
                for (const realm of ownerRecordsbyOwner){
                    //console.log("owner record realm: "+JSON.stringify(realm))
                    if (realm.account.realm.toBase58() === governanceToken?.governance || governanceToken){
                        pcp = true;
                        partOf = realm;
                        setParticipatingRealm(realm);
                        //console.log("realm: "+JSON.stringify(realm))
                    }
                }
                setParticipating(pcp);

                const grealm = await getRealm(new Connection(THEINDEX_RPC_ENDPOINT), new PublicKey(governanceToken?.governance || governanceToken))
                setRealm(grealm);
                //console.log("B realm: "+JSON.stringify(grealm));

                const realmPk = grealm.pubkey;

                //console.log("communityMintMaxVoteWeightSource: " + grealm.account.config.communityMintMaxVoteWeightSource.value.toNumber());

                if (grealm?.account?.config?.useCommunityVoterWeightAddin){
                //{
                    const realmConfigPk = await getRealmConfigAddress(
                        programId,
                        realmPk
                    )
                    //console.log("realmConfigPk: "+JSON.stringify(realmConfigPk));
                    try{ 
                        const realmConfig = await getRealmConfig(
                            connection,
                            realmConfigPk
                        )
                        //console.log("realmConfig: "+JSON.stringify(realmConfig));
                        
                        const tryRealmConfig = await tryGetRealmConfig(
                            connection,
                            programId,
                            realmPk
                        )
                        
                        //console.log("tryRealmConfig: "+JSON.stringify(tryRealmConfig));
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

                const gator = await getAllTokenOwnerRecords(new Connection(THEINDEX_RPC_ENDPOINT), programId, realmPk)

                setMemberMap(gator);

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
                
                //console.log("allprops: "+JSON.stringify(allprops));

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
            if (proposals && tokenMap){
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
                                            href={'https://realms.today/dao/'+(governanceToken.governanceVanityUrl || governanceToken.governance || governanceToken)}
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

                        <RenderGovernanceTable memberMap={memberMap} tokenMap={tokenMap} realm={realm} thisToken={thisToken} proposals={proposals} nftBasedGovernance={nftBasedGovernance} governanceToken={governanceToken} />
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
                    <WalletDialogProvider className="grape-wallet-provider">
                        <WalletMultiButton className="grape-wallet-button">
                            Connect your wallet
                        </WalletMultiButton>
                    </WalletDialogProvider> 
            </Box>
        )
    }
}