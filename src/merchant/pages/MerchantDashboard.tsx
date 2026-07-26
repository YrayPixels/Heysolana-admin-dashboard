import React, { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MerchantLayout from "../MerchantLayout";
import {
  fetchMerchantAnalytics,
  MerchantAnalytics,
} from "@/services/merchantApi";

const Stat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

const formatNgn = (n: number) =>
  `₦${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const MerchantDashboard: React.FC = () => {
  const [data, setData] = useState<MerchantAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const result = await fetchMerchantAnalytics();
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const summary = data?.summary;

  return (
    <MerchantLayout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">
            Track exchange volume, open orders, and supported assets.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open orders" value={((summary?.orders_pending || 0) + (summary?.orders_seen || 0))} hint={`${summary?.orders_pending || 0} pending`} />
        <Stat label="Completed" value={summary?.orders_completed || 0} />
        <Stat label="Completed volume" value={formatNgn(summary?.completed_volume_ngn || 0)} />
        <Stat label="Open volume" value={formatNgn(summary?.open_volume_ngn || 0)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Buy orders" value={summary?.buy_orders || 0} />
        <Stat label="Sell orders" value={summary?.sell_orders || 0} />
        <Stat label="Active assets" value={summary?.active_assets || 0} />
        <Stat label="Active rates" value={summary?.active_rates || 0} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-white">Orders · last 7 days</h2>
            <Button size="sm" variant="ghost" onClick={() => navigate("/orders")}>
              View orders
            </Button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.last_7_days || []}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#14b8a6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <h2 className="mb-4 font-medium text-white">Completed by asset</h2>
          <div className="space-y-3">
            {(data?.by_asset || []).length === 0 && (
              <p className="text-sm text-slate-400">No completed orders yet.</p>
            )}
            {(data?.by_asset || []).map((row) => (
              <div
                key={`${row.token_symbol}-${row.chain}`}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-white">
                    {row.token_symbol} · {row.chain}
                  </p>
                  <p className="text-xs text-slate-400">{row.orders} orders</p>
                </div>
                <p className="text-sm text-teal-300">{formatNgn(Number(row.volume_ngn))}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
};

export default MerchantDashboard;
