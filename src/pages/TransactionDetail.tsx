import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  ReceiptText,
  User,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getAppTransaction, type AppTransaction } from '@/services/api';
import { toast } from 'sonner';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function titleCase(value: string | null | undefined) {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTokenAmount(
  amount: string | number | null | undefined,
  token: string | null | undefined
) {
  if (amount == null || amount === '') return '—';
  const formatted = Number(amount).toLocaleString(undefined, { maximumFractionDigits: 8 });
  return token ? `${formatted} ${token}` : formatted;
}

function formatUsd(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return amount > 0 ? currency.format(amount) : '—';
}

function formatLamports(lamports: number | null | undefined) {
  if (lamports == null) return '—';
  return `${(lamports / 1_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 9 })} SOL`;
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'submitted':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getExplorerUrl(tx: AppTransaction) {
  if (!tx.signature) return null;
  const clusterParam = tx.cluster === 'devnet' ? '?cluster=devnet' : '';
  return `https://solscan.io/tx/${tx.signature}${clusterParam}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="text-sm mt-0.5 break-all">{value}</div>
    </div>
  );
}

const TransactionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const transactionId = id ? parseInt(id, 10) : NaN;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['app-transaction', transactionId],
    queryFn: () => getAppTransaction(transactionId),
    enabled: !Number.isNaN(transactionId),
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

  const explorerUrl = transaction ? getExplorerUrl(transaction) : null;

  if (Number.isNaN(transactionId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid transaction ID</p>
          <Button variant="link" onClick={() => navigate('/transaction-list')} className="mt-2">
            Back to transactions
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
              onClick={() => navigate('/transaction-list')}
              aria-label="Back to transactions"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : transaction ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white">
                      <ReceiptText className="h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">
                        {titleCase(transaction.transaction_type)}
                      </h1>
                      <p className="text-sm text-muted-foreground">Transaction #{transaction.id}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant={getStatusBadgeVariant(transaction.status)}>
                      {titleCase(transaction.status)}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {transaction.cluster}
                    </Badge>
                    {transaction.provider && (
                      <Badge variant="outline">{titleCase(transaction.provider)}</Badge>
                    )}
                  </div>
                </>
              ) : (
                <h1 className="text-2xl font-bold tracking-tight">Transaction not found</h1>
              )}
            </div>
          </div>

          {!isLoading && transaction && explorerUrl && (
            <Button asChild variant="outline">
              <a href={explorerUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Solscan
              </a>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : transaction ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-black/30 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">Amounts</CardTitle>
                  <CardDescription>Input, output, and fee breakdown</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <DetailRow
                    label="Input"
                    value={formatTokenAmount(
                      transaction.input_amount ?? transaction.amount,
                      transaction.input_token_symbol ?? transaction.token
                    )}
                  />
                  <DetailRow label="Input (USD)" value={formatUsd(transaction.input_amount_usd)} />
                  <DetailRow
                    label="Output"
                    value={formatTokenAmount(
                      transaction.output_amount,
                      transaction.output_token_symbol
                    )}
                  />
                  <DetailRow label="Output (USD)" value={formatUsd(transaction.output_amount_usd)} />
                  <DetailRow
                    label="Platform fee"
                    value={formatTokenAmount(
                      transaction.platform_fee_amount,
                      transaction.platform_fee_token
                    )}
                  />
                  <DetailRow label="Platform fee (USD)" value={formatUsd(transaction.platform_fee_usd)} />
                  <DetailRow
                    label="Network fee"
                    value={formatLamports(transaction.network_fee_lamports)}
                  />
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">On-chain details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <DetailRow label="Signature" value={
                      <span className="font-mono text-xs">{transaction.signature || '—'}</span>
                    } />
                    {transaction.signature && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => handleCopy(transaction.signature!, 'signature')}
                      >
                        {copiedField === 'signature' ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <DetailRow
                    label="Client reference"
                    value={<span className="font-mono text-xs">{transaction.client_reference || '—'}</span>}
                  />
                  <DetailRow
                    label="Recipient"
                    value={<span className="font-mono text-xs">{transaction.recipient_address || '—'}</span>}
                  />
                  <DetailRow label="App called" value={transaction.app_called || '—'} />
                  {transaction.input_token_mint && (
                    <DetailRow
                      label="Input token mint"
                      value={<span className="font-mono text-xs">{transaction.input_token_mint}</span>}
                    />
                  )}
                  {transaction.output_token_mint && (
                    <DetailRow
                      label="Output token mint"
                      value={<span className="font-mono text-xs">{transaction.output_token_mint}</span>}
                    />
                  )}
                </CardContent>
              </Card>

              {transaction.raw_metadata && Object.keys(transaction.raw_metadata).length > 0 && (
                <Card className="bg-black/30 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/50 rounded-md p-4 overflow-x-auto">
                      {JSON.stringify(transaction.raw_metadata, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="bg-black/30 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <DetailRow
                    label="Username"
                    value={transaction.username || '—'}
                  />
                  <DetailRow
                    label="Phone"
                    value={transaction.mobile_number || '—'}
                  />
                  <div className="flex items-start gap-3">
                    <Wallet className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground text-xs">Wallet</p>
                      <p className="font-mono text-xs break-all mt-0.5">
                        {transaction.wallet_address}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => handleCopy(transaction.wallet_address, 'wallet')}
                    >
                      {copiedField === 'wallet' ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/users?search=${encodeURIComponent(transaction.wallet_address)}`}>
                      Find user by wallet
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <DetailRow label="Created" value={formatDate(transaction.created_at)} />
                  <DetailRow label="Confirmed" value={formatDate(transaction.confirmed_at)} />
                  <DetailRow label="Last updated" value={formatDate(transaction.updated_at)} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Transaction not found</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TransactionDetail;
