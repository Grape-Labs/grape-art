import * as React from 'react';

import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography
} from '@mui/material'

import { CollectionSnapshotView } from './CollectionSnapshot';
import { CollectionSnapshotByCreatorView } from './CollectionSnapshotByCreator';
import { HolderSnapshotView } from './HolderSnapshot';
import { WhaleSnapshotView } from './WhaleSnapshot';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogProvider, WalletMultiButton } from '@solana/wallet-adapter-material-ui';

import {
  GRAPE_WHITELIST
} from '../../utils/grapeTools/constants';

const steps = [
  'Collection Snapshot by UA/Collection',
  'Collection Snapshot by Creator',
  'Holder Snapshot'];

export function AdminView (this: any, props: any) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());
  const { publicKey, connect } = useWallet();

  const isStepOptional = (step: number) => {
    return step === 3;
  };


  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const isWhitelisted = (address: string) => {
    if (GRAPE_WHITELIST){
      /*
      for (const item of GRAPE_WHITELIST){
        if (address === item)
          return true;
      }
      */
      if (address === GRAPE_WHITELIST)
        return true;
      return false;
    } else{
      return false;
    }
  }

  return (
    <Box sx={{ width: '100%', mt:6 }}>
      {publicKey && isWhitelisted(publicKey.toBase58()) ?
        <>
        <Stepper activeStep={activeStep}>
          {steps.map((label, index) => {
            const stepProps: { completed?: boolean } = {};
            const labelProps: {
              optional?: React.ReactNode;
            } = {};

            if (isStepOptional(index)) {
              labelProps.optional = (
                <Typography variant="caption">Optional</Typography>
              );
            }
            if (isStepSkipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        {activeStep === steps.length ? (
          <React.Fragment>
            <Typography sx={{ mt: 2, mb: 1 }}>
              All steps completed - you&apos;re finished
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleReset}>Reset</Button>
            </Box>
          </React.Fragment>
        ) : (
          <React.Fragment>

              <Typography variant='h5' sx={{ mt: 2, mb: 1 }}>Step {activeStep + 1}</Typography>

              {activeStep === 0 &&
                  <CollectionSnapshotView />
              }
              {activeStep === 1 &&
                  <CollectionSnapshotByCreatorView />
              }
              {activeStep === 2 &&
                  <HolderSnapshotView />
              }

            <Box
              sx={{
                p:1,
                m:1,
                display: 'flex',
                flexDirection: 'row',
                maxWidth: '100%',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '24px'
              }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {isStepOptional(activeStep) && (
                <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }}>
                  Skip
                </Button>
              )}
              <Button onClick={handleNext}>
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </React.Fragment>
        )}
        </>
      :
        <>
            <WalletDialogProvider className="grape-wallet-provider">
                    <WalletMultiButton className="grape-wallet-button">
                      Connect your wallet to begin
                    </WalletMultiButton>
            </WalletDialogProvider>
          </>
      }
    </Box>
  );
}
