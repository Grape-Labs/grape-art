import { PublicKey, SystemProgram, TransactionInstruction, Transaction, Keypair, Connection} from '@solana/web3.js'
import { BN, web3 } from '@project-serum/anchor';
import {InstructionsAndSignersSet} from "./helpers/types";
import { 
  getRealms, 
  getVoteRecordsByVoter, 
  getTokenOwnerRecordAddress,
  getTokenOwnerRecordForRealm, 
  getTokenOwnerRecordsByOwner, 
  getGovernanceAccounts, 
  pubkeyFilter, 
  TokenOwnerRecord, 
  withCreateProposal,
  VoteType, 
  getGovernanceProgramVersion,
  serializeInstructionToBase64,
  createInstructionData,
  withInsertTransaction,
  InstructionData,
  AccountMetaData,
  getRealm,
  withSignOffProposal,
  getAllProposals,
  getGovernance,
  withAddSignatory,
  getSignatoryRecordAddress,
  RpcContext,
} from '@solana/spl-governance';

import { 
  TOKEN_REALM_PROGRAM_ID,
  //REALM_PUBLIC_KEY,
  //COLLABORATION_DAO,
  //COLLABORATION_SOL_TREASURY,
  VERIFIED_DAO_ARRAY,
} from '../grapeTools/constants';
import { chunks } from '../governanceTools/helpers';
import { sendTransactions, SequenceType, WalletSigner, getWalletPublicKey } from '../governanceTools/sendTransactions';
//import { SignerWalletAdapter } from '@solana/wallet-adapter-base';
//import { useAnchorWallet } from "@solana/wallet-adapter-react";

  export async function createProposal(offerAmount: number, mint: string, walletPublicKey: string, mintOwner: any, weightedScore: any, daoPublicKey: string, connection: Connection, transactionInstr: InstructionsAndSignersSet, sendTransaction: any, wallet: WalletSigner, state: number, updateAuthority: any, collectionAuctionHouse: string): Promise<PublicKey> {
    
    //let instructions: TransactionInstruction[] = [];
    //let signers: any[] = [];
    //set certain parameters
    let realmPk: PublicKey;
    let governancePk: PublicKey;
    for (var verified of VERIFIED_DAO_ARRAY){
      //if (verified.address === mintOwner){
      if (verified.solTreasury === mintOwner){
          realmPk = new PublicKey(verified.realmPK);
          governancePk = new PublicKey(verified.address);
      }
    }
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];
    //const realmPk = new PublicKey(REALM_PUBLIC_KEY);
    //const governancePk = new PublicKey(COLLABORATION_DAO);

    const realm = await getRealm(connection, realmPk);
    //console.log('realm' +JSON.stringify(realm));
    
    const governingTokenMint = realm?.account?.config?.councilMint;
    let name : any;

    //set name description of proposal to be executed
    if (state===1) {    
      name = 'Offer for NFT: '+mint+' for '+offerAmount+'sol on grape.art';
    } else if (state===2){
      name = 'Sale of NFT: '+mint+' for '+offerAmount+'sol on grape.art';
    }  else {
      name = 'Unknown proposal for NFT: '+mint+' for '+offerAmount+'sol on grape.art';
    }
    
    const descriptionLink = '';
    const walletPk = new PublicKey(walletPublicKey);
    const signatory = walletPk;

    //extra
    //const solTreasury = new PublicKey(COLLABORATION_SOL_TREASURY);
    //const communityTokenMint = realm?.account?.communityMint;
    //const realmAuthority = realm?.account?.authority;

    // Explicitly request the version before making RPC calls to work around race conditions in resolving
    // the version for RealmInfo
    const programId = new PublicKey(TOKEN_REALM_PROGRAM_ID);
    const programVersion = await getGovernanceProgramVersion(
      connection,
      programId,
    );
    // V2 Approve/Deny configuration
    const voteType = VoteType.SINGLE_CHOICE;
    const options = ['Approve'];
    const useDenyOption = true;

    const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
      programId,
      realmPk,
      governingTokenMint,
      walletPk,
    );
    const governance = await getGovernance(connection, governancePk);
    const proposalIndex = governance?.account?.proposalCount;

    //will run only if plugin is connected with realm
    /*const voterWeight = await withUpdateVoterWeightRecord(
      instructions,
      wallet.publicKey!,
      realm,
      client
    );*/

    const proposalAddress = await withCreateProposal(
      instructions,
      programId,
      programVersion,
      realmPk,
      governancePk,
      tokenOwnerRecordPk,
      name,
      descriptionLink,
      governingTokenMint,
      walletPk,
      proposalIndex,
      voteType,
      options,
      useDenyOption,
      walletPk,
    );
    
    //no current need to add Signatory
    /*await withAddSignatory(
      instructions,
      programId,
      programVersion,
      proposalAddress,
      tokenOwnerRecordPk,
      governingTokenMint,
      signatory,
      walletPk
    );*/

    // TODO: Return signatoryRecordAddress from the SDK call
    /*const signatoryRecordAddress = await getSignatoryRecordAddress(
      programId,
      proposalAddress,
      signatory
    );*/
    //console.log('signatoryRecordAddres:', signatoryRecordAddress.toBase58());
    
    const insertInstructions: TransactionInstruction[] = [];
    //we don't have any prerequisiteInstructions to execute so we will leave this null
    const prerequisiteInstructions: TransactionInstruction[] = [];

    //loop InsertTransactions based on number of intrsuctions in transactionInstr
    let instructionData: InstructionData[]=[];
    for (var instruction of transactionInstr.instructions){
      instructionData.push(createInstructionData(instruction));
    }
    
    for(let j= 0; j < transactionInstr.instructions.length; j++) {
      await withInsertTransaction(
        insertInstructions,
        programId,
        programVersion,
        governancePk,
        proposalAddress,
        tokenOwnerRecordPk,
        walletPk,
        j,
        0,
        0,
        [instructionData[j]],
        walletPk
      );
    }

    withSignOffProposal(
      insertInstructions, // SingOff proposal needs to be executed after inserting instructions hence we add it to insertInstructions
      programId,
      programVersion,
      realmPk,
      governancePk,
      proposalAddress,
      signatory,
      /*signatoryRecordAddress,
      undefined*/
      undefined,
      tokenOwnerRecordPk
    );
  
    const insertChunks = chunks(insertInstructions, 1);
    const signerChunks = Array(insertChunks.length).fill([]);
    //console.log('connection publicKey:', connection)
    console.log(`Creating proposal using ${insertChunks.length} chunks`);

   await sendTransactions(
      connection,
      wallet,
      [prerequisiteInstructions, instructions, ...insertChunks],
      [[], [], ...signerChunks],
      SequenceType.Sequential
    );
  
    return proposalAddress;
  }