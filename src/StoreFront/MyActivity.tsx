import * as React from 'react';
import { styled } from '@mui/material/styles';

import { Link, useLocation, NavLink } from 'react-router-dom';

import {
    Box,
    Button,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Typography
} from '@mui/material';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletConnectButton } from "@solana/wallet-adapter-material-ui";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { BN, web3 } from '@project-serum/anchor';

import {
    AUCTION_HOUSE_PROGRAM_ID,
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    WRAPPED_SOL_MINT,
  } from '../utils/auctionHouse/helpers/constants';
import {
    loadAuctionHouseProgram,
    getAuctionHouseBuyerEscrow,
    getTokenAmount,
    getAuctionHouseTradeState,
    getAtaForMint,
  } from '../utils/auctionHouse/helpers/accounts';

import {
    METAPLEX_PROGRAM_ID,
} from '../utils/auctionHouse/helpers/constants';

import { decodeMetadata } from '../utils/grapeTools/utils';
import { GRAPE_RPC_ENDPOINT, GRAPE_PREVIEW } from '../utils/grapeTools/constants';

import { useTranslation } from 'react-i18next';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
}));

export default function MyActivityView(props: any){
    const logo = props.logo;
    const collectionAuthority = props.collectionAuthority;

    const MD_PUBKEY = METAPLEX_PROGRAM_ID;
    const [open, setOpenDialog] = React.useState(false);
    const { t, i18n } = useTranslation();
    const { publicKey } = useWallet();
    const [walletCollection, setWalletCollection] = React.useState(null);
    const [collectionMetaFinal,setCollectionMetaFinal] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [loadingActivity, setLoadingActivity] = React.useState(false);
    const [recentActivity, setRecentActivity] = React.useState(null);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const rpclimit = 100;

    const handleClickOpenDialog = () => {
        setOpenDialog(true);
    };
    
    const handleCloseDialog = () => {
        setOpenDialog(false);
    };
    
    const fetchAllActivity = async () => {
        
        try {
            if (!recentActivity){
                console.log("collectionAuthority: "+JSON.stringify(collectionAuthority))
                const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
                const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
                const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
                //let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mint)).toBuffer())], auctionHouseKey);
                let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((publicKey).toBuffer())], auctionHouseKey);
                //let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
                //let derivedUpdateAuthorityPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(collectionAuthority)).toBuffer())], auctionHouseKey);
                
                /*
                console.log("derivedMintPDA: "+derivedMintPDA);
                console.log("derivedBuyerPDA: "+derivedBuyerPDA);
                console.log("derivedOwnerPDA: "+derivedOwnerPDA);
                */
                console.log("derivedBuyerPDA: "+derivedBuyerPDA);
                
                let result = await ggoconnection.getSignaturesForAddress(derivedBuyerPDA[0], {limit: 500});
                
                let activityResults: any[] = [];
                let cancelStateResults: any[] = [];
                let allListingResults: any[] = [];
                let listingResults: any[] = [];
                let mintArrayPDA: any[] = [];
                let escrow_cache: any[] = [];
                let exists = false;
                let existSaleCancelAction = 0;
                let cntr = 0;
                let cnt = 0;
    
    
                let sellerTradeStateArr: any[] = [];
                let signatures: any[] = [];
                for (var value of result){
                    signatures.push(value.signature);
                }
    
                const getTransactionAccountInputs2 = await ggoconnection.getParsedTransactions(signatures, 'confirmed');
                for (var value of result){
                    if (value.err === null){
                        
                        try{
                            //console.log('value: '+JSON.stringify(value));
                            const getTransactionAccountInputs = getTransactionAccountInputs2[cnt];
                            
                            if (getTransactionAccountInputs?.transaction && getTransactionAccountInputs?.transaction?.message){
                            
                                let feePayer = new PublicKey(getTransactionAccountInputs?.transaction.message.accountKeys[0].pubkey); // .feePayer.toBase58();                            
                                let progAddress = getTransactionAccountInputs.meta.logMessages[0];
    
                                // get last signature
                                /*
                                if (cntr === limit-1){
                                    //console.log(value.signature);
                                    setBeforeSignature(value.signature);
                                    setMaxPage(true);
                                }
                                */
                                     
                                let escrow_found = false;
                                let escrow_found_index = 0;
                                for (var i = 0; i < escrow_cache.length; i++){
                                    if (escrow_cache[i].feePayer.toBase58() === feePayer.toBase58()){
                                        escrow_found = true;
                                        escrow_found_index = i;
                                    }
                                }

                                let amount_on_escrow = 0;

                                if (!escrow_found){
                                    let escrow = ( await getAuctionHouseBuyerEscrow(auctionHouseKey, feePayer,))[0];
                                    amount_on_escrow = await getTokenAmount(anchorProgram, escrow, auctionHouseObj.treasuryMint,);
                                    escrow_cache.push(
                                        {
                                            //escrow: escrow,
                                            amount_on_escrow: amount_on_escrow,
                                            feePayer: feePayer
                                        }
                                    );
                                    
                                } else{
                                    amount_on_escrow = escrow_cache[escrow_found_index].amount_on_escrow;
                                }
                                
                                let auctionMint = getTransactionAccountInputs.meta.preTokenBalances[0]?.mint;
                                //console.log('auctionMint: '+auctionMint);
                                
                                //if (auctionMint){
                                //    console.log("value3: "+JSON.stringify(value));
                                
                                // check if memo is an array
                                
                                // consider countering all brackets

                                    
                                exists = false;
                                //console.log('VAL '+JSON.stringify(value));
                                if ((value) && (value.memo)){
                                    
                                    let memo_arr: any[] = [];
                                    let memo_str = value.memo;
                                    let memo_instances = ((value.memo.match(/{/g)||[]).length);
                                    if (memo_instances > 0) {
                                        // multi memo
                                        let mcnt = 0;
                                        let submemo = memo_str;
                                        //console.log("STR full (instance "+memo_instances+"): "+submemo);
                                        for (var mx=0;mx<memo_instances;mx++){
                                            let init = submemo.indexOf('{');
                                            let fin = submemo.indexOf('}');
                                            memo_str = submemo.substring(init,fin+1); // include brackets
                                            memo_arr.push(memo_str);
                                            submemo = submemo.replace(memo_str, "");
                                            //console.log("pushed ("+mx+"):: "+memo_str + " init: "+init+" fin: "+fin);
                                            //console.log("submemo: "+submemo);
                                        }
                                    } else{
                                        let init = memo_str.indexOf('{');
                                        let fin = memo_str.indexOf('}');
                                        memo_str = memo_str.substring(init,fin); // include brackets
                                        memo_arr.push(memo_str);
                                    }
                                    
                                    for (var memo_item of memo_arr){
                                        try{
                                            const memo_json = JSON.parse(memo_item);
                                            
                                            //console.log('OFFER:: '+feePayer.toBase58() + '('+memo_json?.amount+' v '+amount_on_escrow+'): ' +memo_item);
                                            //console.log(memo_json);
                                            if ((memo_json?.status === 0) || // withdraw
                                                (memo_json?.status === 1) || // offer
                                                (memo_json?.status === 2) || // sale
                                                (memo_json?.status === 3) || // listing/accept
                                                (memo_json?.status === 4) || // buy now
                                                (memo_json?.status === 5) || // cancel
                                                (memo_json?.state === 0) || // withdraw
                                                (memo_json?.state === 1) || // offer
                                                (memo_json?.state === 2) || // sale
                                                (memo_json?.state === 3) || // listing/accept
                                                (memo_json?.state === 4) || // buy now
                                                (memo_json?.state === 5)){ // cancel
                                                    activityResults.push({buyeraddress: feePayer.toBase58(), offeramount: memo_json?.amount || memo_json?.offer, mint: memo_json?.mint, isowner: false, timestamp: value.blockTime, state: memo_json?.state || memo_json?.status});
                                            }
                                        } catch(er){
                                            console.log("ERR: "+er)
                                        }
                                    }

                                    return activityResults;
                                    
                                }
                            }
                        } catch(err){
                            console.log("ERR: "+err)
                        }
                    }
                }
            }
            return null;
        } catch (e) { // Handle errors from invalid calls
            console.log(e);
            return null;
        }
    }

    const getAllActivity = async () => {
        setLoading(true);
        
        const [activityResults] = await Promise.all([fetchAllActivity()]);
        setRecentActivity(activityResults);
        
        setLoading(false);
    }

    React.useEffect(() => {
        getAllActivity();
    }, []);

    return (
        <>
            <Button 
                onClick={handleClickOpenDialog}
                sx={{
                    color:'white',
                    verticalAlign: 'middle',
                    display: 'inline-flex',
                    borderRadius:'17px'
                }}
            >
                {publicKey ?
                    <>
                    {t('My Activity')}
                    </>
                :
                    <>Connect your wallet</>
                }   
            </Button>
            <BootstrapDialog 
                fullWidth={true}
                maxWidth={"sm"}
                open={open} onClose={handleCloseDialog}
                PaperProps={{
                    style: {
                        background: '#13151C',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px'
                    }
                }}
            >
                <DialogTitle>
                    {t('My Activity')}
                </DialogTitle>
                <DialogContent>
                    <List>
                    {!publicKey || loading ?
                        <>
                            {publicKey ?
                            <>
                                loading
                            </>
                            :
                            <>
                                <WalletConnectButton />
                            </>
                            }
                        </>
                    : 
                        <>
                            {!recentActivity &&
                                <>no activity</>
                            }

                            {recentActivity && recentActivity.map((item: any) => (
                                <>
                                    {JSON.stringify(item)}
                                </>
                            ))}
                        </>
                    }
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button variant="text" onClick={handleCloseDialog}>{t('Close')}</Button>
                </DialogActions>
            </BootstrapDialog> 
        </>
  );
}