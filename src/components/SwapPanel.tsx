"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useSendTransaction, useWriteContract, useBalance, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatUnits } from "viem";
import { ArrowUpDown, ArrowDown, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface StockToken {
  symbol: string;
  name: string;
  tokenAddress: string;
}

interface SwapPanelProps {
  tokens: StockToken[];
  tokenPrices: Record<string, number>;
}

export default function SwapPanel({ tokens, tokenPrices }: SwapPanelProps) {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  const [sellToken, setSellToken] = useState("ETH");
  const [buyToken, setBuyToken] = useState(tokens[0]?.symbol || "NVDA");
  const [sellAmount, setSellAmount] = useState("");
  const [quote, setQuote] = useState<{
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

  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approvalHash });
  const { isLoading: isSwapping } = useWaitForTransactionReceipt({ hash: swapHash });

  const buyTokenAddr = tokens.find((t) => t.symbol === buyToken)?.tokenAddress || "";

  const fetchQuote = useCallback(async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0 || !address || !buyTokenAddr) {
      setQuote({ toAmount: "", toAmountMin: "", tx: { to: "", data: "", value: "" }, approvalAddress: null, loading: false, error: null });
      return;
    }
    setQuote((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const fromToken = sellToken === "ETH" ? "ETH" : (tokens.find((t) => t.symbol === sellToken)?.tokenAddress || "");
      const toToken = buyToken === "ETH" ? "ETH" : buyTokenAddr;
      const fromAmount = sellToken === "ETH" ? parseEther(sellAmount).toString() : "0";

      if (!toToken) throw new Error("Invalid token selection");

      const url = `/api/swap?action=quote&fromChain=4663&toChain=4663&fromToken=${fromToken}&toToken=${toToken}&fromAmount=${fromAmount}&fromAddress=${address}&slippage=0.5`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.transactionRequest) throw new Error("No swap route found");

      setQuote({
        toAmount: data.estimate?.toAmount || "0",
        toAmountMin: data.estimate?.toAmountMin || "0",
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
      setQuote((prev) => ({ ...prev, loading: false, error: err instanceof Error ? err.message : "Failed to get quote" }));
    }
  }, [sellAmount, address, buyTokenAddr, sellToken, buyToken, tokens]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const needsApproval = sellToken !== "ETH" && quote.approvalAddress;

  const handleSwap = async () => {
    if (!address || !quote.tx.to) return;
    setNotification(null);
    setApprovalHash(undefined);
    setSwapHash(undefined);

    try {
      if (needsApproval) {
        setNotification({ type: "info", message: `Approving ${sellToken}...` });
        const sellAddr = tokens.find((t) => t.symbol === sellToken)?.tokenAddress;
        if (!sellAddr) throw new Error("Token address not found");
        const approvalData = await writeContractAsync({
          address: sellAddr as `0x${string}`,
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
          args: [quote.approvalAddress as `0x${string}`, BigInt(quote.tx.value || "0")],
        });
        setApprovalHash(approvalData);
        setNotification({ type: "info", message: "Approval submitted. Waiting for confirmation..." });
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      setNotification({ type: "info", message: `Swapping ${sellAmount} ${sellToken} for ${buyToken}...` });
      const hash = await sendTransactionAsync({
        to: quote.tx.to as `0x${string}`,
        data: quote.tx.data as `0x${string}`,
        value: BigInt(quote.tx.value || "0"),
      });
      setSwapHash(hash);
      setNotification({ type: "success", message: `Swap submitted! Tx: ${hash.slice(0, 10)}...${hash.slice(-6)}` });
      setSellAmount("");
      setQuote({ toAmount: "", toAmountMin: "", tx: { to: "", data: "", value: "" }, approvalAddress: null, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Swap failed";
      setNotification({ type: "error", message: msg });
    }
  };

  if (!isConnected) return null;

  const parsedBuyAmount = quote.toAmount
    ? parseFloat(formatUnits(BigInt(quote.toAmount), 18)).toFixed(6)
    : sellAmount
      ? (parseFloat(sellAmount) * (tokenPrices[buyToken] || 0) / (tokenPrices[sellToken] || 1)).toFixed(6)
      : "0";

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3 flex items-center gap-1.5">
        <ArrowUpDown size={12} className="text-[var(--accent)]" />
        Real Swap
      </h3>

      {/* You Pay */}
      <div className="space-y-3">
        <div>
          <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">You Pay</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/40 transition-all"
            />
            <select
              value={sellToken}
              onChange={(e) => setSellToken(e.target.value)}
              className="px-2 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/40 transition-all"
            >
              <option value="ETH">ETH</option>
              {tokens.slice(0, 20).map((t) => (
                <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
              ))}
            </select>
          </div>
          {sellToken === "ETH" && ethBalance && (
            <div className="text-[9px] text-[var(--text-muted)] mt-1">
              Balance: {Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)} ETH
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <ArrowDown size={14} className="text-[var(--text-muted)]" />
        </div>

        {/* You Receive */}
        <div>
          <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">You Receive</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)]">
              {parsedBuyAmount}
            </div>
            <select
              value={buyToken}
              onChange={(e) => setBuyToken(e.target.value)}
              className="px-2 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/40 transition-all"
            >
              {sellToken === "ETH" ? (
                tokens.slice(0, 20).map((t) => (
                  <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                ))
              ) : (
                <>
                  <option value="ETH">ETH</option>
                  {tokens.filter((t) => t.symbol !== sellToken).slice(0, 19).map((t) => (
                    <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        {/* Quote Info */}
        {quote.loading && (
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
            <Loader2 size={10} className="animate-spin" />
            Fetching best price...
          </div>
        )}

        {quote.error && (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            <AlertTriangle size={10} />
            {quote.error}
          </div>
        )}

        {quote.toAmountMin && !quote.loading && (
          <div className="text-[9px] text-[var(--text-muted)] space-y-1">
            <div className="flex justify-between">
              <span>Minimum received</span>
              <span>{parseFloat(formatUnits(BigInt(quote.toAmountMin), 18)).toFixed(6)} {buyToken}</span>
            </div>
            <div className="flex justify-between">
              <span>Slippage</span>
              <span>0.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Route</span>
              <span>LI.FI + KyberSwap</span>
            </div>
          </div>
        )}

        {/* Approval status */}
        {approvalHash && (
          <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">
            <Loader2 size={10} className="animate-spin" />
            Approving {sellToken}...
          </div>
        )}

        {swapHash && (
          <div className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
            <CheckCircle size={10} />
            <a
              href={`https://robinhoodchain.blockscout.com/tx/${swapHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View transaction on Blockscout
            </a>
          </div>
        )}

        {/* Notification */}
        {notification && !approvalHash && !swapHash && (
          <div className={`flex items-center gap-1.5 text-[10px] rounded-lg px-3 py-2 ${
            notification.type === "error" ? "text-red-400 bg-red-500/10" :
            notification.type === "success" ? "text-green-400 bg-green-500/10" :
            "text-yellow-400 bg-yellow-500/10"
          }`}>
            {notification.type === "error" ? <AlertTriangle size={10} /> : <Loader2 size={10} className="animate-spin" />}
            {notification.message}
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!sellAmount || parseFloat(sellAmount) <= 0 || !quote.tx.to || isApproving || isSwapping}
          className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-black text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {(isApproving || isSwapping) ? (
            <><Loader2 size={12} className="animate-spin" /> Processing...</>
          ) : (
            `Swap ${sellAmount || "0"} ${sellToken} for ${buyToken}`
          )}
        </button>

        <p className="text-[8px] text-[var(--text-muted)] text-center">
          Powered by LI.FI + KyberSwap on Robinhood Chain
        </p>
      </div>
    </div>
  );
}
