"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultContract = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const transactionBuilder_1 = require("../utils/transactionBuilder");
class VaultContract {
    constructor(params) {
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
    async deposit(params) {
        return this.sendContractCall({
            source: params.from,
            method: this.methods.deposit,
            args: [
                stellar_sdk_1.Address.fromString(await this.getSourcePublicKey(params.from)).toScVal(),
                (0, transactionBuilder_1.toScVal)(params.amount)
            ]
        });
    }
    async withdraw(params) {
        return this.sendContractCall({
            source: params.from,
            method: this.methods.withdraw,
            args: [
                stellar_sdk_1.Address.fromString(await this.getSourcePublicKey(params.from)).toScVal(),
                (0, transactionBuilder_1.toScVal)(params.amount)
            ]
        });
    }
    async claimRewards(params) {
        return this.sendContractCall({
            source: params?.from,
            method: this.methods.claimRewards,
            args: [stellar_sdk_1.Address.fromString(await this.getSourcePublicKey(params?.from)).toScVal()]
        });
    }
    async getBalance(params) {
        const publicKey = params.account ?? (this.wallet ? await this.wallet.getPublicKey() : undefined);
        if (!publicKey) {
            throw new Error("account is required when no wallet connector is provided");
        }
        const sourceAccount = await this.client.getAccount(publicKey);
        const tx = (0, transactionBuilder_1.buildContractCallTransaction)({
            sourceAccount,
            networkPassphrase: this.client.networkPassphrase,
            contractId: this.contractId,
            method: this.methods.balance,
            args: [stellar_sdk_1.Address.fromString(publicKey)]
        });
        const sim = await this.client.simulateTransaction(tx);
        if (!isSimSuccess(sim)) {
            throw new Error("Simulation failed");
        }
        const retval = sim.result?.retval;
        return retval ? (0, stellar_sdk_1.scValToNative)(retval) : null;
    }
    async getSourcePublicKey(source) {
        if (source)
            return source;
        if (!this.wallet) {
            throw new Error("wallet connector is required for signing transactions");
        }
        return this.wallet.getPublicKey();
    }
    async sendContractCall(params) {
        if (!this.wallet) {
            throw new Error("wallet connector is required for signing transactions");
        }
        const publicKey = await this.getSourcePublicKey(params.source);
        const sourceAccount = await this.client.getAccount(publicKey);
        const tx = (0, transactionBuilder_1.buildContractCallTransaction)({
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
        const signedXdr = await this.wallet.signTransaction(prepared.toXDR(), this.client.networkPassphrase);
        const signedTx = stellar_sdk_1.TransactionBuilder.fromXDR(signedXdr, this.client.networkPassphrase);
        return this.client.sendTransaction(signedTx);
    }
}
exports.VaultContract = VaultContract;
function isSimSuccess(sim) {
    return Boolean(sim) && !sim.error && Boolean(sim.result);
}
