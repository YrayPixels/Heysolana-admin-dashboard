import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  User as UserIcon,
  Phone,
  Wallet,
  Shield,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getUsers, User, UsersResponse, UsersFilters } from '@/services/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [itemsPerPage] = useState(10);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  // API call to fetch users from backend
  const fetchUsers = async (): Promise<UsersResponse | null> => {
    const filters: UsersFilters = {
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      wallet_status: walletFilter !== 'all' ? walletFilter : undefined,
      page: currentPage,
      per_page: itemsPerPage,
      sort_field: sortField,
      sort_direction: sortDirection
    };
    
    return await getUsers(filters);
  };

  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['users', searchTerm, statusFilter, walletFilter, currentPage, sortField, sortDirection],
    queryFn: fetchUsers,
    placeholderData: (previousData) => previousData
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    toast.info('Export functionality will be implemented soon');
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Users data refreshed');
  };

  const handleCopyWallet = async (walletAddress: string) => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopiedWallet(walletAddress);
      toast.success('Wallet address copied to clipboard');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedWallet(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy wallet address:', error);
      toast.error('Failed to copy wallet address');
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getWalletStatusBadge = (walletAddress: string) => {
    if (walletAddress && walletAddress !== '') {
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Has Wallet</Badge>;
    } else {
      return <Badge variant="secondary">No Wallet</Badge>;
    }
  };

  const getPinStatusBadge = (pin: string) => {
    if (pin && pin !== '') {
      return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">PIN Set</Badge>;
    } else {
      return <Badge variant="secondary">No PIN</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateWallet = (wallet: string) => {
    if (!wallet) return 'N/A';
    return `${wallet.substring(0, 8)}...${wallet.substring(wallet.length - 8)}`;
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
                <p className="text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              Manage and monitor user accounts across the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                const wallets = usersData?.users
                  ?.filter(u => u.wallet_address && u.wallet_address !== '')
                  ?.map(u => u.wallet_address)
                  ?.join('\n');
                if (wallets) {
                  navigator.clipboard.writeText(wallets);
                  toast.success('All wallet addresses copied to clipboard');
                } else {
                  toast.info('No wallet addresses to copy');
                }
              }}
              disabled={!usersData?.users?.some(u => u.wallet_address && u.wallet_address !== '')}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All Wallets
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersData?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                All registered users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersData?.users?.filter(u => u.verification_status === 'verified').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully verified
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Users</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersData?.users?.filter(u => u.wallet_address && u.wallet_address !== '').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                With wallet addresses
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PIN Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersData?.users?.filter(u => u.pin && u.pin !== '').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                With security PINs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
            <CardDescription>
              Narrow down users by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Wallet Status</label>
                <Select value={walletFilter} onValueChange={setWalletFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All wallet statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wallet Statuses</SelectItem>
                    <SelectItem value="has_wallet">Has Wallet</SelectItem>
                    <SelectItem value="no_wallet">No Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Items per Page</label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setCurrentPage(1)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              A list of all registered users with their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('username')}
                        >
                          <div className="flex items-center gap-2">
                            User
                            {sortField === 'username' && (
                              <span className="text-xs">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('phone_number')}
                        >
                          <div className="flex items-center gap-2">
                            Phone
                            {sortField === 'phone_number' && (
                              <span className="text-xs">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('wallet_address')}
                        >
                          <div className="flex items-center gap-2">
                            Wallet
                            {sortField === 'wallet_address' && (
                              <span className="text-xs">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Wallet Status</TableHead>
                        <TableHead>PIN Status</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Created
                            {sortField === 'created_at' && (
                              <span className="text-xs">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{user.username}</div>
                                <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {user.phone_number}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-mono text-sm cursor-help">
                                      {truncateWallet(user.wallet_address)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-mono text-xs max-w-xs break-all">
                                      {user.wallet_address || 'No wallet address'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {user.wallet_address && user.wallet_address !== '' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-muted/50"
                                  onClick={() => handleCopyWallet(user.wallet_address)}
                                  title="Copy wallet address"
                                >
                                  {copiedWallet === user.wallet_address ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user.verification_status)}
                          </TableCell>
                          <TableCell>
                            {getWalletStatusBadge(user.wallet_address)}
                          </TableCell>
                          <TableCell>
                            {getPinStatusBadge(user.pin)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDate(user.created_at)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {usersData && usersData.last_page > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, usersData.last_page) }, (_, i) => {
                          let pageNum;
                          if (usersData.last_page <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= usersData.last_page - 2) {
                            pageNum = usersData.last_page - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        {usersData.last_page > 5 && currentPage < usersData.last_page - 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(Math.min(usersData.last_page, currentPage + 1))}
                            className={currentPage === usersData.last_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

                {/* Results Info */}
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, usersData?.total || 0)} of {usersData?.total || 0} results
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Users;
