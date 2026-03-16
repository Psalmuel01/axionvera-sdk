export type AxionveraNetwork = "testnet" | "mainnet";
export type NetworkConfig = {
    network: AxionveraNetwork;
    rpcUrl: string;
    networkPassphrase: string;
};
export declare function getNetworkPassphrase(network: AxionveraNetwork): string;
export declare function getDefaultRpcUrl(network: AxionveraNetwork): string;
export declare function resolveNetworkConfig(input?: {
    network?: AxionveraNetwork;
    rpcUrl?: string;
    networkPassphrase?: string;
}): NetworkConfig;
//# sourceMappingURL=networkConfig.d.ts.map