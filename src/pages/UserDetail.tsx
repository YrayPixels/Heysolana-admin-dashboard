import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  Copy,
  Check,
  Phone,
  Mail,
  Wallet,
  Shield,
  Calendar,
  Globe,
  Smartphone,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useConfirm } from '@/components/ConfirmDialog';
import {
  getUser,
  getAppTransactions,
  getBugReports,
  getSupportConversations,
  getPushRecipients,
  sendAdminPush,
  User,
} from '@/services/api';
import { toast } from 'sonner';

function formatDate(iso: string | undefined | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatLastActive(user: User) {
  if (!user.last_active_at) return 'No active device';
  const days = user.last_active_days;
  const date = formatDate(user.last_active_at);
  if (typeof days !== 'number') return date;
  return `${date} (${days === 0 ? 'today' : `${days}d ago`})`;
}

function getStatusBadge(status: string | undefined) {
  switch (status) {
    case 'verified':
      return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const userId = id ? parseInt(id, 10) : NaN;
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notificationTitle, setNotificationTitle] = useState('We miss you on HeySolana');
  const [notificationBody, setNotificationBody] = useState(
    'Open the app to check your wallet, swaps, and latest HeySolana updates.'
  );
  const [sendingNotification, setSendingNotification] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
    enabled: !Number.isNaN(userId),
  });

  const searchTerm = user?.wallet_address || user?.phone_number || user?.username || '';

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['user-transactions', searchTerm],
    queryFn: () => getAppTransactions({ search: searchTerm, per_page: 10 }),
    enabled: Boolean(searchTerm),
  });

  const { data: bugReportsData, isLoading: bugReportsLoading } = useQuery({
    queryKey: ['user-bug-reports', searchTerm],
    queryFn: () => getBugReports({ search: searchTerm, per_page: 10 }),
    enabled: Boolean(searchTerm),
  });

  const { data: supportData, isLoading: supportLoading } = useQuery({
    queryKey: ['user-support', searchTerm],
    queryFn: () => getSupportConversations({ search: searchTerm, per_page: 10 }),
    enabled: Boolean(searchTerm),
  });

  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['user-devices', user?.id],
    queryFn: () =>
      getPushRecipients({
        user_id: user!.id,
        active_only: false,
        per_page: 20,
      }),
    enabled: Boolean(user?.id),
  });

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleSendPush = async () => {
    if (!user?.id && !user?.phone_number) {
      toast.error('User has no linked account identity for push');
      return;
    }
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      toast.error('Notification title and message are required');
      return;
    }
    const ok = await confirm({
      title: "Send push notification?",
      description: `Send push notification to ${user.username}?`,
      confirmLabel: "Send",
    });
    if (!ok) return;

    setSendingNotification(true);
    try {
      await sendAdminPush({
        target: 'selected',
        title: notificationTitle.trim(),
        body: notificationBody.trim(),
        phone_numbers: user.phone_number ? [user.phone_number] : undefined,
        user_ids: user.id ? [user.id] : undefined,
        active_only: true,
        data: { type: 'admin_user_reminder' },
      });
    } finally {
      setSendingNotification(false);
    }
  };

  if (Number.isNaN(userId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid user ID</p>
          <Button variant="link" onClick={() => navigate('/users')} className="mt-2">
            Back to users
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
              onClick={() => navigate('/users')}
              aria-label="Back to users"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">{user.username}</h1>
                      <p className="text-sm text-muted-foreground">User ID #{user.id}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getStatusBadge(user.verification_status)}
                    {user.wallet_address ? (
                      <Badge className="bg-blue-500 hover:bg-blue-600">Has Wallet</Badge>
                    ) : (
                      <Badge variant="secondary">No Wallet</Badge>
                    )}
                    {user.pin ? (
                      <Badge className="bg-purple-500 hover:bg-purple-600">PIN Set</Badge>
                    ) : (
                      <Badge variant="secondary">No PIN</Badge>
                    )}
                    {(user.active_device_count ?? 0) > 0 && (
                      <Badge variant="outline">
                        {user.active_device_count} active device(s)
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <h1 className="text-2xl font-bold tracking-tight">User not found</h1>
              )}
            </div>
          </div>

          {!isLoading && user && (
            <div className="flex flex-wrap gap-2">
              {user.wallet_address && (
                <Button
                  variant="outline"
                  onClick={() => handleCopy(user.wallet_address, 'wallet')}
                >
                  {copiedField === 'wallet' ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy wallet
                </Button>
              )}
              {(user.active_device_count ?? 0) > 0 && (
                <Button onClick={handleSendPush} disabled={sendingNotification}>
                  <Bell className="mr-2 h-4 w-4" />
                  {sendingNotification ? 'Sending…' : 'Send push'}
                </Button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : user ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="transactions">
                <TabsList>
                  <TabsTrigger value="transactions">
                    Transactions
                    {transactionsData?.meta?.total != null && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({transactionsData.meta.total})
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="bug-reports">
                    Bug reports
                    {bugReportsData?.meta?.total != null && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({bugReportsData.meta.total})
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="support">
                    Support
                    {supportData?.meta?.total != null && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({supportData.meta.total})
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent transactions</CardTitle>
                      <CardDescription>
                        Matched by wallet, phone, or username
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {transactionsLoading ? (
                        <Skeleton className="h-24 w-full" />
                      ) : transactionsData?.data?.length ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactionsData.data.map((tx) => (
                                <TableRow key={tx.id}>
                                  <TableCell className="capitalize">
                                    <Link
                                      to={`/transaction-list/${tx.id}`}
                                      className="hover:underline"
                                    >
                                      {tx.transaction_type}
                                    </Link>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {tx.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {tx.amount != null
                                      ? `${tx.amount} ${tx.token ?? ''}`
                                      : '—'}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(tx.created_at)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No transactions found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bug-reports" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Bug reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {bugReportsLoading ? (
                        <Skeleton className="h-24 w-full" />
                      ) : bugReportsData?.data?.length ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bugReportsData.data.map((report) => (
                                <TableRow key={report.id}>
                                  <TableCell>
                                    <Link
                                      to={`/bug-reports/${report.id}`}
                                      className="font-medium hover:underline"
                                    >
                                      {report.title}
                                    </Link>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{report.severity}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{report.status}</Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(report.created_at)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No bug reports found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="support" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Support conversations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {supportLoading ? (
                        <Skeleton className="h-24 w-full" />
                      ) : supportData?.data?.length ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Preview</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last message</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {supportData.data.map((conv) => (
                                <TableRow key={conv.id}>
                                  <TableCell className="max-w-[200px] truncate">
                                    {conv.last_message_preview || '—'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {conv.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(conv.last_message_at)}
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" asChild>
                                      <Link to={`/support/${conv.id}`}>
                                        <ExternalLink className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No support conversations found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {(user.active_device_count ?? 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send push notification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                        maxLength={255}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        value={notificationBody}
                        onChange={(e) => setNotificationBody(e.target.value)}
                        rows={2}
                        maxLength={1000}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button onClick={handleSendPush} disabled={sendingNotification}>
                        <Send className="mr-2 h-4 w-4" />
                        {sendingNotification ? 'Sending…' : 'Send notification'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground">Phone</p>
                      <p>{user.phone_number || '—'}</p>
                    </div>
                    {user.phone_number && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleCopy(user.phone_number, 'phone')}
                      >
                        {copiedField === 'phone' ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground">Email</p>
                      <p className="break-all">{user.email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Wallet className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground">Wallet address</p>
                      <p className="font-mono text-xs break-all">
                        {user.wallet_address || '—'}
                      </p>
                      {user.wallet_type && (
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          Type: {user.wallet_type}
                          {user.mpc_upgraded_at && (
                            <> · MPC upgraded {formatDate(user.mpc_upgraded_at)}</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {user.country && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Country</p>
                        <p>{user.country}</p>
                      </div>
                    </div>
                  )}

                  {user.google_id && (
                    <div className="flex items-start gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Google linked</p>
                        <p className="text-xs text-muted-foreground">Account connected via Google</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Last active</p>
                    <p>{formatLastActive(user)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registered</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last updated</p>
                    <p>{formatDate(user.updated_at)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Push devices
                  </CardTitle>
                  <CardDescription>
                    Registered notification tokens for this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {devicesLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : devicesData?.recipients?.length ? (
                    <div className="space-y-3">
                      {devicesData.recipients.map((device) => (
                        <div
                          key={device.id}
                          className="flex items-center justify-between rounded-md border p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium capitalize">{device.device_type}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {device.push_token_preview}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={device.is_active ? 'default' : 'secondary'}>
                              {device.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {device.last_used_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(device.last_used_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No push devices registered</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">User not found</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserDetail;
