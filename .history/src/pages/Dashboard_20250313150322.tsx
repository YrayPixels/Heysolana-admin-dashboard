
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWaitlistUsers } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import GlassCard from '@/components/ui-custom/GlassCard';
import StatsCard from '@/components/ui-custom/StatsCard';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { AlertCircle, GitBranch, Users } from 'lucide-react';
import AnimatedText from '@/components/ui-custom/AnimatedText';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AddToWaitlistForm from '@/components/ui-custom/AddToWaitlistForm';
import DashboardLayout from '@/layouts/DashboardLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  const { data: waitlistUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['waitlist'],
    queryFn: getWaitlistUsers,
  });

  // Hide welcome message after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // Generate country data for charts
  const countryData = waitlistUsers.reduce((acc: Record<string, number>, user) => {
    acc[user.country] = (acc[user.country] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.entries(countryData).map(([name, value]) => ({ name, value }));
  
  // Hardcoded sample data for growth chart
  const growthData = [
    { day: 'Mon', users: 5 },
    { day: 'Tue', users: 8 },
    { day: 'Wed', users: 12 },
    { day: 'Thu', users: 15 },
    { day: 'Fri', users: 20 },
    { day: 'Sat', users: 25 },
    { day: 'Sun', users: waitlistUsers.length || 30 },
  ];

  // Colors for the charts
  const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#0088FE'];

  return (
    <DashboardLayout>
      <div className="container py-6 animate-fade">
        {showWelcome && (
          <div className="fixed inset-x-0 top-20 flex justify-center z-50 animate-fade-up animate-duration-500">
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-green-400" />
              <span>
                <span className="font-semibold">Welcome back, {user?.username || 'Admin'}!</span> 
                {' '}The dashboard has been updated with the latest data.
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                className="ml-2 h-6 w-6 p-0" 
                onClick={() => setShowWelcome(false)}
              >
                ×
              </Button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <AnimatedText
                text="Dashboard Overview"
                className="text-2xl sm:text-3xl font-bold mb-2"
              />
              <p className="text-gray-400">Get insights into your waitlist performance</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-500/80 hover:bg-green-500 text-black font-semibold">
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle>Add User to Waitlist</DialogTitle>
                </DialogHeader>
                <AddToWaitlistForm onSuccess={() => refetch()} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard className="text-center bg-gradient-to-br from-green-500/20 to-transparent" style={{ animationDelay: '100ms' }}>
            <Users className="w-10 h-10 mx-auto mb-2 text-green-400" />
            <h3 className="text-3xl font-bold">{waitlistUsers.length}</h3>
            <p className="text-gray-400">Total Users</p>
          </GlassCard>
          
          <GlassCard className="text-center bg-gradient-to-br from-blue-500/20 to-transparent" style={{ animationDelay: '200ms' }}>
            <GitBranch className="w-10 h-10 mx-auto mb-2 text-blue-400" />
            <h3 className="text-3xl font-bold">
              {Object.keys(countryData).length}
            </h3>
            <p className="text-gray-400">Countries</p>
          </GlassCard>
          
          <StatsCard
            title="Engagement Rate"
            value={78}
            trend={{ value: 12, isPositive: true }}
            description="vs. last month"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <GlassCard className="lg:col-span-2 overflow-hidden bg-black/20" style={{ animationDelay: '400ms' }}>
            <h3 className="text-lg font-medium mb-4">Waitlist Growth</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <XAxis dataKey="day" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      borderColor: 'rgba(255, 255, 255, 0.1)' 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#4ade80" 
                    strokeWidth={2}
                    dot={{ fill: '#4ade80', r: 4 }}
                    activeDot={{ r: 6, fill: '#4ade80' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden bg-black/20" style={{ animationDelay: '500ms' }}>
            <h3 className="text-lg font-medium mb-4">Users by Country</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie  
                  width={400}
                  height={400}
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      borderColor: 'rgba(255, 255, 255, 0.1)' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <style>{`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          [data-animate="true"] {
            animation: fadeUp 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
