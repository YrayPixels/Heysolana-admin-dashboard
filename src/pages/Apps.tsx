import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppWindow, Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AppRegistration,
  AppRegistrationPayload,
  createAppRegistration,
  deleteAppRegistration,
  getAppRegistrations,
} from "@/services/api";
import { AppEditor } from "@/components/apps/AppEditor";

const statusVariant = (status: AppRegistration["status"]) => {
  if (status === "published") return "default";
  if (status === "disabled") return "destructive";
  return "outline";
};

const Apps = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["app-registrations"],
    queryFn: () => getAppRegistrations({ per_page: 100 }),
  });

  const apps = data?.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.slug.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
    );
  }, [apps, search]);

  const publishedCount = apps.filter((app) => app.status === "published").length;

  const handleCreate = async (payload: AppRegistrationPayload) => {
    setSaving(true);
    try {
      const result = await createAppRegistration(payload);
      if (result) {
        setCreateOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["app-registrations"] });
        navigate(`/apps/${result.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: React.MouseEvent, app: AppRegistration) => {
    event.stopPropagation();
    const ok = await confirm({
      title: "Delete app registration?",
      description: `Delete "${app.name}" (${app.slug})? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    const deleted = await deleteAppRegistration(app.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["app-registrations"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple/20">
              <AppWindow className="h-6 w-6 text-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Apps</h1>
              <p className="text-muted-foreground text-sm">
                Manage wallet app catalog registrations, publish state, and settings schemas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="bg-purple hover:bg-purple/90" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add app
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-morphism border-white/10">
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{apps.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-morphism border-white/10">
            <CardHeader className="pb-2">
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-3xl">{publishedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-morphism border-white/10">
            <CardHeader className="pb-2">
              <CardDescription>Featured</CardDescription>
              <CardTitle className="text-3xl">
                {apps.filter((app) => app.is_featured).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="glass-morphism border-white/10">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>App registrations</CardTitle>
              <CardDescription>Stable slugs are the identity used by the wallet client.</CardDescription>
            </div>
            <Input
              className="md:max-w-xs"
              placeholder="Search name, slug, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No app registrations found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((app) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/apps/${app.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {app.icon_url ? (
                            <img
                              src={app.icon_url}
                              alt={app.name}
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-muted" />
                          )}
                          <div>
                            <p className="font-medium">{app.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {app.short_description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{app.slug}</TableCell>
                      <TableCell>{app.category}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                          {app.visibility === "beta" ? (
                            <Badge variant="outline">beta</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {Number(app.ratings ?? 0).toFixed(1)} ★ · {app.user_count ?? 0} users ·{" "}
                        {app.review_count ?? 0} reviews
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {app.is_featured ? <Badge variant="outline">featured</Badge> : null}
                          {app.is_new ? <Badge variant="outline">new</Badge> : null}
                          {app.visibility === "beta" ? (
                            <Badge variant="outline">
                              allowlist {(app.beta_allowlist ?? []).length}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/apps/${app.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(event) => handleDelete(event, app)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create app registration</DialogTitle>
              <DialogDescription>
                Draft a catalog entry. Publish when the wallet capability registry is ready.
              </DialogDescription>
            </DialogHeader>
            <AppEditor saving={saving} submitLabel="Create app" onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Apps;
