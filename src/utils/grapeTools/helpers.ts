import React from "react";
import { BN, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  GRAPE_RPC_ENDPOINT,
  THEINDEX_RPC_ENDPOINT,
  PROXY,
  GRAPE_COLLECTIONS_DATA
} from './constants';

import {
    AUCTION_HOUSE_PROGRAM_ID,
    AUCTION_HOUSE_ADDRESS,
    TOKEN_METADATA_PROGRAM_ID,
} from '../auctionHouse/helpers/constants';

import { getMetadata } from '../auctionHouse/helpers/accounts';

import { AuctionHouseProgram  } from '@metaplex-foundation/mpl-auction-house';
const SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

export function timeConvert(n: number, decimals = 0, abbr = false): string {
  const num = n;
  const hours = (num / 60);
  const rhours = Math.floor(hours);
  const minutes = (hours - rhours) * 60;
  const rminutes = Math.round(minutes);
  const rdays = Math.round(rhours / 24);
  let returnString = '';
  if (num === 1) {
      returnString = `${num} minute.`;
  } else if (num === 60) {
      returnString = '1 hour.';
  } else if (num > 60) {
      returnString = `${formatAmount(num, decimals, abbr)} minutes`;
      if (rdays > 1) {
          returnString += `. ~${rdays} days.`;
      } else {
          returnString = ` = ${formatAmount(rhours, decimals, abbr)} hour(s) and ${rminutes} minutes.`;
      }
  } else {
      returnString = `${rminutes} minutes.`;
  }
  return returnString;
}

export const getFormattedNumberToLocale = (value: any, digits = 0) => {
  const converted = parseFloat(value.toString());
  const formatted = new Intl.NumberFormat('en-US', {
      minimumSignificantDigits: 1,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
  }).format(converted);
  return formatted || '';
}

export const formatThousands = (val: number, maxDecimals?: number, minDecimals = 0) => {
  let convertedVlue: Intl.NumberFormat;

  if (maxDecimals) {
      convertedVlue = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: minDecimals,
          maximumFractionDigits: maxDecimals
      });
  } else {
      convertedVlue = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: minDecimals,
          maximumFractionDigits: 0
      });
  }

  return convertedVlue.format(val);
}

const abbreviateNumber = (number: number, precision: number) => {
  if (number === undefined) {
      return '--';
  }
  let tier = (Math.log10(number) / 3) | 0;
  let scaled = number;
  let suffix = SI_SYMBOL[tier];
  if (tier !== 0) {
      let scale = Math.pow(10, tier * 3);
      scaled = number / scale;
  }

  return scaled.toFixed(precision) + suffix;
};

export const formatAmount = (
  val: number,
  precision: number = 6,
  abbr: boolean = false
) => {
  if (val) {
      if (abbr) {
          return abbreviateNumber(val, precision);
      } else {
          return val.toFixed(precision);
      }
  }
  return '0';
};

export function getRemainingDays(targetDate?: string): number {
  const date = new Date();
  const time = new Date(date.getTime());
  const toDate = targetDate ? new Date(targetDate) : null;
  if (toDate) {
      time.setMonth(toDate.getMonth());
  } else {
      time.setMonth(date.getMonth() + 1);
  }
  time.setDate(0);
  return time.getDate() > date.getDate() ? time.getDate() - date.getDate() : 0;
}

//Get Prices RPC
export async function getCoinGeckoPrice(token:string) {
  const response = await fetch(PROXY+"https://api.coingecko.com/api/v3/simple/price?include_24hr_change=true&ids="+token+"&vs_currencies=usd",{
    method: "GET",
    //body: JSON.stringify(body),
    headers: { "Content-Type": "application/json",
                "Cache-Control": "s-maxage=8640" }
  }).catch((error)=>{
    console.log("ERROR GETTING CG DATA!");
    return null;
  });
  
  try{
    const json = await response.json();
    return json;
  }catch(e){return null;}
}

export async function getTokenPrice(tokenIn:string,tokenOut:string) {
  const body = {
    id: tokenIn,
    vsToken: tokenOut
  }
  const apiUrl = "https://price.jup.ag/v1/price?id="+tokenIn+"&vsToken="+tokenOut;
  const resp = await window.fetch(apiUrl, {
    //method:'GET',
    //body: JSON.stringify(body)
  })
  const json = await resp.json(); 
  return json
}

export async function getMintFromMetadataWithVerifiedCollection(updateAuthority:string, metadata:string) {
    
    // add a helper function to get Metadata from Grape Verified Collection

    // returns the mint address
  
}

export async function getMintFromMetadata(updateAuthority:string, metaData:web3.PublicKey): Promise<string>{
  let value = ' ';
  let mintPk: any;
    const ggoconnection = new Connection(GRAPE_RPC_ENDPOINT);
    try{
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
    }catch(e){
        return null
    }
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

export async function getReceiptsFromAuctionHouse(auctionHouse_filter: string, collection_filter: string, wallet_filter: string, mint_filter: string, bid_receipt_filter:string, getAllAh: boolean, rpcEndpoint: string) {
    // if wallet is set we should also filter by wallet address
    
    //const ticonnection = new Connection(rpcEndpoint || THEINDEX_RPC_ENDPOINT);  
    const ticonnection = new Connection(rpcEndpoint || GRAPE_RPC_ENDPOINT);   
    try{ 
      const collectionAuctionHouse = auctionHouse_filter || AUCTION_HOUSE_ADDRESS;
          {    
              const PrintListingReceiptSize = 236;
              const PrintBidReceiptSize = 269;
              const PrintPurchaseReceiptSize = 193;

              const AhLocation1 = 72;
              const AhLocation2 = 104;

              const ReceiptAccountSizes = [
                  PrintListingReceiptSize,
                  PrintBidReceiptSize,
                  PrintPurchaseReceiptSize,
              ] as const;

              const ReceiptAccountSizes2 = [
                {size: PrintListingReceiptSize, ahPosition: AhLocation1},
                {size: PrintBidReceiptSize, ahPosition: AhLocation1},
                {size: PrintPurchaseReceiptSize, ahPosition: AhLocation2}
              ]
              
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
              //const ReceiptAccounts = await (Promise.all(ReceiptAccountSizes.map(async size => {
              const ReceiptAccounts = await (Promise.all(ReceiptAccountSizes2.map(async ({size, ahPosition}) => {
                  if (wallet_filter != null && mint_filter === null && !getAllAh){
                    console.log('execute with wallet_filter');
                    accounts = await ticonnection.getProgramAccounts(
                      AUCTION_HOUSE_PROGRAM_ID,
                      {
                        //commitment: 'confirmed',
                        /*
                        dataSlice: {
                          offset: 0, // number of bytes
                          length: 10000, // number of bytes
                        },*/
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
                                offset: ahPosition,
                                bytes: collectionAuctionHouse,
                            },
                          },
                        ],
                      }
                  );
                  } else if (wallet_filter != null && mint_filter != null && !getAllAh) {
                    console.log('execute with all filters');
                    accounts = await ticonnection.getProgramAccounts(
                      AUCTION_HOUSE_PROGRAM_ID,
                    {
                      //commitment: 'confirmed',
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
                              offset: ahPosition,
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
                } else if (wallet_filter === null && mintMetadata != null && !getAllAh) {
                  console.log('execute with mint_filter');
                  accounts = await ticonnection.getProgramAccounts(
                    AUCTION_HOUSE_PROGRAM_ID,
                  {
                    //commitment: 'confirmed',
                    filters: [
                      {
                        dataSize: size,
                      },
                      {
                        memcmp: {
                            offset: ahPosition,
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
              } else if (wallet_filter === null && mintMetadata != null && getAllAh) {
                console.log('execute with mint_filter for all AH');
                accounts = await ticonnection.getProgramAccounts(
                  AUCTION_HOUSE_PROGRAM_ID,
                {
                  //commitment: 'confirmed',
                  filters: [
                    {
                      dataSize: size,
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
              } else if (wallet_filter != null && mint_filter === null && getAllAh){
                console.log('execute with wallet_filter for all AH');
                accounts = await ticonnection.getProgramAccounts(
                  AUCTION_HOUSE_PROGRAM_ID,
                {
                  //commitment: 'confirmed',
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
                  ],
                }
              ); 
              } else {
                    console.log('execute default only AH');
                    accounts = await ticonnection.getProgramAccounts(
                      AUCTION_HOUSE_PROGRAM_ID,
                    {
                      //commitment: 'confirmed',
                      filters: [
                        {
                          dataSize: size,
                        },
                        {
                          memcmp: {
                              offset: ahPosition,
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
    }catch(e){ // if RPC error resend it?
      const receipts = await getReceiptsFromAuctionHouse(auctionHouse_filter, collection_filter, wallet_filter, mint_filter, bid_receipt_filter, getAllAh, GRAPE_RPC_ENDPOINT)
      //console.log("JSON: "+JSON.stringify(receipts))
      return receipts;
    }
}