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
  ComputeBudgetProgram,
} from '@solana/web3.js'
import { BN, web3 } from '@project-serum/anchor';
import { GRAPE_RPC_ENDPOINT, OTHER_MARKETPLACES } from '../../utils/grapeTools/constants';
import {InstructionsAndSignersSet} from "./helpers/types";
import { concat } from 'ramda';

import { decodeMetadata, Metadata } from './helpers/schema';

import {
  getMetadata,
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

import {
  createCancelInstruction,
  createCancelListingReceiptInstruction,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions'

const {
  createSellInstruction,
  createPrintListingReceiptInstruction,
  createExecuteSaleInstruction,
  createPrintPurchaseReceiptInstruction,
} = AuctionHouseProgram.instructions

export async function gah_acceptOffer(offerAmount: number, mint: string, sellerWalletKey: PublicKey, buyerAddress: any, updateAuthority: string, collectionAuctionHouse: string, listingTradeState: PublicKey): Promise<InstructionsAndSignersSet> {
  //START CANCEL
  let tokenSize = 1;
  const auctionHouseKey = new web3.PublicKey(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS);
  const mintKey = new web3.PublicKey(mint);
  let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
  const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
  //const sellerWalletKey = new web3.PublicKey(mintOwner);
  
  //check if escrow amount already exists to determine if we need to deposit amount to grapevine 
  //const escrow = (await getAuctionHouseBuyerEscrow(auctionHouseKey, buyerAddress))[0];
  //const escrow_amount = await getTokenAmount(anchorProgram,escrow,auctionHouseObj.treasuryMint,);
  //const escrowSolAmount = convertSolVal(escrow_amount);
  
  const auctionHouse = new PublicKey(auctionHouseKey);//new PublicKey(auctionHouseObj.auctionHouse.address)
  const authority = new PublicKey(auctionHouseObj.authority)
  const auctionHouseFeeAccount = new PublicKey(
    auctionHouseObj.auctionHouseFeeAccount
  )
  const tokenMint = mintKey
  const buyerPrice = Number(offerAmount) * LAMPORTS_PER_SOL;

  const treasuryMint = new PublicKey(auctionHouseObj.treasuryMint)
  const auctionHouseTreasury = new PublicKey(
    auctionHouseObj.auctionHouseTreasury
  )
  
  const results = await anchorProgram.provider.connection.getTokenLargestAccounts(mintKey);    
  const tokenAccount: web3.PublicKey = results.value[0].address;
  
  //const bidReceipt = new PublicKey(buyerAddress)//new PublicKey(offer.address)
  
  const buyerPubkey = new PublicKey(buyerAddress)
    //const [metadata] = await MetadataProgram.findMetadataAccount(tokenMint)
    const metadata = await getMetadata(tokenMint);
    
    const [sellerTradeState, sellerTradeStateBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        sellerWalletKey,
        auctionHouse,
        tokenAccount,
        treasuryMint,
        tokenMint,
        buyerPrice,//offer.price.toNumber(),
        1
      )

    const [buyerTradeState] =
      await AuctionHouseProgram.findPublicBidTradeStateAddress(
        buyerPubkey,
        auctionHouse,
        treasuryMint,
        tokenMint,
        buyerPrice,//offer.price.toNumber(),
        1
      )

      const [bidReceipt, receiptBump] =
        await AuctionHouseProgram.findBidReceiptAddress(buyerTradeState)

    const [purchaseReceipt, purchaseReceiptBump] =
      await AuctionHouseProgram.findPurchaseReceiptAddress(
        sellerTradeState,
        buyerTradeState
      )

    const [escrowPaymentAccount, escrowPaymentBump] =
      await AuctionHouseProgram.findEscrowPaymentAccountAddress(
        auctionHouse,
        buyerPubkey
      )

    const [programAsSigner, programAsSignerBump] =
      await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress()

    const [freeTradeState, freeTradeStateBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        sellerWalletKey,
        auctionHouse,
        tokenAccount,
        treasuryMint,
        tokenMint,
        0,
        1
      )

    const [buyerReceiptTokenAccount] =
      await AuctionHouseProgram.findAssociatedTokenAccountAddress(
        tokenMint,
        buyerPubkey
      )

    const [listingReceipt, listingReceiptBump] =
      await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState)
      
    const sellInstructionAccounts = {
      wallet: sellerWalletKey,
      tokenAccount,
      metadata,
      authority,
      auctionHouse: auctionHouse,
      auctionHouseFeeAccount: auctionHouseFeeAccount,
      sellerTradeState: sellerTradeState,
      freeSellerTradeState: freeTradeState,
      programAsSigner: programAsSigner,
    }

    const sellInstructionArgs = {
      tradeStateBump: sellerTradeStateBump,
      freeTradeStateBump: freeTradeStateBump,
      programAsSignerBump: programAsSignerBump,
      buyerPrice: buyerPrice,//offer.price,
      tokenSize: 1,
    }

    const printListingReceiptInstructionAccounts = {
      receipt: listingReceipt,
      bookkeeper: sellerWalletKey,
      instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
    }

    const printListingReceiptInstructionArgs = {
      receiptBump: listingReceiptBump,
    }

    const executeSaleInstructionAccounts = {
      buyer: buyerPubkey,
      seller: sellerWalletKey,
      auctionHouse,
      tokenAccount,
      tokenMint,
      treasuryMint,
      metadata,
      authority,
      sellerTradeState,
      buyerTradeState,
      freeTradeState,
      sellerPaymentReceiptAccount: sellerWalletKey,
      escrowPaymentAccount,
      buyerReceiptTokenAccount,
      auctionHouseFeeAccount,
      auctionHouseTreasury,
      programAsSigner,
    }
    const executeSaleInstructionArgs = {
      escrowPaymentBump,
      freeTradeStateBump,
      programAsSignerBump,
      buyerPrice: buyerPrice,
      tokenSize: 1,
    }
    const executePrintPurchaseReceiptInstructionAccounts = {
      purchaseReceipt,
      listingReceipt,
      bidReceipt,
      bookkeeper: sellerWalletKey,
      instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
    }

    const executePrintPurchaseReceiptInstructionArgs = {
      purchaseReceiptBump: purchaseReceiptBump,
    }

    //console.log("executePrintPurchaseReceiptInstructionAccounts: "+JSON.stringify(executePrintPurchaseReceiptInstructionAccounts));
    //console.log("executePrintPurchaseReceiptInstructionArgs: "+JSON.stringify(executePrintPurchaseReceiptInstructionArgs));

    const createListingInstruction = createSellInstruction(
      sellInstructionAccounts,
      sellInstructionArgs
    )
    const createPrintListingInstruction = createPrintListingReceiptInstruction(
      printListingReceiptInstructionAccounts,
      printListingReceiptInstructionArgs
    )
    const executeSaleInstruction = createExecuteSaleInstruction(
      executeSaleInstructionAccounts,
      executeSaleInstructionArgs
    )
    const executePrintPurchaseReceiptInstruction =
      createPrintPurchaseReceiptInstruction(
        executePrintPurchaseReceiptInstructionAccounts,
        executePrintPurchaseReceiptInstructionArgs
      )

    const txt = new Transaction()
    const metadataObj = await anchorProgram.provider.connection.getAccountInfo(metadata,);
    const metadataDecoded: Metadata = decodeMetadata(Buffer.from(metadataObj.data),);
    const nft = metadataDecoded.data;
    
    txt
      //.add(additionalComputeBudgetInstruction)
      .add(createListingInstruction)
      .add(createPrintListingInstruction)
      .add(
        new TransactionInstruction({
          programId: AuctionHouseProgram.PUBKEY,
          data: executeSaleInstruction.data,
          keys: concat(
            executeSaleInstruction.keys,
            nft.creators.map((creator: any) => ({
              pubkey: new PublicKey(creator.address),
              isSigner: false,
              isWritable: true,
            }))
          ),
        })
      )
      .add(executePrintPurchaseReceiptInstruction)
     
    if (mint) {
      
      const tradeState = listingTradeState;
      /*
      const [tradeState, tradeStateBump] =
      await AuctionHouseProgram.findPublicBidTradeStateAddress(
        buyerPubkey,
        auctionHouse,
        auctionHouseObj.treasuryMint,
        tokenMint,
        buyerPrice,
        1
      )*/

      const cancelInstructionAccounts = {
        wallet: sellerWalletKey,
        tokenAccount,
        tokenMint,
        authority,
        auctionHouse,
        auctionHouseFeeAccount,
        tradeState: listingTradeState,
      }
      const cancelListingInstructionArgs = {
        buyerPrice: buyerPrice,
        tokenSize: 1,
      }

      const [receipt, receiptBump] =
          await AuctionHouseProgram.findListingReceiptAddress(tradeState)

      const cancelListingReceiptAccounts = {
        receipt,
        instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      }

      const cancelListingInstruction = createCancelInstruction(
        cancelInstructionAccounts,
        cancelListingInstructionArgs
      )

      const cancelListingReceiptInstruction =
        createCancelListingReceiptInstruction(cancelListingReceiptAccounts)
      
      txt.add(cancelListingInstruction).add(cancelListingReceiptInstruction)
      
    }

  txt.feePayer = buyerPubkey

  const transferAuthority = web3.Keypair.generate();
  const signers = true ? [] : [transferAuthority];
  const instructions = txt.instructions;

  return {
    signers: signers,
    instructions: instructions
  }

}