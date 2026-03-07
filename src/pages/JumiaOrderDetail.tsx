import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  getJumiaOrder,
  updateJumiaOrderStatus,
  JumiaOrder,
  JumiaDeliveryAddress,
} from '@/services/api';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
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

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDeliveryAddress(addr: JumiaDeliveryAddress | null | undefined): string {
  if (!addr) return '—';
  const full =
    addr.full_address ??
    [
      addr.address_line_1,
      addr.address_line_2,
      addr.city,
      addr.state,
      addr.postal_code,
      addr.country,
    ]
      .filter(Boolean)
      .join(', ');
  return full || '—';
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

const JumiaOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const id = orderId ? parseInt(orderId, 10) : NaN;
  const { data, isLoading } = useQuery({
    queryKey: ['jumia-order', id],
    queryFn: () => getJumiaOrder(id),
    enabled: !Number.isNaN(id),
  });

  const order = data?.data;

  useEffect(() => {
    if (order) setTrackingNumber(order.tracking_number || '');
  }, [order?.id]);

  const handleUpdateStatus = async () => {
    if (Number.isNaN(id) || !newStatus) return;
    setIsUpdating(true);
    const result = await updateJumiaOrderStatus(id, {
      status: newStatus,
      tracking_number: trackingNumber || undefined,
      notes: statusNotes || undefined,
    });
    setIsUpdating(false);
    if (result?.success) {
      setStatusNotes('');
      queryClient.invalidateQueries({ queryKey: ['jumia-order', id] });
      queryClient.invalidateQueries({ queryKey: ['jumia-orders'] });
      queryClient.invalidateQueries({ queryKey: ['jumia-order-stats'] });
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
            <h1 className="text-2xl font-bold tracking-tight">Jumia order</h1>
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
                <CardDescription>Jumia order information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground text-sm">Order number</span>
                    <p className="font-mono font-medium">{order.order_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Jumia order ID</span>
                    <p className="font-mono text-sm">{order.jumia_order_id ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Status</span>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status_label ?? order.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Payment</span>
                    <div className="mt-1">
                      <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {order.payment_status_label ?? order.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Total</span>
                    <p>
                      {order.formatted_total ??
                        `${order.currency} ${Number(order.total_amount).toLocaleString()}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Date</span>
                    <p>{formatDate(order.order_date || order.created_at)}</p>
                  </div>
                  {order.tracking_number && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground text-sm">Tracking number</span>
                      <p className="font-mono">{order.tracking_number}</p>
                    </div>
                  )}
                </div>

                {order.user && (
                  <div>
                    <h4 className="font-medium mb-1">Customer</h4>
                    <p className="text-sm text-muted-foreground">
                      {order.user.name} — {order.user.email}
                    </p>
                  </div>
                )}

                {order.delivery_address && (
                  <div>
                    <h4 className="font-medium mb-1">Delivery address</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {formatDeliveryAddress(order.delivery_address)}
                    </p>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {order.delivery_address.full_name} — {order.delivery_address.phone_number}
                      {order.delivery_address.email ? ` · ${order.delivery_address.email}` : ''}
                    </p>
                  </div>
                )}

                {order.order_items && order.order_items.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Items</h4>
                    <ul className="space-y-1 text-sm">
                      {order.order_items.map((item) => (
                        <li key={item.id}>
                          {item.product_name} × {item.quantity} — {order.currency}{' '}
                          {Number(item.unit_price).toLocaleString()} each
                          {item.total_price != null && (
                            <> · {order.currency} {Number(item.total_price).toLocaleString()}</>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-white/10">
              <CardHeader>
                <CardTitle>Update status</CardTitle>
                <CardDescription>Change status and optionally add tracking or notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newStatus || order.status} onValueChange={setNewStatus}>
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
                <div className="space-y-2">
                  <Label>Tracking number (optional)</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. TRK123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Internal note for this status change"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || (newStatus && newStatus === order.status && !trackingNumber && !statusNotes)}
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

export default JumiaOrderDetail;
