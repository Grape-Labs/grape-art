import {
    ENV_AH,
    AUCTION_HOUSE_ADDRESS,
    WRAPPED_SOL_MINT,
    TOKEN_PROGRAM_ID,
  } from './helpers/constants';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { BN, web3 } from '@project-serum/anchor';
import { GRAPE_RPC_ENDPOINT, OTHER_MARKETPLACES } from '../../utils/grapeTools/constants';
import {InstructionsAndSignersSet} from "./helpers/types";

import {
    loadAuctionHouseProgram,
    getAuctionHouseTradeState,
    getTokenAmount,
    getAtaForMint,
    getAuctionHouseBuyerEscrow,
    getAuctionHouseProgramAsSigner,
    getMetadata,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';
import { decodeMetadata, Metadata } from './helpers/schema';
import { ASSOCIATED_TOKEN_PROGRAM_ID, createApproveInstruction, createRevokeInstruction } from '@solana/spl-token';

export async function buyNowListing(offerAmount: number, mint: string, walletPublicKey: string, buyerAddress: PublicKey): Promise<InstructionsAndSignersSet> {
  //START BUY
  let tokenSize = 1;
  const auctionHouseKey = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
  const mintKey = new web3.PublicKey(mint);
  let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
  const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);    
  const sellerWalletKey = new web3.PublicKey(walletPublicKey);

  const buyPriceAdjusted = new BN(
    await getPriceWithMantissa(
      offerAmount,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      buyerAddress, 
      anchorProgram,
    ),
  );

  const tokenSizeAdjusted = new BN(
    await getPriceWithMantissa(
      tokenSize,
      mintKey,
      buyerAddress, 
      anchorProgram,
    ),
  );

  const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
    auctionHouseKey,
    buyerAddress, 
  );

  const results = await anchorProgram.provider.connection.getTokenLargestAccounts(mintKey); 

  const tokenAccountKey: web3.PublicKey = results.value[0].address;

  const [tradeState, tradeBump] = await getAuctionHouseTradeState(
    auctionHouseKey,
    buyerAddress, 
    tokenAccountKey,
    //@ts-ignore
    auctionHouseObj.treasuryMint,
    mintKey,
    tokenSizeAdjusted,
    buyPriceAdjusted,
  );

  const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);
  const ata = (
      await getAtaForMint(
          //@ts-ignore
          auctionHouseObj.treasuryMint,
          buyerAddress, 
      )
  )[0];

  const transferAuthority = web3.Keypair.generate();
  const signers = isNative ? [] : [transferAuthority];

  const instruction = anchorProgram.instruction.buy(
    tradeBump,
    escrowBump,
    buyPriceAdjusted,
    tokenSizeAdjusted,
    {
        accounts: {
            wallet: buyerAddress,
            paymentAccount: isNative ? buyerAddress : ata,
            transferAuthority: isNative ? web3.SystemProgram.programId : transferAuthority.publicKey,
            metadata: await getMetadata(mintKey),
            tokenAccount: tokenAccountKey,
            escrowPaymentAccount,
            //@ts-ignore
            treasuryMint: auctionHouseObj.treasuryMint,
            //@ts-ignore
            authority: auctionHouseObj.authority,
            auctionHouse: auctionHouseKey,
            //@ts-ignore
            auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
            buyerTradeState: tradeState,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
        },
    }
  );

  const instructions = [
    ...(isNative
        ? []
        : [
            createApproveInstruction(
                ata,
                transferAuthority.publicKey,
                buyerAddress,
                buyPriceAdjusted.toNumber(),
                [],
                TOKEN_PROGRAM_ID,
                
            ),
        ]),
    instruction,
    ...(isNative
        ? []
        : [
            createRevokeInstruction(
                ata,
                buyerAddress,
                [],
                TOKEN_PROGRAM_ID,
            ),
        ]),
  ];

  if (AUCTION_HOUSE_ADDRESS) {
    //signers.push(auctionHouseKeypairLoaded);
    instruction.keys
      .filter(k => k.pubkey.equals(new PublicKey(AUCTION_HOUSE_ADDRESS)))
      .map(k => (k.isSigner = false));
  }

  //const instructions = [instruction];
  //END BUY
  
  //START EXECUTE SALE
  //const buyerWalletKey = new web3.PublicKey(buyerAddress);
  const buyPriceAdjusted2 = new BN(
      await getPriceWithMantissa(
        offerAmount,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        sellerWalletKey, 
        anchorProgram,
      ),
  );

  const tokenSizeAdjusted2 = new BN(
    await getPriceWithMantissa(
      tokenSize,
      mintKey,
      sellerWalletKey, 
      anchorProgram,
    ),
  );
  const tokenAccountKey2 = (await getAtaForMint(mintKey, sellerWalletKey))[0];
  const buyerTradeState = (
      await getAuctionHouseTradeState(
        auctionHouseKey,
        buyerAddress,
        tokenAccountKey2,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        mintKey,
        tokenSizeAdjusted2,
        buyPriceAdjusted2,
      )
  )[0];
  const sellerTradeState = (
    await getAuctionHouseTradeState(
      auctionHouseKey,
      sellerWalletKey,
      tokenAccountKey2,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintKey,
      tokenSizeAdjusted2,
      buyPriceAdjusted2,
    )
  )[0];
  const [freeTradeState, freeTradeStateBump] =
  await getAuctionHouseTradeState(
      auctionHouseKey,
      sellerWalletKey,
      tokenAccountKey2,
      //@ts-ignore
      auctionHouseObj.treasuryMint,
      mintKey,
      tokenSizeAdjusted2,
      new BN(0),
  );

  const [programAsSigner, programAsSignerBump] = await getAuctionHouseProgramAsSigner();

  const metadata = await getMetadata(mintKey);
  const metadataObj = await anchorProgram.provider.connection.getAccountInfo(metadata,);
  const metadataDecoded: Metadata = decodeMetadata(Buffer.from(metadataObj.data),);
  
  const remainingAccounts = [];
  for (let i = 0; i < metadataDecoded.data.creators.length; i++) {
    remainingAccounts.push({
        pubkey: new web3.PublicKey(metadataDecoded.data.creators[i].address),
        isWritable: true,
        isSigner: false,
    });
    if (!isNative) {
        remainingAccounts.push({
            pubkey: (await getAtaForMint(
                        //@ts-ignore
                        auctionHouseObj.treasuryMint,
                        remainingAccounts[remainingAccounts.length - 1].pubkey,
                        )
                    )[0],
            isWritable: true,
            isSigner: false,
        });
    }
  }

  const tMint: web3.PublicKey = auctionHouseObj.treasuryMint;

  const instruction2 = anchorProgram.instruction.executeSale(
    escrowBump,
    freeTradeStateBump,
    programAsSignerBump,
    buyPriceAdjusted2,
    tokenSizeAdjusted2,
    {
      accounts: {
          buyer: buyerAddress,
          seller: sellerWalletKey,
          metadata,
          tokenAccount: tokenAccountKey2,
          tokenMint: mintKey,
          escrowPaymentAccount,
          treasuryMint: tMint,
          sellerPaymentReceiptAccount: isNative ? sellerWalletKey : (
              await getAtaForMint(tMint, sellerWalletKey)
              )[0],
          buyerReceiptTokenAccount: (
              await getAtaForMint(mintKey, buyerAddress)
          )[0],
          //@ts-ignore
          authority: auctionHouseObj.authority,
          auctionHouse: auctionHouseKey,
          //@ts-ignore
          auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
          //@ts-ignore
          auctionHouseTreasury: auctionHouseObj.auctionHouseTreasury,
          sellerTradeState,
          buyerTradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          programAsSigner,
          rent: web3.SYSVAR_RENT_PUBKEY,
          freeTradeState,
      },
      remainingAccounts,
      signers,
    },
  );    

  if (AUCTION_HOUSE_ADDRESS) {
    //signers.push(auctionHouseKeypairLoaded);
    instruction2.keys
      .filter(k => k.pubkey.equals(new PublicKey(AUCTION_HOUSE_ADDRESS)))
      .map(k => (k.isSigner = false));
  }

  const GRAPE_AH_MEMO = {
    state:3, // status (0: withdraw, 1: offer, 2: listing, 3: buy/execute (from listing), 4: buy/execute(accept offer), 5: cancel)
    ah:auctionHouseKey.toString(), // pk
    mint:mintKey.toString(), // mint
    amount:buyPriceAdjusted.toNumber() // price
  };


//  let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((mintKey).toBuffer())], auctionHouseKey);
//  let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((buyerWalletKey).toBuffer())], auctionHouseKey);
//  let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
/*
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
  );*/
  instructions.push(instruction2);

  instructions.push(
    new TransactionInstruction({
        keys: [{ pubkey: buyerAddress, isSigner: true, isWritable: true }],
        data: Buffer.from(JSON.stringify(GRAPE_AH_MEMO), 'utf-8'),
        programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
    })
  );

  return {
    signers: signers,
    instructions: instructions
  }
}