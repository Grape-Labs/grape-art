import {
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    TOKEN_PROGRAM_ID,
  } from './helpers/constants';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { BN, web3 } from '@project-serum/anchor';
import { GRAPE_RPC_ENDPOINT, OTHER_MARKETPLACES } from '../grapeTools/constants';
import {InstructionsAndSignersSet} from "./helpers/types";

import {
    loadAuctionHouseProgram,
    getAuctionHouseTradeState,
    getAtaForMint,
    getAuctionHouseProgramAsSigner,
    getMetadata,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';
import { ConstructionOutlined } from '@mui/icons-material';
  export async function sellNowListingDao(offerAmount: number, mint: string, walletPublicKey: string, mintOwner: any, weightedScore: any, daoPublicKey: string): Promise<InstructionsAndSignersSet> {

    let tokenSize = 1;
    //const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
    const auctionHouseKey = new web3.PublicKey('GcCbqaXBjYgRo6sktgGXnTsW33nb5LB2LkKgqVMaFeqD');
    const mintKey = new web3.PublicKey(mint);
    let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
    const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);    
    const thisWalletPublicKey = new web3.PublicKey(walletPublicKey);
    
    let sellerWalletKey = thisWalletPublicKey;
    /*if (daoPublicKey){
      sellerWalletKey = new web3.PublicKey(daoPublicKey);
    }*/
    let daoPk = new web3.PublicKey(daoPublicKey);

    const buyPriceAdjusted = new BN(
      await getPriceWithMantissa(
        +offerAmount,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        //sellerWalletKey, 
        daoPk,
        anchorProgram,
      ),
    );
    console.log('buyPriceAdjusted:', buyPriceAdjusted.toString());
    const tokenSizeAdjusted = new BN(
      await getPriceWithMantissa(
        tokenSize,
        mintKey,
        //sellerWalletKey,
        daoPk, 
        anchorProgram,
      ),
    );
    console.log('tokenSizeAdjusted:', tokenSizeAdjusted.toString());
    //const tokenAccountKey = (await getAtaForMint(mintKey, sellerWalletKey))[0];
    const tokenAccountKey = (await getAtaForMint(mintKey, daoPk))[0];
    console.log('tokenAccountKey:', tokenAccountKey.toBase58());
    const [programAsSigner, programAsSignerBump] =
        await getAuctionHouseProgramAsSigner();
    console.log('programAsSigner:', programAsSigner.toBase58());
    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
        auctionHouseKey,
        //sellerWalletKey,
        daoPk,
        tokenAccountKey,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintKey,
        tokenSizeAdjusted,
        buyPriceAdjusted,
    );
    console.log('tradeState:', tradeState.toBase58());
    const [freeTradeState1, freeTradeBump] = await getAuctionHouseTradeState(
      auctionHouseKey,
      //sellerWalletKey,
      daoPk,
      tokenAccountKey,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintKey,
      tokenSizeAdjusted,
      new BN(0),
    );
    console.log('freeTradeState1:', freeTradeState1.toBase58());
    console.log('freeTrandeState is empty?:', JSON.stringify(freeTradeState1));
    const signers: any[] = [];

    const instruction = anchorProgram.instruction.sell(
      tradeBump,
      freeTradeBump,
      programAsSignerBump,
      buyPriceAdjusted,
      tokenSizeAdjusted,
      {
      accounts: {
          //wallet: sellerWalletKey,
          wallet: daoPk,
          metadata: await getMetadata(mintKey),
          tokenAccount: tokenAccountKey,
          //@ts-ignore
          authority: auctionHouseObj.authority,
          auctionHouse: auctionHouseKey,
          //@ts-ignore
          auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,

          sellerTradeState: tradeState,
          freeSellerTradeState: freeTradeState1,

          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          programAsSigner,
          rent: web3.SYSVAR_RENT_PUBKEY,
      },
      signers,
      },
    ); 

    /*instruction.keys
    .filter(k => k.pubkey.equals(sellerWalletKey))
    .map(k => (k.isSigner = false, k.isWritable = true));*/
    instruction.keys
    .filter(k => k.pubkey.equals(daoPk))
    .map(k => (k.isSigner = true, k.isWritable = true));
    instruction.keys
    .filter(k => k.pubkey.equals(auctionHouseObj.authority))
    .map(k => (k.isSigner = true, k.isWritable = true));

    //console.log(instruction);
    const instructions = [instruction];
    //console.log("sellerWalletKey: "+sellerWalletKey.toBase58());
    
    let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((mintKey).toBuffer())], auctionHouseKey);
    let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((sellerWalletKey).toBuffer())], auctionHouseKey);
    let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
  
    const GRAPE_AH_MEMO = {
      state:2, // status (0: withdraw, 1: offer, 2: listing, 3: buy/execute (from listing), 4: buy/execute(accept offer), 5: cancel)
      ah:auctionHouseKey.toString(), // pk
      mint:mintKey.toString(), // mint
      amount:buyPriceAdjusted.toNumber(), // price
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

    //if the sellerWallet and the mintOwner are not the same thne push the pdf for the mintOwner as well
    if (derivedOwnerPDA[0].toBase58() != derivedBuyerPDA[0].toBase58()) {
      instructions.push(
        SystemProgram.transfer({
            fromPubkey: sellerWalletKey,
            toPubkey: derivedOwnerPDA[0],
            lamports: 0,
        })
      );
    }

    instructions.push(
      new TransactionInstruction({
          //keys: [{ pubkey: sellerWalletKey, isSigner: true, isWritable: true }],
          keys: [{ pubkey: daoPk, isSigner: true, isWritable: true }],
          data: Buffer.from(JSON.stringify(GRAPE_AH_MEMO), 'utf-8'),
          programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      })
    );

    return {
      signers: signers,
      instructions: instructions
    }

  }