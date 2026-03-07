import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  RefreshCw,
  Package,
  Eye,
  ChevronLeft,
  ChevronRight,
  Truck,
  CreditCard,
  DollarSign,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  getJumiaOrders,
  getJumiaOrderStats,
  JumiaOrder,
  JumiaOrdersFilters,
  getCrossmintOrders,
  getCrossmintOrderStats,
  CrossmintOrder,
  CrossmintOrdersFilters,
} from '@/services/api';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
  { value: 'refunded', label: 'Refunded' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'confirmed':
    case 'processing':
      return 'default';
    case 'shipped':
    case 'out_for_delivery':
      return 'outline';
    case 'delivered':
      return 'default';
    case 'cancelled':
    case 'returned':
    case 'refunded':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const CROSSMINT_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const Orders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  // Crossmint tab state
  const [cmPage, setCmPage] = useState(1);
  const [cmSearch, setCmSearch] = useState('');
  const [cmSearchDebounced, setCmSearchDebounced] = useState('');
  const [cmStatusFilter, setCmStatusFilter] = useState<string>('all');

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => {
    const t = setTimeout(() => setCmSearchDebounced(cmSearch), 300);
    return () => clearTimeout(t);
  }, [cmSearch]);

  const filters: JumiaOrdersFilters = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    payment_status: paymentFilter !== 'all' ? paymentFilter : undefined,
    search: searchDebounced || undefined,
    page,
    per_page: perPage,
  };

  const { data: ordersResponse, isLoading, refetch } = useQuery({
    queryKey: ['jumia-orders', statusFilter, paymentFilter, searchDebounced, page],
    queryFn: () => getJumiaOrders(filters),
    placeholderData: (prev) => prev,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['jumia-order-stats'],
    queryFn: getJumiaOrderStats,
  });

  const cmFilters: CrossmintOrdersFilters = {
    status: cmStatusFilter !== 'all' ? cmStatusFilter : undefined,
    search: cmSearchDebounced || undefined,
    page: cmPage,
    per_page: perPage,
  };
  const { data: crossmintResponse, isLoading: cmLoading, refetch: refetchCrossmint } = useQuery({
    queryKey: ['crossmint-orders', cmStatusFilter, cmSearchDebounced, cmPage],
    queryFn: () => getCrossmintOrders(cmFilters),
    placeholderData: (prev) => prev,
  });
  const { data: cmStats, isLoading: cmStatsLoading } = useQuery({
    queryKey: ['crossmint-order-stats'],
    queryFn: getCrossmintOrderStats,
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['jumia-order-stats'] });
    toast.success('Orders refreshed');
  };

  const orders = ordersResponse?.data ?? [];
  const meta = ordersResponse?.meta;

  const cmOrders = crossmintResponse?.data ?? [];
  const cmMeta = crossmintResponse?.meta;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            View and process Jumia and Crossmint (Amazon) orders
          </p>
        </div>

        <Tabs defaultValue="jumia" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/5">
            <TabsTrigger value="jumia" className="data-[state=active]:bg-white/10">
              Jumia
            </TabsTrigger>
            <TabsTrigger value="crossmint" className="data-[state=active]:bg-white/10">
              Crossmint (Amazon)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jumia" className="space-y-6 mt-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-black/30 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total_orders ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-black/30 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.pending_orders ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-black/30 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.delivered_orders ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-black/30 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (NGN)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.total_revenue != null
                    ? Number(stats.total_revenue).toLocaleString('en-NG', { minimumFractionDigits: 2 })
                    : '0.00'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter orders by status and search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Order number or customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Order status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment status</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleRefresh} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders table */}
        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>List of all placed orders</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>No orders found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id} className="border-white/5">
                          <TableCell>
                            <div className="font-mono font-medium">{order.order_number}</div>
                            {order.tracking_number && (
                              <div className="text-xs text-muted-foreground">
                                Track: {order.tracking_number}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.user ? (
                              <div>
                                <div className="font-medium">{order.user.name}</div>
                                <div className="text-sm text-muted-foreground">{order.user.email}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(order.order_date || order.created_at)}</TableCell>
                          <TableCell>
                            {order.formatted_total ?? `${order.currency} ${Number(order.total_amount).toLocaleString()}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status_label ?? order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {order.payment_status_label ?? order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/orders/jumia/${order.id}`)}
                                aria-label="View order details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/orders/jumia/${order.id}`)}
                              >
                                Update status
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {meta.current_page} of {meta.last_page} ({meta.total} orders)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.current_page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.current_page >= meta.last_page}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="crossmint" className="space-y-6 mt-6">
            {/* Crossmint stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {cmStatsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{cmStats?.total_orders ?? 0}</div>}
                </CardContent>
              </Card>
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {cmStatsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{cmStats?.pending_orders ?? 0}</div>}
                </CardContent>
              </Card>
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {cmStatsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{cmStats?.delivered_orders ?? 0}</div>}
                </CardContent>
              </Card>
              <Card className="bg-black/30 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {cmStatsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{cmStats?.cancelled_orders ?? 0}</div>}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/30 border-white/10">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter Crossmint (Amazon) orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Order number, wallet, ASIN..." value={cmSearch} onChange={(e) => setCmSearch(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={cmStatusFilter} onValueChange={setCmStatusFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CROSSMINT_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={() => { refetchCrossmint(); queryClient.invalidateQueries({ queryKey: ['crossmint-order-stats'] }); toast.success('Refreshed'); }} className="w-full">
                      <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-white/10">
              <CardHeader>
                <CardTitle>Crossmint orders</CardTitle>
                <CardDescription>Amazon orders placed via Crossmint</CardDescription>
              </CardHeader>
              <CardContent>
                {cmLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : cmOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
                    <p>No Crossmint orders found</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border border-white/10">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10">
                            <TableHead>Order</TableHead>
                            <TableHead>Wallet</TableHead>
                            <TableHead>ASIN</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cmOrders.map((order: CrossmintOrder) => (
                            <TableRow key={order.id} className="border-white/5">
                              <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                              <TableCell className="text-xs font-mono truncate max-w-[120px]">{order.wallet_address}</TableCell>
                              <TableCell>{order.asin}</TableCell>
                              <TableCell>{formatDate(order.order_date || order.created_at)}</TableCell>
                              <TableCell>
                                {order.total_amount != null ? `${order.currency} ${Number(order.total_amount).toLocaleString()}` : '—'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/orders/crossmint/${order.id}`)}
                                  aria-label="View order details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {cmMeta && cmMeta.last_page > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Page {cmMeta.current_page} of {cmMeta.last_page} ({cmMeta.total} orders)
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled={cmMeta.current_page <= 1} onClick={() => setCmPage((p) => Math.max(1, p - 1))}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" disabled={cmMeta.current_page >= cmMeta.last_page} onClick={() => setCmPage((p) => p + 1)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
