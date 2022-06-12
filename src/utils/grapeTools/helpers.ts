import { BN, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
    GRAPE_RPC_ENDPOINT,
} from './constants';

import {
    AUCTION_HOUSE_PROGRAM_ID,
    AUCTION_HOUSE_ADDRESS,
    TOKEN_METADATA_PROGRAM_ID,
} from '../auctionHouse/helpers/constants';

import { getMetadata } from '../auctionHouse/helpers/accounts';

import { AuctionHouseProgram  } from '@metaplex-foundation/mpl-auction-house';

export async function getMintFromMetadataWithVerifiedCollection(updateAuthority:string, metadata:string) {
    
    // add a helper function to get Metadata from Grape Verified Collection

    // returns the mint address

}

export async function getMintFromMetadata(updateAuthority:string, metaData:web3.PublicKey): Promise<string>{
  let value = ' ';
  let mintPk: any;
  const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
  const metaSignature = await ggoconnection.getConfirmedSignaturesForAddress2(metaData, {limit:1});
  /*for (var i = 0; i < metaSignature.length; i++) {
    console.log('METASIGNATURE:', metaSignature[i].signature);
    mintPk = (await ggoconnection.getParsedTransaction(metaSignature[i].signature, 'confirmed'));
    //console.log('all mintPk:' +JSON.stringify(mintPk));
    console.log('MINTPK:',mintPk.meta.preTokenBalances[0]?.mint.toString());
  }*/
  mintPk = (await ggoconnection.getParsedTransaction(metaSignature[0].signature, 'confirmed'));
  //console.log('MINTPK:',mintPk.meta.preTokenBalances[0]?.mint.toString());
  let mintExists = mintPk.meta.preTokenBalances[0]?.mint; 
  //console.log('mintExists:', mintExists);
  if (mintExists) {
      value = mintPk.meta.preTokenBalances[0]?.mint.toString();
  }
  return (value); 
}

export async function getMintFromVerifiedMetadata(metadata:string, collectionMintList: any){
    if (collectionMintList){
        for (var item of collectionMintList){
            if (item.metadata === metadata){
                return item;
            }
        }
    }
    return null;
}

export async function getReceiptsFromAuctionHouse(auctionHouse_filter: string, wallet_filter: string, mint_filter: string, bid_receipt_filter:string) {
    // if wallet is set we should also filter by wallet address

    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);    
    const collectionAuctionHouse = auctionHouse_filter || AUCTION_HOUSE_ADDRESS;
        {    
            const PrintListingReceiptSize = 236;
            const PrintBidReceiptSize = 269;
            const PrintPurchaseReceiptSize = 193;

            const ReceiptAccountSizes = [
                PrintListingReceiptSize,
                PrintBidReceiptSize,
                PrintPurchaseReceiptSize,
            ] as const;
            
            let accounts: any;
            //const AH_PK = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
            let mintMetadata: any;
            let retrieveMint: any;
            if (mint_filter!=null){
              mintMetadata = await getMetadata(new PublicKey(mint_filter));
              //console.log('metadata: ', mintMetadata.toString());
              //let testMint = new PublicKey(mint_filter);
              //retrieveMint = await getMintFromMetadata(null, new PublicKey(mintMetadata));
              //console.log('retrieveMint: ', retrieveMint.toString());
            }
            const ReceiptAccounts = await (Promise.all(ReceiptAccountSizes.map(async size => {
                if (wallet_filter != null && mintMetadata === null){
                  console.log('execute with wallet_filter');
                  accounts = await ggoconnection.getProgramAccounts(
                    AUCTION_HOUSE_PROGRAM_ID,
                  {
                    commitment: 'confirmed',
                    filters: [
                      {
                        dataSize: size,
                      },
                      {
                        memcmp: {
                            offset: 40,
                            bytes: wallet_filter,
                        },
                      },
                      {
                        memcmp: {
                            offset: 72,
                            bytes: collectionAuctionHouse,
                        },
                      },
                    ],
                  }
                );
                } else if (wallet_filter != null && mintMetadata != null) {
                  console.log('execute with all filters');
                  accounts = await ggoconnection.getProgramAccounts(
                    AUCTION_HOUSE_PROGRAM_ID,
                  {
                    commitment: 'confirmed',
                    filters: [
                      {
                        dataSize: size,
                      },
                      {
                        memcmp: {
                            offset: 40,
                            bytes: wallet_filter,
                        },
                      },
                      {
                        memcmp: {
                            offset: 72,
                            bytes: collectionAuctionHouse,
                        },
                      },
                      {
                        memcmp: {
                            offset: 136,
                            bytes: mintMetadata,
                        },
                      },
                    ],
                  }
                );
              } else if (wallet_filter === null && mintMetadata != null) {
                console.log('execute with mint_filter');
                accounts = await ggoconnection.getProgramAccounts(
                  AUCTION_HOUSE_PROGRAM_ID,
                {
                  commitment: 'confirmed',
                  filters: [
                    {
                      dataSize: size,
                    },
                    {
                      memcmp: {
                          offset: 72,
                          bytes: collectionAuctionHouse,
                      },
                    },
                    {
                      memcmp: {
                          offset: 136,
                          bytes: mintMetadata,
                      },
                    },
                  ],
                }
              );

              } else {
                  console.log('execute default only AH');
                  accounts = await ggoconnection.getProgramAccounts(
                    AUCTION_HOUSE_PROGRAM_ID,
                  {
                    commitment: 'confirmed',
                    filters: [
                      {
                        dataSize: size,
                      },
                      {
                        memcmp: {
                            offset: 72,
                            bytes: collectionAuctionHouse,
                        },
                      },
                    ],
                  }
                );
                }
                const parsedAccounts = accounts.map(async account => {
                  switch (size) {
                    case PrintListingReceiptSize:
                      const [
                        ListingReceipt,
                      ] = AuctionHouseProgram.accounts.ListingReceipt.fromAccountInfo(
                        account.account
                      );
                       
                      return {
                        ...ListingReceipt,
                        receipt_type: ListingReceipt.canceledAt
                          ? 'cancel_listing_receipt'
                          : 'listing_receipt',
                      }; 
                      break;
                    case PrintBidReceiptSize:
                      const [
                        BidReceipt,
                      ] = AuctionHouseProgram.accounts.BidReceipt.fromAccountInfo(
                        account.account
                      );
                      
                      return {
                        ...BidReceipt,
                        receipt_type: 'bid_receipt',
                      };
                      break;
                    case PrintPurchaseReceiptSize:
                      const [
                        PurchaseReceipt,
                      ] = AuctionHouseProgram.accounts.PurchaseReceipt.fromAccountInfo(
                        account.account
                      );
                      
                      return {
                        ...PurchaseReceipt,
                        receipt_type: 'purchase_receipt',
                      } 
                      break;
                    default:
                      return undefined;
                      break;
                  }
                });
                
                return await Promise.all(parsedAccounts);
              })));
              const receipts = (await Promise.all(ReceiptAccounts))
                .flat()
                .map(receipt => ({
                    ...receipt,
                    tokenSize: new BN(receipt.tokenSize).toNumber(),
                    price: new BN(receipt.price).toNumber() / LAMPORTS_PER_SOL,
                    createdAt: new BN(receipt.createdAt).toNumber(),
                    //mintpk: getMintFromMetadata(receipt.metadata),
                    //mint: getMintFromReceipt(receipt.tradeState.toBase58()),
                    //cancelledAt: receipt?.canceledAt,
                }));
                /*let mintResults: any[] = [];
                    for (var receiptMetadata of receipts.flat()){
                        let mintPk = await getMintFromMetadata(null, receiptMetadata.metadata);
                        let recMetadata = receiptMetadata.metadata;
                        if (mintPk){
                            mintResults.push({metadata: recMetadata, mint: mintPk});
                        }
                    }*/
            return (receipts);
            
        }
}
