import { StellarClient } from "../client/stellarClient";
import { WalletConnector } from "../wallet/walletConnector";
export type VaultContractMethodNames = {
    deposit: string;
    withdraw: string;
    balance: string;
    claimRewards: string;
};
export type VaultContractOptions = {
    methods?: Partial<VaultContractMethodNames>;
};
export declare class VaultContract {
    readonly contractId: string;
    private readonly client;
    private readonly wallet?;
    private readonly methods;
    constructor(params: {
        client: StellarClient;
        contractId: string;
        wallet?: WalletConnector;
        options?: VaultContractOptions;
    });
    deposit(params: {
        amount: bigint;
        from?: string;
    }): Promise<unknown>;
    withdraw(params: {
        amount: bigint;
        from?: string;
    }): Promise<unknown>;
    claimRewards(params?: {
        from?: string;
    }): Promise<unknown>;
    getBalance(params: {
        account?: string;
    }): Promise<unknown>;
    private getSourcePublicKey;
    private sendContractCall;
}
//# sourceMappingURL=vault.d.ts.map