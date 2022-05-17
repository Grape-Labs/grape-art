
import { SOFLARE_NOTIFICATIONS_API_KEY } from '../grapeTools/constants'; 
import { AUCTION_HOUSE_ADDRESS } from '../auctionHouse/helpers/constants';
import { linkSync } from 'fs';

export async function unicastGrapeSolflareMessage (title:string,message:string,image:string,publicKey:string,actionUrl:string) {
    try{
        if (SOFLARE_NOTIFICATIONS_API_KEY){
            const body = {
                title: title,
                body: message,
                icon: 'https://raw.githubusercontent.com/Grape-Labs/grape-art/main/public/apple-touch-icon.png',
                image: image,
                publicKey: publicKey,
                platform: "all",
                topic: "general",
                actionUrl: actionUrl,
                ahAddress: AUCTION_HOUSE_ADDRESS,
            };
            const resp = await fetch('https://api.grapes.network/notifications', {
                mode: 'no-cors',
                method: "POST",
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },
                //headers: { "Authorization": SOFLARE_NOTIFICATIONS_API_KEY },
            })
            const json = await resp.json();
            return json;
        } else{
            return null;
        }
    }catch(e){
        return null;
    }
}

export async function unicastSolflareMessage (title:string,message:string,image:string,publicKey:string,actionUrl:string) {
    try{
        if (SOFLARE_NOTIFICATIONS_API_KEY){
            const body = {
                title: title,
                body: message,
                icon: 'https://raw.githubusercontent.com/Grape-Labs/grape-art/main/public/apple-touch-icon.png',
                image: image,
                publicKey: publicKey,
                platform: "all",
                topic: "general",
                actionUrl: actionUrl,
                ahAddress: AUCTION_HOUSE_ADDRESS,
            };
            const resp = await window.fetch('https://api.solana.cloud/v1/casts/unicast', {
                method: "POST",
                body: JSON.stringify(body),
                //headers: { "Content-Type": "application/json" },
                headers: { "Authorization": SOFLARE_NOTIFICATIONS_API_KEY },
            })
            const json = await resp.json();
            return json;
        } else{
            return null;
        }
    }catch(e){
        return null;
    }
} 