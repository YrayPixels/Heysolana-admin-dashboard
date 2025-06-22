import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  TrendingUp,
  Globe,
  Shield,
  Wallet,
  Key,
  MapPin,
  Calendar,
  UserPlus,
} from "lucide-react";
import {
  getUserDistributionAnalytics,
  UserDistributionData,
} from "../services/api";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import GlassCard from "@/components/ui-custom/GlassCard";

const COLORS = {
  primary: "#00FFA1", // Solana green
  secondary: "#8B5CF6", // Purple
  accent: "#06B6D4", // Cyan
  warning: "#F97316", // Orange
  success: "#10B981", // Green
  info: "#3B82F6", // Blue
  danger: "#EF4444", // Red
  pink: "#EC4899", // Pink
  yellow: "#EAB308", // Yellow
  indigo: "#6366F1", // Indigo
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.warning,
  COLORS.success,
  COLORS.info,
  COLORS.danger,
  COLORS.pink,
  COLORS.yellow,
  COLORS.indigo,
];

const UserDistribution: React.FC = () => {
  const [userDistributionData, setUserDistributionData] =
    useState<UserDistributionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getUserDistributionAnalytics();
      if (data) {
        setUserDistributionData(data);
      }
    } catch (error) {
      console.error("Error fetching user distribution data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Custom tooltip for charts
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/90 backdrop-blur-lg border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="text-green-400 font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-white">
              <span style={{ color: entry.color }}>●</span>
              {` ${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare chart data
  const prepareMonthlyData = () => {
    if (!userDistributionData?.monthly_registrations) return [];

    return userDistributionData.monthly_registrations.map((item) => ({
      period: `${item.year}-${String(item.month).padStart(2, "0")}`,
      registrations: item.registrations,
    }));
  };

  const prepareDailyData = () => {
    if (!userDistributionData?.registration_trends) return [];

    return userDistributionData.registration_trends.slice(-30).map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      registrations: item.registrations,
    }));
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

  const monthlyData = prepareMonthlyData();
  const dailyData = prepareDailyData();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <AnimatedText gradient>User Distribution Analytics</AnimatedText>
            </h1>
            <p className="text-gray-400">
              <AnimatedText delay={200}>
                Comprehensive user demographics and registration insights
              </AnimatedText>
            </p>
          </div>
          <Button
            onClick={fetchData}
            className="bg-gradient-to-r from-solana to-purple-600 hover:opacity-90"
          >
            Refresh Data
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlassCard>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500/20">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {userDistributionData?.total_users?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500/20">
                <UserPlus className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Recent Registrations</p>
                <p className="text-2xl font-bold text-white">
                  {userDistributionData?.recent_registrations?.toLocaleString() ||
                    0}
                </p>
                <p className="text-xs text-gray-400">Last 30 days</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Growth Rate</p>
                <p className="text-2xl font-bold text-white">
                  {userDistributionData?.growth_rate !== undefined
                    ? `${userDistributionData.growth_rate > 0 ? "+" : ""}${
                        userDistributionData.growth_rate
                      }%`
                    : "0%"}
                </p>
                <p className="text-xs text-gray-400">vs previous period</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Globe className="w-6 h-6 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Countries</p>
                <p className="text-2xl font-bold text-white">
                  {userDistributionData?.country_distribution?.length || 0}
                </p>
                <p className="text-xs text-gray-400">Active regions</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country Distribution */}
          <GlassCard className="col-span-1">
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 mr-2 text-green-400" />
              <h3 className="text-lg font-medium text-white">
                Geographic Distribution
              </h3>
            </div>
            <div className="h-80">
              {userDistributionData?.country_distribution &&
              userDistributionData.country_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistributionData.country_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ country, user_count, percent }) =>
                        `${country}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="user_count"
                    >
                      {userDistributionData.country_distribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No geographic data available
                </div>
              )}
            </div>
          </GlassCard>

          {/* Verification Status */}
          <GlassCard className="col-span-1">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 mr-2 text-blue-400" />
              <h3 className="text-lg font-medium text-white">
                Verification Status
              </h3>
            </div>
            <div className="h-80">
              {userDistributionData?.verification_status &&
              userDistributionData.verification_status.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userDistributionData.verification_status}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="status"
                      stroke="#666"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="user_count"
                      fill={COLORS.info}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No verification data available
                </div>
              )}
            </div>
          </GlassCard>

          {/* Wallet Status */}
          <GlassCard className="col-span-1">
            <div className="flex items-center mb-4">
              <Wallet className="w-5 h-5 mr-2 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Wallet Status</h3>
            </div>
            <div className="h-80">
              {userDistributionData?.wallet_status &&
              userDistributionData.wallet_status.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistributionData.wallet_status}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ wallet_status, user_count, percent }) =>
                        `${wallet_status}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="user_count"
                    >
                      {userDistributionData.wallet_status.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? COLORS.success : COLORS.warning}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No wallet data available
                </div>
              )}
            </div>
          </GlassCard>

          {/* PIN Status */}
          <GlassCard className="col-span-1">
            <div className="flex items-center mb-4">
              <Key className="w-5 h-5 mr-2 text-orange-400" />
              <h3 className="text-lg font-medium text-white">
                PIN Setup Status
              </h3>
            </div>
            <div className="h-80">
              {userDistributionData?.pin_status &&
              userDistributionData.pin_status.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistributionData.pin_status}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ pin_status, user_count, percent }) =>
                        `${pin_status}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="user_count"
                    >
                      {userDistributionData.pin_status.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? COLORS.primary : COLORS.danger}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No PIN data available
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Registration Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Registration Trends */}
          <GlassCard>
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 mr-2 text-green-400" />
              <h3 className="text-lg font-medium text-white">
                Monthly Registrations
              </h3>
            </div>
            <div className="h-80">
              {monthlyData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="period"
                      stroke="#666"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      stroke={COLORS.primary}
                      fill={`${COLORS.primary}20`}
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No monthly registration data available
                </div>
              )}
            </div>
          </GlassCard>

          {/* Daily Registration Trends (Last 30 days) */}
          <GlassCard>
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
              <h3 className="text-lg font-medium text-white">
                Daily Registrations (Last 30 Days)
              </h3>
            </div>
            <div className="h-80">
              {dailyData && dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#666"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="registrations"
                      stroke={COLORS.accent}
                      strokeWidth={3}
                      dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
                      activeDot={{
                        r: 6,
                        stroke: COLORS.accent,
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No daily registration data available
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Data Summary */}
        <GlassCard>
          <h3 className="text-lg font-medium text-white mb-4">Data Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Top Country</p>
              <p className="text-white font-medium">
                {userDistributionData?.country_distribution?.[0]?.country ||
                  "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Verification Rate</p>
              <p className="text-white font-medium">
                {userDistributionData?.verification_status?.find(
                  (s) => s.status === "Verified"
                )
                  ? `${Math.round(
                      ((userDistributionData.verification_status.find(
                        (s) => s.status === "Verified"
                      )?.user_count || 0) /
                        (userDistributionData.total_users || 1)) *
                        100
                    )}%`
                  : "0%"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Wallet Setup Rate</p>
              <p className="text-white font-medium">
                {userDistributionData?.wallet_status?.find(
                  (s) => s.wallet_status === "Has Wallet"
                )
                  ? `${Math.round(
                      ((userDistributionData.wallet_status.find(
                        (s) => s.wallet_status === "Has Wallet"
                      )?.user_count || 0) /
                        (userDistributionData.total_users || 1)) *
                        100
                    )}%`
                  : "0%"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">PIN Setup Rate</p>
              <p className="text-white font-medium">
                {userDistributionData?.pin_status?.find(
                  (s) => s.pin_status === "PIN Created"
                )
                  ? `${Math.round(
                      ((userDistributionData.pin_status.find(
                        (s) => s.pin_status === "PIN Created"
                      )?.user_count || 0) /
                        (userDistributionData.total_users || 1)) *
                        100
                    )}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default UserDistribution;
