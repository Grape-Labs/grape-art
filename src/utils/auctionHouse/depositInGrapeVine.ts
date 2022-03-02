import {
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    WRAPPED_SOL_MINT,
    TOKEN_PROGRAM_ID,
  } from './helpers/constants';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { BN, web3 } from '@project-serum/anchor';
import { GRAPE_RPC_ENDPOINT, OTHER_MARKETPLACES } from '../grapeTools/constants';
import {InstructionsAndSignersSet} from "./helpers/types";

import {
    loadAuctionHouseProgram,
    getAuctionHouseTradeState,
    getTokenAmount,
    getAtaForMint,
    getAuctionHouseBuyerEscrow,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function depositInGrapeVine(escrowAmount: number, buyerWalletKey: PublicKey): Promise<InstructionsAndSignersSet> {
  
    const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);  

    let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
    const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);    

    const amountAdjusted = await getPriceWithMantissa(
        escrowAmount,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        buyerWalletKey,
        anchorProgram,
    );

    const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
      auctionHouseKey,
      buyerWalletKey,
    );

    const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

    const ata = (
      await getAtaForMint(
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        buyerWalletKey,
      )
    )[0];

    const transferAuthority = web3.Keypair.generate();
    const signers = isNative ? [] : [transferAuthority];

    const instruction = anchorProgram.instruction.deposit(
      escrowBump,
      new BN(amountAdjusted),
      {
        accounts: {
          wallet: buyerWalletKey,
          paymentAccount: isNative ? buyerWalletKey : ata,
          transferAuthority: isNative
            ? web3.SystemProgram.programId
            : transferAuthority.publicKey,
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
        },
      },
    );

    const instructions = [instruction];
  
    const GRAPE_AH_MEMO = {
      state:6, // status (0: withdraw, 1: offer, 2: listing, 3: buy/execute (from listing), 4: buy/execute(accept offer), 5: cancel, 6: deposit)
      ah:auctionHouseKey.toString(), // pk
      mint:null, // mint
      amount:amountAdjusted // price
    };
      
    let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((buyerWalletKey).toBuffer())], auctionHouseKey);

    instructions.push(
        SystemProgram.transfer({
            fromPubkey: buyerWalletKey,
            toPubkey: derivedBuyerPDA[0],
            lamports: 0,
        })
      );

    instructions.push(
      new TransactionInstruction({
          keys: [{ pubkey: buyerWalletKey, isSigner: true, isWritable: true }],
          data: Buffer.from(JSON.stringify(GRAPE_AH_MEMO), 'utf-8'),
          programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      })
    );

    return {
      signers: signers,
      instructions: instructions
    }

}