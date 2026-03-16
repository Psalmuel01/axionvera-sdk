"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetworkPassphrase = getNetworkPassphrase;
exports.getDefaultRpcUrl = getDefaultRpcUrl;
exports.resolveNetworkConfig = resolveNetworkConfig;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const DEFAULT_RPC_URLS = {
    testnet: "https://soroban-testnet.stellar.org",
    mainnet: "https://soroban-mainnet.stellar.org"
};
function getNetworkPassphrase(network) {
    switch (network) {
        case "testnet":
            return stellar_sdk_1.Networks.TESTNET;
        case "mainnet":
            return stellar_sdk_1.Networks.PUBLIC;
    }
}
function getDefaultRpcUrl(network) {
    return DEFAULT_RPC_URLS[network];
}
function resolveNetworkConfig(input) {
    const network = input?.network ?? "testnet";
    const networkPassphrase = input?.networkPassphrase ?? getNetworkPassphrase(network);
    const rpcUrl = input?.rpcUrl ?? getDefaultRpcUrl(network);
    return { network, rpcUrl, networkPassphrase };
}
