import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Percent, Wallet, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  getProcessingFeeSettings,
  updateProcessingFeeSettings,
} from '@/services/api';

const Settings = () => {
  const queryClient = useQueryClient();
  const [percent, setPercent] = useState('');
  const [fixedNgn, setFixedNgn] = useState('');
  const [fixedUsd, setFixedUsd] = useState('');
  const [treasury, setTreasury] = useState('');
  const [deliveryFeeJumiaNgn, setDeliveryFeeJumiaNgn] = useState('');
  const [deliveryFeeCrossmintUsd, setDeliveryFeeCrossmintUsd] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['processing-fee-settings'],
    queryFn: getProcessingFeeSettings,
  });

  React.useEffect(() => {
    if (settings) {
      setPercent(settings.processing_fee_percent ?? '');
      setFixedNgn(settings.processing_fee_fixed_ngn ?? '');
      setFixedUsd(settings.processing_fee_fixed_usd ?? '');
      setTreasury(settings.treasury_wallet_address ?? '');
      setDeliveryFeeJumiaNgn(settings.delivery_fee_jumia_ngn ?? '');
      setDeliveryFeeCrossmintUsd(settings.delivery_fee_crossmint_usd ?? '');
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProcessingFeeSettings({
      processing_fee_percent: percent === '' ? undefined : Number(percent),
      processing_fee_fixed_ngn: fixedNgn === '' ? undefined : Number(fixedNgn),
      processing_fee_fixed_usd: fixedUsd === '' ? undefined : Number(fixedUsd),
      treasury_wallet_address: treasury.trim() === '' ? undefined : treasury.trim(),
      delivery_fee_jumia_ngn: deliveryFeeJumiaNgn === '' ? undefined : Number(deliveryFeeJumiaNgn),
      delivery_fee_crossmint_usd: deliveryFeeCrossmintUsd === '' ? undefined : Number(deliveryFeeCrossmintUsd),
    });
    setSaving(false);
    if (result) {
      queryClient.setQueryData(['processing-fee-settings'], result);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure processing fees and the single treasury wallet used for all fees and payments (Jumia USDC, Crossmint, etc.)
          </p>
        </div>

        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Treasury wallet
            </CardTitle>
            <CardDescription>
              Solana wallet address that receives all fee and payment flows (USDC for Jumia orders, etc.). The wallet app fetches this to send payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full max-w-md" />
            ) : (
              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="treasury">Treasury wallet address</Label>
                  <Input
                    id="treasury"
                    type="text"
                    placeholder="e.g. 13dqNw1su2UTYPVvqP6ahV8oHtghvoe2k2czkrx9uWJZ"
                    value={treasury}
                    onChange={(e) => setTreasury(e.target.value)}
                    className="bg-white/5 border-white/10 font-mono text-sm"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-fit">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save all settings'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery fee
            </CardTitle>
            <CardDescription>
              Fixed delivery fee shown and charged per order. Separate for Jumia (NGN) and Crossmint/Amazon (USD). Shown to the user as part of the total item price and in the purchase summary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="grid gap-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="delivery-jumia">Delivery fee (NGN) – Jumia</Label>
                  <Input
                    id="delivery-jumia"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={deliveryFeeJumiaNgn}
                    onChange={(e) => setDeliveryFeeJumiaNgn(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-crossmint">Delivery fee (USD) – Crossmint / Amazon</Label>
                  <Input
                    id="delivery-crossmint"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0"
                    value={deliveryFeeCrossmintUsd}
                    onChange={(e) => setDeliveryFeeCrossmintUsd(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-fit">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save all settings'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/30 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Processing fee
            </CardTitle>
            <CardDescription>
              These values are applied when deducting from user accounts. Use fixed NGN for Jumia orders, fixed USD for Crossmint/Amazon. Percent applies to the order total.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="grid gap-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="fee-percent">Fee percent (%)</Label>
                  <Input
                    id="fee-percent"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="0"
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-ngn">Fixed fee (NGN) – e.g. Jumia</Label>
                  <Input
                    id="fee-ngn"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={fixedNgn}
                    onChange={(e) => setFixedNgn(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-usd">Fixed fee (USD) – e.g. Crossmint/Amazon</Label>
                  <Input
                    id="fee-usd"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0"
                    value={fixedUsd}
                    onChange={(e) => setFixedUsd(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-fit">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save all settings'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
