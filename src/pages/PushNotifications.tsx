import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Users,
} from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AdminSendPushPayload,
  getPushRecipients,
  previewAdminPush,
  PushRecipient,
  sendAdminPush,
} from "@/services/api";

const PushNotifications = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<"all" | "ios" | "android">("all");
  const [targetMode, setTargetMode] = useState<"filtered" | "selected" | "all">("filtered");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [preview, setPreview] = useState<{
    device_count: number;
    user_count: number;
    ios_count: number;
    android_count: number;
  } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [debouncedSearch, deviceFilter, targetMode]);

  const buildPayloadBase = useCallback(
    (): Omit<AdminSendPushPayload, "title" | "body"> => ({
      target: targetMode,
      device_type: deviceFilter !== "all" ? deviceFilter : undefined,
      search: targetMode === "filtered" && debouncedSearch ? debouncedSearch : undefined,
      token_ids: targetMode === "selected" ? selectedIds : undefined,
      active_only: true,
    }),
    [targetMode, deviceFilter, debouncedSearch, selectedIds]
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["push-recipients", debouncedSearch, deviceFilter, page],
    queryFn: () =>
      getPushRecipients({
        search: debouncedSearch || undefined,
        device_type: deviceFilter,
        page,
        per_page: 15,
      }),
    enabled: targetMode !== "all",
  });

  const refreshPreview = useCallback(async () => {
    const result = await previewAdminPush(buildPayloadBase());
    setPreview(result);
  }, [buildPayloadBase]);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);

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

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (targetMode === "selected" && selectedIds.length === 0) {
      toast.error("Select at least one device or switch to filtered / all users");
      return;
    }
    if (
      !window.confirm(
        `Send push to ${preview?.device_count ?? "?"} device(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    setSending(true);
    try {
      await sendAdminPush({
        title: title.trim(),
        body: body.trim(),
        ...buildPayloadBase(),
      });
    } finally {
      setSending(false);
    }
  };

  const recipients = data?.recipients ?? [];
  const meta = data?.meta;

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
                Send custom messages to wallet users on iOS and Android
              </p>
            </div>
            </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-morphism border-white/10">
            <CardHeader>
              <CardTitle>Compose message</CardTitle>
              <CardDescription>
                Each signed-in device gets its own push (e.g. iOS and Android both receive it).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  placeholder="HeySolana update"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={255}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <Textarea
                  placeholder="Your notification body…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Send to</label>
                <Select
                  value={targetMode}
                  onValueChange={(v) => setTargetMode(v as typeof targetMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filtered">Filtered devices (table below)</SelectItem>
                    <SelectItem value="selected">Selected devices only</SelectItem>
                    <SelectItem value="all">All active devices</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {preview && (
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
              )}

              <Button
                className="w-full bg-purple hover:bg-purple/90"
                onClick={handleSend}
                disabled={sending || (preview?.device_count ?? 0) === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending…" : "Send push notification"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
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
                <SelectTrigger>
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="ios">iOS only</SelectItem>
                  <SelectItem value="android">Android only</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="w-full" onClick={refreshPreview}>
                Update recipient count
              </Button>
            </CardContent>
          </Card>
        </div>

        {targetMode !== "all" && (
          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle className="text-base">Registered devices</CardTitle>
              <CardDescription>
                {meta
                  ? `${meta.total} device(s), ${meta.unique_phones} unique phone number(s)`
                  : "Loading…"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
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
                        <TableHead>Token</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No devices match filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        recipients.map((r: PushRecipient) => (
                          <TableRow key={r.id}>
                            <TableCell>
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
                            <TableCell className="text-xs text-muted-foreground">
                              {r.push_token_preview}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {meta && meta.last_page > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {meta.current_page} of {meta.last_page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= meta.last_page}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PushNotifications;