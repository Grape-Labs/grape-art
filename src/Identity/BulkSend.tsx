import React, { useCallback } from 'react';
import { WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Signer, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getOrCreateAssociatedTokenAccount, createAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token-v2";
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
} from '@mui/material';

import { SelectChangeEvent } from '@mui/material/Select';

import { programs, tryGetAccount, withSend } from "@cardinal/token-manager";
import { isCardinalWrappedToken, assertOwnerInstruction } from "../utils/cardinal/helpers";

import { useSnackbar } from 'notistack';

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

export default function BulkSend(props: any) {
    const tokensSelected = props.tokensSelected;
    const solanaHoldingRows = props.solanaHoldingRows;
    const tokenMap = props.tokenMap;
    const nftMap = props.nftMap;
    const fetchSolanaTokens = props.fetchSolanaTokens;

    const [holdingsSelected, setHoldingsSelected] = React.useState(null);

    const [open, setOpen] = React.useState(false);
    const [toaddress, setToAddress] = React.useState(null);
    const sendtype = props.sendType || 0; // just a type
    const [memotype, setMemoType] = React.useState(0);
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
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleSelectChange = (event: SelectChangeEvent) => {
        setMemoType(+(event.target.value as string));
    };

    async function transferTokenInstruction(tokenMintAddress: string, to: string, amount: number) {
        const fromWallet = publicKey;
        const toWallet = new PublicKey(to);
        const mintPubkey = new PublicKey(tokenMintAddress);
        const amountToSend = +amount;
        const tokenAccount = new PublicKey(mintPubkey);
        
        if (tokenMintAddress == "So11111111111111111111111111111111111111112"){ // Check if SOL
            const decimals = 9;
            const adjustedAmountToSend = amountToSend;//amountToSend * Math.pow(10, decimals);
            const transaction = new Transaction()
            .add(
                SystemProgram.transfer({
                    fromPubkey: fromWallet,
                    toPubkey: toWallet,
                    lamports: adjustedAmountToSend,
                })
            );
            
            return transaction;
        } else{

            // check if cardinal wrapped..
            const type = 0;
            const icwt = await isCardinalWrappedToken(connection, tokenMintAddress);
            console.log("mint: "+ tokenMintAddress);
            console.log("cardinal wrapped: "+JSON.stringify(icwt));

            if (icwt){
                const fromPublicKey = publicKey
                const destPublicKey = new PublicKey(to)

                //const { walletPublicKey, tokenClient, commitment } = ctx;
                //const { mint, destination } = req;

                const destinationAta = await getAssociatedTokenAddress(mintPubkey, destPublicKey);
                const sourceAta = await getAssociatedTokenAddress(mintPubkey, fromPublicKey);

                const [destinationAccount, destinationAtaAccount] = await connection.getMultipleAccountsInfo([destPublicKey, destinationAta])
                
                //
                // Require the account to either be a system program account or a brand new
                // account.
                //
                /*        
                if (
                    destinationAccount &&
                    !destinationAccount.account.owner.equals(SystemProgram.programId)
                    ) {
                throw new Error("invalid account");
                }
                */
                // Instructions to execute prior to the transfer.
                const transaction: Transaction = new Transaction();
                if (!destinationAtaAccount) {
                    transaction.add(
                        assertOwnerInstruction({
                            account: destPublicKey,
                            owner: SystemProgram.programId,
                        })
                    );
                    transaction.add(
                        createAssociatedTokenAccountInstruction(
                            fromPublicKey,
                            destinationAta,
                            destPublicKey,
                            mintPubkey
                        )
                    );
                }

                //const tx = transaction;
                const tx = await withSend(
                    transaction,
                    connection,
                    // @ts-ignore
                    {publicKey:publicKey},
                    mintPubkey,
                    sourceAta,
                    destPublicKey
                )
                
                //tx.feePayer = fromPublicKey;
                //const signedTx = await signTransaction(ctx, tx);
                /*
                tx.recentBlockhash = (
                    await connection.getLatestBlockhash('confirmed')
                    ).blockhash;
                
                console.log("signing");
                const signedTx = await signTransaction(tx);
                console.log("serializing");
                const rawTx = signedTx.serialize();
                
                await connection.sendRawTransaction(rawTx, {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                  });
                */
                return tx;
            
            } else{
                const accountInfo = await connection.getParsedAccountInfo(tokenAccount);
                const accountParsed = JSON.parse(JSON.stringify(accountInfo.value.data));
                //const decimals = accountParsed.parsed.info.decimals;


                const fromTokenAccount = await getAssociatedTokenAddress(
                    mintPubkey,
                    publicKey
                )

                const fromPublicKey = publicKey
                const destPublicKey = new PublicKey(to)
                const destTokenAccount = await getAssociatedTokenAddress(
                    mintPubkey,
                    destPublicKey
                )
                const receiverAccount = await connection.getAccountInfo(
                    destTokenAccount
                )

                const transaction = new Transaction()
                if (receiverAccount === null) {
                    transaction.add(
                    createAssociatedTokenAccountInstruction(
                        fromPublicKey,
                        destTokenAccount,
                        destPublicKey,
                        mintPubkey,
                        TOKEN_PROGRAM_ID,
                        ASSOCIATED_TOKEN_PROGRAM_ID
                    )
                    )
                }

                transaction.add(
                    createTransferInstruction(
                        fromTokenAccount,
                        destTokenAccount,
                        fromPublicKey,
                        amount
                    )
                )
                //console.log("transaction: "+JSON.stringify(transaction))
                return transaction;
            }
        }
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
            enqueueSnackbar(`Preparing transaction`,{ variant: 'info' });
            const signature = await sendTransaction(transactions, freeconnection, {
                skipPreflight: true,
                preflightCommitment: "confirmed"
            });
            
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
            
            enqueueSnackbar(`Sent token token accounts - ${signature}`,{ variant: 'success' });
            
            //setTransactionSignature(signature);
            return true;
        }catch(e:any){
            closeSnackbar();
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
        } 
    }
    
    async function transferTokens(toaddress:string) {
        const maxLen = 7;
        const maxLenTx = Math.ceil(holdingsSelected.length / maxLen);
        for (let item = 0; item < maxLenTx; item++) {
            const batchtx = new Transaction;
            enqueueSnackbar(`Processing transaction ${item+1} of ${maxLenTx}`,{ variant: 'info' });
            for (let holding = 0; holding < maxLen; holding++) {
                if (holdingsSelected[item * maxLen + holding]) {
                    const decimals = holdingsSelected[holding].send.tokenAmount.decimals;
                    const balance = holdingsSelected[holding].balance * Math.pow(10, decimals); //holdingsSelected[holding].balance;
                    
                    const tti = await transferTokenInstruction((holdingsSelected[item * maxLen + holding]).mint, toaddress, balance);
                    if (tti)
                        batchtx.add(tti);
                    
                }
            }
            await executeTransactions(batchtx, null);
        }
    
        fetchSolanaTokens()
    }
    
    function HandleSendSubmit(event: any) {
        event.preventDefault();
        //if (amounttosend >= 0){
            if (toaddress){
                if ((toaddress.length >= 32) && 
                    (toaddress.length <= 44)){ // very basic check / remove and add twitter handle support (handles are not bs58)
                    transferTokens(toaddress);
                    handleClose();
                } else{
                    // Invalid Wallet ID
                    enqueueSnackbar(`Enter a valid Wallet Address!`,{ variant: 'error' });
                    console.log("INVALID WALLET ID");
                }
            } else{
                enqueueSnackbar(`Enter a valid Wallet Address!`,{ variant: 'error' });
            }
        //}else{
        //    enqueueSnackbar(`Enter the balance you would like to send`,{ variant: 'error' });
        //}
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
                    color="success" 
                    title={`Send Bulk Tokens`}
                    onClick={handleClickOpen}
                    size="large"
                    fullWidth
                    //onClick={isConnected ? handleProfileMenuOpen : handleOpen}
                    sx={{borderRadius:'17px'}}
                    >
                    Send {tokensSelected.length} Token Account{tokensSelected.length > 1 && <>s</>}
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
            <form onSubmit={HandleSendSubmit}>
                <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
                    Bulk Send {tokensSelected.length} token account{tokensSelected.length > 1 && <>s</>}
                </BootstrapDialogTitle>
                <DialogContent dividers>
                    <FormControl>
                        <Grid container spacing={2}>
                            {holdingsSelected &&
                                <Grid item>
                                    <Typography>
                                        <List dense={true}>
                                            {holdingsSelected.length > 0 && holdingsSelected.map((item: any, key: number) => (
                                                <ListItem key={key}>
                                                        <Tooltip title='Token selected'>
                                                            <ListItemButton
                                                                href={`https://explorer.solana.com/address/${item.mint}`}
                                                                target='_blank'
                                                                sx={{borderRadius:'24px'}}                                           
                                                            >
                                                                <ListItemAvatar>
                                                                <Avatar
                                                                    sx={{backgroundColor:'#222'}}
                                                                        src={
                                                                            tokenMap.get(item.mint)?.logoURI || 
                                                                            item?.logo?.logo ||
                                                                            item.mint}
                                                                        alt={tokenMap.get(item.mint)?.name || item.mint}
                                                                >
                                                                    <QrCode2Icon sx={{color:'white'}} />
                                                                </Avatar>
                                                                </ListItemAvatar>
                                                                <ListItemText
                                                                    primary={item.name}
                                                                    secondary={new TokenAmount(item.send.tokenAmount?.amount, item.send.tokenAmount?.decimals).format()}
                                                                />
                                                            </ListItemButton>
                                                        </Tooltip>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Typography>

                                    <Typography variant="body2">
                                    You have selected {holdingsSelected.length} token{tokensSelected.length > 1 && <>s</>}, please make sure that this is correct before sending
                                    </Typography>

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
                            </Grid>
                            }
                        </Grid>
                    </FormControl>
                </DialogContent>
                <DialogActions>
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
                        Send
                    </Button>
                </DialogActions>
            </form>
        </BootstrapDialog>
        </div>
    );
}