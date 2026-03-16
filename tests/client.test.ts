import { StellarClient } from "../src";

describe("StellarClient", () => {
  test("delegates network calls to the RPC client", async () => {
    const rpc = {
      getHealth: jest.fn().mockResolvedValue({ status: "healthy" }),
      getNetwork: jest.fn().mockResolvedValue({ passphrase: "TESTNET" }),
      getLatestLedger: jest.fn().mockResolvedValue({ sequence: 123 }),
      getAccount: jest.fn(),
      simulateTransaction: jest.fn(),
      prepareTransaction: jest.fn(),
      sendTransaction: jest.fn(),
      getTransaction: jest.fn()
    };

    const client = new StellarClient({
      network: "testnet",
      rpcUrl: "http://localhost:8000",
      networkPassphrase: "Test Network ; February 2017",
      rpcClient: rpc as any
    });

    await expect(client.getHealth()).resolves.toEqual({ status: "healthy" });
    await expect(client.getNetwork()).resolves.toEqual({ passphrase: "TESTNET" });
    await expect(client.getLatestLedger()).resolves.toEqual({ sequence: 123 });

    expect(rpc.getHealth).toHaveBeenCalledTimes(1);
    expect(rpc.getNetwork).toHaveBeenCalledTimes(1);
    expect(rpc.getLatestLedger).toHaveBeenCalledTimes(1);
  });

  test("polls a transaction until it is found", async () => {
    const rpc = {
      getHealth: jest.fn(),
      getNetwork: jest.fn(),
      getLatestLedger: jest.fn(),
      getAccount: jest.fn(),
      simulateTransaction: jest.fn(),
      prepareTransaction: jest.fn(),
      sendTransaction: jest.fn(),
      getTransaction: jest
        .fn()
        .mockResolvedValueOnce({ status: "NOT_FOUND" })
        .mockResolvedValueOnce({ status: "SUCCESS", resultMetaXdr: "AAAA" })
    };

    const client = new StellarClient({
      network: "testnet",
      rpcUrl: "http://localhost:8000",
      networkPassphrase: "Test Network ; February 2017",
      rpcClient: rpc as any
    });

    await expect(
      client.pollTransaction("deadbeef", { timeoutMs: 2_000, intervalMs: 1 })
    ).resolves.toEqual({ status: "SUCCESS", resultMetaXdr: "AAAA" });

    expect(rpc.getTransaction).toHaveBeenCalledTimes(2);
  });
});
