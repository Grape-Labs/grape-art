import React, { useCallback } from 'react';
import { WalletError, WalletNotConnectedError, WalletSignMessageError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Signer, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getOrCreateAssociatedTokenAccount, createAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token-v2";
//import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
//import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

import { RPC_CONNECTION, GRAPE_TREASURY } from '../utils/grapeTools/constants';
import { RegexTextField } from '../utils/grapeTools/RegexTextField';

import {
    getHashedName,
    getNameAccountKey,
    NameRegistryState,
    performReverseLookup,
    getTwitterRegistry,
} from '@bonfida/spl-name-service';

import { styled } from '@mui/material/styles';

import {
  Dialog,
  Button,
  ButtonGroup,
  Tooltip,
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
  Avatar,
  Grid,
  Paper,
  Typography,
  Box,
  Alert
} from '@mui/material';

import ExplorerView from '../utils/grapeTools/Explorer';

import { SelectChangeEvent } from '@mui/material/Select';
import { MakeLinkableAddress, ValidateAddress } from '../utils/grapeTools/WalletAddress'; // global key handling
import { useSnackbar } from 'notistack';

import { withSend } from "@cardinal/token-manager";
import { isCardinalWrappedToken, assertOwnerInstruction } from "../utils/cardinal/helpers";

import WarningIcon from '@mui/icons-material/Warning';
import SendIcon from '@mui/icons-material/Send';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
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

export default function SendToken(props: any) {
    const delegate = props?.delegate || null;
    const delegateAmount = props?.delegateAmount || null;
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
    const buttonType = props.buttonType || 'outlined';
    const useAvatar = props.useAvatar;
    const avatarSize = props.avatarSize;
    const buttonSize = props.buttonSize;

    let balance = 0;
    try{
        balance = Number(props.balance.replace(/[^0-9.-]+/g,""))
    } catch(e){
        balance = +props.balance;
    }
    const conversionrate = props.conversionrate;
    const sendtype = props.sendType || 0; // 0 regular
    const [memotype, setMemoType] = React.useState(0);
    const [memoref, setMemoRef] = React.useState('');
    const [memonotes, setMemoNotes] = React.useState(''); 
    const [memoText, setMemoText] = React.useState(null); 
    const [rdloading, setRDLoading] = React.useState(false);

    const freeconnection = RPC_CONNECTION;
    const connection = RPC_CONNECTION;
    const { publicKey, wallet, sendTransaction, signTransaction, signMessage } = useWallet();
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
    
    /*
    async function transferWormhole(){
        // Submit transaction - results in a Wormhole message being published
        const transaction = await transferFromSolana(
            connection,
            SOL_BRIDGE_ADDRESS,
            SOL_TOKEN_BRIDGE_ADDRESS,
            payerAddress,
            fromAddress,
            mintAddress,
            amount,
            targetAddress,
            CHAIN_ID_ETH,
            originAddress,
            originChain
        );
        const signed = await wallet.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(txid);
        // Get the sequence number and emitter address required to fetch the signedVAA of our message
        const info = await connection.getTransaction(txid);
        const sequence = parseSequenceFromLogSolana(info);
        const emitterAddress = await getEmitterAddressSolana(SOL_TOKEN_BRIDGE_ADDRESS);
        // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
        const { signedVAA } = await getSignedVAA(
            WORMHOLE_RPC_HOST,
            CHAIN_ID_SOLANA,
            emitterAddress,
            sequence
        );
        // Redeem on Ethereum
        await redeemOnEth(ETH_TOKEN_BRIDGE_ADDRESS, signer, signedVAA);
    }
    */
   
    async function transferTokens(tokenMintAddress: string, to: string, amount: number) {
        const fromWallet = publicKey;
        const toWallet = new PublicKey(toaddress);
        const mintPubkey = new PublicKey(tokenMintAddress);
        const amountToSend = +amounttosend;
        console.log("amountToSend:"+amountToSend)
        const tokenAccount = new PublicKey(mintPubkey);
        
        /*
        let GRAPE_TT_MEMO = {
            status:1, // status
            type:memotype, // AMA - SETUP 
            ref:memoref, // SOURCE
            notes:memonotes
        };*/
        
        /*
        if (memoText){
            memonotes = memoText
        }*/
        
        const transaction = new Transaction();

        if (tokenMintAddress === "So11111111111111111111111111111111111111112"){ // Check if SOL
            const decimals = 9;
            const adjustedAmountToSend = +(amountToSend * Math.pow(10, decimals)).toFixed(0);
            
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: fromWallet,
                    toPubkey: toWallet,
                    lamports: adjustedAmountToSend,
                })
            ).add(
                new TransactionInstruction({
                    keys: [{ pubkey: fromWallet, isSigner: true, isWritable: true }],
                    data: Buffer.from(JSON.stringify(memoText || ''), 'utf-8'),
                    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                })
            );
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

                const destinationAta = await getAssociatedTokenAddress(mintPubkey, destPublicKey, true);
                const sourceAta = await getAssociatedTokenAddress(mintPubkey, fromPublicKey, true);

                const [destinationAccount, destinationAtaAccount] = await connection.getMultipleAccountsInfo([destPublicKey, destinationAta])
                console.log("destination: "+JSON.stringify(destinationAccount))
                console.log("destinationAtaAccount: "+JSON.stringify(destinationAtaAccount))
                console.log("SystemProgram.programId: "+JSON.stringify(SystemProgram.programId));
                //
                // Require the account to either be a system program account or a brand new
                // account.
                //
                 
                /*
                if (
                    destinationAccount &&
                    !destinationAccount.owner.equals(SystemProgram.programId)
                    ) {
                    throw new Error("invalid account");
                }*/
                const receiverAccount = await connection.getAccountInfo(
                    destinationAta
                )
                
                // Instructions to execute prior to the transfer.
                const tx: Transaction = new Transaction();
                //if (!destinationAtaAccount) {
                if (!receiverAccount){   
                    tx.add(
                        assertOwnerInstruction({
                            account: destPublicKey,
                            owner: SystemProgram.programId,
                        })
                    );
                    tx.add(
                        createAssociatedTokenAccountInstruction(
                            fromPublicKey,
                            destinationAta,
                            destPublicKey,
                            mintPubkey
                        )
                    )
                }

                //const tx = transaction;
                const txi = await withSend(
                    tx,
                    connection,
                    // @ts-ignore
                    {publicKey:publicKey},
                    mintPubkey,
                    sourceAta,
                    destPublicKey
                )
                transaction.add(txi);
                /*
                if (memoText && memoText.length > 0){
                    transaction.add(
                        new TransactionInstruction({
                            keys: [{ pubkey: fromWallet, isSigner: true, isWritable: true }],
                            data: Buffer.from(JSON.stringify(memoText || ''), 'utf-8'),
                            programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                        })
                    );
                }*/
            } else{ 

                const accountInfo = await connection.getParsedAccountInfo(tokenAccount);
                const accountParsed = JSON.parse(JSON.stringify(accountInfo.value.data));
                const decimals = accountParsed.parsed.info.decimals;
                
                //tokenMintAddress
                /*
                console.log("TOKEN_PROGRAM_ID: "+TOKEN_PROGRAM_ID.toBase58())
                console.log("ASSOCIATED_TOKEN_PROGRAM_ID: "+ASSOCIATED_TOKEN_PROGRAM_ID.toBase58())
                console.log("mintPubkey: "+mintPubkey.toBase58())
                console.log("fromWallet: "+fromWallet.toBase58())
                console.log("toWallet: "+toWallet.toBase58())
                */
                try{
                    const fromTokenAccount = await getAssociatedTokenAddress(
                        mintPubkey,
                        publicKey,
                        true
                    )

                    const fromPublicKey = publicKey
                    const destPublicKey = new PublicKey(to)
                    const destTokenAccount = await getAssociatedTokenAddress(
                        mintPubkey,
                        destPublicKey,
                        true
                    )
                    const receiverAccount = await connection.getAccountInfo(
                        destTokenAccount
                    )

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

                    const amount = (amountToSend * Math.pow(10, decimals));
                    transaction.add(
                        createTransferInstruction(
                            fromTokenAccount,
                            destTokenAccount,
                            fromPublicKey,
                            amount
                        )
                    )
                    
                    if (memoText && memoText.length > 0){
                        transaction.add(
                            new TransactionInstruction({
                                keys: [{ pubkey: fromWallet, isSigner: true, isWritable: true }],
                                data: Buffer.from(JSON.stringify(memoText || ''), 'utf-8'),
                                programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                            })
                        );
                    }
                    
                } catch(err:any){
                    closeSnackbar();
                    //console.log("2. "+JSON.stringify(err));
                    enqueueSnackbar(err.message ? `${err.name}: ${err.message}` : err.name, { variant: 'error' });
                }
            }
            
        }

        //console.log("transaction: "+JSON.stringify(transaction))
        try{
            enqueueSnackbar(`Preparing to send ${amountToSend} ${name} to ${toaddress}`,{ variant: 'info' });
            //const signature = await sendTransaction(transaction, freeconnection);
            const signature = await sendTransaction(transaction, freeconnection, {
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
                signature: signature}, 
                'processed'
            );
            closeSnackbar(cnfrmkey);
            const action = (key:any) => (
                <Button href={`https://explorer.solana.com/tx/${signature}`} target='_blank' sx={{color:'white'}} >
                    Signature: {signature}
                </Button>
            );
            enqueueSnackbar(`Sent ${amountToSend} ${name} to ${toaddress}`,{ variant: 'success', action });

            try{
                if (fetchSolanaTokens)
                    fetchSolanaTokens()
                if (fetchSolanaBalance)
                    fetchSolanaBalance()
            } catch (ferr:any){
                console.log("Could not refresh please refresh your browser for updated balances")
            }
        }catch(e:any){
            closeSnackbar();
            //console.log("1. "+JSON.stringify(e));
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
        } 

    }

    const getReverseDomainLookup = async (url: string) => {
        if (!rdloading) {
            setRDLoading(true);

            const SOL_TLD_AUTHORITY = new PublicKey('58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx');
            //const ROOT_TLD_AUTHORITY = new PublicKey('ZoAhWEqTVqHVqupYmEanDobY7dee5YKbQox9BNASZzU');
            //const PROGRAM_ID = new PublicKey('jCebN34bUfdeUYJT13J1yG16XWQpt5PDx6Mse9GUqhR');
            //const centralState = new PublicKey('33m47vH6Eav6jr5Ry86XjhRft2jRBLDnDgPSHoquXi2Z');

            const domainName = url.slice(0, url.indexOf('.'));
            const hashedName = await getHashedName(domainName);
            const domainKey = await getNameAccountKey(hashedName, undefined, SOL_TLD_AUTHORITY);
            const registry = await NameRegistryState.retrieve(connection, new PublicKey(domainKey));

            if (!registry) {
                if (!registry?.registry?.owner?.toBase58()) {
                    throw new Error('Could not retrieve name data');
                }
            }
            setRDLoading(false);
            return registry?.registry?.owner?.toBase58();

            //console.log("registry.nftOwner.toBase58(): "+registry?.nftOwner?.toBase58());
            //console.log("registry.registry.owner.toBase58(): "+registry?.registry?.owner?.toBase58());

            //setPubkey(registry?.registry?.owner?.toBase58());
            
        }
    };
    
    const filterToAddress = async (address: string) => {
        if (address.includes(".sol")){
            const recipient = await getReverseDomainLookup(address);
            if (recipient){
                console.log('recipient: ' + JSON.stringify(recipient));
                setToAddress(recipient);
            } else{
                console.log("Invalid Sol SNS Address")
                setToAddress(null);
            }
        } else{
            setToAddress(address);
        }
    }

    function HandleSendSubmit(event: any) {
        event.preventDefault();
        if (amounttosend >= 0){
            const recipient = toaddress;
            if (recipient){
                // improve this check to do a reverse SNS lookup & cardinal check
                let proceed = false;
                if (recipient.includes(".sol")){
                    console.log("SNS: true");
                } else if(recipient.substring(0,1) === "@"){
                    console.log("Twitter Handle");
                } else {
                    // publickey
                    if ((recipient.length >= 32) && 
                        (recipient.length <= 44)){
                        proceed = true;
                    }
                    console.log("This is a pubkey");    
                }

                if (proceed){ // very basic check / remove and add twitter handle support (handles are not bs58)
                    transferTokens(mint, recipient, amounttosend);
                    handleClose();
                } else{
                    // Invalid Wallet ID
                    enqueueSnackbar(`Enter a valid Wallet Address!`,{ variant: 'error' });
                    console.log("INVALID WALLET ID");
                }
            } else{
                enqueueSnackbar(`Enter a valid Wallet Address!`,{ variant: 'error' });
            }
        }else{
            enqueueSnackbar(`Enter the balance you would like to send`,{ variant: 'error' });
        }
    }

    React.useEffect(() => {
         setConvertedAmountValue(amounttosend*conversionrate);
    }, [amounttosend]);
    
    return (
        <div>
            <Tooltip arrow title={
                <Grid
                    container
                >
                    <Grid item justifyContent="center" alignItems="center">
                        {mint === "So11111111111111111111111111111111111111112" ?
                            <Typography variant="body2">Send</Typography>
                        :
                            <Typography variant="body2">Send this token</Typography>
                        }
                        {delegate ? 
                        <>
                            <Box><Typography variant='caption' color={'yellow'} sx={{fontSize:'9px'}}>{delegateAmount.amount / (10 ** delegateAmount.decimals)} delegated</Typography></Box>
                        </>
                        :
                        <>
                        </>
                        }
                    </Grid>
                </Grid>
                }>
                <Button
                    variant={buttonType}
                    //aria-controls={menuId}
                    color='inherit'
                    //title={`Send ${name}`}
                    onClick={handleClickOpen}
                    size={!buttonSize ? "small" : buttonSize}
                    //onClick={isConnected ? handleProfileMenuOpen : handleOpen}
                    sx={{borderRadius:'17px'}}
                    >
                    {useAvatar ? <SendIcon sx={{fontSize:{avatarSize}}} /> : `Send ${showTokenName ? name : ``}`}
                </Button>
            </Tooltip>
        
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
                    Send {name}
                </BootstrapDialogTitle>
                <DialogContent dividers>
                    <FormControl>
                        <Grid container spacing={2}>
                            <Grid item xs={5}> 
                                <Grid container direction="row" alignItems="center">
                                    <ExplorerView buttonStyle={'text'} useLogo={logoURI} address={mint} type='address' title={name || (mint && trimAddress(mint)) || 'Explore'}/>
                                </Grid>
                            </Grid>
                            <Grid item xs={7}>
                                <RegexTextField
                                    regex={/[^0-9]+\.?[^0-9]/gi}
                                    autoFocus
                                    autoComplete='off'
                                    margin="dense"
                                    id="send-token-amount" 
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    value={userTokenBalanceInput || 0}
                                    onChange={(e: any) => {
                                        const val = e.target.value.replace(/^0+/, '');
                                        setTokensToSend(val)
                                        setTokenBalanceInput(val)
                                        }
                                    }
                                    inputProps={{
                                        style: { 
                                            textAlign:'right', 
                                            fontSize: '24px'
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} textAlign='right'>
                                <Typography
                                    variant="caption"
                                >
                                    Balance: {balance} 
                                    <ButtonGroup variant="text" size="small" aria-label="outlined primary button group" sx={{ml:1}}>
                                        <Button 
                                            onClick={() => {
                                                if (mint === "So11111111111111111111111111111111111111112"){
                                                    setTokensToSend(+balance-0.002)
                                                    setTokenBalanceInput(+balance-0.002)
                                                } else{
                                                    setTokensToSend(balance)
                                                    setTokenBalanceInput(+balance)
                                                }
                                            }}
                                        > 
                                            Max 
                                        </Button>
                                        <Button  
                                            //disabled={decimals === 0 && balance < 1}
                                            onClick={() => {
                                                setTokensToSend(+balance/2)
                                                setTokenBalanceInput(+balance/2) }}
                                        > 
                                            Half
                                        </Button>
                                    </ButtonGroup>
                                </Typography>
                            </Grid>
                            <Grid item xs={6}
                                sx={{
                                    textAlign:'right'
                                }}
                            >
                                <Typography
                                    variant="caption"
                                >
                                    {convertedAmountValue ?
                                        <>
                                        {+convertedAmountValue > 0 &&
                                            <>
                                            ~ ${convertedAmountValue.toFixed(2)}
                                            </>
                                        }
                                        </>
                                    :<></>}
                                </Typography>
                            </Grid>
                            
                            {sendtype === 0 ? 
                            (
                                <>
                                    <Grid item xs={12}>
                                        <TextField 
                                            id="send-to-address" 
                                            fullWidth 
                                            placeholder="Enter a Solana address" 
                                            label="To address" 
                                            variant="standard"
                                            autoComplete="off"
                                            onChange={(e) => {filterToAddress(e.target.value)}}
                                            InputProps={{
                                                inputProps: {
                                                    style: {
                                                        textAlign:'center'
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField 
                                            id="send-to-memo" 
                                            fullWidth 
                                            placeholder="Add a memo for your transaction" 
                                            label="Memo" 
                                            variant="standard"
                                            autoComplete="off"
                                            onChange={(e) => {setMemoText(e.target.value)}}
                                            InputProps={{
                                                inputProps: {
                                                    style: {
                                                        textAlign:'left'
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                </>
                            ) : (
                                <>
                                    <Grid item xs={12}>
                                        <TextField 
                                            id="send-to-address" 
                                            fullWidth 
                                            placeholder="Enter any Solana address" 
                                            label="To address" 
                                            variant="standard"
                                            autoComplete="off"
                                            value={GRAPE_TREASURY}
                                            disabled={true}
                                            onChange={(e) => {filterToAddress(e.target.value)}}
                                            InputProps={{
                                                inputProps: {
                                                    style: {
                                                        textAlign:'center'
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <FormControl fullWidth>
                                            <InputLabel id="demo-simple-select-label">Type</InputLabel>
                                            <Select
                                                labelId="demo-simple-select-label"
                                                id="demo-simple-select"
                                                value={(memotype.toString())}
                                                label="Type"
                                                onChange={handleSelectChange}
                                            >
                                                <MenuItem value={8}>Tools</MenuItem>
                                                <MenuItem value={1}>AMA</MenuItem>
                                                <MenuItem value={2}>Content</MenuItem>
                                                <MenuItem value={3}>Development</MenuItem>
                                                <MenuItem value={4}>Events</MenuItem>
                                                <MenuItem value={5}>Moderation</MenuItem>
                                                <MenuItem value={6}>Organization</MenuItem>
                                                <MenuItem value={7}>Parternship</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField 
                                            id="send-to-ref" 
                                            fullWidth 
                                            placeholder="Sender" 
                                            label="Sender/Community Name" 
                                            variant="standard"
                                            autoComplete="off"
                                            onChange={(e) => {setMemoRef(e.target.value)}}
                                            InputProps={{
                                                inputProps: {
                                                    style: {
                                                        textAlign:'left'
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField 
                                            id="send-to-notes" 
                                            fullWidth 
                                            placeholder="Notes" 
                                            label="Contribution Reason" 
                                            variant="standard"
                                            autoComplete="off"
                                            onChange={(e) => {setMemoNotes(e.target.value)}}
                                            InputProps={{
                                                inputProps: {
                                                    style: {
                                                        textAlign:'left'
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12}>
                            {delegate ? 
                            <>
                                <Alert severity="warning"
                                    sx={{borderRadius:'17px',background:'rgba(0,0,0,0.25)'}}
                                >
                                    You have delegated {delegateAmount.amount / (10 ** delegateAmount.decimals)} token to {delegate}
                                    <Typography variant='caption'><br/>* This may be a listing on an escrowless marketplace or a staking program</Typography>
                                </Alert>
                            </>
                            :
                            <>
                            </>
                            }
                            </Grid>
                        </Grid>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button     
                        fullWidth
                        type="submit"
                        color='inherit'
                        variant="outlined" 
                        title="Send"
                        disabled={
                            (userTokenBalanceInput > +balance) || (userTokenBalanceInput <= 0)
                        }
                        sx={{
                            borderRadius:'17px',
                            color:'white',
                        }}>
                        Send <ArrowUpwardIcon fontSize={'small'} sx={{ml:1}} />
                    </Button>
                </DialogActions>
            </form>
        </BootstrapDialog>
        </div>
    );
}