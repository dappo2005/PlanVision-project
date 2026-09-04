import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Loader2, 
  KeyRound, 
  RefreshCw, 
  Check, 
  X 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  // Ambil token dari URL (mendukung search query standard ?token=xxx maupun hash #/reset-password?token=xxx)
  useEffect(() => {
    let t = "";

    // 1. Coba dari window.location.search (?token=...)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("token")) {
      t = searchParams.get("token") || "";
    }

    // 2. Fallback jika token ada di hash (#/reset-password?token=...)
    if (!t && window.location.hash) {
      const hash = window.location.hash;
      const queryPart = hash.includes("?") ? hash.split("?")[1] : "";
      const hashParams = new URLSearchParams(queryPart);
      if (hashParams.get("token")) {
        t = hashParams.get("token") || "";
      }
    }

    if (!t) {
      setTokenInvalid(true);
      setError("Token reset kata sandi tidak ditemukan di tautan. Pastikan Anda mengeklik tautan lengkap dari email.");
      setIsCheckingToken(false);
      return;
    }

    setToken(t);

    // Verifikasi token ke backend
    fetch(`${API_URL}/api/reset-password/verify?token=${encodeURIComponent(t)}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setIsCheckingToken(false);
        if (data.valid) {
          if (data.email) {
            setTargetEmail(data.email);
          }
        } else {
          setTokenInvalid(true);
          setError(data.error || "Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.");
        }
      })
      .catch(() => {
        // Jika endpoint verify tidak dapat dijangkau, izinkan user mencoba submit langsung
        setIsCheckingToken(false);
      });
  }, []);

  // Kekuatan kata sandi sederhana
  const hasMinLength = newPassword.length >= 8;
  const hasMixedChars = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const getStrengthLevel = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (hasMixedChars) score += 1;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score += 1;
    return score; // 0-4
  };

  const strength = getStrengthLevel();

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
        setError(`Koneksi ke server gagal. Pastikan backend berjalan di ${API_URL}`);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdf4] via-white to-[#fff7ed] p-4">
      <Card className="w-full max-w-md border-gray-200 shadow-xl rounded-2xl bg-white/95 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Logo Brand */}
          <div className="flex items-center justify-center mb-6">
            <img
              src="/images/plantvision-logo.png"
              alt="PlantVision Logo"
              className="h-14 w-auto drop-shadow-sm cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>

          {/* State 1: Sedang Memverifikasi Token */}
          {isCheckingToken ? (
            <div className="text-center py-10 space-y-4">
              <div className="flex items-center justify-center w-14 h-14 mx-auto bg-green-50 rounded-full border border-green-200">
                <Loader2 className="w-7 h-7 text-[#2ECC71] animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Memeriksa Tautan Reset...</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Mohon tunggu sebentar, kami sedang memverifikasi keamanan tautan Anda.
              </p>
            </div>
          ) : tokenInvalid ? (
            /* State 2: Token Tidak Valid / Expired */
            <div className="text-center space-y-5 py-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full text-red-600">
                <AlertCircle className="w-9 h-9" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tautan Tidak Valid atau Kedaluwarsa</h2>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {error || "Tautan untuk mengatur ulang kata sandi ini sudah pernah digunakan atau batas waktu 15 menit telah habis."}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => { window.location.href = "/?forgot=1"; }}
                  className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white h-11 font-medium shadow-sm transition-all"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Minta Tautan Reset Baru
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { window.location.href = "/"; }}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 h-11"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Beranda
                </Button>
              </div>
            </div>
          ) : success ? (
            /* State 3: Berhasil Reset Password */
            <div className="text-center space-y-5 py-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full text-[#2ECC71] animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Kata Sandi Berhasil Direset!</h2>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  Kata sandi akun Anda telah berhasil diperbarui. Silakan masuk kembali dengan kata sandi baru Anda.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  id="btn-masuk-sekarang"
                  type="button"
                  onClick={() => {
                    const targetUrl = targetEmail ? `/?login=1&email=${encodeURIComponent(targetEmail)}` : "/?login=1";
                    window.location.href = targetUrl;
                  }}
                  className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white h-11 font-medium shadow-md transition-all text-base"
                >
                  Masuk Sekarang
                </Button>
                <div>
                  <a
                    href={targetEmail ? `/?login=1&email=${encodeURIComponent(targetEmail)}` : "/?login=1"}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Kembali ke Halaman Masuk
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* State 4: Form Input Kata Sandi Baru */
            <>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center w-14 h-14 mx-auto bg-green-100 rounded-full mb-3 text-[#2ECC71]">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Atur Ulang Kata Sandi</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {targetEmail ? (
                    <span>
                      Untuk akun: <strong className="text-gray-800">{targetEmail}</strong>
                    </span>
                  ) : (
                    "Masukkan kata sandi baru untuk akun PlantVision Anda."
                  )}
                </p>
              </div>

              {error && (
                <div
                  aria-live="polite"
                  className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Kata Sandi Baru */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-gray-400" />
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
                      className="w-full pr-10 h-11 border-gray-300 focus:border-[#2ECC71] focus:ring-[#2ECC71] rounded-lg"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Indikator Kekuatan Password */}
                {newPassword && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Kekuatan Sandi:</span>
                      <span className={`font-medium ${
                        strength <= 1 ? "text-red-500" : strength <= 3 ? "text-amber-500" : "text-green-600"
                      }`}>
                        {strength <= 1 ? "Lemah" : strength <= 3 ? "Sedang" : "Kuat"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full transition-all ${
                        strength >= 1 ? (strength <= 1 ? "bg-red-500" : strength <= 3 ? "bg-amber-500" : "bg-green-500") : "bg-transparent"
                      }`} />
                      <div className={`h-full flex-1 rounded-full transition-all ${
                        strength >= 2 ? (strength <= 3 ? "bg-amber-500" : "bg-green-500") : "bg-transparent"
                      }`} />
                      <div className={`h-full flex-1 rounded-full transition-all ${
                        strength >= 4 ? "bg-green-500" : "bg-transparent"
                      }`} />
                    </div>
                  </div>
                )}

                {/* Konfirmasi Kata Sandi */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-gray-400" />
                    Konfirmasi Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Ketik ulang kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      className="w-full pr-10 h-11 border-gray-300 focus:border-[#2ECC71] focus:ring-[#2ECC71] rounded-lg"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checklist Syarat Kata Sandi */}
                <div className="text-xs space-y-1 text-gray-500 pt-1 pb-2">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-green-600 font-medium" : "text-gray-500"}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 inline-block text-center">•</span>}
                    <span>Minimal 8 karakter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasMixedChars ? "text-green-600 font-medium" : "text-gray-500"}`}>
                    {hasMixedChars ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 inline-block text-center">•</span>}
                    <span>Kombinasi huruf dan angka</span>
                  </div>
                  {confirmPassword && (
                    <div className={`flex items-center gap-1.5 ${passwordsMatch ? "text-green-600 font-medium" : "text-red-500"}`}>
                      {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{passwordsMatch ? "Konfirmasi kata sandi cocok" : "Konfirmasi kata sandi belum sama"}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !hasMinLength || (confirmPassword.length > 0 && !passwordsMatch)}
                  className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white h-11 font-medium rounded-lg shadow-sm transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan Kata Sandi...
                    </span>
                  ) : (
                    "Simpan Kata Sandi Baru"
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Batal dan kembali ke beranda
                  </button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
