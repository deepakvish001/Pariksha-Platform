import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import SettingsCard from "./SettingsCard";

interface Factor {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: string;
}

const TwoFactorAuthCard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [pending, setPending] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      toast({ variant: "destructive", title: "Failed to load 2FA status", description: error.message });
    } else {
      setFactors((data?.totp || []) as Factor[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const verified = factors.filter((f) => f.status === "verified");

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setEnrolling(false);
    if (error || !data) {
      toast({ variant: "destructive", title: "Could not start 2FA enrollment", description: error?.message });
      return;
    }
    setPending({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const cancelEnroll = async () => {
    if (pending) await supabase.auth.mfa.unenroll({ factorId: pending.factorId });
    setPending(null);
    setCode("");
    refresh();
  };

  const verifyEnroll = async () => {
    if (!pending || code.length !== 6) return;
    setVerifying(true);
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: pending.factorId });
    if (chErr || !challenge) {
      setVerifying(false);
      toast({ variant: "destructive", title: "Challenge failed", description: chErr?.message });
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: pending.factorId,
      challengeId: challenge.id,
      code,
    });
    setVerifying(false);
    if (error) {
      toast({ variant: "destructive", title: "Invalid code", description: error.message });
      return;
    }
    toast({ title: "Two-factor authentication enabled" });
    setPending(null);
    setCode("");
    refresh();
  };

  const removeFactor = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast({ variant: "destructive", title: "Failed to remove", description: error.message });
      return;
    }
    toast({ title: "2FA disabled" });
    refresh();
  };

  return (
    <SettingsCard delay={0.025}>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : pending ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password), then enter the 6-digit code below.
          </p>
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-lg" dangerouslySetInnerHTML={{ __html: pending.qr }} />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Or enter this secret manually:</p>
            <code className="text-xs font-mono break-all">{pending.secret}</code>
          </div>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={cancelEnroll} disabled={verifying}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={verifyEnroll} disabled={verifying || code.length !== 6}>
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Enable"}
            </Button>
          </div>
        </div>
      ) : verified.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
            <span>2FA is active on your account.</span>
          </div>
          {verified.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{f.friendly_name || "Authenticator app"}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeFactor(f.id)}>
                <ShieldOff className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security. You'll enter a code from your authenticator app each time you sign in.
          </p>
          <Button onClick={startEnroll} disabled={enrolling} className="w-full">
            {enrolling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
            Enable 2FA
          </Button>
        </div>
      )}
    </SettingsCard>
  );
};

export default TwoFactorAuthCard;
