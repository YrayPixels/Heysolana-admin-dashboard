import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import { EmailStatsCards } from "@/components/email-campaigns/EmailStatsCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteEmailCampaign,
  getEmailCampaign,
  sendEmailCampaign,
} from "@/services/api";

const targetLabel = (target: string, search: string | null, userCount: number) => {
  if (target === "all") return "All users with email addresses";
  if (target === "selected") return `${userCount} selected user(s)`;
  return search ? `Filter: ${search}` : "Filtered users";
};

const EmailCampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [sending, setSending] = useState(false);

  const campaignId = id ? Number.parseInt(id, 10) : NaN;

  const { data, isLoading } = useQuery({
    queryKey: ["email-campaign", campaignId],
    queryFn: () => getEmailCampaign(campaignId),
    enabled: !Number.isNaN(campaignId),
  });

  const campaign = data?.data;

  const handleSend = async () => {
    if (!campaign || campaign.sent) return;
    const ok = await confirm({
      title: "Queue emails?",
      description:
        "Queue emails for matching recipients? The worker will process these in the background.",
      confirmLabel: "Queue",
    });
    if (!ok) return;

    setSending(true);
    try {
      const result = await sendEmailCampaign(campaign.id);
      if (result) {
        await queryClient.invalidateQueries({ queryKey: ["email-campaign", campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    const ok = await confirm({
      title: "Delete campaign?",
      description: `Delete "${campaign.name ?? campaign.subject}"? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    const deleted = await deleteEmailCampaign(campaign.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      navigate("/email-messaging");
    }
  };

  if (Number.isNaN(campaignId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid campaign ID</p>
          <Button variant="link" onClick={() => navigate("/email-messaging")} className="mt-2">
            Back to email messaging
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
              onClick={() => navigate("/email-messaging")}
              aria-label="Back to email messaging"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {campaign?.name ?? campaign?.subject ?? "Email campaign"}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={campaign?.sent ? "default" : "outline"}>
                      {campaign?.sent ? "Queued" : "Draft"}
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
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={handleSend}
                disabled={sending || isLoading}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Queueing…" : "Queue now"}
              </Button>
            ) : null}
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {campaign?.sent ? <EmailStatsCards campaign={campaign} /> : null}

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle>Email content</CardTitle>
            <CardDescription>
              {campaign?.sent && campaign.sent_at
                ? `Queued ${new Date(campaign.sent_at).toLocaleString()} for ${campaign.recipient_count ?? 0} recipient(s)`
                : "Draft — not queued yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subject</p>
                  <p>{campaign?.subject}</p>
                </div>
                {campaign?.preview_text ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Preview text</p>
                    <p>{campaign.preview_text}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Body</p>
                  <p className="whitespace-pre-wrap">{campaign?.body}</p>
                </div>
                {campaign?.cta_label && campaign?.cta_url ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Call to action</p>
                    <p>
                      {campaign.cta_label} →{" "}
                      <span className="font-mono text-sm break-all">{campaign.cta_url}</span>
                    </p>
                  </div>
                ) : null}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Audience</p>
                  <p>
                    {campaign
                      ? targetLabel(
                          campaign.target,
                          campaign.search,
                          campaign.user_ids?.length ?? 0
                        )
                      : "—"}
                  </p>
                </div>
                {campaign?.sent && (campaign.stats?.failed ?? 0) > 0 ? (
                  <p className="text-sm text-amber-400">
                    {campaign.stats?.failed} email(s) failed delivery. Check queue worker logs.
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmailCampaignDetail;
