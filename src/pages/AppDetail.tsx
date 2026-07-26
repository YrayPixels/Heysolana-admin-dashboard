import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, Rocket, Trash2 } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AppRegistrationPayload,
  deleteAppRegistration,
  disableAppRegistration,
  getAppRegistration,
  publishAppRegistration,
  updateAppRegistration,
  uploadAppRegistrationAsset,
} from "@/services/api";
import { AppEditor } from "@/components/apps/AppEditor";

const AppDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const appId = id ? Number.parseInt(id, 10) : NaN;

  const { data, isLoading } = useQuery({
    queryKey: ["app-registration", appId],
    queryFn: () => getAppRegistration(appId),
    enabled: !Number.isNaN(appId),
  });

  const app = data?.data;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["app-registration", appId] });
    await queryClient.invalidateQueries({ queryKey: ["app-registrations"] });
  };

  const handleUpdate = async (payload: AppRegistrationPayload) => {
    if (!app) return;
    setSaving(true);
    try {
      const result = await updateAppRegistration(app.id, payload);
      if (result) await invalidate();
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (kind: "icon" | "banner", file: File) => {
    if (!app) return;
    setUploading(true);
    try {
      const result = await uploadAppRegistrationAsset(app.id, kind, file);
      if (result) await invalidate();
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!app) return;
    const result = await publishAppRegistration(app.id);
    if (result) await invalidate();
  };

  const handleDisable = async () => {
    if (!app) return;
    const ok = await confirm({
      title: "Disable app?",
      description: `Disable "${app.name}"? It will disappear from the wallet catalog.`,
      confirmLabel: "Disable",
      variant: "destructive",
    });
    if (!ok) return;
    const result = await disableAppRegistration(app.id);
    if (result) await invalidate();
  };

  const handleDelete = async () => {
    if (!app) return;
    const ok = await confirm({
      title: "Delete app registration?",
      description: `Delete "${app.name}" (${app.slug})? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    const deleted = await deleteAppRegistration(app.id);
    if (deleted) {
      await queryClient.invalidateQueries({ queryKey: ["app-registrations"] });
      navigate("/apps");
    }
  };

  if (Number.isNaN(appId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Invalid app ID</p>
          <Button variant="link" onClick={() => navigate("/apps")} className="mt-2">
            Back to apps
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/apps")}
              aria-label="Back to apps"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">{app?.name ?? "App"}</h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {app?.status ? <Badge variant="outline">{app.status}</Badge> : null}
                    {app?.slug ? <Badge variant="outline">{app.slug}</Badge> : null}
                    {app?.category ? <Badge variant="outline">{app.category}</Badge> : null}
                    {app ? (
                      <Badge variant="outline">
                        {Number(app.ratings ?? 0).toFixed(1)} ★ · {app.user_count ?? 0} users ·{" "}
                        {app.review_count ?? 0} reviews
                      </Badge>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>

          {app ? (
            <div className="flex flex-wrap gap-2">
              {app.status !== "published" ? (
                <Button onClick={handlePublish} className="bg-emerald-600 hover:bg-emerald-600/90">
                  <Rocket className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              ) : (
                <Button variant="outline" onClick={handleDisable}>
                  <Ban className="mr-2 h-4 w-4" />
                  Disable
                </Button>
              )}
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : app ? (
          <AppEditor
            app={app}
            saving={saving}
            uploadingAsset={uploading}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
            onUploadAsset={handleUpload}
          />
        ) : (
          <Card className="glass-morphism border-white/10">
            <CardContent className="py-8 text-center text-muted-foreground">
              App registration not found.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AppDetail;
