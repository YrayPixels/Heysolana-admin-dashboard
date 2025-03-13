
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/ui-custom/DataTable';
import { getWaitlistUsers, WaitlistUser } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Copy, Users } from 'lucide-react';
import { toast } from 'sonner';
import GlassCard from '@/components/ui-custom/GlassCard';
import AnimatedText from '@/components/ui-custom/AnimatedText';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/layouts/DashboardLayout';

const WaitlistPage = () => {
  const { data: waitlistUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['waitlist'],
    queryFn: getWaitlistUsers,
  });

  const waitlistCount = waitlistUsers.length;

  // Handlers
  const handleCopyEmails = () => {
    const emails = waitlistUsers.map(user => user.email_address).join('\n');
    navigator.clipboard.writeText(emails);
    toast.success('All emails copied to clipboard');
  };

  // Table columns configuration - simplified to debug display issues
  const columns = [
    {
      header: 'S/N',
      accessorKey: 'index',
      cell: (info: { row: { index: number } }) => <span className="font-medium">{info.row.index + 1}</span>
    },
    {
      header: 'First Name',
      accessorKey: 'first_name',
    },
    {
      header: 'Last Name',
      accessorKey: 'last_name',
    },
    {
      header: 'Email',
      accessorKey: 'email_address',
    },
    {
      header: 'Country',
      accessorKey: 'country',
    },
    {
      header: 'Wallet Address',
      accessorKey: 'wallet_address',
      cell: (info: any) => (
        <div className="flex items-center">
          <span className="truncate max-w-36 md:max-w-72 font-medium">{info.getValue()}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(info.getValue());
              toast.success('Wallet address copied');
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  // Debug the data
  console.log("Waitlist users count:", waitlistUsers.length);
  console.log("Sample user data:", waitlistUsers[0]);

  return (
    <DashboardLayout>
      <div className="container py-6 animate-fade">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <AnimatedText 
              text="Waitlist Management" 
              className="text-2xl sm:text-3xl font-bold mb-2" 
            />
            <p className="text-gray-400">Track and manage users who have signed up for early access.</p>
          </div>
          <div className="flex items-center mt-4 md:mt-0 space-x-3">
            <Badge variant="outline" className="px-3 py-1 bg-black/30 border-green-400/30">
              <Users className="w-3 h-3 mr-1" />
              <span>{waitlistCount} Users</span>
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-black/30 border-white/10 hover:bg-black/40"
              onClick={handleCopyEmails}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy All Emails
            </Button>
            <Button 
              onClick={() => refetch()} 
              size="sm"
              className="bg-green-500/80 hover:bg-green-500 text-black font-medium"
            >
              Refresh
            </Button>
          </div>
        </div>

        <GlassCard className="bg-black/30 border border-white/5">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-black/40">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="recent">Recent Signups</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
              ) : (
                <DataTable 
                  data={waitlistUsers} 
                  columns={columns}
                />
              )}
            </TabsContent>
            
            <TabsContent value="recent">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
              ) : (
                <DataTable 
                  data={waitlistUsers.slice(0, 5)} 
                  columns={columns}
                />
              )}
            </TabsContent>
            
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-green-500/20 to-transparent rounded-lg border border-white/5">
                  <h3 className="text-3xl font-bold text-white">{waitlistCount}</h3>
                  <p className="text-gray-400">Total Signups</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-500/20 to-transparent rounded-lg border border-white/5">
                  <h3 className="text-3xl font-bold text-white">
                    {Math.round(waitlistCount * 0.6)}
                  </h3>
                  <p className="text-gray-400">Unique Wallets</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-blue-500/20 to-transparent rounded-lg border border-white/5">
                  <h3 className="text-3xl font-bold text-white">
                    {waitlistUsers.filter(u => u.country === 'Nigeria').length}
                  </h3>
                  <p className="text-gray-400">From Nigeria</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default WaitlistPage;
