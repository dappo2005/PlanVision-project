import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { Leaf, Camera, Network, BarChart3, FileText, Cloud, Linkedin, Github, Mail, Eye, EyeOff, User, Phone, Lock, AlertCircle, CheckCircle2, Instagram } from "lucide-react";
import { useState } from "react";
import React from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.171.214:5000";

interface LandingPageProps {
  onLogin: () => void;
  showLoginDialog: boolean;
  setShowLoginDialog: (show: boolean) => void;
}

export default function LandingPage({ onLogin, showLoginDialog, setShowLoginDialog }: LandingPageProps) {
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Registration state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("login");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    // Validation
    if (!loginEmail || !loginPassword) {
      setLoginError("Email dan kata sandi wajib diisi");
      return;
    }

    if (!loginEmail.includes("@")) {
      setLoginError("Format email tidak valid");
      return;
    }

    if (loginPassword.length < 6) {
      setLoginError("Kata sandi minimal 6 karakter");
      return;
    }

    // Call backend API
    const loginData = {
      username: loginEmail,
      password: loginPassword
    };

    fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.message || data.user_id) {
          // Login sukses
          console.log("Login successful:", data);
          // Store user data to localStorage
          localStorage.setItem('user', JSON.stringify(data));
          onLogin();
          setLoginEmail("");
          setLoginPassword("");
        } else if (data.error) {
          setLoginError(data.error);
        }
      })
      .catch(error => {
        console.error('Login error:', error);
        setLoginError(`Koneksi ke server gagal. Pastikan backend running di ${API_URL}`);
      });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess(false);

    // Validation
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      setRegisterError("Semua field wajib diisi");
      return;
    }

    if (!registerEmail.includes("@")) {
      setRegisterError("Format email tidak valid");
      return;
    }

    if (registerPassword.length < 8) {
      setRegisterError("Kata sandi minimal 8 karakter");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Kata sandi dan konfirmasi kata sandi tidak cocok");
      return;
    }

    if (!acceptTerms) {
      setRegisterError("Anda harus menyetujui syarat dan ketentuan");
      return;
    }

    // Call backend API
    const registerData = {
      nama: registerName,
      email: registerEmail,
      username: registerEmail.split('@')[0], // optional, backend generate unique username juga
      phone: registerPhone || null,
      password: registerPassword,
      acceptTerms: true
    };

    fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          // Registration sukses
          console.log("Registration successful:", data);
          setRegisterSuccess(true);
          setTimeout(() => {
            // Auto switch to login tab after registration
            setActiveTab("login");
            setLoginEmail(registerEmail);
            setRegisterName("");
            setRegisterEmail("");
            setRegisterPhone("");
            setRegisterPassword("");
            setRegisterConfirmPassword("");
            setAcceptTerms(false);
            setRegisterSuccess(false);
          }, 2000);
        } else if (data.error) {
          setRegisterError(data.error);
        }
      })
      .catch(error => {
        console.error('Registration error:', error);
        setRegisterError(`Koneksi ke server gagal. Pastikan backend running di ${API_URL}`);
      });
  };

  const handleForgotPassword = () => {
    // This would typically open a forgot password modal or navigate to a page
    alert("Fitur lupa kata sandi akan segera hadir!");
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowLoginDialog(open);
    if (!open) {
      // Reset all form states when dialog closes
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPhone("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setRegisterError("");
      setRegisterSuccess(false);
      setAcceptTerms(false);
      setActiveTab("login");
    }
  };

  const teamMembers = [
    {
      name: "Daffa Maulana KAL",
      role: "Project Manager",
      expertise: "Backend Developer",
      avatar: "DM",
      color: "bg-gradient-to-br from-[#2ECC71] to-[#27AE60]",
      photo: "/images/team/daffa.jpeg"
    },
    {
      name: "Aisyah Putri Harmelia",
      role: "Frontend Developer",
      expertise: "Data Analyst",
      avatar: "AP",
      color: "bg-gradient-to-br from-[#F39C12] to-[#E67E22]",
      photo: "/images/team/ais.jpeg"
    },
    {
      name: "Refael Tresia Sibarani",
      role: "Business Analyst",
      expertise: "Requirement Engineer",
      avatar: "RT",
      color: "bg-gradient-to-br from-[#2ECC71] to-[#F39C12]",
      photo: "/images/team/refa.jpeg"
    },
    {
      name: "Imam Yanif",
      role: "Database Analyst",
      expertise: "Deployment Specialist",
      avatar: "IY",
      color: "bg-gradient-to-br from-[#E67E22] to-[#D35400]",
      photo: "/images/team/imam.jpeg"
    }
  ];

  const features = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Deteksi Otomatis",
      description: "Mendeteksi penyakit daun jeruk menggunakan Machine Learning dengan akurasi tinggi"
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Integrasi IoT",
      description: "Sensor warna dan kamera terintegrasi untuk mendeteksi secara real-time"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Dashboard",
      description: "Visualisasi data sensor dan hasil deteksi dalam satu dashboard"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Artikel & Edukasi",
      description: "Panduan lengkap tentang penyakit tanaman dan cara penanganannya"
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Ekspor Laporan",
      description: "Unduh laporan deteksi dalam format Excel atau PDF"
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "Real-time Analysis",
      description: "Analisis cepat dengan waktu respon kurang dari 3 detik"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 relative overflow-hidden">
      {/* Decorative Orange Elements */}
      <div className="fixed top-20 right-10 w-32 h-32 orange-slice opacity-5 pointer-events-none" />
      <div className="fixed bottom-32 left-10 w-24 h-24 orange-slice opacity-5 pointer-events-none" />
      <div className="fixed top-1/2 right-1/4 w-16 h-16 orange-slice opacity-5 pointer-events-none" />
      
      {/* Login & Registration Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-2xl">PlantVision</DialogTitle>
            </div>
            <DialogDescription>
              Platform IoT & Machine Learning untuk deteksi penyakit daun jeruk
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Masuk
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Daftar
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Message */}
              {loginError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{loginError}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="login-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
                </Label>
                <Input
                id="login-email"
                type="email"
                placeholder="nama@email.com"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  setLoginError("");
                }}
                className="w-full"
                required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="login-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Kata Sandi
                </Label>
                <div className="relative">
                <Input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder=" ••••••••"
                  value={loginPassword}
                  onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setLoginError("");
                  }}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showLoginPassword ? (
                  <EyeOff className="w-4 h-4" />
                  ) : (
                  <Eye className="w-4 h-4" />
                  )}
                </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                  Ingat saya
                </Label>
                </div>
                <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#2ECC71] hover:underline"
                >
                Lupa kata sandi?
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white h-11"
              >
                <Lock className="w-4 h-4 mr-2" />
                Masuk
              </Button>
              </form>

              {/* Social Login Separator */}
              <div className="relative my-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">atau masuk dengan</span>
              </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                </svg>
                Google
              </Button>
              </div>
            </TabsContent>

            {/* Registration Tab */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Error Message */}
                {registerError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{registerError}</span>
                  </div>
                )}

                {/* Success Message */}
                {registerSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Registrasi berhasil! Mengalihkan ke halaman masuk...</span>
                  </div>
                )}

                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nama Lengkap
                  </Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={registerName}
                    onChange={(e) => {
                      setRegisterName(e.target.value);
                      setRegisterError("");
                    }}
                    className="w-full"
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      setRegisterError("");
                    }}
                    className="w-full"
                    required
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Nomor Telepon
                    <span className="text-xs text-gray-500 font-normal">(Opsional)</span>
                  </Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="081234567890"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Kata Sandi
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      value={registerPassword}
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                        setRegisterError("");
                      }}
                      className="w-full pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Kata sandi harus minimal 8 karakter
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Konfirmasi Kata Sandi
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi kata sandi"
                      value={registerConfirmPassword}
                      onChange={(e) => {
                        setRegisterConfirmPassword(e.target.value);
                        setRegisterError("");
                      }}
                      className="w-full pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {registerConfirmPassword && registerPassword !== registerConfirmPassword && (
                    <p className="text-xs text-red-500">
                      Kata sandi tidak cocok
                    </p>
                  )}
                  {registerConfirmPassword && registerPassword === registerConfirmPassword && (
                    <p className="text-xs text-green-500">
                      Kata sandi cocok
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => {
                      setAcceptTerms(checked === true);
                      setRegisterError("");
                    }}
                    className="mt-1"
                  />
                  <Label htmlFor="accept-terms" className="text-sm font-normal cursor-pointer leading-tight">
                    Saya menyetujui{" "}
                    <a href="#" className="text-[#2ECC71] hover:underline">
                      Syarat dan Ketentuan
                    </a>{" "}
                    serta{" "}
                    <a href="#" className="text-[#2ECC71] hover:underline">
                      Kebijakan Privasi
                    </a>{" "}
                    PlantVision
                  </Label>
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white h-11"
                  disabled={registerSuccess}
                >
                  <User className="w-4 h-4 mr-2" />
                  {registerSuccess ? "Mendaftar..." : "Daftar Sekarang"}
                </Button>
              </form>

              {/* Social Registration Separator */}
              <div className="relative my-6">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-2 text-sm text-gray-500">atau daftar dengan</span>
                </div>
              </div>

              {/* Social Registration Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </Button>
              </div>

              {/* Already have account */}
              <div className="text-center text-sm text-gray-500 mt-4">
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-[#2ECC71] hover:underline font-medium"
                >
                  Masuk di sini
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section id="beranda" className="relative overflow-hidden citrus-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/10 via-transparent to-[#F39C12]/10" />
        <div className="absolute top-10 right-20 w-40 h-40 orange-slice opacity-10 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-10 left-20 w-28 h-28 orange-slice opacity-10 animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-[#2ECC71] rounded-full animate-pulse" />
              <span className="text-gray-700">IoT & Machine Learning Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl tracking-tight text-gray-900">
              Deteksi Penyakit Daun Jeruk Secara{" "}
              <span className="bg-gradient-to-r from-[#2ECC71] to-[#F39C12] bg-clip-text text-transparent">
                Cepat & Akurat
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Website berbasis IoT & Machine Learning untuk membantu petani mendeteksi 
              penyakit daun jeruk secara real-time dengan akurasi tinggi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-[#2ECC71] hover:bg-[#27AE60] text-white"
                onClick={() => {
                  setActiveTab("login");
                  setShowLoginDialog(true);
                }}
              >
                Masuk
              </Button>
              <Button 
                size="lg" 
                className="bg-white text-[#2ECC71] hover:bg-gray-50 border-2 border-[#2ECC71]"
                onClick={() => {
                  setActiveTab("register");
                  setShowLoginDialog(true);
                }}
              >
                Daftar Sekarang
              </Button>
              <Button size="lg" variant="outline" className="border-gray-300" asChild>
                <a href="#tentang">Pelajari Lebih Lanjut</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">Tentang PlantVision</h2>
            <p className="text-xl text-gray-600">
              PlantVision adalah solusi inovatif yang menggabungkan teknologi IoT dan Machine Learning 
              untuk membantu petani jeruk mendeteksi penyakit tanaman secara dini dan akurat.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-1/4 right-10 w-20 h-20 orange-slice opacity-5" />
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">Fitur Unggulan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Teknologi terdepan untuk deteksi penyakit tanaman
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-gray-200"
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="tim" className="py-20 bg-gradient-to-b from-green-50 to-white relative overflow-hidden citrus-pattern">
        <div className="absolute bottom-10 right-10 w-28 h-28 orange-slice opacity-10" />
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">Tim Pengembang</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              TRK60 G1 - Tim BEBAS Ahli IoT & Computer Vision yang berdedikasi untuk memajukan teknologi pertanian Indonesia
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => {
              const [imageError, setImageError] = useState(false);
              return (
                <Card 
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-gray-200"
                >
                  <CardContent className="p-6 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <div className={`w-24 h-24 ${member.color} rounded-full flex items-center justify-center text-white text-2xl overflow-hidden border-4 border-white shadow-lg relative`}>
                        {member.photo && !imageError ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                              objectPosition: 'center 25%',
                            }}
                            onError={() => setImageError(true)}
                            loading="lazy"
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center z-10">{member.avatar}</span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-[#2ECC71] mb-1">{member.role}</p>
                    <p className="text-gray-600">{member.expertise}</p>
                    <div className="flex justify-center gap-3 mt-4">
                      <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#2ECC71] hover:text-white transition-colors">
                        <Github className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#2ECC71] hover:text-white transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#2ECC71] hover:text-white transition-colors">
                        <Instagram className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl mb-4">Siap Memulai?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Bergabunglah dengan PlantVision dan tingkatkan produktivitas pertanian Anda dengan teknologi terkini
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-[#2ECC71] hover:bg-gray-100"
              onClick={() => {
                setActiveTab("login");
                setShowLoginDialog(true);
              }}
            >
              Masuk
            </Button>
            <Button 
              size="lg" 
              className="bg-transparent border-2 border-white text-white hover:bg-white/10"
              onClick={() => {
                setActiveTab("register");
                setShowLoginDialog(true);
              }}
            >
              Daftar Sekarang
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-white">PlantVision</span>
              </div>
              <p className="text-gray-400">
          Platform IoT & Machine Learning untuk deteksi penyakit daun jeruk
              </p>
            </div>
            <div>
              <h4 className="text-white mb-4">Tautan Cepat</h4>
              <ul className="space-y-2">
          <li><a href="#" className="hover:text-[#2ECC71] transition-colors">Beranda</a></li>
          <li><a href="#" className="hover:text-[#2ECC71] transition-colors">Tentang Proyek</a></li>
          <li><a href="#" className="hover:text-[#2ECC71] transition-colors">Fitur</a></li>
          <li><a href="#" className="hover:text-[#2ECC71] transition-colors">Dokumentasi</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Kontak</h4>
              <ul className="space-y-2">
          <li>Email: <a className="hover:text-[#2ECC71] transition-colors">daf.maula123@gmail.com</a></li>
          <li>TRK60 G1 - Tim BEBAS</li>
          <li>SV IPB University</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            © 2025 PlantVision | TRK60 G1 - Tim BEBAS | SV IPB University | all rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
