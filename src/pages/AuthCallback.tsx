import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign-in...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Step 1: Supabase가 URL의 토큰을 자동으로 처리
        const { data: { session }, error: sessionError } = 
          await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error(sessionError?.message || "No session found");
        }

        // Step 2: 유저 이메일 가져오기
        const userEmail = session.user.email;
        const userId = session.user.id;

        if (!userEmail) {
          throw new Error("No email found in Google account");
        }

        setStatus("Saving your subscription...");

        // Step 3: subscribers 테이블에 저장
        const { error: insertError } = await supabase
          .from("subscribers")
          .insert({
            email: userEmail,
            source: "google",
            user_id: userId,
          });

        if (insertError) {
          // 이미 구독한 경우 (중복 키 에러)
          if (insertError.code === "23505") {
            toast.success("You're already on the list — thanks!");
          } else {
            throw insertError;
          }
        } else {
          toast.success("Subscribed! Welcome to ShortListed.");
        }

        // Step 4: 홈으로 리다이렉트
        navigate("/", { replace: true });

      } catch (err) {
        console.error("Auth callback error:", err);
        toast.error("Something went wrong. Please try again.");
        navigate("/", { replace: true });
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
