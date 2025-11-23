import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Leaf, ArrowLeft, Home, MessageSquare, Star, Send, CheckCircle2, ThumbsUp, AlertCircle, History } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useNavigate } from "react-router-dom";

interface FeedbackProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
}

export default function Feedback({ onLogout, onNavigateToDashboard }: FeedbackProps) {
  const navigate = useNavigate();
const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

// Debug: Log API URL saat component mount
console.log("[Feedback] API_URL:", API_URL);
  
  const [formData, setFormData] = useState({
    rating: "5",
    category: "umum",
    message: ""
  });
  const [userData, setUserData] = useState<{id: number, nama: string, email: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [publicFeedbacks, setPublicFeedbacks] = useState<any[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);

  // Load user data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        setUserData({
          id: user.user_id || user.id,
          nama: user.nama,
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Load public feedbacks (riwayat ulasan)
  useEffect(() => {
    const loadPublicFeedbacks = async () => {
      setIsLoadingFeedbacks(true);
      try {
        // Tambahkan timeout 5 detik
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_URL}/api/feedback/public?limit=10&sort=date_desc`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          setPublicFeedbacks(data.feedbacks || []);
        } else {
          console.error('Failed to load feedbacks:', response.status);
          toast.error("Gagal memuat ulasan", {
            description: "Pastikan backend berjalan di " + API_URL
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          toast.error("Timeout memuat ulasan", {
            description: "Backend tidak merespons. Pastikan backend Flask berjalan di " + API_URL
          });
        } else {
          console.error('Error loading public feedbacks:', error);
          toast.error("Gagal memuat ulasan", {
            description: error.message || "Tidak bisa terhubung ke backend"
          });
        }
      } finally {
        setIsLoadingFeedbacks(false);
      }
    };

    loadPublicFeedbacks();
  }, [isSubmitted]); // Reload saat ada feedback baru

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) {
      toast.error("Error", {
        description: "User data tidak ditemukan. Silakan login ulang."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Tambahkan timeout 10 detik untuk submit
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_URL}/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.id,
          rating: parseInt(formData.rating),
          category: formData.category,
          message: formData.message
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast.success("Terima kasih atas masukan Anda!", {
          description: "Feedback Anda sangat berharga untuk pengembangan PlantVision"
        });
        console.log("[Feedback] Submit berhasil:", data);
        
        // Reload feedbacks setelah 500ms (biarkan database commit dulu)
        setTimeout(() => {
          const reloadController = new AbortController();
          const reloadTimeout = setTimeout(() => reloadController.abort(), 5000);
          fetch(`${API_URL}/api/feedback/public?limit=10&sort=date_desc`, {
            signal: reloadController.signal
          })
            .then(res => {
              clearTimeout(reloadTimeout);
              return res.json();
            })
            .then(data => {
              setPublicFeedbacks(data.feedbacks || []);
              console.log("[Feedback] Reloaded feedbacks:", data.feedbacks?.length || 0);
              toast.success("Feedback Anda sudah muncul di riwayat ulasan!", {
                description: "Terima kasih atas kontribusi Anda"
              });
            })
            .catch(err => {
              clearTimeout(reloadTimeout);
              if (err.name !== 'AbortError') {
                console.error('Error reloading feedbacks:', err);
              }
            });
        }, 500);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            rating: "5",
            category: "umum",
            message: ""
          });
        }, 3000);
      } else {
        console.error("[Feedback] Submit gagal:", response.status, data);
        toast.error("Gagal mengirim feedback", {
          description: data.error || `Error ${response.status}: Terjadi kesalahan. Silakan coba lagi.`
        });
        
        // Jika user tidak ditemukan, sarankan login ulang
        if (data.error && data.error.includes("User tidak ditemukan")) {
          toast.error("User tidak ditemukan", {
            description: "Silakan login ulang atau gunakan fitur Feedback untuk Guest"
          });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error("Timeout mengirim feedback", {
          description: "Backend tidak merespons. Pastikan backend Flask berjalan di " + API_URL
        });
      } else {
        console.error('Error submitting feedback:', error);
        toast.error("Gagal mengirim feedback", {
          description: error.message || "Tidak dapat terhubung ke server. Silakan cek koneksi Anda."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={onNavigateToDashboard}
                className="text-gray-700 hover:text-[#2ECC71]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <div className="flex items-center gap-3">
                <img 
                  src="/images/plantvision-logo.png" 
                  alt="PlantVision Logo" 
                  className="h-10 w-auto"
                />
                <span className="text-gray-900 tracking-tight font-semibold">Saran & Kritik</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate('/feedback/my')}
              >
                <History className="w-4 h-4 mr-2" />
                Riwayat Feedback
              </Button>
              <Button 
                variant="outline"
                onClick={onNavigateToDashboard}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 mb-4">
              <ThumbsUp className="w-5 h-5 text-[#F39C12]" />
              <span className="text-gray-700">Kami Mendengarkan</span>
            </div>
            <h1 className="text-4xl md:text-5xl text-gray-900 mb-4">
              Saran & Kritik
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Masukan Anda sangat berharga untuk meningkatkan kualitas PlantVision. Sampaikan saran, kritik, atau pengalaman Anda menggunakan platform kami.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              {isSubmitted ? (
                <Card className="border-2 border-[#2ECC71]">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-3">Feedback Terkirim!</h3>
                    <p className="text-gray-600 mb-6">
                      Terima kasih telah meluangkan waktu untuk memberikan masukan. Tim kami akan meninjau feedback Anda dan terus meningkatkan layanan PlantVision.
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                    >
                      Kirim Feedback Lagi
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#2ECC71]" />
                      Form Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* User Info Display */}
                      {userData && (
                        <Alert className="border-blue-200 bg-blue-50">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-900">Feedback atas nama:</AlertTitle>
                          <AlertDescription className="text-blue-800">
                            <strong>{userData.nama}</strong> ({userData.email})
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Rating */}
                      <div className="space-y-3">
                        <Label>Penilaian Pengalaman Anda *</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleChange("rating", star.toString())}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  parseInt(formData.rating) >= star
                                    ? "fill-[#F39C12] text-[#F39C12]"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-3 text-gray-700">
                            {formData.rating}/5 - {
                              formData.rating === "5" ? "Sangat Baik" :
                              formData.rating === "4" ? "Baik" :
                              formData.rating === "3" ? "Cukup" :
                              formData.rating === "2" ? "Kurang" : "Sangat Kurang"
                            }
                          </span>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="space-y-3">
                        <Label>Kategori Feedback *</Label>
                        <RadioGroup 
                          value={formData.category}
                          onValueChange={(value: string) => handleChange("category", value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="umum" id="umum" />
                            <Label htmlFor="umum" className="cursor-pointer">Umum</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fitur" id="fitur" />
                            <Label htmlFor="fitur" className="cursor-pointer">Fitur / Fungsionalitas</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bug" id="bug" />
                            <Label htmlFor="bug" className="cursor-pointer">Bug / Error</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="desain" id="desain" />
                            <Label htmlFor="desain" className="cursor-pointer">Desain / UI/UX</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="saran" id="saran" />
                            <Label htmlFor="saran" className="cursor-pointer">Saran Fitur Baru</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <Label htmlFor="message">Pesan / Deskripsi *</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          placeholder="Jelaskan saran, kritik, atau masalah yang Anda alami dengan detail..."
                          rows={6}
                          required
                        />
                        <p className="text-gray-500">{formData.message.length} karakter</p>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Mengirim... (max 10 detik)
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Kirim Feedback
                          </>
                        )}
                      </Button>
                      {isSubmitting && (
                        <p className="text-xs text-center text-gray-500 mt-2">
                          ⏱️ Jika loading lama, pastikan backend Flask berjalan di {API_URL}
                        </p>
                      )}
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Why Feedback Matters */}
              <Card className="bg-gradient-to-br from-[#2ECC71]/10 to-[#F39C12]/10 border-[#2ECC71]/30">
                <CardHeader>
                  <CardTitle className="text-[#2ECC71] flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5" />
                    Mengapa Feedback Penting?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-gray-700">
                  <p>✓ Membantu kami memahami kebutuhan Anda</p>
                  <p>✓ Meningkatkan kualitas fitur yang ada</p>
                  <p>✓ Mengembangkan fitur baru yang relevan</p>
                  <p>✓ Memperbaiki bug dan masalah teknis</p>
                  <p>✓ Menciptakan pengalaman pengguna yang lebih baik</p>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Waktu Respons</AlertTitle>
                <AlertDescription className="text-blue-800">
                  Tim kami akan meninjau feedback Anda dalam 1-3 hari kerja. Untuk masalah urgent, silakan hubungi kami melalui halaman Hubungi Kami.
                </AlertDescription>
              </Alert>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistik Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Feedback</span>
                    <span className="text-2xl text-[#2ECC71]">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Diterapkan</span>
                    <span className="text-2xl text-[#F39C12]">423</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dalam Review</span>
                    <span className="text-2xl text-blue-500">156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rating Rata-rata</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-[#F39C12] text-[#F39C12]" />
                      <span className="text-2xl text-gray-900">4.7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Riwayat Ulasan (Google Reviews Style) */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Riwayat Ulasan</h2>
                <p className="text-gray-600">Lihat apa yang dikatakan pengguna lain tentang PlantVision</p>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 fill-[#F39C12] text-[#F39C12]" />
                <span className="text-2xl font-bold text-gray-900">
                  {publicFeedbacks.length > 0 
                    ? (publicFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / publicFeedbacks.length).toFixed(1)
                    : '0.0'}
                </span>
                <span className="text-gray-600">({publicFeedbacks.length} ulasan)</span>
              </div>
            </div>

            {isLoadingFeedbacks ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Memuat ulasan...</p>
                <p className="text-xs text-gray-500">
                  Jika loading lama, pastikan backend Flask berjalan di {API_URL}
                </p>
              </div>
            ) : publicFeedbacks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada ulasan. Jadilah yang pertama memberikan ulasan!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {publicFeedbacks.map((feedback) => (
                  <Card key={feedback.feedback_id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {feedback.nama.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{feedback.nama}</h3>
                              <p className="text-xs text-gray-500">
                                {feedback.created_at 
                                  ? new Date(feedback.created_at).toLocaleDateString('id-ID', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })
                                  : 'Tanggal tidak tersedia'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= feedback.rating
                                      ? "fill-[#F39C12] text-[#F39C12]"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Category Badge */}
                          <div className="mb-3">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {feedback.category === 'umum' ? 'Umum' :
                               feedback.category === 'fitur' ? 'Fitur' :
                               feedback.category === 'bug' ? 'Bug' :
                               feedback.category === 'desain' ? 'Desain' :
                               feedback.category === 'saran' ? 'Saran' : feedback.category}
                            </span>
                          </div>

                          {/* Message */}
                          <p className="text-gray-700 leading-relaxed">{feedback.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

