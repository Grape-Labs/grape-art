import { PublicKey, SystemProgram, TransactionInstruction, Transaction, } from '@solana/web3.js'
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
} from '@solana/spl-governance';

import { 
  TOKEN_REALM_PROGRAM_ID,
} from '../grapeTools/constants';
import { AnyMxRecord } from 'dns';

  export async function createDAOProposal(offerAmount: number, mint: string, walletPublicKey: string, mintOwner: any, weightedScore: any, daoPublicKey: string, connection: any, transactionInstr: InstructionsAndSignersSet, sendTransaction: any): Promise<InstructionsAndSignersSet> {
    
    //console.log('inDAOProposal instructionArray before adding DAO Instructions:'+JSON.stringify(transactionInstr));
    //let initialInstructions: TransactionInstruction[] = [];
    let signers: any[] = [];

    let instructions: TransactionInstruction[] = [];
    const programId = new PublicKey(TOKEN_REALM_PROGRAM_ID);
    const programVersion = await getGovernanceProgramVersion(
      connection,
      programId,
    );
    
    const realmPk = new PublicKey('DcR6g5EawaEoTRYcnuBjtD26VSVjWNoi1C1hKJWwvcup');
    const governancePk = new PublicKey('JAbgQLj9MoJ2Kvie8t8Y6z6as3Epf7rDp87Po3wFwrNK');
    const name = 'Sale of NFT: '+mint+' for '+offerAmount+'sol on grape.art';
    const descriptionLink = '';
    const governingTokenMint = new PublicKey('9Z7SQ1WMiDNaHu2cX823sZxD2SQpscoLGkyeLAHEqy9r');
    const walletPk = new PublicKey(walletPublicKey);
    /*const realm = await getRealm(connection, realmPk);
    console.log('realm' +JSON.stringify(realm));*/
    const governance = await getGovernance(connection, governancePk);
    //console.log('governance' +JSON.stringify(governance));
    /*selectedGovernance.pubkey,
    selectedGovernance?.account?.proposalCount,*/
    const proposalIndex = governance?.account?.proposalCount;
    //const proposalIndex = 15;  //this isn't fixed will need to find the next available slot for a proposal
    const voteType = VoteType.SINGLE_CHOICE;
    const options = ['Approve'];
    const useDenyOption = true;
    
    const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
      programId,
      realmPk,
      governingTokenMint,
      walletPk,
    );
    
    //extras
    const governingTokenMintAuthority = new PublicKey('Dg4LFS33D4jMaSzQVLbFst6PB5svY9KcMHqWyJTth4bM');
    const communityTokenMint = new PublicKey('DGPzmXUt39qwNca5diqsWHK7P9w2jtrP6jNt7MH8AhEq');
    const realmAuthority = new PublicKey('8zhQAf4KmJKBPH1hUT8QCQJEcXF78DdoKHoNqxX3dJDj');
    //const realm = await getRealm(connection, realmPk);

    instructions = [];
    const proposalPk = await withCreateProposal(
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
    //see if we can add some of the instruction data in the createProposal before sending first transaction

    let transactionDao = new Transaction();
    transactionDao.add(...instructions);

    let instructionData: InstructionData[]=[];

    for (var instruction of transactionInstr.instructions){
        instructionData.push(createInstructionData(instruction));
    }
    //reset instructions to prepare for sending rest of instructions and signOffProposal         
    instructions = [];
    signers = [];

    const wit1 = await withInsertTransaction(
      instructions,
      programId,
      programVersion,
      governancePk,
      proposalPk,
      tokenOwnerRecordPk,
      walletPk,
      0,
      0,
      0,
      instructionData.slice(0,1),
      walletPk,
    );
    console.log("instructionsData: "+JSON.stringify(instructionData.slice(0,1)));
    transactionDao.add(...instructions);

    const signedTransaction = await sendTransaction(transactionDao, connection);
    await connection.confirmTransaction(signedTransaction, 'processed'); 
    instructions = [];
    signers = [];
    const wit2 = await withInsertTransaction(
      instructions,
      programId,
      programVersion,
      governancePk,
      proposalPk,
      tokenOwnerRecordPk,
      walletPk,
      1,
      0,
      0,
      instructionData.slice(1,3),
      walletPk,
    );
    
    //const instructions2Set = instructions;
    console.log("instructionsData2: "+JSON.stringify(instructionData.slice(1,3)));
    //add to transaction first sell now listing instruction (the big one)
    let transactionDao2 = new Transaction();
    transactionDao2.add(...instructions);

    const signedTransaction2 = await sendTransaction(transactionDao2, connection);
    await connection.confirmTransaction(signedTransaction2, 'processed'); 

    instructions = [];
    signers = [];
    //const transaction2 = new Transaction();
    //transaction2.add(...instructions);
    const wit3 = await withInsertTransaction(
      instructions,
      programId,
      programVersion,
      governancePk,
      proposalPk,
      tokenOwnerRecordPk,
      walletPk,
      2,
      0,
      0,
      instructionData.slice(4),
      //[instructionData2],
      walletPk,
    );
    console.log("instructionsData3: "+JSON.stringify(instructionData.slice(4)));
    const instructions3Set = instructions;
    //reset instructions
    
    instructions = [];
    signers = [];
    //add signOff without signatory
    withSignOffProposal(
        instructions,
        programId,
        programVersion,
        realmPk,
        governancePk,
        proposalPk,
        walletPk,
        undefined,
        tokenOwnerRecordPk,
    );
    
    instructions3Set.push(...instructions);
    //transaction2.add(...instructions);
      //console.log("instructions: "+JSON.stringify(instructions));
    console.log("instructionsData3: "+JSON.stringify(instructionData.slice(3)));
    return {
      signers: signers,
      instructions: instructions3Set
    }
  }

