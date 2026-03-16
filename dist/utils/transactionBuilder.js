"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toScVal = toScVal;
exports.buildContractCallOperation = buildContractCallOperation;
exports.buildContractCallTransaction = buildContractCallTransaction;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
function toScVal(arg) {
    if (arg === null) {
        return stellar_sdk_1.xdr.ScVal.scvVoid();
    }
    if (arg instanceof stellar_sdk_1.Address) {
        return arg.toScVal();
    }
    if (typeof arg === "string") {
        try {
            return stellar_sdk_1.Address.fromString(arg).toScVal();
        }
        catch {
            return (0, stellar_sdk_1.nativeToScVal)(arg);
        }
    }
    if (typeof arg === "number") {
        return (0, stellar_sdk_1.nativeToScVal)(arg);
    }
    if (typeof arg === "bigint") {
        return (0, stellar_sdk_1.nativeToScVal)(arg, { type: "i128" });
    }
    if (typeof arg === "boolean") {
        return (0, stellar_sdk_1.nativeToScVal)(arg);
    }
    return arg;
}
function buildContractCallOperation(params) {
    const contract = new stellar_sdk_1.Contract(params.contractId);
    const scVals = (params.args ?? []).map(toScVal);
    return contract.call(params.method, ...scVals);
}
function buildContractCallTransaction(params) {
    const operation = buildContractCallOperation({
        contractId: params.contractId,
        method: params.method,
        args: params.args
    });
    const fee = (params.fee ?? 100000).toString();
    const timeoutInSeconds = params.timeoutInSeconds ?? 60;
    return new stellar_sdk_1.TransactionBuilder(params.sourceAccount, {
        fee,
        networkPassphrase: params.networkPassphrase
    })
        .addOperation(operation)
        .setTimeout(timeoutInSeconds)
        .build();
}
