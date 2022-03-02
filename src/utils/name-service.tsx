import { PublicKey, Connection } from "@solana/web3.js";
//import { useAsync } from "./utils.native";
import { asyncCache } from "./cache";
import {
  findOwnedNameAccountsForUser,
  performReverseLookupBatch,
} from "./web3/name-auctioning";
import { getHandleAndRegistryKey } from "./web3/name-service";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
//import { Profile } from "./web3/jabber";

export const SOL_TLD_AUTHORITY = new PublicKey(
  "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx"
);

export const findDisplayName = async (
  connection: Connection,
  receiver: string
) => {
  let allNames: string[] = [];
  let favoriteDisplayName: string | undefined = undefined;

  try {
      /*
    try {
      const profile = await Profile.retrieve(
        connection,
        new PublicKey(receiver)
      );
      favoriteDisplayName = profile.name.split(":fdn:")[1];
      if (favoriteDisplayName) {
        allNames.push(favoriteDisplayName);
      }
    } catch (err) {
      console.log(err);
    }

    const knownReceiver = await asyncCache.get<string[]>(receiver);
    if (knownReceiver && knownReceiver?.length > 0) {
      if (favoriteDisplayName && favoriteDisplayName !== knownReceiver[0]) {
        await asyncCache.set(receiver, [
          favoriteDisplayName,
          ...knownReceiver?.filter((e) => e !== favoriteDisplayName),
        ]);
        return [
          favoriteDisplayName,
          ...knownReceiver?.filter((e) => e !== favoriteDisplayName),
        ];
      }
      return knownReceiver;
    }
    */

    const domainsAddresses = await findOwnedNameAccountsForUser(
      connection,
      new PublicKey(receiver)
    );
    domainsAddresses.sort((a, b) => a.toBase58().localeCompare(b.toBase58()));
    if (domainsAddresses.length === 0) {
      return [receiver];
    }

    const reverse = (
      await performReverseLookupBatch(connection, domainsAddresses)
    )
      .filter((e) => !!e)
      .map((e) => e + ".sol") as string[];

    allNames = [...allNames, ...reverse];

    if (allNames.length > 0) {
      await asyncCache.set(receiver, allNames);
      return allNames;
    }

    try {
      const [display] = await getHandleAndRegistryKey(
        connection,
        new PublicKey(receiver)
      );
      return ["@" + display];
    } catch (err) {
      console.log(err);
    }

    return [receiver];
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export const useDisplayName = (contact: string | undefined) => {
    const { connection } = useConnection();

  const fn = async (): Promise<string[] | undefined> => {
    if (!contact) return;
    return await findDisplayName(connection, contact);
  };

  return false;
  //return useAsync(fn, false);
};

export const ownerHasDomain = async (
  connection: Connection,
  owner: PublicKey
) => {
  try {
    const domainsAddresses = await findOwnedNameAccountsForUser(
      connection,
      owner
    );
    return domainsAddresses.length != 0;
  } catch (err) {
    console.log(err);
  }
  try {
    await getHandleAndRegistryKey(connection, owner);
    return true;
  } catch (err) {
    console.log(err);
  }

  return false;
};

export const useUserHasDomainOrTwitter = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const fn = async () => {
    let hasDomain = false;
    let hasTwitter = false;
    if (!publicKey) return;
    try {
      const domainsAddresses = await findOwnedNameAccountsForUser(
        connection,
        publicKey
      );
      hasDomain = domainsAddresses.length !== 0;
    } catch (err) {
      console.log(err);
    }

    try {
      await getHandleAndRegistryKey(connection, publicKey);
      hasTwitter = true;
    } catch (err) {
      console.log(err);
    }

    return { hasTwitter: hasTwitter, hasDomain: hasDomain };
  };
  return false;
  //return useAsync(fn, false);
};
