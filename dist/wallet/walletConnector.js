"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalKeypairWalletConnector = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
class LocalKeypairWalletConnector {
    constructor(keypair) {
        this.keypair = keypair;
    }
    async getPublicKey() {
        return this.keypair.publicKey();
    }
    async signTransaction(transactionXdr, networkPassphrase) {
        const tx = stellar_sdk_1.TransactionBuilder.fromXDR(transactionXdr, networkPassphrase);
        tx.sign(this.keypair);
        return tx.toXDR();
    }
}
exports.LocalKeypairWalletConnector = LocalKeypairWalletConnector;
