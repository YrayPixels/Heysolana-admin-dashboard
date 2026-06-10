import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  getAppTransactions,
  type AppTransaction,
  type AppTransactionsFilters,
  type TransactionMetricsCluster,
} from "@/services/api";
import { toast } from "sonner";

const CLUSTER_OPTIONS: Array<{ label: string; value: TransactionMetricsCluster }> = [
  { label: "All clusters", value: "all" },
  { label: "Mainnet", value: "mainnet" },
  { label: "Devnet", value: "devnet" },
];

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Submitted", value: "submitted" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Failed", value: "failed" },
];

const TYPE_OPTIONS = [
  { label: "All types", value: "all" },
  { label: "Swap", value: "swap" },
  { label: "Transfer", value: "transfer" },
  { label: "Private transfer", value: "private_transfer" },
  { label: "Deposit", value: "deposit" },
  { label: "Withdraw", value: "withdraw" },
  { label: "Offramp", value: "offramp" },
  { label: "Airtime", value: "airtime" },
  { label: "Electricity", value: "electricity" },
  { label: "Commerce", value: "commerce" },
  { label: "Other", value: "other" },
];

const PROVIDER_OPTIONS = [
  { label: "All providers", value: "all" },
  { label: "Jupiter", value: "jupiter" },
  { label: "Pajcash", value: "pajcash" },
  { label: "Airbills", value: "airbills" },
  { label: "Crossmint", value: "crossmint" },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatDate(iso: string | null) {
  if (!iso) return "—";

  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTokenAmount(amount: AppTransaction["input_amount"], token: string | null) {
  if (amount == null || amount === "") return "—";

  const formatted = Number(amount).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });

  return token ? `${formatted} ${token}` : formatted;
}

function formatUsd(value: AppTransaction["input_amount_usd"]) {
  const amount = Number(value ?? 0);
  return amount > 0 ? currency.format(amount) : "—";
}

function truncate(value: string | null, start = 6, end = 4) {
  if (!value) return "—";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function titleCase(value: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
      return "default";
    case "failed":
      return "destructive";
    case "submitted":
      return "secondary";
    default:
      return "outline";
  }
}

function getExplorerUrl(tx: AppTransaction) {
  if (!tx.signature) return null;
  const clusterParam = tx.cluster === "devnet" ? "?cluster=devnet" : "";
  return `https://solscan.io/tx/${tx.signature}${clusterParam}`;
}

const TransactionList: React.FC = () => {
  const queryClient = useQueryClient();
  const [cluster, setCluster] = useState<TransactionMetricsCluster>("all");
  const [status, setStatus] = useState("all");
  const [transactionType, setTransactionType] = useState("all");
  const [provider, setProvider] = useState("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);

  useEffect(() => {
    const timeout = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [cluster, status, transactionType, provider, searchDebounced]);

  const filters: AppTransactionsFilters = useMemo(
    () => ({
      cluster,
      status: status !== "all" ? status : undefined,
      transaction_type:
        transactionType !== "all" ? transactionType : undefined,
      provider: provider !== "all" ? provider : undefined,
      search: searchDebounced || undefined,
      page,
      per_page: perPage,
    }),
    [cluster, page, perPage, provider, searchDebounced, status, transactionType]
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "app-transactions",
      cluster,
      status,
      transactionType,
      provider,
      searchDebounced,
      page,
      perPage,
    ],
    queryFn: () => getAppTransactions(filters),
    placeholderData: (previous) => previous,
  });

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  const handleRefresh = async () => {
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ["app-transactions"] });
    toast.success("Transactions refreshed");
  };

  const clearFilters = () => {
    setCluster("all");
    setStatus("all");
    setTransactionType("all");
    setProvider("all");
    setSearch("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Transaction List
            </h1>
            <p className="text-muted-foreground">
              Search and review individual app-originated wallet transactions.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
            className="w-full lg:w-auto"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter by chain, status, flow type, provider, wallet, user, or
              signature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Wallet, signature, user, phone..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cluster</Label>
                <Select value={cluster} onValueChange={(value) => setCluster(value as TransactionMetricsCluster)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLUSTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={transactionType}
                  onValueChange={setTransactionType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {meta
                ? `${meta.total.toLocaleString()} transaction${meta.total === 1 ? "" : "s"} found`
                : "Latest app transactions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <WalletCards className="h-12 w-12 mb-4 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-white/10 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead>Transaction</TableHead>
                        <TableHead>User / Wallet</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>USD</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Explorer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => {
                        const explorerUrl = getExplorerUrl(transaction);

                        return (
                          <TableRow
                            key={transaction.id}
                            className="border-white/5"
                          >
                            <TableCell>
                              <div className="font-mono text-sm">
                                {truncate(transaction.signature)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.cluster}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {transaction.username ||
                                  transaction.mobile_number ||
                                  "Unknown user"}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                {truncate(transaction.wallet_address)}
                              </div>
                            </TableCell>
                            <TableCell>{titleCase(transaction.transaction_type)}</TableCell>
                            <TableCell>{titleCase(transaction.provider)}</TableCell>
                            <TableCell>
                              {formatTokenAmount(
                                transaction.input_amount ?? transaction.amount,
                                transaction.input_token_symbol ?? transaction.token
                              )}
                            </TableCell>
                            <TableCell>{formatUsd(transaction.input_amount_usd)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(transaction.status)}
                              >
                                {titleCase(transaction.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(
                                transaction.confirmed_at ??
                                  transaction.created_at
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {explorerUrl ? (
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Open transaction in Solscan"
                                >
                                  <a
                                    href={explorerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {meta && meta.last_page > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {meta.current_page} of {meta.last_page}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.current_page <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.current_page >= meta.last_page}
                        onClick={() => setPage((current) => current + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TransactionList;
