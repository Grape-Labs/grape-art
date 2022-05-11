# Grape Art | Getting Started 

- This is the Grape Art Dex | A Social. Stateless. Marketplace. powered by Solana!

References:
- Metaplex Auction House (https://github.com/metaplex-foundation/metaplex)
- Realms/Governance (https://github.com/solana-labs/oyster/)

Wallet Adapter:
- Solana Wallet Adapter (https://github.com/solana-labs/wallet-adapter)

UI:
- Interface: MUI 5 https://mui.com

BUILD/START:
- `yarn install`
- `yarn start`

CONSTANTS: 
- Following should be edited according to the DAO
-   `/utils/grapeTools/constants.tsx`
-   `export const TOKEN_VERIFICATION_ADDRESS = '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA';` // Token to verify
-   `export const TOKEN_VERIFICATION_NAME = 'Grape';`
-   `export const TOKEN_VERIFICATION_AMOUNT = 1000;` // This is to verify the amount needed to make an offer
-   `export const TOKEN_REALM_ID = 'By2sVGZXwfQq6rAiAM3rNPJ9iQfb5e2QhnF4YjJ4Bip';` // governance/realms publicKey to capture if the wallet has holdings also on realms and account for that in the verification
-   IMPORTANT:
-   * connection endpoint can be edited in the `utils/grapeTools/constants.tsx`
-   * Default AH is set with 0% fees


HELP SETTING UP:
-   Have a DAO and want to run an instance of grape.art? Reach out to the Grape Team at https://discord.gg/greatape

TRY IT OUT NOW:
- https://grape.art

<img width="1309" alt="Screen Shot 2022-05-10 at 1 08 28 PM" src="https://user-images.githubusercontent.com/13381905/167605066-b4f169d4-8a35-48d7-ac96-5abb6d894581.png">


