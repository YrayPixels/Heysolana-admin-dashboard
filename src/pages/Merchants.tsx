import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Mail,
  Phone,
  RefreshCw,
  Store,
  UserPlus,
  Pause,
  Play,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  AdminMerchant,
  createMerchant,
  deleteMerchant,
  fetchMerchants,
  resendMerchantInvite,
  updateMerchant,
} from "@/services/api";

const Merchants = () => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data: merchants = [], isLoading, refetch } = useQuery({
    queryKey: ["merchants"],
    queryFn: fetchMerchants,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      toast.error("Name and email are required");
      return;
    }
    setSubmitting(true);
    const created = await createMerchant({
      name: trimmedName,
      email: trimmedEmail,
      phone_number: phone.trim() || undefined,
    });
    setSubmitting(false);
    if (created) {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      setName("");
      setEmail("");
      setPhone("");
      setCreateOpen(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toggleStatus = async (merchant: AdminMerchant) => {
    const next = merchant.status === "active" ? "paused" : "active";
    setBusyId(merchant.id);
    const updated = await updateMerchant(merchant.id, { status: next });
    setBusyId(null);
    if (updated) {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
    }
  };

  const handleResend = async (merchant: AdminMerchant) => {
    setBusyId(merchant.id);
    await resendMerchantInvite(merchant.id);
    setBusyId(null);
  };

  const handleDelete = async (merchant: AdminMerchant) => {
    const ok = await confirm({
      title: "Delete merchant?",
      description: `Delete ${merchant.email}? Their orders, rates, and wallets will also be removed.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;

    setBusyId(merchant.id);
    const deleted = await deleteMerchant(merchant.id);
    setBusyId(null);
    if (deleted) {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Merchants</h1>
            <p className="text-muted-foreground">
              Invite exchange providers. They sign in at merchant.heyorova.com
              with Google using the email you add here.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add merchant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background border-white/10">
                <DialogHeader>
                  <DialogTitle>Add merchant</DialogTitle>
                  <DialogDescription>
                    Use the Google account email they will sign in with. An
                    invite email is sent automatically.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="merchant-name">Name</Label>
                      <Input
                        id="merchant-name"
                        placeholder="e.g. Lagos Liquidity"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merchant-email">Google email</Label>
                      <Input
                        id="merchant-email"
                        type="email"
                        placeholder="merchant@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merchant-phone">WhatsApp phone (optional)</Label>
                      <Input
                        id="merchant-phone"
                        placeholder="2348012345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Creating..." : "Add merchant"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Merchant accounts
            </CardTitle>
            <CardDescription>
              Currently single-merchant mode — add one primary provider first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : merchants.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No merchants yet. Add one with the Google email they will use to
                sign in.
              </p>
            ) : (
              <div className="rounded-md border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Google</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchants.map((merchant) => (
                      <TableRow key={merchant.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-semibold text-white">
                              {merchant.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="font-medium">{merchant.name}</p>
                              {merchant.is_primary && (
                                <p className="text-xs text-teal-400">Primary</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {merchant.email}
                            </div>
                            {merchant.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {merchant.phone_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              merchant.status === "active"
                                ? "rounded-full bg-teal-500/20 px-2 py-1 text-xs text-teal-300"
                                : "rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-300"
                            }
                          >
                            {merchant.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {merchant.google_linked ? "Linked" : "Pending sign-in"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(merchant.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === merchant.id}
                              onClick={() => handleResend(merchant)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Invite
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === merchant.id}
                              onClick={() => toggleStatus(merchant)}
                            >
                              {merchant.status === "active" ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" /> Pause
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" /> Activate
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === merchant.id}
                              onClick={() => handleDelete(merchant)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Merchants;
