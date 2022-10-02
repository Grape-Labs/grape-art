import * as React from 'react';
import { styled, alpha, makeStyles } from '@mui/material/styles';
import { Link, useLocation, NavLink } from 'react-router-dom';
import Color from 'color';
import { GRAPE_PROFILE, GRAPE_COLLECTION, GRAPE_COLLECTIONS_DATA, FEATURED_DAO_ARRAY } from '../utils/grapeTools/constants';

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

import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ShareSocialURL from '../utils/grapeTools/ShareUrl';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import { CardActionArea } from '@mui/material';

import { useTranslation } from 'react-i18next';

export default function MarketplaceView(props: any) {
    const [verifiedCollectionArray, setVerifiedCollectionArray] = React.useState(null);
    const { t, i18n } = useTranslation();

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

    React.useEffect(() => { 
        fetchVerifiedCollection("");
    }, []);

    const color = '#fff';

    return (
        <Grid container spacing={2} sx={{mt:6}}>
            {verifiedCollectionArray && verifiedCollectionArray.map((featured: any, key: number) => (
                <>
                    {featured?.enabled && featured?.discover &&
                    <Grid item xs={12} sm={6}>
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
                }
                </>
            ))}
        </Grid>
    );
}