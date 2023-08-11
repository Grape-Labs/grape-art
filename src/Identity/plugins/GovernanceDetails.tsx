import React, { useCallback } from 'react';
import { WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Signer, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
//import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';

import { RPC_CONNECTION } from '../../utils/grapeTools/constants';

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
import { DialogProps } from '@mui/material/Dialog';

import { SelectChangeEvent } from '@mui/material/Select';
import { MakeLinkableAddress, ValidateAddress } from '../../utils/grapeTools/WalletAddress'; // global key handling
import { useSnackbar } from 'notistack';

import CircularProgress from '@mui/material/CircularProgress';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';

import { GovernanceView } from '../../StoreFront/Governance';

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

export default function GovernanceDetailsView(props: any) {
    const governanceToken = props.governanceToken;
    const [open, setOpen] = React.useState(false);
    const [scroll, setScroll] = React.useState<DialogProps['scroll']>('paper');

    const connection = RPC_CONNECTION;//useConnection();
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
    
    
    
    return (
        <div>

        <Grid container sx={{mt:1,mb:1}}>
            <Grid item xs={12}>
                <Button
                    variant="contained"
                    color="success" 
                    title={`Details`}
                    onClick={handleClickOpen}
                    fullWidth
                    sx={{borderRadius:'17px'}}
                    >
                    View
                </Button>
            </Grid>
        </Grid>
        <BootstrapDialog
            maxWidth={"lg"}
            onClose={handleClose}
            aria-labelledby="customized-dialog-title"
            open={open}
            scroll={scroll}
            PaperProps={{
                style: {
                    boxShadow: '3',
                    borderRadius: '17px',
                    },
                }}
        >
          <DialogContent dividers={scroll === 'paper'} sx={{background:'black',m:0,p:0}}>
            <GovernanceView governanceToken={governanceToken} />
          </DialogContent>
        </BootstrapDialog>
        </div>
    );
}