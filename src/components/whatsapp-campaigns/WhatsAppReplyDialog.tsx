import React, { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { respondToWhatsAppReply, WhatsAppCampaignReply } from "@/services/api";

interface WhatsAppReplyDialogProps {
  reply: WhatsAppCampaignReply | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: (outbound: WhatsAppCampaignReply) => void;
}

export const WhatsAppReplyDialog = ({
  reply,
  open,
  onOpenChange,
  onSent,
}: WhatsAppReplyDialogProps) => {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      setBody("");
      setSending(false);
    }
  }, [open]);

  const handleSend = async () => {
    if (!reply || !body.trim()) return;
    setSending(true);
    try {
      const outbound = await respondToWhatsAppReply({
        reply_event_id: reply.id,
        phone_number: reply.phone_number ?? undefined,
        body: body.trim(),
      });
      if (outbound) {
        onSent?.(outbound);
        onOpenChange(false);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reply on WhatsApp</DialogTitle>
          <DialogDescription>
            Sends a free-form message to{" "}
            <span className="font-mono">
              {reply?.contact_name ? `${reply.contact_name} · ` : ""}
              {reply?.phone_number || "unknown"}
            </span>
            . Works within Meta’s 24-hour customer-care window after their last message.
          </DialogDescription>
        </DialogHeader>

        {reply?.text ? (
          <div className="rounded-md border border-white/10 bg-muted/30 p-3 text-sm">
            <p className="mb-1 text-xs text-muted-foreground">Their message</p>
            <p className="whitespace-pre-wrap break-words">{reply.text}</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="whatsapp-reply-body">Your reply</Label>
          <Textarea
            id="whatsapp-reply-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Type your reply…"
            rows={5}
            maxLength={4096}
            disabled={sending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSend}
            disabled={sending || !body.trim()}
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Sending…" : "Send reply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
