import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  getTrackingData,
  TrackingData,
  DateValueData,
  NameValueData,
} from "@/services/api";
import GlassCard from "@/components/ui-custom/GlassCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import DashboardLayout from "@/layouts/DashboardLayout";

const Analytics: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTrackingData();
      if (data) {
        // Process data to ensure numbers are properly converted
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
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        <div className="flex items-center justify-between">
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
