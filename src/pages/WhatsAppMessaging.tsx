import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Users,
} from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  sendAdminWhatsApp,
  User,
  WhatsAppMessageMode,
  WhatsAppTargetMode,
} from "@/services/api";

const WhatsAppMessaging = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [targetMode, setTargetMode] = useState<WhatsAppTargetMode>("filtered");
  const [messageMode, setMessageMode] = useState<WhatsAppMessageMode>("template");
  const [templateName, setTemplateName] = useState("notification");
  const [templateLanguage, setTemplateLanguage] = useState("en_US");
  const [header, setHeader] = useState("HeySolana");
  const [body, setBody] = useState("");
  const [appLink, setAppLink] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSelectedUserIds([]);
  }, [debouncedSearch, targetMode]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["whatsapp-users", debouncedSearch, targetMode, page],
    queryFn: () =>
      getUsers({
        search: targetMode === "all" ? undefined : debouncedSearch || undefined,
        page,
        per_page: targetMode === "all" ? 1 : 15,
      }),
  });

  const users = useMemo(() => data?.users ?? [], [data?.users]);
  const meta = data;
  const recipientCount =
    targetMode === "selected" ? selectedUserIds.length : meta?.total ?? 0;

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

  const handleSend = async () => {
    if (messageMode === "template" && !templateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (messageMode === "template" && !header.trim()) {
      toast.error("Header variable is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Message is required");
      return;
    }
    if (messageMode === "template" && !appLink.trim()) {
      toast.error("App link URL variable is required");
      return;
    }
    if (targetMode === "selected" && selectedUserIds.length === 0) {
      toast.error("Select at least one user or switch to filtered / all users");
      return;
    }
    if (
      !window.confirm(
        `Queue WhatsApp message for ${recipientCount} recipient(s)? The worker will process these in the background.`
      )
    ) {
      return;
    }

    setSending(true);
    try {
      await sendAdminWhatsApp({
        target: targetMode,
        message_mode: messageMode,
        header: messageMode === "template" ? header.trim() : undefined,
        body: body.trim(),
        app_link: messageMode === "template" ? appLink.trim() : undefined,
        template_name: messageMode === "template" ? templateName.trim() : undefined,
        template_language: messageMode === "template" ? templateLanguage.trim() : undefined,
        search: targetMode === "filtered" && debouncedSearch ? debouncedSearch : undefined,
        user_ids: targetMode === "selected" ? selectedUserIds : undefined,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-500/20">
              <MessageCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">WhatsApp messaging</h1>
              <p className="text-muted-foreground text-sm">
                Queue WhatsApp messages to users with registered phone numbers
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Alert className="border-green-500/30 bg-green-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Queued delivery</AlertTitle>
          <AlertDescription>
            This page schedules WhatsApp messages. The Laravel queue worker must be running
            for messages to actually send.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-morphism border-white/10">
            <CardHeader>
              <CardTitle>Compose WhatsApp message</CardTitle>
              <CardDescription>
                Use an approved template for messages outside WhatsApp&apos;s 24-hour window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Message type</label>
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
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Template name</label>
                      <Input
                        placeholder="notification"
                        value={templateName}
                        onChange={(event) => setTemplateName(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Language</label>
                      <Input
                        placeholder="en_US"
                        value={templateLanguage}
                        onChange={(event) => setTemplateLanguage(event.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Header variable</label>
                    <Input
                      placeholder="HeySolana"
                      value={header}
                      onChange={(event) => setHeader(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sent as the template header variable.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {messageMode === "template" ? "Notification message" : "Message"}
                </label>
                <Textarea
                  placeholder={
                    messageMode === "template"
                      ? "This is passed into the notification template body"
                      : "Write your WhatsApp message..."
                  }
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={5}
                  maxLength={1000}
                />
                {messageMode === "template" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    The backend sends the recipient username as body variable 1 and this message as body variable 2.
                  </p>
                )}
              </div>

              {messageMode === "template" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">App link URL variable</label>
                  <Input
                    placeholder="https://..."
                    value={appLink}
                    onChange={(event) => setAppLink(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sent as the URL button variable for the app link.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Send to</label>
                <Select
                  value={targetMode}
                  onValueChange={(value) => setTargetMode(value as WhatsAppTargetMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filtered">Filtered users</SelectItem>
                    <SelectItem value="selected">Selected users only</SelectItem>
                    <SelectItem value="all">All users with phone numbers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {recipientCount} recipient(s)
                </Badge>
                {targetMode === "selected" && (
                  <Badge variant="outline">{selectedUserIds.length} selected user(s)</Badge>
                )}
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleSend}
                disabled={sending || recipientCount === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Queueing..." : "Queue WhatsApp messages"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>
                Search by username, phone number, or wallet address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Phone, username, wallet..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  disabled={targetMode === "all"}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The backend should enforce WhatsApp opt-in and skip users without valid phone
                numbers before queueing jobs.
              </p>
            </CardContent>
          </Card>
        </div>

        {targetMode !== "all" && (
          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle className="text-base">Users with WhatsApp numbers</CardTitle>
              <CardDescription>
                {meta
                  ? `${meta.total} matching user(s), page ${meta.current_page} of ${meta.last_page || 1}`
                  : "Loading..."}
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
                              users.length > 0 &&
                              users.every((user) => selectedUserIds.includes(user.id))
                            }
                            onCheckedChange={toggleSelectAllOnPage}
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No users match filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user: User) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUserIds.includes(user.id)}
                                onCheckedChange={() => toggleSelect(user.id)}
                                disabled={!user.phone_number}
                              />
                            </TableCell>
                            <TableCell>{user.username || `User #${user.id}`}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {user.phone_number || "No phone"}
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-[220px] truncate">
                              {user.wallet_address || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.phone_number ? "outline" : "secondary"}>
                                {user.phone_number ? "Available" : "Missing phone"}
                              </Badge>
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
                        onClick={() => setPage((currentPage) => currentPage - 1)}
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
                        onClick={() => setPage((currentPage) => currentPage + 1)}
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

export default WhatsAppMessaging;
