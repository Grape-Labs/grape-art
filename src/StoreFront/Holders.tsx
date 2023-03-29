
import { gql } from '@apollo/client'
import gql_client from '../gql_client'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from "@solana/web3.js";

//import { CardinalTwitterIdentityResolver } from '@dialectlabs/identity-cardinal';

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
  AvatarGroup,
  Badge,
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
  Chip,
  DialogActions,
  DialogContent,
  ButtonGroup,
  Menu,
  MenuItem,
} from '@mui/material/';

import ExplorerView from '../utils/grapeTools/Explorer';
import { PreviewView } from "../Preview/Preview";
import PreviewDialogView from "./PreviewDialog";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import moment from 'moment';

import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ParaglidingIcon from '@mui/icons-material/Paragliding';
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
    RPC_ENDPOINT, 
    TWITTER_PROXY,
    DRIVE_PROXY,
} from '../utils/grapeTools/constants';

import { formatAmount, getFormattedNumberToLocale } from '../utils/grapeTools/helpers'
import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling
import { Paragliding } from '@mui/icons-material';
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

function TablePaginationActions(props:any) {
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
    const mode = props.mode || 0;
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
    
    //console.log("fetching mode: "+mode);
    //console.log("with: "+JSON.stringify(nfts));

    /*
    const holdercolumns: GridColDef[] = [
        { field: 'holder', headerName: 'Holder', width: 70, hide: false,
            renderCell: (params) => {
                return(
                    <>
                        .
                    </>
                )
            }
        },
        { field: 'image', headerName: 'Image', width: 70, hide: false,
            renderCell: (params) => {
                return(
                    <>
                        .
                    </>
                )
            }
        },
        { field: 'name', headerName: 'Name', width: 70, hide: false,
            renderCell: (params) => {
                return(
                    <>
                        .
                    </>
                )
            }
        },
        { field: 'mint', headerName: 'Mint Address', width: 70, hide: false,
            renderCell: (params) => {
                return(
                    <>
                        .
                    </>
                )
            }
        },
        { field: 'preview', headerName: '', width: 70, hide: false,
            renderCell: (params) => {
                return(
                    <>
                        .
                    </>
                )
            }
        }  
    ]
    */

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
    
    return (
        <Table>
            <TableContainer component={Paper} sx={{background:'none'}}>
                <StyledTable sx={{ minWidth: 500 }} size="small" aria-label="Portfolio Table">
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography variant="caption">Holder</Typography></TableCell>
                            {/*<TableCell><Typography variant="caption">Holding</Typography></TableCell>*/}
                            
                            {mode === 0 ?
                                <>
                                <TableCell align="center"><Typography variant="caption">Image</Typography></TableCell>
                                <TableCell align="center"><Typography variant="caption">Name</Typography></TableCell>
                                <TableCell><Typography variant="caption">Mint Address</Typography></TableCell>
                                </>
                            :
                                <>
                                <TableCell align="center">Holding</TableCell>
                                <TableCell align="center">Collectible</TableCell>
                                </>
                            }
                            <TableCell align="center"><Typography variant="caption">Curve</Typography></TableCell>
                            {mode === 0 &&
                                <TableCell></TableCell>
                            }
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
                                {(item?.owner?.address || item?.owner) &&
                                    <TableRow key={index} sx={{borderBottom:"none"}}>
                                        <TableCell>
                                            <Typography variant="h6">
                                                {(ValidateCurve(item.owner?.address || item?.owner)) ?
                                                    <ExplorerView showSolanaProfile={true} grapeArtProfile={true} address={item.owner?.address || item?.owner} type='address' shorten={8} hideTitle={false} style='text' color='white' fontSize='16px' />
                                                :
                                                    <ExplorerView address={item.owner?.address || item?.owner} type='address' shorten={8} hideTitle={false} style='text' color='white' fontSize='16px' />
                                                }
                                            </Typography>
                                        </TableCell>
                                        
                                        {mode === 0 ?
                                            <>
                                                <TableCell align="center" >
                                                    <Typography variant="h6">
                                                        <Avatar
                                                            sx={{backgroundColor:'#222'}}
                                                            src={DRIVE_PROXY+item.image}
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
                                                        <ExplorerView address={item.mintAddress || item.mint} type='address' shorten={0} hideTitle={false} style='text' color='white' fontSize='16px' />
                                                    </Typography>
                                                </TableCell>
                                            </>
                                        :
                                            <>
                                            <TableCell align="center" >
                                                <Typography variant="h6">
                                                    {item?.count}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" >
                                                <Typography variant="h6">
                                                    <AvatarGroup>
                                                    {item.image && item?.image.split(',').map((image:any,key:any)=> 
                                                        <Avatar
                                                            sx={{backgroundColor:'#222'}}
                                                            src={DRIVE_PROXY+image}
                                                            alt='Preview'
                                                            key={key}
                                                        />
                                                    )}
                                                    </AvatarGroup>
                                                </Typography>
                                            </TableCell>
                                            </>
                                        }

                                        <TableCell align="center">
                                            <Typography variant="h6">
                                                {(ValidateCurve(item.owner?.address || item.owner)) ?
                                                    <Tooltip title='This is a valid wallet address (on a Ed25519 curve)'>
                                                        <Chip
                                                            label="True"
                                                            color="success" 
                                                            variant="outlined"
                                                            icon={<CheckCircleOutlineIcon />}/>
                                                    </Tooltip>
                                                :
                                                    <Tooltip title='This address can be an Escrow of a Marketplace or Staking program holding this NFT'>
                                                        <Chip
                                                            label="False"
                                                            color="error"
                                                            variant="outlined" 
                                                            icon={<ErrorOutlineIcon />}/>
                                                    </Tooltip>
                                                }
                                                
                                            </Typography>
                                        </TableCell>

                                        {mode === 0 &&
                                            <TableCell align="center"> 
                                                <PreviewDialogView mint={item.mintAddress} />
                                                {/*
                                                <Tooltip title='View Mint'>
                                                    <Button 
                                                        component={Link} to={`${GRAPE_PREVIEW}${item.mintAddress}`}
                                                        sx={{
                                                            borderRadius: '24px',color:'white'
                                                        }}
                                                    >
                                                        view
                                                    </Button>
                                                </Tooltip>
                                                */}
                                            </TableCell>
                                        }
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
    const mode = props.mode || 0;
    const collectionAuthority = props.collectionAuthority;
    const [loading, setLoading] = React.useState(false);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [nfts, setNfts] = React.useState<Nft[]>([])
    const [holderExport, setHolderExport] = React.useState(null);
    const [fileGenerated, setFileGenerated] = React.useState(null);
    const [mintListGenerated, setMintListGenerated] = React.useState(null);
    const [mintOwnerListGenerated, setMintOwnerListGenerated] = React.useState(null);
    const [uniqueFileGenerated, setUniqueFileGenerated] = React.useState(null);
    const [uniqueHolders, setUniqueHolders] = React.useState(null);
    const [displayHolders, setDisplayHolders] = React.useState(null);
    const [totalMints, setTotalMints] = React.useState(null);
    const [totalMintsOnCurve, setTotalMintsOnCurve] = React.useState(null);

    const [anchorElUh, setAnchorElUh] = React.useState<null | HTMLElement>(null);
    const openUh = Boolean(anchorElUh);
    const handleClickUh = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorElUh(event.currentTarget);
    };
    const handleCloseMenuUh = () => {
        setAnchorElUh(null);
    };

    const [anchorElAll, setAnchorElAll] = React.useState<null | HTMLElement>(null);
    const openAll = Boolean(anchorElAll);
    const handleClickAll = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorElAll(event.currentTarget);
    };
    const handleCloseMenuAll = () => {
        setAnchorElAll(null);
    };

    const GET_NFTS_BY_COLLECTION = gql`
        query GetNfts($uac: [PublicKey!], $limit: Int!, $offset: Int!) {
            nfts(collections: $uac, limit: $limit, offset: $offset) {
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
    
    const getNFTOwners = async(collectionAddress:any) => {
            //const connection = connection;//new Connection("https://api.mainnet-beta.solana.com");
            const collectionMetadataAddress = new PublicKey(collectionAddress);
            const collectionData = await connection.getAccountInfo(collectionMetadataAddress);

            if (!collectionData) {
              throw new Error("Collection not found");
            }
          
            const collection = JSON.parse(Buffer.from(collectionData.data).toString());
            const nftMetadataAccounts = collection.data.nfts.map((nft:any) => new PublicKey(nft));
            const nftPromises = nftMetadataAccounts.map((nftAddress:any) => connection.getAccountInfo(nftAddress));
          
            const nftAccounts = await Promise.all(nftPromises);
            const nftData = nftAccounts.map((nftAccount) => {
              const metadata = JSON.parse(Buffer.from(nftAccount.data).toString());
              const ownerAddress = new PublicKey(metadata.data.sellerFeeAccount);
              return ownerAddress;
            });
            
            const holderArray = Array.from(new Set(nftData));
            console.log("holderArray: "+JSON.stringify(holderArray))
            return holderArray;
     }

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
            if (nfts.length > 0){
                if (!holderExport){
                    const harray = new Array();
                    for(const item of nfts){
                        try{
                            harray.push({
                                mint:item.mintAddress,
                                name:item.name,
                                owner:item.owner.address
                            })
                        }catch(e){console.log("ERR: "+e)}
                    }

                    // get unique holders
                    const count = {};
                    let cntr = 0;
                    const display = new Array();
                    const unique = new Array();
                    let csvFile = '';
                    let csvFileUnique = '';
                    let csvFileAll = '';
                    let totalOnCurve = 0;
                    
                    for(const item of nfts){
                        let found = false
                        let x = 0;
                        
                        const onCurve = ValidateCurve(item.owner?.address || item.owner);

                        if (onCurve)
                            totalOnCurve++;

                        if (cntr > 0){
                            csvFile += '\r\n';
                            csvFileUnique += '\r\n';
                            csvFileAll += '\r\n';
                        }else{
                            csvFile = 'mint\r\n';//,name\r\n';
                            csvFileUnique = 'mint,owner,count\r\n';//,name\r\n';
                            csvFileAll = 'mint,owner,curve\r\n';//,name\r\n';
                        }
                        csvFile += item.mintAddress; //+','+item.name;
                        csvFileAll += item.mintAddress+','+item.owner.address+','+onCurve;
                        
                        for (const inner of unique){
                            if (inner.owner === item.owner.address){
                                found = true;
                                inner.mint+=','+item.mintAddress;
                                inner.name+=','+item.name;
                                inner.image+=','+item.image;
                                inner.count++;
                                display[x].mint+=','+item.mintAddress;
                                display[x].name+=','+item.name;
                                display[x].image+=','+item.image;
                                display[x].count++;

                            }
                            x++;
                        }
                        if (!found){
                            unique.push({
                                mint:item.mintAddress,
                                name:item.name,
                                owner:item.owner.address,
                                image:item.image,
                                curve:onCurve,
                                count:1
                            })
                            display.push({
                                mint:item.mintAddress,
                                name:item.name,
                                owner:item.owner.address,
                                image:item.image,
                                curve:onCurve,
                                count:1
                            })
                        }


                        cntr++;
                    }

                    setTotalMints(cntr);
                    setTotalMintsOnCurve(totalOnCurve);

                    //console.log("at item: "+csvFile);
                    const jsonCSVString = (`data:text/csv;chatset=utf-8,${csvFile}`);
                    setMintListGenerated(jsonCSVString);

                    const jsonCSVStringAll = (`data:text/csv;chatset=utf-8,${csvFileAll}`);
                    setMintOwnerListGenerated(jsonCSVStringAll);
                    
                    const sortedDisplayResults = display.sort((a:any, b:any) => b.count - a.count)

                    //console.log("sortedDisplayResults: "+JSON.stringify(sortedDisplayResults))

                    setDisplayHolders(sortedDisplayResults);

                    const sortedResults = unique.sort((a:any, b:any) => b.count - a.count)

                    setUniqueHolders(sortedResults)

                    setHolderExport(harray);
                    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                        JSON.stringify(harray)
                    )}`;

                    setFileGenerated(jsonString);

                    const jsonUniqueString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                        JSON.stringify(sortedResults)
                    )}`;
                    setUniqueFileGenerated(jsonUniqueString);
    
                }
            }
        }
    }, [nfts]);

    React.useEffect(() => { 
        if (publicKey && !loading){   
            getHolders();
            // test new method
            if (collectionAuthority.collection){
                //getNFTOwners(collectionAuthority.collection);
            }

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
            if (nfts && uniqueHolders){
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
                                        {uniqueHolders ? <Badge badgeContent={uniqueHolders.length} max={99999} color="success">{mode === 0 ? `HOLDERS` : `COLLECTORS`}</Badge>:<>{mode === 0 ? `HOLDERS` : `COLLECTORS`}</>}
                                    </Typography>
                                </Grid>
                                <Grid item xs textAlign={'right'}>
                                    <ButtonGroup color='inherit' variant='outlined' sx={{borderRadius:'17px'}}>
                                        <Button
                                            disabled={true}
                                            sx={{borderRadius:'17px', color:'white'}}
                                        >
                                            <ParaglidingIcon /> Airdrop
                                        </Button>
                                        {uniqueFileGenerated &&
                                            <>
                                                <Tooltip title='Export Unique Holder Snapshot'>
                                                    {/*}
                                                    <Button
                                                        variant='outlined'
                                                        download={`${collectionAuthority.collection || collectionAuthority.updateAuthority}_uniqueholders_grape.json`}
                                                        href={uniqueFileGenerated}
                                                        sx={{borderRadius:'17px', ml:1 ,color:'white'}}
                                                    >
                                                        <DownloadIcon /> Unique Holders
                                                    </Button>
                                                    */}
                                                    <Button
                                                        id="basic-button"
                                                        aria-controls={openUh ? 'basic-menu' : undefined}
                                                        aria-haspopup="true"
                                                        aria-expanded={openUh ? 'true' : undefined}
                                                        onClick={handleClickUh}
                                                        color='inherit'
                                                        sx={{borderRadius:'17px', ml:1 ,color:'white'}}
                                                    >
                                                        <CloudDownloadIcon sx={{mr:1}} /> Unique Holders
                                                    </Button>
                                                </Tooltip>
                                                <Menu
                                                    id="basic-menu"
                                                    anchorEl={anchorElUh}
                                                    open={openUh}
                                                    onClose={handleCloseMenuUh}
                                                    MenuListProps={{
                                                    'aria-labelledby': 'basic-button',
                                                    }}
                                                    sx={{borderRadius:'17px'}}
                                                >
                                                    <MenuItem><Button variant='text' 
                                                        download={`${collectionAuthority.collection || collectionAuthority.updateAuthority}_uniqueholders_grape.json`}
                                                        href={uniqueFileGenerated}><DownloadIcon />  JSON</Button></MenuItem>
                                                    <MenuItem onClick={handleCloseMenuUh} disabled><DownloadIcon /> CSV</MenuItem>
                                                </Menu>
                                            </>
                                            
                                        }
                                        {fileGenerated &&
                                            
<>
                                            <Tooltip title='Export Holders Snapshot'>
                                                {/*}
                                                <Button
                                                    variant='outlined'
                                                    download={`${collectionAuthority.collection || collectionAuthority.updateAuthority}_holders_grape.json`}
                                                    href={fileGenerated}
                                                    sx={{borderRadius:'17px', ml:1 ,color:'white'}}
                                                >
                                                    <DownloadIcon /> All
                                                </Button>
                                                */}
                                                <Button
                                                    id="basic-button"
                                                    aria-controls={openAll ? 'basic-menu' : undefined}
                                                    aria-haspopup="true"
                                                    aria-expanded={openAll ? 'true' : undefined}
                                                    onClick={handleClickAll}
                                                    color='inherit'
                                                    sx={{borderRadius:'17px', ml:1 ,color:'white'}}
                                                >
                                                    <CloudDownloadIcon sx={{mr:1}} /> All
                                                </Button>
                                            </Tooltip>
                                            <Menu
                                                id="basic-menu"
                                                anchorEl={anchorElAll}
                                                open={openAll}
                                                onClose={handleCloseMenuAll}
                                                MenuListProps={{
                                                'aria-labelledby': 'basic-button',
                                                }}
                                                sx={{borderRadius:'17px'}}
                                            >
                                                <MenuItem><Button variant='text'
                                                    download={`${collectionAuthority.collection || collectionAuthority.updateAuthority}_holders_grape.json`}
                                                    href={fileGenerated}><DownloadIcon />  JSON</Button></MenuItem>
                                                <MenuItem><Button variant='text'
                                                    download={`${collectionAuthority.collection || collectionAuthority.updateAuthority}_holders_grape.csv`}
                                                    href={mintOwnerListGenerated}
                                                ><DownloadIcon /> CSV</Button></MenuItem>
                                            </Menu>
                                            </>
                                        }

                                        {mintListGenerated &&
                                            <Tooltip title='Export Mint Snapshot'>
                                                <Button
                                                    variant='outlined'
                                                    download={`${collectionAuthority.collection || collectionAuthority.updateAuthority}_mint_list.csv`}
                                                    href={mintListGenerated}
                                                    sx={{borderRadius:'17px', ml:1 ,color:'white'}}
                                                >
                                                    <DownloadIcon /> Mints
                                                </Button>
                                            </Tooltip>
                                        }
                                    </ButtonGroup>
                                </Grid>
                            </Grid>

                            {totalMints && totalMintsOnCurve &&
                                <Box sx={{ alignItems: 'center', textAlign: 'center',p:1}}>
                                    <Grid container spacing={0}>
                                        <Grid item xs={12} sm={3} md={3} key={1}>
                                            <Box
                                                className='grape-store-stat-item'
                                                sx={{borderRadius:'24px',m:2,p:1}}
                                            >
                                                <Typography variant="body2" sx={{color:'yellow'}}>
                                                    <>Avg Mints p/Wallet</>
                                                </Typography>
                                                {uniqueHolders &&
                                                    <Typography variant="h3">
                                                        {((totalMints/uniqueHolders.length)).toFixed(1)}
                                                        {/*((uniqueHolders[Math.floor(uniqueHolders.length/2)].count))*/}
                                                    </Typography>
                                                }
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={3} md={3} key={1}>
                                            <Box
                                                className='grape-store-stat-item'
                                                sx={{borderRadius:'24px',m:2,p:1}}
                                            >
                                                <Typography variant="body2" sx={{color:'yellow'}}>
                                                    <>Holding Concentration</>
                                                </Typography>
                                                {uniqueHolders &&
                                                    <Typography variant="h3">
                                                        {((uniqueHolders.length/totalMints)*100).toFixed(1)}%
                                                    </Typography>
                                                }
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={3} md={3} key={1}>
                                            <Box
                                                className='grape-store-stat-item'
                                                sx={{borderRadius:'24px',m:2,p:1}}
                                            >
                                                <Typography variant="body2" sx={{color:'yellow'}}>
                                                    <>Mints</>
                                                </Typography>
                                                <Typography variant="h3">
                                                    {totalMints}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={3} md={3} key={1}>
                                            <Box
                                                className='grape-store-stat-item'
                                                sx={{borderRadius:'24px',m:2,p:1}}
                                            >
                                                <Typography variant="body2" sx={{color:'yellow'}}>
                                                    <>On/Off Curve</>
                                                </Typography>
                                                <Typography variant="h3">
                                                    {totalMintsOnCurve}/
                                                    {totalMints - totalMintsOnCurve}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        
                                    </Grid>
                                    <LinearProgress color={((totalMintsOnCurve)/totalMints*100) < 50 ?'error' : 'success'} variant="determinate" value={(totalMintsOnCurve)/totalMints*100} />
                                        <Typography variant='caption'>
                                            {((totalMintsOnCurve)/totalMints*100).toFixed(0)}% held on a valid wallet address (address on a Ed25519 curve)
                                        </Typography>
                                </Box>
                            }

                        </>
                        {mode === 0 ?
                            <RenderHoldersTable nfts={nfts} mode={mode} />
                        :
                            <RenderHoldersTable nfts={uniqueHolders} mode={mode} />
                        }
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
