import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, Search, Send, Smartphone, Users } from "lucide-react";
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
  getPushRecipients,
  previewAdminPush,
  PushCampaign,
  PushCampaignPayload,
  PushRecipient,
} from "@/services/api";

type TargetMode = "filtered" | "selected" | "all";

const emptyForm = {
  title: "",
  body: "",
  link: "",
  search: "",
  deviceFilter: "all" as "all" | "ios" | "android",
  targetMode: "filtered" as TargetMode,
  selectedIds: [] as number[],
};

const buildInitialForm = (campaign?: PushCampaign | null) => {
  if (!campaign) return emptyForm;
  return {
    title: campaign.title,
    body: campaign.body,
    link: campaign.link ?? "",
    search: campaign.search ?? "",
    deviceFilter: campaign.device_type ?? ("all" as const),
    targetMode: campaign.target,
    selectedIds: campaign.token_ids ?? [],
  };
};

interface PushComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: PushCampaign | null;
  saving: boolean;
  sending: boolean;
  onSaveDraft: (payload: PushCampaignPayload) => Promise<void>;
  onSend: (payload: PushCampaignPayload) => Promise<void>;
}

export const PushComposeModal = ({
  open,
  onOpenChange,
  campaign,
  saving,
  sending,
  onSaveDraft,
  onSend,
}: PushComposeModalProps) => {
  const isEditing = Boolean(campaign);
  const [title, setTitle] = useState(emptyForm.title);
  const [body, setBody] = useState(emptyForm.body);
  const [link, setLink] = useState(emptyForm.link);
  const [search, setSearch] = useState(emptyForm.search);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<"all" | "ios" | "android">(
    emptyForm.deviceFilter
  );
  const [targetMode, setTargetMode] = useState<TargetMode>(emptyForm.targetMode);
  const [selectedIds, setSelectedIds] = useState<number[]>(emptyForm.selectedIds);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<{
    device_count: number;
    user_count: number;
    ios_count: number;
    android_count: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search, open]);

  useEffect(() => {
    if (!open) return;
    setPage(1);
    if (targetMode !== "selected") {
      setSelectedIds([]);
    }
  }, [debouncedSearch, deviceFilter, targetMode, open]);

  useEffect(() => {
    if (!open) {
      setTitle(emptyForm.title);
      setBody(emptyForm.body);
      setLink(emptyForm.link);
      setSearch(emptyForm.search);
      setDebouncedSearch("");
      setDeviceFilter(emptyForm.deviceFilter);
      setTargetMode(emptyForm.targetMode);
      setSelectedIds(emptyForm.selectedIds);
      setPage(1);
      setPreview(null);
      return;
    }

    const initial = buildInitialForm(campaign);
    setTitle(initial.title);
    setBody(initial.body);
    setLink(initial.link);
    setSearch(initial.search);
    setDebouncedSearch(initial.search.trim());
    setDeviceFilter(initial.deviceFilter);
    setTargetMode(initial.targetMode);
    setSelectedIds(initial.selectedIds);
    setPage(1);
    setPreview(null);
  }, [open, campaign]);

  const buildPayloadBase = useCallback(
    () => ({
      target: targetMode,
      device_type: deviceFilter !== "all" ? deviceFilter : undefined,
      search: targetMode === "filtered" && debouncedSearch ? debouncedSearch : undefined,
      token_ids: targetMode === "selected" ? selectedIds : undefined,
      active_only: true,
    }),
    [targetMode, deviceFilter, debouncedSearch, selectedIds]
  );

  const buildCampaignPayload = useCallback(
    (sendNow: boolean): PushCampaignPayload => ({
      title: title.trim(),
      body: body.trim(),
      link: link.trim() || null,
      target: targetMode,
      device_type: deviceFilter !== "all" ? deviceFilter : null,
      search: targetMode === "filtered" && debouncedSearch ? debouncedSearch : null,
      token_ids: targetMode === "selected" ? selectedIds : undefined,
      active_only: true,
      send_now: sendNow,
    }),
    [title, body, link, targetMode, deviceFilter, debouncedSearch, selectedIds]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["push-recipients-compose", debouncedSearch, deviceFilter, page, open],
    queryFn: () =>
      getPushRecipients({
        search: debouncedSearch || undefined,
        device_type: deviceFilter,
        page,
        per_page: 10,
      }),
    enabled: open && targetMode !== "all",
  });

  const refreshPreview = useCallback(async () => {
    if (!open) return;
    const result = await previewAdminPush(buildPayloadBase());
    setPreview(result);
  }, [buildPayloadBase, open]);

  useEffect(() => {
    if (open) {
      void refreshPreview();
    }
  }, [refreshPreview, open]);

  const toggleSelect = (id: number) => {
    setTargetMode("selected");
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOnPage = () => {
    const ids = (data?.recipients ?? []).map((r) => r.id);
    if (ids.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setTargetMode("selected");
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const validateCompose = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return false;
    }
    if (targetMode === "selected" && selectedIds.length === 0) {
      toast.error("Select at least one device or switch to filtered / all users");
      return false;
    }
    if ((preview?.device_count ?? 0) === 0) {
      toast.error("No devices match the current audience");
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
        `Send push to ${preview?.device_count ?? "?"} device(s)? This cannot be undone.`
      )
    ) {
      return;
    }
    await onSend(buildCampaignPayload(true));
  };

  const recipients = data?.recipients ?? [];
  const meta = data?.meta;
  const busy = saving || sending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto border-white/10 bg-background">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit push notification" : "Compose push notification"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the message or audience, then save your changes or send immediately."
              : "Write your message, choose who receives it, then save as draft or send immediately."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="push-title">Title</Label>
              <Input
                id="push-title"
                placeholder="HeySolana update"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="push-body">Message</Label>
              <Textarea
                id="push-body"
                placeholder="Your notification body…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                maxLength={1000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="push-link">Deep link (optional)</Label>
              <Input
                id="push-link"
                placeholder="/dashboard"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                maxLength={2048}
              />
            </div>

            {preview ? (
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">
                  <Smartphone className="h-3 w-3 mr-1" />
                  {preview.device_count} device(s)
                </Badge>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {preview.user_count} user(s)
                </Badge>
                <Badge variant="outline">iOS: {preview.ios_count}</Badge>
                <Badge variant="outline">Android: {preview.android_count}</Badge>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSaveDraft}
                disabled={busy || (preview?.device_count ?? 0) === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving…" : isEditing ? "Save changes" : "Save draft"}
              </Button>
              <Button
                className="flex-1 bg-purple hover:bg-purple/90"
                onClick={handleSend}
                disabled={busy || (preview?.device_count ?? 0) === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending…" : "Send now"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Send to</Label>
              <Select
                value={targetMode}
                onValueChange={(v) => setTargetMode(v as TargetMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All active devices</SelectItem>
                  <SelectItem value="filtered">Filtered devices</SelectItem>
                  <SelectItem value="selected">Selected devices only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetMode !== "all" ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Phone, username, wallet…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select
                    value={deviceFilter}
                    onValueChange={(v) => setDeviceFilter(v as typeof deviceFilter)}
                  >
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="ios">iOS</SelectItem>
                      <SelectItem value="android">Android</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {targetMode === "selected" && selectedIds.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedIds.length} device(s) selected across all pages
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
                                  recipients.length > 0 &&
                                  recipients.every((r) => selectedIds.includes(r.id))
                                }
                                onCheckedChange={toggleSelectAllOnPage}
                              />
                            </TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Platform</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recipients.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                No devices match filters
                              </TableCell>
                            </TableRow>
                          ) : (
                            recipients.map((r: PushRecipient) => (
                              <TableRow
                                key={r.id}
                                className="cursor-pointer"
                                onClick={() => toggleSelect(r.id)}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedIds.includes(r.id)}
                                    onCheckedChange={() => toggleSelect(r.id)}
                                  />
                                </TableCell>
                                <TableCell>{r.username ?? "—"}</TableCell>
                                <TableCell className="font-mono text-xs">
                                  {r.phone_number ?? "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{r.device_type}</Badge>
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
                    {meta.total} matching device(s), {meta.unique_phones} unique phone number(s)
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg border border-white/10 p-4">
                This push will be sent to every active registered device. Use filtered or selected
                mode to narrow the audience.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
