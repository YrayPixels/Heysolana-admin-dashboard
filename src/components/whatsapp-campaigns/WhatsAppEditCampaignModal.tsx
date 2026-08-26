import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  WhatsAppCampaign,
  WhatsAppCampaignPayload,
  WhatsAppMessageMode,
} from "@/services/api";

interface WhatsAppEditCampaignModalProps {
  open: boolean;
  campaign: WhatsAppCampaign | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: WhatsAppCampaignPayload) => Promise<void>;
}

export const WhatsAppEditCampaignModal = ({
  open,
  campaign,
  saving,
  onOpenChange,
  onSave,
}: WhatsAppEditCampaignModalProps) => {
  const [messageMode, setMessageMode] = useState<WhatsAppMessageMode>("template");
  const [templateName, setTemplateName] = useState("notification");
  const [templateLanguage, setTemplateLanguage] = useState("en");
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [appLink, setAppLink] = useState("");

  useEffect(() => {
    if (!open || !campaign) return;
    setMessageMode(campaign.message_mode);
    setTemplateName(campaign.template_name || "notification");
    setTemplateLanguage(campaign.template_language || "en");
    setHeader(campaign.header || "");
    setBody(campaign.body || "");
    setAppLink(campaign.app_link || "");
  }, [open, campaign]);

  const handleSave = async () => {
    if (messageMode === "template" && !header.trim()) {
      toast.error("Header is required for template messages");
      return;
    }
    if (!body.trim()) {
      toast.error("Message is required");
      return;
    }

    await onSave({
      message_mode: messageMode,
      header: messageMode === "template" ? header.trim() : null,
      body: body.trim(),
      app_link: messageMode === "template" ? appLink.trim() || null : null,
      template_name: messageMode === "template" ? templateName.trim() || "notification" : null,
      template_language: messageMode === "template" ? templateLanguage.trim() || "en" : null,
      // Audience is ignored on sent campaigns by the API; keep current for drafts.
      target: campaign?.target ?? "filtered",
      search: campaign?.search ?? null,
      user_ids: campaign?.user_ids,
      send_now: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-background sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit campaign message</DialogTitle>
          <DialogDescription>
            {campaign?.sent
              ? "Update the message content, then retry failed recipients with the new content. Audience cannot be changed after send."
              : "Update the draft message before sending."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Message type</Label>
            <Select
              value={messageMode}
              onValueChange={(value) => setMessageMode(value as WhatsAppMessageMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">Approved template</SelectItem>
                <SelectItem value="custom">Custom message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {messageMode === "template" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Template name</Label>
                  <Input
                    value={templateName}
                    onChange={(event) => setTemplateName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Input
                    value={templateLanguage}
                    onChange={(event) => setTemplateLanguage(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Header</Label>
                <Input value={header} onChange={(event) => setHeader(event.target.value)} />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label>{messageMode === "template" ? "Body ({{body}})" : "Message"}</Label>
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={5}
              maxLength={1000}
            />
          </div>

          {messageMode === "template" ? (
            <div className="space-y-2">
              <Label>Button redirect link (optional)</Label>
              <Input value={appLink} onChange={(event) => setAppLink(event.target.value)} />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
