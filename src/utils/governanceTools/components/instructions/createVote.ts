import {
    PublicKey,
    ConfirmedSignatureInfo,
    Connection,
    LAMPORTS_PER_SOL,
    Keypair,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
  
//  import { SPL_PUBLIC_KEY, RPC_CONNECTION } from "../constants/Solana";
import { GRAPE_RPC_ENDPOINT, THEINDEX_RPC_ENDPOINT } from '../../../../utils/grapeTools/constants';  

  import {
    withCastVote,
    SYSTEM_PROGRAM_ID,
    Vote,
    getGovernanceProgramVersion,
    GOVERNANCE_CHAT_PROGRAM_ID,
  } from "@solana/spl-governance";
  // plugin stuff
  import { Provider, Wallet } from "@project-serum/anchor";
  import { VsrClient } from "@blockworks-foundation/voter-stake-registry-client/index";
  import {
    getRegistrarPDA,
    getVoterPDA,
    getVoterWeightPDA,
  } from "./account";
  // end plugin stuff
  
  const connection = new Connection(GRAPE_RPC_ENDPOINT, "confirmed");
  
  export const createCastVoteTransaction = async (
    selectedRealm: Realm,
    walletPublicKey: string,
    transactionData: any,
    membersMap: any,
    selectedDelegate: string,
    isCommunityVote: boolean
  ) => {
    const { proposal, action } = transactionData;
    const walletPubkey = new PublicKey(walletPublicKey);
    let tokenOwnerRecord;
    const governanceAuthority = walletPubkey;
  
    console.log('membersMap: '+JSON.stringify(membersMap))

    if (membersMap[walletPublicKey] && !selectedDelegate) {
      tokenOwnerRecord = membersMap[walletPublicKey];
    } else {
      tokenOwnerRecord = membersMap[selectedDelegate];
    }
  
    const tokenRecordPublicKey = isCommunityVote
      ? tokenOwnerRecord?.communityPublicKey
      : tokenOwnerRecord?.councilPublicKey;
  
    const payer = walletPubkey;
    const instructions: TransactionInstruction[] = [];
    let programVersion;
  
    // for whatever reason, metaplex dao fails this and needs to be harcoded
    if (
      selectedRealm.realmId === "DA5G7QQbFioZ6K33wQcH8fVdgFcnaDjLD7DLQkapZg5X"
    ) {
      programVersion = 2;
    } else {
      programVersion = await getGovernanceProgramVersion(
        connection,
        new PublicKey(selectedRealm.governanceId)
      );
    }
  
    // PLUGIN STUFF
    // let votePlugin;
    // // TODO: update this to handle any vsr plugin, rn only runs for mango dao
    // if (
    //   selectedRealm?.realmId ===
    //   "DPiH3H3c7t47BMxqTxLsuPQpEC6Kne8GA9VXbxpnZxFE"
    // ) {
    //   votePlugin = await getVotingPlugin(
    //     selectedRealm,
    //     walletKeypair,
    //     new PublicKey(tokenOwnerRecord.walletId),
    //     instructions
    //   );
    // }
    // END PLUGIN STUFF
    
    await withCastVote(
      instructions,
      new PublicKey(selectedRealm.governanceId), //  realm/governance PublicKey
      programVersion, // version object, version of realm
      new PublicKey(selectedRealm.pubKey), // realms publicKey
      new PublicKey(proposal.governanceId), // proposal governance Public key
      new PublicKey(proposal.proposalId), // proposal public key
      new PublicKey(proposal.tokenOwnerRecord), // proposal token owner record, publicKey
      new PublicKey(tokenRecordPublicKey), // publicKey of tokenOwnerRecord
      governanceAuthority, // wallet publicKey
      new PublicKey(proposal.governingTokenMint), // proposal governanceMint publicKey
      Vote.fromYesNoVote(action), //  *Vote* class? 1 = no, 0 = yes
      payer
      // TODO: handle plugin stuff here.
      // votePlugin?.voterWeightPk,
      // votePlugin?.maxVoterWeightRecord
    );
  
    const recentBlock = await connection.getLatestBlockhash();
  
    const transaction = new Transaction({ feePayer: walletPubkey });
    transaction.recentBlockhash = recentBlock.blockhash;
    transaction.add(...instructions);
  
    return transaction;
  };
  
  const getVotingPlugin = async (
    selectedRealm: any,
    walletKeypair: any,
    walletPubkey: any,
    instructions: any
  ) => {
    const options = Provider.defaultOptions();//AnchorProvider.defaultOptions();
    const provider = new Provider(
      connection,
      walletKeypair as unknown as Wallet,
      options
    );
    const client = await VsrClient.connect(provider, false);
    const clientProgramId = client!.program.programId;
    const { registrar } = await getRegistrarPDA(
      new PublicKey(selectedRealm!.realmId),
      new PublicKey(selectedRealm!.communityMint),
      clientProgramId
    );
    const { voter } = await getVoterPDA(registrar, walletPubkey, clientProgramId);
    const { voterWeightPk } = await getVoterWeightPDA(
      registrar,
      walletPubkey,
      clientProgramId
    );
  
    const updateVoterWeightRecordIx = await client!.program.methods
      .updateVoterWeightRecord()
      .accounts({
        registrar,
        voter,
        voterWeightRecord: voterWeightPk,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .instruction();
  
    return { voterWeightPk, maxVoterWeightRecord: undefined };
  };