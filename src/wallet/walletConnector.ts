import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";

export interface WalletConnector {
  getPublicKey(): Promise<string>;
  signTransaction(transactionXdr: string, networkPassphrase: string): Promise<string>;
}

export class LocalKeypairWalletConnector implements WalletConnector {
  private readonly keypair: Keypair;

  constructor(keypair: Keypair) {
    this.keypair = keypair;
  }

  async getPublicKey(): Promise<string> {
    return this.keypair.publicKey();
  }

  async signTransaction(
    transactionXdr: string,
    networkPassphrase: string
  ): Promise<string> {
    const tx = TransactionBuilder.fromXDR(transactionXdr, networkPassphrase);
    tx.sign(this.keypair);
    return tx.toXDR();
  }
}
