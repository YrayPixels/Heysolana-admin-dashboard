import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Reply, Send, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import { WhatsAppStatsCards } from "@/components/whatsapp-campaigns/WhatsAppStatsCards";
import { WhatsAppReplyDialog } from "@/components/whatsapp-campaigns/WhatsAppReplyDialog";
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
  deleteWhatsAppCampaign,
  getWhatsAppCampaign,
  sendWhatsAppCampaign,
  WhatsAppCampaignReply,
  WhatsAppCampaignSendLogRow,
} from "@/services/api";

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const targetLabel = (target: string, search: string | null, userCount: number) => {
  if (target === "all") return "All users with phone numbers";
  if (target === "selected") return `${userCount} selected user(s)`;
  return search ? `Filter: ${search}` : "Filtered users";
};

const statusLabel = (status: string | null | undefined) => {
  switch (status) {
    case "accepted":
      return "Accepted (awaiting delivery)";
    case "sent":
      return "Sent to WhatsApp";
    case "delivered":
      return "Delivered";
    case "read":
      return "Read";
    case "failed":
      return "Failed";
    case "queued":
      return "Queued";
    default:
      return status || "Unknown";
  }
};

const RecipientRows = ({
  rows,
  showError,
}: {
  rows: WhatsAppCampaignSendLogRow[];
  showError?: boolean;
}) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Recipient</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          {showError ? <TableHead>Error</TableHead> : null}
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="text-sm font-medium">
                {row.user_name || (row.user_id ? `User #${row.user_id}` : "Unknown")}
              </div>
              {row.user_email ? (
                <div className="text-xs text-muted-foreground">{row.user_email}</div>
              ) : null}
            </TableCell>
            <TableCell className="font-mono text-sm">{row.phone_number || "—"}</TableCell>
            <TableCell>
              <Badge variant="outline">{statusLabel(row.status)}</Badge>
            </TableCell>
            {showError ? (
              <TableCell>
                <div className="max-w-[360px] whitespace-pre-wrap break-words text-sm text-destructive">
                  {row.error_message || "Unknown error"}
                </div>
              </TableCell>
            ) : null}
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
              {formatDate(row.updated_at || row.delivered_at || row.sent_at || row.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const WhatsAppCampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [sending, setSending] = useState(false);
  const [replyTarget, setReplyTarget] = useState<WhatsAppCampaignReply | null>(null);

  const campaignId = id ? Number.parseInt(id, 10) : NaN;

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-campaign", campaignId],
    queryFn: () => getWhatsAppCampaign(campaignId),
    enabled: !Number.isNaN(campaignId),
    refetchInterval: (query) => {
      const stats = query.state.data?.data?.stats;
      const campaignData = query.state.data?.data;
      if (!campaignData?.sent) return false;
      const waiting =
        (stats?.queued ?? 0) > 0 || (stats?.accepted ?? 0) > 0;
      // Keep polling briefly after send so delivery + replies show up from the webhook.
      return waiting ? 10_000 : 30_000;
    },
  });

  const campaign = data?.data;
  const acceptedCount = campaign?.stats?.accepted ?? 0;
  const failedCount = campaign?.stats?.failed ?? 0;
  const deliveredCount = campaign?.stats?.delivered ?? 0;
  const replyCount = campaign?.stats?.replies ?? campaign?.replies?.length ?? 0;
  const replies = campaign?.replies ?? [];

  const handleSend = async () => {
    if (!campaign || campaign.sent) return;
    const ok = await confirm({
      title: "Send WhatsApp messages now?",
      description:
        "Submit WhatsApp messages to Meta now? Delivery/failure updates arrive via webhook afterward.",
      confirmLabel: "Send now",
    });
    if (!ok) return;

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
    if (!campaign) return;
    const ok = await confirm({
      title: "Delete campaign?",
      description: `Delete "${campaign.name ?? campaign.body}"? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
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
                      {campaign?.sent ? "Sent" : "Draft"}
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
                {sending ? "Sending…" : "Send now"}
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
                ? `Submitted ${new Date(campaign.sent_at).toLocaleString()} to ${campaign.recipient_count ?? 0} recipient(s) — ${deliveredCount} delivered, ${acceptedCount} awaiting delivery, ${failedCount} failed`
                : "Draft — not sent yet"}
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
                    <p className="text-sm font-medium text-muted-foreground">Button redirect link</p>
                    <p className="font-mono text-sm break-all">{campaign.app_link}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Only used when Meta’s URL button is dynamic and button redirects are enabled.
                      Prefer putting shareable links in the message body.
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
                {campaign?.sent && acceptedCount > 0 ? (
                  <p className="text-sm text-amber-300">
                    {acceptedCount} message(s) accepted by Meta but not confirmed delivered yet.
                    Statuses update when the WhatsApp webhook reports delivery or failure.
                  </p>
                ) : null}
                {campaign?.sent && failedCount > 0 ? (
                  <p className="text-sm text-amber-400">
                    {failedCount} message(s) failed. See failed sends below.
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {campaign?.sent && acceptedCount > 0 ? (
          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle>Awaiting delivery</CardTitle>
              <CardDescription>
                Meta accepted these sends; handset delivery is not confirmed yet
                {(campaign.undelivered_sends?.length ?? 0) < acceptedCount
                  ? ` (showing ${campaign.undelivered_sends?.length ?? 0} of ${acceptedCount})`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(campaign.undelivered_sends?.length ?? 0) === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Accepted count is {acceptedCount}, but no send-log rows were returned.
                </p>
              ) : (
                <RecipientRows rows={campaign.undelivered_sends ?? []} />
              )}
            </CardContent>
          </Card>
        ) : null}

        {campaign?.sent && failedCount > 0 ? (
          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle>Failed sends</CardTitle>
              <CardDescription>
                Errors from Meta API or delivery webhooks
                {(campaign.failed_sends?.length ?? 0) < failedCount
                  ? ` (showing ${campaign.failed_sends?.length ?? 0} of ${failedCount})`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(campaign.failed_sends?.length ?? 0) === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Failed count is {failedCount}, but no send-log rows were returned.
                </p>
              ) : (
                <RecipientRows rows={campaign.failed_sends ?? []} showError />
              )}
            </CardContent>
          </Card>
        ) : null}

        {campaign?.sent ? (
          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                Inbound replies and your outbound responses
                {replyCount > 0 || replies.length > 0
                  ? ` (${replies.length} message${replies.length === 1 ? "" : "s"})`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {replies.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No replies yet. Requires the Meta webhook to be receiving inbound messages.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Direction</TableHead>
                        <TableHead>From / To</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {replies.map((reply: WhatsAppCampaignReply) => {
                        const isOutbound = reply.direction === "outbound";
                        return (
                          <TableRow key={reply.id}>
                            <TableCell>
                              <Badge variant={isOutbound ? "default" : "outline"}>
                                {isOutbound ? "You" : "Inbound"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {isOutbound
                                  ? "Admin"
                                  : reply.contact_name || "WhatsApp user"}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                {reply.phone_number || "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[480px] whitespace-pre-wrap break-words text-sm">
                                {reply.text || (
                                  <span className="text-muted-foreground">
                                    [{reply.message_type || "message"}]
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDate(reply.created_at || reply.provider_timestamp)}
                            </TableCell>
                            <TableCell className="text-right">
                              {!isOutbound ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setReplyTarget(reply)}
                                >
                                  <Reply className="mr-1 h-3.5 w-3.5" />
                                  Reply
                                </Button>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <WhatsAppReplyDialog
        reply={replyTarget}
        open={!!replyTarget}
        onOpenChange={(open) => {
          if (!open) setReplyTarget(null);
        }}
        onSent={() => {
          void queryClient.invalidateQueries({ queryKey: ["whatsapp-campaign", campaignId] });
        }}
      />
    </DashboardLayout>
  );
};

export default WhatsAppCampaignDetail;
