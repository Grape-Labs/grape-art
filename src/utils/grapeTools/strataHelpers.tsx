import { GRAPE_RPC_ENDPOINT } from './constants';
import { PublicKey, Connection } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getAssociatedAccountBalance, SplTokenMetadata, getMintInfo, getTokenAccount } from "@strata-foundation/spl-utils";

import { Provider, AnchorProvider } from "@project-serum/anchor";

export async function getBackedTokenMetadata(tokenMint:string, wallet: any) {
    const connection = new Connection(GRAPE_RPC_ENDPOINT);
    const provider = new AnchorProvider(connection, wallet, {});

    const tokenMetadataSdk = await SplTokenMetadata.init(provider);
    const tokenBondingSdk = await SplTokenBonding.init(provider);
    const tokenCollectiveSdk = await SplTokenCollective.init(provider);

    //console.log("getting minttoken refkey")
    const mintTokenRef = (await SplTokenCollective.mintTokenRefKey(new PublicKey(tokenMint)))[0];
    //console.log("mintTokenRef: "+JSON.stringify(mintTokenRef));

    const tokenRef = await tokenCollectiveSdk.getTokenRef(mintTokenRef);

    //console.log("tokenRef: "+JSON.stringify(tokenRef));

    const meta = await tokenMetadataSdk.getTokenMetadata(tokenRef.tokenMetadata)

    const tokenBondingKey = (await SplTokenBonding.tokenBondingKey(new PublicKey(tokenMint)))[0];
    //console.log("getting bonding")
    const tbonding = await tokenBondingSdk.getTokenBonding(tokenBondingKey)
    //console.log("gbonding: "+JSON.stringify(tbonding));
    
    if (meta){
        const backedToken = {
            address: tokenMint,
            decimals: meta.mint.decimals,
            name: meta.metadata.data.name,
            symbol: meta.metadata.data.symbol,
            logoURI: meta.data.image,
            parentToken: tbonding.baseMint.toBase58()

        }
        return backedToken;
    } else{
        return null;
    }
}