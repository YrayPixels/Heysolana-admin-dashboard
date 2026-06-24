import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Headphones, MessageCircle, Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupportComposeModal } from "@/components/support/SupportComposeModal";
import { getSupportConversations, SupportConversation } from "@/services/api";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "open") return "default";
  if (status === "resolved") return "secondary";
  return "outline";
}

function userLabel(c: SupportConversation) {
  if (c.username) return `@${c.username}`;
  if (c.phone_number) return c.phone_number;
  if (c.wallet_address) return `${c.wallet_address.slice(0, 6)}…${c.wallet_address.slice(-4)}`;
  return `User #${c.id}`;
}

const SupportInbox = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["support-conversations", status, search],
    queryFn: () =>
      getSupportConversations({
        status,
        search: search.trim() || undefined,
        per_page: 50,
      }),
    refetchInterval: 15000,
  });

  const conversations = data?.data ?? [];
  const unreadTotal = data?.meta?.unread_total ?? 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Headphones className="h-8 w-8 text-solana" />
            <div>
              <h1 className="text-2xl font-bold">Support inbox</h1>
              <p className="text-muted-foreground text-sm">
                Two-way chat with HeySolana wallet users
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New message
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="glass-morphism border-white/10">
            <CardHeader className="pb-2">
              <CardDescription>Unread from users</CardDescription>
              <CardTitle className="text-3xl">{unreadTotal}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-morphism border-white/10 sm:col-span-2">
            <CardHeader className="pb-2">
              <CardDescription>Open conversations</CardDescription>
              <CardTitle className="text-3xl">
                {conversations.filter((c) => c.status === "open").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversations
                </CardTitle>
                <CardDescription>Click a row to open the thread</CardDescription>
              </div>
              <Input
                placeholder="Search user, phone, wallet…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs bg-black/20"
              />
            </div>
            <Tabs value={status} onValueChange={setStatus} className="mt-2">
              <TabsList>
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No conversations yet. Users can message you from Settings → Help &amp; Support in
                the wallet app.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Last message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Unread</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-white/5"
                      onClick={() => navigate(`/support/${c.id}`)}
                    >
                      <TableCell className="font-medium">{userLabel(c)}</TableCell>
                      <TableCell className="max-w-[280px] truncate text-muted-foreground">
                        {c.last_message_preview || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(c.last_message_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.unread_admin_count > 0 ? (
                          <Badge variant="destructive">{c.unread_admin_count}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <SupportComposeModal open={composeOpen} onOpenChange={setComposeOpen} />
    </DashboardLayout>
  );
};

export default SupportInbox;
