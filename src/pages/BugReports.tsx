import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bug,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  bulkDeleteBugReports,
  BugReport,
  BugReportSeverity,
  BugReportStatus,
  clearBugReports,
  getBugReports,
  getBugReportStats,
} from '@/services/api';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'Inbox' },
  { value: 'pending', label: 'Pending' },
  { value: 'fixed', label: 'Fixed' },
];

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'backend-api', label: 'Backend API' },
  { value: 'wallet', label: 'Wallet app' },
  { value: 'mobile', label: 'Mobile app' },
];

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function severityVariant(severity: BugReportSeverity): 'destructive' | 'default' | 'secondary' {
  switch (severity) {
    case 'critical':
      return 'destructive';
    case 'warning':
      return 'default';
    default:
      return 'secondary';
  }
}

function statusVariant(status: BugReportStatus): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'new':
      return 'destructive';
    case 'pending':
      return 'default';
    case 'fixed':
      return 'secondary';
    default:
      return 'outline';
  }
}

const BugReports = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState('new');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [clearDialog, setClearDialog] = useState<'fixed' | 'all' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['bug-report-stats'],
    queryFn: getBugReportStats,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['bug-reports', statusTab, severityFilter, typeFilter, sourceFilter, search, page],
    queryFn: () =>
      getBugReports({
        status: statusTab === 'all' ? undefined : statusTab,
        severity: severityFilter === 'all' ? undefined : severityFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        source: sourceFilter === 'all' ? undefined : sourceFilter,
        search: search || undefined,
        page,
        per_page: 20,
      }),
  });

  const reports = data?.data ?? [];
  const meta = data?.meta;
  const allSelected = reports.length > 0 && selectedIds.length === reports.length;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(reports.map((r) => r.id));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    await bulkDeleteBugReports(selectedIds);
    setSelectedIds([]);
    setIsDeleting(false);
    queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
    queryClient.invalidateQueries({ queryKey: ['bug-report-stats'] });
  };

  const handleClear = async (scope: 'fixed' | 'all') => {
    setIsDeleting(true);
    await clearBugReports(scope);
    setClearDialog(null);
    setSelectedIds([]);
    setIsDeleting(false);
    queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
    queryClient.invalidateQueries({ queryKey: ['bug-report-stats'] });
  };

  const openReport = (report: BugReport) => {
    navigate(`/bug-reports/${report.id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bugs & Logs</h1>
            <p className="text-muted-foreground">
              Track incoming reports, triage by severity, and move through the pipeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearDialog('fixed')}
              disabled={!stats?.fixed}
            >
              Clear fixed
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setClearDialog('all')}
            >
              Clear all
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inbox</CardDescription>
              <CardTitle className="text-2xl">{stats?.new ?? '—'}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl">{stats?.pending ?? '—'}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Fixed</CardDescription>
              <CardTitle className="text-2xl">{stats?.fixed ?? '—'}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-destructive/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                Open critical
              </CardDescription>
              <CardTitle className="text-2xl text-destructive">
                {stats?.open_critical ?? '—'}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open warnings</CardDescription>
              <CardTitle className="text-2xl">{stats?.open_warning ?? '—'}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <Tabs
                value={statusTab}
                onValueChange={(v) => {
                  setStatusTab(v);
                  setPage(1);
                  setSelectedIds([]);
                }}
              >
                <TabsList>
                  {STATUS_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                      {tab.value === 'new' && stats?.new ? (
                        <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                          {stats.new}
                        </Badge>
                      ) : null}
                      {tab.value === 'pending' && stats?.pending ? (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                          {stats.pending}
                        </Badge>
                      ) : null}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <form onSubmit={handleSearch} className="flex flex-1 gap-2 min-w-[200px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search title, summary, wallet…"
                      className="pl-8"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="secondary">
                    Search
                  </Button>
                </form>
                <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); setSelectedIds([]); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); setSelectedIds([]); }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="log">Log</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sourceFilter}
                  onValueChange={(v) => {
                    setSourceFilter(v);
                    setPage(1);
                    setSelectedIds([]);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedIds.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bug className="mb-2 h-10 w-10 opacity-50" />
                <p>No reports in this view</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Reported</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow
                        key={report.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openReport(report)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(report.id)}
                            onCheckedChange={() => toggleSelect(report.id)}
                            aria-label={`Select report ${report.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium line-clamp-1">{report.title}</div>
                          {report.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {report.summary}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={severityVariant(report.severity)}>
                            {report.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{report.type}</TableCell>
                        <TableCell>{report.source ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDate(report.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {meta && meta.last_page > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {meta.current_page} of {meta.last_page} ({meta.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={clearDialog !== null} onOpenChange={() => setClearDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {clearDialog === 'all' ? 'Clear all reports?' : 'Clear fixed reports?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clearDialog === 'all'
                ? 'This permanently deletes every bug report and log. This cannot be undone.'
                : 'This permanently deletes all reports marked as fixed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => clearDialog && handleClear(clearDialog)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default BugReports;
