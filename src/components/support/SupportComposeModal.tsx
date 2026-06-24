import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AddressbookUserSearchResult,
  searchSupportUsers,
  startSupportConversation,
} from "@/services/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SupportComposeModal({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AddressbookUserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AddressbookUserSearchResult | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      setSelected(null);
      setBody("");
    }
  }, [open]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const users = await searchSupportUsers(search.trim());
      setResults(users);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSend = async () => {
    if (!selected || !body.trim()) return;
    setSending(true);
    const result = await startSupportConversation({
      body: body.trim(),
      user_id: selected.id,
      phone_number: selected.phone_number ?? undefined,
      wallet_address: selected.wallet_address ?? undefined,
      username: selected.username ?? undefined,
    });
    setSending(false);
    if (result?.conversation?.id) {
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ["support-conversations"] });
      navigate(`/support/${result.conversation.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New support message</DialogTitle>
          <DialogDescription>
            Search for a wallet user and send the first message. They will get a push notification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Find user</Label>
            <Input
              placeholder="Username, phone, or wallet address…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected(null);
              }}
            />
            {searching && (
              <p className="text-xs text-muted-foreground">Searching…</p>
            )}
            {results.length > 0 && !selected && (
              <div className="max-h-40 overflow-y-auto rounded-md border border-white/10">
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-white/5 last:border-0"
                    onClick={() => {
                      setSelected(u);
                      setSearch(u.username ? `@${u.username}` : u.phone_number ?? u.wallet_address ?? "");
                    }}
                  >
                    <span className="font-medium">
                      {u.username ? `@${u.username}` : `User #${u.id}`}
                    </span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {u.phone_number ?? u.wallet_address}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <p className="text-sm text-green-400">
                Selected: {selected.username ? `@${selected.username}` : `User #${selected.id}`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi! How can we help you today?"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSend()}
            disabled={!selected || !body.trim() || sending}
          >
            {sending ? "Sending…" : "Send & open chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
