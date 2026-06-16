import React, { useEffect, useState } from "react";
import { CalendarIcon, Edit, Gift, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { NotificationNudge, NotificationNudgePayload } from "@/services/api";

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

const dateValueOrNull = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
            <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
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

const buildInitialForm = (nudge?: NotificationNudge | null): FormState => {
  if (!nudge) return emptyForm;

  return {
    is_active: nudge.enabled,
    headline: nudge.headline,
    highlight: nudge.highlight ?? "",
    body: nudge.body ?? "",
    image_url: nudge.image ?? "",
    cta_label: nudge.ctaLabel ?? "",
    action_type: nudge.action?.type ?? "route",
    action_value:
      nudge.action?.type === "route"
        ? nudge.action.path
        : nudge.action?.type === "external"
          ? nudge.action.url
          : "",
    priority: String(nudge.priority ?? 0),
    starts_at: toInputDate(nudge.starts_at),
    ends_at: toInputDate(nudge.ends_at),
  };
};

const buildPayload = (form: FormState): NotificationNudgePayload => ({
  is_active: form.is_active,
  headline: form.headline.trim(),
  highlight: valueOrNull(form.highlight),
  body: valueOrNull(form.body),
  image_url: valueOrNull(form.image_url),
  cta_label: valueOrNull(form.cta_label),
  action_type: form.cta_label.trim() ? form.action_type : null,
  action_value: form.cta_label.trim() ? valueOrNull(form.action_value) : null,
  priority: Number(form.priority || 0),
  starts_at: dateValueOrNull(form.starts_at),
  ends_at: dateValueOrNull(form.ends_at),
});

const validateForm = (form: FormState) => {
  if (!form.headline.trim()) return false;
  if (form.image_url.trim() && !isValidUrl(form.image_url.trim())) {
    toast.error("Image URL must start with http:// or https://");
    return false;
  }
  if (form.cta_label.trim() && !form.action_value.trim()) {
    toast.error("Add an action value for the CTA, or remove the CTA label");
    return false;
  }
  if (form.cta_label.trim() && form.action_type === "external" && !isValidUrl(form.action_value.trim())) {
    toast.error("External CTA action must be a valid http:// or https:// URL");
    return false;
  }
  if (form.cta_label.trim() && form.action_type === "route" && !form.action_value.trim().startsWith("/")) {
    toast.error("App route CTA action should start with /");
    return false;
  }
  if (form.starts_at && form.ends_at && new Date(form.ends_at) < new Date(form.starts_at)) {
    toast.error("Ends at must be after Starts at");
    return false;
  }
  return true;
};

export const NudgeStatsCards = ({ nudge }: { nudge: NotificationNudge }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Shown</CardDescription>
        <CardTitle>{nudge.stats?.shown ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Unique viewers</CardDescription>
        <CardTitle>{nudge.stats?.unique_viewers ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>CTA clicks</CardDescription>
        <CardTitle>{nudge.stats?.cta_clicks ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>CTR</CardDescription>
        <CardTitle>{nudge.stats?.cta_rate ?? 0}%</CardTitle>
      </CardHeader>
    </Card>
  </div>
);

const NudgePreview = ({ form }: { form: FormState }) => (
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
            style={{ height: 190, borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
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
            <p className="mb-3 text-[20px] leading-9 font-bold text-[#1BB296]">{form.highlight}</p>
          ) : null}
          {form.body ? <p className="mb-6 text-[0.95rem] leading-5 text-[#6B7280]">{form.body}</p> : <div className="mb-5" />}
          {form.cta_label ? (
            <div className="w-full rounded-full bg-purple py-4 text-center font-bold text-white">{form.cta_label}</div>
          ) : null}
        </div>
      </div>

      <div
        className="mx-auto mt-4 flex h-11 w-11 items-center justify-center rounded-full border"
        style={{ backgroundColor: "rgba(0,0,0,0.20)", borderColor: "rgba(255,255,255,0.55)" }}
      >
        <X className="h-[22px] w-[22px] text-white" />
      </div>
    </div>
  </div>
);

interface NotificationNudgeEditorProps {
  nudge?: NotificationNudge | null;
  saving?: boolean;
  submitLabel?: string;
  onSubmit: (payload: NotificationNudgePayload) => Promise<void> | void;
  onCancel?: () => void;
}

export const NotificationNudgeEditor = ({
  nudge,
  saving = false,
  submitLabel,
  onSubmit,
  onCancel,
}: NotificationNudgeEditorProps) => {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(nudge));

  useEffect(() => {
    setForm(buildInitialForm(nudge));
  }, [nudge]);

  const handleSubmit = async () => {
    if (!validateForm(form)) return;
    await onSubmit(buildPayload(form));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle>{nudge ? "Edit nudge" : "Create nudge"}</CardTitle>
          <CardDescription>
            Image URL and CTA are optional. Use a route action for app screens, or external for web links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign key</Label>
              <div className="h-10 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
                {nudge?.campaign_key ?? "Auto-generated after creation"}
              </div>
            </div>
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
              onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked === true }))}
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
                onChange={(e) => setForm((f) => ({ ...f, action_type: e.target.value as ActionType }))}
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
            <Button className="bg-purple hover:bg-purple/90" onClick={handleSubmit} disabled={saving || !form.headline.trim()}>
              {nudge ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : submitLabel ?? (nudge ? "Update nudge" : "Create nudge")}
            </Button>
            {onCancel ? (
              <Button variant="outline" onClick={onCancel}>
                Cancel
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
          <NudgePreview form={form} />
        </CardContent>
      </Card>
    </div>
  );
};
