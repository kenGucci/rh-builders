"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useSendTransaction, useSwitchChain, useWriteContract, useBalance, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { ArrowUpDown, ArrowDown, Loader2, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";

interface StockToken {
  symbol: string;
  tokenAddress: string;
}

interface SwapPanelProps {
  tokens: StockToken[];
}

const TOKEN_DECIMALS: Record<string, number> = {
  NVDA: 18, AAPL: 18, GOOGL: 18, MSFT: 18, AMZN: 18,
  TSLA: 18, META: 18, AMD: 18, QQQ: 18, SPY: 18,
  COIN: 18, PLTR: 18, SOFI: 18, NFLX: 18,
};

const ROBINHOOD_CHAIN_ID = 4663;

export default function SwapPanel({ tokens }: SwapPanelProps) {
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
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

  const getTokenAddress = (symbol: string) => tokens.find((t) => t.symbol === symbol)?.tokenAddress || "";
  const getTokenDecimals = (symbol: string) => TOKEN_DECIMALS[symbol] || 18;

  const buyTokenAddr = getTokenAddress(buyToken);
  const sellTokenAddr = getTokenAddress(sellToken);

  const fetchQuote = useCallback(async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0 || !address || !buyTokenAddr) {
      setQuote((prev) => ({ ...prev, toAmount: "", toAmountMin: "", tx: { to: "", data: "", value: "" }, approvalAddress: null, loading: false, error: null }));
      return;
    }
    setQuote((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const isSellingEth = sellToken === "ETH";
      const fromToken = isSellingEth ? "ETH" : sellTokenAddr;
      const toToken = buyToken === "ETH" ? "ETH" : buyTokenAddr;
      const decimals = isSellingEth ? 18 : getTokenDecimals(sellToken);
      const fromAmount = BigInt(Math.floor(parseFloat(sellAmount) * 10 ** decimals)).toString();

      const url = `/api/swap?action=quote&fromChain=4663&toChain=4663&fromToken=${fromToken}&toToken=${toToken}&fromAmount=${fromAmount}&fromAddress=${address}&slippage=0.5`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.transactionRequest) throw new Error("No swap route found — token pair may have low liquidity");

      const toDecimals = buyToken === "ETH" ? 18 : getTokenDecimals(buyToken);
      const toAmountRaw = data.estimate?.toAmount || "0";
      const toAmountMinRaw = data.estimate?.toAmountMin || "0";

      setQuote({
        toAmount: formatUnits(BigInt(toAmountRaw), toDecimals),
        toAmountMin: formatUnits(BigInt(toAmountMinRaw), toDecimals),
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
  }, [sellAmount, address, buyTokenAddr, sellTokenAddr, sellToken, buyToken]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const needsApproval = sellToken !== "ETH" && quote.approvalAddress !== null;

  const handleSwap = async () => {
    if (!address || !quote.tx.to) return;
    setNotification(null);
    setApprovalHash(undefined);
    setSwapHash(undefined);

    try {
      if (chainId && chainId !== ROBINHOOD_CHAIN_ID) {
        setNotification({ type: "error", message: "Switch your wallet to Robinhood Chain before swapping" });
        return;
      }

      if (sellToken === "ETH" && ethBalance && quote.tx.value) {
        const required = BigInt(quote.tx.value);
        if (ethBalance.value < required) {
          setNotification({ type: "error", message: `Insufficient ETH on Robinhood Chain — you need at least ${Number(formatUnits(required, ethBalance.decimals)).toFixed(6)} ETH` });
          return;
        }
      }

      if (needsApproval) {
        setNotification({ type: "info", message: `Approving ${sellToken} for swap...` });
        const decimals = getTokenDecimals(sellToken);
        const approvalAmount = BigInt(Math.floor(parseFloat(sellAmount) * 10 ** decimals));

        const approval = await writeContractAsync({
          address: sellTokenAddr as `0x${string}`,
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
          args: [quote.approvalAddress as `0x${string}`, approvalAmount],
        });
        setApprovalHash(approval);
        setNotification({ type: "info", message: `Approve ${sellToken} — waiting for confirmation...` });

        const waitApproval = () => new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (!isApproving) { clearInterval(check); resolve(); }
          }, 1000);
          setTimeout(() => { clearInterval(check); resolve(); }, 30000);
        });
        await waitApproval();
        await new Promise((r) => setTimeout(r, 2000));
      }

      setNotification({ type: "info", message: `Swapping ${sellAmount} ${sellToken} for ${buyToken}...` });
      const hash = await sendTransactionAsync({
        to: quote.tx.to as `0x${string}`,
        data: quote.tx.data as `0x${string}`,
        value: BigInt(quote.tx.value || "0"),
        chainId: ROBINHOOD_CHAIN_ID,
      });
      setSwapHash(hash);
      setNotification({
        type: "success",
        message: `Swap submitted! Tx: ${hash.slice(0, 10)}...${hash.slice(-6)}`,
      });
      setSellAmount("");
      setQuote({ toAmount: "", toAmountMin: "", tx: { to: "", data: "", value: "" }, approvalAddress: null, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Swap failed";
      if (msg.includes("User rejected") || msg.includes("rejected")) {
        setNotification({ type: "error", message: "Transaction rejected by user" });
      } else {
        setNotification({ type: "error", message: msg.slice(0, 100) });
      }
    }
  };

  if (!isConnected) return null;

  const isProcessing = isApproving || isSwapping;

  if (chainId && chainId !== ROBINHOOD_CHAIN_ID) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3 flex items-center gap-1.5">
          <ArrowUpDown size={12} className="text-[var(--accent)]" />
          Swap
        </h3>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <AlertTriangle size={18} className="text-yellow-400" />
          <p className="text-xs text-[var(--text-muted)]">
            Your wallet is on chain {chainId}. Swaps execute on Robinhood Chain (4663) with real ETH.
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
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3 flex items-center gap-1.5">
        <ArrowUpDown size={12} className="text-[var(--accent)]" />
        Swap
      </h3>

      <div className="space-y-3">
        {/* You Pay */}
        <div>
          <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">You Pay</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="0.0"
              disabled={isProcessing}
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/40 transition-all disabled:opacity-50"
            />
            <select
              value={sellToken}
              onChange={(e) => {
                const newSell = e.target.value;
                setSellToken(newSell);
                if (newSell === buyToken) setBuyToken(sellToken);
              }}
              disabled={isProcessing}
              className="px-2 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/40 transition-all disabled:opacity-50"
            >
              <option value="ETH">ETH</option>
              {tokens.slice(0, 20).map((t) => (
                <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
              ))}
            </select>
          </div>
          {sellToken === "ETH" && ethBalance && (
            <button
              type="button"
              onClick={() => setSellAmount(formatUnits(ethBalance.value, ethBalance.decimals))}
              className="text-[9px] text-[var(--text-muted)] mt-1 hover:text-[var(--accent)]"
            >
              Balance: {Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)} ETH
            </button>
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
              {quote.loading ? (
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <Loader2 size={10} className="animate-spin" /> Loading...
                </span>
              ) : quote.toAmount ? (
                Number(quote.toAmount).toFixed(6)
              ) : sellAmount && !quote.error ? (
                <span className="text-[var(--text-muted)]">Fetching price...</span>
              ) : (
                "0.0"
              )}
            </div>
            <select
              value={buyToken}
              onChange={(e) => setBuyToken(e.target.value)}
              disabled={isProcessing}
              className="px-2 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/40 transition-all disabled:opacity-50"
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

        {/* Quote Details */}
        {quote.error && (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            <AlertTriangle size={10} />
            {quote.error}
          </div>
        )}

        {quote.toAmountMin && !quote.loading && (
          <div className="text-[9px] text-[var(--text-muted)] space-y-1">
            <div className="flex justify-between">
              <span>Expected output</span>
              <span className="text-[var(--foreground)]">{Number(quote.toAmount).toFixed(6)} {buyToken}</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum received</span>
              <span>{Number(quote.toAmountMin).toFixed(6)} {buyToken}</span>
            </div>
            <div className="flex justify-between">
              <span>Slippage</span>
              <span>0.5%</span>
            </div>
            {needsApproval && (
              <div className="flex justify-between text-yellow-400">
                <span>Step 1</span>
                <span>Approve {sellToken}</span>
              </div>
            )}
            <div className="flex justify-between text-green-400">
              <span>Step {needsApproval ? 2 : 1}</span>
              <span>Confirm swap</span>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {approvalHash && (
          <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">
            <Loader2 size={10} className="animate-spin" />
            <span>
              Approving {sellToken}...
              <a
                href={`https://robinhoodchain.blockscout.com/tx/${approvalHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                View on Blockscout
              </a>
            </span>
          </div>
        )}

        {swapHash && (
          <div className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
            <CheckCircle size={10} />
            <span>
              Swap submitted!
              <a
                href={`https://robinhoodchain.blockscout.com/tx/${swapHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                View on Blockscout
              </a>
            </span>
          </div>
        )}

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
          disabled={
            !sellAmount || parseFloat(sellAmount) <= 0 || !quote.tx.to ||
            quote.loading || isProcessing
          }
          className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-black text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isApproving ? (
            <><Loader2 size={12} className="animate-spin" /> Approving {sellToken}...</>
          ) : isSwapping ? (
            <><Loader2 size={12} className="animate-spin" /> Swapping...</>
          ) : quote.loading ? (
            <><Loader2 size={12} className="animate-spin" /> Fetching quote...</>
          ) : !sellAmount || parseFloat(sellAmount) <= 0 ? (
            "Enter an amount"
          ) : (
            `Swap ${sellAmount} ${sellToken} for ${buyToken}`
          )}
        </button>

        <p className="text-[8px] text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
          Powered by LI.FI + KyberSwap
          <ExternalLink size={8} />
        </p>
      </div>
    </div>
  );
}
