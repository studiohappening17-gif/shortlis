import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign-in...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error(sessionError?.message || "No session found");
        }

        const userEmail = session.user.email;
        const userId = session.user.id;

        if (!userEmail) {
          throw new Error("No email found in Google account");
        }

        setStatus("Saving your subscription...");

        const { error: insertError } = await supabase
          .from("subscribers")
          .insert({
            email: userEmail,
            source: "google",
            user_id: userId,
          });

        if (insertError) {
          if (insertError.code === "23505") {
            toast.success("You're already on the list — thanks!");
          } else {
            throw insertError;
          }
        } else {
          toast.success("Subscribed! Welcome to ShortListed.");
        }

        navigate({ to: "/", replace: true });
      } catch (err) {
        console.error("Auth callback error:", err);
        toast.error("Something went wrong. Please try again.");
        navigate({ to: "/", replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground text-sm">{status}</p>
    </div>
  );
}
