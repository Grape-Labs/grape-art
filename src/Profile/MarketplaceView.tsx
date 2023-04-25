import * as React from 'react';
import { styled, alpha, makeStyles } from '@mui/material/styles';
import { Link, useLocation, NavLink } from 'react-router-dom';
import Color from 'color';
import { GRAPE_PROFILE, 
    GRAPE_COLLECTION, 
    GRAPE_COLLECTIONS_DATA, 
    FEATURED_DAO_ARRAY,
    GRAPE_ART_TYPE } from '../utils/grapeTools/constants';
//import { useFadedShadowStyles } from '@mui-treasury/styles/shadow/faded';
import moment from 'moment';

import {
    Box,
    Grid,
    Button,
    ButtonGroup,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Typography,
    Avatar,
} from '@mui/material';

import { Connection, Commitment } from '@solana/web3.js';

import { 
    RPC_CONNECTION,
    RPC_ENDPOINT, 
    HELIUS_API} from '../utils/grapeTools/constants';

import {  
    getTokenPrice 
} from '../utils/grapeTools/helpers';

import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import { CardActionArea } from '@mui/material';

import { useTranslation } from 'react-i18next';

export default function MarketplaceView(props: any) {
    //const styles = useFadedShadowStyles();
    const [verifiedCollectionArray, setVerifiedCollectionArray] = React.useState(null);
    const { t, i18n } = useTranslation();
    const [tps, setTps] = React.useState(null);
    const [solConversion, setSolConversion] = React.useState(null);
    const [timestamp, setTimestamp] = React.useState(null);

    const fetchVerifiedCollection = async(address:string) => {
        try{
            const url = GRAPE_COLLECTIONS_DATA+'verified_collections.json';
            const response = await window.fetch(url, {
                method: 'GET',
                headers: {
                }
              });
              const string = await response.text();
              const json = string === "" ? {} : JSON.parse(string);

              json.sort((a:any,b:any) => (a.name > b.name) ? 1 : -1);

              //console.log(">>> "+JSON.stringify(json));
              setVerifiedCollectionArray(json); 
              return json;
            
        } catch(e){console.log("ERR: "+e)}
    }

    const fetchSolanaStats = async() => {
        try{
            const connection = RPC_CONNECTION;

            const recentPerformanceSamples = await connection.getRecentPerformanceSamples();

            if (recentPerformanceSamples && recentPerformanceSamples.length > 0){
                const tps = recentPerformanceSamples[0].numTransactions/recentPerformanceSamples[0].samplePeriodSecs;
                setTps(tps);
            }

            const tknPrice = await getTokenPrice("SOL", "USDC");
            if (tknPrice){
                console.log("tknPrice: "+JSON.stringify(tknPrice))
                setSolConversion(tknPrice.data.price);
            }
            setTimestamp(moment().format("llll"));
        } catch(e){console.log("ERR: "+e)}
    }

    function MarketplaceComponentView(props: any){
        const featured = props.featured;
        const span = props.span;
        
        return (
            <Grid item xs={12} sm={6} md={4} lg={3}>
                <>
                    <Card sx={{
                        borderRadius:'26px',mb:2
                        }}>
                        <CardActionArea
                                component={Link} to={`${GRAPE_COLLECTION}${featured.vanityUrl}`}
                                sx={{

                                }}
                            >
                            {featured.vanityUrl ?
                                
                                <> 
                                    <CardMedia
                                        component="img"
                                        image={GRAPE_COLLECTIONS_DATA+featured.splash}
                                        alt={featured.name}
                                        sx={{
                                            position: 'relative',
                                            zIndex: 1,
                                            borderRadius: '1rem',
                                            boxShadow: `0 6px 16px 0 ${Color(color).fade(0.85)}`,
                                        }}
                                        />
                                        
                                    <CardContent
                                        
                                    >
                                        <Typography 
                                            gutterBottom variant="h5" 
                                            component="div"
                                        >
                                            <Grid container>
                                                <Grid item>
                                                    <Avatar
                                                        variant="square"
                                                        src={GRAPE_COLLECTIONS_DATA+featured.logo}
                                                        sx={{
                                                            ml:1,
                                                            mr:1,
                                                            width: 24, 
                                                            height: 24
                                                        }}
                                                    ></Avatar>
                                                </Grid>
                                                <Grid item>
                                                    {featured.name}
                                                </Grid>
                                            </Grid>
                                        </Typography>
                                        <Typography variant="body2" color="text.primary">
                                            {featured.description}
                                        </Typography>
                                            {/*
                                            <img
                                                src={GRAPE_COLLECTIONS_DATA+featured.splash}
                                                srcSet={GRAPE_COLLECTIONS_DATA+featured.splash}
                                                alt=""
                                                style={{
                                                    opacity: '0.025',
                                                    position: 'absolute',
                                                    marginTop:2,
                                                    marginBottom:2,
                                                    padding:1,
                                                    top:'-20%',
                                                    left:'-20%',
                                                    width:'150%'
                                                }}
                                            />*/}
                                    </CardContent>
                                </>
                            :
                                <>
                                <CardMedia
                                    component="img"
                                    image={GRAPE_COLLECTIONS_DATA+featured.splash}
                                    alt={featured.name}
                                        sx={{
                                            background: 'rgba(0, 0, 0, 1)',
                                            m:0,
                                            p:0,
                                        }} 
                                    />
                                    
                                <CardContent
                                    sx={{
                                        background: 'none',
                                    }}
                                >
                                <Typography gutterBottom variant="h5" component="div">
                                    <Grid container>
                                        <Grid item>
                                            <Avatar
                                                variant="square"
                                                src={GRAPE_COLLECTIONS_DATA+featured.logo}
                                                sx={{
                                                    ml:1,
                                                    mr:1,
                                                    width: 24, 
                                                    height: 24
                                                }}
                                            ></Avatar>
                                        </Grid>
                                        <Grid item>
                                            {featured.name}
                                        </Grid>
                                    </Grid>
                                </Typography>
                                <Typography variant="body2" color="text.primary">
                                    {featured.description}
                                </Typography>
                                    <img
                                        src={GRAPE_COLLECTIONS_DATA+featured.splash}
                                        srcSet={GRAPE_COLLECTIONS_DATA+featured.splash}
                                        alt=""
                                        style={{
                                            opacity: '0.025',
                                            position: 'absolute',
                                            marginTop:2,
                                            marginBottom:2,
                                            padding:1,
                                            top:'-20%',
                                            left:'-20%',
                                            width:'150%'
                                        }}
                                    />
                                </CardContent>
                                </>
                            }
                        
                        </CardActionArea>
                        <CardActions
                            sx={{background:'none'}}
                        >
                            <Grid 
                                container
                                direction="row"
                                justifyContent='flex-end'
                                alignContent='flex-end'
                                sx={{
                                    p:1,pr:1.25,
                                }}
                            >
                                {featured?.vanityUrl ?
                                    <>
                                        {/*
                                        <Button size="small" 
                                            component="a" href={`${featured.daourl}`} target="_blank"
                                            sx={{borderRadius:'24px', color:'white'}}>
                                            {t('View DAO')}</Button>
                                        */}
                                        {featured?.governance &&
                                            <Button size="small" disabled={true}>
                                                <AccountBalanceIcon />
                                            </Button>
                                        }

                                        {featured?.isGame &&
                                            <Button size="small" disabled={true}>
                                                <SportsEsportsIcon />
                                            </Button>
                                        }

                                        <Button size="small"    
                                            component={Link} to={`${GRAPE_COLLECTION}${featured.vanityUrl}`}
                                            sx={{borderRadius:'24px', color:'white'}}
                                        >View 
                                        {featured?.tokenType === 'SPL' ?
                                            <>&nbsp;{featured?.tokenType} Token</>
                                        :
                                            <>
                                                {featured?.isGame ? 
                                                    <>&nbsp;
                                                    Gaming
                                                    </>
                                                :
                                                    <>&nbsp;
                                                    {featured?.tokenType}
                                                    </>
                                                }
                                            </>        
                                        } Community</Button>
                                        <ShareSocialURL url={'https://grape.art'+GRAPE_COLLECTION+featured.vanityUrl} title={`Community: ${featured.name}`} />
                                    </>
                                :
                                    <>Coming soon...</>
                                }
                            </Grid>
                        </CardActions>
                    </Card> 
                </>
            </Grid>
        )
    }
    
    React.useEffect(() => { 
        fetchVerifiedCollection("");
        fetchSolanaStats();
    }, []);

    const color = '#fff';

    return (
        <>
            <Box sx={{background:'rgba(0,0,0,0.1)',borderRadius:'17px',p:1,mt:5,mb:2}}>
                <Grid container>
                    {tps && 
                        <Grid item xs={4} sx={{textAlign:'center'}}><Typography variant="caption">Solana Network: </Typography><Typography variant="caption" sx={{color:'yellow'}}>{tps.toFixed(0)} TPS</Typography></Grid>
                    }
                    {solConversion && 
                        <Grid item xs={4} sx={{textAlign:'center'}}><Typography variant="caption">SOL/USDC: </Typography><Typography variant="caption" sx={{color:'yellow'}}>${solConversion.toFixed(2)}</Typography></Grid>
                    }
                    {timestamp && 
                        <Grid item xs={4} sx={{textAlign:'center'}}><Typography variant="caption">Timestamp: </Typography><Typography variant="caption" sx={{color:'yellow'}}>{timestamp}</Typography></Grid>
                    }
                </Grid>
            </Box>
            <Grid container spacing={1} >
                {verifiedCollectionArray && verifiedCollectionArray.map((featured: any, key: number) => (
                    <>
                        {(!GRAPE_ART_TYPE && (featured?.enabled && featured?.discover)) ?
                            <MarketplaceComponentView featured={featured} />
                            :
                            <>
                                {GRAPE_ART_TYPE === featured?.address &&
                                    <MarketplaceComponentView featured={featured} span={12} />
                                }
                            </>
                        }
                    </>
                ))}
            </Grid>
        </>
    );
}