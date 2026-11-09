import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  MousePointer,
  Zap,
  Eye,
  Activity,
  BarChart3,
  Coins,
  ExternalLink,
  ArrowDownUp,
} from "lucide-react";
import GlassCard from "@/components/ui-custom/GlassCard";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useAuth } from "@/components/AuthContext";
import {
  getTrackingData,
  getAppTransactions,
  TrackingData,
  type AppTransaction,
} from "@/services/api";
import { useNavigate } from "react-router-dom";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const truncate = (value: string | null, start = 6, end = 4) => {
  if (!value) return "—";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const titleCase = (value: string | null) => {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatTokenAmount = (
  amount: AppTransaction["input_amount"],
  token: string | null
) => {
  if (amount == null || amount === "") return "—";
  const formatted = Number(amount).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
  return token ? `${formatted} ${token}` : formatted;
};

const formatUsd = (value: AppTransaction["input_amount_usd"]) => {
  const amount = Number(value ?? 0);
  return amount > 0 ? currency.format(amount) : "—";
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusBadgeVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "confirmed":
      return "default";
    case "failed":
      return "destructive";
    case "submitted":
      return "secondary";
    default:
      return "outline";
  }
};

const getExplorerUrl = (tx: AppTransaction) => {
  if (!tx.signature) return null;
  const clusterParam = tx.cluster === "devnet" ? "?cluster=devnet" : "";
  return `https://solscan.io/tx/${tx.signature}${clusterParam}`;
};

type SevenDayRow = {
  date: string;
  total_clicks?: number;
  total_calls?: number;
};

const toLocalDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** One row per calendar day for the last 7 days (0 when no data). */
const buildSevenDaySeries = (
  rows: SevenDayRow[] | undefined,
  valueKey: "total_clicks" | "total_calls"
): SevenDayRow[] => {
  const byDate = new Map<string, number>();
  for (const row of rows ?? []) {
    const dateKey = toLocalDateKey(new Date(row.date));
    byDate.set(dateKey, Number(row[valueKey]) || 0);
  }

  const series: SevenDayRow[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const dateKey = toLocalDateKey(d);
    series.push({ date: dateKey, [valueKey]: byDate.get(dateKey) ?? 0 });
  }
  return series;
};

const getYAxisDomain = (
  data: SevenDayRow[],
  valueKey: "total_clicks" | "total_calls"
): [number, number] => {
  if (!data.length) return [0, 10];

  const values = data.map((row) => Number(row[valueKey]) || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  if (maxValue === 0) return [0, 10];

  const padding = Math.max(Math.ceil(maxValue * 0.15), 1);
  return [Math.max(0, minValue - Math.ceil(padding / 2)), maxValue + padding];
};

const Dashboard: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<AppTransaction[]>(
    []
  );
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsData = await getTrackingData();
        setTrackingData(analyticsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await getAppTransactions({ per_page: 8, page: 1 });
        setRecentTransactions(response?.data ?? []);
      } catch (error) {
        console.error("Error fetching recent transactions:", error);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getTotalClicks = () =>
    trackingData?.button_clicks_by_button_name?.reduce(
      (sum, item) => sum + (Number(item.total_clicks) || 0),
      0
    ) || 0;
  const getTotalToolCalls = () =>
    trackingData?.tool_calls_by_tool_name?.reduce(
      (sum, item) => sum + (Number(item.total_calls) || 0),
      0
    ) || 0;
  const getTotalPageViews = () =>
    trackingData?.page_open_count_by_page_name?.reduce(
      (sum, item) => sum + (Number(item.total_open_count) || 0),
      0
    ) || 0;
  const getTotalTokenUsage = () =>
    trackingData?.token_usage_by_token_name?.reduce(
      (sum, item) => sum + (Number(item.total_usage) || 0),
      0
    ) || 0;

  const recentClicksData = buildSevenDaySeries(
    trackingData?.button_clicks_by_date,
    "total_clicks"
  );
  const recentToolCallsData = buildSevenDaySeries(
    trackingData?.tool_calls_by_date,
    "total_calls"
  );

  const avgClicksPerDay = (
    recentClicksData.reduce(
      (sum, row) => sum + (Number(row.total_clicks) || 0),
      0
    ) / 7
  ).toFixed(1);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solana"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Alert className="border-green-500/20 bg-green-500/10">
          <AlertCircle className="h-5 w-5 mr-2 text-green-400" />
          <AlertDescription className="text-green-100">
            <span className="font-semibold">
              Welcome back, {user?.name || "Admin"}!
            </span>{" "}
            The dashboard has been updated with the latest data.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              <AnimatedText gradient>Admin Dashboard</AnimatedText>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Overview of your application performance and usage metrics
            </p>
          </div>
          <Button
            onClick={() => navigate("/analytics")}
            variant="outline"
            className="border-solana/20 hover:bg-solana/10 w-full sm:w-auto shrink-0"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="text-center bg-gradient-to-br from-blue-500/20 to-transparent">
            <MousePointer className="w-10 h-10 mx-auto mb-2 text-blue-400" />
            <h3 className="text-3xl font-bold text-blue-400">
              {getTotalClicks().toLocaleString()}
            </h3>
            <p className="text-gray-400">Button Clicks</p>
          </GlassCard>

          <GlassCard className="text-center bg-gradient-to-br from-purple-500/20 to-transparent">
            <Zap className="w-10 h-10 mx-auto mb-2 text-purple-400" />
            <h3 className="text-3xl font-bold text-purple-400">
              {getTotalToolCalls().toLocaleString()}
            </h3>
            <p className="text-gray-400">Tool Calls</p>
          </GlassCard>

          <GlassCard className="text-center bg-gradient-to-br from-orange-500/20 to-transparent">
            <Eye className="w-10 h-10 mx-auto mb-2 text-orange-400" />
            <h3 className="text-3xl font-bold text-orange-400">
              {getTotalPageViews().toLocaleString()}
            </h3>
            <p className="text-gray-400">Page Views</p>
          </GlassCard>

          <GlassCard className="text-center bg-gradient-to-br from-amber-500/20 to-transparent">
            <Coins className="w-10 h-10 mx-auto mb-2 text-amber-400" />
            <h3 className="text-3xl font-bold text-amber-400">
              {getTotalTokenUsage().toLocaleString()}
            </h3>
            <p className="text-gray-400">Token Usage</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Recent Activity (7 Days)</h3>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={recentClicksData}
                  margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    allowDecimals={false}
                    domain={getYAxisDomain(recentClicksData, "total_clicks")}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <Line
                    type="linear"
                    dataKey="total_clicks"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    dot={{ fill: "#06B6D4", r: 3 }}
                    activeDot={{ r: 5, fill: "#06B6D4" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Tool Calls (7 Days)</h3>
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={recentToolCallsData}
                  margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    allowDecimals={false}
                    domain={getYAxisDomain(recentToolCallsData, "total_calls")}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <Line
                    type="linear"
                    dataKey="total_calls"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: "#8B5CF6", r: 3 }}
                    activeDot={{ r: 5, fill: "#8B5CF6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <h3 className="text-lg font-medium mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Tracked Buttons</p>
              <p className="text-blue-400 font-semibold text-xl">
                {trackingData?.button_clicks_by_button_name?.length ?? 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tracked Tools</p>
              <p className="text-purple-400 font-semibold text-xl">
                {trackingData?.tool_calls_by_tool_name?.length ?? 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tracked Pages</p>
              <p className="text-orange-400 font-semibold text-xl">
                {trackingData?.page_open_count_by_page_name?.length ?? 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg. Clicks / Day (7d)</p>
              <p className="text-cyan-400 font-semibold text-xl">
                {avgClicksPerDay}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Recent Transactions</h3>
              <p className="text-sm text-gray-500">
                Latest app-originated wallet transactions
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/transaction-list")}
              className="border-solana/20 hover:bg-solana/10"
            >
              <ArrowDownUp className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>

          {transactionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="py-3 pr-3 font-medium">Transaction</th>
                    <th className="py-3 pr-3 font-medium">User / Wallet</th>
                    <th className="py-3 pr-3 font-medium">Type</th>
                    <th className="py-3 pr-3 font-medium">Amount</th>
                    <th className="py-3 pr-3 font-medium">USD</th>
                    <th className="py-3 pr-3 font-medium">Status</th>
                    <th className="py-3 pr-3 font-medium">Date</th>
                    <th className="py-3 font-medium text-right">Explorer</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => {
                    const explorerUrl = getExplorerUrl(tx);
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-white/5 cursor-pointer hover:bg-white/5"
                        onClick={() =>
                          navigate(`/transaction-list/${tx.id}`)
                        }
                      >
                        <td className="py-3 pr-3">
                          <div className="font-mono">
                            {truncate(tx.signature)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {tx.cluster}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-medium">
                            {tx.username || tx.mobile_number || "Unknown user"}
                          </div>
                          <div className="font-mono text-xs text-gray-500">
                            {truncate(tx.wallet_address)}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          {titleCase(tx.transaction_type)}
                        </td>
                        <td className="py-3 pr-3 text-gray-300">
                          {formatTokenAmount(
                            tx.input_amount ?? tx.amount,
                            tx.input_token_symbol ?? tx.token
                          )}
                        </td>
                        <td className="py-3 pr-3 text-emerald-300">
                          {formatUsd(tx.input_amount_usd)}
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant={getStatusBadgeVariant(tx.status)}>
                            {titleCase(tx.status)}
                          </Badge>
                        </td>
                        <td className="py-3 pr-3 text-gray-300">
                          {formatDate(tx.confirmed_at ?? tx.created_at)}
                        </td>
                        <td className="py-3 text-right">
                          {explorerUrl ? (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              aria-label="Open transaction in Solscan"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
