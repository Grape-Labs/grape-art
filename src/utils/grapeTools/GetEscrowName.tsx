import React from "react";
import { 
  GRAPE_COLLECTIONS_DATA
} from './constants';

import { 
  Typography,
} from '@mui/material';

import { getMetadata } from '../auctionHouse/helpers/accounts';

import { AuctionHouseProgram  } from '@metaplex-foundation/mpl-auction-house';
const SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

export const fetchVerifiedAuctionHouses = async(thisAddress:any) => {
  try{
      const url = GRAPE_COLLECTIONS_DATA+'verified_auctionHouses.json';
      const response = await window.fetch(url, {
          method: 'GET',
          headers: {
          }
        });
        const string = await response.text();
        const json = string === "" ? {} : JSON.parse(string);

        for (let itemAuctionHouse of json){
          //console.log("itemAuctionHouse: " + itemAuctionHouse.address + " vs " + thisAddress)
          if (itemAuctionHouse.address === thisAddress){
            return itemAuctionHouse.name;
          }
        }
      
      return null;
  } catch(e){
      console.log("ERR: "+e)
      return null;
  }
}

export function GetEscrowName(props:any){
  const thisAddress = props.address;
  const [escrowName, setEscrowName] = React.useState(null);

  React.useEffect(() => {   
      if (thisAddress)
          setEscrowName(fetchVerifiedAuctionHouses(thisAddress));
  }, [thisAddress]);

  return (
      <>
          {escrowName && <Typography variant='caption' sx={{ml:1}}>({escrowName})</Typography>}
      </>
  ) 
}