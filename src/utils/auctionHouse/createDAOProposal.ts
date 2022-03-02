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
} from '@solana/spl-governance';

import { 
  TOKEN_REALM_PROGRAM_ID,
} from '../grapeTools/constants';

  export async function createDAOProposal(offerAmount: number, mint: string, walletPublicKey: string, mintOwner: any, weightedScore: any, daoPublicKey: string, connection: any, transactionInstr: InstructionsAndSignersSet, sendTransaction: any): Promise<InstructionsAndSignersSet> {
    const programVersion = await getGovernanceProgramVersion(
        connection,
        new PublicKey(daoPublicKey),
        ""
      );

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

    const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
      programId,
      realmPk,
      governingTokenMint,
      governancePk
    );
    const proposalPk = await withCreateProposal(
      instructions,
      new PublicKey(daoPublicKey), 
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
      new PublicKey(walletPublicKey),
  );
  
  const instructionData: InstructionData[]=[]; //createInstructionData([transactionInstr.instructions]);
  
  for (var instruction of transactionInstr.instructions){
    instructionData.push(createInstructionData(instruction));
  }

  //const instructionData2 = createInstructionData(instruction);
  //instructionData.push(instructionData2);

  console.log("instructionData: "+JSON.stringify(instructionData));
  console.log("wallet: "+walletPublicKey);

  const wit = await withInsertTransaction(
    instructions,
    new PublicKey(daoPublicKey),
    programVersion,
    governancePk,
    proposalPk,
    tokenOwnerRecordPk,
    governanceAuthority,
    0,
    0,
    0,
    instructionData,
    new PublicKey(walletPublicKey),
  );
  
  console.log("instructions: "+JSON.stringify(instructions));

  return {
    signers: signers,
    instructions: instructions
  }

}