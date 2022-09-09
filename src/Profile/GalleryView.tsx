
import React, { useEffect } from "react";
import { styled, alpha } from '@mui/material/styles';
import { Link } from "react-router-dom";
import { decodeMetadata } from '../utils/grapeTools/utils'
// @ts-ignore
import fetch from 'node-fetch'
import { PublicKey } from '@solana/web3.js';
import InfiniteScroll from 'react-infinite-scroll-component';

import {
    Pagination,
    Stack,
    Typography,
    Grid,
    Hidden,
    Box,
    Skeleton,
    ListItemButton,
    Container,
    Tooltip,
    InputBase,
    Button,
    FormControl,
    NativeSelect,
    InputLabel,
    LinearProgress,
    Select,
    Divider,
    MenuItem
} from '@mui/material';

import { SelectChangeEvent } from '@mui/material/Select';

import SolCurrencyIcon from '../components/static/SolCurrencyIcon';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';

import GalleryItem from './GalleryItem';
import GalleryGroupItem from './GalleryGroupItem';
import { GRAPE_PREVIEW } from '../utils/grapeTools/constants';
import { ConstructionOutlined } from "@mui/icons-material";
import axios from "axios";

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '17px',
    backgroundColor: alpha(theme.palette.common.white, 0.015),
    '&:hover': {
        border: '1px solid rgba(255,255,255,0.75)',
        backgroundColor: alpha(theme.palette.common.white, 0.1),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    marginTop: 0,
    marginBottom: 20,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        width: 'auto',
        marginLeft: 5,
    },
  }));

  const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: alpha(theme.palette.common.white, 0.25),
  }));
  
  const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('md')]: {
        width: '100%',
      },
    },
  }));

export default function GalleryView(props: any){
    const [page, setPage] = React.useState(1);
    const rowsperpage = 1500;
    const mode = props?.mode || 0;
    const refreshGallery = props.refreshGallery;
    const collectionAuthority = props?.collectionAuthority || null;
    const tokenPrice = props?.tokenPrice || null;
    //const [collectionMintList, setCollectionMintList] = props?.collectionMintList || null;
    const collectionMintList = props?.collectionMintList || null;
    const [finalMintList, setFinalMintList] = React.useState(collectionMintList);
    const finalCollection = props?.finalCollection || null;
    const [filterVal, setFilterVal] = React.useState("");
    const isparent = props?.isparent || false;
    const groupbysymbol = props?.groupbysymbol || null;
    //const walletCollection = props.walletCollection;
    const [foundList, setFoundList] = React.useState(null);
    const [initSorting, setInitSorting] = React.useState(false);
    const [sortingLoader, setSortingLoader] = React.useState(false);
    const scrollLimit = 20;
    const [collectionAttributeTypes, setCollectionAttributeTypes] = React.useState(null);
    const [collectionAttributes, setCollectionAttributes] = React.useState(null);
    const [thisAttribute, setThisAttribute] = React.useState(null);
    const [selected, setSelected] = React.useState('')
    // If a gallery item is groupBySymbol > 0
    // start searching how many are grouped so we can do this as a collective :) 

    const filter = (keyword:any) => {
        //const keyword = e.target.value;
        if (keyword !== '') {
          const results = collectionMintList.filter((listitem:any) => {
            //return listitem.name.toLowerCase().startsWith(keyword.toLowerCase())
            return listitem.name.toLowerCase().includes(keyword.toLowerCase())
            // Use the toLowerCase() method to make it case-insensitive
          });
            setFoundList(results);
            const tmpScrollList = (results && results?.length > 39) ? results.slice(0, 40) : results;
            setScrollData(tmpScrollList);
        } else {
            setFoundList(collectionMintList);
            const tmpScrollList = (collectionMintList && collectionMintList?.length > 39) ? collectionMintList.slice(0, 40) : collectionMintList;
            setScrollData(tmpScrollList);
        }
    
        setFilterVal(keyword);
    };

    const handleSortChange = (type:any) => {
        if (type !== '') {
            sortMintList(type);
        } 
    };

    const filterByAttribute = (category:string,attribute:string) => {
        //const keyword = e.target.value;
        if (attribute !== '') {
            const tmpMintList = collectionMintList;
            const results = tmpMintList.filter(obj => obj.attributes?.some(cat => cat.value === attribute));
            setFoundList(results);
            const tmpScrollList = (results && results?.length > 39) ? results.slice(0, 40) : results;
            setScrollData(tmpScrollList);
        } else {
            setFoundList(collectionMintList);
            const tmpScrollList = (collectionMintList && collectionMintList?.length > 39) ? collectionMintList.slice(0, 40) : collectionMintList;
            setScrollData(tmpScrollList);
        }
        //setFilterVal(attribute);
    };

    const handleAttributeFilter = (category:string,attribute:string) => {
        if (attribute !== ''){
            filterByAttribute(category,attribute);
            setThisAttribute(attribute);
            setSelected(attribute);
        }
    }

    function sortMintList(type:number){
        setFilterVal("");
        setSortingLoader(true);
        if (+type === 0){
            //collectionMintList.sort((a:any,b:any) => (a.listingPrice < b.listingPrice) ? 1 : -1);
            const sortedResults = collectionMintList.sort((a:any, b:any) => (a.listingPrice != null ? a.listingPrice : Infinity) - (b.listingPrice != null ? b.listingPrice : Infinity)) 
            //console.log("results: "+JSON.stringify(collectionMintList));
            setFoundList(sortedResults);
            const tmpScrollList = (sortedResults && sortedResults?.length > scrollLimit-1) ? sortedResults.slice(0, scrollLimit) : collectionMintList;
            setScrollData(tmpScrollList);
        } else if (+type === 1){
            /*
            const results = collectionMintList.filter((listitem:any) => {
                return listitem?.listingPrice > 0;
            });
            */
            //const sortedResults = results.sort((a:any, b:any) => (a.listingPrice < b.listingPrice ? 1 : -1));
            const sortedResults = collectionMintList.sort((a:any, b:any) => b.listingPrice - a.listingPrice) 
            setFoundList(sortedResults);
            const tmpScrollList = (sortedResults && sortedResults?.length > scrollLimit-1) ? sortedResults.slice(0, scrollLimit) : collectionMintList;
            setScrollData(tmpScrollList);
        } else if (+type === 2){ // by block time
            const thisCollectionMintList = collectionMintList;
            //const results = thisCollectionMintList.filter((listitem:any) => {
                //return listitem.name.toLowerCase().startsWith(keyword.toLowerCase())
            //    return listitem.listedBlockTime > 0;
            //});
            const sortedResults = collectionMintList.sort((a:any,b:any) => b.listedBlockTime - a.listedBlockTime)//(b.listedBlockTime != null ? b.listedBlockTime : Infinity) - (a.listedBlockTime != null ? a.listedBlockTime : Infinity));
            setFoundList(sortedResults);
            const tmpScrollList = (sortedResults && sortedResults?.length > scrollLimit-1) ? sortedResults.slice(0, scrollLimit) : collectionMintList;
            setScrollData(tmpScrollList);
        } else if (+type === 3){ // by offer count
            const sortedResults = collectionMintList.sort((a:any,b:any) => (a.offerCount - b.offerCount) ? 1 : -1);
            setFoundList(sortedResults);
            const tmpScrollList = (sortedResults && sortedResults?.length > scrollLimit-1) ? sortedResults.slice(0, scrollLimit) : collectionMintList;
            setScrollData(tmpScrollList);
        } else if (+type === 4){ // by highest offers
            const sortedResults = collectionMintList.sort((a:any, b:any) => (b.highestOffer != null ? b.highestOffer : Infinity) - (a.highestOffer != null ? a.highestOffer : Infinity)) 
            //const sortedResults = collectionMintList.sort((a:any, b:any) => (b.highestOffer - a.highestOffer) ? 1 : -1)
            setFoundList(sortedResults);
            const tmpScrollList = (sortedResults && sortedResults?.length > scrollLimit-1) ? sortedResults.slice(0, scrollLimit) : collectionMintList;
            setScrollData(tmpScrollList);
        } else if (+type === 5){ // by alphabetical
            const thisCollectionMintList = collectionMintList;
            //const results = thisCollectionMintList.filter((listitem:any) => {
            //    return listitem;
            //});
            const sortedResults = collectionMintList.sort((a:any,b:any) => (a.name.toLowerCase().trim() > b.name.toLowerCase().trim()) ? 1 : -1);
            setFoundList(sortedResults);
            const tmpScrollList = (sortedResults && sortedResults?.length > scrollLimit-1) ? sortedResults.slice(0, scrollLimit) : collectionMintList;
            setScrollData(tmpScrollList);
        } else if (+type === 6){ // by rarity
            const sortedResults = collectionMintList.sort((a:any,b:any) => (a.rarity != null ? a.rarity : Infinity) - (b.rarity != null ? b.rarity : Infinity)) 
            setFoundList(sortedResults);
            const tmpScrollList = (sortedResults && sortedResults?.length > scrollLimit-1) ? sortedResults.slice(0, scrollLimit) : collectionMintList;
            setScrollData(tmpScrollList);
        }
        setSortingLoader(false);
    }

    //const [scrollData, setScrollData] = React.useState(null);
    const [scrollData, setScrollData] = React.useState(null);
    const [hasMoreValue, setHasMoreValue] = React.useState(true);

    const loadScrollData = async () => {
        try {
            if (foundList)
                setScrollData(foundList.slice(0, scrollData.length + scrollLimit));
        } catch (err) {
            console.log(err);
        }
    };

    const handleOnRowsScrollEnd = () => {
        if (foundList){
            if (scrollData.length < foundList?.length) {
                setHasMoreValue(true);
                loadScrollData();
            } else {
                setHasMoreValue(false);
            }
        }
    };

    const [scrollProfileData, setScrollProfileData] = React.useState((finalCollection && finalCollection?.length > 49) ? finalCollection.slice(0, 50) : collectionMintList)
    const [hasMoreProfileValue, setHasMoreProfileValue] = React.useState(finalCollection?.length > 49 ? true : false);

    const loadScrollProfileData = async () => {
        try {
            if (foundList)
                setScrollProfileData(foundList.slice(0, scrollData.length + scrollLimit));
        } catch (err) {
            console.log(err);
        }
    };

    const handleOnRowsScrollProfileEnd = () => {
        if (foundList){
            if (scrollData.length < foundList.length) {
                setHasMoreProfileValue(true);
                loadScrollProfileData();
            } else {
                setHasMoreProfileValue(false);
            }
        }
    };

    function getCollectionAttributes(){
        const thisAttributes = new Array();
        let sortedResults = null;
        
        if (!collectionAttributes){
            if (collectionMintList){
                for(var item of collectionMintList){
                    //console.log("item: "+JSON.stringify(item))
                    if (item.attributes){
                        for  (var x of item.attributes){
                            let toPush = true;
                            x.floor = 0;
                            x.ceiling = 0;
                            for (var y of thisAttributes){
                                if ((y?.trait_type === x?.trait_type) && (y?.value === x?.value)){
                                    //console.log("found: "+JSON.stringify(x))
                                    toPush = false;
                                    
                                    //console.log("listingPricing: "+item.listingPrice)
                                    // update this attribute
                                    //break;
                                } 
                            }
                            if (toPush){
                                // fetch floor
                                // check all items again to see if the floor for this item attributes
                                thisAttributes.push(x)
                            }
                        }
                    }
                }

                // Get general rarities
                for (var at_item of thisAttributes){
                    var at_count = 0;
                    for (var cml_item of collectionMintList){
                        if (cml_item.attributes){
                            for (var at of cml_item.attributes){
                                if (at_item.trait_type === at.trait_type && at_item.value === at.value){
                                    at_count++;
                                    if (cml_item.listingPrice > at_item.ceiling)
                                        at_item.ceiling = cml_item.listingPrice;
                                    
                                    if (cml_item.listingPrice > 0){
                                        if (at_item.floor > 0){
                                            if (at_item.floor > cml_item.listingPrice)
                                                at_item.floor = cml_item.listingPrice;
                                        }else{
                                            at_item.floor = cml_item.listingPrice;
                                        }
                                    }
                                    at_item.count = at_count;
                                }
                            }
                        }
                    }
                }

                // Get NFT Rarities
                for (var at_item of thisAttributes){
                    if (at_item && at_item.count)
                        at_item.rarity = at_item.count/collectionMintList.length*100;
                }

                // Get individual rarities
                const collection_len = collectionMintList.length;
                for (var nft_item of collectionMintList){
                    if (nft_item.attributes){
                        //calculate trait rarity, total num collection / divide by the number that specific trait  
                        nft_item.rarity = 0;
                        var rarity_aggregate = 0;
                        var attribute_count = 0;
                        var rarity_weight_sum = 0;
                        for (var at of nft_item.attributes){
                            // check with the rarities we have
                            for (var at_item of thisAttributes){
                                //(inner.count/collectionMintList.length*100)
                                if (at_item.trait_type === at.trait_type && at_item.value === at.value){
                                    attribute_count++;
                                    var rarity_weight = at_item.count/collection_len
                                    rarity_weight_sum += rarity_weight;
                                    //if (nft_item.address === 'HdhVrid2C25H6hkesaqoeoSSRBuPrXcKgJQxnYiaApch'){
                                        //console.log("rarity: "+at_item.rarity)
                                        //console.log("count: "+at_item.count)
                                        //console.log("rarity_weight: "+rarity_weight)
                                    //}
                                }
                            }
                        }
                        nft_item.rarity = rarity_weight_sum/attribute_count;
                        nft_item.rarity_score = 100-(nft_item.rarity*100);
                        nft_item.collection_len = collection_len;
                    }

                }

                // sort attributes
                sortedResults = thisAttributes.sort((a:any,b:any) => (a.trait_type.toLowerCase().trim() > b.trait_type.toLowerCase().trim()) ? 1 : -1);
                //thisAttributes.sort((a:any, b:any) => a.trait_type.toLowerCase().trim() > b.trait_type.toLowerCase().trim() ? 1 : -1);   
                //console.log("attributeTypes: "+JSON.stringify(thisAttributes))
            }
            setCollectionAttributes(sortedResults);
        }
    }

    function clearSelects() {
        setThisAttribute(null);
        setSelected('');
        handleSortChange(0);
    }

    React.useEffect(() => {
        //console.log("refreshGallery: "+refreshGallery)
        
        if (!initSorting && collectionMintList){
            getCollectionAttributes();
            //if (collectionMintList){
                //setScrollData((collectionMintList && collectionMintList?.length > scrollLimit-1) ? collectionMintList.slice(0, scrollLimit) : collectionMintList);
            setInitSorting(true);
            sortMintList(0);
            setTimeout(function() {
                setInitSorting(false);
            }, 500);
        } 
    }, [finalMintList, collectionMintList, refreshGallery])

    return (
        <>
            {mode === 1 ?
                <>
                    
                        <Box
                            sx={{
                                background: 'rgba(0, 0, 0, 0.6)',
                                borderRadius: '17px',
                                p:4
                            }} 
                        > 
                        
                            <Grid container 
                                spacing={{ xs: 1, md: 2 }} 
                                alignItems="flex-start"
                                >
                                <Grid item xs={0} sm={2}>
                                    <FormControl fullWidth>
                                        <InputLabel htmlFor="uncontrolled-native" sx={{height:'40px',m:0,p:0}}>Sort</InputLabel>
                                        <NativeSelect
                                            defaultValue={0}
                                            inputProps={{
                                                name: 'Sorting',
                                                id: 'uncontrolled-native',
                                              }}
                                            id="filter-select"
                                            onChange={(e) => handleSortChange(e.target.value)}
                                            sx={{borderRadius:'17px', height:'40px'}}
                                        >
                                            <option value={0}>Price Ascending</option>
                                            <option value={1}>Price Descending</option>
                                            <option value={2}>Recently Listed</option>
                                            <option value={3} disabled>Most Offers</option>
                                            <option value={4}>Highest Offers</option>
                                            <option value={5}>Alphabetical</option>
                                            <option value={6}>Rarity</option>
                                        </NativeSelect>
                                    </FormControl>
                                </Grid>    
                                
                                <Grid item xs={0} sm={10}>
                                    <Container
                                        component="form"
                                        //onSubmit={handlePublicKeySubmit}
                                        sx={{background:'none'}}
                                    >
                                        <Tooltip title='Filter Collection'>
                                            <Search
                                                sx={{height:'40px'}}
                                            >
                                                <SearchIconWrapper>
                                                    <SearchIcon />
                                                </SearchIconWrapper>
                                                <StyledInputBase
                                                    sx={{height:'40px', width:'100%'}}
                                                    placeholder='Filter Collection'
                                                    inputProps={{ 'aria-label': 'search' }}
                                                    onChange={(e) => filter(e.target.value)}
                                                    value={filterVal}
                                                />
                                            </Search>
                                        </Tooltip>
                                    </Container>
                                </Grid>
                            </Grid>
                        
                            <Grid container 
                                spacing={{ xs: 2, md: 3 }} 
                                alignItems="flex-start"
                                >
                            
                                <Hidden smDown>
                                    <Grid item xs={0} sm={2} sx={{mt:2}}>
                                        
                                        {collectionAttributes &&
                                            <>
                                            {thisAttribute && 
                                                <Typography variant='caption'>{thisAttribute} selected
                                                    <Button
                                                        size='small'
                                                        onClick={clearSelects}
                                                        sx={{color:'white',borderRadius:'17px',m:0,p:0}}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </Button>
                                                    <Divider />
                                                </Typography>
                                            }
                                            
                                            {collectionAttributes.map((element:any, key:number) => ((key<=0 || (key>0 && collectionAttributes[key-1].trait_type != collectionAttributes[key].trait_type)) &&
                                                    <FormControl variant="standard" fullWidth sx={{mt:1.25}}>
                                                        <InputLabel id="attribute_select_label">{element.trait_type}</InputLabel>
                                                        <Select
                                                            id={`attribute_select_${element.trait_type}`}
                                                            value={selected}
                                                            onChange={(e) => handleAttributeFilter(element.trait_type, e.target.value)}
                                                            
                                                        >
                                                            <MenuItem selected value={''}></MenuItem>
                                                            {collectionAttributes.map((inner:any, innerkey:number) => (element?.trait_type.toLowerCase() === inner?.trait_type.toLowerCase()) &&
                                                                <MenuItem value={inner.value}>{inner.value} {inner?.floor > 0 && <small>&nbsp;-&nbsp;{inner.floor}<SolCurrencyIcon sx={{fontSize:"10px"}} /></small>} {inner?.rarity > 0 && <Typography color='yellow'><small>&nbsp;:&nbsp;{inner.rarity.toFixed(2)}%</small></Typography>}</MenuItem>
                                                            )}
                                                        </Select>
                                                        
                                                        {/*<Button variant="outlined" sx={{m:1,color:'white',borderColor:'white',borderRadius:'17px'}} disabled>{element.trait_type} {element.value}</Button>*/}
                                                    </FormControl>
                                                )
                                            )}
                                            </>
                                        }
                                    </Grid>
                                </Hidden>
                                {!initSorting && !sortingLoader && scrollData && foundList && foundList.length > 0 && (
                                <Grid item xs={12} sm={10}>
                                    <InfiniteScroll
                                        dataLength={scrollData.length}
                                        next={handleOnRowsScrollEnd}
                                        hasMore={hasMoreValue}
                                        scrollThreshold={1}
                                        loader={!scrollData && <p><LinearProgress /></p>}
                                        // Let's get rid of second scroll bar
                                        style={{ overflow: "unset" }}
                                    >
                                        <Grid container 
                                            spacing={{ xs: 2, md: 3 }} 
                                            justifyContent="center"
                                            alignItems="center">
                                            {scrollData.map((collectionInfo:any, key:number) => {
                                                return(
                                                    <>
                                                        {collectionInfo?.image ?
                                                            <Grid item xs={12} sm={12} md={4} lg={3} xl={2}>
                                                                <Box
                                                                    sx={{
                                                                        background: 'rgba(0, 0, 0, 0.6)',
                                                                        borderRadius: '26px',
                                                                        minWidth: '175px'
                                                                    }} 
                                                                >
                                                                    <GalleryItem collectionitem={collectionInfo} mode={mode} groupbysymbol={collectionInfo.groupBySymbol} tokenPrice={tokenPrice} isparent={false} listed={true} count={key} />
                                                                </Box>
                                                            </Grid>
                                                        :
                                                        <></>
                                                        }
                                                    </>
                                                )
                                            })}
                                        </Grid>
                                    </InfiniteScroll>
                                </Grid>
                                )}
                            </Grid>
                        
                        </Box>
                </>
            :
                <>
                {finalCollection && finalCollection.length > 0 && (
                    <Box
                        sx={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '17px',
                            p:4
                        }} 
                    > 

                        {/*
                        <InfiniteScroll
                            dataLength={scrollProfileData?.length}
                            next={handleOnRowsScrollProfileEnd}
                            hasMore={hasMoreProfileValue}
                            scrollThreshold={1}
                            loader={<p><LinearProgress /></p>}
                            // Let's get rid of second scroll bar
                            style={{ overflow: "unset" }}
                        >
                            <Grid container 
                                spacing={{ xs: 2, md: 3 }} 
                                justifyContent="center"
                                alignItems="center">
                                {scrollProfileData && scrollProfileData.map((collectionInfo:any, key:number) => {
                                    return(
                                        <>
                                            {(collectionInfo.groupBySymbol > 1) ? (
                                                <>
                                                {(collectionInfo.groupBySymbolIndex === 0) && (
                                                    <GalleryGroupItem groupCollection={finalCollection} mode={mode} symbol={collectionInfo.meta.data.symbol} isparent={true} key={key} />
                                                )}
                                                </>
                                            ):(
                                                <Grid item xs={12} sm={12} md={4} lg={3} xl={2} key={key}>
                                                    <Box
                                                        sx={{
                                                            background: 'rgba(0, 0, 0, 0.6)',
                                                            borderRadius: '26px',
                                                            minWidth: '175px'
                                                        }} 
                                                    >
                                                        <GalleryItem collectionitem={collectionInfo} mode={mode} groupbysymbol={collectionInfo.groupBySymbol} isparent={false} finalCollection={finalCollection} listed={true} count={key} />
                                                    </Box>
                                                </Grid>
                                            )}
                                        </>   
                                    )
                                })}
                            </Grid>
                        </InfiniteScroll>
                        */}


                        <Grid container 
                            spacing={{ xs: 2, md: 3 }} 
                            justifyContent="center"
                            alignItems="center">

                            { (finalCollection.length > 0 ? finalCollection
                                .slice((page - 1) * rowsperpage, page * rowsperpage):finalCollection)
                                .map((collectionInfo: any, key: any) => {
                                    return(
                                        <>
                                            {(collectionInfo.groupBySymbol > 1) ? (
                                                <>
                                                {(collectionInfo.groupBySymbolIndex === 0) && (
                                                    <GalleryGroupItem groupCollection={finalCollection} mode={mode} symbol={collectionInfo.meta.data.symbol} isparent={true} key={key} />
                                                )}
                                                </>
                                            ):(
                                                
                                                <Grid item xs={12} sm={12} md={4} lg={3} xl={2} key={key}>
                                                    <Box
                                                        sx={{
                                                            background: 'rgba(0, 0, 0, 0.6)',
                                                            borderRadius: '26px',
                                                            minWidth: '175px'
                                                        }} 
                                                    >
                                                        <GalleryItem collectionitem={collectionInfo} mode={mode} groupbysymbol={collectionInfo.groupBySymbol} isparent={false} finalCollection={finalCollection} listed={true} count={key} />
                                                    </Box>
                                                </Grid>
                                            )}
                                        </>   
                                    )
                                }
                            )}


                        </Grid>
                    </Box>
                    
                )}
                </>
            }
        </>);
}