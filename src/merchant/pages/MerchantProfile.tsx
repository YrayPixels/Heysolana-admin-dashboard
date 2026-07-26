import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MerchantLayout from "../MerchantLayout";
import { useMerchantAuth } from "../MerchantAuthContext";
import { updateMerchantProfile } from "@/services/merchantApi";

const MerchantProfile: React.FC = () => {
  const { merchant, updateLocalProfile } = useMerchantAuth();
  const [name, setName] = useState(merchant?.name || "");
  const [phone, setPhone] = useState(merchant?.phone_number || "");
  const [saving, setSaving] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateMerchantProfile({
      name,
      phone_number: phone || null,
    });
    setSaving(false);
    if (result) {
      updateLocalProfile(result);
      toast.success("Profile updated — WhatsApp alerts use this phone number");
    }
  };

  return (
    <MerchantLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Profile</h1>
        <p className="text-sm text-slate-400">
          Keep your WhatsApp number up to date for new order alerts.
        </p>
      </div>

      <form
        onSubmit={onSave}
        className="max-w-lg space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5"
      >
        <div className="space-y-1">
          <Label>Email</Label>
          <Input value={merchant?.email || ""} disabled className="bg-slate-950 border-white/10" />
        </div>
        <div className="space-y-1">
          <Label>Display name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-950 border-white/10"
          />
        </div>
        <div className="space-y-1">
          <Label>WhatsApp phone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="2348012345678"
            className="bg-slate-950 border-white/10"
          />
          <p className="text-xs text-slate-500">
            Use international format without +. New orders email + WhatsApp this number.
          </p>
        </div>
        <Button type="submit" disabled={saving}>
          Save profile
        </Button>
      </form>
    </MerchantLayout>
  );
};

export default MerchantProfile;
