import {
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    WRAPPED_SOL_MINT,
    TOKEN_PROGRAM_ID,
  } from './helpers/constants';
import { 
  Transaction, 
  PublicKey, 
  SystemProgram, 
  TransactionInstruction, 
  LAMPORTS_PER_SOL,
  SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js'
import { BN, web3 } from '@project-serum/anchor';
import { GRAPE_RPC_ENDPOINT, OTHER_MARKETPLACES } from '../grapeTools/constants';
import {InstructionsAndSignersSet} from "./helpers/types";

import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house'
import { Metadata } from '@metaplex-foundation/mpl-token-metadata'
//import { MetadataProgram, Metadata } from '@metaplex-foundation/mpl-token-metadata'
//import { deprecated } from "@metaplex-foundation/mpl-token-metadata";

import {
    loadAuctionHouseProgram,
    getAuctionHouseTradeState,
    getAtaForMint,
    getTokenAmount, 
    getMetadata,
    getAuctionHouseBuyerEscrow,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';

import { Connection } from '@solana/web3.js';
import { TokenAmount } from '../grapeTools/safe-math';

const {
  createPublicBuyInstruction,
  createPrintBidReceiptInstruction,
  createDepositInstruction,
} = AuctionHouseProgram.instructions
interface OfferForm {
  amount: string
}

function convertSolVal(sol: any){
    sol = parseFloat(new TokenAmount(sol, 9).format());
    return sol;
}

export async function gah_makeOffer(offerAmount: number, mint: string, walletPublicKey: string, mintOwner: any): Promise<InstructionsAndSignersSet> {
    //const { publicKey, signTransaction } = useWallet();
    let tokenSize = 1;
    const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
    const mintKey = new web3.PublicKey(mint);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
    const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);    
    const buyerWalletKey = new web3.PublicKey(walletPublicKey);
    //check if escrow amount already exists to determine if we need to deposit amount to grapevine 
    const escrow = (await getAuctionHouseBuyerEscrow(auctionHouseKey, buyerWalletKey))[0];
    const escrow_amount = await getTokenAmount(anchorProgram,escrow,auctionHouseObj.treasuryMint,);
    
    const escrowSolAmount = convertSolVal(escrow_amount);
    //console.log('escrow_amount:',escrowSolAmount, 'offerAmount:', offerAmount);
    
    const buyerPrice = Number(offerAmount) * LAMPORTS_PER_SOL
    //console.log("buyerPrice: "+buyerPrice);
    //console.log("auctionHouseObj: "+JSON.stringify(auctionHouseObj));
    const auctionHouse = new PublicKey(auctionHouseKey);//new PublicKey(auctionHouseObj.auctionHouse.address)
    //console.log("auctionHouse: "+auctionHouseObj.auctionHouse.address);
    const authority = new PublicKey(auctionHouseObj.authority)
    const auctionHouseFeeAccount = new PublicKey(
      auctionHouseObj.auctionHouseFeeAccount
    )
    const treasuryMint = new PublicKey(auctionHouseObj.treasuryMint)
    const tokenMint = mintKey
    //console.log("mintOwner: "+JSON.stringify(mintOwner));
    //const tokenAccount = new PublicKey(mintOwner)
    const results = await anchorProgram.provider.connection.getTokenLargestAccounts(mintKey);    
    const tokenAccount: web3.PublicKey = results.value[0].address;

    const [escrowPaymentAccount, escrowPaymentBump] =
      await AuctionHouseProgram.findEscrowPaymentAccountAddress(
        auctionHouse,
        new PublicKey(walletPublicKey)
      )

    const [buyerTradeState, tradeStateBump] =
      await AuctionHouseProgram.findPublicBidTradeStateAddress(
        new PublicKey(walletPublicKey),
        auctionHouse,
        treasuryMint,
        tokenMint,
        buyerPrice,
        1
      )
    
      const metadata = await getMetadata(tokenMint);
      
    //const metadata = await Metadata.fromAccountAddress(ggoconnection, tokenMint);
    //const [metadata] = await MetadataProgram.findMetadataAccount(tokenMint); //.findMetadataAccount(tokenMint);
    const txt = new Transaction()
    
    const depositInstructionAccounts = {
      wallet: new PublicKey(walletPublicKey),
      paymentAccount: new PublicKey(walletPublicKey),
      transferAuthority: new PublicKey(walletPublicKey),
      treasuryMint,
      escrowPaymentAccount,
      authority,
      auctionHouse,
      auctionHouseFeeAccount,
    }
    const depositInstructionArgs = {
      escrowPaymentBump,
      amount: buyerPrice,
    }

    const depositInstruction = createDepositInstruction(
      depositInstructionAccounts,
      depositInstructionArgs
    )
    
    const publicBuyInstruction = createPublicBuyInstruction(
      {
        wallet: new PublicKey(walletPublicKey),
        paymentAccount: new PublicKey(walletPublicKey),
        transferAuthority: new PublicKey(walletPublicKey),
        treasuryMint,
        tokenAccount,
        metadata,
        escrowPaymentAccount,
        authority,
        auctionHouse,
        auctionHouseFeeAccount,
        buyerTradeState,
      },
      {
        escrowPaymentBump,
        tradeStateBump,
        tokenSize: 1,
        buyerPrice,
      }
    )

    
    const [receipt, receiptBump] =
      await AuctionHouseProgram.findBidReceiptAddress(buyerTradeState)
    
    
    const printBidReceiptInstruction = createPrintBidReceiptInstruction(
      {
        receipt,
        bookkeeper: new PublicKey(walletPublicKey),
        instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      },
      {
        receiptBump,
      }
    )

    txt
      .add(depositInstruction)
      .add(publicBuyInstruction)
      .add(printBidReceiptInstruction);
    
    //console.log("txt: "+JSON.stringify(txt))

    //txt.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
    txt.feePayer = new PublicKey(walletPublicKey)
    
    
    //let signed: Transaction | undefined = undefined
    /*
    try {
      signed = await signTransaction(txt)
    } catch (e: any) {
      //toast.error(e.message)
      return
    }*/

    let signature: string | undefined = undefined
    const transferAuthority = web3.Keypair.generate();
    const signers = true ? [] : [transferAuthority];

    let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((mintKey).toBuffer())], auctionHouseKey);
    let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((buyerWalletKey).toBuffer())], auctionHouseKey);
    let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
    
    const GRAPE_AH_MEMO = {
      state:1, // status (0: withdraw, 1: offer, 2: listing, 3: buy/execute (from listing), 4: buy/execute(accept offer), 5: cancel)
      ah:auctionHouseKey.toString(), // pk
      mint:mintKey.toString(), // mint
      amount:buyerPrice // price
    };

    const instructions = txt.instructions;
    //console.log("depositInstruction: "+JSON.stringify(depositInstruction));
    //console.log("publicBuyInstruction: "+JSON.stringify(publicBuyInstruction));
    //console.log("printBidReceiptInstruction: "+JSON.stringify(printBidReceiptInstruction));
    
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