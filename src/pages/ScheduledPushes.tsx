import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
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
  createScheduledPushCampaign,
  deleteScheduledPushCampaign,
  getScheduledPushCampaigns,
  ScheduledPushCampaign,
  ScheduledPushCampaignPayload,
} from "@/services/api";
import { ScheduledPushEditor } from "@/components/scheduled-pushes/ScheduledPushEditor";

const scheduleLabel = (campaign: ScheduledPushCampaign) => {
  if (campaign.schedule_type === "interval") {
    const mins = campaign.interval_minutes ?? 0;
    if (mins >= 1440 && mins % 1440 === 0) {
      return `Every ${mins / 1440} day(s)`;
    }
    return `Every ${mins} min`;
  }
  if (campaign.schedule_type === "weekly") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = days[campaign.schedule_day ?? 0] ?? "?";
    return `Weekly ${day} ${campaign.schedule_time ?? ""}`;
  }
  return `Daily ${campaign.schedule_time ?? ""}`;
};

const targetLabel = (campaign: ScheduledPushCampaign) => {
  if (campaign.target === "inactive") {
    return `Inactive ${campaign.inactive_days ?? "?"}d`;
  }
  if (campaign.target === "filtered") {
    return `Filter: ${campaign.search ?? ""}`;
  }
  return "All users";
};

const ScheduledPushes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["scheduled-pushes"],
    queryFn: () => getScheduledPushCampaigns({ per_page: 50 }),
  });

  const campaigns = data?.data ?? [];

  const handleCreate = async (payload: ScheduledPushCampaignPayload) => {
    setSaving(true);
    try {
      const result = await createScheduledPushCampaign(payload);
      if (result) {
        setCreateOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["scheduled-pushes"] });
        navigate(`/scheduled-pushes/${result.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: React.MouseEvent, campaign: ScheduledPushCampaign) => {
    event.stopPropagation();
    if (!window.confirm(`Delete "${campaign.name}"?`)) return;
    const deleted = await deleteScheduledPushCampaign(campaign.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["scheduled-pushes"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <CalendarClock className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Scheduled pushes</h1>
              <p className="text-muted-foreground text-sm">
                Configure recurring push notifications sent automatically by the backend.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add campaign
            </Button>
          </div>
        </div>

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle>All campaigns</CardTitle>
            <CardDescription>
              The Laravel scheduler runs every minute and dispatches due campaigns. Ensure cron is
              enabled in production.
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
                    <TableHead>Schedule</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Next run</TableHead>
                    <TableHead>Sends</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/scheduled-pushes/${campaign.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground">{campaign.title}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={campaign.is_active ? "default" : "outline"}>
                          {campaign.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{scheduleLabel(campaign)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {targetLabel(campaign)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.next_run_at
                          ? new Date(campaign.next_run_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>{campaign.stats?.total_sends ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/scheduled-pushes/${campaign.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(event) => handleDelete(event, campaign)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No scheduled campaigns yet. Click “Add campaign” to create one.
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
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-white/10 bg-background">
          <DialogHeader>
            <DialogTitle>Add scheduled push campaign</DialogTitle>
            <DialogDescription>
              Create a recurring push notification. The campaign key is generated automatically.
            </DialogDescription>
          </DialogHeader>
          <ScheduledPushEditor
            saving={saving}
            submitLabel="Create campaign"
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ScheduledPushes;
