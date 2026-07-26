import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import Logo from "../../../public/logo.png";
import { GOOGLE_CLIENT_ID } from "@/lib/appMode";
import { useMerchantAuth } from "../MerchantAuthContext";
import { GoogleSignInButton } from "../GoogleSignInButton";

/** Google only allows http://localhost / 127.0.0.1 for local OAuth, not merchant.localhost or LAN IPs. */
function getGoogleOriginIssue(): string | null {
  if (typeof window === "undefined") return null;
  const { protocol, hostname, port } = window.location;
  const origin = window.location.origin;

  if (
    hostname === "merchant.localhost" ||
    (hostname.endsWith(".localhost") && hostname !== "localhost")
  ) {
    const localPort = port || (protocol === "https:" ? "443" : "80");
    const target =
      localPort && localPort !== "80" && localPort !== "443"
        ? `http://localhost:${localPort}`
        : "http://localhost:5173";
    return `Google blocks OAuth on ${origin}. Open ${target} instead (VITE_APP_MODE=merchant is already set).`;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return `Google blocks OAuth on IP origins (${origin}). Use http://localhost:5173 instead.`;
  }

  return null;
}

const MerchantSignIn: React.FC = () => {
  const { loginWithGoogle } = useMerchantAuth();
  const [loading, setLoading] = useState(false);
  const originIssue = useMemo(() => getGoogleOriginIssue(), []);

  const handleCredential = useCallback(
    async (idToken: string) => {
      setLoading(true);
      try {
        const ok = await loginWithGoogle(idToken);
        if (!ok) {
          toast.error("Could not sign in with Google");
        } else {
          toast.success("Signed in");
        }
      } catch {
        toast.error("Google sign-in failed");
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle]
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.35),_transparent_55%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={Logo} alt="Heyorova" className="mb-4 h-14 w-14 rounded-xl" />
          <h1 className="text-2xl font-semibold text-white">Heyorova Merchant</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in with Google to manage exchange orders, rates, and wallets.
          </p>
        </div>

        {originIssue ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            <p>{originIssue}</p>
            <a
              href="http://localhost:5173"
              className="mt-3 inline-block font-medium text-teal-300 underline"
            >
              Continue on http://localhost:5173
            </a>
          </div>
        ) : !GOOGLE_CLIENT_ID ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            Set <code className="text-amber-100">VITE_GOOGLE_CLIENT_ID</code> in
            the admin dashboard env. In Google Cloud, authorize{" "}
            <code className="text-amber-100">http://localhost:5173</code> and{" "}
            <code className="text-amber-100">https://merchant.heyorova.com</code>.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <GoogleSignInButton
              onCredential={handleCredential}
              onError={(message) => toast.error(message)}
              disabled={loading}
            />
            {loading && (
              <p className="text-xs text-slate-400">Signing you in…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantSignIn;
