import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MerchantLayout from "../MerchantLayout";
import {
  deleteMerchantRate,
  fetchMerchantAssets,
  fetchMerchantRates,
  MerchantAsset,
  MerchantRate,
  saveMerchantRate,
} from "@/services/merchantApi";

const MerchantRates: React.FC = () => {
  const [rates, setRates] = useState<MerchantRate[]>([]);
  const [assets, setAssets] = useState<MerchantAsset[]>([]);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [chain, setChain] = useState("");
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [rateResult, assetResult] = await Promise.all([
      fetchMerchantRates(),
      fetchMerchantAssets(),
    ]);
    setRates(rateResult || []);
    setAssets((assetResult || []).filter((a) => a.is_active));
  };

  useEffect(() => {
    load();
  }, []);

  const onAssetPick = (value: string) => {
    const [symbol, assetChain] = value.split("|");
    setTokenSymbol(symbol || "");
    setChain(assetChain || "");
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenSymbol || !chain || !buyRate || !sellRate) {
      toast.error("Select an asset and enter buy/sell rates");
      return;
    }
    setSaving(true);
    const result = await saveMerchantRate({
      token_symbol: tokenSymbol,
      chain,
      buy_rate_ngn: Number(buyRate),
      sell_rate_ngn: Number(sellRate),
    });
    setSaving(false);
    if (result) {
      toast.success("Rate saved — users will see this in the app");
      setBuyRate("");
      setSellRate("");
      load();
    }
  };

  const onDelete = async (id: number) => {
    const ok = await deleteMerchantRate(id);
    if (ok) {
      toast.success("Rate deleted");
      load();
    }
  };

  return (
    <MerchantLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Token → Naira rates</h1>
        <p className="text-sm text-slate-400">
          Buy rate: user buys crypto with NGN. Sell rate: user sells crypto for NGN.
        </p>
      </div>

      <form
        onSubmit={onSave}
        className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-2 xl:grid-cols-5"
      >
        <div className="space-y-1 xl:col-span-2">
          <Label>Supported asset</Label>
          <select
            className="flex h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
            value={tokenSymbol && chain ? `${tokenSymbol}|${chain}` : ""}
            onChange={(e) => onAssetPick(e.target.value)}
          >
            <option value="">Select asset</option>
            {assets.map((asset) => (
              <option key={asset.id} value={`${asset.token_symbol}|${asset.chain}`}>
                {asset.token_symbol} · {asset.chain}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Buy rate (NGN)</Label>
          <Input type="number" step="0.01" value={buyRate} onChange={(e) => setBuyRate(e.target.value)} placeholder="1650" className="bg-slate-950 border-white/10" />
        </div>
        <div className="space-y-1">
          <Label>Sell rate (NGN)</Label>
          <Input type="number" step="0.01" value={sellRate} onChange={(e) => setSellRate(e.target.value)} placeholder="1600" className="bg-slate-950 border-white/10" />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={saving} className="w-full">
            Save rate
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Buy (NGN)</th>
              <th className="px-4 py-3">Sell (NGN)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No rates yet. Add supported assets first, then set rates.
                </td>
              </tr>
            )}
            {rates.map((rate) => (
              <tr key={rate.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-white">
                  {rate.token_symbol}
                  <span className="block text-xs text-slate-500">{rate.chain}</span>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  ₦{Number(rate.buy_rate_ngn).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  ₦{Number(rate.sell_rate_ngn).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {rate.is_active ? "Active" : "Paused"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => onDelete(rate.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MerchantLayout>
  );
};

export default MerchantRates;
