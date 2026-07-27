const DEFAULT_RPC = "https://rpc.mainnet.chain.robinhood.com";
const RPC_URL = process.env.RPC_URL || DEFAULT_RPC;

let rpcId = 1;

export async function rpcCall<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result as T;
}

export async function getBlockNumber(): Promise<number> {
  const hex = await rpcCall<string>("eth_blockNumber");
  return parseInt(hex, 16);
}

export interface Block {
  number: number;
  timestamp: number;
  transactions: Tx[];
}

export interface Tx {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  input: string;
  blockNumber: number;
}

export async function getBlock(num: number): Promise<Block> {
  const hex = "0x" + num.toString(16);
  const raw = await rpcCall<{
    number: string;
    timestamp: string;
    transactions: Record<string, unknown>[];
  }>("eth_getBlockByNumber", [hex, true]);

  return {
    number: parseInt(raw.number, 16),
    timestamp: parseInt(raw.timestamp, 16),
    transactions: raw.transactions.map((tx) => ({
      hash: tx.hash as string,
      from: (tx.from as string || "").toLowerCase(),
      to: tx.to ? (tx.to as string).toLowerCase() : null,
      value: (tx.value as string) || "0x0",
      input: (tx.input as string) || "0x",
      blockNumber: parseInt(raw.number, 16),
    })),
  };
}

export interface TxReceipt {
  contractAddress: string | null;
  logs: { address: string; topics: string[]; data: string }[];
  status: string;
}

export async function getTxReceipt(hash: string): Promise<TxReceipt | null> {
  try {
    return await rpcCall<TxReceipt>("eth_getTransactionReceipt", [hash]);
  } catch {
    return null;
  }
}

export async function ethCall(to: string, data: string): Promise<string> {
  return rpcCall<string>("eth_call", [{ to, data, gas: "0x30000" }, "latest"]);
}

const SIG_NAME = "0x06fdde03";
const SIG_SYMBOL = "0x95d89b41";
const SIG_TOTAL_SUPPLY = "0x18160ddd";
const SIG_DECIMALS = "0x313ce567";
const SIG_BALANCE_OF = "0x70a08231";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export const KNOWN_TOPICS = {
  TRANSFER: TRANSFER_TOPIC,
};

export async function isErc20(address: string): Promise<boolean> {
  try {
    const result = await ethCall(address, SIG_TOTAL_SUPPLY);
    if (!result || result === "0x" || result === "0x0") return false;
    const symbolResult = await ethCall(address, SIG_SYMBOL);
    if (!symbolResult || symbolResult === "0x" || symbolResult === "0x0") return false;
    return true;
  } catch {
    return false;
  }
}

export async function fetchErc20Meta(address: string) {
  const results = await Promise.allSettled([
    ethCall(address, SIG_NAME),
    ethCall(address, SIG_SYMBOL),
    ethCall(address, SIG_TOTAL_SUPPLY),
    ethCall(address, SIG_DECIMALS),
  ]);

  const [nameRes, symbolRes, supplyRes, decRes] = results;

  const name = nameRes.status === "fulfilled" ? decodeString(nameRes.value) : null;
  const symbol = symbolRes.status === "fulfilled" ? decodeString(symbolRes.value) : null;

  if (!name && !symbol) return null;

  let totalSupply = "0";
  let decimals = 18;

  if (supplyRes.status === "fulfilled" && supplyRes.value !== "0x") {
    totalSupply = BigInt(supplyRes.value).toString();
  }
  if (decRes.status === "fulfilled" && decRes.value !== "0x") {
    decimals = parseInt(decRes.value, 16);
  }

  return { name, symbol, totalSupply, decimals };
}

export async function fetchTokenBalance(tokenAddress: string, holder: string): Promise<string> {
  const data = SIG_BALANCE_OF + holder.slice(2).toLowerCase().padStart(64, "0");
  try {
    const result = await ethCall(tokenAddress, data);
    return BigInt(result).toString();
  } catch {
    return "0";
  }
}

export async function getLogs(
  address: string,
  topics: string[],
  fromBlock: number,
  toBlock: number
): Promise<{ address: string; topics: string[]; data: string; blockNumber: string; transactionHash: string }[]> {
  try {
    return await rpcCall("eth_getLogs", [
      {
        address,
        topics,
        fromBlock: "0x" + fromBlock.toString(16),
        toBlock: "0x" + toBlock.toString(16),
      },
    ]);
  } catch {
    return [];
  }
}

function decodeString(hex: string): string | null {
  if (!hex || hex === "0x") return null;
  try {
    const bytes = hexToBytes(hex);
    if (bytes.length < 64) return null;
    const offset = parseInt(bytesToHex(bytes.slice(0, 32)), 16);
    const length = parseInt(bytesToHex(bytes.slice(32, 64)), 16);
    if (length === 0 || length > 200) return null;
    const strBytes = bytes.slice(64, 64 + length);
    return new TextDecoder().decode(new Uint8Array(strBytes)).replace(/\0/g, "").trim();
  } catch {
    return null;
  }
}

function hexToBytes(hex: string): number[] {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes: number[]): string {
  return "0x" + bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export { RPC_URL, TRANSFER_TOPIC };
