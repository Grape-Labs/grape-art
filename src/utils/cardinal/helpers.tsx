import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { programs, tryGetAccount } from "@cardinal/token-manager";
import { Blob, struct } from "@solana/buffer-layout";

export const isCardinalWrappedToken = async (
    connection: Connection,
    tokenAddress: string
  ) => {
    const [tokenManagerId] =
      await programs.tokenManager.pda.findTokenManagerAddress(
        new PublicKey(tokenAddress)
      );
    const tokenManagerData = await tryGetAccount(() =>
      programs.tokenManager.accounts.getTokenManager(connection, tokenManagerId)
    );
    if (tokenManagerData?.parsed && tokenManagerData?.parsed.transferAuthority) {
      try {
        programs.transferAuthority.accounts.getTransferAuthority(
          connection,
          tokenManagerData?.parsed.transferAuthority
        );
        return true;
      } catch (error) {
        console.log("Invalid transfer authority");
      }
    }
    return false;
};

export function assertOwnerInstruction({ account, owner }: any) {
    const keys = [{ pubkey: account, isSigner: false, isWritable: false }];
    return new TransactionInstruction({
      keys,
      data: encodeOwnerValidationInstruction({ account: owner }),
      programId: OWNER_VALIDATION_PROGRAM_ID,
    });
  }
  
  function encodeOwnerValidationInstruction(instruction: any) {
    const b = Buffer.alloc(OWNER_VALIDATION_LAYOUT.span);
    const span = OWNER_VALIDATION_LAYOUT.encode(instruction, b);
    return b.slice(0, span);
  }
  
  function publicKeyLayout(property: string) {
    return new PublicKeyLayout(property);
  }
  
  class PublicKeyLayout extends Blob {
    constructor(property: string) {
      super(32, property);
    }
  
    // @ts-ignore
    decode(b, offset) {
      return new PublicKey(super.decode(b, offset));
    }
  
    // @ts-ignore
    encode(src, b, offset) {
      return super.encode(src.toBuffer(), b, offset);
    }
  }
  
  const OWNER_VALIDATION_PROGRAM_ID = new PublicKey(
    "4MNPdKu9wFMvEeZBMt3Eipfs5ovVWTJb31pEXDJAAxX5"
  );
  
  const OWNER_VALIDATION_LAYOUT = struct([
    // @ts-ignore
    publicKeyLayout("account"),
  ]);