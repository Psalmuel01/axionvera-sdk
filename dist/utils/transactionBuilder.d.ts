import { Account, Address, Transaction, xdr } from "@stellar/stellar-sdk";
export type ContractCallArg = xdr.ScVal | Address | string | number | bigint | boolean | null;
export type BuildContractCallParams = {
    sourceAccount: Account;
    networkPassphrase: string;
    contractId: string;
    method: string;
    args?: ContractCallArg[];
    fee?: number;
    timeoutInSeconds?: number;
};
export declare function toScVal(arg: ContractCallArg): xdr.ScVal;
export declare function buildContractCallOperation(params: {
    contractId: string;
    method: string;
    args?: ContractCallArg[];
}): xdr.Operation;
export declare function buildContractCallTransaction(params: BuildContractCallParams): Transaction;
//# sourceMappingURL=transactionBuilder.d.ts.map