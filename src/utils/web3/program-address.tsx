/** @solana/web3.js is not compatible with react-native */
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import BN from "bn.js";
import { asyncCache } from "../cache";
import { ethers } from "ethers";

export const MAX_SEED_LENGTH = 32;

export const toBuffer = (arr: Buffer | Uint8Array | Array<number>): Buffer => {
  //try{
    if (Buffer.isBuffer(arr)) {
      return arr;
    } else if (arr instanceof Uint8Array) {
      return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    } else {
      return Buffer.from(arr);
    }
  //}catch(e){
  //  return Buffer.from(arr);
  //}
};

export async function createProgramAddress(
  seeds: Array<Buffer | Uint8Array>,
  programId: PublicKey
): Promise<PublicKey> {
  let buffer = Buffer.alloc(0);
  seeds.forEach(function (seed) {
    if (seed.length > MAX_SEED_LENGTH) {
      throw new TypeError(`Max seed length exceeded`);
    }
    buffer = Buffer.concat([buffer, toBuffer(seed)]);
  });
  buffer = Buffer.concat([
    buffer,
    programId.toBuffer(),
    Buffer.from("ProgramDerivedAddress"),
  ]);
  const hash: string = await new Promise((resolve) =>
    resolve(ethers.utils.sha256(new Uint8Array(buffer)).slice(2))
  );
  const publicKeyBytes = new BN(hash, 16).toArray(undefined, 32);

  if (is_on_curve(publicKeyBytes)) {
    throw new Error(`Invalid seeds, address must fall off the curve`);
  }
  const key = new PublicKey(publicKeyBytes);
  return key;
}

export async function findProgramAddress(
  seeds: Array<Buffer | Uint8Array>,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  const cached = await asyncCache.get<{ address: string; nonce: number }>(
    seeds.toString()
  );
  if (cached) {
    return [new PublicKey(cached.address), cached.nonce];
  }
  let nonce = 255;
  let address;
  while (nonce != 0) {
    try {
      const seedsWithNonce = seeds.concat(Buffer.from([nonce]));
      address = await createProgramAddress(seedsWithNonce, programId);
      await asyncCache.set(seeds.toString(), {
        address: address.toBase58(),
        nonce: nonce,
      });
    } catch (err) {
      if (err instanceof TypeError) {
        throw err;
      }
      nonce--;
      continue;
    }
    return [address, nonce];
  }
  throw new Error(`Unable to find a viable program address nonce`);
}

/* eslint-disable */
//  @ts-ignore
let naclLowLevel = nacl.lowlevel;

// Check that a pubkey is on the curve.
// This function and its dependents were sourced from:
// https://github.com/dchest/tweetnacl-js/blob/f1ec050ceae0861f34280e62498b1d3ed9c350c6/nacl.js#L792
function is_on_curve(p: any) {
  var r = [
    naclLowLevel.gf(),
    naclLowLevel.gf(),
    naclLowLevel.gf(),
    naclLowLevel.gf(),
  ];

  var t = naclLowLevel.gf(),
    chk = naclLowLevel.gf(),
    num = naclLowLevel.gf(),
    den = naclLowLevel.gf(),
    den2 = naclLowLevel.gf(),
    den4 = naclLowLevel.gf(),
    den6 = naclLowLevel.gf();

  naclLowLevel.set25519(r[2], gf1);
  naclLowLevel.unpack25519(r[1], p);
  naclLowLevel.S(num, r[1]);
  naclLowLevel.M(den, num, naclLowLevel.D);
  naclLowLevel.Z(num, num, r[2]);
  naclLowLevel.A(den, r[2], den);

  naclLowLevel.S(den2, den);
  naclLowLevel.S(den4, den2);
  naclLowLevel.M(den6, den4, den2);
  naclLowLevel.M(t, den6, num);
  naclLowLevel.M(t, t, den);

  naclLowLevel.pow2523(t, t);
  naclLowLevel.M(t, t, num);
  naclLowLevel.M(t, t, den);
  naclLowLevel.M(t, t, den);
  naclLowLevel.M(r[0], t, den);

  naclLowLevel.S(chk, r[0]);
  naclLowLevel.M(chk, chk, den);
  if (neq25519(chk, num)) naclLowLevel.M(r[0], r[0], I);

  naclLowLevel.S(chk, r[0]);
  naclLowLevel.M(chk, chk, den);
  if (neq25519(chk, num)) return 0;
  return 1;
}
let gf1 = naclLowLevel.gf([1]);
let I = naclLowLevel.gf([
  0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7,
  0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83,
]);
function neq25519(a: any, b: any) {
  var c = new Uint8Array(32),
    d = new Uint8Array(32);
  naclLowLevel.pack25519(c, a);
  naclLowLevel.pack25519(d, b);
  return naclLowLevel.crypto_verify_32(c, 0, d, 0);
}

/* eslint-enable */