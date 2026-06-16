import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, ImageIcon, Megaphone, Plus, RefreshCw, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
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
  createNotificationNudge,
  deleteNotificationNudge,
  getNotificationNudges,
  NotificationNudge,
  NotificationNudgePayload,
} from "@/services/api";
import {
  NotificationNudgeEditor,
  NudgeStatsCards,
} from "@/components/notification-nudges/NotificationNudgeEditor";

const NotificationNudges = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["notification-nudges"],
    queryFn: () => getNotificationNudges({ per_page: 50 }),
  });

  const nudges = data?.data ?? [];
  const activeNudge = nudges.find((nudge) => nudge.enabled) ?? null;

  const handleCreate = async (payload: NotificationNudgePayload) => {
    setSaving(true);
    try {
      const result = await createNotificationNudge(payload);
      if (result) {
        setCreateOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["notification-nudges"] });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: React.MouseEvent, nudge: NotificationNudge) => {
    event.stopPropagation();
    if (!window.confirm(`Delete "${nudge.headline}"?`)) return;
    const deleted = await deleteNotificationNudge(nudge.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["notification-nudges"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple/20">
              <Megaphone className="h-6 w-6 text-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notification nudges</h1>
              <p className="text-muted-foreground text-sm">
                Manage in-app promo modals shown on the wallet dashboard.
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
              Add nudge
            </Button>
          </div>
        </div>

        {activeNudge ? (
          <div className="space-y-4">
            <Card className="glass-morphism border-emerald-500/30">
              <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <Badge className="mb-2 bg-emerald-500/20 text-emerald-300">Currently active</Badge>
                  <p className="font-semibold">{activeNudge.headline}</p>
                  <p className="text-sm text-muted-foreground">{activeNudge.campaign_key}</p>
                </div>
                <Button variant="outline" onClick={() => navigate(`/notification-nudges/${activeNudge.id}`)}>
                  View details
                </Button>
              </CardContent>
            </Card>
            <NudgeStatsCards nudge={activeNudge} />
          </div>
        ) : null}

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle>All nudges</CardTitle>
            <CardDescription>
              Click a row to open the dedicated nudge page for editing, preview, and stats.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Media</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nudges.map((nudge) => (
                    <TableRow
                      key={nudge.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/notification-nudges/${nudge.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{nudge.headline}</div>
                        <div className="text-xs text-muted-foreground">{nudge.campaign_key}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={nudge.enabled ? "default" : "outline"}>
                          {nudge.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{nudge.priority}</TableCell>
                      <TableCell>
                        <div className="grid gap-1 text-xs text-muted-foreground">
                          <span>Shown: {nudge.stats?.shown ?? 0}</span>
                          <span>Unique: {nudge.stats?.unique_viewers ?? 0}</span>
                          <span>CTA: {nudge.stats?.cta_clicks ?? 0} ({nudge.stats?.cta_rate ?? 0}%)</span>
                          <span>Dismissed: {nudge.stats?.dismissed ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {nudge.image ? (
                          <Badge variant="outline">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Image
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No image</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {nudge.updated_at ? new Date(nudge.updated_at).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/notification-nudges/${nudge.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={(event) => handleDelete(event, nudge)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {nudges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No nudges yet. Click “Add nudge” to create the first one.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto border-white/10 bg-background">
          <DialogHeader>
            <DialogTitle>Add nudge</DialogTitle>
            <DialogDescription>
              Create a new in-app notification nudge. The campaign key will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <NotificationNudgeEditor
            saving={saving}
            submitLabel="Create nudge"
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default NotificationNudges;
