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
    getMetadata,
  } from './helpers/accounts';
import { getPriceWithMantissa } from './helpers/various';
import { ASSOCIATED_TOKEN_PROGRAM_ID, createApproveInstruction, createRevokeInstruction } from '@solana/spl-token';

import { TokenAmount } from '../../utils/grapeTools/safe-math';

function convertSolVal(sol: any){
    sol = parseFloat(new TokenAmount(sol, 9).format());
    return sol;
}

  export async function submitOffer(offerAmount: number, mint: string, walletPublicKey: string, mintOwner: any, updateAuthority: any, collectionAuctionHouse: string): Promise<InstructionsAndSignersSet> {

    let tokenSize = 1;
    const auctionHouseKey = new web3.PublicKey(collectionAuctionHouse || AUCTION_HOUSE_ADDRESS);
    const mintKey = new web3.PublicKey(mint);
    let anchorProgram = await loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
    const auctionHouseObj = await anchorProgram.account.auctionHouse.fetch(auctionHouseKey,);    
    const buyerWalletKey = new web3.PublicKey(walletPublicKey);
    //check if escrow amount already exists to determine if we need to deposit amount to grapevine 
    const escrow = (await getAuctionHouseBuyerEscrow(auctionHouseKey, buyerWalletKey))[0];
    const escrow_amount = await getTokenAmount(anchorProgram,escrow,auctionHouseObj.treasuryMint,);
    const escrowSolAmount = convertSolVal(escrow_amount);
    //console.log('escrow_amount:',escrowSolAmount, 'offerAmount:', offerAmount);
    //execute BUY
    const buyPriceAdjusted = new BN(
      await getPriceWithMantissa(
          offerAmount,
          //@ts-ignore
          auctionHouseObj.treasuryMint,
          buyerWalletKey,
          anchorProgram,
      ),
    );

    const tokenSizeAdjusted = new BN(
      await getPriceWithMantissa(
          tokenSize,
          mintKey,
          buyerWalletKey,
          anchorProgram,
      ),
    ); 

    const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
      auctionHouseKey,
      buyerWalletKey, 
    );

    const results = await anchorProgram.provider.connection.getTokenLargestAccounts(mintKey);    
  
    //const tokenAccountKey: web3.PublicKey = tokenAccount ? new web3.PublicKey(tokenAccount) : results.value[0].address;
    const tokenAccountKey: web3.PublicKey = results.value[0].address;

    const [tradeState, tradeBump] = await getAuctionHouseTradeState(
      auctionHouseKey,
      buyerWalletKey,
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
            buyerWalletKey,
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
              wallet: buyerWalletKey,
              paymentAccount: isNative ? buyerWalletKey : ata,
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
    
    //const instructions = [instruction];
    const instructions = [
      ...(isNative
          ? []
          : [
              createApproveInstruction(
                  ata,
                  transferAuthority.publicKey,
                  buyerWalletKey, //walletKeyPair.publicKey, 
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
                  buyerWalletKey, //walletKeyPair.publicKey, 
                  [],
                  TOKEN_PROGRAM_ID,
              ),
          ]),
      ];
    //END BUY

    //CHECK IF DEPOSIT INSTRUCTTION IS NECESSARY
    if (escrowSolAmount > 0){
      //calculate how much more to deposit
      let depositAmount = 0;
      if (offerAmount < escrowSolAmount){
          depositAmount = offerAmount;
      } else {
          depositAmount = (offerAmount - (offerAmount - escrowSolAmount));
      }
      //console.log('depositAmount:', depositAmount);
      const amountAdjusted = await getPriceWithMantissa(
        depositAmount,
        //@ts-ignore
        auctionHouseObj.treasuryMint,
        buyerWalletKey,
        anchorProgram,
      );

      const [escrowPaymentAccount, escrowBump] = await getAuctionHouseBuyerEscrow(
        auctionHouseKey,
        buyerWalletKey,
      );

      const isNative = auctionHouseObj.treasuryMint.equals(WRAPPED_SOL_MINT);

      const ata = (
        await getAtaForMint(
          //@ts-ignore
          auctionHouseObj.treasuryMint,
          buyerWalletKey,
        )
      )[0];

      const transferAuthority = web3.Keypair.generate();
      //const signers = isNative ? [] : [transferAuthority];

      const instruction2 = anchorProgram.instruction.deposit(
        escrowBump,
        new BN(amountAdjusted),
        {
          accounts: {
            wallet: buyerWalletKey,
            paymentAccount: isNative ? buyerWalletKey : ata,
            transferAuthority: isNative
              ? web3.SystemProgram.programId
              : transferAuthority.publicKey,
            escrowPaymentAccount,
            //@ts-ignore
            treasuryMint: auctionHouseObj.treasuryMint,
            //@ts-ignore
            authority: auctionHouseObj.authority,
            auctionHouse: auctionHouseKey,
            //@ts-ignore
            auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
          },
        },
      );
      instructions.push(instruction2);
    }
    // END ADDING DEPOSIT

    let derivedMintPDA = await web3.PublicKey.findProgramAddress([Buffer.from((mintKey).toBuffer())], auctionHouseKey);
    let derivedBuyerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((buyerWalletKey).toBuffer())], auctionHouseKey);
    let derivedOwnerPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(mintOwner)).toBuffer())], auctionHouseKey);
    let derivedUpdateAuthorityPDA = await web3.PublicKey.findProgramAddress([Buffer.from((new PublicKey(updateAuthority)).toBuffer())], auctionHouseKey);
    
    const GRAPE_AH_MEMO = {
      state:1, // status (0: withdraw, 1: offer, 2: listing, 3: buy/execute (from listing), 4: buy/execute(accept offer), 5: cancel)
      ah:auctionHouseKey.toString(), // pk
      mint:mintKey.toString(), // mint
      ua:updateAuthority, // updateAuthority
      amount:buyPriceAdjusted.toNumber() // price
    };

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
      SystemProgram.transfer({
          fromPubkey: buyerWalletKey,
          toPubkey: derivedUpdateAuthorityPDA[0],
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