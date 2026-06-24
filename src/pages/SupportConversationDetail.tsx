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

function MessageBubble({ message }: { message: SupportMessage }) {
  const isAdmin = message.sender_type === "admin";
  const hasImage = !!message.attachment_url;

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          isAdmin
            ? "rounded-tr-sm bg-solana/20 text-white"
            : "rounded-tl-sm bg-white/10 text-white/90"
        }`}
      >
        {!isAdmin && <p className="text-xs text-white/50 mb-1">User</p>}
        {isAdmin && message.admin?.name && (
          <p className="text-xs text-white/50 mb-1">{message.admin.name}</p>
        )}
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
              className="max-w-full rounded-xl max-h-64 object-cover"
            />
          </a>
        )}
        {!!message.body && (
          <p className="whitespace-pre-wrap">{message.body}</p>
        )}
        <p className="text-[10px] text-white/40 mt-1 text-right">
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

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["support-conversation", conversationId],
    queryFn: () => getSupportConversation(conversationId),
    enabled: !isNaN(conversationId) && conversationId > 0,
    refetchInterval: 8000,
  });

  const conversation = data?.conversation;
  const messages = data?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !pendingFile) || sending) return;
    setSending(true);
    const result = await sendSupportAdminMessage(conversationId, text, pendingFile);
    setSending(false);
    if (result) {
      setDraft("");
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["support-conversation", conversationId] });
      await queryClient.invalidateQueries({ queryKey: ["support-conversations"] });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      return;
    }
    setPendingFile(file);
  };

  const handleStatus = async (status: "open" | "resolved" | "closed") => {
    const updated = await updateSupportConversationStatus(conversationId, status);
    if (updated) {
      await queryClient.invalidateQueries({ queryKey: ["support-conversation", conversationId] });
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
      <div className="max-w-4xl mx-auto space-y-4 p-4 md:p-6 h-[calc(100vh-4rem)] flex flex-col">
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
            <div className="flex gap-2 shrink-0">
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

        <Card className="glass-morphism border-white/10 flex-1 flex flex-col min-h-0">
          <CardHeader className="py-3 shrink-0 border-b border-white/5">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFetching && !isLoading ? "Refreshing…" : "Messages"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-2/3" />
                  <Skeleton className="h-16 w-2/3 ml-auto" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Send the first reply below.
                </p>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} message={m} />)
              )}
            </div>

            <div className="border-t border-white/5 p-4 shrink-0">
              {pendingFile && (
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-black/20 p-2">
                  <img
                    src={URL.createObjectURL(pendingFile)}
                    alt="Pending attachment"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <span className="flex-1 text-sm text-white/70 truncate">
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
                  className="resize-none bg-black/20"
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
