import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MerchantLayout from "../MerchantLayout";
import {
  deleteMerchantWallet,
  fetchMerchantWallets,
  MerchantWallet,
  saveMerchantWallet,
} from "@/services/merchantApi";

const MerchantWallets: React.FC = () => {
  const [wallets, setWallets] = useState<MerchantWallet[]>([]);
  const [chain, setChain] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const result = await fetchMerchantWallets();
    setWallets(result || []);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chain || !address) {
      toast.error("Chain and address are required");
      return;
    }
    setSaving(true);
    const result = await saveMerchantWallet({
      chain,
      token_symbol: tokenSymbol || undefined,
      address,
      label: label || undefined,
    });
    setSaving(false);
    if (result) {
      toast.success("Wallet saved");
      setChain("");
      setTokenSymbol("");
      setAddress("");
      setLabel("");
      load();
    }
  };

  const onDelete = async (id: number) => {
    const ok = await deleteMerchantWallet(id);
    if (ok) {
      toast.success("Wallet deleted");
      load();
    }
  };

  return (
    <MerchantLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Receive wallets</h1>
        <p className="text-sm text-slate-400">
          Addresses shown to users when they sell crypto on other chains.
        </p>
      </div>

      <form
        onSubmit={onSave}
        className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-2 xl:grid-cols-5"
      >
        <div className="space-y-1">
          <Label>Chain</Label>
          <Input value={chain} onChange={(e) => setChain(e.target.value)} placeholder="ethereum" className="bg-slate-950 border-white/10" />
        </div>
        <div className="space-y-1">
          <Label>Token (optional)</Label>
          <Input value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} placeholder="USDT" className="bg-slate-950 border-white/10" />
        </div>
        <div className="space-y-1 xl:col-span-1">
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x… / T…" className="bg-slate-950 border-white/10" />
        </div>
        <div className="space-y-1">
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Main ETH wallet" className="bg-slate-950 border-white/10" />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={saving} className="w-full">
            Add wallet
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Chain</th>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {wallets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No wallets yet. Add receive addresses for each chain you support.
                </td>
              </tr>
            )}
            {wallets.map((wallet) => (
              <tr key={wallet.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-white">{wallet.chain}</td>
                <td className="px-4 py-3 text-slate-300">{wallet.token_symbol || "Any"}</td>
                <td className="max-w-[280px] truncate px-4 py-3 font-mono text-xs text-slate-300">
                  {wallet.address}
                </td>
                <td className="px-4 py-3 text-slate-400">{wallet.label || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => onDelete(wallet.id)}>
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

export default MerchantWallets;
