"use client";

import { useEffect, useCallback, useState } from "react";
import { useAccount, useBalance, useReadContract, useSendTransaction, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, erc20Abi } from "viem";
import { X, Loader2, AlertTriangle, CheckCircle, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import StockChart from "@/components/StockChart";
import StockLogo from "@/components/StockLogo";
import ConnectWalletButton from "@/components/ConnectWalletButton";

interface StockToken {
  symbol: string;
  name: string;
  sector: string;
  tokenAddress: string;
  logo?: string;
}

interface MarketQuote {
  symbol: string;
  price: number;
  changePercent: number;
  sparkline: number[];
}

interface TradeModalProps {
  token: StockToken;
  quote: MarketQuote | undefined;
  initialMode?: "buy" | "sell";
  onClose: () => void;
}

const CHAIN_EXPLORER = "https://robinhoodchain.blockscout.com";
const ROBINHOOD_CHAIN_ID = 4663;

export default function TradeModal({ token, quote, initialMode = "buy", onClose }: TradeModalProps) {
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: ethBalance } = useBalance({ address });
  const { data: tokenBalance } = useReadContract({
    address: token.tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [mode, setMode] = useState<"buy" | "sell">(initialMode);
  const [amount, setAmount] = useState("");
  const [quoteState, setQuoteState] = useState<{
    toAmount: string;
    toAmountMin: string;
    tx: { to: string; data: string; value: string };
    approvalAddress: string | null;
    loading: boolean;
    error: string | null;
  }>({ toAmount: "", toAmountMin: "", tx: { to: "", data: "", value: "" }, approvalAddress: null, loading: false, error: null });
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>(undefined);
  const [swapHash, setSwapHash] = useState<`0x${string}` | undefined>(undefined);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approvalHash });
  const { isLoading: isSwapping } = useWaitForTransactionReceipt({ hash: swapHash });

  const tokenAddr = token.tokenAddress as `0x${string}`;
  const tokenDecimals = 18;
  const isBuy = mode === "buy";
  const price = quote?.price ?? 0;
  const usdValue = amount ? parseFloat(amount) * price : 0;

  const fetchQuote = useCallback(async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !address || !tokenAddr) {
      setQuoteState((p) => ({ ...p, toAmount: "", toAmountMin: "", tx: { to: "", data: "", value: "" }, approvalAddress: null, loading: false, error: null }));
      return;
    }
    setQuoteState((p) => ({ ...p, loading: true, error: null }));
    try {
      const fromToken = isBuy ? "ETH" : tokenAddr;
      const toToken = isBuy ? tokenAddr : "ETH";
      const decimals = isBuy ? 18 : tokenDecimals;
      const fromAmount = BigInt(Math.floor(amt * 10 ** decimals)).toString();

      const url = `/api/swap?action=quote&fromChain=4663&toChain=4663&fromToken=${fromToken}&toToken=${toToken}&fromAmount=${fromAmount}&fromAddress=${address}&slippage=0.5`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.transactionRequest) throw new Error("No swap route found — token pair may have low liquidity");

      const toDecimals = isBuy ? tokenDecimals : 18;
      setQuoteState({
        toAmount: formatUnits(BigInt(data.estimate?.toAmount || "0"), toDecimals),
        toAmountMin: formatUnits(BigInt(data.estimate?.toAmountMin || "0"), toDecimals),
        tx: {
          to: data.transactionRequest.to,
          data: data.transactionRequest.data,
          value: data.transactionRequest.value || "0x0",
        },
        approvalAddress: data.estimate?.approvalAddress || null,
        loading: false,
        error: null,
      });
    } catch (err) {
      setQuoteState((p) => ({ ...p, loading: false, error: err instanceof Error ? err.message : "Failed to get quote" }));
    }
  }, [amount, address, tokenAddr, isBuy, tokenDecimals]);

  useEffect(() => {
    const t = setTimeout(fetchQuote, 500);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  const needsApproval = !isBuy && quoteState.approvalAddress !== null;

  const handleTrade = async () => {
    if (!address || !quoteState.tx.to) return;
    setNotification(null);
    setApprovalHash(undefined);
    setSwapHash(undefined);

    try {
      if (chainId && chainId !== ROBINHOOD_CHAIN_ID) {
        setNotification({ type: "error", message: "Switch your wallet to Robinhood Chain before trading" });
        return;
      }

      if (isBuy && ethBalance && quoteState.tx.value) {
        const required = BigInt(quoteState.tx.value);
        if (ethBalance.value < required) {
          setNotification({
            type: "error",
            message: `Insufficient ETH on Robinhood Chain — you need at least ${Number(formatUnits(required, ethBalance.decimals)).toFixed(6)} ETH`,
          });
          return;
        }
      }

      if (needsApproval) {
        setNotification({ type: "info", message: `Approving ${token.symbol} for sale...` });
        const approval = await writeContractAsync({
          address: tokenAddr,
          abi: [{
            name: "approve",
            type: "function",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          }],
          functionName: "approve",
          args: [quoteState.approvalAddress as `0x${string}`, BigInt(Math.floor(parseFloat(amount) * 10 ** tokenDecimals))],
        });
        setApprovalHash(approval);
        setNotification({ type: "info", message: `Approve ${token.symbol} — waiting for confirmation...` });
        await new Promise((r) => setTimeout(r, 3000));
      }

      setNotification({ type: "info", message: `${isBuy ? "Buying" : "Selling"} ${amount} ${isBuy ? token.symbol : `${token.symbol} → ETH`}...` });
      const hash = await sendTransactionAsync({
        to: quoteState.tx.to as `0x${string}`,
        data: quoteState.tx.data as `0x${string}`,
        value: BigInt(quoteState.tx.value || "0"),
        chainId: ROBINHOOD_CHAIN_ID,
      });
      setSwapHash(hash);
      setNotification({
        type: "success",
        message: `Transaction submitted! Tx: ${hash.slice(0, 10)}...${hash.slice(-6)}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setNotification({
        type: "error",
        message: msg.includes("rejected") ? "Transaction rejected by user" : msg.slice(0, 100),
      });
    }
  };

  const positive = (quote?.changePercent ?? 0) >= 0;
  const isProcessing = isApproving || isSwapping;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--foreground)] z-10" aria-label="Close">
          <X size={18} />
        </button>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <StockLogo symbol={token.symbol} logo={token.logo} size={44} />
              <div>
                <div className="text-sm font-bold text-[var(--foreground)]">{token.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-bold text-[var(--foreground)]">
                    {price ? `$${price.toFixed(2)}` : "—"}
                  </span>
                  {quote && (
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
                      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {positive ? "+" : ""}{quote.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[9px] px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-400 live-blink" />
              LIVE
            </span>
          </div>

          {/* Chart */}
          <StockChart symbol={token.symbol} height={220} defaultRange="3mo" live />

          {/* Buy/Sell toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("buy")}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                isBuy ? "bg-green-500 text-black" : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              Buy {token.symbol}
            </button>
            <button
              onClick={() => setMode("sell")}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                !isBuy ? "bg-red-500 text-black" : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              Sell {token.symbol}
            </button>
          </div>

          {!isConnected ? (
            <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-xl flex flex-col items-center gap-3">
              <p className="text-sm text-[var(--foreground)] font-medium mb-1">Connect your wallet to trade</p>
              <p className="text-xs text-[var(--text-muted)] mb-2">Real on-chain execution on Robinhood Chain</p>
              <ConnectWalletButton compact />
            </div>
          ) : chainId && chainId !== ROBINHOOD_CHAIN_ID ? (
            <div className="text-center py-6 border border-dashed border-red-500/30 rounded-xl flex flex-col items-center gap-3">
              <AlertTriangle size={20} className="text-yellow-400" />
              <p className="text-sm text-[var(--foreground)] font-medium">Wrong network</p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                Your wallet is on chain {chainId}. Stock Token trades execute on Robinhood Chain (4663) with real ETH.
              </p>
              <button
                onClick={async () => {
                  try {
                    await switchChainAsync({ chainId: ROBINHOOD_CHAIN_ID });
                  } catch {}
                }}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Switch to Robinhood Chain
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Amount */}
              <div>
                <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
                  {isBuy ? `Amount to spend (ETH)` : `Amount to sell (${token.symbol})`}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/40 transition-all disabled:opacity-50"
                  />
                  <span className="px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs font-bold text-[var(--accent)]">
                    {isBuy ? "ETH" : token.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {usdValue > 0 ? `≈ $${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                  </span>
                  {isBuy && ethBalance && (
                    <button
                      onClick={() => setAmount(formatUnits(ethBalance.value, ethBalance.decimals))}
                      className="text-[9px] text-[var(--text-muted)] hover:text-[var(--accent)]"
                    >
                      Balance: {Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)} ETH
                    </button>
                  )}
                  {!isBuy && tokenBalance && (
                    <button
                      onClick={() => setAmount(formatUnits(tokenBalance, tokenDecimals))}
                      className="text-[9px] text-[var(--text-muted)] hover:text-[var(--accent)]"
                    >
                      Balance: {Number(formatUnits(tokenBalance, tokenDecimals)).toFixed(4)} {token.symbol}
                    </button>
                  )}
                </div>
              </div>

              {/* Receive */}
              <div>
                <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
                  {isBuy ? "You receive" : "You receive"}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 px-3 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)]">
                    {quoteState.loading ? (
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <Loader2 size={12} className="animate-spin" /> Loading...
                      </span>
                    ) : quoteState.toAmount ? (
                      <span className="font-semibold">
                        {Number(quoteState.toAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {isBuy ? token.symbol : "ETH"}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">0.0</span>
                    )}
                  </div>
                  <span className="px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs font-bold text-[var(--accent)]">
                    {isBuy ? token.symbol : "ETH"}
                  </span>
                </div>
              </div>

              {/* Errors / details */}
              {quoteState.error && (
                <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                  <AlertTriangle size={10} />
                  {quoteState.error}
                </div>
              )}

              {quoteState.toAmountMin && !quoteState.loading && (
                <div className="text-[9px] text-[var(--text-muted)] space-y-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-3">
                  <div className="flex justify-between">
                    <span>Expected output</span>
                    <span className="text-[var(--foreground)]">{Number(quoteState.toAmount).toFixed(6)} {isBuy ? token.symbol : "ETH"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum received</span>
                    <span>{Number(quoteState.toAmountMin).toFixed(6)} {isBuy ? token.symbol : "ETH"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slippage</span>
                    <span>0.5%</span>
                  </div>
                  {needsApproval && <div className="flex justify-between text-yellow-400"><span>Step 1</span><span>Approve {token.symbol}</span></div>}
                  <div className="flex justify-between text-green-400"><span>Step {needsApproval ? 2 : 1}</span><span>Confirm transaction</span></div>
                </div>
              )}

              {approvalHash && (
                <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">
                  <Loader2 size={10} className="animate-spin" />
                  <span>Approving {token.symbol}... <a href={`${CHAIN_EXPLORER}/tx/${approvalHash}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">View</a></span>
                </div>
              )}

              {swapHash && (
                <div className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
                  <CheckCircle size={10} />
                  <span>Transaction submitted! <a href={`${CHAIN_EXPLORER}/tx/${swapHash}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">View on Blockscout</a></span>
                </div>
              )}

              {notification && !approvalHash && !swapHash && (
                <div className={`flex items-center gap-1.5 text-[10px] rounded-lg px-3 py-2 ${
                  notification.type === "error" ? "text-red-400 bg-red-500/10" :
                  notification.type === "success" ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"
                }`}>
                  {notification.type === "error" ? <AlertTriangle size={10} /> : <Loader2 size={10} className="animate-spin" />}
                  {notification.message}
                </div>
              )}

              <button
                onClick={handleTrade}
                disabled={!amount || parseFloat(amount) <= 0 || !quoteState.tx.to || quoteState.loading || isProcessing}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isBuy ? "bg-green-500 text-black hover:opacity-90" : "bg-red-500 text-black hover:opacity-90"
                }`}
              >
                {isApproving ? <><Loader2 size={14} className="animate-spin" /> Approving...</> :
                 isSwapping ? <><Loader2 size={14} className="animate-spin" /> Executing...</> :
                 quoteState.loading ? <><Loader2 size={14} className="animate-spin" /> Fetching quote...</> :
                 !amount || parseFloat(amount) <= 0 ? "Enter an amount" :
                 isBuy ? `Buy ${token.symbol} with ETH` : `Sell ${token.symbol} for ETH`}
              </button>

              <p className="text-[8px] text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
                Executes on Robinhood Chain (4663) via LI.FI · Powered by KyberSwap
                <ExternalLink size={8} />
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
