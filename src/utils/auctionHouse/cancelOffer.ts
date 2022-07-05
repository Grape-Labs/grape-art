import {
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    TOKEN_PROGRAM_ID,
    WRAPPED_SOL_MINT,
  } from './helpers/constants';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { BN, web3 } from '@project-serum/anchor';
import { GRAPE_RPC_ENDPOINT, OTHER_MARKETPLACES } from '../../utils/grapeTools/constants';
import {InstructionsAndSignersSet} from "./helpers/types";

import {
    loadAuctionHouseProgram,
    getAuctionHouseTradeState,
    getAtaForMint,
    getAuctionHouseBuyerEscrow,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token-v2';

export async function cancelOffer(offerAmount: number, mint: string, buyerWalletKey: PublicKey, mintOwner: any, updateAuthority: string, collectionAuctionHouse:string): Promise<InstructionsAndSignersSet> {

    let tokenSize = 1;
    const auctionHouseKey = new web3.PublicKey(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS);
    console.log("with AUCTION_HOUSE_ADDRESS/collectionAuctionHouse: "+AUCTION_HOUSE_ADDRESS+" / "+collectionAuctionHouse + " : "+auctionHouseKey.toBase58());
    const mintKey = new web3.PublicKey(mint);
    let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
    const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
    const sellerWalletKey = new web3.PublicKey(mintOwner);

    //console.log('offerAmount:', offerAmount);
    const buyPriceAdjusted = new BN(
      await getPriceWithMantissa(
        offerAmount,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        buyerWalletKey,
        anchorProgram,
      ),
    );
    
    const tokenSizeAdjusted = new BN(
      await getPriceWithMantissa(
        tokenSize,
        mintKey,
        buyerWalletKey,
        anchorProgram,
      ),
    );

    

    //const tokenAccountKey = (await getAtaForMint(mintKey, buyerWalletKey))[0];
    const tokenAccountKey = (await getAtaForMint(mintKey, sellerWalletKey))[0];
    const tradeState = (
          await getAuctionHouseTradeState(
              auctionHouseKey,
              buyerWalletKey,
              tokenAccountKey,
              //@ts-ignore
              auctionHouseObj.treasuryMint,
              mintKey,
              tokenSizeAdjusted,
              buyPriceAdjusted,
          )
    )[0];  
    //console.log('tradeState:', tradeState.toBase58());
    const signers: any[] = [];
    
    //console.log('buyPriceAdjusted:', buyPriceAdjusted.toNumber());
    //console.log("tokenSizeAdjusted: "+JSON.stringify(tokenSizeAdjusted));
    
    const instruction = anchorProgram.instruction.cancel(
      buyPriceAdjusted,
      tokenSizeAdjusted,
      {
        accounts: {
          wallet: buyerWalletKey,
          tokenAccount: tokenAccountKey,
          tokenMint: mintKey,
          //@ts-ignore
          authority: auctionHouseObj.authority,
          auctionHouse: auctionHouseKey,
          //@ts-ignore
          auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
          tradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers,
      },
    );

    const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

    const ata = (
      await getAtaForMint(
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        buyerWalletKey,
      )
    )[0];

    const [escrowPaymentAccount, bump] = await getAuctionHouseBuyerEscrow(
      auctionHouseKey,
      buyerWalletKey,
    );

    const instruction2 = anchorProgram.instruction.withdraw(
      bump,
      new BN(buyPriceAdjusted),
      {
        accounts: {
          wallet: buyerWalletKey,
          receiptAccount: isNative ? buyerWalletKey : ata,
          escrowPaymentAccount,
          //@ts-ignore
          treasuryMint: auctionHouseObj.treasuryMint,
          //@ts-ignore
          authority: auctionHouseObj.authority,
          auctionHouse: auctionHouseKey,
          //@ts-ignore
          auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        },
        signers,
      },
    );


    //console.log('instruction:', instruction);
    //console.log("instruction: "+JSON.stringify(instruction));
    const instructions = [instruction];
    instructions.push(instruction2);
    
    let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((mintKey).toBuffer())], auctionHouseKey);
    let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((buyerWalletKey).toBuffer())], auctionHouseKey);
    let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
    let derivedUpdateAuthorityPDA = null;
    if (updateAuthority && updateAuthority.length > 0)
      derivedUpdateAuthorityPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(updateAuthority)).toBuffer())], auctionHouseKey);
  
    const GRAPE_AH_MEMO = {
      state:5, // status (0: withdraw, 1: offer, 2: listing, 3: buy/execute (from listing), 4: buy/execute(accept offer), 5: cancel)
      ah:auctionHouseKey.toString(), // pk
      mint:mint.toString(), // mint
      ua:updateAuthority, // updateAuthority
      amount:buyPriceAdjusted.toNumber() // price
    };

    instructions.push(
      SystemProgram.transfer({
        fromPubkey: buyerWalletKey,
        toPubkey: derivedMintPDA[0],
        lamports: 0,
      })
    );
    instructions.push(
      SystemProgram.transfer({
          fromPubkey: buyerWalletKey,
          toPubkey: derivedBuyerPDA[0],
          lamports: 0,
      })
    );
    instructions.push(
      SystemProgram.transfer({
          fromPubkey: buyerWalletKey,
          toPubkey: derivedOwnerPDA[0],
          lamports: 0,
      })
    );
    if (derivedUpdateAuthorityPDA){
      instructions.push(
        SystemProgram.transfer({
            fromPubkey: buyerWalletKey,
            toPubkey: derivedUpdateAuthorityPDA[0],
            lamports: 0,
        })
      );
    }
    instructions.push(
      new TransactionInstruction({
          keys: [{ pubkey: buyerWalletKey, isSigner: true, isWritable: true }],
          data: Buffer.from(JSON.stringify(GRAPE_AH_MEMO), 'utf-8'),
          programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      })
    );

    //console.log("instructions: "+JSON.stringify(instructions));

    return {
      signers: signers,
      instructions: instructions
    }

}