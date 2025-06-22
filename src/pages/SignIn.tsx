import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, ArrowLeft } from "lucide-react";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import { toast } from "sonner";
import Logo from "../../public/logo.png";

const SignIn: React.FC = () => {
  const { login, verify, needsVerification } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "verify">("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success && result.needsVerification) {
        setStep("verify");
        toast.success("Verification code sent to your email");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    setLoading(true);

    try {
      const success = await verify(verificationCode);

      if (!success) {
        toast.error("Invalid verification code");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep("login");
    setVerificationCode("");
  };

  // Auto-switch to verification step if needed
  React.useEffect(() => {
    if (needsVerification) {
      setStep("verify");
    }
  }, [needsVerification]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-noise p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-solana/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 bg-purple-700/10 blur-[100px] rounded-full animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="glass-card p-8 w-full max-w-md z-10">
        <div className="flex flex-col items-center space-y-2 mb-8">
          <div className="h-12 w-12 rounded-full bg-solana/10 flex items-center justify-center">
            <img src={Logo} alt="Logo" />
          </div>
          <h1 className="text-2xl font-bold mt-4">
            <AnimatedText gradient>Admin</AnimatedText>
          </h1>
          <p className="text-muted-foreground text-center mt-1">
            <AnimatedText delay={200}>
              {step === "login"
                ? "Sign in to manage your AI-powered voice transaction platform"
                : "Enter the verification code sent to your email"}
            </AnimatedText>
          </p>
        </div>

        {step === "login" ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/30 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-xs text-solana hover:text-solana/80 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/30 border-white/10"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-solana to-purple-600 hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerification} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="bg-black/30 border-white/10 text-center text-lg tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Check your email for the 6-digit verification code
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-solana to-purple-600 hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Sign in"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToLogin}
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignIn;
