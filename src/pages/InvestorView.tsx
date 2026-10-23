import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
  Activity,
  ArrowDownUp,
  Coins,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import GlassCard from "@/components/ui-custom/GlassCard";
import { Button } from "@/components/ui/button";
import {
  getInvestorSummary,
  type InvestorSummaryResponse,
  type TransactionMetricsCluster,
} from "@/services/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-US");

const dayOptions: Array<{ label: string; value: 7 | 30 | 90 }> = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

const clusterOptions: Array<{ label: string; value: TransactionMetricsCluster }> = [
  { label: "Mainnet", value: "mainnet" },
  { label: "All", value: "all" },
];

function formatDateLabel(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const InvestorView: React.FC = () => {
  const { token = "" } = useParams<{ token: string }>();
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [cluster, setCluster] = useState<TransactionMetricsCluster>("mainnet");
  const [data, setData] = useState<InvestorSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(
    async (refresh = false) => {
      if (!token) {
        setError("Missing access token");
        setLoading(false);
        return;
      }

      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await getInvestorSummary(token, days, cluster);
      if (!result) {
        setError("Unable to load investor summary. Check the link or try again.");
        setData(null);
      } else {
        setData(result);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [token, days, cluster]
  );

  useEffect(() => {
    void fetchSummary(false);
  }, [fetchSummary]);

  const topType = useMemo(() => {
    return [...(data?.transactions.by_type ?? [])].sort(
      (a, b) => b.volume_usd - a.volume_usd
    )[0];
  }, [data?.transactions.by_type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solana" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold">Investor view unavailable</h1>
          <p className="text-gray-400 text-sm">{error ?? "No data returned."}</p>
          <Button
            variant="outline"
            onClick={() => void fetchSummary(true)}
            className="border-solana/20 hover:bg-solana/10"
          >
            Try again
          </Button>
        </GlassCard>
      </div>
    );
  }

  const tx = data.transactions;
  const users = data.users;
  const engagement = data.engagement;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-solana text-sm font-medium mb-2">HeySolana · Investor overview</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <AnimatedText gradient>Operations summary</AnimatedText>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
              View-only snapshot of volume, users, and engagement. No personal
              account data is shown.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Updated {new Date(data.generated_at).toLocaleString()}
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
              onClick={() => void fetchSummary(true)}
              disabled={refreshing}
              className="border-solana/20 hover:bg-solana/10"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <GlassCard className="bg-gradient-to-br from-emerald-500/20 to-transparent">
            <TrendingUp className="w-8 h-8 mb-3 text-emerald-400" />
            <p className="text-gray-400 text-sm">Total volume (TVP)</p>
            <h3 className="text-2xl font-bold text-emerald-400">
              {currency.format(tx.summary?.total_input_usd ?? 0)}
            </h3>
          </GlassCard>
          <GlassCard className="bg-gradient-to-br from-purple-500/20 to-transparent">
            <Coins className="w-8 h-8 mb-3 text-purple-400" />
            <p className="text-gray-400 text-sm">Fee revenue</p>
            <h3 className="text-2xl font-bold text-purple-400">
              {currency.format(tx.summary?.total_fee_usd ?? 0)}
            </h3>
          </GlassCard>
          <GlassCard className="bg-gradient-to-br from-blue-500/20 to-transparent">
            <ArrowDownUp className="w-8 h-8 mb-3 text-blue-400" />
            <p className="text-gray-400 text-sm">Confirmed transactions</p>
            <h3 className="text-2xl font-bold text-blue-400">
              {number.format(tx.summary?.tx_count ?? 0)}
            </h3>
          </GlassCard>
          <GlassCard className="bg-gradient-to-br from-cyan-500/20 to-transparent">
            <Users className="w-8 h-8 mb-3 text-cyan-400" />
            <p className="text-gray-400 text-sm">Total users</p>
            <h3 className="text-2xl font-bold text-cyan-400">
              {number.format(users.total_users)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              +{number.format(users.recent_registrations_30d)} in 30d
              {users.growth_rate_pct !== 0 && (
                <span className={users.growth_rate_pct >= 0 ? " text-emerald-400" : " text-red-400"}>
                  {" "}
                  ({users.growth_rate_pct >= 0 ? "+" : ""}
                  {users.growth_rate_pct}%)
                </span>
              )}
            </p>
          </GlassCard>
        </section>

        {engagement.available && engagement.summary && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard>
              <p className="text-gray-400 text-sm">DAU</p>
              <h3 className="text-xl font-semibold">{number.format(engagement.summary.dau_today)}</h3>
            </GlassCard>
            <GlassCard>
              <p className="text-gray-400 text-sm">WAU</p>
              <h3 className="text-xl font-semibold">{number.format(engagement.summary.wau)}</h3>
            </GlassCard>
            <GlassCard>
              <p className="text-gray-400 text-sm">MAU</p>
              <h3 className="text-xl font-semibold">{number.format(engagement.summary.mau_rolling)}</h3>
            </GlassCard>
            <GlassCard>
              <p className="text-gray-400 text-sm">Stickiness</p>
              <h3 className="text-xl font-semibold">
                {engagement.summary.stickiness != null
                  ? `${engagement.summary.stickiness}%`
                  : "—"}
              </h3>
            </GlassCard>
          </section>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <GlassCard className="xl:col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Daily volume</h3>
              <p className="text-sm text-gray-500">Confirmed TVP and fees</p>
            </div>
            <div className="h-72">
              {(tx.by_day ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">No volume in this window.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tx.by_day} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#777" fontSize={12} tickFormatter={formatDateLabel} />
                    <YAxis stroke="#777" fontSize={12} tickFormatter={(v) => `$${Number(v)}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.86)",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      formatter={(value, name) => [
                        currency.format(Number(value)),
                        name === "volume_usd" ? "TVP" : "Fees",
                      ]}
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
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-solana" />
              <div>
                <h3 className="text-lg font-medium">Active users</h3>
                <p className="text-sm text-gray-500">Daily active</p>
              </div>
            </div>
            <div className="h-72">
              {(engagement.dau_series ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">No engagement data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagement.dau_series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#777" fontSize={12} tickFormatter={formatDateLabel} />
                    <YAxis stroke="#777" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.86)",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="active_users"
                      stroke="#06B6D4"
                      fill="#06B6D4"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-lg font-medium mb-1">Volume by type</h3>
            <p className="text-sm text-gray-500 mb-4">
              Top flow: {topType?.transaction_type ?? "—"}
            </p>
            <div className="h-64">
              {(tx.by_type ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">No breakdown yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tx.by_type.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="transaction_type" stroke="#777" fontSize={11} />
                    <YAxis stroke="#777" fontSize={12} tickFormatter={(v) => `$${Number(v)}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.86)",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      formatter={(value) => currency.format(Number(value))}
                    />
                    <Bar dataKey="volume_usd" fill="#14F195" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-medium mb-1">Users by country</h3>
            <p className="text-sm text-gray-500 mb-4">Aggregate geo from phone prefixes</p>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(users.country_distribution ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">No country data.</p>
              ) : (
                users.country_distribution.map((row) => {
                  const pct =
                    users.total_users > 0
                      ? Math.round((row.user_count / users.total_users) * 100)
                      : 0;
                  return (
                    <div key={row.country}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{row.country}</span>
                        <span className="text-gray-400">
                          {number.format(row.user_count)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-solana/70 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard>
            <h3 className="text-lg font-medium mb-3">By app</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(tx.by_app ?? []).slice(0, 8).map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-gray-300 truncate mr-2">{row.label}</span>
                  <span className="text-gray-400 shrink-0">{currency.format(row.volume_usd)}</span>
                </div>
              ))}
              {(tx.by_app ?? []).length === 0 && (
                <p className="text-sm text-gray-400">No app volume yet.</p>
              )}
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="text-lg font-medium mb-3">By provider</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(tx.by_provider ?? []).slice(0, 8).map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-gray-300 truncate mr-2">{row.label}</span>
                  <span className="text-gray-400 shrink-0">{currency.format(row.volume_usd)}</span>
                </div>
              ))}
              {(tx.by_provider ?? []).length === 0 && (
                <p className="text-sm text-gray-400">No provider volume yet.</p>
              )}
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="text-lg font-medium mb-3">Wallet readiness</h3>
            <div className="space-y-3">
              {(users.wallet_status ?? []).map((row) => (
                <div key={row.wallet_status} className="flex justify-between text-sm">
                  <span className="text-gray-300">{row.wallet_status}</span>
                  <span className="font-medium">{number.format(row.user_count)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/10 space-y-2">
                {(users.verification_status ?? []).map((row) => (
                  <div key={row.status} className="flex justify-between text-sm">
                    <span className="text-gray-400">{row.status}</span>
                    <span>{number.format(row.user_count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        <section>
          <GlassCard>
            <div className="mb-4">
              <h3 className="text-lg font-medium">Recent transactions</h3>
              <p className="text-sm text-gray-500">
                Anonymized confirmed activity (no wallets or personal identifiers)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-white/10">
                    <th className="py-2 pr-4 font-medium">When</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">App</th>
                    <th className="py-2 pr-4 font-medium">Provider</th>
                    <th className="py-2 pr-4 font-medium text-right">Volume</th>
                    <th className="py-2 font-medium text-right">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recent_transactions ?? []).map((row) => (
                    <tr key={row.id} className="border-b border-white/5 text-gray-300">
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        {row.confirmed_at || row.created_at
                          ? new Date(String(row.confirmed_at || row.created_at)).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-4 capitalize">{row.transaction_type || "—"}</td>
                      <td className="py-2.5 pr-4">{row.app_called || "—"}</td>
                      <td className="py-2.5 pr-4">{row.provider || "—"}</td>
                      <td className="py-2.5 pr-4 text-right">
                        {row.input_amount_usd != null
                          ? currency.format(row.input_amount_usd)
                          : "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        {row.platform_fee_usd != null
                          ? currency.format(row.platform_fee_usd)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {(data.recent_transactions ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        No recent confirmed transactions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>

        <footer className="text-center text-xs text-gray-600 pb-8">
          Confidential · View only · HeySolana
        </footer>
      </div>
    </div>
  );
};

export default InvestorView;
