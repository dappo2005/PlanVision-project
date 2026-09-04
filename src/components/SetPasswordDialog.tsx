import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
  onSuccess?: () => void;
}

export default function SetPasswordDialog({ open, onOpenChange, email, onSuccess }: SetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email tidak ditemukan.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/api/set-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ email, new_password: newPassword }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.message) {
          setSuccess(true);
          setTimeout(() => {
            onOpenChange(false);
            if (onSuccess) onSuccess();
          }, 1500);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(() => {
        setLoading(false);
        setError(`Koneksi ke server gagal. Pastikan backend running di ${API_URL}`);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <img
              src="/images/plantvision-logo.png"
              alt="PlantVision Logo"
              className="h-14 w-auto"
            />
          </div>
          <DialogTitle className="text-xl">
            {success ? "Kata Sandi Dibuat!" : "Buat Kata Sandi Lokal"}
          </DialogTitle>
          <DialogDescription>
            {success
              ? "Kata sandi Anda berhasil dibuat. Anda kini dapat masuk dengan email & kata sandi."
              : `Anda terdaftar via Google. Buat kata sandi agar bisa login dengan email (${email || ""}) & kata sandi.`}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-[#2ECC71]" />
            </div>
            <p className="text-sm text-gray-600">Mengalihkan...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                aria-live="polite"
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sp-new-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Kata Sandi Baru
              </Label>
              <div className="relative">
                <Input
                  id="sp-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sp-confirm-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Konfirmasi Kata Sandi
              </Label>
              <div className="relative">
                <Input
                  id="sp-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Ulangi kata sandi"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi kata sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white h-11"
            >
              {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-500"
              onClick={() => onOpenChange(false)}
            >
              Nanti saja
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
