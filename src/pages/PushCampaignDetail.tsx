import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Send, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { PushComposeModal } from "@/components/push-campaigns/PushComposeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PushStatsCards } from "@/components/push-campaigns/PushStatsCards";
import {
  deletePushCampaign,
  getPushCampaign,
  PushCampaignPayload,
  sendPushCampaign,
  updatePushCampaign,
} from "@/services/api";

const targetLabel = (target: string, search: string | null) => {
  if (target === "all") return "All active devices";
  if (target === "selected") return "Selected devices";
  return search ? `Filter: ${search}` : "Filtered devices";
};

const PushCampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingFromCompose, setSendingFromCompose] = useState(false);

  const campaignId = id ? Number.parseInt(id, 10) : NaN;

  const { data, isLoading } = useQuery({
    queryKey: ["push-campaign", campaignId],
    queryFn: () => getPushCampaign(campaignId),
    enabled: !Number.isNaN(campaignId),
  });

  const campaign = data?.data;

  const handleSend = async () => {
    if (!campaign || campaign.sent) return;
    if (!window.confirm(`Send push to matching devices? This cannot be undone.`)) return;

    setSending(true);
    try {
      const result = await sendPushCampaign(campaign.id);
      if (result) {
        await queryClient.invalidateQueries({ queryKey: ["push-campaign", campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign || !window.confirm(`Delete "${campaign.title}"?`)) return;
    const deleted = await deletePushCampaign(campaign.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
      navigate("/push-notifications");
    }
  };

  const handleSaveDraft = async (payload: PushCampaignPayload) => {
    if (!campaign) return;
    setSaving(true);
    try {
      const { send_now: _sendNow, ...updatePayload } = payload;
      const result = await updatePushCampaign(campaign.id, updatePayload);
      if (result) {
        setComposeOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["push-campaign", campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSendFromCompose = async (payload: PushCampaignPayload) => {
    if (!campaign) return;
    setSendingFromCompose(true);
    try {
      const { send_now: _sendNow, ...updatePayload } = payload;
      const updated = await updatePushCampaign(campaign.id, updatePayload);
      if (!updated) return;

      const sendResult = await sendPushCampaign(campaign.id);
      if (sendResult) {
        setComposeOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["push-campaign", campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
      }
    } finally {
      setSendingFromCompose(false);
    }
  };

  if (Number.isNaN(campaignId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid campaign ID</p>
          <Button variant="link" onClick={() => navigate("/push-notifications")} className="mt-2">
            Back to push notifications
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
              onClick={() => navigate("/push-notifications")}
              aria-label="Back to push notifications"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">{campaign?.title ?? "Push"}</h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={campaign?.sent ? "default" : "outline"}>
                      {campaign?.sent ? "Sent" : "Draft"}
                    </Badge>
                    {campaign?.campaign_key ? (
                      <Badge variant="outline">{campaign.campaign_key}</Badge>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!campaign?.sent ? (
              <>
                <Button variant="outline" onClick={() => setComposeOpen(true)} disabled={isLoading}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={handleSend} disabled={sending || isLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Sending…" : "Send now"}
                </Button>
              </>
            ) : null}
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {campaign?.sent ? <PushStatsCards campaign={campaign} /> : null}

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle>Message</CardTitle>
            <CardDescription>
              {campaign?.sent && campaign.sent_at
                ? `Sent ${new Date(campaign.sent_at).toLocaleString()} to ${campaign.device_count ?? 0} device(s)`
                : "Draft — not sent yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p>{campaign?.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Body</p>
                  <p className="whitespace-pre-wrap">{campaign?.body}</p>
                </div>
                {campaign?.link ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Deep link</p>
                    <p className="font-mono text-sm">{campaign.link}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Audience</p>
                  <p>{campaign ? targetLabel(campaign.target, campaign.search) : "—"}</p>
                  {campaign?.device_type ? (
                    <p className="text-sm text-muted-foreground">Platform: {campaign.device_type}</p>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {campaign && !campaign.sent ? (
        <PushComposeModal
          open={composeOpen}
          onOpenChange={setComposeOpen}
          campaign={campaign}
          saving={saving}
          sending={sendingFromCompose}
          onSaveDraft={handleSaveDraft}
          onSend={handleSendFromCompose}
        />
      ) : null}
    </DashboardLayout>
  );
};

export default PushCampaignDetail;
