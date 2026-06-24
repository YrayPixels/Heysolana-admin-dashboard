import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Edit, MessageCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { WhatsAppComposeModal } from "@/components/whatsapp-campaigns/WhatsAppComposeModal";
import { WhatsAppStatsCards } from "@/components/whatsapp-campaigns/WhatsAppStatsCards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  createWhatsAppCampaign,
  deleteWhatsAppCampaign,
  getWhatsAppCampaigns,
  WhatsAppCampaign,
  WhatsAppCampaignPayload,
} from "@/services/api";

const WhatsAppMessaging = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["whatsapp-campaigns"],
    queryFn: () => getWhatsAppCampaigns({ per_page: 50 }),
  });

  const campaigns = data?.data ?? [];
  const latestSent = campaigns.find((c) => c.sent) ?? null;

  const handleSaveDraft = async (payload: WhatsAppCampaignPayload) => {
    setSaving(true);
    try {
      const result = await createWhatsAppCampaign(payload);
      if (result) {
        setComposeOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
        navigate(`/whatsapp-messaging/${result.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (payload: WhatsAppCampaignPayload) => {
    setSending(true);
    try {
      const result = await createWhatsAppCampaign(payload);
      if (result) {
        setComposeOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
        navigate(`/whatsapp-messaging/${result.id}`);
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (event: React.MouseEvent, campaign: WhatsAppCampaign) => {
    event.stopPropagation();
    if (!window.confirm(`Delete "${campaign.name ?? campaign.body}"?`)) return;
    const deleted = await deleteWhatsAppCampaign(campaign.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-500/20">
              <MessageCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">WhatsApp messaging</h1>
              <p className="text-muted-foreground text-sm">
                Compose, queue, and track WhatsApp notification campaigns
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New message
            </Button>
          </div>
        </div>

        <Alert className="border-green-500/30 bg-green-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Queued delivery</AlertTitle>
          <AlertDescription>
            Campaigns are queued for background delivery. The Laravel queue worker must be running
            for messages to actually send.
          </AlertDescription>
        </Alert>

        {latestSent ? (
          <div className="space-y-4">
            <Card className="glass-morphism border-emerald-500/30">
              <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <Badge className="mb-2 bg-emerald-500/20 text-emerald-300">Latest queued</Badge>
                  <p className="font-semibold">{latestSent.name ?? latestSent.header ?? latestSent.body}</p>
                  <p className="text-sm text-muted-foreground">
                    {latestSent.sent_at
                      ? new Date(latestSent.sent_at).toLocaleString()
                      : latestSent.campaign_key}
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate(`/whatsapp-messaging/${latestSent.id}`)}>
                  View details
                </Button>
              </CardContent>
            </Card>
            <WhatsAppStatsCards campaign={latestSent} />
          </div>
        ) : null}

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle>All campaigns</CardTitle>
            <CardDescription>
              Click a row to view delivery stats and details. Drafts can be queued from the detail page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/whatsapp-messaging/${campaign.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {campaign.name ?? campaign.header ?? campaign.body.slice(0, 60)}
                        </div>
                        <div className="text-xs text-muted-foreground">{campaign.campaign_key}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={campaign.sent ? "default" : "outline"}>
                          {campaign.sent ? "Queued" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{campaign.message_mode}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.target === "all"
                          ? "All users"
                          : campaign.target === "selected"
                            ? `${campaign.user_ids?.length ?? 0} selected`
                            : campaign.search || "Filtered"}
                      </TableCell>
                      <TableCell>
                        {campaign.sent ? (
                          <div className="grid gap-1 text-xs text-muted-foreground">
                            <span>Queued: {campaign.stats?.sent ?? campaign.recipient_count ?? 0}</span>
                            <span>Delivered: {campaign.stats?.delivered ?? 0}</span>
                            <span>CTR: {campaign.stats?.ctr_rate ?? 0}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not queued</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.updated_at ? new Date(campaign.updated_at).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/whatsapp-messaging/${campaign.id}`);
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
                        No campaigns yet. Click “New message” to compose your first one.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <WhatsAppComposeModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        saving={saving}
        sending={sending}
        onSaveDraft={handleSaveDraft}
        onSend={handleSend}
      />
    </DashboardLayout>
  );
};

export default WhatsAppMessaging;
