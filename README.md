# Getting Started 
Grape Art Interface

- This is the Grape Art Dex / Social Network

References:
- Metaplex Auction House (https://github.com/metaplex-foundation/metaplex)
- Realms/Governance (https://github.com/solana-labs/oyster/)


Wallet Adapter:
- Solana Wallet Adapter (https://github.com/solana-labs/wallet-adapter)

UI:
- Interface: MUI 5 https://mui.com

BUILD:
- yarn install
- yarn run build
- yarn start

CONSTANTS: 
- Following should be edited according to the DAO
-   /utils/grapeTools/constants.tsx
-   export const TOKEN_VERIFICATION_ADDRESS = '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA';
-   export const TOKEN_VERIFICATION_NAME = 'Grape';
-   export const TOKEN_VERIFICATION_AMOUNT = 1000;
-   export const TOKEN_REALM_ID = 'By2sVGZXwfQq6rAiAM3rNPJ9iQfb5e2QhnF4YjJ4Bip';
-   IMPORTANT:
-       * Given the volume of RPC calls it is important to use your own RPC provider which can handle them this too can be edited in the constants.tsx file
-       ** For your own instance consider building your own AH

Try it out:
- http://localhost:3000

Component Preview: (https://grape.art)

<img width="1219" alt="Screen Shot 2022-02-21 at 2 38 32 AM" src="https://user-images.githubusercontent.com/13381905/154965216-e03620b9-d783-4f7d-9b55-c4e21ec90879.png">
