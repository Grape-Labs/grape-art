import React, { useCallback } from 'react';
import { WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Signer, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createBurnInstruction, createCloseAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token-v2";

//import { * as anchor } from '@project-serum/anchor';

//import { } from '@metaplex-foundation/mpl-token-metadata';
//import { } from '@metaplex-foundation/mpl-token';

//import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

import { RPC_CONNECTION, GRAPE_TREASURY } from '../utils/grapeTools/constants';
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

import { getMasterEdition, getMetadata } from '../utils/auctionHouse/helpers/accounts';

import { createBurnNftInstruction } from './BurnNFT';

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

export default function BulkBurnClose(props: any) {
    const type = props.type; // 0 = burn - 1 = close
    const tokensSelected = props.tokensSelected;
    const clearSelectionModels = props.clearSelectionModels;
    const solanaHoldingRows = props.solanaHoldingRows;
    const tokenMap = props.tokenMap;
    const nftMap = props.nftMap;
    const fetchSolanaTokens = props.fetchSolanaTokens;

    const [holdingsSelected, setHoldingsSelected] = React.useState(null);
    const [accept, setAccept] = React.useState(false);

    const [open, setOpen] = React.useState(false);
    const sendtype = props.sendType || 0; // just a type
    
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

    const handleAccept = () => {
        setAccept(!accept);
    };

    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    async function burnTokenInstruction(tokenMintAddress: string, amountToBurn: number) {
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
                amountToBurn || 1,
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
            enqueueSnackbar(`Preparing transaction`,{ variant: 'info' });
            //console.log("transactions: "+JSON.stringify(transactions))
            //const signed = await signTransaction(transactions);
            //enqueueSnackbar(`Signed transaction`,{ variant: 'info' });
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
            
            enqueueSnackbar(`Complete - ${signature}`,{ variant: 'success' });
            
            //setTransactionSignature(signature);
            return true;
        }catch(e:any){
            closeSnackbar();
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            try{
                clearSelectionModels();
            }catch(err){console.log("ERR: "+err)}
        } 
    }
    
    async function closeTokens() {
        var maxLen = 7;
        var maxLenTx = Math.ceil(holdingsSelected.length / maxLen);
        for (var item = 0; item < maxLenTx; item++) {
            enqueueSnackbar(`Processing close transaction ${item+1} of ${maxLenTx}`,{ variant: 'info' });
            const batchtx = new Transaction;
            for (var holding = 0; holding < maxLen; holding++) {
                if (holdingsSelected[item * maxLen + holding]) {
                    console.log("adding to close ("+(item * maxLen + holding)+"): "+(holdingsSelected[item * maxLen + holding]).mint)
                    var tti = await closeTokenInstruction((holdingsSelected[item * maxLen + holding]).mint);
                    if (tti)
                        batchtx.add(tti);
                }
            }
            await executeTransactions(batchtx, null);
        }
        
        fetchSolanaTokens();
        try{
            clearSelectionModels();
        }catch(e){console.log("ERR: "+e)}
    }

    const MD_PUBKEY = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

    async function burnTokens() {
        var maxLen = 7;
        var maxLenTx = Math.ceil(holdingsSelected.length / maxLen);
        for (var item = 0; item < maxLenTx; item++) {
            enqueueSnackbar(`Processing burn transaction ${item+1} of ${maxLenTx}`,{ variant: 'info' });
            const batchtx = new Transaction;
            for (var holding = 0; holding < maxLen; holding++) {
                if (holdingsSelected[item * maxLen + holding]) {
                    console.log("adding to burn ("+(item * maxLen + holding)+"): "+(holdingsSelected[item * maxLen + holding]).mint)
                    //console.log("burning: "+JSON.stringify(holdingsSelected[item * maxLen + holding]))

                    // check if NFT
                    if (holdingsSelected[item * maxLen + holding].send.tokenAmount.decimals === 0){
                        const mintPubkey = new PublicKey((holdingsSelected[item * maxLen + holding]).mint);
                        const [pda, bump] = await PublicKey.findProgramAddress(
                            [Buffer.from('metadata'), MD_PUBKEY.toBuffer(), mintPubkey.toBuffer()],
                            MD_PUBKEY
                        );

                        const masterEdition = await getMasterEdition(new PublicKey((holdingsSelected[item * maxLen + holding]).mint))
                        
                        const tokenAta = await getAssociatedTokenAddress(
                            mintPubkey,
                            publicKey,
                            true
                        );

                        // check if we have loaded the metadata
                        
                        
                        
                        // get collectionMetadata
                        var collectionMetadata = null as PublicKey;

                        try{
                            if (holdingsSelected[item * maxLen + holding]?.metadata_decoded){
                                // check if verified
                                
                                if (holdingsSelected[item * maxLen + holding]?.metadata_decoded.data?.creators){
                                    if (holdingsSelected[item * maxLen + holding]?.metadata_decoded.collection){
                                        if (holdingsSelected[item * maxLen + holding]?.metadata_decoded.collection.verified === 1){
                                            collectionMetadata = await getMetadata(new PublicKey(holdingsSelected[item * maxLen + holding].metadata_decoded.collection.key));
                                                //collectionMetadata = await getMetadata(new PublicKey(mintPubkey));
                                                //console.log("collectionMetadata this: "+JSON.stringify(collectionMetadata));
                                        }
                                    }
                                }
                            }
                        }catch (cmerr){
                            console.log("ERR: "+cmerr);
                        }

                        const accounts = {
                            metadata: pda,
                            owner: publicKey,
                            mint: mintPubkey,
                            tokenAccount: tokenAta,
                            masterEditionAccount: masterEdition,
                            splTokenProgram: new PublicKey(TOKEN_PROGRAM_ID),
                            collectionMetadata: collectionMetadata || null
                        }
                        var tti = await createBurnNftInstruction(accounts)

                        const transaction = new Transaction()
                            .add(tti);
                        transaction.feePayer = publicKey;
                        const simulate = await connection.simulateTransaction(transaction);
                        console.log("simulate: "+JSON.stringify(simulate));

                        if (tti){
                            if (!simulate.value.err){
                                //console.log("testing");
                                batchtx.add(tti);
                            } else {
                                //console.log("test burn");
                                const amountToBurn = holdingsSelected[item * maxLen + holding].send.tokenAmount.amount;
                                var tt = await burnTokenInstruction((holdingsSelected[item * maxLen + holding]).mint, amountToBurn);
                                if (tt){
                                    //console.log("test burn 2");
                                    //const transaction2 = new Transaction().add(tt);
                                    //transaction2.feePayer = publicKey;
                                    //const simulate2 = await connection.simulateTransaction(transaction2);
                                    //console.log("sim burn: "+simulate2.value.err);
                                    //if (!simulate2.value.err){
                                    {
                                        batchtx.add(tt);
                                    }/* else{
                                        console.log("Closing this token");
                                        var tt2 = await closeTokenInstruction((holdingsSelected[item * maxLen + holding]).mint);
                                        if (tt2)
                                            batchtx.add(tt2);
                                    }*/
                                
                                }
                            }
                        }
                    }else{
                        // get tokens to burn
                        const amountToBurn = holdingsSelected[item * maxLen + holding].send.tokenAmount.amount;
                        var tt = await burnTokenInstruction((holdingsSelected[item * maxLen + holding]).mint, amountToBurn);
                        if (tt)
                            batchtx.add(tt);
                    }
                    
                }
            }
            await executeTransactions(batchtx, null);
        }
    
        fetchSolanaTokens();
        try{
            clearSelectionModels();
        }catch(e){console.log("ERR: "+e)}
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
                                    <Alert severity="warning">
                                        {type === 0 ? <>This action is not reversable, please verify that the following are the tokens you would like to burn</>
                                        :
                                        <>Please verify that the following are the tokens you would like to close</>
                                        }
                                    </Alert>
                                    <Typography>
                                        <List dense={true}>
                                            {holdingsSelected.length > 0 && holdingsSelected.map((item: any) => (
                                                <ListItem>
                                                        <Tooltip title='View Token on Explorer'>
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
                                                                    secondary={type === 0 ? new TokenAmount(item.send.tokenAmount?.amount, item.send.tokenAmount?.decimals).format()+' '+tokenMap.get(item.mint)?.name && item.mint : tokenMap.get(item.mint)?.name && item.mint}
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
                                        <>This asset is will be closed, if you are participating in SPL Governance, Staking, Farming, Streaming please make sure you close those accounts and withdraw positions prior to closing this token account.</>
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
                            label={`${type === 0 ? `I am aware that burning of tokens accounts is not reversable`:`I am aware that I am closing these selected accounts`}`}
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