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
} from './helpers/accounts';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house'

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

export async function gah_acceptOffer(offerAmount: number, mint: string, sellerPublicKey: PublicKey, buyerPublicKey: any, updateAuthority: string, collectionAuctionHouse: string, listingTradeState: PublicKey, listed: boolean): Promise<InstructionsAndSignersSet> {
  //START CANCEL
  let tokenSize = 1;
  const auctionHouseKey = new web3.PublicKey(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS);
  const mintKey = new web3.PublicKey(mint);
  let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
  const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);
  const buyerAddress = new web3.PublicKey(buyerPublicKey);
  const sellerAddress = new web3.PublicKey(sellerPublicKey);

  //console.log("buyerAddress: " + buyerAddress.toBase58());
  //console.log("sellerAddress: " + sellerAddress.toBase58());
  //console.log(mint);
  //console.log(offerAmount)
  
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
  
    //const [metadata] = await MetadataProgram.findMetadataAccount(tokenMint)
    const metadata = await getMetadata(tokenMint);
    
    const [sellerTradeState, sellerTradeStateBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        sellerAddress,
        auctionHouse,
        tokenAccount,
        treasuryMint,
        tokenMint,
        buyerPrice,//offer.price.toNumber(),
        1
      )

    
    //const buyerTradeState = new PublicKey(listingTradeState)
    
    const [buyerTradeState] =
      await AuctionHouseProgram.findPublicBidTradeStateAddress(
        buyerAddress,
        auctionHouse,
        treasuryMint,
        tokenMint,
        buyerPrice,//offer.price.toNumber(),
        1
      )
    
      //console.log("buyerTradeState: "+JSON.stringify(buyerTradeState))
      //console.log("listingTradeState: "+JSON.stringify(listingTradeState))

      const [bidReceipt, receiptBump] =
        await AuctionHouseProgram.findBidReceiptAddress(buyerTradeState)

    const [purchaseReceipt, purchaseReceiptBump] =
      await AuctionHouseProgram.findPurchaseReceiptAddress(
        sellerTradeState,
        buyerTradeState
      )


    //console.log("purchaseReceipt: "+JSON.stringify(purchaseReceipt))

    const [escrowPaymentAccount, escrowPaymentBump] =
      await AuctionHouseProgram.findEscrowPaymentAccountAddress(
        auctionHouse,
        buyerAddress
      )

    const [programAsSigner, programAsSignerBump] =
      await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress()

    //console.log("programAsSigner: "+JSON.stringify(programAsSigner))
      
    const [freeTradeState, freeTradeStateBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        sellerAddress,
        auctionHouse,
        tokenAccount,
        treasuryMint,
        tokenMint,
        0,
        1
      )

    //console.log("freeTradeState: "+JSON.stringify(freeTradeState))


    const [buyerReceiptTokenAccount] =
      await AuctionHouseProgram.findAssociatedTokenAccountAddress(
        tokenMint,
        buyerAddress
      )

    const [listingReceipt, listingReceiptBump] =
      await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState)
      
    const sellInstructionAccounts = {
      wallet: sellerAddress,
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
      bookkeeper: sellerAddress,
      instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
    }

    const printListingReceiptInstructionArgs = {
      receiptBump: listingReceiptBump,
    }

    const executeSaleInstructionAccounts = {
      buyer: buyerAddress,
      seller: sellerAddress,
      auctionHouse,
      tokenAccount,
      tokenMint,
      treasuryMint,
      metadata,
      authority,
      sellerTradeState,
      buyerTradeState,
      freeTradeState,
      sellerPaymentReceiptAccount: sellerAddress,
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
      partialOrderSize:null,
      partialOrderPrice:null
    }
    const executePrintPurchaseReceiptInstructionAccounts = {
      purchaseReceipt,
      listingReceipt,
      bidReceipt,
      bookkeeper: sellerAddress,
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
            nft?.creators ? nft.creators.map((creator: any) => ({
              pubkey: new PublicKey(creator.address),
              isSigner: false,
              isWritable: true,
            }))
            :[]
          ),
        })
      )
      .add(executePrintPurchaseReceiptInstruction)
     
    if (listed) {
      /*
      const [tradeState, tradeStateBump] = 
        await AuctionHouseProgram.findTradeStateAddress(
          sellerAddress,
          auctionHouse,
          tokenAccount,
          treasuryMint,
          tokenMint,
          buyerPrice,
          1
        )
      
      const cancelInstructionAccounts = {
        wallet: sellerAddress,
        tokenAccount,
        tokenMint,
        authority,
        auctionHouse,
        auctionHouseFeeAccount,
        tradeState,
      }
      const cancelListingInstructionArgs = {
        buyerPrice,
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
      */
      //txt.add(cancelListingInstruction).add(cancelListingReceiptInstruction)
    }

  txt.feePayer = sellerAddress

  const transferAuthority = web3.Keypair.generate();
  const signers = true ? [] : [transferAuthority];
  const instructions = txt.instructions;

  return {
    signers: signers,
    instructions: instructions
  }

}