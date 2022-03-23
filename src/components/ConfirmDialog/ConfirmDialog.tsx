import React from 'react';
// material ui
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
// zustand
import create from 'zustand';

import { useTranslation } from 'react-i18next';

type ConfirmDialogStore = {
  message: string;
  onSubmit?: () => void;
  close: () => void;
};

const useConfirmDialogStore = create<ConfirmDialogStore>((set) => ({
  message: '',
  onSubmit: undefined,
  close: () => set({ onSubmit: undefined }),
}));

export const confirmDialog = (message: string, onSubmit: () => void) => {
  useConfirmDialogStore.setState({
    message,
    onSubmit,
  });
};

const ConfirmDialog = () => {
  const { t, i18n } = useTranslation();
  const { message, onSubmit, close } = useConfirmDialogStore();
  //return new Promise((res) => {
  return (
    <Dialog open={Boolean(onSubmit)} onClose={close} maxWidth="sm" fullWidth>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <DialogTitle>{t('Confirm the action')}</DialogTitle>
        <IconButton onClick={close}>
          <Close />
        </IconButton>
      </Box>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button color="primary" variant="contained" onClick={close}>
          {t('Cancel')}
        </Button>
        <Button
          color="secondary"
          variant="contained"
          onClick={() => {
            if (onSubmit) {
              onSubmit();
            }
            close();
          }}
        >
          {t('Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
  //});
};

export default ConfirmDialog;