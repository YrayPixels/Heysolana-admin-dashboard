import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  AdminWalletType,
  createWalletType,
  fetchKycTypes,
  fetchWalletTypes,
  syncWalletTypeKyc,
  updateWalletType,
} from "@/services/api";

const WalletTypes = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminWalletType | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<"crypto" | "fiat">("crypto");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [activeRail, setActiveRail] = useState("pajcash");
  const [targetTier, setTargetTier] = useState("1");
  const [selectedKyc, setSelectedKyc] = useState<
    Record<number, { checked: boolean; required: boolean }>
  >({});

  const { data: walletTypes = [], isLoading, refetch } = useQuery({
    queryKey: ["wallet-types"],
    queryFn: fetchWalletTypes,
  });

  const { data: kycTypes = [] } = useQuery({
    queryKey: ["kyc-types"],
    queryFn: fetchKycTypes,
  });

  const openEdit = (wt: AdminWalletType) => {
    setEditing(wt);
    const cfg = (wt.provider_config || {}) as Record<string, unknown>;
    const vfd = (cfg.vfd || {}) as Record<string, unknown>;
    setActiveRail(String(cfg.active_rail || "pajcash"));
    setTargetTier(String(vfd.target_tier || "1"));
    const map: Record<number, { checked: boolean; required: boolean }> = {};
    for (const k of kycTypes) {
      const attached = wt.kyc_types?.find((x) => x.id === k.id);
      map[k.id] = {
        checked: Boolean(attached),
        required: attached?.required ?? true,
      };
    }
    setSelectedKyc(map);
    setEditOpen(true);
  };

  useEffect(() => {
    if (!editing || !editOpen) return;
    setSelectedKyc((prev) => {
      const next = { ...prev };
      for (const k of kycTypes) {
        if (!next[k.id]) {
          const attached = editing.kyc_types?.find((x) => x.id === k.id);
          next[k.id] = {
            checked: Boolean(attached),
            required: attached?.required ?? true,
          };
        }
      }
      return next;
    });
  }, [kycTypes, editing, editOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    const created = await createWalletType({
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      category,
      status: "draft",
      provider: category === "fiat" ? "vfd" : "local",
      provider_config:
        category === "fiat"
          ? {
              active_rail: "pajcash",
              vfd: {
                mode: "pool",
                create_path: "tiers_individual",
                target_tier: "1",
              },
            }
          : null,
    });
    setSubmitting(false);
    if (created) {
      queryClient.invalidateQueries({ queryKey: ["wallet-types"] });
      setName("");
      setSlug("");
      setDescription("");
      setCategory("crypto");
      setCreateOpen(false);
    }
  };

  const setStatus = async (wt: AdminWalletType, status: string) => {
    setBusyId(wt.id);
    const updated = await updateWalletType(wt.id, { status });
    setBusyId(null);
    if (updated) queryClient.invalidateQueries({ queryKey: ["wallet-types"] });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSubmitting(true);

    const provider_config =
      editing.slug === "fiat_ngn" || editing.category === "fiat"
        ? {
            ...(editing.provider_config || {}),
            active_rail: activeRail,
            vfd: {
              ...((editing.provider_config?.vfd as object) || {}),
              mode: "pool",
              create_path: "tiers_individual",
              target_tier: targetTier,
            },
          }
        : editing.provider_config;

    const updated = await updateWalletType(editing.id, { provider_config });
    const kycPayload = Object.entries(selectedKyc)
      .filter(([, v]) => v.checked)
      .map(([id, v], index) => ({
        kyc_type_id: Number(id),
        required: v.required,
        sort_order: index,
      }));
    const synced = await syncWalletTypeKyc(editing.id, kycPayload);
    setSubmitting(false);
    if (updated || synced) {
      queryClient.invalidateQueries({ queryKey: ["wallet-types"] });
      setEditOpen(false);
      setEditing(null);
    }
  };

  const railLabel = useMemo(() => {
    return (wt: AdminWalletType) => {
      const rail = (wt.provider_config as { active_rail?: string } | null)
        ?.active_rail;
      return rail || wt.provider || "—";
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wallet types</h1>
            <p className="text-muted-foreground">
              Activate Solana, NGN fiat, Stellar, and future chains. Attach KYC
              requirements and switch the NGN rail (PajCash → VFD) when ready.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add wallet type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background border-white/10">
                <DialogHeader>
                  <DialogTitle>Add wallet type</DialogTitle>
                  <DialogDescription>
                    New types start as draft. Activate them when ready for the
                    app.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug (optional)</Label>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={category}
                        onValueChange={(v) =>
                          setCategory(v as "crypto" | "fiat")
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="crypto">crypto</SelectItem>
                          <SelectItem value="fiat">fiat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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
                      {submitting ? "Creating..." : "Create"}
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
              <Wallet className="h-5 w-5" />
              Catalog
            </CardTitle>
            <CardDescription>
              Only <strong>active</strong> types appear in the app Add account
              flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : walletTypes.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No wallet types. Run{" "}
                <code>php artisan db:seed --class=WalletCatalogSeeder</code>.
              </p>
            ) : (
              <div className="rounded-md border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Rail / provider</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletTypes.map((wt) => (
                      <TableRow key={wt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{wt.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {wt.slug}
                              {wt.is_builtin ? " · builtin" : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{wt.category}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {railLabel(wt)}
                        </TableCell>
                        <TableCell>
                          {wt.kyc_types?.length
                            ? wt.kyc_types.map((k) => k.slug).join(", ")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              wt.status === "active"
                                ? "text-teal-400"
                                : "text-muted-foreground"
                            }
                          >
                            {wt.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === wt.id}
                            onClick={() => openEdit(wt)}
                          >
                            Configure
                          </Button>
                          {wt.status !== "active" ? (
                            <Button
                              size="sm"
                              disabled={busyId === wt.id}
                              onClick={() => setStatus(wt, "active")}
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === wt.id}
                              onClick={() => setStatus(wt, "disabled")}
                            >
                              Disable
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg bg-background border-white/10 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure {editing?.name}</DialogTitle>
              <DialogDescription>
                Set provider rail and KYC requirements for this wallet type.
              </DialogDescription>
            </DialogHeader>
            {editing && (
              <div className="grid gap-4 py-2">
                {(editing.category === "fiat" ||
                  editing.slug === "fiat_ngn") && (
                  <>
                    <div className="space-y-2">
                      <Label>Active NGN rail</Label>
                      <Select value={activeRail} onValueChange={setActiveRail}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pajcash">pajcash</SelectItem>
                          <SelectItem value="vfd">vfd</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>VFD target tier</Label>
                      <Select value={targetTier} onValueChange={setTargetTier}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 (BVN or NIN + DOB)</SelectItem>
                          <SelectItem value="2">2 (BVN + NIN + DOB)</SelectItem>
                          <SelectItem value="3">
                            3 (BVN + NIN + address + DOB)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-3">
                  <Label>KYC requirements</Label>
                  {kycTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No KYC types available.
                    </p>
                  ) : (
                    kycTypes.map((k) => {
                      const state = selectedKyc[k.id] || {
                        checked: false,
                        required: true,
                      };
                      return (
                        <div
                          key={k.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={state.checked}
                              onCheckedChange={(checked) =>
                                setSelectedKyc((prev) => ({
                                  ...prev,
                                  [k.id]: {
                                    ...state,
                                    checked: Boolean(checked),
                                  },
                                }))
                              }
                            />
                            <div>
                              <p className="text-sm font-medium">{k.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {k.field_kind}
                                {k.provider_key
                                  ? ` · ${k.provider_key}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          {state.checked && (
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Checkbox
                                checked={state.required}
                                onCheckedChange={(checked) =>
                                  setSelectedKyc((prev) => ({
                                    ...prev,
                                    [k.id]: {
                                      ...state,
                                      required: Boolean(checked),
                                    },
                                  }))
                                }
                              />
                              Required
                            </label>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default WalletTypes;
