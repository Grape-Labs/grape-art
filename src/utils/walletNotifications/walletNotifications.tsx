
import { SOFLARE_NOTIFICATIONS_API_KEY } from '../grapeTools/constants'; 
import { AUCTION_HOUSE_ADDRESS } from '../auctionHouse/helpers/constants';

export async function unicastGrapeSolflareMessage (title:string,message:string,image:string,publicKey:string,actionUrl:string, signedTransaction: any, auctionHouse: string) {
    try{
        if (SOFLARE_NOTIFICATIONS_API_KEY){
            //console.log("SENDING UNICAST MESSAGE")
            const body = {
                title: title,
                body: message,
                icon: image || 'https://raw.githubusercontent.com/Grape-Labs/api.grape.io/main/apple-touch-icon.png',
                image: image,
                publicKey: publicKey,
                platform: "all",
                topic: "general",
                actionUrl: actionUrl,
                ahAddress: auctionHouse || AUCTION_HOUSE_ADDRESS,
                signedTransaction: signedTransaction
            };
            const resp = await fetch('https://api.grapes.network/notifications/', {
                mode: 'no-cors',
                method: "POST",
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },
                //headers: { "Content-Type": "text/plain;charset=UTF-8" },
            })
            const json = await resp.json();
            return json;
        } else{
            return null;
        }
    }catch(e){
        console.log("ERR: "+e);
        return null;
    }
}