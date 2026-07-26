import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MerchantLayout from "../MerchantLayout";
import {
  fetchMerchantOrder,
  OfframpOrder,
  updateMerchantOrderStatus,
} from "@/services/merchantApi";

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="grid gap-1 border-b border-white/5 py-3 sm:grid-cols-[160px_1fr]">
    <dt className="text-sm text-slate-400">{label}</dt>
    <dd className="break-all text-sm text-slate-100">{value || "—"}</dd>
  </div>
);

const MerchantOrderDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OfframpOrder | null>(null);
  const [txHash, setTxHash] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const result = await fetchMerchantOrder(id);
    setOrder(result);
    setTxHash(result?.tx_hash || "");
    setNotes(result?.notes || "");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: "seen" | "completed" | "cancelled") => {
    if (!id) return;
    setSaving(true);
    const result = await updateMerchantOrderStatus(id, {
      status,
      tx_hash: txHash || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    if (result) {
      setOrder(result);
      toast.success(`Order marked as ${status}`);
    }
  };

  return (
    <MerchantLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" className="mb-2 px-0" onClick={() => navigate("/orders")}>
            ← Back to orders
          </Button>
          <h1 className="text-2xl font-semibold text-white">
            {order?.order_number || "Order"}
          </h1>
          <p className="text-sm text-slate-400">
            Confirm when you have seen the order, then complete settlement.
          </p>
        </div>
      </div>

      {loading || !order ? (
        <p className="text-slate-400">{loading ? "Loading…" : "Order not found"}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
            <dl>
              <Row label="Status" value={<span className="uppercase">{order.status}</span>} />
              <Row label="Side" value={order.side.toUpperCase()} />
              <Row
                label="Asset"
                value={`${order.amount_token} ${order.token_symbol} on ${order.chain}`}
              />
              <Row label="NGN amount" value={`₦${Number(order.amount_ngn).toLocaleString()}`} />
              <Row label="Rate" value={`₦${Number(order.rate_ngn).toLocaleString()} / ${order.token_symbol}`} />
              <Row
                label={order.side === "sell" ? "User sends to" : "Merchant sends to"}
                value={order.transfer_wallet_address}
              />
              <Row label="User wallet" value={order.user_wallet_address} />
              <Row label="User phone" value={order.user_phone} />
              <Row label="User email" value={order.user_email} />
              <Row
                label="Created"
                value={order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
              />
              <Row
                label="Seen at"
                value={order.seen_at ? new Date(order.seen_at).toLocaleString() : "—"}
              />
              <Row
                label="Completed at"
                value={order.completed_at ? new Date(order.completed_at).toLocaleString() : "—"}
              />
            </dl>
          </div>

          <div className="space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="font-medium text-white">Settlement actions</h2>
            <div className="space-y-2">
              <Label htmlFor="txHash">Tx hash (optional)</Label>
              <Input
                id="txHash"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x… or signature"
                className="bg-slate-950 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal note"
                className="bg-slate-950 border-white/10"
              />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                disabled={saving || !["pending", "seen"].includes(order.status)}
                onClick={() => updateStatus("seen")}
              >
                Mark as seen
              </Button>
              <Button
                variant="secondary"
                disabled={saving || !["pending", "seen"].includes(order.status)}
                onClick={() => updateStatus("completed")}
              >
                Mark completed
              </Button>
              <Button
                variant="destructive"
                disabled={saving || order.status === "completed" || order.status === "cancelled"}
                onClick={() => updateStatus("cancelled")}
              >
                Cancel order
              </Button>
            </div>
          </div>
        </div>
      )}
    </MerchantLayout>
  );
};

export default MerchantOrderDetail;
