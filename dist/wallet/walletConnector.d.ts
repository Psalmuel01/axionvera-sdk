import { Keypair } from "@stellar/stellar-sdk";
export interface WalletConnector {
    getPublicKey(): Promise<string>;
    signTransaction(transactionXdr: string, networkPassphrase: string): Promise<string>;
}
export declare class LocalKeypairWalletConnector implements WalletConnector {
    private readonly keypair;
    constructor(keypair: Keypair);
    getPublicKey(): Promise<string>;
    signTransaction(transactionXdr: string, networkPassphrase: string): Promise<string>;
}
//# sourceMappingURL=walletConnector.d.ts.map