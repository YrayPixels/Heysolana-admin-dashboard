import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownUp,
  Coins,
  DollarSign,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import GlassCard from "@/components/ui-custom/GlassCard";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  getTransactionMetrics,
  type TransactionMetrics,
  type TransactionMetricsCluster,
  type TransactionMetricsDays,
} from "@/services/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-US");

const clusterOptions: Array<{ label: string; value: TransactionMetricsCluster }> = [
  { label: "Mainnet", value: "mainnet" },
  { label: "Devnet", value: "devnet" },
  { label: "All", value: "all" },
];

const dayOptions: Array<{ label: string; value: TransactionMetricsDays }> = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "1Y", value: 365 },
];

function formatDateLabel(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function normalizeMetrics(metrics: TransactionMetrics | null): TransactionMetrics | null {
  if (!metrics) return null;

  return {
    ...metrics,
    summary: {
      tx_count: Number(metrics.summary?.tx_count ?? 0),
      total_input_usd: Number(metrics.summary?.total_input_usd ?? 0),
      total_output_usd: Number(metrics.summary?.total_output_usd ?? 0),
      total_fee_usd: Number(metrics.summary?.total_fee_usd ?? 0),
    },
    by_day: (metrics.by_day ?? []).map((row) => ({
      ...row,
      count: Number(row.count ?? 0),
      volume_usd: Number(row.volume_usd ?? 0),
      fee_usd: Number(row.fee_usd ?? 0),
    })),
    by_type: (metrics.by_type ?? []).map((row) => ({
      ...row,
      count: Number(row.count ?? 0),
      volume_usd: Number(row.volume_usd ?? 0),
      fee_usd: Number(row.fee_usd ?? 0),
    })),
    by_cluster: (metrics.by_cluster ?? []).map((row) => ({
      ...row,
      count: Number(row.count ?? 0),
      volume_usd: Number(row.volume_usd ?? 0),
    })),
  };
}

const Transactions: React.FC = () => {
  const [cluster, setCluster] = useState<TransactionMetricsCluster>("mainnet");
  const [days, setDays] = useState<TransactionMetricsDays>(30);
  const [metrics, setMetrics] = useState<TransactionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await getTransactionMetrics(cluster, days);
      setMetrics(normalizeMetrics(result));
      setLoading(false);
      setRefreshing(false);
    },
    [cluster, days]
  );

  useEffect(() => {
    void fetchMetrics(false);
  }, [fetchMetrics]);

  const topType = useMemo(() => {
    return [...(metrics?.by_type ?? [])].sort(
      (a, b) => b.volume_usd - a.volume_usd
    )[0];
  }, [metrics?.by_type]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solana" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <AnimatedText gradient>Transactions & TVP</AnimatedText>
            </h1>
            <p className="text-gray-400">
              Confirmed app-originated volume, fees, and transaction mix across
              Solana clusters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
              {clusterOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={cluster === option.value ? "secondary" : "ghost"}
                  onClick={() => setCluster(option.value)}
                  className="h-8"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
              {dayOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={days === option.value ? "secondary" : "ghost"}
                  onClick={() => setDays(option.value)}
                  className="h-8"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchMetrics(true)}
              disabled={refreshing}
              className="border-solana/20 hover:bg-solana/10"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {!metrics?.available ? (
          <GlassCard>
            <p className="text-gray-300">
              {metrics?.message ??
                "Transaction metrics are not available yet. Run the backend migrations and make sure app_transactions exists."}
            </p>
          </GlassCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <GlassCard className="bg-gradient-to-br from-emerald-500/20 to-transparent">
                <TrendingUp className="w-10 h-10 mb-3 text-emerald-400" />
                <p className="text-gray-400">TVP</p>
                <h3 className="text-3xl font-bold text-emerald-400">
                  {currency.format(metrics.summary.total_input_usd)}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  Confirmed input volume
                </p>
              </GlassCard>

              <GlassCard className="bg-gradient-to-br from-purple-500/20 to-transparent">
                <Coins className="w-10 h-10 mb-3 text-purple-400" />
                <p className="text-gray-400">Fee Revenue</p>
                <h3 className="text-3xl font-bold text-purple-400">
                  {currency.format(metrics.summary.total_fee_usd)}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  Jupiter/referral and recorded platform fees
                </p>
              </GlassCard>

              <GlassCard className="bg-gradient-to-br from-blue-500/20 to-transparent">
                <ArrowDownUp className="w-10 h-10 mb-3 text-blue-400" />
                <p className="text-gray-400">Confirmed Txns</p>
                <h3 className="text-3xl font-bold text-blue-400">
                  {number.format(metrics.summary.tx_count)}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  Deduped by signature + cluster
                </p>
              </GlassCard>

              <GlassCard className="bg-gradient-to-br from-amber-500/20 to-transparent">
                <DollarSign className="w-10 h-10 mb-3 text-amber-400" />
                <p className="text-gray-400">Top Flow</p>
                <h3 className="text-3xl font-bold text-amber-400 capitalize">
                  {topType?.transaction_type ?? "None"}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  {topType
                    ? currency.format(topType.volume_usd)
                    : "No confirmed volume yet"}
                </p>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <GlassCard className="xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Daily TVP</h3>
                    <p className="text-sm text-gray-500">
                      Confirmed volume and fee revenue by day
                    </p>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={metrics.by_day}
                      margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#777"
                        fontSize={12}
                        tickFormatter={formatDateLabel}
                      />
                      <YAxis
                        stroke="#777"
                        fontSize={12}
                        tickFormatter={(value) => `$${Number(value)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.86)",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                        formatter={(value, name) => [
                          currency.format(Number(value)),
                          name === "volume_usd" ? "TVP" : "Fees",
                        ]}
                        labelFormatter={(date) =>
                          new Date(String(date)).toLocaleDateString()
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="volume_usd"
                        stroke="#14F195"
                        fill="#14F195"
                        fillOpacity={0.18}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="fee_usd"
                        stroke="#9945FF"
                        fill="#9945FF"
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="text-lg font-medium mb-1">Cluster Split</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Mainnet and devnet confirmed volume
                </p>
                <div className="space-y-4">
                  {metrics.by_cluster.length === 0 ? (
                    <p className="text-sm text-gray-400">No volume yet.</p>
                  ) : (
                    metrics.by_cluster.map((row) => (
                      <div key={row.cluster}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="capitalize text-gray-300">
                            {row.cluster}
                          </span>
                          <span className="font-semibold">
                            {currency.format(row.volume_usd)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-solana"
                            style={{
                              width: `${Math.min(
                                100,
                                metrics.summary.total_input_usd > 0
                                  ? (row.volume_usd /
                                      metrics.summary.total_input_usd) *
                                      100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {number.format(row.count)} transactions
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>

            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Transaction Mix</h3>
                  <p className="text-sm text-gray-500">
                    Volume and fee revenue by product flow
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.by_type}
                      margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <XAxis
                        dataKey="transaction_type"
                        stroke="#777"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#777"
                        fontSize={12}
                        tickFormatter={(value) => `$${Number(value)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.86)",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                        formatter={(value, name) => [
                          currency.format(Number(value)),
                          name === "volume_usd" ? "TVP" : "Fees",
                        ]}
                      />
                      <Bar dataKey="volume_usd" fill="#14F195" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="fee_usd" fill="#9945FF" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-gray-400">
                        <th className="py-3 pr-3 font-medium">Type</th>
                        <th className="py-3 pr-3 font-medium">Txns</th>
                        <th className="py-3 pr-3 font-medium">TVP</th>
                        <th className="py-3 pr-3 font-medium">Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.by_type.length === 0 ? (
                        <tr>
                          <td className="py-6 text-gray-400" colSpan={4}>
                            No confirmed app transactions yet.
                          </td>
                        </tr>
                      ) : (
                        metrics.by_type.map((row) => (
                          <tr
                            key={row.transaction_type}
                            className="border-b border-white/5"
                          >
                            <td className="py-3 pr-3 capitalize">
                              {row.transaction_type.replace(/_/g, " ")}
                            </td>
                            <td className="py-3 pr-3 text-gray-300">
                              {number.format(row.count)}
                            </td>
                            <td className="py-3 pr-3 text-emerald-300">
                              {currency.format(row.volume_usd)}
                            </td>
                            <td className="py-3 pr-3 text-purple-300">
                              {currency.format(row.fee_usd)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
