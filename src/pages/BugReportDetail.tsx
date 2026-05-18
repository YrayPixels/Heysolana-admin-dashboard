import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  BugReportSeverity,
  BugReportStatus,
  deleteBugReport,
  getBugReport,
  updateBugReportStatus,
} from '@/services/api';

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
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

const BugReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const reportId = id ? parseInt(id, 10) : NaN;

  const { data, isLoading } = useQuery({
    queryKey: ['bug-report', reportId],
    queryFn: () => getBugReport(reportId),
    enabled: !Number.isNaN(reportId),
  });

  const report = data?.data;

  const handleStatus = async (status: BugReportStatus) => {
    if (Number.isNaN(reportId)) return;
    setIsUpdating(true);
    const result = await updateBugReportStatus(reportId, status);
    setIsUpdating(false);
    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['bug-report', reportId] });
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      queryClient.invalidateQueries({ queryKey: ['bug-report-stats'] });
    }
  };

  const handleDelete = async () => {
    if (Number.isNaN(reportId)) return;
    setIsUpdating(true);
    const ok = await deleteBugReport(reportId);
    setIsUpdating(false);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      queryClient.invalidateQueries({ queryKey: ['bug-report-stats'] });
      navigate('/bug-reports');
    }
  };

  if (Number.isNaN(reportId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid report ID</p>
          <Button variant="link" onClick={() => navigate('/bug-reports')} className="mt-2">
            Back to pipeline
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/bug-reports')}
              aria-label="Back to pipeline"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">{report?.title}</h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={severityVariant(report?.severity ?? 'info')}>
                      {report?.severity}
                    </Badge>
                    <Badge variant={statusVariant(report?.status ?? 'new')}>
                      {report?.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {report?.type}
                    </Badge>
                    {report?.source && (
                      <Badge variant="outline">{report.source}</Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {!isLoading && report && (
            <div className="flex flex-wrap gap-2">
              {report.status !== 'pending' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatus('pending')}
                  disabled={isUpdating}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Mark pending
                </Button>
              )}
              {report.status !== 'fixed' && (
                <Button onClick={() => handleStatus('fixed')} disabled={isUpdating}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark fixed
                </Button>
              )}
              {report.status === 'fixed' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatus('pending')}
                  disabled={isUpdating}
                >
                  Reopen as pending
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => setShowDelete(true)}
                disabled={isUpdating}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : report ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {report.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{report.summary}</p>
                  </CardContent>
                </Card>
              )}

              {report.details && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/50 rounded-md p-4 overflow-x-auto">
                      {report.details}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {report.stack_trace && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Stack trace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/50 rounded-md p-4 overflow-x-auto max-h-96">
                      {report.stack_trace}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {report.metadata && Object.keys(report.metadata).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/50 rounded-md p-4 overflow-x-auto">
                      {JSON.stringify(report.metadata, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Report info</CardTitle>
                  <CardDescription>ID #{report.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Reported</p>
                    <p>{formatDate(report.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Updated</p>
                    <p>{formatDate(report.updated_at)}</p>
                  </div>
                  {report.resolved_at && (
                    <div>
                      <p className="text-muted-foreground">Resolved</p>
                      <p>{formatDate(report.resolved_at)}</p>
                      {report.resolver && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {report.resolver.name || report.resolver.email}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Device & user</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {report.user && (
                    <div>
                      <p className="text-muted-foreground">User</p>
                      <p>{report.user.name || report.user.email}</p>
                      <p className="text-xs text-muted-foreground">{report.user.email}</p>
                    </div>
                  )}
                  {report.wallet_address && (
                    <div>
                      <p className="text-muted-foreground">Wallet</p>
                      <p className="font-mono text-xs break-all">{report.wallet_address}</p>
                    </div>
                  )}
                  {report.platform && (
                    <div>
                      <p className="text-muted-foreground">Platform</p>
                      <p className="capitalize">{report.platform}</p>
                    </div>
                  )}
                  {report.app_version && (
                    <div>
                      <p className="text-muted-foreground">App version</p>
                      <p>{report.app_version}</p>
                    </div>
                  )}
                  {report.device_info && (
                    <div>
                      <p className="text-muted-foreground">Device</p>
                      <p>{report.device_info}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Report not found</p>
        )}
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the report from the pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isUpdating}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default BugReportDetail;
