
import { gql } from '@apollo/client'
import gql_client from '../gql_client'
import { Link } from "react-router-dom";
import { getRealm, getAllTokenOwnerRecords, getTokenOwnerRecordsByOwner } from '@solana/spl-governance';
import { PublicKey, TokenAmount, Connection } from '@solana/web3.js';
import { ENV, TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import axios from "axios";

import { 
    tryGetName,
} from '@cardinal/namespaces';

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
  Dialog,
  DialogActions,
  DialogContent
} from '@mui/material/';

import { PreviewView } from "../Preview/Preview";
import { getProfilePicture } from '@solflare-wallet/pfp';
import { findDisplayName } from '../utils/name-service';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';

import moment from 'moment';

import DownloadIcon from '@mui/icons-material/Download';
import Chat from '@mui/icons-material/Chat';
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

import { ChatNavigationHelpers, useDialectUiId } from '@dialectlabs/react-ui';
import { GRAPE_BOTTOM_CHAT_ID } from '../utils/ui-contants';

import PropTypes from 'prop-types';
import { 
    GRAPE_PREVIEW,
    GRAPE_RPC_ENDPOINT, 
    THEINDEX_RPC_ENDPOINT,
    TWITTER_PROXY } from '../utils/grapeTools/constants';

import { formatAmount, getFormattedNumberToLocale } from '../utils/grapeTools/helpers'
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
//import { RevokeCollectionAuthority } from '@metaplex-foundation/mpl-token-metadata';

interface Nft {
    mintAddress: string
    name: string
    image: string
    owner: any
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
}));

const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
}));

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

function RenderHoldersTable(props:any) {
    const [loading, setLoading] = React.useState(false);
    //const [proposals, setProposals] = React.useState(props.proposals);
    const nfts = props.nfts;
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - nfts.length) : 0;
    const token = props.token;
    const tokenDecimals = token?.decimals || 6;
    const { navigation, open } = useDialectUiId<ChatNavigationHelpers>(GRAPE_BOTTOM_CHAT_ID);
    const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);

    const handleClickOpenPreviewDialog = () => {
        setOpenPreviewDialog(true);
    };
    
    const handleClosePreviewDialog = () => {
        setOpenPreviewDialog(false);
    };

    const handleChangePage = (event:any, newPage:number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event:any) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if(loading){
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress sx={{borderRadius:'10px;'}} />
            </Box>
        )
    }
    
    const ProfilePicture = (props:any) => {
        const address = props.address;
        const [loadingpicture, setLoadingPicture] = React.useState(false);
        const [solanaDomain, setSolanaDomain] = React.useState(null);
        const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);
        const [hasProfilePicture, setHasProfilePicture] = React.useState(false);
        const countRef = React.useRef(0);
        const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
        
        const fetchProfilePicture = async () => {
            setLoadingPicture(true);  
                try{
                    const { isAvailable, url } = await getProfilePicture(ggoconnection, new PublicKey(address));
                    
                    let img_url = url;
                    if (url)
                        img_url = url.replace(/width=100/g, 'width=256');
                    setProfilePictureUrl(img_url);
                    setHasProfilePicture(isAvailable);
                    countRef.current++;
                }catch(e){}
            setLoadingPicture(false);
        }

        const fetchSolanaDomain = async () => {
            
            console.log("fetching tryGetName: "+address);
            const cardinal_registration = await tryGetName(
                ggoconnection, 
                new PublicKey(address)
            );

            if (cardinal_registration){
                //console.log("FOUND: "+JSON.stringify(cardinal_registration))
                setSolanaDomain(cardinal_registration);
                const url = `${TWITTER_PROXY}https://api.twitter.com/2/users/by&usernames=${cardinal_registration.slice(1)}&user.fields=profile_image_url,public_metrics`;
                /*
                const response = await window.fetch(url, {
                    method: 'GET',
                    headers: {
                    }
                });
                */
                const response = await axios.get(url);
                //const twitterImage = response?.data?.data[0]?.profile_image_url;
                if (response?.data?.data[0]?.profile_image_url){
                    setProfilePictureUrl(response?.data?.data[0]?.profile_image_url);
                    setHasProfilePicture(true);
                }
            } else{
                const domain = await findDisplayName(ggoconnection, address);
                if (domain) {
                    if (domain[0] !== address) {
                        setSolanaDomain(domain[0]);
                    }
                }
            }
        };

        
        React.useEffect(() => {    
            
            if (!loadingpicture){
                //const interval = setTimeout(() => {
                    if (address){
                        fetchProfilePicture();
                        //if (participating)
                            fetchSolanaDomain();
                        //else
                        //    setSolanaDomain(trimAddress(address, 6))
                    }
                //}, 500);
            }
        }, []);
        
        if (loadingpicture){
            return (
                <Grid container direction="row">
                    <Grid item>
                        <Avatar alt={address} sx={{ width: 30, height: 30, bgcolor: 'rgb(0, 0, 0)' }}>
                            <CircularProgress size="1rem" />
                        </Avatar>
                    </Grid>
                    <Grid item sx={{ml:1}}>
                        {trimAddress(address,6)}
                    </Grid>
                </Grid>
            )
        }else{
            
            if (hasProfilePicture){
                return (  
                    <Grid container direction="row">
                        <Grid item>
                            <Avatar alt={address} src={profilePictureUrl} sx={{ width: 30, height: 30, bgcolor: 'rgb(0, 0, 0)' }}>
                                {address.substr(0,2)}
                            </Avatar>
                        </Grid>
                        <Grid item sx={{ml:1}}>
                        {solanaDomain || trimAddress(address,6)}
                        </Grid>
                    </Grid>
                );
            
            } else{
                return (
                    <>
                    {jsNumberForAddress(address) ?
                        <Grid container direction="row">
                            <Grid item alignItems="center">
                                <Jazzicon diameter={30} seed={jsNumberForAddress(address)} />
                                {/*
                                <DisplayAddress address={new PublicKey(address)} connection={ggoconnection} />
                                */}
                            </Grid>
                            <Grid item  alignItems="center" sx={{ml:1}}>
                                {solanaDomain || trimAddress(address,6)}
                            </Grid>
                        </Grid>
                    :
                        <Grid container direction="row">
                            <Grid item alignItems="center">
                                <Jazzicon diameter={30} seed={Math.round(Math.random() * 10000000)} />
                                {/*
                                <DisplayAddress address={new PublicKey(address)} connection={ggoconnection} />
                                */}
                            </Grid>
                            <Grid item  alignItems="center" sx={{ml:1}}>
                                {solanaDomain || trimAddress(address,6)}
                            </Grid>
                        </Grid>
                    }
                    </>
                    
                );
            }
        }
    }

    
    return (
        <Table>
            <TableContainer component={Paper} sx={{background:'none'}}>
                <StyledTable sx={{ minWidth: 500 }} size="small" aria-label="Portfolio Table">
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography variant="caption">Holder</Typography></TableCell>
                            <TableCell><Typography variant="caption">Image</Typography></TableCell>
                            <TableCell><Typography variant="caption">Name</Typography></TableCell>
                            <TableCell><Typography variant="caption">Mint Address</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {nfts && 
                        <>  
                            {(rowsPerPage > 0
                                ? nfts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : nfts
                            ).map((item:any, index:number) => (
                            <>
                                {item?.owner.address &&
                                    <TableRow key={index} sx={{borderBottom:"none"}}>
                                        <TableCell>
                                            <Typography variant="h6">
                                                <ProfilePicture address={item.owner.address} />
                                            </Typography>
                                        </TableCell>
                                        
                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                                <Avatar
                                                    sx={{backgroundColor:'#222'}}
                                                    src={item.image}
                                                    alt={item.name}
                                                />
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" >
                                            <Typography variant="h6">
                                                {item.name}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="h6">
                                                {item.mintAddress}
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="center"> 
                                            <Tooltip title='View'>
                                                <Button 
                                                    component={Link} to={`${GRAPE_PREVIEW}${item.mintAddress}`}
                                                    sx={{
                                                        borderRadius: '24px',color:'white'
                                                    }}
                                                >
                                                    view
                                                </Button>
                                            </Tooltip>
                                        </TableCell>

                                        {/*
                                        <BootstrapDialog 
                                            fullWidth={true}
                                            maxWidth={"lg"}
                                            open={openPreviewDialog} onClose={handleClosePreviewDialog}
                                            PaperProps={{
                                                style: {
                                                    background: '#13151C',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '20px'
                                                }
                                            }}
                                        >
                                            <DialogContent>
                                                <PreviewView handlekey={item.mintAddress} />
                                            </DialogContent>
                                            <DialogActions>
                                                <Button variant="text" onClick={handleClosePreviewDialog}>Close</Button>
                                            </DialogActions>
                                        </BootstrapDialog>
                                        */}
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
                            rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                            colSpan={5}
                            count={nfts && nfts.length}
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

export function HoldersView(props: any) {
    const collectionAuthority = props.collectionAuthority;
    const [loading, setLoading] = React.useState(false);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [nfts, setNfts] = React.useState<Nft[]>([])
    const [holderExport, setHolderExport] = React.useState(null);
    const [fileGenerated, setFileGenerated] = React.useState(null);

    const GET_NFTS_BY_COLLECTION = gql`
        query GetNfts($collections: [PublicKey!], $limit: Int!, $offset: Int!) {
            nfts(collections: $collections, limit: $limit, offset: $offset) {
                mintAddress
                name
                image
                owner {
                    address
                }
            }
        }`

    const GET_NFTS_BY_UPDATEAUTHORITY = gql`
        query GetNfts($uac: [PublicKey!], $limit: Int!, $offset: Int!) {
            nfts(updateAuthorities: $uac, limit: $limit, offset: $offset) {
                mintAddress
                name
                image
                owner {
                    address
                }
            }
        }`

    const getHolders = async() => {
        if (!loading){
            setLoading(true);
            try{
                let usequery = GET_NFTS_BY_UPDATEAUTHORITY;
                let using = collectionAuthority.updateAuthority;
                if (collectionAuthority?.collection){
                    if (collectionAuthority.updateAuthority !== collectionAuthority.collection){
                        usequery = GET_NFTS_BY_COLLECTION;
                        using = collectionAuthority.collection;
                    }
                }

                await gql_client
                    .query({
                    query: usequery,
                    variables: {
                        uac: [using],
                        offset: 0,
                        limit: 10000
                    }
                    })
                    .then(res => setNfts(res.data.nfts))

                
            }catch(e){console.log("ERR: "+e)}
            setLoading(false);
        }
    }

    React.useEffect(() => {
        if (nfts){
            if (!holderExport){
                const harray = new Array();
                for (var item of nfts){
                    harray.push({
                        mint:item.mintAddress,
                        name:item.name,
                        owner:item.owner.address
                    })
                }
                
                setHolderExport(harray);
                const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                    JSON.stringify(harray)
                )}`;
                
                setFileGenerated(jsonString);
            }
        }
    }, [nfts]);

    React.useEffect(() => { 
        if (publicKey && !loading){   
            getHolders();
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
            if (nfts){
                return (
                    <Box
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                            overflow: 'hidden',
                            p:4
                        }} 
                    > 
                        
                        <>
                            <Grid container>
                                <Grid item>
                                    <Typography variant="h4">
                                        HOLDERS
                                    </Typography>
                                </Grid>
                                <Grid item xs textAlign={'right'}>
                                    <Button
                                        variant='outlined'
                                        download={`${collectionAuthority.collection || collectionAuthority.updateAuthority}_holders_grape.json`}
                                        href={fileGenerated}
                                        sx={{borderRadius:'17px', color:'white'}}
                                    >
                                        <DownloadIcon /> Export
                                    </Button>
                                </Grid>
                            </Grid>
                        </>
                        <RenderHoldersTable nfts={nfts} />
                    </Box>
                                
                );
            }else{
                return (<></>);
                
            }      
        }
    } else{
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
