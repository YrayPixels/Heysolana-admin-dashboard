import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, Search, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getUsers,
  previewWhatsAppCampaign,
  User,
  WhatsAppCampaignPayload,
  WhatsAppMessageMode,
  WhatsAppTargetMode,
} from "@/services/api";

const emptyForm = {
  messageMode: "template" as WhatsAppMessageMode,
  templateName: "notification",
  templateLanguage: "en_US",
  header: "HeySolana",
  body: "",
  appLink: "",
  search: "",
  targetMode: "filtered" as WhatsAppTargetMode,
  selectedUserIds: [] as number[],
};

interface WhatsAppComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  sending: boolean;
  onSaveDraft: (payload: WhatsAppCampaignPayload) => Promise<void>;
  onSend: (payload: WhatsAppCampaignPayload) => Promise<void>;
}

export const WhatsAppComposeModal = ({
  open,
  onOpenChange,
  saving,
  sending,
  onSaveDraft,
  onSend,
}: WhatsAppComposeModalProps) => {
  const [messageMode, setMessageMode] = useState<WhatsAppMessageMode>(emptyForm.messageMode);
  const [templateName, setTemplateName] = useState(emptyForm.templateName);
  const [templateLanguage, setTemplateLanguage] = useState(emptyForm.templateLanguage);
  const [header, setHeader] = useState(emptyForm.header);
  const [body, setBody] = useState(emptyForm.body);
  const [appLink, setAppLink] = useState(emptyForm.appLink);
  const [search, setSearch] = useState(emptyForm.search);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [targetMode, setTargetMode] = useState<WhatsAppTargetMode>(emptyForm.targetMode);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(emptyForm.selectedUserIds);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<{ recipient_count: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search, open]);

  useEffect(() => {
    if (!open) return;
    setPage(1);
    if (targetMode !== "selected") {
      setSelectedUserIds([]);
    }
  }, [debouncedSearch, targetMode, open]);

  useEffect(() => {
    if (!open) {
      setMessageMode(emptyForm.messageMode);
      setTemplateName(emptyForm.templateName);
      setTemplateLanguage(emptyForm.templateLanguage);
      setHeader(emptyForm.header);
      setBody(emptyForm.body);
      setAppLink(emptyForm.appLink);
      setSearch(emptyForm.search);
      setDebouncedSearch("");
      setTargetMode(emptyForm.targetMode);
      setSelectedUserIds(emptyForm.selectedUserIds);
      setPage(1);
      setPreview(null);
    }
  }, [open]);

  const buildPreviewPayload = useCallback(
    () => ({
      message_mode: messageMode,
      target: targetMode,
      search: targetMode === "filtered" && debouncedSearch ? debouncedSearch : undefined,
      user_ids: targetMode === "selected" ? selectedUserIds : undefined,
    }),
    [messageMode, targetMode, debouncedSearch, selectedUserIds]
  );

  const buildCampaignPayload = useCallback(
    (sendNow: boolean): WhatsAppCampaignPayload => ({
      message_mode: messageMode,
      header: messageMode === "template" ? header.trim() : null,
      body: body.trim(),
      app_link: messageMode === "template" ? appLink.trim() : null,
      template_name: messageMode === "template" ? templateName.trim() : null,
      template_language: messageMode === "template" ? templateLanguage.trim() : null,
      target: targetMode,
      search: targetMode === "filtered" && debouncedSearch ? debouncedSearch : null,
      user_ids: targetMode === "selected" ? selectedUserIds : undefined,
      send_now: sendNow,
    }),
    [
      messageMode,
      header,
      body,
      appLink,
      templateName,
      templateLanguage,
      targetMode,
      debouncedSearch,
      selectedUserIds,
    ]
  );

  const refreshPreview = useCallback(async () => {
    if (!open) return;
    const result = await previewWhatsAppCampaign(buildPreviewPayload());
    setPreview(result);
  }, [buildPreviewPayload, open]);

  useEffect(() => {
    if (open) {
      void refreshPreview();
    }
  }, [refreshPreview, open]);

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-compose-users", debouncedSearch, targetMode, page, open],
    queryFn: () =>
      getUsers({
        search: targetMode === "all" ? undefined : debouncedSearch || undefined,
        page,
        per_page: 10,
      }),
    enabled: open && targetMode !== "all",
  });

  const users = useMemo(
    () => (data?.users ?? []).filter((user) => user.phone_number),
    [data?.users]
  );
  const meta = data;

  const toggleSelect = (id: number) => {
    setTargetMode("selected");
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOnPage = () => {
    const ids = users.map((user) => user.id);
    if (ids.every((id) => selectedUserIds.includes(id))) {
      setSelectedUserIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setTargetMode("selected");
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const validateCompose = () => {
    if (messageMode === "template" && !templateName.trim()) {
      toast.error("Template name is required");
      return false;
    }
    if (messageMode === "template" && !header.trim()) {
      toast.error("Header variable is required");
      return false;
    }
    if (!body.trim()) {
      toast.error("Message is required");
      return false;
    }
    if (messageMode === "template" && !appLink.trim()) {
      toast.error("App link URL variable is required");
      return false;
    }
    if (targetMode === "selected" && selectedUserIds.length === 0) {
      toast.error("Select at least one user or switch to filtered / all users");
      return false;
    }
    if ((preview?.recipient_count ?? 0) === 0) {
      toast.error("No recipients match the current audience");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateCompose()) return;
    await onSaveDraft(buildCampaignPayload(false));
  };

  const handleSend = async () => {
    if (!validateCompose()) return;
    if (
      !window.confirm(
        `Queue WhatsApp message for ${preview?.recipient_count ?? "?"} recipient(s)? The worker will process these in the background.`
      )
    ) {
      return;
    }
    await onSend(buildCampaignPayload(true));
  };

  const busy = saving || sending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto border-white/10 bg-background">
        <DialogHeader>
          <DialogTitle>Compose WhatsApp message</DialogTitle>
          <DialogDescription>
            Choose recipients, write your message, then save as draft or queue for delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
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

            {messageMode === "template" && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Template name</Label>
                    <Input
                      placeholder="notification"
                      value={templateName}
                      onChange={(event) => setTemplateName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Input
                      placeholder="en_US"
                      value={templateLanguage}
                      onChange={(event) => setTemplateLanguage(event.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Header variable</Label>
                  <Input
                    placeholder="HeySolana"
                    value={header}
                    onChange={(event) => setHeader(event.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{messageMode === "template" ? "Notification message" : "Message"}</Label>
              <Textarea
                placeholder={
                  messageMode === "template"
                    ? "Passed into the notification template body"
                    : "Write your WhatsApp message..."
                }
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                maxLength={1000}
              />
            </div>

            {messageMode === "template" && (
              <div className="space-y-2">
                <Label>App link URL variable</Label>
                <Input
                  placeholder="https://..."
                  value={appLink}
                  onChange={(event) => setAppLink(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A campaign tracking parameter is appended automatically when queued.
                </p>
              </div>
            )}

            {preview ? (
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {preview.recipient_count} recipient(s)
              </Badge>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSaveDraft}
                disabled={busy || (preview?.recipient_count ?? 0) === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving…" : "Save draft"}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleSend}
                disabled={busy || (preview?.recipient_count ?? 0) === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Queueing…" : "Queue messages"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Send to</Label>
              <Select
                value={targetMode}
                onValueChange={(value) => setTargetMode(value as WhatsAppTargetMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users with phone numbers</SelectItem>
                  <SelectItem value="filtered">Filtered users</SelectItem>
                  <SelectItem value="selected">Selected users only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetMode !== "all" ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Phone, username, wallet..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                {targetMode === "selected" && selectedUserIds.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedUserIds.length} user(s) selected across all pages
                  </p>
                ) : null}

                <div className="rounded-lg border border-white/10 overflow-hidden">
                  {isLoading ? (
                    <Skeleton className="h-48 w-full rounded-none" />
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox
                                checked={
                                  users.length > 0 &&
                                  users.every((user) => selectedUserIds.includes(user.id))
                                }
                                onCheckedChange={toggleSelectAllOnPage}
                              />
                            </TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                No users with phone numbers match filters
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map((user: User) => (
                              <TableRow
                                key={user.id}
                                className="cursor-pointer"
                                onClick={() => toggleSelect(user.id)}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedUserIds.includes(user.id)}
                                    onCheckedChange={() => toggleSelect(user.id)}
                                  />
                                </TableCell>
                                <TableCell>{user.username || `User #${user.id}`}</TableCell>
                                <TableCell className="font-mono text-xs">
                                  {user.phone_number}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      {meta && meta.last_page > 1 ? (
                        <div className="flex justify-between items-center px-3 py-2 border-t border-white/10">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                          >
                            Previous
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Page {meta.current_page} of {meta.last_page}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={page >= meta.last_page}
                            onClick={() => setPage((p) => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                {meta ? (
                  <p className="text-xs text-muted-foreground">
                    {meta.total} matching user(s) with phone numbers
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg border border-white/10 p-4">
                This message will be queued for every user with a registered phone number. Use
                filtered or selected mode to narrow the audience.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
