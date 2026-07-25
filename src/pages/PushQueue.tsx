import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListOrdered,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
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
import {
  getPushQueueItems,
  getPushQueueStats,
  processPushQueue,
  PushQueueStatus,
} from "@/services/api";

const STATUS_TABS: { value: "all" | PushQueueStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusVariant(
  status: PushQueueStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "queued":
      return "outline";
    case "sent":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "default";
  }
}

const PushQueue = () => {
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState<"all" | PushQueueStatus>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["push-queue-stats"],
    queryFn: getPushQueueStats,
    refetchInterval: 15000,
  });

  const {
    data: listData,
    isLoading: listLoading,
    isFetching: listFetching,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["push-queue", statusTab, search, page],
    queryFn: () =>
      getPushQueueItems({
        status: statusTab,
        search: search || undefined,
        page,
        per_page: 25,
      }),
    refetchInterval: 15000,
  });

  const items = listData?.data ?? [];
  const meta = listData?.meta;

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["push-queue-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["push-queue"] }),
    ]);
  };

  const handleProcessNow = async () => {
    setProcessing(true);
    try {
      await processPushQueue();
      await refreshAll();
    } finally {
      setProcessing(false);
    }
  };

  const applySearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Push queue</h1>
            <p className="text-sm text-muted-foreground">
              Delivery results for queued Expo pushes, including failures.
              {stats ? ` Cron batch size: ${stats.batch_size}/min.` : null}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void refetchStats();
                void refetchList();
              }}
              disabled={listFetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${listFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => void handleProcessNow()} disabled={processing}>
              <Play className="mr-2 h-4 w-4" />
              {processing ? "Processing…" : "Process now"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" /> Queued
              </CardDescription>
              <CardTitle className="text-2xl">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.queued ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Sent
              </CardDescription>
              <CardTitle className="text-2xl">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.sent ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Failed
              </CardDescription>
              <CardTitle className="text-2xl">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.failed ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4" /> Total
              </CardDescription>
              <CardTitle className="text-2xl">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.total ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {(stats?.recent_failures?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent failures</CardTitle>
              <CardDescription>Latest Expo delivery errors from the queue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.recent_failures.map((failure) => (
                <div
                  key={failure.id}
                  className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{failure.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(failure.updated_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Batch: {failure.batch_key}</p>
                  <p className="mt-1 text-destructive">{failure.error_message || "Unknown error"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="gap-4 space-y-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Queue items</CardTitle>
                <CardDescription>
                  {meta ? `${meta.total} item(s)` : "Loading…"}
                </CardDescription>
              </div>
              <div className="flex w-full max-w-md gap-2">
                <Input
                  placeholder="Search title, phone, batch, error…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applySearch();
                  }}
                />
                <Button variant="outline" onClick={applySearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Tabs
              value={statusTab}
              onValueChange={(value) => {
                setStatusTab(value as "all" | PushQueueStatus);
                setPage(1);
              }}
            >
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
            {listLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No queue items match these filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[220px]">
                            <div className="truncate font-medium">{item.title}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {item.body}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.phone_number || (item.user_id ? `User #${item.user_id}` : "—")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.push_token_preview}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[160px] truncate font-mono text-xs">
                            {item.batch_key}
                          </div>
                          {item.push_campaign_id ? (
                            <div className="text-xs text-muted-foreground">
                              Campaign #{item.push_campaign_id}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[260px] whitespace-pre-wrap break-words text-xs text-destructive">
                            {item.error_message || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(item.updated_at || item.sent_at || item.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {meta && meta.last_page > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {meta.current_page} of {meta.last_page}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PushQueue;
