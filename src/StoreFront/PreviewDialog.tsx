
import * as React from 'react';
import { styled } from '@mui/material/styles';

import { Link, useLocation, NavLink } from 'react-router-dom';

import {
    Button,
    ButtonGroup,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Typography,
    LinearProgress,
    Hidden
} from '@mui/material';

import { PreviewView } from "../Preview/Preview";
import { useTranslation } from 'react-i18next';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuDialogActions-root': {
      padding: theme.spacing(1),
    },
}));

export default function PreviewDialogView(props: any){
    const [loading, setLoading] = React.useState(false);
    const [selectedMint, setSelectedMint] = React.useState(props.mint);
    const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);
    const [open, setOpenDialog] = React.useState(false);
    const floorPrice = props.floorPrice || null;
    const { t, i18n } = useTranslation();

    const handleClickOpenPreviewDialog = (mint:string) => {
        setSelectedMint(null);
        if (mint){
            setSelectedMint(mint)
            // if (selectedMint)
            setOpenPreviewDialog(true);
        }
    };
    
    const handleClosePreviewDialog = () => {
        setOpenPreviewDialog(false);
    };



    return (
        <>
            <Tooltip title='View Mint'>
                <Button
                    onClick={() => handleClickOpenPreviewDialog(selectedMint)}
                    size="large"
                    color='inherit'
                    variant="text"
                    sx={{
                        borderRadius: '17px',
                        color:'white'
                    }}
                >
                    View
                </Button>
            </Tooltip>
            <BootstrapDialog 
                fullWidth={true}
                maxWidth={"lg"}
                open={openPreviewDialog} onClose={handleClosePreviewDialog}
                PaperProps={{
                    style: {
                        background: '#13151C',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px'
                    }
                }}
            >
                <DialogContent>
                    <PreviewView handlekey={selectedMint} floorPrice={floorPrice || null} />
                </DialogContent>
                <DialogActions>
                    <Button variant="text" onClick={handleClosePreviewDialog}>{t('Close')}</Button>
                </DialogActions>
            </BootstrapDialog>
        </>
    );
}