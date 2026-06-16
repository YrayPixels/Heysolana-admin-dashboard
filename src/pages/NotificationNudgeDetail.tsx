import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteNotificationNudge,
  getNotificationNudge,
  NotificationNudgePayload,
  updateNotificationNudge,
} from "@/services/api";
import {
  NotificationNudgeEditor,
  NudgeStatsCards,
} from "@/components/notification-nudges/NotificationNudgeEditor";

const NotificationNudgeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const nudgeId = id ? Number.parseInt(id, 10) : NaN;

  const { data, isLoading } = useQuery({
    queryKey: ["notification-nudge", nudgeId],
    queryFn: () => getNotificationNudge(nudgeId),
    enabled: !Number.isNaN(nudgeId),
  });

  const nudge = data?.data;

  const handleUpdate = async (payload: NotificationNudgePayload) => {
    if (!nudge) return;
    setSaving(true);
    try {
      const result = await updateNotificationNudge(nudge.id, payload);
      if (result) {
        await queryClient.invalidateQueries({ queryKey: ["notification-nudge", nudge.id] });
        await queryClient.invalidateQueries({ queryKey: ["notification-nudges"] });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!nudge || !window.confirm(`Delete "${nudge.headline}"?`)) return;
    const deleted = await deleteNotificationNudge(nudge.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["notification-nudges"] });
      navigate("/notification-nudges");
    }
  };

  if (Number.isNaN(nudgeId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid nudge ID</p>
          <Button variant="link" onClick={() => navigate("/notification-nudges")} className="mt-2">
            Back to nudges
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/notification-nudges")}
              aria-label="Back to nudges"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">{nudge?.headline ?? "Nudge"}</h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={nudge?.enabled ? "default" : "outline"}>
                      {nudge?.enabled ? "Active" : "Inactive"}
                    </Badge>
                    {nudge?.campaign_key ? <Badge variant="outline">{nudge.campaign_key}</Badge> : null}
                  </div>
                </>
              )}
            </div>
          </div>

          {nudge ? (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : nudge ? (
          <>
            <NudgeStatsCards nudge={nudge} />
            <NotificationNudgeEditor
              nudge={nudge}
              saving={saving}
              submitLabel="Save changes"
              onSubmit={handleUpdate}
            />
          </>
        ) : (
          <Card className="glass-morphism border-white/10">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nudge not found.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationNudgeDetail;
