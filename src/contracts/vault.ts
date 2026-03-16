import {
  Address,
  FeeBumpTransaction,
  Transaction,
  TransactionBuilder,
  scValToNative,
  xdr
} from "@stellar/stellar-sdk";

import { StellarClient } from "../client/stellarClient";
import { WalletConnector } from "../wallet/walletConnector";
import { buildContractCallTransaction, toScVal } from "../utils/transactionBuilder";

export type VaultContractMethodNames = {
  deposit: string;
  withdraw: string;
  balance: string;
  claimRewards: string;
};

export type VaultContractOptions = {
  methods?: Partial<VaultContractMethodNames>;
};

export class VaultContract {
  readonly contractId: string;
  private readonly client: StellarClient;
  private readonly wallet?: WalletConnector;
  private readonly methods: VaultContractMethodNames;

  constructor(params: {
    client: StellarClient;
    contractId: string;
    wallet?: WalletConnector;
    options?: VaultContractOptions;
  }) {
    this.client = params.client;
    this.contractId = params.contractId;
    this.wallet = params.wallet;
    this.methods = {
      deposit: "deposit",
      withdraw: "withdraw",
      balance: "balance",
      claimRewards: "claim_rewards",
      ...params.options?.methods
    };
  }

  async deposit(params: { amount: bigint; from?: string }): Promise<unknown> {
    return this.sendContractCall({
      source: params.from,
      method: this.methods.deposit,
      args: [
        Address.fromString(await this.getSourcePublicKey(params.from)).toScVal(),
        toScVal(params.amount)
      ]
    });
  }

  async withdraw(params: { amount: bigint; from?: string }): Promise<unknown> {
    return this.sendContractCall({
      source: params.from,
      method: this.methods.withdraw,
      args: [
        Address.fromString(await this.getSourcePublicKey(params.from)).toScVal(),
        toScVal(params.amount)
      ]
    });
  }

  async claimRewards(params?: { from?: string }): Promise<unknown> {
    return this.sendContractCall({
      source: params?.from,
      method: this.methods.claimRewards,
      args: [Address.fromString(await this.getSourcePublicKey(params?.from)).toScVal()]
    });
  }

  async getBalance(params: { account?: string }): Promise<unknown> {
    const publicKey = params.account ?? (this.wallet ? await this.wallet.getPublicKey() : undefined);
    if (!publicKey) {
      throw new Error("account is required when no wallet connector is provided");
    }

    const sourceAccount = await this.client.getAccount(publicKey);
    const tx = buildContractCallTransaction({
      sourceAccount,
      networkPassphrase: this.client.networkPassphrase,
      contractId: this.contractId,
      method: this.methods.balance,
      args: [Address.fromString(publicKey)]
    });

    const sim = await this.client.simulateTransaction(tx);
    if (!isSimSuccess(sim)) {
      throw new Error("Simulation failed");
    }

    const retval = (sim as any).result?.retval as xdr.ScVal | undefined;
    return retval ? scValToNative(retval) : null;
  }

  private async getSourcePublicKey(source?: string): Promise<string> {
    if (source) return source;
    if (!this.wallet) {
      throw new Error("wallet connector is required for signing transactions");
    }
    return this.wallet.getPublicKey();
  }

  private async sendContractCall(params: {
    source?: string;
    method: string;
    args?: Array<xdr.ScVal>;
  }): Promise<unknown> {
    if (!this.wallet) {
      throw new Error("wallet connector is required for signing transactions");
    }

    const publicKey = await this.getSourcePublicKey(params.source);
    const sourceAccount = await this.client.getAccount(publicKey);

    const tx = buildContractCallTransaction({
      sourceAccount,
      networkPassphrase: this.client.networkPassphrase,
      contractId: this.contractId,
      method: params.method,
      args: params.args ?? []
    });

    const sim = await this.client.simulateTransaction(tx);
    if (!isSimSuccess(sim)) {
      throw new Error("Simulation failed");
    }

    const prepared = await this.client.prepareTransaction(tx);
    const signedXdr = await this.wallet.signTransaction(
      prepared.toXDR(),
      this.client.networkPassphrase
    );
    const signedTx = TransactionBuilder.fromXDR(
      signedXdr,
      this.client.networkPassphrase
    ) as Transaction | FeeBumpTransaction;

    return this.client.sendTransaction(signedTx);
  }
}

function isSimSuccess(sim: unknown): boolean {
  return Boolean(sim) && !(sim as any).error && Boolean((sim as any).result);
}
