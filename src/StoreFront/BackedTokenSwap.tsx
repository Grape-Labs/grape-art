import * as React from 'react';
import * as anchor from "@project-serum/anchor";
import { Provider, AnchorProvider } from "@project-serum/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BN } from "bn.js";

import {
    Swap,
    useTokenBonding,
    useTokenBondingKey,
    useTokenMetadata,
  } from "@strata-foundation/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getAssociatedAccountBalance, SplTokenMetadata } from "@strata-foundation/spl-utils";
import { PublicKey, Connection } from '@solana/web3.js';
import { Wallet as NodeWallet } from "@project-serum/anchor";
import {useSnackbar} from "notistack";

import {
    Button,
    ButtonGroup,
    CircularProgress,
 } from '@mui/material';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { RPC_CONNECTION } from '../utils/grapeTools/constants';

export default function BackedTokenSwap(props: any) {
    const { setVisible } = useWalletModal();
    const refreshCallback = props.refreshCallback;
    const swapAmount = props.swapAmount || 1;
    const swapFrom = props.swapFrom || '8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA';
    const swapTo = props.swapTo || '4BF5sVW5wRR56cy9XR8NFDQGDy5oaNEFrCHMuwA9sBPd'; 
    const connection = RPC_CONNECTION;
    //const provider = anchor.getProvider();
    const { publicKey } = useWallet();
    const wallet = useWallet();
    const provider = new AnchorProvider(connection, wallet, {});
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const swapUsingStrata = async () => {
        const tokenBondingSdk = await SplTokenBonding.init(provider);
        /*
        tokenBondingSdk.getPricing(
            new PublicKey(swapTo)
        )
        */
       
        enqueueSnackbar(`Generating token bonding PDA`,{ variant: 'info' });

        const mintTokenRef = (await SplTokenCollective.mintTokenRefKey(new PublicKey(swapTo)))[0];
        console.log("mintTokenRef: "+JSON.stringify(mintTokenRef))
        /*
        var { targetAmount } = await tokenBondingSdk.swap({
            baseMint: new PublicKey(swapFrom),
            targetMint: new PublicKey(swapTo),
            baseAmount: swapAmount,
            slippage: 0.05,
          });
        */

        try{
            const tokenBondingKey = (
                await SplTokenBonding.tokenBondingKey(new PublicKey(swapTo))
            )[0];
            const openCollectiveBonding = await tokenBondingSdk.getTokenBonding(
                tokenBondingKey
            );
            
            enqueueSnackbar(`Token Bonding PDA Generated ${tokenBondingKey.toBase58()}, preparing to swap AAA for ${swapAmount} BBB`,{ variant: 'info' });
            
            const signedTransaction = await tokenBondingSdk.buy({
                tokenBonding: tokenBondingKey,
                desiredTargetAmount: swapAmount, //swapAmount
                slippage: 0.05,
            });
            
            const snackprogress = (key:any) => (
                <CircularProgress sx={{padding:'10px'}} />
            );
            const cnfrmkey = enqueueSnackbar(`Confirming transaction`,{ variant: 'info', action:snackprogress, persist: true });
            const latestBlockHash = await connection.getLatestBlockhash();
            /*
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signedTransaction}, 
                'processed'
            );
            */
            closeSnackbar(cnfrmkey);
            
            enqueueSnackbar(`Swap completed`,{ variant: 'success' });

            try{
                if (refreshCallback)
                    refreshCallback();
            }catch(err:any){console.log("ERR: "+err)}
        }catch(e:any){
            closeSnackbar();
            enqueueSnackbar(e.message ? `${e.name}: ${e.message}` : e.name, { variant: 'error' });
        } 

        /*
        await tokenBondingSdk.buy({
            tokenBonding: SplTokenCollective.OPEN_COLLECTIVE_BONDING_ID,
            desiredTargetAmount: 1,
            slippage: 0.05,
        });
        var openBalance = await getAssociatedAccountBalance(
            connection,
            publicKey,
            tokenBondingAcct.baseMint
        );
        */
    }

    const setupStrata = async () => {
        //const tokenCollectiveSdk = await SplTokenCollective.init(new Provider(connection, new NodeWallet(payerServiceAccount), {}));
        
        //const tokenCollectiveSdk = await SplTokenCollective.init(provider);
        //const tokenBondingSdk = await SplTokenBonding.init(provider);
        //const tokenMetadataSdk = await SplTokenMetadata.init(provider);
    }

    React.useEffect(() => {
        setupStrata();
    }, []);

    return (
        <>
            <ButtonGroup
            >
                <Button 
                    onClick={() => {
                        swapUsingStrata();
                    }}
                    sx={{borderTopLeftRadius:'17px',borderBottomLeftRadius:'17px'}}
                >t
                    Get {swapAmount} GAN with Grape
                </Button>
                <Button 
                    component='a'
                    href='https://app.strataprotocol.com/swap/4BF5sVW5wRR56cy9XR8NFDQGDy5oaNEFrCHMuwA9sBPd'
                    target='_blank'
                    sx={{borderTopRightRadius:'17px',borderBottomRightRadius:'17px'}}
                >
                    <OpenInNewIcon fontSize='small' />
                </Button>

                <>{/*
                    {trigger({ mint, connected, onClick, btnProps })}
                    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered trapFocus>
                        <ModalOverlay />
                        <ModalContent borderRadius="xl" shadow="xl">
                        <ModalHeader>Buy More {metadata?.data.symbol}</ModalHeader>
                        <ModalBody minH="500px">
                            {!account && !loadingBonding && (
                            <Alert status="info">
                                Buy is not yet supported for this token
                            </Alert>
                            )}
                            {account && !loadingBonding && tokenBondingKey && (
                            <Swap
                                id={new PublicKey(swapTo)!}
                                onConnectWallet={() => {
                                onClose();
                                setVisible(true);
                                }}
                            />
                            )}
                            {loading && <Spinner />}
                        </ModalBody>
                        </ModalContent>
                    </Modal>
                */}
                </>
            </ButtonGroup>
        </>
    );
}