
import React, { useEffect, useState, useCallback, memo } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletError } from '@solana/wallet-adapter-base';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

import {
  Button,
  Tooltip,
  Typography,
} from '@mui/material';

import CircularProgress from '@mui/material/CircularProgress';
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import { useSnackbar } from 'notistack';

import { 
  GRAPE_RPC_ENDPOINT, 
} from '../utils/grapeTools/constants';

export default function TokenSwapView(props: any) {
  const fromTokenAddress = props?.fromTokenAddress;
  const toTokenAddress = props?.toTokenAddress;
  const fromTokenLabel = props?.fromTokenLabel;
  const toTokenLabel = props?.toTokenLabel;
  const swapAmount = props?.swapAmount;
  const { connection } = useConnection();
  const {connected, wallet, publicKey, sendTransaction} = useWallet();
  const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const onError = useCallback(
      (error: WalletError) => {
          enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, { variant: 'error' });
          console.error(error);
      },
      [enqueueSnackbar]
  );
  
  const swapAmountAdjusted = (swapAmount * Math.pow(10,5)) + 1;

    const handleSwap =  async () => {
        const { data } = await (
            await fetch(
            'https://quote-api.jup.ag/v4/quote?inputMint='+fromTokenAddress+'&outputMint='+toTokenAddress+'&amount='+(+(swapAmountAdjusted).toFixed(0))+'&slippageBps=50'
            )
        ).json()
        const routes = data
        console.log(routes)

        const transactions = await (
            await fetch('https://quote-api.jup.ag/v4/swap', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                // route from /quote api
                route: routes[0],
                // user public key to be used for the swap
                userPublicKey: publicKey.toBase58(),
                // auto wrap and unwrap SOL. default is true
              })
            })
          ).json()
          
          const { swapTransaction } = transactions
        
        // deserialize the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
        let transaction = VersionedTransaction.deserialize(swapTransactionBuf)
        //console.log(transaction)

        const simulate = await connection.simulateTransaction(transaction);

        if (!simulate.value.err){

          enqueueSnackbar(`Preparing to swap ${fromTokenLabel} to ${toTokenLabel}`,{ variant: 'info' });


          const signedTransaction = await sendTransaction(transaction, connection, {
              skipPreflight: true,
              preflightCommitment: "confirmed"
          });   
          
          const snackprogress = (key:any) => (
              <CircularProgress sx={{padding:'10px'}} />
          );
          const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
          const latestBlockHash = await connection.getLatestBlockhash();
          
          await ggoconnection.confirmTransaction({
              blockhash: latestBlockHash.blockhash,
              lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
              signature: signedTransaction}, 
              'processed'
          );
          
          closeSnackbar(cnfrmkey);
          const snackaction = (key:any) => (
              <Button href={`https://explorer.solana.com/tx/${signedTransaction}`} target='_blank'  sx={{color:'white'}}>
                  {signedTransaction}
              </Button>
          );
          enqueueSnackbar(`Transaction completed`,{ variant: 'success', action:snackaction });  
          /*
          // sign the transaction
          //transaction.sign([publicKey]) // wallet.payer
          // Execute the transaction
          const rawTransaction = transaction.serialize()
          const txid = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          maxRetries: 2
          })
          
          await connection.confirmTransaction(txid)
          console.log(`https://solscan.io/tx/${txid}`)
          */
        } else{
          enqueueSnackbar(`Transaction Simulation Failed! Check if you have enough $${fromTokenLabel} to make this swap`,{ variant: 'error' });
      }
    }


    return (
      <>
        <Button
          variant="outlined"
          color='inherit'
          onClick={handleSwap}
          size="small"
          sx={{borderRadius:'17px'}}
        >
          {fromTokenLabel} <SwapHorizIcon sx={{mr:1,ml:1}} /> {toTokenLabel}
        </Button>
      </>
    );
}