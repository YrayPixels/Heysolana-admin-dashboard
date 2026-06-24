import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ImagePlus, Send, X, XCircle } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  getSupportConversation,
  sendSupportAdminMessage,
  SupportConversationDetail as SupportConversationData,
  SupportMessage,
  updateSupportConversationStatus,
} from "@/services/api";

function formatTime(iso: string | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function messageLabel(message: SupportMessage): string {
  if (message.body?.trim()) return message.body.trim();
  if (message.has_attachment || message.attachment_url) return "[Image]";
  return "";
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const isAdmin = message.sender_type === "admin";
  const hasImage = !!message.attachment_url;
  const label = messageLabel(message);

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isAdmin
            ? "rounded-tr-sm bg-primary/20 text-foreground border border-primary/30"
            : "rounded-tl-sm bg-muted text-foreground border border-border"
        }`}
      >
        <p className="text-xs text-muted-foreground mb-1.5">
          {isAdmin ? message.admin?.name ?? "Support" : "User"}
        </p>
        {hasImage && (
          <a
            href={message.attachment_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-2"
          >
            <img
              src={message.attachment_url!}
              alt={message.attachment_original_name ?? "Support attachment"}
              className="max-w-full rounded-xl max-h-64 object-cover border border-border"
            />
          </a>
        )}
        {!!label && label !== "[Image]" && (
          <p className="whitespace-pre-wrap leading-relaxed">{label}</p>
        )}
        {!hasImage && label === "[Image]" && (
          <p className="italic text-muted-foreground">Image attachment</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-2 text-right">
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

const SupportConversationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const conversationId = Number(id);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["support-conversation", conversationId],
    queryFn: () => getSupportConversation(conversationId),
    enabled: !isNaN(conversationId) && conversationId > 0,
    refetchInterval: 8000,
  });

  const conversation = data?.conversation;
  const messages = data?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const mergeSentMessage = (result: SupportConversationData) => {
    queryClient.setQueryData<SupportConversationData | undefined>(
      ["support-conversation", conversationId],
      (current) => {
        if (!current) return result;
        const exists = current.messages.some((m) => m.id === result.message?.id);
        return {
          conversation: result.conversation ?? current.conversation,
          messages: exists
            ? current.messages
            : [...current.messages, result.message],
        };
      }
    );
  };

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !pendingFile) || sending) return;
    setSending(true);
    const result = await sendSupportAdminMessage(conversationId, text, pendingFile);
    setSending(false);
    if (result?.message) {
      setDraft("");
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      mergeSentMessage(result);
      await queryClient.invalidateQueries({
        queryKey: ["support-conversation", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["support-conversations"] });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    setPendingFile(file);
  };

  const handleStatus = async (status: "open" | "resolved" | "closed") => {
    const updated = await updateSupportConversationStatus(conversationId, status);
    if (updated) {
      await queryClient.invalidateQueries({
        queryKey: ["support-conversation", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["support-conversations"] });
    }
  };

  if (isNaN(conversationId)) {
    return (
      <DashboardLayout>
        <div className="p-6">Invalid conversation</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-4 -mt-2">
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/support")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">
                {conversation?.username
                  ? `@${conversation.username}`
                  : conversation?.phone_number ?? `Conversation #${conversationId}`}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {conversation?.wallet_address ?? conversation?.phone_number ?? ""}
              </p>
            </div>
          )}
          {conversation && (
            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
              <Badge>{conversation.status}</Badge>
              {conversation.status !== "resolved" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleStatus("resolved")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              )}
              {conversation.status !== "closed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleStatus("closed")}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Close
                </Button>
              )}
            </div>
          )}
        </div>

        <Card className="glass-morphism border-white/10 flex flex-col">
          <CardHeader className="py-3 shrink-0 border-b border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messages {messages.length > 0 ? `(${messages.length})` : ""}
            </CardTitle>
            {isFetching && !isLoading && (
              <span className="text-xs text-muted-foreground">Refreshing…</span>
            )}
          </CardHeader>

          <CardContent className="p-0 flex flex-col">
            <div
              ref={scrollRef}
              className="min-h-[320px] max-h-[min(60vh,560px)] overflow-y-auto p-4 bg-black/10"
            >
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-2/3" />
                  <Skeleton className="h-16 w-2/3 ml-auto" />
                </div>
              ) : isError ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-muted-foreground">
                    Could not load messages. Check your connection and try again.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => void refetch()}>
                    Retry
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Send the first reply below.
                </p>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} message={m} />)
              )}
            </div>

            <div className="border-t border-white/5 p-4 shrink-0 bg-card/50">
              {pendingFile && (
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/50 p-2">
                  <img
                    src={URL.createObjectURL(pendingFile)}
                    alt="Pending attachment"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <span className="flex-1 text-sm text-muted-foreground truncate">
                    {pendingFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPendingFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 self-end"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your reply…"
                  rows={2}
                  className="resize-none bg-background/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  onClick={() => void handleSend()}
                  disabled={(!draft.trim() && !pendingFile) || sending}
                  className="shrink-0 self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SupportConversationDetail;
