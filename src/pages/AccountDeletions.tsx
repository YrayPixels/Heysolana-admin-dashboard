import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search, UserX } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AccountDeletionRequest,
  AccountDeletionStatus,
  getAccountDeletionRequests,
  getAccountDeletionStats,
  updateAccountDeletionStatus,
} from "@/services/api";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusVariant(
  status: AccountDeletionStatus
): "destructive" | "default" | "secondary" | "outline" {
  switch (status) {
    case "pending":
      return "destructive";
    case "processing":
      return "default";
    case "completed":
      return "secondary";
    default:
      return "outline";
  }
}

const AccountDeletions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["account-deletion-stats"],
    queryFn: getAccountDeletionStats,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["account-deletion-requests", statusTab, search, page],
    queryFn: () =>
      getAccountDeletionRequests({
        status: statusTab,
        search: search || undefined,
        page,
        per_page: 20,
      }),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const handleStatusChange = async (
    row: AccountDeletionRequest,
    status: AccountDeletionStatus
  ) => {
    setUpdatingId(row.id);
    try {
      const result = await updateAccountDeletionStatus(row.id, status);
      if (result) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["account-deletion-requests"] }),
          queryClient.invalidateQueries({ queryKey: ["account-deletion-stats"] }),
        ]);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple/20">
              <UserX className="h-6 w-6 text-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Account deletions</h1>
              <p className="text-muted-foreground text-sm">
                Review deletion requests from the app. Process manually, then mark status.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Pending", value: stats?.pending ?? 0 },
            { label: "Processing", value: stats?.processing ?? 0 },
            { label: "Completed", value: stats?.completed ?? 0 },
            { label: "Rejected", value: stats?.rejected ?? 0 },
            { label: "Total", value: stats?.total ?? 0 },
          ].map((item) => (
            <Card key={item.label} className="glass-morphism">
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-2xl">{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="glass-morphism">
          <CardHeader className="gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <Tabs
                value={statusTab}
                onValueChange={(value) => {
                  setStatusTab(value);
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
              <form
                className="flex gap-2 w-full md:w-auto"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(searchInput.trim());
                  setPage(1);
                }}
              >
                <div className="relative flex-1 md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search username, email, phone…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No deletion requests in this view.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => {
                            if (row.addressbook_id) {
                              navigate(`/users/${row.addressbook_id}`);
                            }
                          }}
                        >
                          <div className="font-medium">@{row.username}</div>
                          <div className="text-xs text-muted-foreground">#{row.id}</div>
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{row.email || "—"}</div>
                        <div className="text-muted-foreground">{row.phone_number || "—"}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[160px] truncate">
                        {row.wallet_address || "—"}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(row.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={row.status}
                          disabled={updatingId === row.id}
                          onValueChange={(value) =>
                            handleStatusChange(row, value as AccountDeletionStatus)
                          }
                        >
                          <SelectTrigger className="w-[140px] ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {meta && meta.last_page > 1 ? (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {meta.current_page} of {meta.last_page} · {meta.total} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AccountDeletions;
