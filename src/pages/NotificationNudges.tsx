import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Edit, Gift, ImageIcon, Megaphone, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createNotificationNudge,
  deleteNotificationNudge,
  getNotificationNudges,
  NotificationNudge,
  NotificationNudgePayload,
  updateNotificationNudge,
} from "@/services/api";

type ActionType = "route" | "external";

interface FormState {
  is_active: boolean;
  headline: string;
  highlight: string;
  body: string;
  image_url: string;
  cta_label: string;
  action_type: ActionType;
  action_value: string;
  priority: string;
  starts_at: string;
  ends_at: string;
}

const emptyForm: FormState = {
  is_active: false,
  headline: "",
  highlight: "",
  body: "",
  image_url: "",
  cta_label: "",
  action_type: "route",
  action_value: "",
  priority: "0",
  starts_at: "",
  ends_at: "",
};

const valueOrNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const toInputDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const toLocalInputValue = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const dateFromInputValue = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

interface DateTimePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const DateTimePicker = ({ id, label, value, onChange }: DateTimePickerProps) => {
  const selectedDate = dateFromInputValue(value);
  const timeValue = value ? value.slice(11, 16) : "09:00";

  const handleDateSelect = (date?: Date) => {
    if (!date) return;
    const next = new Date(date);
    const [hours, minutes] = timeValue.split(":").map(Number);
    next.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    onChange(toLocalInputValue(next));
  };

  const handleTimeChange = (time: string) => {
    const next = selectedDate ? new Date(selectedDate) : new Date();
    const [hours, minutes] = time.split(":").map(Number);
    next.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    onChange(toLocalInputValue(next));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="grid grid-cols-[1fr_116px] gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              className="justify-start border-white/10 bg-white/5 text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-white/10 bg-black/95 p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          aria-label={`${label} time`}
          type="time"
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="bg-white/5 border-white/10"
        />
      </div>
      {value ? (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onChange("")}
        >
          Clear {label.toLowerCase()}
        </button>
      ) : null}
    </div>
  );
};

const NotificationNudges = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<NotificationNudge | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["notification-nudges"],
    queryFn: () => getNotificationNudges({ per_page: 50 }),
  });

  const activeNudge = useMemo(
    () => (data?.data ?? []).find((nudge) => nudge.enabled) ?? null,
    [data?.data]
  );

  useEffect(() => {
    if (!editing) return;
    setForm({
      is_active: editing.enabled,
      headline: editing.headline,
      highlight: editing.highlight ?? "",
      body: editing.body ?? "",
      image_url: editing.image ?? "",
      cta_label: editing.ctaLabel ?? "",
      action_type: editing.action?.type ?? "route",
      action_value:
        editing.action?.type === "route"
          ? editing.action.path
          : editing.action?.type === "external"
            ? editing.action.url
            : "",
      priority: String(editing.priority ?? 0),
      starts_at: toInputDate(editing.starts_at),
      ends_at: toInputDate(editing.ends_at),
    });
  }, [editing]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const buildPayload = (): NotificationNudgePayload => ({
    is_active: form.is_active,
    headline: form.headline.trim(),
    highlight: valueOrNull(form.highlight),
    body: valueOrNull(form.body),
    image_url: valueOrNull(form.image_url),
    cta_label: valueOrNull(form.cta_label),
    action_type: form.cta_label.trim() ? form.action_type : null,
    action_value: form.cta_label.trim() ? valueOrNull(form.action_value) : null,
    priority: Number(form.priority || 0),
    starts_at: valueOrNull(form.starts_at),
    ends_at: valueOrNull(form.ends_at),
  });

  const handleSave = async () => {
    if (!form.headline.trim()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      const result = editing
        ? await updateNotificationNudge(editing.id, payload)
        : await createNotificationNudge(payload);
      if (result) {
        resetForm();
        await queryClient.invalidateQueries({ queryKey: ["notification-nudges"] });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (nudge: NotificationNudge) => {
    if (!window.confirm(`Delete "${nudge.headline}"?`)) return;
    const deleted = await deleteNotificationNudge(nudge.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["notification-nudges"] });
      if (editing?.id === nudge.id) resetForm();
    }
  };

  const nudges = data?.data ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple/20">
              <Megaphone className="h-6 w-6 text-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notification nudges</h1>
              <p className="text-muted-foreground text-sm">
                Manage the in-app promo modal shown on the wallet dashboard.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {activeNudge ? (
          <Card className="glass-morphism border-emerald-500/30">
            <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <Badge className="mb-2 bg-emerald-500/20 text-emerald-300">Currently active</Badge>
                <p className="font-semibold">{activeNudge.headline}</p>
                <p className="text-sm text-muted-foreground">{activeNudge.campaign_key}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                The mobile app receives the highest-priority active nudge.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle>{editing ? "Edit nudge" : "Create nudge"}</CardTitle>
              <CardDescription>
                Image URL and CTA are optional. Use a route action for app screens, or external for web links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {editing ? (
                  <div className="space-y-2">
                    <Label>Campaign key</Label>
                    <div className="h-10 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-muted-foreground">
                      {editing.campaign_key}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Campaign key</Label>
                    <div className="h-10 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
                      Auto-generated after creation
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min={0}
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-white/10 p-3">
                <Checkbox
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, is_active: checked === true }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  placeholder="Shop smarter with"
                  value={form.headline}
                  onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  maxLength={160}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="highlight">Highlight</Label>
                <Input
                  id="highlight"
                  placeholder="Jumia inside HeySolana"
                  value={form.highlight}
                  onChange={(e) => setForm((f) => ({ ...f, highlight: e.target.value }))}
                  maxLength={160}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  placeholder="Discover deals and pay from your wallet without leaving the app."
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                />
              </div>

              <div className="grid md:grid-cols-[0.8fr_1fr_1.4fr] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_label">CTA label</Label>
                  <Input
                    id="cta_label"
                    placeholder="Explore deals"
                    value={form.cta_label}
                    onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action_type">Action type</Label>
                  <select
                    id="action_type"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.action_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, action_type: e.target.value as ActionType }))
                    }
                  >
                    <option value="route">App route</option>
                    <option value="external">External URL</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action_value">Action value</Label>
                  <Input
                    id="action_value"
                    placeholder={form.action_type === "route" ? "/dashboard/jumia" : "https://..."}
                    value={form.action_value}
                    onChange={(e) => setForm((f) => ({ ...f, action_value: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <DateTimePicker
                  id="starts_at"
                  label="Starts at"
                  value={form.starts_at}
                  onChange={(starts_at) => setForm((f) => ({ ...f, starts_at }))}
                />
                <DateTimePicker
                  id="ends_at"
                  label="Ends at"
                  value={form.ends_at}
                  onChange={(ends_at) => setForm((f) => ({ ...f, ends_at }))}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-purple hover:bg-purple/90"
                  onClick={handleSave}
                  disabled={saving || !form.headline.trim()}
                >
                  {editing ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {saving ? "Saving..." : editing ? "Update nudge" : "Create nudge"}
                </Button>
                {editing ? (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-white/10">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Matches the mobile wallet modal layout.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl bg-black/60 px-5 py-8 flex justify-center">
                <div className="w-full max-w-[350px]">
                  <div
                    className="overflow-hidden border shadow-lg"
                    style={{ borderRadius: 30, backgroundColor: "#ffffff", borderColor: "#EEF2F2" }}
                  >
                    {form.image_url.trim() ? (
                      <img
                        src={form.image_url}
                        alt=""
                        className="w-full object-cover"
                        style={{
                          height: 190,
                          borderTopLeftRadius: 30,
                          borderTopRightRadius: 30,
                        }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center px-6 pt-8 pb-2"
                        style={{
                          height: 110,
                          backgroundColor: "#F1FFFA",
                          borderTopLeftRadius: 30,
                          borderTopRightRadius: 30,
                        }}
                      >
                        <div className="h-20 w-20 rounded-full bg-[#1BB296]/15 flex items-center justify-center">
                          <div className="h-14 w-14 rounded-full bg-[#1BB296] flex items-center justify-center">
                            <Gift className="h-[26px] w-[26px] text-white" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={`px-6 pb-6 text-center ${form.image_url.trim() ? "pt-5" : "pt-4"}`}>
                      <h3 className="pt-3 text-[20px] leading-7 font-bold text-[#0C0C0C]">
                        {form.headline || "Promo headline"}
                      </h3>
                      {form.highlight ? (
                        <p className="mb-3 text-[20px] leading-9 font-bold text-[#1BB296]">
                          {form.highlight}
                        </p>
                      ) : null}
                      {form.body ? (
                        <p className="mb-6 text-[0.95rem] leading-5 text-[#6B7280]">
                          {form.body}
                        </p>
                      ) : (
                        <div className="mb-5" />
                      )}
                      {form.cta_label ? (
                        <div className="w-full rounded-full bg-purple py-4 text-center font-bold text-white">
                          {form.cta_label}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className="mx-auto mt-4 flex h-11 w-11 items-center justify-center rounded-full border"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.20)",
                      borderColor: "rgba(255,255,255,0.55)",
                    }}
                  >
                    <X className="h-[22px] w-[22px] text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-morphism border-white/10">
          <CardHeader>
            <CardTitle>All nudges</CardTitle>
            <CardDescription>
              Keep only the campaign you want to show active, or use priority to choose between active campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Media</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nudges.map((nudge) => (
                    <TableRow key={nudge.id}>
                      <TableCell>
                        <div className="font-medium">{nudge.headline}</div>
                        <div className="text-xs text-muted-foreground">{nudge.campaign_key}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={nudge.enabled ? "default" : "outline"}>
                          {nudge.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{nudge.priority}</TableCell>
                      <TableCell>
                        {nudge.image ? (
                          <Badge variant="outline">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Image
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No image</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {nudge.updated_at ? new Date(nudge.updated_at).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditing(nudge)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(nudge)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {nudges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No nudges yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationNudges;
