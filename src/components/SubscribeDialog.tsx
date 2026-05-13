import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

export function SubscribeDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("subscribers")
        .insert({ email: parsed.data, source: "email" });
      if (error) {
        if (error.code === "23505") {
          toast.success("You're already on the list — thanks!");
        } else {
          throw error;
        }
      } else {
        toast.success("Subscribed! Welcome to ShortListed.");
      }
      setEmail("");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not subscribe. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed");
        setSubmitting(false);
        return;
      }
      if (result.redirected) return;
      // Got tokens back — record subscription
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;
      if (userEmail) {
        const { error } = await supabase
          .from("subscribers")
          .insert({ email: userEmail, source: "google", user_id: userData.user!.id });
        if (error && error.code !== "23505") throw error;
        toast.success("Subscribed! Welcome to ShortListed.");
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not subscribe with Google.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Subscribe">
          <Mail className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Stay ShortListed
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            No spam, we promise. We only send 2-3 curated updates per month.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubscribe} className="space-y-3 pt-2">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
            className="h-11 rounded-xl"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-amazon hover:bg-amazon-hover text-amazon-foreground"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
          </Button>
        </form>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full h-11 rounded-xl"
        >
          <GoogleIcon className="h-4 w-4 mr-2" />
          Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
    </svg>
  );
}
