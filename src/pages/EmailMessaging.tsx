import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Edit, Mail, Plus, RefreshCw, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import { EmailComposeModal } from "@/components/email-campaigns/EmailComposeModal";
import { EmailStatsCards } from "@/components/email-campaigns/EmailStatsCards";
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
  createEmailCampaign,
  deleteEmailCampaign,
  EmailCampaign,
  EmailCampaignPayload,
  getEmailCampaigns,
} from "@/services/api";

const EmailMessaging = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [composeOpen, setComposeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: () => getEmailCampaigns({ per_page: 50 }),
  });

  const campaigns = data?.data ?? [];
  const latestSent = campaigns.find((c) => c.sent) ?? null;

  const handleSaveDraft = async (payload: EmailCampaignPayload) => {
    setSaving(true);
    try {
      const result = await createEmailCampaign(payload);
      if (result) {
        setComposeOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
        navigate(`/email-messaging/${result.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (payload: EmailCampaignPayload) => {
    setSending(true);
    try {
      const result = await createEmailCampaign(payload);
      if (result) {
        setComposeOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
        navigate(`/email-messaging/${result.id}`);
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (event: React.MouseEvent, campaign: EmailCampaign) => {
    event.stopPropagation();
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
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <Mail className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Email messaging</h1>
              <p className="text-muted-foreground text-sm">
                Compose, queue, and track email campaigns to wallet users
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New email
            </Button>
          </div>
        </div>

        <Alert className="border-violet-500/30 bg-violet-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Queued delivery</AlertTitle>
          <AlertDescription>
            Campaigns are queued for background delivery. The Laravel queue worker must be running
            on the <code className="text-xs">emails</code> queue for messages to actually send.
          </AlertDescription>
        </Alert>

        {latestSent ? (
          <div className="space-y-4">
            <Card className="glass-morphism border-violet-500/30">
              <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <Badge className="mb-2 bg-violet-500/20 text-violet-300">Latest queued</Badge>
                  <p className="font-semibold">{latestSent.name ?? latestSent.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {latestSent.sent_at
                      ? new Date(latestSent.sent_at).toLocaleString()
                      : latestSent.campaign_key}
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate(`/email-messaging/${latestSent.id}`)}>
                  View details
                </Button>
              </CardContent>
            </Card>
            <EmailStatsCards campaign={latestSent} />
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
                      onClick={() => navigate(`/email-messaging/${campaign.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{campaign.name ?? campaign.subject}</div>
                        <div className="text-xs text-muted-foreground">{campaign.campaign_key}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={campaign.sent ? "default" : "outline"}>
                          {campaign.sent ? "Queued" : "Draft"}
                        </Badge>
                      </TableCell>
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
                              navigate(`/email-messaging/${campaign.id}`);
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No campaigns yet. Click “New email” to compose your first one.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <EmailComposeModal
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

export default EmailMessaging;
