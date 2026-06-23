import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ScheduledPushCampaign,
  ScheduledPushCampaignPayload,
  ScheduledPushScheduleType,
  ScheduledPushTarget,
} from "@/services/api";

const WEEKDAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

interface FormState {
  name: string;
  is_active: boolean;
  title: string;
  body: string;
  link: string;
  schedule_type: ScheduledPushScheduleType;
  schedule_time: string;
  schedule_day: string;
  interval_minutes: string;
  target: ScheduledPushTarget;
  device_type: "all" | "ios" | "android";
  inactive_days: string;
  search: string;
  cooldown_hours: string;
  max_recipients_per_run: string;
  starts_at: string;
  ends_at: string;
}

const emptyForm: FormState = {
  name: "",
  is_active: false,
  title: "",
  body: "",
  link: "/dashboard",
  schedule_type: "daily",
  schedule_time: "09:00",
  schedule_day: "1",
  interval_minutes: "1440",
  target: "all",
  device_type: "all",
  inactive_days: "30",
  search: "",
  cooldown_hours: "24",
  max_recipients_per_run: "500",
  starts_at: "",
  ends_at: "",
};

const toInputDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const dateValueOrNull = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const buildInitialForm = (campaign?: ScheduledPushCampaign | null): FormState => {
  if (!campaign) return emptyForm;
  return {
    name: campaign.name,
    is_active: campaign.is_active,
    title: campaign.title,
    body: campaign.body,
    link: campaign.link ?? "",
    schedule_type: campaign.schedule_type,
    schedule_time: campaign.schedule_time ?? "09:00",
    schedule_day: String(campaign.schedule_day ?? 1),
    interval_minutes: String(campaign.interval_minutes ?? 1440),
    target: campaign.target,
    device_type: campaign.device_type ?? "all",
    inactive_days: String(campaign.inactive_days ?? 30),
    search: campaign.search ?? "",
    cooldown_hours: String(campaign.cooldown_hours ?? 24),
    max_recipients_per_run: String(campaign.max_recipients_per_run ?? 500),
    starts_at: toInputDate(campaign.starts_at),
    ends_at: toInputDate(campaign.ends_at),
  };
};

const formToPayload = (form: FormState): ScheduledPushCampaignPayload => ({
  name: form.name.trim(),
  is_active: form.is_active,
  title: form.title.trim(),
  body: form.body.trim(),
  link: form.link.trim() || null,
  schedule_type: form.schedule_type,
  schedule_time: form.schedule_type === "interval" ? null : form.schedule_time,
  schedule_day:
    form.schedule_type === "weekly" ? Number.parseInt(form.schedule_day, 10) : null,
  interval_minutes:
    form.schedule_type === "interval" ? Number.parseInt(form.interval_minutes, 10) : null,
  target: form.target,
  device_type: form.device_type === "all" ? null : form.device_type,
  inactive_days: form.target === "inactive" ? Number.parseInt(form.inactive_days, 10) : null,
  search: form.target === "filtered" ? form.search.trim() || null : null,
  cooldown_hours: Number.parseInt(form.cooldown_hours, 10),
  max_recipients_per_run: Number.parseInt(form.max_recipients_per_run, 10),
  starts_at: dateValueOrNull(form.starts_at),
  ends_at: dateValueOrNull(form.ends_at),
});

type Props = {
  campaign?: ScheduledPushCampaign | null;
  saving?: boolean;
  submitLabel?: string;
  onSubmit: (payload: ScheduledPushCampaignPayload) => void | Promise<void>;
  onCancel?: () => void;
};

export const ScheduledPushEditor: React.FC<Props> = ({
  campaign,
  saving = false,
  submitLabel = "Save campaign",
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(campaign));

  useEffect(() => {
    setForm(buildInitialForm(campaign));
  }, [campaign]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void onSubmit(formToPayload(form));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Campaign details</CardTitle>
          <CardDescription>Name and push content shown on the device.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Campaign name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Weekly check-in"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Push title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link">Deep link (optional)</Label>
            <Input
              id="link"
              value={form.link}
              onChange={(e) => update("link", e.target.value)}
              placeholder="/dashboard"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="body">Push body</Label>
            <Textarea
              id="body"
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Checkbox
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(checked) => update("is_active", checked === true)}
            />
            <Label htmlFor="is_active">Active (will send on schedule when due)</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>When this campaign should run automatically.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={form.schedule_type}
              onValueChange={(v) => update("schedule_type", v as ScheduledPushScheduleType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="interval">Every N minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.schedule_type === "interval" ? (
            <div className="space-y-2">
              <Label htmlFor="interval_minutes">Interval (minutes)</Label>
              <Input
                id="interval_minutes"
                type="number"
                min={1}
                value={form.interval_minutes}
                onChange={(e) => update("interval_minutes", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">1440 = once per day</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="schedule_time">Time (24h)</Label>
                <Input
                  id="schedule_time"
                  type="time"
                  value={form.schedule_time}
                  onChange={(e) => update("schedule_time", e.target.value)}
                  required
                />
              </div>
              {form.schedule_type === "weekly" ? (
                <div className="space-y-2">
                  <Label>Day of week</Label>
                  <Select value={form.schedule_day} onValueChange={(v) => update("schedule_day", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Audience</CardTitle>
          <CardDescription>Who receives this push when the campaign runs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Target</Label>
            <Select
              value={form.target}
              onValueChange={(v) => update("target", v as ScheduledPushTarget)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All registered devices</SelectItem>
                <SelectItem value="inactive">Inactive users</SelectItem>
                <SelectItem value="filtered">Filtered search</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Device type</Label>
            <Select
              value={form.device_type}
              onValueChange={(v) => update("device_type", v as FormState["device_type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="ios">iOS only</SelectItem>
                <SelectItem value="android">Android only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.target === "inactive" ? (
            <div className="space-y-2">
              <Label htmlFor="inactive_days">Inactive for (days)</Label>
              <Input
                id="inactive_days"
                type="number"
                min={1}
                value={form.inactive_days}
                onChange={(e) => update("inactive_days", e.target.value)}
              />
            </div>
          ) : null}
          {form.target === "filtered" ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Search (phone, username, wallet)</Label>
              <Input
                id="search"
                value={form.search}
                onChange={(e) => update("search", e.target.value)}
                placeholder="e.g. +234 or username"
                required
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="cooldown_hours">Cooldown per user (hours)</Label>
            <Input
              id="cooldown_hours"
              type="number"
              min={0}
              value={form.cooldown_hours}
              onChange={(e) => update("cooldown_hours", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_recipients">Max users per run</Label>
            <Input
              id="max_recipients"
              type="number"
              min={1}
              value={form.max_recipients_per_run}
              onChange={(e) => update("max_recipients_per_run", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Campaign window (optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Starts at</Label>
            <Input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => update("starts_at", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ends at</Label>
            <Input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => update("ends_at", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export const ScheduledPushStatsCards = ({ campaign }: { campaign: ScheduledPushCampaign }) => (
  <div className="grid gap-4 md:grid-cols-4">
    <Card className="border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Total sends</CardDescription>
        <CardTitle className="text-2xl">{campaign.stats?.total_sends ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Unique users</CardDescription>
        <CardTitle className="text-2xl">{campaign.stats?.unique_users ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Devices reached</CardDescription>
        <CardTitle className="text-2xl">{campaign.stats?.total_devices ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Next run</CardDescription>
        <CardTitle className="text-base font-medium">
          {campaign.next_run_at
            ? format(new Date(campaign.next_run_at), "MMM d, yyyy HH:mm")
            : "—"}
        </CardTitle>
      </CardHeader>
    </Card>
  </div>
);
