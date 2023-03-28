import React, { useCallback } from 'react';
import { WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Signer, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
//import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

import { RPC_CONNECTION } from '../../utils/grapeTools/constants';

import {
    transferNameOwnership,
    NameRegistryState,
    ROOT_DOMAIN_ACCOUNT,
  } from "@bonfida/spl-name-service";

import { styled } from '@mui/material/styles';

import {
  Dialog,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  IconButton,
  Grid,
  Typography
} from '@mui/material';

import { SelectChangeEvent } from '@mui/material/Select';
import { MakeLinkableAddress, ValidateAddress } from '../../utils/grapeTools/WalletAddress'; // global key handling
import { useSnackbar } from 'notistack';

import CircularProgress from '@mui/material/CircularProgress';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';

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

export default function TransferDomainView(props: any) {
    const fetchSolanaDomain = props.fetchSolanaDomain;
    const snsDomain = props.snsDomain;
    const [open, setOpen] = React.useState(false);
    const [toaddress, setToAddress] = React.useState(null);
    const freeconnection = RPC_CONNECTION;
    const connection = RPC_CONNECTION;
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
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    
    async function transferDomain(domain: string, toaddress: string) {
        const fromWallet = publicKey;
        const toWallet = new PublicKey(toaddress);
        console.log("domain: "+domain.substring(0,domain.indexOf('.sol')))
        console.log("toWallet: "+toWallet)
            const createTransferInstruction: TransactionInstruction = await transferNameOwnership(
                connection,
                domain.substring(0,domain.indexOf('.sol')),
                toWallet,
                undefined,
                ROOT_DOMAIN_ACCOUNT
            )

            const transaction = new Transaction()
            .add(createTransferInstruction)

            try{
                enqueueSnackbar(`Preparing to transfer domain ${domain} ${name} to ${toaddress}`,{ variant: 'info' });
                const signedTransaction = await sendTransaction(transaction, connection, {
                    skipPreflight: true,
                    preflightCommitment: "confirmed"
                });
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                //await connection.confirmTransaction(signature, 'processed');
                const latestBlockHash = await connection.getLatestBlockhash();
                await connection.confirmTransaction({
                    blockhash: latestBlockHash.blockhash,
                    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                    signature: signedTransaction}, 
                    'processed'
                );
                closeSnackbar(cnfrmkey);
                const action = (key:any) => (
                        <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                            Signature: {signedTransaction}
                        </Button>
                );
                enqueueSnackbar(`Transfered ${domain} to ${toaddress}`,{ variant: 'success', action });
                try{
                    fetchSolanaDomain();
                }catch(err:any){console.log("ERR: "+err)}
            }catch(e:any){
                enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            }   
    }
    
    function HandleSendSubmit(event: any) {
        event.preventDefault();
        if (snsDomain){
            if (toaddress){
                if ((toaddress.length >= 32) && 
                    (toaddress.length <= 44)){ // very basic check / remove and add twitter handle support (handles are not bs58)
                    transferDomain(snsDomain, toaddress);
                    handleClose();
                } else{
                    // Invalid Wallet ID
                    enqueueSnackbar(`Enter a valid Wallet Address!`,{ variant: 'error' });
                    console.log("INVALID WALLET ID");
                }
            } else{
                enqueueSnackbar(`Enter a valid Wallet Address!`,{ variant: 'error' });
            }
        }
    }
    
    return (
        <div>

        <Button
            variant="outlined" 
            //aria-controls={menuId}
            title={`Transfer ${snsDomain}`}
            onClick={handleClickOpen}
            size="small"
            //onClick={isConnected ? handleProfileMenuOpen : handleOpen}
            sx={{borderRadius:'17px'}}
            >
            Transfer
        </Button>
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
            <form onSubmit={HandleSendSubmit}>
                <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
                    Transfer {snsDomain}
                </BootstrapDialogTitle>
                <DialogContent dividers>
                    <FormControl>
                        <Grid container spacing={2}>
                                <>
                                    <Grid item xs={12} textAlign={'center'} sx={{mt:1}}>
                                        <Typography variant="body2">
                                            Enter the Solana address you would like to transfer this domain to
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField 
                                            id="send-to-address" 
                                            fullWidth 
                                            placeholder="Enter a Solana address" 
                                            label="To address" 
                                            variant="standard"
                                            autoComplete="off"
                                            onChange={(e) => {setToAddress(e.target.value)}}
                                            InputProps={{
                                                inputProps: {
                                                    style: {
                                                        textAlign:'center'
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                </>
                          
                        </Grid>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button     
                        fullWidth
                        type="submit"
                        variant="outlined" 
                        title="Transfer"
                        disabled={
                            (!toaddress || toaddress.length <= 0)
                        }
                        sx={{
                            borderRadius:'17px'
                        }}>
                        Transfer
                    </Button>
                </DialogActions>
            </form>
        </BootstrapDialog>
        </div>
    );
}