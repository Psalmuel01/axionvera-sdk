import {
  Account,
  FeeBumpTransaction,
  Keypair,
  Networks,
  rpc,
  Transaction,
  TransactionBuilder
} from "@stellar/stellar-sdk";

import { AxionveraNetwork, resolveNetworkConfig } from "../utils/networkConfig";
import { ConcurrencyConfig, DEFAULT_CONCURRENCY_CONFIG, createConcurrencyControlledClient } from "../utils/concurrencyQueue";

export type StellarClientOptions = {
  network?: AxionveraNetwork;
  rpcUrl?: string;
  networkPassphrase?: string;
  rpcClient?: rpc.Server;
  concurrencyConfig?: Partial<ConcurrencyConfig>;
};

export type TransactionSendResult = {
  hash: string;
  status: string;
  raw: unknown;
};

export class StellarClient {
  readonly network: AxionveraNetwork;
  readonly rpcUrl: string;
  readonly networkPassphrase: string;
  readonly rpc: rpc.Server;
  readonly concurrencyConfig: ConcurrencyConfig;
  private concurrencyEnabled: boolean;

  constructor(options?: StellarClientOptions) {
    const config = resolveNetworkConfig(options);
    this.network = config.network;
    this.rpcUrl = config.rpcUrl;
    this.networkPassphrase = config.networkPassphrase;
    this.concurrencyConfig = {
      ...DEFAULT_CONCURRENCY_CONFIG,
      ...options?.concurrencyConfig
    };
    this.concurrencyEnabled = !!options?.concurrencyConfig;

    if (options?.rpcClient) {
      this.rpc = options.rpcClient;
    } else {
      const allowHttp = this.rpcUrl.startsWith("http://");
      const baseRpc = new rpc.Server(this.rpcUrl, { allowHttp });

      // Apply concurrency control if enabled
      if (this.concurrencyEnabled) {
        this.rpc = createConcurrencyControlledClient(baseRpc, this.concurrencyConfig);
      } else {
        this.rpc = baseRpc;
      }
    }
  }

  async getHealth(): Promise<unknown> {
    return this.rpc.getHealth();
  }

  async getNetwork(): Promise<unknown> {
    return this.rpc.getNetwork();
  }

  async getLatestLedger(): Promise<unknown> {
    return this.rpc.getLatestLedger();
  }

  async getAccount(publicKey: string): Promise<Account> {
    return this.rpc.getAccount(publicKey);
  }

  async simulateTransaction(
    tx: Transaction | FeeBumpTransaction
  ): Promise<rpc.Api.SimulateTransactionResponse> {
    return this.rpc.simulateTransaction(tx);
  }

  async prepareTransaction(tx: Transaction | FeeBumpTransaction): Promise<Transaction> {
    return this.rpc.prepareTransaction(tx);
  }

  async sendTransaction(tx: Transaction | FeeBumpTransaction): Promise<TransactionSendResult> {
    const result = await this.rpc.sendTransaction(tx);
    const hash = (result as any).hash ?? (result as any).id ?? "";
    const status = (result as any).status ?? (result as any).statusText ?? "unknown";
    return { hash, status, raw: result };
  }

  async getTransaction(hash: string): Promise<unknown> {
    return this.rpc.getTransaction(hash);
  }

  async pollTransaction(
    hash: string,
    params?: { timeoutMs?: number; intervalMs?: number }
  ): Promise<unknown> {
    const timeoutMs = params?.timeoutMs ?? 30_000;
    const intervalMs = params?.intervalMs ?? 1_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const res = await this.getTransaction(hash);
      const status = (res as any)?.status;
      if (status && status !== "NOT_FOUND") {
        return res;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(`Timed out waiting for transaction ${hash}`);
  }

  async signWithKeypair(tx: Transaction, keypair: Keypair): Promise<Transaction> {
    tx.sign(keypair);
    return tx;
  }

  static parseTransactionXdr(
    transactionXdr: string,
    networkPassphrase: string
  ): Transaction | FeeBumpTransaction {
    return TransactionBuilder.fromXDR(transactionXdr, networkPassphrase);
  }

  static getDefaultNetworkPassphrase(network: AxionveraNetwork): string {
    switch (network) {
      case "testnet":
        return Networks.TESTNET;
      case "mainnet":
        return Networks.PUBLIC;
    }
  }

  /**
   * Get concurrency control statistics
   */
  getConcurrencyStats() {
    if (!this.concurrencyEnabled) {
      return {
        enabled: false,
        message: 'Concurrency control is not enabled'
      };
    }

    // Try to get stats from the wrapped client if it has the method
    if ('getStats' in this.rpc && typeof this.rpc.getStats === 'function') {
      return {
        enabled: true,
        ...this.rpc.getStats()
      };
    }

    return {
      enabled: true,
      maxConcurrentRequests: this.concurrencyConfig.maxConcurrentRequests,
      queueTimeout: this.concurrencyConfig.queueTimeout,
      message: 'Stats not available from wrapped client'
    };
  }
}
