import React, { useEffect, useState, useCallback, memo } from "react";

import CyberConnect, { Env, Blockchain, ConnectionType } from '@cyberlab/cyberconnect';

import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from "@solana/spl-token-v2";

import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import { FollowListInfoResp, SearchUserInfoResp, Network } from '../utils/cyberConnect/types';
import { followListInfoQuery, searchUserInfoQuery } from '../utils/cyberConnect/query';

import {
    Typography,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import Confetti from 'react-dom-confetti';

import MuiAlert, { AlertProps } from '@mui/material/Alert';

import FlagIcon from '@mui/icons-material/Flag';
import EmojiFlagsIcon from '@mui/icons-material/EmojiFlags';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CircularProgress from '@mui/material/CircularProgress';

import { WalletError } from '@solana/wallet-adapter-base';

import { 
    TOKEN_REALM_PROGRAM_ID,
    TOKEN_REALM_ID,
    TOKEN_VERIFICATION_NAME,
    TOKEN_VERIFICATION_AMOUNT,
    TOKEN_VERIFICATION_ADDRESS,
    GRAPE_RPC_ENDPOINT, 
    OTHER_MARKETPLACES,
    TX_RPC_ENDPOINT, 
    GRAPE_RPC_REFRESH, 
    GRAPE_PREVIEW, 
    GRAPE_PROFILE,
    FEATURED_DAO_ARRAY,
    GRAPE_TREASURY,
    TOKEN_REPORT_AMOUNT,
    REPORT_ALERT_THRESHOLD,
} from '../utils/grapeTools/constants';

import { MakeLinkableAddress, ValidateAddress, ValidateCurve, trimAddress, timeAgo } from '../utils/grapeTools/WalletAddress'; // global key handling

import "../App.less";

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import GrapeIcon from "../components/static/GrapeIcon";

const config = {
    angle: 90,
    spread: 360,
    startVelocity: 40,
    elementCount: 200,
    dragFriction: 0.12,
    duration: 4000,
    stagger: 3,
    width: "10px",
    height: "10px",
    perspective: "500px",
    colors: ["#f00", "#0f0", "#00f"]
  };

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
    ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
}));

export function SocialLikes(props: any){
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isLiked, setIsLiked] = React.useState(false);
    const [justLiked, setJustLiked] = React.useState(false);
    const [loadingLikedState, setLoadingLikedState] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const [followListInfo, setFollowListInfo] = useState<FollowListInfoResp | null>(null);
    const {publicKey} = useWallet();
    const solanaProvider = useWallet();
    const mint = props.mint;
    
    const NAME_SPACE = 'Grape';
    const NETWORK = Network.SOLANA;
    const FIRST = 10; // The number of users in followings/followers list for each fetch

    const cyberConnect = new CyberConnect({
        namespace: NAME_SPACE,
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: "",//solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    // Get the current user followings and followers list
    const initFollowListInfo = async () => {
        if (!mint) {
            return;
    }
    
    setLoading(true);
    const resp = await followListInfoQuery({
        address:mint,
        namespace: NAME_SPACE,
        network: NETWORK,
        followingFirst: FIRST,
        followerFirst: FIRST,
    });
    if (resp) {
      setFollowListInfo(resp);
    }
    setLoading(false);
  };

    const getLikeStatus = async () => {
        
        if (publicKey){
            if (mint){
                setLoadingLikedState(true);
                setIsLiked(false);
                let socialconnection = await fetchSearchAddrInfo(publicKey.toBase58(), mint);
                if (socialconnection){
                    //if (socialconnection?.identity){
                    if (socialconnection?.connections[0]?.followStatus) {  
                        if ((socialconnection?.connections[0].type.toString() === "LIKE")||
                            (socialconnection?.connections[0].type.toString() === "FOLLOW"))
                            setIsLiked(socialconnection?.connections[0].followStatus.isFollowing);
                    }
                }
                setLoadingLikedState(false);
            }
            
        }
    }

    const fetchSearchAddrInfo = async (fromAddr:string, toAddr: string) => {
        const resp = await searchUserInfoQuery({
            fromAddr:fromAddr,
            toAddr,
            namespace: NAME_SPACE,
            network: Network.SOLANA,
            type: 'LIKE',
        });
        if (resp) {
            setSearchAddrInfo(resp);
        }

        return resp;
    };

    const likeWalletConnect = async (followAddress:string) => {
        // address:string, alias:string
        let tofollow = followAddress;   
        let promise = await cyberConnect.connect(tofollow,'', ConnectionType.LIKE)
        .catch(function (error) {
            console.log(error);
        });
        setJustLiked(true);
        initFollowListInfo();
        getLikeStatus();
    };
    const likeWalletDisconnect = async (followAddress:string) => {
        // address:string, alias:string
        let promise = await cyberConnect.disconnect(followAddress.toString())
        .catch(function (error) {
            console.log(error);
        });
        initFollowListInfo();
        getLikeStatus();
    };
    
    React.useEffect(() => {
        initFollowListInfo();
        getLikeStatus();
    },[]);

    return ( 
        <>
            <Confetti
                active={ justLiked }
                config={ config }
            />
        {loadingLikedState ?
            <Button 
                sx={{borderRadius:'24px'}}
            >
                <CircularProgress sx={{p:'14px',m:-2}} />
            </Button>
        :
            <>
            
            {isLiked ?  
                    <Tooltip title="Unlike">
                        <Button 
                            variant="text" 
                            onClick={() => likeWalletDisconnect(mint)}
                            size="small"
                            className="profileAvatarIcon"
                            sx={{borderRadius:'24px', color:'white'}}
                            >
                            <FavoriteIcon sx={{fontSize:'24px', color:'red'}} /> 
                            {followListInfo?.liked && +followListInfo?.liked > 0 ?
                                <Typography variant="caption" sx={{ml:1}}>
                                    {followListInfo?.liked}
                                </Typography>
                            :<></>}
                        </Button>
                    </Tooltip>
                :
                    <Tooltip title="Like">
                        <Button 
                            variant="text" 
                            onClick={() => likeWalletConnect(mint)}
                            size="small"
                            className="profileAvatarIcon"
                            sx={{borderRadius:'24px', color:'white'}}
                            >
                            <FavoriteBorderIcon sx={{fontSize:'24px'}} /> 
                            {followListInfo?.liked && +followListInfo?.liked > 0 ?
                                <Typography variant="caption" sx={{ml:1}}>
                                    {followListInfo?.liked}
                                </Typography>
                            :<></>}
                        </Button>
                    </Tooltip>
            }
            </>
        }
        </>
    );
}

export function SocialFlags(props: any){
    const [solanaDomain, setSolanaDomain] = React.useState(null);
    const [isFlagged, setIsFlagged] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [loadingFlaggedState, setLoadingFlaggedState] = React.useState(false);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const [reportalertopen, setReportAlertOpen] = React.useState(false);
    const [warningreportopen, setWarningReportOpen] = React.useState(false);
    
    const { publicKey, sendTransaction } = useWallet();

    const freeconnection = new Connection(TX_RPC_ENDPOINT);
    const { connection } = useConnection();
    
    const [followListInfo, setFollowListInfo] = useState<FollowListInfoResp | null>(null);
    const solanaProvider = useWallet();
    const mint = props.mint;
    
    const NAME_SPACE = 'Grape';
    const NETWORK = Network.SOLANA;
    const FIRST = 10; // The number of users in followings/followers list for each fetch
    
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const onError = useCallback(
        (error: WalletError) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
            console.error(error);
        },
        [enqueueSnackbar]
    );
    
    const cyberConnect = new CyberConnect({
        namespace: NAME_SPACE,
        env: Env.PRODUCTION,
        chain: Blockchain.SOLANA,
        provider: solanaProvider,
        chainRef: "",//solana.SOLANA_MAINNET_CHAIN_REF,
        signingMessageEntity: 'Grape' || 'CyberConnect',
    });

    const handleAlertReportClose = () => {
        setReportAlertOpen(false);
    };

    const handleWarningReportClose = () => {
        setWarningReportOpen(false);
    };

    const getFlagStatus = async () => {
        
        if (publicKey){
            if (mint){
                setLoadingFlaggedState(true);
                let socialconnection = await fetchSearchAddrInfo(publicKey.toBase58(), mint);
                if (socialconnection){
                    //if (socialconnection?.identity){
                    if (socialconnection?.connections[0]?.followStatus) { 
                        if ((socialconnection?.connections[0].type.toString() === "REPORT")||
                            (socialconnection?.connections[0].type.toString() === "FOLLOW"))
                            setIsFlagged(socialconnection?.connections[0].followStatus.isFollowing);
                    }
                }
                setLoadingFlaggedState(false);
            }
            
        }
    }

    const fetchSearchAddrInfo = async (fromAddr:string, toAddr: string) => {
        const resp = await searchUserInfoQuery({
            fromAddr:fromAddr,
            toAddr,
            namespace: NAME_SPACE,
            network: Network.SOLANA,
            type: 'REPORT',
        });
        if (resp) {
            setSearchAddrInfo(resp);
        }

        return resp;
    };

    // Get the current user followings and followers list
    const initFollowListInfo = async () => {
        if (!mint) {
        return;
        }
        
        setLoading(true);
        const resp = await followListInfoQuery({
            address:mint,
            namespace: NAME_SPACE,
            network: NETWORK,
            followingFirst: FIRST,
            followerFirst: FIRST,
        });
        if (resp) {
            setFollowListInfo(resp);
            if (+resp?.reported >= REPORT_ALERT_THRESHOLD)
                setWarningReportOpen(true);
        }
        setLoading(false);
    };

    function handleFlagMintTransaction(mint:string){
        const tokenMintAddress = TOKEN_VERIFICATION_ADDRESS;
        const tokenMintName = 'GRAPE';
        const to = GRAPE_TREASURY;
        const amount = TOKEN_REPORT_AMOUNT;
        const notes = mint;
        flatMintTransaction(tokenMintAddress, tokenMintName, to, amount, notes)
    }

    async function flatMintTransaction(tokenMintAddress: string, tokenMintName: string, to: string, amount: number, notes:string) {
        const fromWallet = publicKey;
        const toaddress = to;
        const toWallet = new PublicKey(to);
        const mintPubkey = new PublicKey(tokenMintAddress);
        const amountToSend = +amount;
        const tokenAccount = new PublicKey(mintPubkey);
        
        handleAlertReportClose();

        let GRAPE_TT_MEMO = {
            state:1, // status
            type:'REPORT', // AMA - SETUP 
            ref:'GRAPE.ART', // SOURCE
            notes:notes
        };
        
        
        if (tokenMintAddress == "So11111111111111111111111111111111111111112"){ // Check if SOL
            const decimals = 9;
            const adjustedAmountToSend = amountToSend * Math.pow(10, decimals);
            const transaction = new Transaction()
            .add(
                SystemProgram.transfer({
                    fromPubkey: fromWallet,
                    toPubkey: toWallet,
                    lamports: adjustedAmountToSend,
                })
            ).add(
                new TransactionInstruction({
                    keys: [{ pubkey: fromWallet, isSigner: true, isWritable: true }],
                    data: Buffer.from(JSON.stringify(GRAPE_TT_MEMO), 'utf-8'),
                    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                })
            );
            try{
                enqueueSnackbar(`Preparing to send ${amountToSend} ${tokenMintName} to ${toaddress}`,{ variant: 'info' });
                const signature = await sendTransaction(transaction, freeconnection);
                const snackprogress = (key:any) => (
                    <CircularProgress sx={{padding:'10px'}} />
                );
                const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                await connection.confirmTransaction(signature, 'processed');
                closeSnackbar(cnfrmkey);
                const action = (key:any) => (
                        <Button href={`https://explorer.solana.com/tx/${signature}`} target='_blank'  sx={{color:'white'}}>
                            Signature: {signature}
                        </Button>
                );

                flagWalletConnect(mint);

                enqueueSnackbar(`Sent ${amountToSend} ${tokenMintName} to ${toaddress}`,{ variant: 'success', action });
            }catch(e:any){
                enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
            } 
        } else{
            const accountInfo = await connection.getParsedAccountInfo(tokenAccount);
            const accountParsed = JSON.parse(JSON.stringify(accountInfo.value.data));
            const decimals = accountParsed.parsed.info.decimals;

            let fromAta = await getAssociatedTokenAddress( // calculate from ATA
                mintPubkey, // mint
                fromWallet, // from owner
                true,
                TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
                ASSOCIATED_TOKEN_PROGRAM_ID, // always ASSOCIATED_TOKEN_PROGRAM_ID
            );
            
            let toAta = await getAssociatedTokenAddress( // calculate to ATA
                mintPubkey, // mint
                toWallet, // to owner
                true,
                TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
                ASSOCIATED_TOKEN_PROGRAM_ID, // always ASSOCIATED_TOKEN_PROGRAM_ID
            );
            
            const adjustedAmountToSend = amountToSend * Math.pow(10, decimals);
            const receiverAccount = await connection.getAccountInfo(toAta);
            
            if (receiverAccount === null) { // initialize token
                const transaction = new Transaction()
                .add(
                    createAssociatedTokenAccountInstruction(
                        toWallet, // owner of token account
                        toAta, // ata
                        fromWallet, // fee payer
                        mintPubkey, // mint
                        TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
                        ASSOCIATED_TOKEN_PROGRAM_ID, // always ASSOCIATED_TOKEN_PROGRAM_ID
                        
                    )
                )
                .add(
                    createTransferInstruction(
                        fromAta,
                        toAta,
                        publicKey,
                        adjustedAmountToSend,
                        [],
                        TOKEN_PROGRAM_ID,
                    )
                ).add(
                    new TransactionInstruction({
                        keys: [{ pubkey: fromWallet, isSigner: true, isWritable: true }],
                        data: Buffer.from(JSON.stringify(GRAPE_TT_MEMO), 'utf-8'),
                        programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                    })
                );
                
                try{
                    enqueueSnackbar(`Preparing to send ${amountToSend} ${tokenMintName} to ${toaddress}`,{ variant: 'info' });
                    const signature = await sendTransaction(transaction, freeconnection);
                    const snackprogress = (key:any) => (
                        <CircularProgress sx={{padding:'10px'}} />
                    );
                    const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                    await connection.confirmTransaction(signature, 'processed');
                    closeSnackbar(cnfrmkey);
                    const action = (key:any) => (
                        <Button href={`https://explorer.solana.com/tx/${signature}`} target='_blank' sx={{color:'white'}} >
                            Signature: {signature}
                        </Button>
                    );

                    flagWalletConnect(mint);

                    enqueueSnackbar(`Sent ${amountToSend} ${tokenMintName} to ${toaddress}`,{ variant: 'success', action });
                }catch(e:any){
                    closeSnackbar();
                    enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
                } 
            } else{ // token already in wallet
                const transaction = new Transaction()
                .add(
                    createTransferInstruction(
                        fromAta,
                        toAta,
                        publicKey,
                        adjustedAmountToSend,
                        [],
                        TOKEN_PROGRAM_ID,
                    )
                )
                .add(
                    new TransactionInstruction({
                        keys: [{ pubkey: fromWallet, isSigner: true, isWritable: true }],
                        data: Buffer.from(JSON.stringify(GRAPE_TT_MEMO), 'utf-8'),
                        programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                    })
                );
                
                try{
                    enqueueSnackbar(`Preparing to send ${amountToSend} ${tokenMintName} to ${toaddress}`,{ variant: 'info' });
                    const signature = await sendTransaction(transaction, freeconnection);
                    const snackprogress = (key:any) => (
                        <CircularProgress sx={{padding:'10px'}} />
                    );
                    const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
                    await connection.confirmTransaction(signature, 'processed');
                    closeSnackbar(cnfrmkey);
                    const action = (key:any) => (
                        <Button href={`https://explorer.solana.com/tx/${signature}`} target='_blank' sx={{color:'white'}} >
                            Signature: {signature}
                        </Button>
                    );

                    flagWalletConnect(mint);

                    enqueueSnackbar(`Sent ${amountToSend} ${tokenMintName} to ${toaddress}`,{ variant: 'success', action });
                }catch(e:any){
                    closeSnackbar();
                    enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
                } 
            }
        }
    }

    const flagWalletConnect = async (followAddress:string) => {
        // address:string, alias:string
        let tofollow = followAddress;   
        // Show a prompt here in order to flag

            let promise = await cyberConnect.connect(tofollow,'', ConnectionType.REPORT)
            .catch(function (error) {
                console.log(error);
            });
            initFollowListInfo();
            getFlagStatus();
    };
    const flagWalletDisconnect = async (followAddress:string) => {
        // address:string, alias:string
        let promise = await cyberConnect.disconnect(followAddress.toString())
        .catch(function (error) {
            console.log(error);
        });
        initFollowListInfo();
        getFlagStatus();
    };

    React.useEffect(() => {
        initFollowListInfo();
        getFlagStatus();
    },[]);
    
    return ( 
        <>
        {loadingFlaggedState ?
            <Button 
                sx={{borderRadius:'24px'}}
            >
                <CircularProgress sx={{p:'14px',m:-2}} />
            </Button>
        :
            <>

                <BootstrapDialog 
                    fullWidth={true}
                    maxWidth={"sm"}
                    PaperProps={{
                        style: {
                            background: '#13151C',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px'
                        }
                    }}
                    open={warningreportopen}
                    onClose={handleWarningReportClose}
                    aria-labelledby="alert-bn-dialog-title"
                    aria-describedby="alert-bn-dialog-description"
                    >
                    <DialogTitle id="alert-bn-dialog-title">
                        <Typography>
                            WARNING
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-bn-dialog-description">
                        <br />
                        <Alert 
                            severity="error" variant="outlined"
                            sx={{backgroundColor:'black'}}
                            >
                            Mint: <MakeLinkableAddress addr={mint} trim={0} hasextlink={true} hascopy={false} fontsize={16} /> <br/>
                            <Typography sx={{textAlign:'center'}}>
                                This mint/collection has been flagged by the community {followListInfo?.reported && +followListInfo?.reported} time(s) as being either offensive, a scam, or a potential IP infringement. Please do your own research before transacting. 
                            </Typography>
                        </Alert>
                        
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button component="a" href={`${GRAPE_PROFILE}`}>Back</Button>
                        <Button 
                            onClick={handleWarningReportClose}
                            autoFocus>
                        I understand
                        </Button>
                    </DialogActions>
                </BootstrapDialog>

            {isFlagged ?  
                    <Tooltip title="Unflag">
                        <Button 
                            variant="text" 
                            onClick={() => flagWalletDisconnect(mint)}
                            size="small"
                            className="profileAvatarIcon"
                            sx={{borderRadius:'24px', color:'yellow'}}
                            >
                            <FlagIcon sx={{fontSize:'24px'}} />
                            {followListInfo?.reported && +followListInfo?.reported > 0 ?
                                <Typography variant="caption" sx={{ml:1}}>
                                    {followListInfo?.reported}
                                </Typography>
                            :<></>}
                        </Button>
                    </Tooltip>
                :
                    <>
                        <BootstrapDialog 
                            fullWidth={true}
                            maxWidth={"sm"}
                            PaperProps={{
                                style: {
                                    background: '#13151C',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '20px'
                                }
                            }}
                            open={reportalertopen}
                            onClose={handleAlertReportClose}
                            aria-labelledby="alert-bn-dialog-title"
                            aria-describedby="alert-bn-dialog-description"
                            >
                            <DialogTitle id="alert-bn-dialog-title">
                                <Typography>
                                    REPORT THIS MINT
                                </Typography>
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText id="alert-bn-dialog-description">
                                <br />
                                <Alert 
                                    severity="warning" variant="outlined"
                                    sx={{backgroundColor:'black'}}
                                    >
                                    Mint: <MakeLinkableAddress addr={mint} trim={0} hasextlink={true} hascopy={false} fontsize={16} /> <br/>
                                    <Typography sx={{textAlign:'center'}}>
                                        You are about to report this mint because it is offensive, a scam, or a potential IP infringement, in order to minimize unnecessary reporting there is a <GrapeIcon sx={{fontSize:'12px'}} />{TOKEN_REPORT_AMOUNT} fee to report
                                    </Typography>
                                </Alert>
                                
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleAlertReportClose}>Cancel</Button>
                                <Button 
                                    onClick={() => handleFlagMintTransaction(mint)}
                                    autoFocus>
                                Accept &amp; Report
                                </Button>
                            </DialogActions>
                        </BootstrapDialog>

                        <Tooltip title="Flag">
            
                            <Button 
                                variant="text" 
                                onClick={() => setReportAlertOpen(true)}
                                size="small"
                                className="profileAvatarIcon"
                                sx={{borderRadius:'24px', color:'white'}}
                                >
                                <EmojiFlagsIcon sx={{fontSize:'24px'}} />
                                {followListInfo?.reported && +followListInfo?.reported > 0 ?
                                    <Typography variant="caption" sx={{ml:1}}>
                                        {followListInfo?.reported}
                                    </Typography>
                                :<></>}
                            </Button>
                        </Tooltip>
                    </>
            }
            </>
        }
        </>
    );
}