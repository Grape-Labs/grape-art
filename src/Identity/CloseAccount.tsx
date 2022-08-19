import React, { useCallback } from 'react';
import { WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Signer, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createCloseAccountInstruction, createBurnInstruction } from "@solana/spl-token-v2";
//import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

import { GRAPE_RPC_ENDPOINT, TX_RPC_ENDPOINT, GRAPE_TREASURY } from '../utils/grapeTools/constants';
//import { RegexTextField } from '../utils/grapeTools/RegexTextField';

import { styled } from '@mui/material/styles';

import {
  Dialog,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  IconButton,
  Grid,
} from '@mui/material';

import { SelectChangeEvent } from '@mui/material/Select';
//import { MakeLinkableAddress, ValidateAddress } from '../utils/grapeTools/WalletAddress'; // global key handling
import { useSnackbar } from 'notistack';

import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';

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

export default function CloseAccount(props: any) {
    const fetchSolanaTokens = props.fetchSolanaTokens || null;
    const fetchSolanaBalance = props.fetchSolanaBalance || null;
    const [open, setOpen] = React.useState(false);
    const [amounttosend, setTokensToSend] = React.useState(0);
    const [showTokenName, setShowTokenName] = React.useState(props.showTokenName);
    const [toaddress, setToAddress] = React.useState(null);
    const [userTokenBalanceInput, setTokenBalanceInput] = React.useState(0);
    const [convertedAmountValue, setConvertedAmountValue] = React.useState(null);
    const mint = props.mint;
    const logoURI = props.logoURI;
    const name = props.name;
    const balance = Number(props.balance.replace(/[^0-9.-]+/g,""));
    const conversionrate = props.conversionrate;
    const sendtype = props.sendType || 0; // 0 regular
    const [memotype, setMemoType] = React.useState(0);
    const [memoref, setMemoRef] = React.useState('');
    const [memonotes, setMemoNotes] = React.useState(''); 
    const [memoText, setMemoText] = React.useState(null); 
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
    const handleClickOpen = () => {

        if (sendtype === 1) 
            setToAddress(GRAPE_TREASURY);

        setTokenBalanceInput(0);
        setConvertedAmountValue(0);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleSelectChange = (event: SelectChangeEvent) => {
        setMemoType(+(event.target.value as string));
      };

    async function closeAccount(tokenMintAddress: string) {
        


        const transaction = new Transaction()
        /*.add(
            createBurnInstruction(
              new PublicKey(list[i].owner.associatedTokenAccountAddress),
              new PublicKey(tokenMintAddress),
              publicKey,
              1,
              [],
              TOKEN_PROGRAM_ID
            )
        )*/
        .add(
            createCloseAccountInstruction(
                new PublicKey(tokenMintAddress),
                publicKey,
                publicKey,
                [],
                TOKEN_PROGRAM_ID
            )
        )
            

            try{
                enqueueSnackbar(`Preparing to close ${tokenMintAddress}`,{ variant: 'info' });
                const signature = await sendTransaction(transaction, freeconnection);
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                //await connection.confirmTransaction(signature, 'processed');
                const latestBlockHash = await connection.getLatestBlockhash();
                await connection.confirmTransaction({
                    blockhash: latestBlockHash.blockhash,
                    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                    signature: signature}, 
                    'processed'
                );
                closeSnackbar(cnfrmkey);
                const action = (key:any) => (
                        <Button href={`https://explorer.solana.com/tx/${signature}`} target='_blank'  sx={{color:'white'}}>
                            Signature: {signature}
                        </Button>
                );
                enqueueSnackbar(`Closed ${tokenMintAddress}`,{ variant: 'success', action });
            }catch(e:any){
                enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            } 
        
    }
    
    function HandleCloseSubmit(event: any) {
        event.preventDefault();
        if (mint){
            closeAccount(mint);
            handleClose();
        }else{
            enqueueSnackbar(`No mint selected`,{ variant: 'error' });
        }
    }

    React.useEffect(() => {
         setConvertedAmountValue(amounttosend*conversionrate);
    }, [amounttosend]);
    
    return (
        <div>

            

            {showTokenName ? 
                <Button
                    variant="outlined" 
                    //aria-controls={menuId}
                    title={`Send ${name}`}
                    onClick={handleClickOpen}
                    size="small"
                    //onClick={isConnected ? handleProfileMenuOpen : handleOpen}
                    sx={{borderRadius:'17px'}}
                    >
                    Send
                </Button>
            :
                <Button
                    variant="outlined" 
                    //aria-controls={menuId}
                    title={`Send ${name}`}
                    onClick={handleClickOpen}
                    size="small"
                    //onClick={isConnected ? handleProfileMenuOpen : handleOpen}
                    sx={{borderRadius:'17px'}}
                    >
                    Send {name}
                </Button>
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
            <form onSubmit={HandleCloseSubmit}>
                <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
                    Close {name}
                </BootstrapDialogTitle>
                <DialogContent dividers>
                    <FormControl>
                        <Grid container spacing={2}>
                            
                            You are about to close X account, this is not reversable

                        </Grid>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button     
                        fullWidth
                        type="submit"
                        variant="outlined" 
                        title="Close"
                    >
                        Close
                    </Button>
                </DialogActions>
            </form>
        </BootstrapDialog>
        </div>
    );
}