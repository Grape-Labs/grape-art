import { BN, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
    GRAPE_RPC_ENDPOINT,
} from './constants';

import {
    AUCTION_HOUSE_PROGRAM_ID,
    AUCTION_HOUSE_ADDRESS,
} from '../auctionHouse/helpers/constants';

import { AuctionHouseProgram  } from '@metaplex-foundation/mpl-auction-house';

export async function getMintFromMetadataWithVerifiedCollection(updateAuthority:string, metadata:string) {
    
    // add a helper function to get Metadata from Grape Verified Collection

    // returns the mint address

}

export async function getMintFromMetadata(updateAuthority:string, metadata:string) {
    
    // add a helper function to get Metadata

    // returns the mint address
    
}

export async function getReceiptsFromAuctionHouse(auctionHouse: PublicKey) {
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);    
    const collectionAuctionHouse = auctionHouse || AUCTION_HOUSE_PROGRAM_ID;

    //const AuctionHouseProgram = await ggoconnection.AuctionHouseProgram(new PublicKey(ENV_AH)); // loadAuctionHouseProgram(null, ENV_AH, GRAPE_RPC_ENDPOINT);
        //const AuctionHouseProgram =  AuctionHouse.fromAccountAddress(ggoconnection, new PublicKey(ENV_AH)); //.fromAccountInfo(info)[0];
        
        //AuctionHouseProgram.LISTINE_RECEIPT

        //const AHP = await AuctionHouseProgram;
        //spok(t, AuctionHouseProgram, expected);
        
        {    
            /**
             * Allocated data size on auction_house program per PDA type
             * CreateAuctionHouse: 459
             * PrintListingReceipt: 236
             * PrintBidReceipt: 269
             * PrintPurchaseReceipt: 193
             */
            
            const PrintListingReceiptSize = 236;
            const PrintBidReceiptSize = 269;
            const PrintPurchaseReceiptSize = 193;

            const ReceiptAccountSizes = [
                PrintListingReceiptSize,
                PrintBidReceiptSize,
                PrintPurchaseReceiptSize,
            ] as const;
            
            //const AH_PK = new web3.PublicKey(AUCTION_HOUSE_ADDRESS);
            const ReceiptAccounts = await (Promise.all(ReceiptAccountSizes.map(async size => {
                const accounts = await ggoconnection.getProgramAccounts(
                    collectionAuctionHouse,
                  {
                    commitment: 'confirmed',
                    filters: [
                      {
                        dataSize: size,
                      },
                      {
                        memcmp: {
                            offset: 72,
                            bytes: AUCTION_HOUSE_ADDRESS,
                        },
                      },
                    ],
                  }
                );
                /*if (accounts[0]) {
                    console.log('accounts all:', accounts);
                    console.log('accounts:' + JSON.stringify(accounts[0].account.data));
                    console.log('accounts pubkey:', accounts[0].pubkey.toBase58());
                }*/
                const parsedAccounts = accounts.map(async account => {
                  switch (size) {
                    case PrintListingReceiptSize:
                      const [
                        ListingReceipt,
                      ] = AuctionHouseProgram.accounts.ListingReceipt.fromAccountInfo(
                        account.account
                      );
                      //const ListingMint = getMintFromMetadata(ListingReceipt.metadata);
                       
                      return {
                        ...ListingReceipt,
                        receipt_type: ListingReceipt.canceledAt
                          ? 'cancel_listing_receipt'
                          : 'listing_receipt',
                        //mintPk: ListingMint,/*ListingReceipt.purchaseReceipt 
                           // ? 'LR'
                            //:*/getMintFromMetadata(ListingReceipt.metadata),
                      }; //as TransactionReceipt;
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
                        //mintPk: 'BR',//getMintFromMetadata(BidReceipt.metadata),
                      }; //as TransactionReceipt;
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
                        //mintPk: 'PR'
                      } //as TransactionReceipt;
                      break;
                    default:
                      return undefined;
                      break;
                  }
                });
                
                return await Promise.all(parsedAccounts);
              })));
              /*const metaTest = ReceiptAccounts[0][0].metadata;
              console.log('metaTest:', metaTest.toBase58());
              const testMeta = (await ggoconnection.getConfirmedSignaturesForAddress2(metaTest, {limit:2}));
              console.log(JSON.stringify(testMeta[0].signature));
              const testMeta2 = (await ggoconnection.getParsedTransaction(testMeta[0].signature, 'confirmed'));
              console.log(testMeta2.meta.preTokenBalances[0].mint.toString());
              */
              //const getMetaData = (await getMetadata(ReceiptAccounts[0][0].metadata));
              //console.log('getmetadata;'+ JSON.stringify(getMetaData));
              //console.log(JSON.stringify(testMeta2));
              //const test = ReceiptAccounts[0][0].tradeState;
              //const test2 = ReceiptAccounts[0][0].tokenAccount;
              //console.log('test:', test.toBase58());
              //console.log('test2:', ReceiptAccounts[0][0]);
              //const testing = (await ggoconnection.getSignaturesForAddress(test, {limit:25}));
              /*let sellerTradeState = 'HroJg9tfuScDS1eEfDf4Xz4iH6V2mTMmzZhuWrvhpzEy';
              const sellerTradeStratePK = new web3.PublicKey(sellerTradeState);
              const 
                myTest
              = AuctionHouseProgram.findListingReceiptAddress(
                sellerTradeStratePK
              );
              console.log('myTest:', (await myTest).toString());*/
              //console.log(testing[0]);

              //  return ReceiptAccounts;
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

                console.log("receipts: "+JSON.stringify(receipts));
            return (receipts);
            
        }
}


