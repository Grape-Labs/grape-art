import { Connection } from '@solana/web3.js';
export const GRAPE_ART_TYPE = null; // set to a specific collection here otherwise it is universal for all marketplaces
export const TX_RPC_ENDPOINT = process.env.REACT_APP_API_TX_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
export const GRAPE_RPC_ENDPOINT = process.env.REACT_APP_API_GRAPE_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
export const QUICKNODE_RPC_ENDPOINT = process.env.REACT_APP_API_GRAPE_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
export const HELIUS_RPC_ENDPOINT = 'https://rpc.helius.xyz/?api-key='+process.env.REACT_APP_API_HELIUS;
export const HELLO_MOON_BEARER = process.env.REACT_APP_API_HELLOMOON_API_KEY;
export const HELLO_MOON_ENDPOINT = HELLO_MOON_BEARER ? `https://rpc.hellomoon.io/${HELLO_MOON_BEARER}` : `https://api.mainnet-beta.solana.com`;
export const ALCHEMY_RPC_ENDPOINT = process.env.REACT_APP_API_ALCHEMY_API_KEY || `https://api.mainnet-beta.solana.com`;
export const RPC_ENDPOINT = HELLO_MOON_ENDPOINT || 'https://api.mainnet-beta.solana.com';

/*
export const RPC_CONNECTION = new Connection(
    "https://rest-api.hellomoon.io/v0/rpc",
    {
      httpHeaders: {
        Authorization: `Bearer ${HELLO_MOON_BEARER}`, 
      },
    }
);
*/


export const RPC_CONNECTION = new Connection(
    RPC_ENDPOINT
);

export const GENSYSGO_RPC_ENDPOINT = process.env.REACT_APP_API_GENSYSGO_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
export const THEINDEX_RPC_ENDPOINT = process.env.REACT_APP_API_THEINDEX_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
export const HELIUS_API = process.env.REACT_APP_API_HELIUS || null;
export const SOFLARE_NOTIFICATIONS_API_KEY = process.env.REACT_APP_API_KEY_SOLFLARE_NOTIFICATIONS || '';
export const PROXY = process.env.REACT_APP_API_PROXY || '';
export const ME_KEYBASE = process.env.REACT_APP_API_ME_KEYBASE || null;
export const CROSSMINT_API = process.env.REACT_APP_API_ME_KEYBASE || null;
export const TWITTER_BEARER = process.env.REACT_APP_API_TWITTER_BEARER || null;
export const TWITTER_PROXY = process.env.REACT_APP_API_TWITTER_PROXY || null;
export const DRIVE_PROXY = process.env.REACT_APP_API_DRIVE_PROXY || '';
export const SHDW_PROXY = process.env.REACT_APP_API_SHDW_PROXY || null;
export const CLOUDFLARE_IPFS_CDN = 'https://cloudflare-ipfs.com';

export const GRAPE_PREVIEW = '/preview/';
export const GRAPE_PROFILE = '/profile/';
export const GRAPE_IDENTITY = '/identity/';
export const GRAPE_COLLECTION = '/collection/';

// alt routing
//export const GRAPE_PREVIEW = '/preview?pkey=';
//export const GRAPE_PROFILE = '/profile?pkey=';
//export const GRAPE_IDENTITY = '/identity?pkey=';

export const GRAPE_RPC_REFRESH = 25000;
export const GRAPE_TREASURY = 'GrapevviL94JZRiZwn2LjpWtmDacXU8QhAJvzpUMMFdL';

export const SQUADS_API = process.env.REACT_APP_API_SQUADS_URL || null;

export const MARKET_LOGO = "https://shdw-drive.genesysgo.net/5VhicqNTPgvJNVPHPp8PSH91YQ6KnVAeukW1K37GJEEV/grape_white_logo.svg";//STATIC_LOGO;

export const TOKEN_VERIFICATION_ADDRESS = '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA';
export const TOKEN_VERIFICATION_NAME = 'Grape';
export const TOKEN_VERIFICATION_AMOUNT = 0;
export const TOKEN_REPORT_AMOUNT = 10;
export const REPORT_ALERT_THRESHOLD = 1;
export const TOKEN_REALM_ID = 'By2sVGZXwfQq6rAiAM3rNPJ9iQfb5e2QhnF4YjJ4Bip';
export const TOKEN_REALM_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';

//export const GRAPE_COLLECTIONS_DATA = 'https://shdw-drive.genesysgo.net/6MM7GSocTFnAtwevaeyzj4eB1TSYKwx17cduKXExZAut/';
//export const GRAPE_COLLECTIONS_DATA = 'https://shdw-drive.genesysgo.net/6r4vHWSxg1Fq7jRDFSLPCSPAbRohUk9jhMSuzNyiw6KL/';
export const GRAPE_COLLECTIONS_DATA = 'https://shdw-drive.genesysgo.net/5pKmUSyh4VEpVhCCYon1kFf6fn5REtmk1rz4sGXyMrAZ/';

export const BOARDING_PROGRAM_CONFIG_DEVNET = '2ZaLmrM1WUTYBE2NdsJRVLS5egAvVZwYUSZNJkVeijYq';
export const BOARDING_PROGRAM_CONFIG = 'AuVdD2xbXitcQd7Q82uoi1BpHrBzRu3ECDCusvNTkb1w';

export const VERIFIED_DAO_ARRAY = [
    {
        address:'JAbgQLj9MoJ2Kvie8t8Y6z6as3Epf7rDp87Po3wFwrNK',
        solTreasury: '5UFKrfJkaWp45b8Kn82bXgokaKrzfVkoM1LBoHHk78wn',
        realmPK: 'DcR6g5EawaEoTRYcnuBjtD26VSVjWNoi1C1hKJWwvcup'
    },{
        address:'9fxVRxEqgMXRnNFePLVbbWTePs2pPQSSpbq6ZgZN4LBG',
        solTreasury: '5xZeVxC2UDnd64bgC3cZQoM38WwUi6T46SvTqUbShuAX',
        realmPK: 'DcR6g5EawaEoTRYcnuBjtD26VSVjWNoi1C1hKJWwvcup'
    }
]

export const FEATURED_DAO_ARRAY = [{
    address:'66pJhhESDjdeBBDdkKmxYYd7q6GUggYPWjxpMKNX39KV',
    daourl:'https://realms.today/dao/Ukraine',
    img:'../../public/solana4ukraine.png',
    title:'Solana for Ukraine',
    text:'NFT Artists come together in the DAO made exlusively to help out Ukraine, all proceeds of these NFT\'s will be donated to help the Ukrainian people'
}]