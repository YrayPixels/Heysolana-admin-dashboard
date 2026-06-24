import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { WhatsAppStatsCards } from "@/components/whatsapp-campaigns/WhatsAppStatsCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteWhatsAppCampaign,
  getWhatsAppCampaign,
  sendWhatsAppCampaign,
} from "@/services/api";

const targetLabel = (target: string, search: string | null, userCount: number) => {
  if (target === "all") return "All users with phone numbers";
  if (target === "selected") return `${userCount} selected user(s)`;
  return search ? `Filter: ${search}` : "Filtered users";
};

const WhatsAppCampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);

  const campaignId = id ? Number.parseInt(id, 10) : NaN;

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-campaign", campaignId],
    queryFn: () => getWhatsAppCampaign(campaignId),
    enabled: !Number.isNaN(campaignId),
  });

  const campaign = data?.data;

  const handleSend = async () => {
    if (!campaign || campaign.sent) return;
    if (
      !window.confirm(
        "Queue WhatsApp messages for matching recipients? The worker will process these in the background."
      )
    ) {
      return;
    }

    setSending(true);
    try {
      const result = await sendWhatsAppCampaign(campaign.id);
      if (result) {
        await queryClient.invalidateQueries({ queryKey: ["whatsapp-campaign", campaign.id] });
        await queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign || !window.confirm(`Delete "${campaign.name ?? campaign.body}"?`)) return;
    const deleted = await deleteWhatsAppCampaign(campaign.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      navigate("/whatsapp-messaging");
    }
  };

  if (Number.isNaN(campaignId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid campaign ID</p>
          <Button variant="link" onClick={() => navigate("/whatsapp-messaging")} className="mt-2">
            Back to WhatsApp messaging
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
              onClick={() => navigate("/whatsapp-messaging")}
              aria-label="Back to WhatsApp messaging"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {campaign?.name ?? campaign?.header ?? "WhatsApp campaign"}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={campaign?.sent ? "default" : "outline"}>
                      {campaign?.sent ? "Queued" : "Draft"}
                    </Badge>
                    <Badge variant="outline">{campaign?.message_mode}</Badge>
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
                className="bg-green-600 hover:bg-green-700"
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

        {campaign?.sent ? <WhatsAppStatsCards campaign={campaign} /> : null}

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle>Message</CardTitle>
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
                {campaign?.message_mode === "template" ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Template</p>
                      <p>
                        {campaign.template_name} ({campaign.template_language})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Header</p>
                      <p>{campaign.header}</p>
                    </div>
                  </>
                ) : null}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Body</p>
                  <p className="whitespace-pre-wrap">{campaign?.body}</p>
                </div>
                {campaign?.app_link ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">App link</p>
                    <p className="font-mono text-sm break-all">{campaign.app_link}</p>
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
                    {campaign.stats?.failed} message(s) failed delivery. Check queue worker logs.
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

export default WhatsAppCampaignDetail;
