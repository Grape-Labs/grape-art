import { Buffer } from "buffer";
import {
  HASH_PREFIX,
  NAME_PROGRAM_ID,
  TWITTER_ROOT_PARENT_REGISTRY_KEY,
  TWITTER_VERIFICATION_AUTHORITY,
  ReverseTwitterRegistryState,
} from "@bonfida/spl-name-service";
import { ethers } from "ethers";
import { PublicKey, Connection } from "@solana/web3.js";
import { findProgramAddress } from "./program-address";
import { asyncCache, CachePrefix } from "../cache";

export async function getHashedName(name: string) {
  const input = HASH_PREFIX + name;
  const cached = await asyncCache.get<string>(CachePrefix + name);
  if (!cached) {
    const buffer = ethers.utils.sha256(Buffer.from(input)).slice(2);
    await asyncCache.set(CachePrefix + name, buffer);
    return Buffer.from(buffer, "hex");
  }
  return Buffer.from(cached, "hex");
}

export async function getNameAccountKey(
  hashed_name: Buffer,
  nameClass?: PublicKey,
  nameParent?: PublicKey
): Promise<PublicKey> {
  const seeds = [hashed_name];
  if (nameClass) {
    seeds.push(nameClass.toBuffer());
  } else {
    seeds.push(Buffer.alloc(32));
  }
  if (nameParent) {
    seeds.push(nameParent.toBuffer());
  } else {
    seeds.push(Buffer.alloc(32));
  }
  const [nameAccountKey] = await findProgramAddress(seeds, NAME_PROGRAM_ID);
  return nameAccountKey;
}
export async function getHandleAndRegistryKey(
  connection: Connection,
  verifiedPubkey: PublicKey
): Promise<[string, PublicKey]> {
  const hashedVerifiedPubkey = await getHashedName(verifiedPubkey.toString());
  const reverseRegistryKey = await getNameAccountKey(
    hashedVerifiedPubkey,
    TWITTER_VERIFICATION_AUTHORITY,
    TWITTER_ROOT_PARENT_REGISTRY_KEY
  );

  const reverseRegistryState = await ReverseTwitterRegistryState.retrieve(
    connection,
    reverseRegistryKey
  );
  return [
    reverseRegistryState.twitterHandle,
    new PublicKey(reverseRegistryState.twitterRegistryKey),
  ];
}

export async function getDNSRecordAddress(
  nameAccount: PublicKey,
  type: string
) {
  const hashedName = await getHashedName("\0".concat(type));
  const recordAccount = await getNameAccountKey(
    hashedName,
    undefined,
    nameAccount
  );
  return recordAccount;
}