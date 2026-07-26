import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MerchantLayout from "../MerchantLayout";
import {
  fetchMerchantOrders,
  OfframpOrder,
} from "@/services/merchantApi";

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-200",
  seen: "bg-sky-500/20 text-sky-200",
  completed: "bg-teal-500/20 text-teal-200",
  cancelled: "bg-rose-500/20 text-rose-200",
};

const MerchantOrders: React.FC = () => {
  const [orders, setOrders] = useState<OfframpOrder[]>([]);
  const [status, setStatus] = useState<string>("all");
  const [side, setSide] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const result = await fetchMerchantOrders({
      status: status === "all" ? undefined : status,
      side: side === "all" ? undefined : side,
    });
    setOrders(result?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [status, side]);

  return (
    <MerchantLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Orders</h1>
          <p className="text-sm text-slate-400">
            Buy and sell exchange requests from Heyorova users.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px] bg-slate-900 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="seen">Seen</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={side} onValueChange={setSide}>
            <SelectTrigger className="w-[120px] bg-slate-900 border-white/10">
              <SelectValue placeholder="Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Buy & sell</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">NGN</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {loading ? "Loading…" : "No orders yet."}
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr
                key={order.id}
                className="cursor-pointer border-t border-white/5 bg-slate-950/40 hover:bg-white/5"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <td className="px-4 py-3 font-medium text-white">{order.order_number}</td>
                <td className="px-4 py-3 uppercase text-slate-300">{order.side}</td>
                <td className="px-4 py-3 text-slate-300">
                  {order.amount_token} {order.token_symbol}
                  <span className="block text-xs text-slate-500">{order.chain}</span>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  ₦{Number(order.amount_ngn).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColor[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MerchantLayout>
  );
};

export default MerchantOrders;
