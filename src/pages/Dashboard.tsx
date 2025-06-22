import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  GitBranch,
  AlertCircle,
  TrendingUp,
  MousePointer,
  Zap,
  Eye,
  Activity,
  Plus,
  BarChart3,
  Calendar,
} from "lucide-react";
import GlassCard from "@/components/ui-custom/GlassCard";
import StatsCard from "@/components/ui-custom/StatsCard";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import AddToWaitlistForm from "@/components/ui-custom/AddToWaitlistForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useAuth } from "@/components/AuthContext";
import {
  getWaitlistUsers,
  getTrackingData,
  WaitlistUser,
  TrackingData,
} from "@/services/api";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>([]);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [waitlistData, analyticsData] = await Promise.all([
          getWaitlistUsers(),
          getTrackingData(),
        ]);

        setWaitlistUsers(waitlistData);
        setTrackingData(analyticsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate analytics metrics
  const getTotalClicks = () =>
    trackingData?.button_clicks_by_button_name?.reduce(
      (sum, item) => sum + (item.total_clicks || 0),
      0
    ) || 0;
  const getTotalToolCalls = () =>
    trackingData?.tool_calls_by_tool_name?.reduce(
      (sum, item) => sum + (item.total_calls || 0),
      0
    ) || 0;
  const getTotalPageViews = () =>
    trackingData?.page_open_count_by_page_name?.reduce(
      (sum, item) => sum + (item.total_open_count || 0),
      0
    ) || 0;
  const getTotalTokenUsage = () =>
    trackingData?.token_usage_by_token_name?.reduce(
      (sum, item) => sum + (item.total_usage || 0),
      0
    ) || 0;

  // Prepare chart data
  const growthData = waitlistUsers.map((user, index) => ({
    name: `Day ${index + 1}`,
    users: index + 1,
  }));

  const countryData = waitlistUsers.reduce(
    (acc: Record<string, number>, user) => {
      const country = user.country || "Unknown";
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    },
    {}
  );

  const pieChartData = Object.entries(countryData).map(([name, value]) => ({
    name,
    value,
  }));

  // Recent activity data (last 7 days of button clicks)
  const recentClicksData = trackingData?.button_clicks_by_date?.slice(-7) || [];

  const COLORS = ["#00FFA1", "#8B5CF6", "#06B6D4", "#F59E0B", "#EF4444"];

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
        {/* Welcome Alert */}
        <Alert className="border-green-500/20 bg-green-500/10">
          <AlertCircle className="h-5 w-5 mr-2 text-green-400" />
          <AlertDescription className="text-green-100">
            <span className="font-semibold">
              Welcome back, {user?.name || "Admin"}!
            </span>{" "}
            The dashboard has been updated with the latest data.
          </AlertDescription>
        </Alert>

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <AnimatedText gradient>Admin Dashboard</AnimatedText>
            </h1>
            <p className="text-gray-400">
              Overview of your application performance and waitlist metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/analytics")}
              variant="outline"
              className="border-solana/20 hover:bg-solana/10"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-solana to-purple-600 hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-white/10">
                <AddToWaitlistForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Waitlist Users */}
          <GlassCard className="text-center bg-gradient-to-br from-green-500/20 to-transparent">
            <Users className="w-10 h-10 mx-auto mb-2 text-green-400" />
            <h3 className="text-3xl font-bold text-green-400">
              {waitlistUsers.length}
            </h3>
            <p className="text-gray-400">Waitlist Users</p>
          </GlassCard>

          {/* Button Clicks */}
          <GlassCard className="text-center bg-gradient-to-br from-blue-500/20 to-transparent">
            <MousePointer className="w-10 h-10 mx-auto mb-2 text-blue-400" />
            <h3 className="text-3xl font-bold text-blue-400">
              {getTotalClicks().toLocaleString()}
            </h3>
            <p className="text-gray-400">Button Clicks</p>
          </GlassCard>

          {/* Tool Calls */}
          <GlassCard className="text-center bg-gradient-to-br from-purple-500/20 to-transparent">
            <Zap className="w-10 h-10 mx-auto mb-2 text-purple-400" />
            <h3 className="text-3xl font-bold text-purple-400">
              {getTotalToolCalls().toLocaleString()}
            </h3>
            <p className="text-gray-400">Tool Calls</p>
          </GlassCard>

          {/* Page Views */}
          <GlassCard className="text-center bg-gradient-to-br from-orange-500/20 to-transparent">
            <Eye className="w-10 h-10 mx-auto mb-2 text-orange-400" />
            <h3 className="text-3xl font-bold text-orange-400">
              {getTotalPageViews().toLocaleString()}
            </h3>
            <p className="text-gray-400">Page Views</p>
          </GlassCard>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waitlist Growth */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Waitlist Growth</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#00FFA1"
                    strokeWidth={3}
                    dot={{ fill: "#00FFA1", r: 4 }}
                    activeDot={{ r: 6, fill: "#00FFA1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Recent Activity (Button Clicks) */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Recent Activity (7 Days)</h3>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentClicksData}>
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
                  <YAxis stroke="#666" fontSize={12} />
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
                    type="monotone"
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
        </div>

        {/* Geographic Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 p-6">
            <h3 className="text-lg font-medium mb-4">
              Geographic Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
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
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-medium mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Token Usage</span>
                <span className="text-orange-400 font-semibold">
                  {getTotalTokenUsage().toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Countries</span>
                <span className="text-green-400 font-semibold">
                  {Object.keys(countryData).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg. per User</span>
                <span className="text-purple-400 font-semibold">
                  {waitlistUsers.length > 0
                    ? (getTotalClicks() / waitlistUsers.length).toFixed(1)
                    : 0}{" "}
                  clicks
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Growth Rate</span>
                <span className="text-blue-400 font-semibold">
                  +{waitlistUsers.length}%
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
