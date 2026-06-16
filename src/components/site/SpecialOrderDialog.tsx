"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  storeId: string;
  storeName: string;
  trigger?: React.ReactNode;
}

export function SpecialOrderDialog({ storeId, storeName, trigger }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [details, setDetails] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not-auth");
      if (itemName.trim().length < 2) throw new Error("invalid");
      const { error } = await supabase.from("special_orders").insert({
        user_id: user.id,
        store_id: storeId,
        item_name: itemName.trim().slice(0, 200),
        details: details.trim().slice(0, 1000) || null,
        contact_email: contactEmail.trim().slice(0, 200) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Request sent to ${storeName}`);
      setOpen(false);
      setItemName("");
      setDetails("");
    },
    onError: (e: Error) => {
      if (e.message === "invalid") toast.error("Please describe the item");
      else if (e.message === "not-auth") toast.error("Sign in to submit a request");
      else toast.error("Couldn't submit request");
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (next && !user) {
      toast.error("Sign in to submit a special order");
      router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="h-12 border border-ink px-6 text-sm font-semibold hover:bg-ink hover:text-white transition-colors">
            Special Order Form
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Special Order Request</DialogTitle>
          <DialogDescription>
            Can&apos;t find what you need at <span className="font-medium text-ink">{storeName}</span>?
            Send them a request — they&apos;ll get back to you directly.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="item">Item name *</Label>
            <Input
              id="item"
              required
              maxLength={200}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Crucial 32GB DDR4 RAM"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              maxLength={1000}
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Model, color, quantity, deadlines…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Contact email</Label>
            <Input
              id="email"
              type="email"
              maxLength={200}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={submit.isPending}
              className="h-12 bg-ink px-6 text-sm font-semibold text-white hover:bg-brand transition-colors disabled:opacity-50"
            >
              {submit.isPending ? "Sending…" : "Send Request"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
