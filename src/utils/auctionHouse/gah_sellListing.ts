import {
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    TOKEN_PROGRAM_ID,
  } from './helpers/constants';
import { 
  Transaction,
  PublicKey, 
  LAMPORTS_PER_SOL,
  SystemProgram, 
  TransactionInstruction,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Connection} from '@solana/web3.js'
import { web3 } from '@project-serum/anchor';
import { GRAPE_RPC_ENDPOINT, OTHER_MARKETPLACES } from '../grapeTools/constants';
import { InstructionsAndSignersSet } from "./helpers/types";
import { concat } from 'ramda';

import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house'
//import { Metadata } from '@metaplex-foundation/mpl-token-metadata'

import {
    loadAuctionHouseProgram,
    getAuctionHouseTradeState,
    getAtaForMint,
    getAuctionHouseProgramAsSigner,
    getMetadata,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';
import { decodeMetadata, Metadata } from './helpers/schema';

const {
  createPublicBuyInstruction,
  createPrintBidReceiptInstruction,
  createExecuteSaleInstruction,
  createPrintPurchaseReceiptInstruction,
} = AuctionHouseProgram.instructions

export async function gah_sellListing(offerAmount: number, mint: string, buyerPublicKey: string, mintOwner: any, weightedScore: any, daoPublicKey: string, updateAuthority: string, collectionAuctionHouse: string): Promise<InstructionsAndSignersSet> {
    let tokenSize = 1;
    const auctionHouseKey = new web3.PublicKey(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS);
    const mintKey = new web3.PublicKey(mint);
    let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
    const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);  
    const buyerAddress = new web3.PublicKey(buyerPublicKey);
    const sellerAddress = new web3.PublicKey(mintOwner);
    //check if escrow amount already exists to determine if we need to deposit amount to grapevine 
    
    const buyerPrice = Number(offerAmount) * LAMPORTS_PER_SOL
    //console.log("buyerPrice: "+buyerPrice);
    const auctionHouse = new PublicKey(auctionHouseKey);//new PublicKey(auctionHouseObj.auctionHouse.address)
    //console.log("auctionHouse: "+auctionHouseObj.auctionHouse.address);
    const authority = new PublicKey(auctionHouseObj.authority)
    const auctionHouseFeeAccount = new PublicKey(
      auctionHouseObj.auctionHouseFeeAccount
    )
    const auctionHouseTreasury = new PublicKey(
      auctionHouseObj.auctionHouseTreasury
    )
    const treasuryMint = new PublicKey(auctionHouseObj.treasuryMint)
    const tokenMint = mintKey
    //console.log("mintOwner: "+JSON.stringify(mintOwner));
    //const tokenAccount = new PublicKey(mintOwner)
    const results = await anchorProgram.provider.connection.getTokenLargestAccounts(mintKey);    
    const tokenAccount: web3.PublicKey = results.value[0].address;


    let sellerWalletKey = new PublicKey(mintOwner);
    if (daoPublicKey){
      sellerWalletKey = new web3.PublicKey(daoPublicKey);
    }
    
    const [buyerTradeState, tradeStateBump] =
      await AuctionHouseProgram.findPublicBidTradeStateAddress(
        buyerAddress,
        auctionHouse,
        treasuryMint,
        tokenMint,
        buyerPrice,
        1
    )
    const [sellerTradeState, sellerTradeStateBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        sellerWalletKey,//publicKey,
        auctionHouse,
        tokenAccount,
        treasuryMint,
        tokenMint,
        buyerPrice,//offer.price.toNumber(),
        1
      )

    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    //const tokenMetadata = await getMetadata(tokenMint);
    //const [tokenMetadata] = await Metadata.fromAccountAddress(ggoconnection, tokenMint); //await getMetadata(tokenMint)
    const metadata = await getMetadata(tokenMint);
    //console.log("tokenMetadata: "+JSON.stringify(tokenMetadata));
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

    const buyerPubkey = new PublicKey(buyerAddress)
    const [escrowPaymentAccount, escrowPaymentBump] =
      await AuctionHouseProgram.findEscrowPaymentAccountAddress(
        auctionHouse,
        buyerPubkey
    )
    
    console.log("buyerPubkey: "+JSON.stringify(buyerPubkey));
    console.log("paymentAccount: "+JSON.stringify(buyerPubkey));
    console.log("transferAuthority: "+JSON.stringify(buyerPubkey));
    console.log("treasuryMint: "+JSON.stringify(treasuryMint));
    console.log("tokenAccount: "+JSON.stringify(tokenAccount));
    console.log("metadata: "+JSON.stringify(metadata));
    console.log("escrowPaymentAccount: "+JSON.stringify(escrowPaymentAccount));
    console.log("authority: "+JSON.stringify(authority));
    console.log("auctionHouse: "+JSON.stringify(auctionHouse));
    console.log("auctionHouseFeeAccount: "+JSON.stringify(auctionHouseFeeAccount));
    console.log("buyerTradeState: "+JSON.stringify(buyerTradeState));
      
    const publicBuyInstructionAccounts = {
      wallet: buyerPubkey,
      paymentAccount: buyerPubkey,
      transferAuthority: buyerPubkey,
      treasuryMint,
      tokenAccount,
      metadata,
      escrowPaymentAccount,
      authority,
      auctionHouse,
      auctionHouseFeeAccount,
      buyerTradeState,

    }

    console.log("tradeStateBump: "+JSON.stringify(tradeStateBump));
    console.log("escrowPaymentBump: "+JSON.stringify(escrowPaymentBump));
    console.log("buyerPrice: "+JSON.stringify(buyerPrice));

    const publicBuyInstructionArgs = {
      tradeStateBump,
      escrowPaymentBump,
      buyerPrice,
      tokenSize: 1,
    }

    const [buyerReceiptTokenAccount] =
      await AuctionHouseProgram.findAssociatedTokenAccountAddress(
        tokenMint,
        buyerPubkey
      )

    const transferAuthority = web3.Keypair.generate();
    const signers = true ? [] : [transferAuthority]; 
    
    const executeSaleInstructionAccounts2 = {
      buyer: buyerAddress,
      sellerAddress,
      transferAuthority,
      treasuryMint,
      tokenAccount,
      metadata,
      escrowPaymentAccount,
      authority,
      auctionHouse,
      auctionHouseFeeAccount,
      buyerTradeState,
      tokenMint,
      sellerPaymentReceiptAccount: sellerWalletKey,
      buyerReceiptTokenAccount,
      auctionHouseTreasury,
      sellerTradeState,
      freeTradeState,
      programAsSigner,
    }

    const executeSaleInstructionAccounts = {
      buyer: buyerAddress,
      seller: sellerAddress,
      tokenAccount,
      auctionHouse,
      
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

    const [bidReceipt, bidReceiptBump] =
        await AuctionHouseProgram.findBidReceiptAddress(buyerTradeState)

    const printBidReceiptAccounts = {
      bookkeeper: buyerAddress,
      receipt: bidReceipt,
      instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
    }
    const printBidReceiptArgs = {
      receiptBump: bidReceiptBump,
    }

    const [purchaseReceipt, purchaseReceiptBump] =
      await AuctionHouseProgram.findPurchaseReceiptAddress(
        sellerTradeState,
        buyerTradeState
      )

    const [listingReceipt, listingReceiptBump] =
      await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState)

    const printPurchaseReceiptAccounts = {
      bookkeeper: buyerAddress,
      purchaseReceipt,
      bidReceipt,
      listingReceipt,
      instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
    }
    const printPurchaseReceiptArgs = {
      purchaseReceiptBump,
    }

    const publicBuyInstruction = createPublicBuyInstruction(
      publicBuyInstructionAccounts,
      publicBuyInstructionArgs
    )

    const printBidReceiptInstruction = createPrintBidReceiptInstruction(
      printBidReceiptAccounts,
      printBidReceiptArgs
    )
    const executeSaleInstruction = createExecuteSaleInstruction(
      executeSaleInstructionAccounts,
      executeSaleInstructionArgs,
    )
    const printPurchaseReceiptInstruction =
      createPrintPurchaseReceiptInstruction(
        printPurchaseReceiptAccounts,
        printPurchaseReceiptArgs
      )

      const txt = new Transaction()
      const metadataObj = await anchorProgram.provider.connection.getAccountInfo(metadata,);
      const metadataDecoded: Metadata = decodeMetadata(Buffer.from(metadataObj.data),);
      const nft = metadataDecoded.data;

      /*
      nft.creators.map((creator: any) => (
        console.log("executeSaleInstruction: "+JSON.stringify(executeSaleInstruction.keys))
      ));
      */

      txt
        .add(publicBuyInstruction)
        .add(printBidReceiptInstruction)
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
        //.add(printPurchaseReceiptInstruction)
        
  
    
    //txt.add(publicBuyInstruction).add(printPurchaseReceiptInstruction)
    
    //txt.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
    txt.feePayer = buyerAddress;
    
    const instructions = txt.instructions;
    
    /*
    let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((mintKey).toBuffer())], auctionHouseKey);
    let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((sellerWalletKey).toBuffer())], auctionHouseKey);
    let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
    let derivedUpdateAuthorityPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(updateAuthority)).toBuffer())], auctionHouseKey);
  
    const GRAPE_AH_MEMO = {
      state:2, // status (0: withdraw, 1: offer, 2: listing, 3: buy/execute (from listing), 4: buy/execute(accept offer), 5: cancel)
      ah:auctionHouseKey.toString(), // pk
      mint:mintKey.toString(), // mint
      ua:updateAuthority, // updateAuthority
      amount:buyerPrice, // price
      score:weightedScore, // spam protection for our feed/higher score weight higher feed visibility
    };
    
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: sellerWalletKey,
        toPubkey: derivedMintPDA[0],
        lamports: 0,
      })
    );
    instructions.push(
      SystemProgram.transfer({
          fromPubkey: sellerWalletKey,
          toPubkey: derivedBuyerPDA[0],
          lamports: 0,
      })
    );
    instructions.push(
      SystemProgram.transfer({
          fromPubkey: sellerWalletKey,
          toPubkey: derivedOwnerPDA[0],
          lamports: 0,
      })
    );
    instructions.push(
      SystemProgram.transfer({
          fromPubkey: sellerWalletKey,
          toPubkey: derivedUpdateAuthorityPDA[0],
          lamports: 0,
      })
    );
    instructions.push(
      new TransactionInstruction({
          keys: [{ pubkey: sellerWalletKey, isSigner: true, isWritable: true }],
          data: Buffer.from(JSON.stringify(GRAPE_AH_MEMO), 'utf-8'),
          programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      })
    );
    */
    return {
      signers: signers,
      instructions: instructions
    }

  }