import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AppRegistration,
  AppRegistrationPayload,
  AppRegistrationStatus,
  AppToolDefinition,
  AppVisibility,
} from "@/services/api";

interface FormState {
  slug: string;
  name: string;
  category: string;
  short_description: string;
  description: string;
  website_url: string;
  tutorial_url: string;
  dashboard_route: string;
  icon_url: string;
  banner_url: string;
  tags: string;
  description_images: string;
  capability_ids: string;
  brand_primary: string;
  brand_secondary: string;
  tools_json: string;
  status: AppRegistrationStatus;
  visibility: AppVisibility;
  beta_allowlist: string;
  is_featured: boolean;
  is_new: boolean;
  sort_order: string;
  ratings: string;
  minimum_client_version: string;
  platforms: string;
}

const emptyForm: FormState = {
  slug: "",
  name: "",
  category: "Tools",
  short_description: "",
  description: "",
  website_url: "",
  tutorial_url: "",
  dashboard_route: "",
  icon_url: "",
  banner_url: "",
  tags: "",
  description_images: "",
  capability_ids: "",
  brand_primary: "",
  brand_secondary: "",
  tools_json: "[]",
  status: "draft",
  visibility: "public",
  beta_allowlist: "",
  is_featured: false,
  is_new: true,
  sort_order: "0",
  ratings: "0",
  minimum_client_version: "",
  platforms: "ios,android",
};

const valueOrNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const csvToList = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

const linesToList = (value: string) =>
  value
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const appToForm = (app?: AppRegistration | null): FormState => {
  if (!app) return emptyForm;
  return {
    slug: app.slug ?? "",
    name: app.name ?? "",
    category: app.category ?? "Tools",
    short_description: app.short_description ?? "",
    description: app.description ?? "",
    website_url: app.website_url ?? "",
    tutorial_url: app.tutorial_url ?? "",
    dashboard_route: app.dashboard_route ?? "",
    icon_url: app.icon_url ?? "",
    banner_url: app.banner_url ?? "",
    tags: (app.tags ?? []).join(", "),
    description_images: (app.description_images ?? []).join("\n"),
    capability_ids: (app.capability_ids ?? []).join(", "),
    brand_primary: app.brand_colors?.primary ?? "",
    brand_secondary: app.brand_colors?.secondary ?? "",
    tools_json: JSON.stringify(app.tools ?? [], null, 2),
    status: app.status ?? "draft",
    visibility: app.visibility === "beta" ? "beta" : "public",
    beta_allowlist: (app.beta_allowlist ?? []).join("\n"),
    is_featured: !!app.is_featured,
    is_new: !!app.is_new,
    sort_order: String(app.sort_order ?? 0),
    ratings: String(app.ratings ?? 0),
    minimum_client_version: app.minimum_client_version ?? "",
    platforms: (app.platforms ?? ["ios", "android"]).join(","),
  };
};

interface AppEditorProps {
  app?: AppRegistration | null;
  saving?: boolean;
  submitLabel?: string;
  onSubmit: (payload: AppRegistrationPayload) => Promise<void> | void;
  onUploadAsset?: (kind: "icon" | "banner", file: File) => Promise<void> | void;
  uploadingAsset?: boolean;
}

export const AppEditor = ({
  app,
  saving = false,
  submitLabel = "Save",
  onSubmit,
  onUploadAsset,
  uploadingAsset = false,
}: AppEditorProps) => {
  const [form, setForm] = useState<FormState>(() => appToForm(app));

  useEffect(() => {
    setForm(appToForm(app));
  }, [app]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Category is required");
      return;
    }
    if (form.website_url.trim() && !isValidUrl(form.website_url.trim())) {
      toast.error("Website URL must be a valid http(s) URL");
      return;
    }
    if (form.icon_url.trim() && !isValidUrl(form.icon_url.trim())) {
      toast.error("Icon URL must be a valid http(s) URL");
      return;
    }
    if (form.banner_url.trim() && !isValidUrl(form.banner_url.trim())) {
      toast.error("Banner URL must be a valid http(s) URL");
      return;
    }

    let tools: AppToolDefinition[] = [];
    try {
      const parsed = JSON.parse(form.tools_json || "[]");
      if (!Array.isArray(parsed)) {
        throw new Error("Tools must be a JSON array");
      }
      tools = parsed;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid tools JSON");
      return;
    }

    const brandColors =
      form.brand_primary.trim() || form.brand_secondary.trim()
        ? {
            ...(form.brand_primary.trim() ? { primary: form.brand_primary.trim() } : {}),
            ...(form.brand_secondary.trim() ? { secondary: form.brand_secondary.trim() } : {}),
          }
        : null;

    const payload: AppRegistrationPayload = {
      slug: valueOrNull(form.slug) ?? undefined,
      name: form.name.trim(),
      category: form.category.trim(),
      short_description: valueOrNull(form.short_description),
      description: valueOrNull(form.description),
      website_url: valueOrNull(form.website_url),
      tutorial_url: valueOrNull(form.tutorial_url),
      dashboard_route: valueOrNull(form.dashboard_route),
      icon_url: valueOrNull(form.icon_url),
      banner_url: valueOrNull(form.banner_url),
      tags: csvToList(form.tags),
      description_images: linesToList(form.description_images),
      capability_ids: csvToList(form.capability_ids),
      brand_colors: brandColors,
      tools,
      status: form.status,
      visibility: form.visibility,
      beta_allowlist: linesToList(form.beta_allowlist),
      is_featured: form.is_featured,
      is_new: form.is_new,
      sort_order: Number.parseInt(form.sort_order || "0", 10) || 0,
      ratings: Number.parseFloat(form.ratings || "0") || 0,
      minimum_client_version: valueOrNull(form.minimum_client_version),
      platforms: csvToList(form.platforms),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle>Catalog metadata</CardTitle>
          <CardDescription>
            Serializable discovery fields shown in the wallet app store. Executable handlers stay in
            the mobile client.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (stable ID)</Label>
            <Input
              id="slug"
              value={form.slug}
              placeholder="auto from name if empty"
              onChange={(e) => update("slug", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => update("status", e.target.value as AppRegistrationStatus)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.visibility}
              onChange={(e) => update("visibility", e.target.value as AppVisibility)}
            >
              <option value="public">Public (everyone)</option>
              <option value="beta">Beta (allowlist only)</option>
            </select>
          </div>
          {form.visibility === "beta" ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="beta_allowlist">Beta allowlist</Label>
              <Textarea
                id="beta_allowlist"
                rows={5}
                className="font-mono text-xs"
                placeholder={"One per line: wallet address, email, or phone\nExampleWallet111...\nqa@heysolana.com\n+2348012345678"}
                value={form.beta_allowlist}
                onChange={(e) => update("beta_allowlist", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Published beta apps only appear for matching wallets, emails, or phones. Matching is
                case-insensitive.
              </p>
            </div>
          ) : null}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="short_description">Short description</Label>
            <Input
              id="short_description"
              value={form.short_description}
              onChange={(e) => update("short_description", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Full description</Label>
            <Textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              value={form.website_url}
              onChange={(e) => update("website_url", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dashboard_route">Dashboard route</Label>
            <Input
              id="dashboard_route"
              placeholder="/dashboard/airbills"
              value={form.dashboard_route}
              onChange={(e) => update("dashboard_route", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tutorial_url">Tutorial / setup notes</Label>
            <Textarea
              id="tutorial_url"
              rows={3}
              value={form.tutorial_url}
              onChange={(e) => update("tutorial_url", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle>Media & branding</CardTitle>
          <CardDescription>Use HTTPS URLs or upload assets after the app is created.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="icon_url">Icon URL</Label>
            <Input
              id="icon_url"
              value={form.icon_url}
              onChange={(e) => update("icon_url", e.target.value)}
            />
            {form.icon_url ? (
              <img src={form.icon_url} alt="Icon preview" className="mt-2 h-16 w-16 rounded-xl object-cover" />
            ) : null}
            {app && onUploadAsset ? (
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingAsset}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUploadAsset("icon", file);
                }}
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner_url">Banner URL</Label>
            <Input
              id="banner_url"
              value={form.banner_url}
              onChange={(e) => update("banner_url", e.target.value)}
            />
            {form.banner_url ? (
              <img
                src={form.banner_url}
                alt="Banner preview"
                className="mt-2 h-24 w-full rounded-xl object-cover"
              />
            ) : null}
            {app && onUploadAsset ? (
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingAsset}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUploadAsset("banner", file);
                }}
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand_primary">Primary color</Label>
            <Input
              id="brand_primary"
              placeholder="#7B5CFF"
              value={form.brand_primary}
              onChange={(e) => update("brand_primary", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand_secondary">Secondary color</Label>
            <Input
              id="brand_secondary"
              placeholder="#0A1825"
              value={form.brand_secondary}
              onChange={(e) => update("brand_secondary", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description_images">Description image URLs (one per line)</Label>
            <Textarea
              id="description_images"
              rows={3}
              value={form.description_images}
              onChange={(e) => update("description_images", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism border-white/10">
        <CardHeader>
          <CardTitle>Flags, capabilities & tools</CardTitle>
          <CardDescription>
            Capability IDs must match compiled wallet handlers. Tools JSON is settings schema only —
            no executable URLs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capability_ids">Capability IDs (comma separated)</Label>
            <Input
              id="capability_ids"
              placeholder="chowdeck, airbills"
              value={form.capability_ids}
              onChange={(e) => update("capability_ids", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort order</Label>
            <Input
              id="sort_order"
              type="number"
              value={form.sort_order}
              onChange={(e) => update("sort_order", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ratings">
              Ratings {app ? "(seed until reviews exist)" : "(initial seed)"}
            </Label>
            <Input
              id="ratings"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.ratings}
              onChange={(e) => update("ratings", e.target.value)}
            />
            {app ? (
              <p className="text-xs text-muted-foreground">
                Live: {Number(app.ratings ?? 0).toFixed(1)} avg · {app.review_count ?? 0} reviews ·{" "}
                {app.user_count ?? 0} installs
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="minimum_client_version">Minimum client version</Label>
            <Input
              id="minimum_client_version"
              placeholder="1.2.0"
              value={form.minimum_client_version}
              onChange={(e) => update("minimum_client_version", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platforms">Platforms</Label>
            <Input
              id="platforms"
              placeholder="ios,android"
              value={form.platforms}
              onChange={(e) => update("platforms", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-6 md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_featured}
                onCheckedChange={(checked) => update("is_featured", checked === true)}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_new}
                onCheckedChange={(checked) => update("is_new", checked === true)}
              />
              New
            </label>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tools_json">Tools JSON</Label>
            <Textarea
              id="tools_json"
              rows={12}
              className="font-mono text-xs"
              value={form.tools_json}
              onChange={(e) => update("tools_json", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="bg-purple hover:bg-purple/90">
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};
