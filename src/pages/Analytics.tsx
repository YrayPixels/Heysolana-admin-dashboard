import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  MousePointer,
  Smartphone,
  FileText,
  Zap,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Calendar,
  Users,
  Eye,
  Route,
} from "lucide-react";
import {
  getTrackingData,
  getEngagementAnalytics,
  TrackingData,
  EngagementAnalytics,
  DateValueData,
  NameValueData,
} from "@/services/api";
import GlassCard from "@/components/ui-custom/GlassCard";
import { Button } from "@/components/ui/button";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import DashboardLayout from "@/layouts/DashboardLayout";

const Analytics: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [engagement, setEngagement] = useState<EngagementAnalytics | null>(null);
  const [engagementDays, setEngagementDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const [data, engagementData] = await Promise.all([
          getTrackingData(),
          getEngagementAnalytics(engagementDays),
        ]);
        if (data) {
          const processedData = {
            ...data,
            button_clicks_by_button_name:
              data.button_clicks_by_button_name?.map((item) => ({
                ...item,
                total_clicks: Number(item.total_clicks) || 0,
              })) || [],
            tool_calls_by_tool_name:
              data.tool_calls_by_tool_name?.map((item) => ({
                ...item,
                total_calls: Number(item.total_calls) || 0,
              })) || [],
            page_open_count_by_page_name:
              data.page_open_count_by_page_name?.map((item) => ({
                ...item,
                total_open_count: Number(item.total_open_count) || 0,
              })) || [],
            token_usage_by_token_name:
              data.token_usage_by_token_name?.map((item) => ({
                ...item,
                total_usage: Number(item.total_usage) || 0,
              })) || [],
          };
          setTrackingData(processedData);
        }
        setEngagement(engagementData);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [engagementDays]
  );

  const handleRefresh = () => {
    void fetchData(true);
  };

  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  // Chart colors matching the theme
  const COLORS = [
    "#00FFA1",
    "#8B5CF6",
    "#06B6D4",
    "#F59E0B",
    "#EF4444",
    "#10B981",
    "#F97316",
    "#8B5CF6",
  ];

  // Calculate total metrics
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
      (acc, item) => acc + (item.total_usage || 0),
      0
    ) || 0;

  // Helper function to calculate Y-axis domain for better scaling
  const getYAxisDomain = (
    data: DateValueData[] | NameValueData[],
    dataKey: string
  ) => {
    if (!data || data.length === 0) return [0, 10];

    const values = data.map((item) => {
      if (dataKey === "total_calls") return item.total_calls || 0;
      if (dataKey === "total_clicks") return item.total_clicks || 0;
      if (dataKey === "total_open_count") return item.total_open_count || 0;
      if (dataKey === "total_usage") return item.total_usage || 0;
      return 0;
    });

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    // Add some padding to the max value (10% more than max, minimum 5)
    const padding = Math.max(Math.ceil(maxValue * 0.1), 5);
    const domainMax = maxValue + padding;
    const domainMin = Math.max(0, minValue - Math.ceil(padding / 2));

    return [domainMin, domainMax];
  };

  const journeyTransitions =
    engagement?.journey_edges?.slice(0, 12).map((e) => ({
      step: `${e.source} → ${e.target}`,
      transitions: e.value,
    })) ?? [];

  const popularPagesChart =
    engagement?.journey_popular_pages?.map((p) => ({
      page: p.event_name,
      views: Number(p.views) || 0,
    })) ?? [];

  const engSummary = engagement?.summary;
  const mauTrendPct =
    engSummary && engSummary.mau_prev_window > 0
      ? ((engSummary.mau_rolling - engSummary.mau_prev_window) /
          engSummary.mau_prev_window) *
        100
      : null;

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
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <AnimatedText gradient>Analytics Dashboard</AnimatedText>
            </h1>
            <p className="text-gray-400">
              <AnimatedText delay={200}>
                Comprehensive tracking and insights for your application
              </AnimatedText>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/30">
              {([7, 30, 90] as const).map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={engagementDays === d ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs min-w-[3rem]"
                  onClick={() => setEngagementDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gradient-to-r from-solana to-purple-600 hover:opacity-90"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* MAU / DAU & journey */}
        {!engagement?.available ? (
          <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
            <p className="text-sm text-amber-100">
              {engagement?.message ??
                "Engagement analytics require the user_activity_events table. Run backend migrations, then send optional user_key with app and page open events from the app for per-user DAU and journeys."}
            </p>
          </GlassCard>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-solana" />
                Active users
              </h2>
              <p className="text-xs text-gray-500 max-w-xl text-right">
                {engagement.dau_series_note}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard className="text-center p-4 bg-gradient-to-br from-cyan-500/15 to-transparent">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                <h3 className="text-2xl font-bold text-cyan-300">
                  {(engSummary?.dau_today ?? 0).toLocaleString()}
                </h3>
                <p className="text-gray-400 text-sm">DAU today</p>
              </GlassCard>
              <GlassCard className="text-center p-4 bg-gradient-to-br from-emerald-500/15 to-transparent">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <h3 className="text-2xl font-bold text-emerald-300">
                  {(engSummary?.wau ?? 0).toLocaleString()}
                </h3>
                <p className="text-gray-400 text-sm">WAU (7d)</p>
              </GlassCard>
              <GlassCard className="text-center p-4 bg-gradient-to-br from-violet-500/15 to-transparent">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-violet-400" />
                <h3 className="text-2xl font-bold text-violet-300">
                  {(engSummary?.mau_rolling ?? 0).toLocaleString()}
                </h3>
                <p className="text-gray-400 text-sm">
                  MAU ({engagementDays}d window)
                </p>
                {mauTrendPct !== null ? (
                  <p
                    className={`text-xs mt-1 ${
                      mauTrendPct >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {mauTrendPct >= 0 ? "+" : ""}
                    {mauTrendPct.toFixed(1)}% vs prior window
                  </p>
                ) : null}
              </GlassCard>
              <GlassCard className="text-center p-4 bg-gradient-to-br from-amber-500/15 to-transparent">
                <Activity className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                <h3 className="text-2xl font-bold text-amber-300">
                  {engSummary?.stickiness != null
                    ? `${engSummary.stickiness}%`
                    : "—"}
                </h3>
                <p className="text-gray-400 text-sm">Stickiness (DAU / MAU)</p>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
                    <h3 className="text-lg font-medium">
                      Daily active (
                      {engagement.dau_series_source === "wallet_sync"
                        ? "wallets"
                        : "keys"}
                      )
                    </h3>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagement.dau_series || []}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#666"
                        fontSize={10}
                        tickFormatter={(d) =>
                          new Date(d + "T12:00:00").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.85)",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                        labelFormatter={(d) => new Date(String(d)).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="active_users"
                        name="Active"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        dot={{ r: 2, fill: "#22d3ee" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center mb-4">
                  <Route className="w-5 h-5 mr-2 text-fuchsia-400" />
                  <h3 className="text-lg font-medium">Page transitions</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Consecutive page_view events per user_key (same period as
                  chart).
                </p>
                <div className="h-72">
                  {journeyTransitions.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={journeyTransitions}
                        layout="vertical"
                        margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                        />
                        <XAxis type="number" stroke="#666" fontSize={11} />
                        <YAxis
                          type="category"
                          dataKey="step"
                          stroke="#666"
                          fontSize={9}
                          width={130}
                          tickFormatter={(v: string) =>
                            v.length > 36 ? `${v.slice(0, 34)}…` : v
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.85)",
                            borderColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="transitions"
                          fill="#d946ef"
                          radius={[0, 4, 4, 0]}
                          name="Count"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center px-4">
                      No per-user page sequence yet. Send{" "}
                      <code className="mx-1 text-cyan-400/90">user_key</code>{" "}
                      (wallet or device id) with page-open tracking to
                      populate journeys.
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            {popularPagesChart.length > 0 ? (
              <GlassCard className="p-6">
                <div className="flex items-center mb-4">
                  <Eye className="w-5 h-5 mr-2 text-purple-400" />
                  <h3 className="text-lg font-medium">
                    Popular screens (page_view)
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={popularPagesChart}
                      margin={{ bottom: 48, left: 8, right: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <XAxis
                        dataKey="page"
                        stroke="#666"
                        fontSize={11}
                        angle={-28}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.85)",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="views"
                        fill="#a78bfa"
                        radius={[4, 4, 0, 0]}
                        name="Views"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            ) : null}
          </>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard className="text-center bg-gradient-to-br from-green-500/20 to-transparent">
            <MousePointer className="w-10 h-10 mx-auto mb-2 text-green-400" />
            <h3 className="text-3xl font-bold text-green-400">
              {getTotalClicks().toLocaleString()}
            </h3>
            <p className="text-gray-400">Total Button Clicks</p>
          </GlassCard>

          <GlassCard className="text-center bg-gradient-to-br from-blue-500/20 to-transparent">
            <Zap className="w-10 h-10 mx-auto mb-2 text-blue-400" />
            <h3 className="text-3xl font-bold text-blue-400">
              {getTotalToolCalls().toLocaleString()}
            </h3>
            <p className="text-gray-400">Tool Calls</p>
          </GlassCard>

          <GlassCard className="text-center bg-gradient-to-br from-purple-500/20 to-transparent">
            <Eye className="w-10 h-10 mx-auto mb-2 text-purple-400" />
            <h3 className="text-3xl font-bold text-purple-400">
              {getTotalPageViews().toLocaleString()}
            </h3>
            <p className="text-gray-400">Page Views</p>
          </GlassCard>

          <GlassCard className="text-center bg-gradient-to-br from-orange-500/20 to-transparent">
            <Activity className="w-10 h-10 mx-auto mb-2 text-orange-400" />
            <h3 className="text-3xl font-bold text-orange-400">
              {getTotalTokenUsage().toLocaleString()}
            </h3>
            <p className="text-gray-400">Token Usage</p>
          </GlassCard>
        </div>

        {/* Time Series Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Button Clicks Over Time */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <MousePointer className="w-5 h-5 mr-2 text-green-400" />
              <h3 className="text-lg font-medium">Button Clicks Over Time</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trackingData?.button_clicks_by_date || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    domain={getYAxisDomain(
                      trackingData?.button_clicks_by_date || [],
                      "total_clicks"
                    )}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_clicks"
                    stroke="#00FFA1"
                    fill="url(#greenGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient
                      id="greenGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#00FFA1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00FFA1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Tool Calls Over Time */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 mr-2 text-blue-400" />
              <h3 className="text-lg font-medium">Tool Calls Over Time</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trackingData?.tool_calls_by_date || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    domain={getYAxisDomain(
                      trackingData?.tool_calls_by_date || [],
                      "total_calls"
                    )}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_calls"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    dot={{ fill: "#06B6D4", r: 4 }}
                    activeDot={{ r: 6, fill: "#06B6D4" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* App Usage Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* App Opens Over Time */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <Smartphone className="w-5 h-5 mr-2 text-purple-400" />
              <h3 className="text-lg font-medium">App Opens Over Time</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trackingData?.app_open_count_by_date || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    domain={getYAxisDomain(
                      trackingData?.app_open_count_by_date || [],
                      "total_open_count"
                    )}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="total_open_count"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Page Views Over Time */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2 text-orange-400" />
              <h3 className="text-lg font-medium">Page Views Over Time</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trackingData?.page_open_count_by_date || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    domain={getYAxisDomain(
                      trackingData?.page_open_count_by_date || [],
                      "total_open_count"
                    )}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_open_count"
                    stroke="#F97316"
                    fill="url(#orangeGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient
                      id="orangeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Button Clicks Distribution */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <PieChartIcon className="w-5 h-5 mr-2 text-green-400" />
              <h3 className="text-lg font-medium">
                Button Clicks Distribution
              </h3>
            </div>
            <div className="h-64 flex">
              {trackingData?.button_clicks_by_button_name?.length ? (
                <>
                  {/* Pie Chart */}
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trackingData.button_clicks_by_button_name}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="total_clicks"
                        >
                          {trackingData.button_clicks_by_button_name.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            borderColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Button Legend */}
                  <div className="flex-1 pl-4 overflow-y-auto">
                    <div className="space-y-2">
                      {trackingData.button_clicks_by_button_name
                        .sort(
                          (a, b) =>
                            (b.total_clicks || 0) - (a.total_clicks || 0)
                        )
                        .map((button, index) => {
                          const totalClicks =
                            trackingData.button_clicks_by_button_name.reduce(
                              (sum, b) => sum + (b.total_clicks || 0),
                              0
                            );
                          const percentage =
                            totalClicks > 0
                              ? (
                                  ((button.total_clicks || 0) / totalClicks) *
                                  100
                                ).toFixed(1)
                              : "0.0";

                          return (
                            <div
                              key={button.button_name}
                              className="flex items-center justify-between py-1"
                            >
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      COLORS[index % COLORS.length],
                                  }}
                                />
                                <span className="text-sm text-gray-300 truncate">
                                  {button.button_name}
                                </span>
                              </div>
                              <div className="text-right ml-2">
                                <div className="text-sm font-medium text-white">
                                  {percentage}%
                                </div>
                                <div className="text-xs text-gray-400">
                                  {(button.total_clicks || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 w-full">
                  <div className="text-center">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No button click data available</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Tool Usage Distribution */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              <h3 className="text-lg font-medium">Tool Usage Distribution</h3>
            </div>
            <div className="h-64">
              {trackingData?.tool_calls_by_tool_name?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trackingData.tool_calls_by_tool_name}
                    layout="horizontal"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      type="number"
                      stroke="#666"
                      fontSize={12}
                      domain={getYAxisDomain(
                        trackingData?.tool_calls_by_tool_name || [],
                        "total_calls"
                      )}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <YAxis
                      type="category"
                      dataKey="tool_name"
                      stroke="#666"
                      fontSize={10}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="total_calls"
                      fill="#06B6D4"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No tool usage data available</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Page Views and Token Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Page Views Distribution */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <Eye className="w-5 h-5 mr-2 text-purple-400" />
              <h3 className="text-lg font-medium">Page Views Distribution</h3>
            </div>
            <div className="h-64">
              {trackingData?.page_open_count_by_page_name?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trackingData.page_open_count_by_page_name}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="page_name"
                      stroke="#666"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="total_open_count"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No page view data available</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Token Usage Distribution */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-4">
              <Activity className="w-5 h-5 mr-2 text-orange-400" />
              <h3 className="text-lg font-medium">Token Usage Distribution</h3>
            </div>
            <div className="h-64">
              {trackingData?.token_usage_by_token_name?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trackingData.token_usage_by_token_name}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ token_name, total_usage }) =>
                        `${token_name}: ${total_usage}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_usage"
                    >
                      {trackingData.token_usage_by_token_name.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No token usage data available</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
