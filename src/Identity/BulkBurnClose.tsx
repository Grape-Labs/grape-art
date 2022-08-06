import React, { useCallback } from 'react';
import { WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Signer, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createBurnInstruction, createCloseAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token-v2";
//import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

import { GRAPE_RPC_ENDPOINT, TX_RPC_ENDPOINT, GRAPE_TREASURY } from '../utils/grapeTools/constants';
import { RegexTextField } from '../utils/grapeTools/RegexTextField';
import { TokenAmount } from '../utils/grapeTools/safe-math';
import BN from "bn.js";

import { styled } from '@mui/material/styles';

import {
  Dialog,
  Button,
  ButtonGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  FormHelperText,
  MenuItem,
  InputLabel,
  Select,
  IconButton,
  Grid,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Tooltip,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';

import { SelectChangeEvent } from '@mui/material/Select';
import { MakeLinkableAddress, ValidateAddress } from '../utils/grapeTools/WalletAddress'; // global key handling
import { useSnackbar } from 'notistack';

import WhatshotIcon from '@mui/icons-material/Whatshot';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CircularProgress from '@mui/material/CircularProgress';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import { HdrOnSelectRounded } from '@mui/icons-material';
import { hostname } from 'os';

function trimAddress(addr: string) {
    if (!addr) return addr;
    let start = addr.substring(0, 8);
    let end = addr.substring(addr.length - 4);
    return `${start}...${end}`;
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuDialogActions-root': {
    padding: theme.spacing(1),
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

export default function BulkBurnClose(props: any) {
    const type = props.type; // 0 = burn - 1 = close
    const tokensSelected = props.tokensSelected;
    const solanaHoldingRows = props.solanaHoldingRows;
    const tokenMap = props.tokenMap;
    const fetchSolanaTokens = props.fetchSolanaTokens;

    const [holdingsSelected, setHoldingsSelected] = React.useState(null);
    const [accept, setAccept] = React.useState(false);

    const [open, setOpen] = React.useState(false);
    const sendtype = props.sendType || 0; // just a type
    
    const freeconnection = new Connection(TX_RPC_ENDPOINT);
    const connection = new Connection(GRAPE_RPC_ENDPOINT);//useConnection();
    const { publicKey, wallet, sendTransaction, signTransaction } = useWallet();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );

    const handleAccept = () => {
        setAccept(!accept);
    };

    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    async function burnTokenInstruction(tokenMintAddress: string) {
        const mintPubkey = new PublicKey(tokenMintAddress);

        const tokenAta = await getAssociatedTokenAddress(
            mintPubkey,
            publicKey,
            true
        );

        const transaction = new Transaction()
        .add(
            createBurnInstruction(
                new PublicKey(tokenAta),
                mintPubkey,
                publicKey,
                1,
                [],
                TOKEN_PROGRAM_ID
            )
        )
        return transaction;
    }

    async function closeTokenInstruction(tokenMintAddress: string) {
        const mintPubkey = new PublicKey(tokenMintAddress);
        
        const tokenAta = await getAssociatedTokenAddress(
            mintPubkey,
            publicKey,
            true
        );

        const transaction = new Transaction()
        .add(
            createCloseAccountInstruction(
              new PublicKey(tokenAta),
              publicKey,
              publicKey,
              [],
              TOKEN_PROGRAM_ID
            )
        )
        
        return transaction;
        
    }

    async function executeTransactions(transactions: Transaction, memo: string) {
        if (memo){
            transactions.add(
                new TransactionInstruction({
                    keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
                    data: Buffer.from(JSON.stringify(memo), 'utf-8'),
                    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                })
            )
        }       

        try{
            enqueueSnackbar(`Preparing execute instructions`,{ variant: 'info' });
            const signature = await sendTransaction(transactions, freeconnection);
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signature}, 
                'processed'
            );
        
            closeSnackbar(cnfrmkey);
            
            enqueueSnackbar(`Complete - ${signature}`,{ variant: 'success' });
            
            //setTransactionSignature(signature);
            return true;
        }catch(e:any){
            closeSnackbar();
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
        } 
    }
    
    async function closeTokens() {
        var maxLen = 7;
        for (var item = 0; item < holdingsSelected.length / maxLen; item++) {
            const batchtx = new Transaction;
            for (var holding = 0; holding < maxLen; holding++) {
                if (holdingsSelected[item * maxLen + holding]) {
                    var tti = await closeTokenInstruction((holdingsSelected[item * maxLen + holding]).mint);
                    if (tti)
                        batchtx.add(tti);
                    
                }
            }
            await executeTransactions(batchtx, null);
        }
    
        fetchSolanaTokens()
    }
    async function burnTokens() {
        var maxLen = 7;
        for (var item = 0; item < holdingsSelected.length / maxLen; item++) {
            const batchtx = new Transaction;
            for (var holding = 0; holding < maxLen; holding++) {
                if (holdingsSelected[item * maxLen + holding]) {
                    var tti = await burnTokenInstruction((holdingsSelected[item * maxLen + holding]).mint);
                    if (tti)
                        batchtx.add(tti);
                    
                }
            }
            await executeTransactions(batchtx, null);
        }
    
        fetchSolanaTokens()
    }
    
    function HandleSubmit(event: any) {
        event.preventDefault();
            if (type === 0){ // burn
                burnTokens();
            }else if (type === 1){ // close
                closeTokens();
            }
            handleClose();
    }
    
    React.useEffect(() => {
        if (tokensSelected){
            const hSelected = new Array();
            for (var x of tokensSelected){
                for (var y of solanaHoldingRows){
                    if (y.id === x){
                        hSelected.push(y);
                    }
                }
            }
            setHoldingsSelected(hSelected);
        }
    }, [tokensSelected]);

    return (
        <div>

            

            {tokensSelected ? 
                <Button
                    variant="contained"
                    color="error" 
                    title={`Burn/Close Bulk Tokens`}
                    onClick={handleClickOpen}
                    size="small"
                    //onClick={isConnected ? handleProfileMenuOpen : handleOpen}
                    sx={{borderRadius:'17px'}}
                    >
                    {type === 0 ? <>Burn</>:<>Close</>} {tokensSelected.length} Token Account{tokensSelected.length > 1 && <>s</>}
                </Button>
            :
                <></>
            }   
        <BootstrapDialog
            onClose={handleClose}
            aria-labelledby="customized-dialog-title"
            open={open}
            PaperProps={{ 
                style: {
                    boxShadow: '3',
                    borderRadius: '17px',
                    },
                }}
        >
            <form onSubmit={HandleSubmit}>
                <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
                    {type === 0 ? <>Burn</>:<>Close</>}  {tokensSelected.length} token account{tokensSelected.length > 1 && <>s</>}
                </BootstrapDialogTitle>
                <DialogContent dividers>
                    <FormControl>
                        <Grid container spacing={2}>
                            {holdingsSelected &&
                                <Grid item>
                                    <Alert severity="warning">This action is not reversable, please verify that the following are the tokens you would like to {type === 0 ? <>BURN</>:<>CLOSE</>}</Alert>
                                    <Typography>
                                        <List dense={true}>
                                            {holdingsSelected.length > 0 && holdingsSelected.map((item: any) => (
                                                <ListItem>
                                                        <Tooltip title='Token selected'>
                                                            <ListItemButton
                                                                sx={{borderRadius:'24px'}}                                           
                                                            >
                                                                <ListItemAvatar>
                                                                <Avatar
                                                                    sx={{backgroundColor:'#222'}}
                                                                        src={tokenMap.get(item.mint)?.logoURI || item.mint}
                                                                        alt={tokenMap.get(item.mint)?.name || item.mint}
                                                                >
                                                                    <QrCode2Icon sx={{color:'white'}} />
                                                                </Avatar>
                                                                </ListItemAvatar>
                                                                <ListItemText
                                                                    primary={item.name}
                                                                    secondary={type === 0 ? new TokenAmount(item.send.tokenAmount.amount, item.send.tokenAmount.decimals).format() : ''}
                                                                />
                                                            </ListItemButton>
                                                        </Tooltip>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Typography>

                                    <Typography variant="body2">
                                    You have selected {holdingsSelected.length} token{tokensSelected.length > 1 && <>s</>} to {type === 0 ? <>BURN</>:<>CLOSE</>}, please make sure that this is correct before {type === 0 ? <>BURNING</>:<>CLOSING</>}.&nbsp;
                                    {type === 0 ? 
                                        <>The balance of this asset will be burnt and will not be recoverable. Once burnt you can close those accounts.</>
                                    :
                                        <>This asset is will be deleted forever, if you are participating in SPL Governance, Staking, Farming, Streaming please make sure you close those accounts prior to closing this token account.</>
                                    }
                                    </Typography>

                            </Grid>
                            }
                        </Grid>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Grid item>
                    <FormControlLabel
                        control={
                        <Checkbox checked={accept} onChange={handleAccept} name="" />
                        }
                        label={`I am aware the ${type === 0 ? `burning`:`closing`} of token accounts is not reversable`}
                    />
                    </Grid>
                    <Grid item>
                    {accept &&
                        <Button     
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="error"  
                            title="Send"
                            disabled={!tokensSelected || (tokensSelected.length <= 0)}
                            sx={{
                                borderRadius:'17px'
                            }}>
                            <WhatshotIcon sx={{mr:1}}/>{type === 0 ? <>Burn</>:<>Close</>} Token Account
                        </Button>
                    }
                    </Grid>
                </DialogActions>
            </form>
        </BootstrapDialog>
        </div>
    );
}