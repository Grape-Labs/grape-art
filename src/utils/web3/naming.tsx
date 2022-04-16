import { Connection, PublicKey } from "@solana/web3.js";
import { NAME_PROGRAM_ID, NameRegistryState } from "@bonfida/spl-name-service";
import { getHashedName, getNameAccountKey } from "./name-service";
import BN from "bn.js";

export const PROGRAM_ID = new PublicKey(
  "jCebN34bUfdeUYJT13J1yG16XWQpt5PDx6Mse9GUqhR"
);

export const centralState = new PublicKey(
  "33m47vH6Eav6jr5Ry86XjhRft2jRBLDnDgPSHoquXi2Z"
);

export async function findOwnedNameAccountsForUser(
  connection: Connection,
  userAccount: PublicKey
): Promise<PublicKey[]> {
  const filters = [
    {
      memcmp: {
        offset: 32,
        bytes: userAccount.toBase58(),
      },
    },
  ];
  const accounts = await connection.getProgramAccounts(NAME_PROGRAM_ID, {
    filters: filters,
  });
  return accounts.map((a) => a.pubkey);
}

export async function performReverseLookup(
  connection: Connection,
  nameAccount: PublicKey
): Promise<string> {
  const hashedReverseLookup = await getHashedName(nameAccount.toBase58());
  const reverseLookupAccount = await getNameAccountKey(
    hashedReverseLookup,
    centralState
  );

  const name = await NameRegistryState.retrieve(
    connection,
    reverseLookupAccount
  );
  if (!name.registry.data) {
    throw new Error("Could not retrieve name data");
  }
  const nameLength = new BN(name.registry.data.slice(0, 4), "le").toNumber();
  return name.registry.data.slice(4, 4 + nameLength).toString();
}

export async function performReverseLookupBatch(
  connection: Connection,
  nameAccounts: PublicKey[]
): Promise<(string | undefined)[]> {
  const [centralState] = await PublicKey.findProgramAddress(
    [PROGRAM_ID.toBuffer()],
    PROGRAM_ID
  );
  const reverseLookupAccounts: PublicKey[] = [];
  for (const nameAccount of nameAccounts) {
    const hashedReverseLookup = await getHashedName(nameAccount.toBase58());
    const reverseLookupAccount = await getNameAccountKey(
      hashedReverseLookup,
      centralState
    );
    reverseLookupAccounts.push(reverseLookupAccount);
  }

  const names = await NameRegistryState.retrieveBatch(
    connection,
    reverseLookupAccounts
  );

  return names.map((name) => {
    if (name === undefined || name.data === undefined) {
      return undefined;
    }
    const nameLength = new BN(name.data.slice(0, 4), "le").toNumber();
    return name.data.slice(4, 4 + nameLength).toString();
  });
}