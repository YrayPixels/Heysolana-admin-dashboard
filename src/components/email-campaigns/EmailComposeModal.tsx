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
import { useConfirm } from "@/components/ConfirmDialog";
import {
  EmailCampaignPayload,
  EmailTargetMode,
  getUsers,
  previewEmailCampaign,
  User,
} from "@/services/api";

const emptyForm = {
  subject: "",
  body: "",
  previewText: "",
  ctaLabel: "",
  ctaUrl: "",
  search: "",
  targetMode: "filtered" as EmailTargetMode,
  selectedUserIds: [] as number[],
};

interface EmailComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  sending: boolean;
  onSaveDraft: (payload: EmailCampaignPayload) => Promise<void>;
  onSend: (payload: EmailCampaignPayload) => Promise<void>;
}

export const EmailComposeModal = ({
  open,
  onOpenChange,
  saving,
  sending,
  onSaveDraft,
  onSend,
}: EmailComposeModalProps) => {
  const confirm = useConfirm();
  const [subject, setSubject] = useState(emptyForm.subject);
  const [body, setBody] = useState(emptyForm.body);
  const [previewText, setPreviewText] = useState(emptyForm.previewText);
  const [ctaLabel, setCtaLabel] = useState(emptyForm.ctaLabel);
  const [ctaUrl, setCtaUrl] = useState(emptyForm.ctaUrl);
  const [search, setSearch] = useState(emptyForm.search);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [targetMode, setTargetMode] = useState<EmailTargetMode>(emptyForm.targetMode);
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
      setSubject(emptyForm.subject);
      setBody(emptyForm.body);
      setPreviewText(emptyForm.previewText);
      setCtaLabel(emptyForm.ctaLabel);
      setCtaUrl(emptyForm.ctaUrl);
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
      target: targetMode,
      search: targetMode === "filtered" && debouncedSearch ? debouncedSearch : undefined,
      user_ids: targetMode === "selected" ? selectedUserIds : undefined,
    }),
    [targetMode, debouncedSearch, selectedUserIds]
  );

  const buildCampaignPayload = useCallback(
    (sendNow: boolean): EmailCampaignPayload => ({
      subject: subject.trim(),
      body: body.trim(),
      preview_text: previewText.trim() || null,
      cta_label: ctaLabel.trim() || null,
      cta_url: ctaUrl.trim() || null,
      target: targetMode,
      search: targetMode === "filtered" && debouncedSearch ? debouncedSearch : null,
      user_ids: targetMode === "selected" ? selectedUserIds : undefined,
      send_now: sendNow,
    }),
    [subject, body, previewText, ctaLabel, ctaUrl, targetMode, debouncedSearch, selectedUserIds]
  );

  const refreshPreview = useCallback(async () => {
    if (!open) return;
    const result = await previewEmailCampaign(buildPreviewPayload());
    setPreview(result);
  }, [buildPreviewPayload, open]);

  useEffect(() => {
    if (open) {
      void refreshPreview();
    }
  }, [refreshPreview, open]);

  const { data, isLoading } = useQuery({
    queryKey: ["email-compose-users", debouncedSearch, targetMode, page, open],
    queryFn: () =>
      getUsers({
        search: targetMode === "all" ? undefined : debouncedSearch || undefined,
        page,
        per_page: 10,
      }),
    enabled: open && targetMode !== "all",
  });

  const users = useMemo(
    () => (data?.users ?? []).filter((user) => user.email && user.email.trim() !== ""),
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
    if (!subject.trim()) {
      toast.error("Subject is required");
      return false;
    }
    if (!body.trim()) {
      toast.error("Email body is required");
      return false;
    }
    const hasCtaLabel = ctaLabel.trim().length > 0;
    const hasCtaUrl = ctaUrl.trim().length > 0;
    if (hasCtaLabel !== hasCtaUrl) {
      toast.error("Both CTA label and URL are required when adding a button");
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
    const ok = await confirm({
      title: "Queue email?",
      description: `Queue email for ${preview?.recipient_count ?? "?"} recipient(s)? The worker will process these in the background.`,
      confirmLabel: "Queue",
    });
    if (!ok) return;
    await onSend(buildCampaignPayload(true));
  };

  const busy = saving || sending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto border-white/10 bg-background">
        <DialogHeader>
          <DialogTitle>Compose email</DialogTitle>
          <DialogDescription>
            Choose recipients, write your message, then save as draft or queue for delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="e.g. New feature in HeySolana"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label>Preview text (optional)</Label>
              <Input
                placeholder="Short preview shown in inbox"
                value={previewText}
                onChange={(event) => setPreviewText(event.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                placeholder="Write your email message..."
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={8}
                maxLength={10000}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>CTA button label (optional)</Label>
                <Input
                  placeholder="Open app"
                  value={ctaLabel}
                  onChange={(event) => setCtaLabel(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>CTA button URL (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={ctaUrl}
                  onChange={(event) => setCtaUrl(event.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              A campaign tracking parameter is appended automatically to CTA links when queued.
            </p>

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
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={handleSend}
                disabled={busy || (preview?.recipient_count ?? 0) === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Queueing…" : "Queue emails"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Send to</Label>
              <Select
                value={targetMode}
                onValueChange={(value) => setTargetMode(value as EmailTargetMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users with email addresses</SelectItem>
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
                    placeholder="Email, username, phone, wallet..."
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
                            <TableHead>Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                No users with email addresses match filters
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
                                <TableCell className="font-mono text-xs">{user.email}</TableCell>
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
                    {meta.total} matching user(s) with email addresses
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg border border-white/10 p-4">
                This email will be queued for every user with a registered email address. Use
                filtered or selected mode to narrow the audience.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
