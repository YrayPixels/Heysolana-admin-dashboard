import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  getCrossmintOrder,
  updateCrossmintOrderStatus,
  CrossmintOrder,
  CrossmintShippingAddress,
} from '@/services/api';
import { toast } from 'sonner';

const AMAZON_DP_BASE = 'https://www.amazon.com/dp';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatShippingAddress(addr: CrossmintShippingAddress | null | undefined): string {
  if (!addr) return '—';
  const parts = [
    addr.name,
    addr.line1,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', '),
    addr.country,
  ].filter(Boolean);
  return parts.join(' · ') || '—';
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'confirmed':
    case 'processing':
      return 'default';
    case 'shipped':
      return 'outline';
    case 'delivered':
      return 'default';
    case 'cancelled':
    case 'refunded':
      return 'destructive';
    default:
      return 'outline';
  }
}

const CrossmintOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const id = orderId ? parseInt(orderId, 10) : NaN;
  const { data, isLoading } = useQuery({
    queryKey: ['crossmint-order', id],
    queryFn: () => getCrossmintOrder(id),
    enabled: !Number.isNaN(id),
  });

  const order = data?.data;

  const handleUpdateStatus = async () => {
    if (Number.isNaN(id) || !newStatus) return;
    setIsUpdating(true);
    const result = await updateCrossmintOrderStatus(id, { status: newStatus });
    setIsUpdating(false);
    if (result?.success && result.data) {
      setNewStatus(result.data.status);
      queryClient.invalidateQueries({ queryKey: ['crossmint-order', id] });
      queryClient.invalidateQueries({ queryKey: ['crossmint-orders'] });
      queryClient.invalidateQueries({ queryKey: ['crossmint-order-stats'] });
      toast.success('Status updated');
    }
  };

  if (Number.isNaN(id)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid order ID</p>
          <Button variant="link" onClick={() => navigate('/orders')} className="mt-2">
            Back to Orders
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/orders')}
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Crossmint order</h1>
            <p className="text-muted-foreground">
              {order?.order_number ?? `Order #${id}`}
            </p>
          </div>
        </div>

        {isLoading || !order ? (
          <Card className="bg-black/30 border-white/10">
            <CardContent className="py-12 text-center text-muted-foreground">
              {isLoading ? 'Loading order…' : 'Order not found'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-black/30 border-white/10 md:col-span-2">
              <CardHeader>
                <CardTitle>Order details</CardTitle>
                <CardDescription>Crossmint (Amazon) order information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground text-sm">Order number</span>
                    <p className="font-mono font-medium">{order.order_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Crossmint ID</span>
                    <p className="font-mono text-sm">{order.crossmint_order_id ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Wallet</span>
                    <p className="font-mono text-xs break-all">{order.wallet_address}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">ASIN</span>
                    <p className="font-mono">{order.asin}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Status</span>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Total</span>
                    <p>
                      {order.total_amount != null
                        ? `${order.currency} ${Number(order.total_amount).toLocaleString()}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Date</span>
                    <p>{formatDate(order.order_date || order.created_at)}</p>
                  </div>
                </div>

                {order.recipient_email && (
                  <div>
                    <h4 className="font-medium mb-1">Recipient email</h4>
                    <p className="text-sm text-muted-foreground">{order.recipient_email}</p>
                  </div>
                )}

                {(order.shipping_address && Object.keys(order.shipping_address).length > 0) && (
                  <div>
                    <h4 className="font-medium mb-1">Shipping address</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {formatShippingAddress(order.shipping_address)}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <a
                    href={`${AMAZON_DP_BASE}/${order.asin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    View product on Amazon
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-white/10">
              <CardHeader>
                <CardTitle>Update status</CardTitle>
                <CardDescription>Change the order status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newStatus || order.status}
                    onValueChange={setNewStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
                <Button
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || (newStatus && newStatus === order.status)}
                >
                  {isUpdating ? 'Updating…' : 'Update status'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CrossmintOrderDetail;
