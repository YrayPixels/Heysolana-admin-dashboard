import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MerchantLayout from "../MerchantLayout";
import {
  deleteMerchantAsset,
  fetchMerchantAssets,
  MerchantAsset,
  saveMerchantAsset,
} from "@/services/merchantApi";

const MerchantAssets: React.FC = () => {
  const [assets, setAssets] = useState<MerchantAsset[]>([]);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [chain, setChain] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const result = await fetchMerchantAssets();
    setAssets(result || []);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenSymbol || !chain) {
      toast.error("Token symbol and chain are required");
      return;
    }
    setSaving(true);
    const result = await saveMerchantAsset({
      token_symbol: tokenSymbol,
      token_name: tokenName || undefined,
      chain,
      contract_address: contractAddress || undefined,
    });
    setSaving(false);
    if (result) {
      toast.success("Asset saved");
      setTokenSymbol("");
      setTokenName("");
      setChain("");
      setContractAddress("");
      load();
    }
  };

  const onDelete = async (id: number) => {
    const ok = await deleteMerchantAsset(id);
    if (ok) {
      toast.success("Asset deleted");
      load();
    }
  };

  return (
    <MerchantLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Supported assets</h1>
        <p className="text-sm text-slate-400">
          List the tokens and chains you can exchange for users.
        </p>
      </div>

      <form
        onSubmit={onSave}
        className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-2 xl:grid-cols-5"
      >
        <div className="space-y-1">
          <Label>Token symbol</Label>
          <Input value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} placeholder="USDT" className="bg-slate-950 border-white/10" />
        </div>
        <div className="space-y-1">
          <Label>Token name</Label>
          <Input value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="Tether USD" className="bg-slate-950 border-white/10" />
        </div>
        <div className="space-y-1">
          <Label>Chain</Label>
          <Input value={chain} onChange={(e) => setChain(e.target.value)} placeholder="ethereum / bsc / tron" className="bg-slate-950 border-white/10" />
        </div>
        <div className="space-y-1">
          <Label>Contract (optional)</Label>
          <Input value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} placeholder="0x…" className="bg-slate-950 border-white/10" />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={saving} className="w-full">
            Add asset
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Chain</th>
              <th className="px-4 py-3">Contract</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No assets yet. Add USDT on ethereum/bsc to start.
                </td>
              </tr>
            )}
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-white">
                  {asset.token_symbol}
                  {asset.token_name && (
                    <span className="block text-xs text-slate-500">{asset.token_name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">{asset.chain}</td>
                <td className="max-w-[220px] truncate px-4 py-3 text-slate-400">
                  {asset.contract_address || "—"}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {asset.is_active ? "Active" : "Paused"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => onDelete(asset.id)}>
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

export default MerchantAssets;
