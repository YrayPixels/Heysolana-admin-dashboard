import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, Trash2, Users } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteScheduledPushCampaign,
  getScheduledPushCampaign,
  previewScheduledPushCampaign,
  runScheduledPushCampaignNow,
  ScheduledPushCampaignPayload,
  updateScheduledPushCampaign,
} from "@/services/api";
import {
  ScheduledPushEditor,
  ScheduledPushStatsCards,
} from "@/components/scheduled-pushes/ScheduledPushEditor";

const ScheduledPushDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [ignoreCooldown, setIgnoreCooldown] = useState(false);
  const [preview, setPreview] = useState<{
    device_count: number;
    user_count: number;
  } | null>(null);

  const campaignId = id ? Number.parseInt(id, 10) : NaN;

  const { data, isLoading } = useQuery({
    queryKey: ["scheduled-push", campaignId],
    queryFn: () => getScheduledPushCampaign(campaignId),
    enabled: !Number.isNaN(campaignId),
  });

  const campaign = data?.data;

  const handleUpdate = async (payload: ScheduledPushCampaignPayload) => {
    if (!campaign) return;
    setSaving(true);
    try {
      const result = await updateScheduledPushCampaign(campaign.id, payload);
      if (result) {
        await queryClient.invalidateQueries({ queryKey: ["scheduled-push", campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ["scheduled-pushes"] });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign || !window.confirm(`Delete "${campaign.name}"?`)) return;
    const deleted = await deleteScheduledPushCampaign(campaign.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["scheduled-pushes"] });
      navigate("/scheduled-pushes");
    }
  };

  const handlePreview = async () => {
    if (!campaign) return;
    const result = await previewScheduledPushCampaign(campaign.id);
    if (result) {
      setPreview({
        device_count: result.device_count,
        user_count: result.user_count,
      });
    }
  };

  const handleRunNow = async () => {
    if (!campaign) return;
    setRunning(true);
    try {
      const result = await runScheduledPushCampaignNow(campaign.id, ignoreCooldown);
      if (result) {
        await queryClient.invalidateQueries({ queryKey: ["scheduled-push", campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ["scheduled-pushes"] });
      }
    } finally {
      setRunning(false);
    }
  };

  if (Number.isNaN(campaignId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid campaign ID</p>
          <Button variant="link" onClick={() => navigate("/scheduled-pushes")} className="mt-2">
            Back to campaigns
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
              onClick={() => navigate("/scheduled-pushes")}
              aria-label="Back to campaigns"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">{campaign?.name ?? "Campaign"}</h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={campaign?.is_active ? "default" : "outline"}>
                      {campaign?.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {campaign?.campaign_key ? (
                      <Badge variant="outline">{campaign.campaign_key}</Badge>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
          <Button variant="destructive" onClick={handleDelete} disabled={!campaign || isLoading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        {campaign ? <ScheduledPushStatsCards campaign={campaign} /> : null}

        <Card className="border-white/10">
          <CardHeader>
            <CardTitle>Test & preview</CardTitle>
            <CardDescription>
              Preview audience size or send immediately (respects cooldown unless ignored).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handlePreview} disabled={!campaign}>
                <Users className="h-4 w-4 mr-2" />
                Preview audience
              </Button>
              <Button onClick={handleRunNow} disabled={!campaign || running}>
                <Play className="h-4 w-4 mr-2" />
                {running ? "Sending…" : "Run now"}
              </Button>
            </div>
            {preview ? (
              <p className="text-sm text-muted-foreground">
                Would reach {preview.user_count} user(s) on {preview.device_count} device(s).
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <Checkbox
                id="ignore_cooldown"
                checked={ignoreCooldown}
                onCheckedChange={(checked) => setIgnoreCooldown(checked === true)}
              />
              <Label htmlFor="ignore_cooldown">Ignore cooldown when running now</Label>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : campaign ? (
          <ScheduledPushEditor
            campaign={campaign}
            saving={saving}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
          />
        ) : (
          <p className="text-muted-foreground">Campaign not found.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ScheduledPushDetail;
