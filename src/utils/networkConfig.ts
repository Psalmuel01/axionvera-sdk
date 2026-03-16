import { Networks } from "@stellar/stellar-sdk";

export type AxionveraNetwork = "testnet" | "mainnet";

export type NetworkConfig = {
  network: AxionveraNetwork;
  rpcUrl: string;
  networkPassphrase: string;
};

const DEFAULT_RPC_URLS: Record<AxionveraNetwork, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://soroban-mainnet.stellar.org"
};

export function getNetworkPassphrase(network: AxionveraNetwork): string {
  switch (network) {
    case "testnet":
      return Networks.TESTNET;
    case "mainnet":
      return Networks.PUBLIC;
  }
}

export function getDefaultRpcUrl(network: AxionveraNetwork): string {
  return DEFAULT_RPC_URLS[network];
}

export function resolveNetworkConfig(input?: {
  network?: AxionveraNetwork;
  rpcUrl?: string;
  networkPassphrase?: string;
}): NetworkConfig {
  const network = input?.network ?? "testnet";
  const networkPassphrase =
    input?.networkPassphrase ?? getNetworkPassphrase(network);
  const rpcUrl = input?.rpcUrl ?? getDefaultRpcUrl(network);

  return { network, rpcUrl, networkPassphrase };
}
