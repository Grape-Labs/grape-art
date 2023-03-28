import React, { useCallback } from 'react';
import { WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Signer, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
//import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';

import { RPC_CONNECTION } from '../../utils/grapeTools/constants';

import {
    NameRegistryState,
    registerDomainName,
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
    const start = addr.substring(0, 8);
    const end = addr.substring(addr.length - 4);
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

export default function BuyDomainView(props: any) {
    const [open, setOpen] = React.useState(false);
    const [toaddress, setToAddress] = React.useState(null);
    const [spaceAllocated, setSpaceAllocated] = React.useState(null);
    const [snsDomain, setSNSDomain] = React.useState(null);

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
    
    async function buyDomain(domain: string, tokenAccount: string) {
        const fetchSolanaDomain = props.fetchSolanaDomain; // refresh function
        const name = domain;//"bonfida"; // We want to register bonfida.sol
        const space = spaceAllocated * 1_000; // We want a 1kB sized domain (max 10kB)
        
        const buyerTokenAccount = new PublicKey(tokenAccount || "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp");
        
        const [, ix] = await registerDomainName(name, space, publicKey, new PublicKey(buyerTokenAccount));
        //const createInstruction: TransactionInstruction = await registerDomainName(name, space, publicKey, buyerTokenAccount);
        
        const tx = ix;//transactionInstr.txSigned;

        //console.log("txSigned: "+JSON.stringify(txSigned));
        
        const transaction = new Transaction()
        //    .add(ix)
        

        try{
            enqueueSnackbar(`Preparing to acquire domain ${domain}`,{ variant: 'info' });
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
            enqueueSnackbar(`Acquired ${domain}`,{ variant: 'success', action });
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
            if (spaceAllocated){
                buyDomain(snsDomain, "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp"); // domain, space allocated
            } else{
                enqueueSnackbar(`Enter a domain you would like to acquire!`,{ variant: 'error' });
            }
        }
    }
    
    return (
        <div>

        <Grid container sx={{mt:1,mb:1}}>
            <Grid item xs={12}>
                <Button
                    variant="contained"
                    color="success" 
                    title={`Get your Solana Domain`}
                    onClick={handleClickOpen}
                    size="large"
                    fullWidth
                    sx={{borderRadius:'17px'}}
                    >
                    Get your Solana Domain
                </Button>
            </Grid>
        </Grid>
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
                    Get a domain
                </BootstrapDialogTitle>
                <DialogContent dividers>
                    <FormControl>
                        <Grid container spacing={2}>
                            <>
                                <Grid item xs={12} textAlign={'center'} sx={{mt:1}}>
                                    <Typography variant="body2">
                                        Enter the domain you would like to acquire
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField 
                                        id="solana-desired-domain" 
                                        fullWidth 
                                        placeholder="Enter a Solana address" 
                                        label="Domain" 
                                        variant="standard"
                                        autoComplete="off"
                                        onChange={(e) => {setSNSDomain(e.target.value)}}
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
                    <FormControl>
                        <Grid container spacing={2}>
                            <>
                                <Grid item xs={12} textAlign={'center'} sx={{mt:1}}>
                                    <Typography variant="body2">
                                        Space Allocation
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField 
                                        id="size-allocation" 
                                        fullWidth 
                                        placeholder="Space Allocation (1kb-10kb)" 
                                        label="Allocation" 
                                        variant="standard"
                                        autoComplete="off"
                                        //type="number"
                                        onChange={(e) => {setSpaceAllocated(e.target.value)}}
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
                            (!snsDomain || snsDomain.length <= 0)
                        }
                        sx={{
                            borderRadius:'17px'
                        }}>
                        Buy
                    </Button>
                </DialogActions>
            </form>
        </BootstrapDialog>
        </div>
    );
}