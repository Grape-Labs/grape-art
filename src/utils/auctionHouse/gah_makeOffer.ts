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
import { GRAPE_RPC_ENDPOINT } from '../grapeTools/constants';
import {InstructionsAndSignersSet} from "./helpers/types";

import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house'
import { Metadata } from '@metaplex-foundation/mpl-token-metadata'
//import { MetadataProgram, Metadata } from '@metaplex-foundation/mpl-token-metadata'
//import { deprecated } from "@metaplex-foundation/mpl-token-metadata";

import {
    loadAuctionHouseProgram,
    getTokenAmount, 
    getMetadata,
    getAuctionHouseBuyerEscrow,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';

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

export async function gah_makeOffer(offerAmount: number, mint: string, walletPublicKey: string, mintOwner: any, updateAuthority: string, collectionAuctionHouse: string, lamports: number): Promise<InstructionsAndSignersSet> {
    //const { publicKey, signTransaction } = useWallet();
    console.log("collectionAuctionHouse " + JSON.stringify(collectionAuctionHouse));
    const tokenSize = 1;
    const auctionHouseKey = new web3.PublicKey(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS);
    const mintKey = new web3.PublicKey(mint);
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
    const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);    
    const buyerWalletKey = new web3.PublicKey(walletPublicKey);
    //check if escrow amount already exists to determine if we need to deposit amount to grapevine 
    //const escrow = (await getAuctionHouseBuyerEscrow(auctionHouseKey, buyerWalletKey))[0];
    //const escrow_amount = await getTokenAmount(anchorProgram,escrow,new PublicKey(auctionHouseObj.treasuryMint),);
    
    //const escrowSolAmount = convertSolVal(escrow_amount);
    //console.log('escrow_amount:',escrowSolAmount, 'offerAmount:', offerAmount);
    
    let lps = LAMPORTS_PER_SOL;
    //if (lamports)
    //  lps = lamports;

    const buyerPrice = Number(offerAmount) * lps;
    
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
        tokenSize
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
        tradeStateBump,
        escrowPaymentBump,
        buyerPrice,
        tokenSize: tokenSize,
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
    
    txt.feePayer = new PublicKey(walletPublicKey)

    const signature: string | undefined = undefined
    const transferAuthority = web3.Keypair.generate();
    const signers = true ? [] : [transferAuthority];
    const instructions = txt.instructions;

    return {
      signers: signers,
      instructions: instructions
    }

  }