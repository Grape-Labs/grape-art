import React, { useMemo, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, Provider, BN } from '@project-serum/anchor';
import Squads, { getTxPDA, DEFAULT_MULTISIG_PROGRAM_ID } from '@sqds/sdk';
import axios from 'axios';
import { WalletContextState } from '@solana/wallet-adapter-react';

import { 
    SQUADS_API, 
} from '../utils/grapeTools/constants';


export interface SquadsRpcReponse {
    publicKey: PublicKey;
    threshold: number;
    authorityIndex: number;
    transactionIndex: number;
    msChangeIndex: number;
    bump: number;
    createKey: PublicKey;
    allowExternalExecute: boolean;
    keys: PublicKey[];
}

interface SquadsApiResponse {
    createdTime: string;
    creator: string;
    descText: string;
    name: string;
}

interface SquadsApiResponseWithAddress extends SquadsApiResponse {
    msAddress: string;
}

// interface TransactionApiResponse extends TransactionAccount {}

export interface Squad extends SquadsApiResponseWithAddress, SquadsRpcReponse {}

export interface Transaction {
    transaction: {
        MSKEY: string;
        TXKEY: string;
        createdTime: string;
        description: string;
        executedTime: string;
        title: string;
        trackMembers: string;
        trackThreshold: string;
        txnBuffer: Buffer;
        type: string;
        approved: string[];
        rejected: string[];
        status: string;
    };
    votes: ''; //todo:;
}

export const TRANSACTIONS_PER_PAGE = 5;

export const useSquads = (connection: Connection, wallet: WalletContextState, pubkey: PublicKey) => {
    const [squads, setSquads] = React.useState<Squad[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [fetched, setFetched] = React.useState(false);
    const sqds = useMemo(() => new Squads({ connection: connection, wallet: wallet }), [connection, wallet]);

    const getMultisigsByUser = async (): Promise<Squad[] | null> => {
        try {
            const { data: userSquads } = await axios.get<string[]>(
                `${SQUADS_API}/members?address=${pubkey || wallet.publicKey}`
            );
            if (userSquads) {
                const squadsApiMetadata = await Promise.all(
                    userSquads.map((address) =>
                        axios
                            .get<SquadsApiResponse>(`${SQUADS_API}/squads?address=${address}`)
                            .then<SquadsApiResponseWithAddress>((res) => ({ msAddress: address, ...res.data }))
                    )
                );

                const squadsOnChainMetadata = await sqds.getMultisigs([
                    ...squadsApiMetadata.map((k) => new PublicKey(k.msAddress)),
                ]);

                const collatedSquads: Squad[] = squadsApiMetadata.map((ms: SquadsApiResponseWithAddress) => ({
                    ...ms,
                    ...squadsOnChainMetadata.find((s) => s.publicKey.toBase58() === ms.msAddress),
                }));

                return collatedSquads;
            }

            setSquads([]);
            return [];
        } catch (e) {
            console.log({ e });
            return null;
        }
    };

    const getTransactions = async (squad: Squad, startIndex: number): Promise<Transaction[]> => {
        const pdas = getTxPDAs(squad, startIndex);

        const requests = pdas.map((pda) =>
            axios.get(`${SQUADS_API}/transactions?address=${pda.toBase58()}&useProd=true`)
        );

        const results = await Promise.allSettled(requests);

        const data = results.map((result, i) => ({ pda: pdas[i], result }));

        const offChainTransactionMetadataArray = [];

        for (const { pda, result } of data) {
            if (result.status === 'fulfilled') {
                const meta = result.value.data;
                if (meta && meta.transaction.createdTime) {
                    if (!meta.transaction.TXKEY) {
                        offChainTransactionMetadataArray.push({ ...meta, TXKEY: pda });
                    } else {
                        offChainTransactionMetadataArray.push(meta);
                    }
                }
            } else {
                console.log(result.reason);
            }
        }

        const onChainTransactionMetadataArray = await sqds.getTransactions(pdas).catch(console.log);

        return offChainTransactionMetadataArray.map((tx, i) => {
            if (!onChainTransactionMetadataArray) return tx;
            const onChainMeta = onChainTransactionMetadataArray
                .filter((o) => o)
                .find((t) => t.publicKey.toBase58() === tx.transaction.TXKEY);

            const combinedTransaction: Transaction = {
                votes: tx.votes,
                transaction: {
                    ...tx.transaction,
                    approved: onChainMeta && onChainMeta.approved.map((k) => k.toBase58()),
                    rejected: onChainMeta && onChainMeta.rejected.map((k) => k.toBase58()),
                    status: onChainMeta && Object.keys(onChainMeta.status)[0],
                    id: i,
                },
            };

            return combinedTransaction;
        });
    };

    const getTxPDAs = (ms: Squad, page: number) => {
        const pdas = [];

        const firstTransactionIndex = ms.transactionIndex - (page + 1) * TRANSACTIONS_PER_PAGE + 1;
        const lastTransactionIndex = ms.transactionIndex - page * TRANSACTIONS_PER_PAGE + 1;

        for (let i = firstTransactionIndex; i <= lastTransactionIndex; i++) {
            const [txPDA] = getTxPDA(ms.publicKey, new BN(i), DEFAULT_MULTISIG_PROGRAM_ID);
            pdas.push(txPDA);
        }
        return pdas;
    };

    React.useEffect(() => {
        if (!fetched) {
            try {
                (async () => {
                    setLoading(true);

                    const multisigs = await getMultisigsByUser();
                    if (multisigs) {
                        setSquads(multisigs);
                    }
                })();

                setLoading(false);
                setFetched(true);
            } catch (error) {
                console.log({ error });

                setLoading(false);
                setFetched(true);
            }
        }
    }, [connection, wallet]);

    return { squads, loading, getTransactions, TRANSACTIONS_PER_PAGE };
};