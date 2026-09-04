import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { AlertCircle, CheckCircle2, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ambil token dari URL hash (#/reset-password?token=xxx)
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split("?")[1] || "");
    const t = params.get("token");
    if (t) setToken(t);
    else setError("Token reset tidak ditemukan di URL.");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token reset tidak ditemukan.");
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
    fetch(`${API_URL}/api/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ token, new_password: newPassword }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.message) {
          setSuccess(true);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdf4] via-white to-[#fff7ed] p-4">
      <Card className="w-full max-w-md border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/images/plantvision-logo.png"
              alt="PlantVision Logo"
              className="h-16 w-auto"
            />
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-14 h-14 mx-auto bg-green-100 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-[#2ECC71]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Kata Sandi Direset</h2>
              <p className="text-gray-600">
                Kata sandi Anda berhasil diperbarui. Silakan masuk dengan kata sandi baru.
              </p>
              <a href="/">
                <Button className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white h-11">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Halaman Masuk
                </Button>
              </a>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center w-14 h-14 mx-auto bg-green-100 rounded-full mb-3">
                  <Lock className="w-7 h-7 text-[#2ECC71]" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Atur Ulang Kata Sandi</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Masukkan kata sandi baru untuk akun Anda.
                </p>
              </div>

              {error && (
                <div
                  aria-live="polite"
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
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
                  <Label htmlFor="confirm-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Konfirmasi Kata Sandi
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
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
                      aria-label={showConfirm ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
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
                  {loading ? "Memproses..." : "Atur Ulang Kata Sandi"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
