import { RPC_CONNECTION } from './constants';
import { PublicKey, Connection } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getAssociatedAccountBalance, SplTokenMetadata, getMintInfo, getTokenAccount } from "@strata-foundation/spl-utils";

import { Provider, AnchorProvider } from "@project-serum/anchor";

export async function getBackedTokenMetadata(tokenMint:string, wallet: any) {
    //console.log("checking: "+tokenMint);
    const connection = RPC_CONNECTION;
    const provider = new AnchorProvider(connection, wallet, {});

    const tokenMetadataSdk = await SplTokenMetadata.init(provider);
    const tokenBondingSdk = await SplTokenBonding.init(provider);
    const tokenCollectiveSdk = await SplTokenCollective.init(provider);

    //console.log("getting minttoken refkey")
    const mintTokenRef = (await SplTokenCollective.mintTokenRefKey(new PublicKey(tokenMint)))[0];
    
    if (mintTokenRef){
        const tokenRef = await tokenCollectiveSdk.getTokenRef(mintTokenRef);

        //console.log("tokenRef: "+JSON.stringify(tokenRef));
        if (tokenRef && tokenRef?.tokenMetadata){
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
            }
        }
    }
    
    return null;
    
}