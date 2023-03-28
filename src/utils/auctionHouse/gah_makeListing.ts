import {
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    TOKEN_PROGRAM_ID,
  } from './helpers/constants';
import { 
  Transaction,
  Connection,
  PublicKey, 
  LAMPORTS_PER_SOL,
  SystemProgram, 
  TransactionInstruction,
  SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js'
import { web3 } from '@project-serum/anchor';
import { RPC_CONNECTION, RPC_ENDPOINT } from '../../utils/grapeTools/constants';
import { InstructionsAndSignersSet } from "./helpers/types";

import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house'

import { withInitTransferAuthority } from "@cardinal/token-manager";
import { isCardinalWrappedToken, assertOwnerInstruction } from "../../utils/cardinal/helpers";

import {
    loadAuctionHouseProgram,
    getMetadata,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';

const { createSellInstruction, createPrintListingReceiptInstruction } =
  AuctionHouseProgram.instructions

import { ConstructionOutlined } from '@mui/icons-material';
  export async function gah_makeListing(offerAmount: number, mint: string, walletPublicKey: string, mintOwner: any, weightedScore: any, daoPublicKey: string, updateAuthority: string, collectionAuctionHouse: string, tokenDecimals: number): Promise<InstructionsAndSignersSet> {

    const tokenSize = 1;
    const auctionHouseKey = new web3.PublicKey(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS);
    const mintKey = new web3.PublicKey(mint);
    const anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, RPC_ENDPOINT);
    const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);    
    const buyerWalletKey = new web3.PublicKey(walletPublicKey);
    //check if escrow amount already exists to determine if we need to deposit amount to grapevine 
    
    let lps = LAMPORTS_PER_SOL;
    if (tokenDecimals){
      lps = Math.pow(10, tokenDecimals);
    }
    const buyerPrice = Number(offerAmount) * lps
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

    let sellerWalletKey = new PublicKey(walletPublicKey);
    if (daoPublicKey){
      sellerWalletKey = new web3.PublicKey(daoPublicKey);
    }
    
    const [sellerTradeState, sellerTradeStateBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        sellerWalletKey,//publicKey,
        auctionHouse,
        tokenAccount,
        treasuryMint,
        tokenMint,
        buyerPrice,//offer.price.toNumber(),
        tokenSize
      )

    const metadata = await getMetadata(tokenMint)

    const [programAsSigner, programAsSignerBump] =
      await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress()

    const [freeTradeState, freeTradeBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        sellerWalletKey,
        auctionHouse,
        tokenAccount,
        treasuryMint,
        tokenMint,
        0,
        tokenSize
      )

    const txt = new Transaction()

    const sellInstructionArgs = {
      tradeStateBump: sellerTradeStateBump,
      freeTradeStateBump: freeTradeBump,
      programAsSignerBump: programAsSignerBump,
      buyerPrice,
      tokenSize: tokenSize,
    }

    const sellInstructionAccounts = {
      wallet: sellerWalletKey,
      tokenAccount: tokenAccount,
      metadata: metadata,
      authority: authority,
      auctionHouse: auctionHouse,
      auctionHouseFeeAccount: auctionHouseFeeAccount,
      sellerTradeState: sellerTradeState,
      freeSellerTradeState: freeTradeState,
      programAsSigner: programAsSigner,
    }

    const sellInstruction = createSellInstruction(
      sellInstructionAccounts,
      sellInstructionArgs
    )

    const [receipt, receiptBump] =
      await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState)

    const printListingReceiptInstruction = createPrintListingReceiptInstruction(
      {
        receipt,
        bookkeeper: sellerWalletKey,
        instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      },
      {
        receiptBump,
      }
    )

    txt.add(sellInstruction).add(printListingReceiptInstruction)

    //txt.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
    txt.feePayer = sellerWalletKey;

    /*
    const icwt = await isCardinalWrappedToken(RPC_CONNECTION, mint);
    //console.log("mint: "+ tokenMintAddress);
    console.log("cardinal wrapped: "+JSON.stringify(icwt));


    if (icwt){
      await withInitTransferAuthority(
        
      );
    }*/

    const transferAuthority = web3.Keypair.generate();
    const signers = true ? [] : [transferAuthority];
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