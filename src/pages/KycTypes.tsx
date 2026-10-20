import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useConfirm } from "@/components/ConfirmDialog";
import {
  AdminKycType,
  KycFieldKind,
  createKycType,
  deleteKycType,
  fetchKycTypes,
  updateKycType,
} from "@/services/api";

const FIELD_KINDS: KycFieldKind[] = [
  "text",
  "number",
  "date",
  "select",
  "image",
  "document",
];

const KycTypes = () => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fieldKind, setFieldKind] = useState<KycFieldKind>("text");
  const [providerKey, setProviderKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data: kycTypes = [], isLoading, refetch } = useQuery({
    queryKey: ["kyc-types"],
    queryFn: fetchKycTypes,
  });

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setFieldKind("text");
    setProviderKey("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    const created = await createKycType({
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      field_kind: fieldKind,
      provider_key: providerKey.trim() || null,
    });
    setSubmitting(false);
    if (created) {
      queryClient.invalidateQueries({ queryKey: ["kyc-types"] });
      resetForm();
      setCreateOpen(false);
    }
  };

  const toggleStatus = async (item: AdminKycType) => {
    const next = item.status === "active" ? "disabled" : "active";
    setBusyId(item.id);
    const updated = await updateKycType(item.id, { status: next });
    setBusyId(null);
    if (updated) queryClient.invalidateQueries({ queryKey: ["kyc-types"] });
  };

  const handleDelete = async (item: AdminKycType) => {
    const ok = await confirm({
      title: "Delete KYC type?",
      description: `Delete "${item.name}"? It must not be attached to any wallet type.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    setBusyId(item.id);
    const deleted = await deleteKycType(item.id);
    setBusyId(null);
    if (deleted) queryClient.invalidateQueries({ queryKey: ["kyc-types"] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC types</h1>
            <p className="text-muted-foreground">
              Define fields (text, date, images) required when activating wallets.
              Use provider keys like <code>bvn</code>, <code>nin</code>,{" "}
              <code>dateOfBirth</code> for VFD.
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
                  Add KYC type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background border-white/10">
                <DialogHeader>
                  <DialogTitle>Add KYC type</DialogTitle>
                  <DialogDescription>
                    Create a reusable requirement you can attach to wallet types.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="BVN"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug (optional)</Label>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="bvn"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field kind</Label>
                      <Select
                        value={fieldKind}
                        onValueChange={(v) => setFieldKind(v as KycFieldKind)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_KINDS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {k}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Provider key (optional)</Label>
                      <Input
                        value={providerKey}
                        onChange={(e) => setProviderKey(e.target.value)}
                        placeholder="bvn | nin | dateOfBirth | address"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short help text for users"
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
              <ShieldCheck className="h-5 w-5" />
              Catalog
            </CardTitle>
            <CardDescription>
              Attach these to wallet types from the Wallet types page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : kycTypes.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No KYC types yet. Seed the catalog or add one manually.
              </p>
            ) : (
              <div className="rounded-md border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Provider key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycTypes.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.slug}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{item.field_kind}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.provider_key || "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              item.status === "active"
                                ? "text-teal-400"
                                : "text-muted-foreground"
                            }
                          >
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === item.id}
                            onClick={() => toggleStatus(item)}
                          >
                            {item.status === "active" ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busyId === item.id}
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

export default KycTypes;
