import AsyncStorage from "@react-native-async-storage/async-storage";
import { ethers } from "ethers";
import { useEffect, useState, useCallback } from "react";

export function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;

  return h.toString();
}

export enum CachePrefix {
  Message = "message_",
  DecryptedMessage = "decrypted_message_",
  Media = "media_",
  DecryptedMedia = "decrypted_media_",
  MessageCount = "message_count_",
  RetrievedThread = "retrieved_thread_",
  LastMsgCount = "last_msg_count_",
  ProfilePicture = "profile_pic_",
  Archive = "archive_",
  CentralState = "central_state_",
  Sha256 = "sha256_",
  ProgramAddress = "program_address_",
  IpfsHash = "ipfs_hash_",
}

export class asyncCache {
  static async get<T>(key: string): Promise<T | null> {
    const cached = await AsyncStorage.getItem(hashCode(key));
    if (!cached) {
      return null;
    }
    return JSON.parse(cached);
  }
  static async set<T>(key: string, value: T) {
    const stringified = JSON.stringify(value);
    await AsyncStorage.setItem(hashCode(key), stringified);
  }

  static async sha256(data: ethers.utils.BytesLike): Promise<string> {
    const cached = await asyncCache.get<string>(
      CachePrefix.Sha256 + data.toString()
    );
    if (cached) {
      return cached;
    }
    const result: string = await new Promise((resolve) =>
      resolve(ethers.utils.sha256(data).slice(2))
    );
    await asyncCache.set(CachePrefix.Sha256 + data.toString(), result);
    return result;
  }
}

export function useGetAsyncCache<T>(key: string, refresh?: boolean): T | null {
  const [cached, setCached] = useState<T | null>(null);

  const fn = useCallback(async () => {
    return await asyncCache.get<T>(key);
  }, [key]);

  useEffect(() => {
    let mounted = true;
    fn().then((c) => {
      if (!mounted) return null;
      setCached(c);
    });

    return () => {
      mounted = false;
    };
  }, [refresh, key]);
  return cached;
}