import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
  getChowdeckOrder,
  updateChowdeckOrderStatus,
  ChowdeckOrderItem,
} from "@/services/api";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "pending":
      return "secondary";
    case "confirmed":
    case "processing":
      return "default";
    case "out_for_delivery":
      return "outline";
    case "delivered":
      return "default";
    case "cancelled":
    case "refunded":
      return "destructive";
    default:
      return "outline";
  }
}

function formatModifiers(item: ChowdeckOrderItem): string {
  if (!item.modifiers || !Array.isArray(item.modifiers) || item.modifiers.length === 0) {
    return "";
  }
  return item.modifiers
    .map((m) => m.option_name || m.name || "")
    .filter(Boolean)
    .join(", ");
}

const ChowdeckOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const id = orderId ? parseInt(orderId, 10) : NaN;
  const { data, isLoading } = useQuery({
    queryKey: ["chowdeck-order", id],
    queryFn: () => getChowdeckOrder(id),
    enabled: !Number.isNaN(id),
  });

  const order = data?.data;

  const handleUpdateStatus = async () => {
    if (Number.isNaN(id) || !newStatus) return;
    setIsUpdating(true);
    const result = await updateChowdeckOrderStatus(id, {
      status: newStatus,
      payment_status: paymentStatus || undefined,
      notes: statusNotes || undefined,
    });
    setIsUpdating(false);
    if (result?.success) {
      setStatusNotes("");
      queryClient.invalidateQueries({ queryKey: ["chowdeck-order", id] });
      queryClient.invalidateQueries({ queryKey: ["chowdeck-orders"] });
      queryClient.invalidateQueries({ queryKey: ["chowdeck-order-stats"] });
      toast.success("Status updated");
    }
  };

  if (Number.isNaN(id)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid order ID</p>
          <Button variant="link" onClick={() => navigate("/orders")} className="mt-2">
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
            onClick={() => navigate("/orders")}
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chowdeck order</h1>
            <p className="text-muted-foreground">{order?.order_number ?? `Order #${id}`}</p>
          </div>
        </div>

        {isLoading || !order ? (
          <Card className="bg-black/30 border-white/10">
            <CardContent className="py-12 text-center text-muted-foreground">
              {isLoading ? "Loading order…" : "Order not found"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-black/30 border-white/10 md:col-span-2">
              <CardHeader>
                <CardTitle>Order details</CardTitle>
                <CardDescription>Chowdeck food order information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground text-sm">Order number</span>
                    <p className="font-mono font-medium">{order.order_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Vendor</span>
                    <p className="font-medium">
                      {order.vendor_name ?? "—"}
                      {order.vendor_id ? (
                        <span className="text-muted-foreground text-sm"> (#{order.vendor_id})</span>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Status</span>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Payment</span>
                    <div className="mt-1">
                      <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                        {order.payment_status}
                        {order.payment_method ? ` · ${order.payment_method}` : ""}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Total</span>
                    <p>
                      {order.currency} {Number(order.total_amount).toLocaleString()}
                      {order.amount_usd != null ? (
                        <span className="text-muted-foreground text-sm">
                          {" "}
                          (~${Number(order.amount_usd).toFixed(2)} USD)
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Date</span>
                    <p>{formatDate(order.order_date || order.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Wallet</span>
                    <p className="font-mono text-xs break-all">{order.wallet_address}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Customer</span>
                    <p>
                      {order.customer_name ?? order.user?.name ?? "—"}
                      {order.phone_number ? ` — ${order.phone_number}` : ""}
                    </p>
                  </div>
                </div>

                {order.formatted_address && (
                  <div>
                    <h4 className="font-medium mb-1">Delivery address</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {order.formatted_address}
                    </p>
                    {order.delivery_instructions && (
                      <p className="text-sm mt-1 text-muted-foreground">
                        Instructions: {order.delivery_instructions}
                      </p>
                    )}
                  </div>
                )}

                {order.order_items && order.order_items.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Items</h4>
                    <ul className="space-y-2 text-sm">
                      {order.order_items.map((item) => {
                        const mods = formatModifiers(item);
                        return (
                          <li key={item.id}>
                            {item.product_name} × {item.quantity} — {order.currency}{" "}
                            {Number(item.unit_price).toLocaleString()} each
                            {item.total_price != null && (
                              <>
                                {" "}
                                · {order.currency} {Number(item.total_price).toLocaleString()}
                              </>
                            )}
                            {mods ? (
                              <span className="text-muted-foreground"> ({mods})</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                    {(order.subtotal != null || order.delivery_fee != null) && (
                      <div className="mt-3 text-sm text-muted-foreground space-y-1">
                        {order.subtotal != null && (
                          <p>
                            Subtotal: {order.currency} {Number(order.subtotal).toLocaleString()}
                          </p>
                        )}
                        {order.delivery_fee != null && (
                          <p>
                            Delivery: {order.currency}{" "}
                            {Number(order.delivery_fee).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {order.notes && (
                  <div>
                    <h4 className="font-medium mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-white/10">
              <CardHeader>
                <CardTitle>Update status</CardTitle>
                <CardDescription>Change fulfillment and payment status</CardDescription>
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
                  <Label>Payment status (optional)</Label>
                  <Select
                    value={paymentStatus || order.payment_status}
                    onValueChange={setPaymentStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
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
                  disabled={
                    isUpdating ||
                    (!newStatus && !paymentStatus && !statusNotes) ||
                    (newStatus === order.status &&
                      (!paymentStatus || paymentStatus === order.payment_status) &&
                      !statusNotes)
                  }
                >
                  {isUpdating ? "Updating…" : "Update status"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChowdeckOrderDetail;
