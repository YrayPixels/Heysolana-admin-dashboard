import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { PushComposeModal } from "@/components/push-campaigns/PushComposeModal";
import { PushStatsCards } from "@/components/push-campaigns/PushStatsCards";
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
  createPushCampaign,
  deletePushCampaign,
  getPushCampaigns,
  PushCampaign,
  PushCampaignPayload,
  sendPushCampaign,
  updatePushCampaign,
} from "@/services/api";

const PushNotifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PushCampaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: campaignsData, isLoading: campaignsLoading, isFetching: campaignsFetching, refetch: refetchCampaigns } = useQuery({
    queryKey: ["push-campaigns"],
    queryFn: () => getPushCampaigns({ per_page: 50 }),
  });

  const campaigns = campaignsData?.data ?? [];
  const latestSent = campaigns.find((c) => c.sent) ?? null;

  const handleComposeOpenChange = (open: boolean) => {
    setComposeOpen(open);
    if (!open) {
      setEditingCampaign(null);
    }
  };

  const openCreate = () => {
    setEditingCampaign(null);
    setComposeOpen(true);
  };

  const openEdit = (campaign: PushCampaign) => {
    setEditingCampaign(campaign);
    setComposeOpen(true);
  };

  const handleSaveDraft = async (payload: PushCampaignPayload) => {
    setSaving(true);
    try {
      if (editingCampaign) {
        const { send_now: _sendNow, ...updatePayload } = payload;
        const result = await updatePushCampaign(editingCampaign.id, updatePayload);
        if (result) {
          setComposeOpen(false);
          await queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
          await queryClient.invalidateQueries({ queryKey: ["push-campaign", editingCampaign.id] });
        }
        return;
      }

      const result = await createPushCampaign(payload);
      if (result) {
        setComposeOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
        navigate(`/push-notifications/${result.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (payload: PushCampaignPayload) => {
    setSending(true);
    try {
      if (editingCampaign) {
        const { send_now: _sendNow, ...updatePayload } = payload;
        const updated = await updatePushCampaign(editingCampaign.id, updatePayload);
        if (!updated) return;

        const sendResult = await sendPushCampaign(editingCampaign.id);
        if (sendResult) {
          setComposeOpen(false);
          await queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
          await queryClient.invalidateQueries({ queryKey: ["push-campaign", editingCampaign.id] });
          navigate(`/push-notifications/${editingCampaign.id}`);
        }
        return;
      }

      const result = await createPushCampaign(payload);
      if (result) {
        setComposeOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
        navigate(`/push-notifications/${result.id}`);
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (event: React.MouseEvent, campaign: PushCampaign) => {
    event.stopPropagation();
    if (!window.confirm(`Delete "${campaign.title}"?`)) return;
    const deleted = await deletePushCampaign(campaign.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["push-campaigns"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple/20">
              <Bell className="h-6 w-6 text-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Push notifications</h1>
              <p className="text-muted-foreground text-sm">
                Compose, send, and track push notification campaigns
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetchCampaigns()} disabled={campaignsFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${campaignsFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="bg-purple hover:bg-purple/90" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New push
            </Button>
          </div>
        </div>

        {latestSent ? (
          <div className="space-y-4">
            <Card className="glass-morphism border-emerald-500/30">
              <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <Badge className="mb-2 bg-emerald-500/20 text-emerald-300">Latest sent</Badge>
                  <p className="font-semibold">{latestSent.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {latestSent.sent_at
                      ? new Date(latestSent.sent_at).toLocaleString()
                      : latestSent.campaign_key}
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate(`/push-notifications/${latestSent.id}`)}>
                  View details
                </Button>
              </CardContent>
            </Card>
            <PushStatsCards campaign={latestSent} />
          </div>
        ) : null}

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle>All campaigns</CardTitle>
            <CardDescription>
              Click a row to view stats and details. Drafts can be edited or sent from here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
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
                      onClick={() => navigate(`/push-notifications/${campaign.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{campaign.title}</div>
                        <div className="text-xs text-muted-foreground">{campaign.campaign_key}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={campaign.sent ? "default" : "outline"}>
                          {campaign.sent ? "Sent" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.target === "all"
                          ? "All devices"
                          : campaign.target === "selected"
                            ? `${campaign.token_ids?.length ?? 0} selected`
                            : campaign.search || "Filtered"}
                      </TableCell>
                      <TableCell>
                        {campaign.sent ? (
                          <div className="grid gap-1 text-xs text-muted-foreground">
                            <span>Sent: {campaign.stats?.sent ?? campaign.device_count ?? 0}</span>
                            <span>Opened: {campaign.stats?.opened ?? 0}</span>
                            <span>CTR: {campaign.stats?.ctr_rate ?? 0}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not sent</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.updated_at ? new Date(campaign.updated_at).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!campaign.sent ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEdit(campaign);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : null}
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No campaigns yet. Click “New push” to compose your first one.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <PushComposeModal
        open={composeOpen}
        onOpenChange={handleComposeOpenChange}
        campaign={editingCampaign}
        saving={saving}
        sending={sending}
        onSaveDraft={handleSaveDraft}
        onSend={handleSend}
      />
    </DashboardLayout>
  );
};

export default PushNotifications;
