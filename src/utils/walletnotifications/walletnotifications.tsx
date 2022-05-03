
import { SOFLARE_NOTIFICATIONS_API_KEY } from '../grapeTools/constants'; 

export async function unicastSolflareMessage (title:string,message:string,image:string,publicKey:string,actionUrl:string) {
    try{
        const body = {
        title: title,
        body: message,
        icon: 'https://raw.githubusercontent.com/Grape-Labs/grape-art/main/public/apple-touch-icon.png',
        image: image,
        publicKey: publicKey,
        platform: "all",
        topic: "general",
        actionUrl: actionUrl
        };
        const resp = await fetch('https://api.solana.cloud/v1/casts/unicast', {
            method: "POST",
            body: JSON.stringify(body),
            //headers: { "Content-Type": "application/json" },
            headers: { "Authorization": SOFLARE_NOTIFICATIONS_API_KEY },
        })
        const json = await resp.json();
        return json;
    }catch(e){
        return null;
    }
  } 