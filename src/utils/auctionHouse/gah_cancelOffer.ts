import {
  ENV_AH,
  AUCTION_HOUSE_ADDRESS,
  WRAPPED_SOL_MINT,
  TOKEN_PROGRAM_ID,
} from './helpers/constants';
import { 
  Transaction,
  PublicKey, 
  LAMPORTS_PER_SOL,
  SystemProgram, 
  TransactionInstruction,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js'
import { BN, web3 } from '@project-serum/anchor';
import { GRAPE_RPC_ENDPOINT, OTHER_MARKETPLACES } from '../../utils/grapeTools/constants';
import {InstructionsAndSignersSet} from "./helpers/types";

import {
  loadAuctionHouseProgram,
  getAuctionHouseTradeState,
  getTokenAmount,
  getAtaForMint,
  getAuctionHouseBuyerEscrow,
} from './helpers/accounts';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house'
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getPriceWithMantissa } from './helpers/various';

function convertSolVal(sol: any){
let sol_precision = 6;
return +sol/1000000000;
}

const {
  createCancelInstruction,
  createCancelBidReceiptInstruction,
  createWithdrawInstruction,
} = AuctionHouseProgram.instructions

export async function gah_cancelOffer(offerAmount: number, mint: string, buyerWalletKey: PublicKey, mintOwner: any, updateAuthority: string): Promise<InstructionsAndSignersSet> {
  //START CANCEL
  let tokenSize = 1;
  const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
  const mintKey = new web3.PublicKey(mint);
  let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
  const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
  const sellerWalletKey = new web3.PublicKey(mintOwner);

  //check if escrow amount already exists to determine if we need to deposit amount to grapevine 
  const escrow = (await getAuctionHouseBuyerEscrow(auctionHouseKey, buyerWalletKey))[0];
  const escrow_amount = await getTokenAmount(anchorProgram,escrow,auctionHouseObj.treasuryMint,);
  const escrowSolAmount = convertSolVal(escrow_amount);

  const auctionHouse = new PublicKey(auctionHouseKey);//new PublicKey(auctionHouseObj.auctionHouse.address)
  const authority = new PublicKey(auctionHouseObj.authority)
  const auctionHouseFeeAccount = new PublicKey(
    auctionHouseObj.auctionHouseFeeAccount
  )
  const tokenMint = mintKey
  const buyerPrice = Number(offerAmount) * LAMPORTS_PER_SOL;

    /*
    const buyPriceAdjusted = new BN(
      await getPriceWithMantissa(
        offerAmount,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        buyerWalletKey,
        anchorProgram,
      ),
    );
    
    //console.log('buyPriceAdjusted:', buyPriceAdjusted);
    const tokenSizeAdjusted = new BN(
      await getPriceWithMantissa(
        tokenSize,
        mintKey,
        buyerWalletKey,
        anchorProgram,
      ),
    );
    */

    //alert(escrowSolAmount + " v "+buyerPrice + " v "+buyPriceAdjusted + " v "+tokenSizeAdjusted)

    //const tokenAccountKey = (await getAtaForMint(mintKey, buyerWalletKey))[0];
    
    const tokenAccountKey = (await getAtaForMint(mintKey, sellerWalletKey))[0];
    
    const tradeState2 = (
          await getAuctionHouseTradeState(
              auctionHouseKey,
              buyerWalletKey,
              tokenAccountKey,
              //@ts-ignore
              auctionHouseObj.treasuryMint,
              mintKey,
              new BN(1),//tokenSizeAdjusted,
              new BN(buyerPrice),
          )
    )[0];  
            
    const [tradeState, tradeStateBump] =
      await AuctionHouseProgram.findPublicBidTradeStateAddress(
        new PublicKey(buyerWalletKey),
        auctionHouse,
        auctionHouseObj.treasuryMint,
        tokenMint,
        buyerPrice,
        1
      )

    //const receipt = buyerWalletKey //new PublicKey(offer.address)
  
    const [receipt, receiptBump] =
          await AuctionHouseProgram.findBidReceiptAddress(tradeState)
      

    //const tradeState = new PublicKey(offer.tradeState)
    const owner = new PublicKey(mintOwner)
    const treasuryMint = new PublicKey(auctionHouseObj.treasuryMint)
    const results = await anchorProgram.provider.connection.getTokenLargestAccounts(mintKey);    
    const tokenAccount: web3.PublicKey = results.value[0].address;

    const [escrowPaymentAccount, escrowPaymentBump] =
      await AuctionHouseProgram.findEscrowPaymentAccountAddress(
        auctionHouse,
        buyerWalletKey
      )

    const txt = new Transaction()

    const cancelInstructionAccounts = {
      wallet: buyerWalletKey,
      tokenAccount,
      tokenMint,
      authority,
      auctionHouse,
      auctionHouseFeeAccount,
      tradeState,
    }

    const cancelInstructionArgs = {
      buyerPrice,
      tokenSize: 1,
    }

    const cancelBidReceiptInstructionAccounts = {
      receipt: receipt,
      instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
    }

    const cancelBidInstruction = createCancelInstruction(
      cancelInstructionAccounts,
      cancelInstructionArgs
    )

    const cancelBidReceiptInstruction = createCancelBidReceiptInstruction(
      cancelBidReceiptInstructionAccounts
    )

    const withdrawInstructionAccounts = {
      receiptAccount: buyerWalletKey,
      wallet: buyerWalletKey,
      escrowPaymentAccount,
      auctionHouse,
      authority,
      treasuryMint,
      auctionHouseFeeAccount,
    }

    const withdrawInstructionArgs = {
      escrowPaymentBump,
      amount: buyerPrice,
    }

    const withdrawInstruction = createWithdrawInstruction(
      withdrawInstructionAccounts,
      withdrawInstructionArgs
    )

    txt
      .add(cancelBidInstruction)
      .add(cancelBidReceiptInstruction)
      .add(withdrawInstruction)

    //txt.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
    txt.feePayer = new PublicKey(buyerWalletKey)

  const transferAuthority = web3.Keypair.generate();
  const signers = true ? [] : [transferAuthority];
  const instructions = txt.instructions;

  const GRAPE_AH_MEMO = {
    state:5, // status (0: withdraw, 1: offer, 2: listing, 3: buy/execute (from listing), 4: buy/execute(accept offer), 5: cancel)
    ah:auctionHouseKey.toString(), // pk
    mint:mint.toString(), // mint
    ua:updateAuthority, // updateAuthority
    amount:buyerPrice // price
  };

  let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((mintKey).toBuffer())], auctionHouseKey);
  let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((buyerWalletKey).toBuffer())], auctionHouseKey);
  let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);

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