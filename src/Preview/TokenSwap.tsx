
import React, { useEffect, useState, useCallback, memo } from "react";


export default function TokenSwapView(this: any, props: any) {
    
  

    /*
    const { data } = await (
        await fetch(
        'https://quote-api.jup.ag/v4/quote?inputMint=So11111111111111111111111111111111111111112\
            &outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\
            &amount=100000000\
            &slippageBps=50'
        )
    ).json()
    const routes = data
    // console.log(routes)


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
            userPublicKey: wallet.publicKey.toString(),
            // auto wrap and unwrap SOL. default is true
          })
        })
      ).json()
      
      const { swapTransaction } = transactions

    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf)
    console.log(transaction)

    // sign the transaction
    transaction.sign([wallet.payer])

    // Execute the transaction
    const rawTransaction = transaction.serialize()
    const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 2
    })
    await connection.confirmTransaction(txid)
    console.log(`https://solscan.io/tx/${txid}`)
    */


    return <></>;
}