import React from "react"
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';

import { 
    Dialog,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    DialogTitle,
    DialogContent,
    Avatar,
    Button,
    Tooltip, 
    CardActionArea 
} from '@mui/material';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IosShareIcon from '@mui/icons-material/IosShare';

import {
    EmailShareButton,
    FacebookShareButton,
    RedditShareButton,
    TelegramShareButton,
    TumblrShareButton,
    TwitterShareButton,
    ViberShareButton,
    WhatsappShareButton,
  } from "react-share";

  import {
    EmailIcon,
    FacebookIcon,
    FacebookMessengerIcon,
    HatenaIcon,
    InstapaperIcon,
    LineIcon,
    LinkedinIcon,
    LivejournalIcon,
    MailruIcon,
    OKIcon,
    PinterestIcon,
    PocketIcon,
    RedditIcon,
    TelegramIcon,
    TumblrIcon,
    TwitterIcon,
    ViberIcon,
    VKIcon,
    WeiboIcon,
    WhatsappIcon,
    WorkplaceIcon
  } from "react-share";

  import { useTranslation } from 'react-i18next';

  const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
  }));

export default function ShareSocialURL(props:any){
    const shareUrl = props.url;
    const title = props.title;
    const fontSize = props.fontSize || '20px';

    const [open_snackbar, setSnackbarState] = React.useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const handleCopyClick = () => {
        enqueueSnackbar(`Copied!`,{ variant: 'success' });
    };

    const handleNavigatorShare = () => {
        navigator.share({
            title: title,
            text: title,
            url: shareUrl
        });
    }

    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (value) => {
        setOpen(false);
    };

    const { t, i18n } = useTranslation();

    return (
        <>
            <Tooltip title={t('Share')}>
                <Button size="small" variant="text" onClick={handleClickOpen}
                    sx={{borderRadius:'24px', color:'white'}}
                >
                    <IosShareIcon sx={{fontSize:{fontSize}}} />
                </Button> 
            </Tooltip>
            <BootstrapDialog 
                maxWidth={"md"}
                open={open} onClose={handleClose}
                PaperProps={{
                    style: {
                        background: '#13151C',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px'
                    }
                    }}
                >
                <DialogTitle>
                {t('Share')}
                </DialogTitle>
                <DialogContent>
                    <List sx={{ pt: 0 }}>
                        <ListItem>
                            <Button sx={{borderRadius:'24px',p:0,m:0,background:'none',textTransform:'none'}}>
                                <CopyToClipboard 
                                    text={shareUrl} 
                                    onCopy={handleCopyClick}
                                    >
                                    <ListItemButton sx={{borderRadius:'24px', color:'white'}}>
                                        
                                            <ListItemAvatar>
                                                <Avatar sx={{ width: 32, height: 32 }}><ContentCopyIcon fontSize="small" sx={{color:'white'}} /></Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary={'Copy'} />
                                        
                                    </ListItemButton>
                                </CopyToClipboard> 
                            </Button>
                        </ListItem>
                        {(navigator.share !== undefined) &&
                            <ListItem>
                                <Button sx={{borderRadius:'24px',p:0,m:0,background:'none',textTransform:'none'}}>
                                    <CopyToClipboard 
                                        text={shareUrl} 
                                        onCopy={handleNavigatorShare}
                                        >
                                        <ListItemButton sx={{borderRadius:'24px', color:'white'}}>
                                            
                                                <ListItemAvatar>
                                                    <Avatar sx={{ width: 32, height: 32 }}><IosShareIcon fontSize="small" sx={{color:'white'}} /></Avatar>
                                                </ListItemAvatar>
                                                <ListItemText primary={'Native Share'} />
                                            
                                        </ListItemButton>
                                    </CopyToClipboard> 
                                </Button>
                            </ListItem>
                        }
                        <ListItem>  
                            <EmailShareButton
                                    url={''}
                                    subject={title}
                                    body={shareUrl}
                                >
                                <ListItemButton sx={{borderRadius:'24px'}}
                                >   
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32 }}><EmailIcon size={32} round /></Avatar>
                                    </ListItemAvatar>
                                    
                                <ListItemText primary={'Email'} />
                                    
                                </ListItemButton>
                            </EmailShareButton>
                        </ListItem>
                        <ListItem>
                            <TwitterShareButton
                                    url={shareUrl}
                                    title={title}
                                >
                                <ListItemButton sx={{borderRadius:'24px'}}
                                >   
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32 }}><TwitterIcon size={32} round /></Avatar>
                                    </ListItemAvatar>
                                    
                                <ListItemText primary={'Twitter'} />
                                    
                                </ListItemButton>
                            </TwitterShareButton>
                        </ListItem>
                        <ListItem>
                            <TelegramShareButton
                                    title={title}
                                    url={shareUrl}
                                >
                                <ListItemButton sx={{borderRadius:'24px'}}
                                >   
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32 }}><TelegramIcon size={32} round /></Avatar>
                                    </ListItemAvatar>
                                    
                                <ListItemText primary={'Telegram'} />
                                    
                                </ListItemButton>
                            </TelegramShareButton>
                        </ListItem>
                        <ListItem>
                            <FacebookShareButton
                                    url={shareUrl}
                                    quote={title}
                                >
                                <ListItemButton sx={{borderRadius:'24px'}}
                                >   
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32 }}><FacebookIcon size={32} round /></Avatar>
                                    </ListItemAvatar>
                                    
                                <ListItemText primary={'Facebook'} />
                                    
                                </ListItemButton>
                            </FacebookShareButton>
                        </ListItem>

                        <ListItem>
                            <ViberShareButton
                                    title={title}
                                    url={shareUrl}
                                >
                                <ListItemButton sx={{borderRadius:'24px'}}
                                >   
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32 }}><ViberIcon size={32} round /></Avatar>
                                    </ListItemAvatar>
                                    
                                <ListItemText primary={'Viber'} />
                                    
                                </ListItemButton>
                            </ViberShareButton>
                        </ListItem>

                        <ListItem>
                            <WhatsappShareButton
                                    title={title}
                                    url={shareUrl}
                                >
                                <ListItemButton sx={{borderRadius:'24px'}}
                                >   
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32 }}><WhatsappIcon size={32} round /></Avatar>
                                    </ListItemAvatar>
                                    
                                <ListItemText primary={'WhatsApp'} />
                                    
                                </ListItemButton>
                            </WhatsappShareButton>
                        </ListItem>

                    </List>
                </DialogContent>  
            </BootstrapDialog>
        </>
        
    ); 
}