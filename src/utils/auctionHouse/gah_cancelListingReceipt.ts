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
  SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js'
import { web3 } from '@project-serum/anchor';
import { GRAPE_RPC_ENDPOINT, OTHER_MARKETPLACES } from '../grapeTools/constants';
import { InstructionsAndSignersSet } from "./helpers/types";

import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house'

import {
    loadAuctionHouseProgram,
    getAuctionHouseTradeState,
    getAtaForMint,
    getAuctionHouseProgramAsSigner,
    getMetadata,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';

const { 
  createCancelInstruction, 
  createCancelListingReceiptInstruction } =
  AuctionHouseProgram.instructions

import { ConstructionOutlined } from '@mui/icons-material';
  export async function gah_cancelListingReceipt(price: number, mint: string, walletPublicKey: string, mintOwner: any, weightedScore: any, daoPublicKey: string, updateAuthority: string, collectionAuctionHouse: string): Promise<InstructionsAndSignersSet> {
    console.log("collectionAuctionHouse " + JSON.stringify(collectionAuctionHouse));
    const tokenSize = 1;
    const auctionHouseKey = new web3.PublicKey(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS);
    const mintKey = new web3.PublicKey(mint);
    const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
    const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);    
    //check if escrow amount already exists to determine if we need to deposit amount to grapevine 
    
    const buyerPrice = Number(price) * LAMPORTS_PER_SOL
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

      console.log("tokenAccount: "+JSON.stringify(tokenAccount));

      // IMPORTANT THIS IS THE MAKE LISTING
      // We need to cancel the listing

    let sellerWalletKey = new PublicKey(walletPublicKey);
    if (daoPublicKey){
      sellerWalletKey = new web3.PublicKey(daoPublicKey);
    }
    
    const txt = new Transaction()

      const [tradeState, tradeStateBump] = 
        await AuctionHouseProgram.findTradeStateAddress(
          sellerWalletKey,
          auctionHouse,
          tokenAccount,
          treasuryMint,
          tokenMint,
          buyerPrice,
          tokenSize
        )
      
      const [receipt, receiptBump] =
          await AuctionHouseProgram.findListingReceiptAddress(tradeState)

          console.log("receipt: "+JSON.stringify(receipt));
          console.log("tradeState: "+JSON.stringify(tradeState));

      const cancelListingReceiptAccounts = {
        receipt,
        instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      }

      const cancelListingReceiptInstruction =
        createCancelListingReceiptInstruction(cancelListingReceiptAccounts)

    txt.add(cancelListingReceiptInstruction)
    
    //txt.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
    txt.feePayer = sellerWalletKey;
    
    const transferAuthority = web3.Keypair.generate();
    const signers = true ? [] : [transferAuthority];
    const instructions = txt.instructions;
    
    return {
      signers: signers,
      instructions: instructions
    }

  }