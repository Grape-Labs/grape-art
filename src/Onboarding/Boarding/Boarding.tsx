import * as React from 'react';

import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';

import { CollectionCaptureView } from './CollectionCapture';

import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletDialogProvider, WalletMultiButton } from '@solana/wallet-adapter-material-ui';
import { CollectionBoardingInfo, useListingRequest } from 'grape-art-listing-request';
import { AnchorProvider } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { BOARDING_PROGRAM_CONFIG } from '../../utils/grapeTools/constants';

const steps = ['Tell us about your mint', 'Submit proposal to Governance'];

export function BoardingView(this: any, props: any) {
    const [activeStep, setActiveStep] = React.useState(0);
    const [skipped, setSkipped] = React.useState(new Set<number>());
    const { publicKey, connect } = useWallet();
    const { connection } = useConnection();
    const anchorWallet = useAnchorWallet();

    const { requestListingRefund, requestListing } = useListingRequest(
        anchorWallet ? new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions()) : null,
        new PublicKey(BOARDING_PROGRAM_CONFIG)
    );
    const [collectionBoardingInfo, setCollectionBoardingInfo] = React.useState<CollectionBoardingInfo>({
        name: '',
        enabled: true,
        collection_update_authority: PublicKey.default,
        auction_house: PublicKey.default,
        meta_data_url: '',
        vanity_url: '',
        token_type: '',
        listing_requester: PublicKey.default,
        request_type: 0
    });
    const isStepOptional = (step: number) => {
        return step === 1 || step === 2 || step === 3;
    };

    const isStepSkipped = (step: number) => {
        return skipped.has(step);
    };

    const handleNext = () => {
        console.log('handle next step');

        let newSkipped = skipped;
        if (isStepSkipped(activeStep)) {
            newSkipped = new Set(newSkipped.values());
            newSkipped.delete(activeStep);
        }
        if (activeStep + 1 == steps.length) {
            if (requestListing) {
                console.log(collectionBoardingInfo);
                requestListing(collectionBoardingInfo)
                    .then(([tx, listingAddress]) => {
                        console.log(`Listing address ${tx} created with transaction ${listingAddress}`);
                    })
                    .catch((e) => console.log(`There was an error requesting the listing. Error message:${e.message}`));
            }
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

    function getSetter<T>(field: string) {
        return (value: T) => {
            return setCollectionBoardingInfo((old) => {
                return {
                    ...old,
                    [field]: value,
                };
            });
        };
    }

    return (
        <Box sx={{ width: '100%', mt: 6 }}>
            {publicKey ? (
                <>
                    <Stepper activeStep={activeStep}>
                        {steps.map((label, index) => {
                            const stepProps: { completed?: boolean } = {};
                            const labelProps: {
                                optional?: React.ReactNode;
                            } = {};
                            if (isStepOptional(index)) {
                                labelProps.optional = <Typography variant="caption">Optional</Typography>;
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
                            <Typography sx={{ mt: 2, mb: 1 }}>All steps completed - you&apos;re finished</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                                <Box sx={{ flex: '1 1 auto' }} />
                                <Button onClick={handleReset}>Reset</Button>
                            </Box>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                                Step {activeStep + 1}
                            </Typography>

                            {activeStep === 0 && (
                                <CollectionCaptureView
                                    setGovernance={getSetter('governance')}
                                    setName={getSetter('name')}
                                    setVanityUrl={getSetter('vanity_url')}
                                    setMetaDataUrl={getSetter('meta_data_url')}
                                    setVerifiedCollectionAddress={getSetter('verified_collection_address')}
                                    setAuctionHouse={getSetter('auction_house')}
                                    setTokenType={getSetter('token_type')}
                                    setUpdateAuthority={getSetter('collection_update_authority')}
                                    setCreatorAddress={getSetter('creator_address')}
                                    setRequestType={getSetter('request_type')}
                                />
                            )}
                            {activeStep === 1 && <></>}

                            <Box
                                sx={{
                                    p: 1,
                                    m: 1,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    maxWidth: '100%',
                                    background: 'rgba(0,0,0,0.5)',
                                    borderRadius: '24px',
                                }}
                            >
                                <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
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
            ) : (
                <>
                    <WalletDialogProvider className="grape-wallet-provider">
                        <WalletMultiButton className="grape-wallet-button">
                            Connect your wallet to begin
                        </WalletMultiButton>
                    </WalletDialogProvider>
                </>
            )}
        </Box>
    );
}
