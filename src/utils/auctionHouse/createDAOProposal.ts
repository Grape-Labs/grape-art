import { PublicKey, SystemProgram, TransactionInstruction, Transaction } from '@solana/web3.js'
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
} from '@solana/spl-governance';

import { 
  TOKEN_REALM_PROGRAM_ID,
} from '../grapeTools/constants';
import { AnyMxRecord } from 'dns';

// Converts TransactionInstruction to InstructionData format
/*export const createInstructionData2 = (instruction: TransactionInstruction) => {
  return new InstructionData({
    programId: instruction.programId,
    data: instruction.data,
    accounts: instruction.keys.map(
      k =>
        new AccountMetaData({
          pubkey: k.pubkey,
          isSigner: k.isSigner,
          //isSigner: false,
          isWritable: k.isWritable,
          //isWritable: false,
        }),
    ),
  });
};*/

  export async function createDAOProposal(offerAmount: number, mint: string, walletPublicKey: string, mintOwner: any, weightedScore: any, daoPublicKey: string, connection: any, transactionInstr: InstructionsAndSignersSet, sendTransaction: any): Promise<InstructionsAndSignersSet> {
    
    //console.log('inDAOProposal instructionArray before adding DAO Instructions:'+JSON.stringify(transactionInstr));
    let instructions: TransactionInstruction[] = [];
    //let initialInstructions: TransactionInstruction[] = [];
    const signers: any[] = [];
    // fetch realms information on the dao
    const voteType = VoteType.SINGLE_CHOICE;
    const options = ['Approve'];
    const useDenyOption = true;
    const programId = new PublicKey(TOKEN_REALM_PROGRAM_ID);
    const realmPk = new PublicKey('DcR6g5EawaEoTRYcnuBjtD26VSVjWNoi1C1hKJWwvcup');
    const governancePk = new PublicKey('JAbgQLj9MoJ2Kvie8t8Y6z6as3Epf7rDp87Po3wFwrNK');
    const name = 'Sale of NFT: '+mint+' for '+offerAmount+'sol on grape.art';
    const descriptionLink = '';
    const governingTokenMint = new PublicKey('9Z7SQ1WMiDNaHu2cX823sZxD2SQpscoLGkyeLAHEqy9r');
    const governanceAuthority = new PublicKey(walletPublicKey);
    const proposalIndex = 0;
    const programVersion = await getGovernanceProgramVersion(
      connection,
      //new PublicKey(daoPublicKey),
      programId,
    );
    console.log('programVersion:',programVersion);

    const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
      programId,
      realmPk,
      governingTokenMint,
      governancePk
    );
    console.log('tokenOwnerRecordPK:', tokenOwnerRecordPk.toBase58());
    const proposalPk = await withCreateProposal(
      instructions,
      //new PublicKey(daoPublicKey), 
      programId,
      programVersion,
      realmPk,
      governancePk,
      tokenOwnerRecordPk,
      name,
      descriptionLink,
      governingTokenMint,
      governanceAuthority,
      proposalIndex,
      voteType,
      options,
      useDenyOption,
      governanceAuthority,
  );
  
  let instructionData: InstructionData[]=[]; //createInstructionData([transactionInstr.instructions]);
  
  //to add all 5 instructions from sellNowListing
  let j = 0;
  for (var instruction of transactionInstr.instructions){
    //instructionData.push(instruction);
    
    if (j < 2){
      //instructionData.push(createInstructionData2(instruction));
      instructionData.push(createInstructionData(instruction));
      console.log("instructionData: "+JSON.stringify(instructionData));
    }
    j++;
  }

  //console.log('instruction in position 0'+JSON.stringify(instructionData[0]));
  //const instructionData2 = createInstructionData(instruction);
  //instructionData.push(instructionData2);

  //just adding the first instruction instead 
  //const instructionData2 = createInstructionData(transactionInstr.instructions[0]);
  

  const wit = await withInsertTransaction(
    instructions,
    //new PublicKey(daoPublicKey),
    programId,
    programVersion,
    governancePk,
    proposalPk,
    tokenOwnerRecordPk,
    governanceAuthority,
    0,
    0,
    0,
    instructionData,
    //[instructionData2],
    governanceAuthority,
  );
  
    //console.log("instructions: "+JSON.stringify(instructions));

  return {
    signers: signers,
    instructions: instructions
  }

}