import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { MessageSquare, Star, Send, CheckCircle2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export default function FeedbackGuest() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    rating: "5",
    category: "umum",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/feedback/submit-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          nama: formData.nama,
          email: formData.email,
          rating: parseInt(formData.rating),
          category: formData.category,
          message: formData.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTrackingCode(data.tracking_code);
        setIsSubmitted(true);
        toast.success("Terima kasih atas masukan Anda!", {
          description: "Feedback Anda sangat berharga untuk pengembangan PlantVision"
        });
      } else {
        toast.error("Gagal mengirim feedback", {
          description: data.error || "Terjadi kesalahan. Silakan coba lagi."
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error("Gagal mengirim feedback", {
        description: "Tidak dapat terhubung ke server. Silakan cek koneksi Anda."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const copyTrackingCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    toast.success("Tracking code berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setTrackingCode("");
    setFormData({
      nama: "",
      email: "",
      rating: "5",
      category: "umum",
      message: ""
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl text-gray-900">PlantVision</h1>
              <p className="text-sm text-gray-600">Feedback & Saran</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {isSubmitted ? (
            /* Success State */
            <Card className="border-2 border-[#2ECC71]">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-3">Feedback Terkirim!</h3>
                <p className="text-gray-600 mb-6">
                  Terima kasih telah meluangkan waktu untuk memberikan masukan. Tim kami akan meninjau feedback Anda.
                </p>

                {/* Tracking Code */}
                <Alert className="border-blue-200 bg-blue-50 mb-6">
                  <AlertTitle className="text-blue-900 mb-3">Tracking Code Anda:</AlertTitle>
                  <AlertDescription>
                    <div className="flex items-center gap-2 justify-center">
                      <code className="px-4 py-2 bg-white border border-blue-200 rounded text-blue-900 font-mono text-sm">
                        {trackingCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyTrackingCode}
                        className="border-blue-300"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-blue-700 mt-3">
                      Simpan code ini untuk melacak status feedback Anda
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={handleReset}
                    className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                  >
                    Kirim Feedback Lagi
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                  >
                    Kembali ke Beranda
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Form */
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl text-gray-900 mb-3">Sampaikan Feedback Anda</h2>
                <p className="text-gray-600">
                  Masukan Anda sangat berharga untuk meningkatkan kualitas PlantVision
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#2ECC71]" />
                    Form Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Info Alert */}
                    <Alert className="border-green-200 bg-green-50">
                      <AlertTitle className="text-green-900">Feedback Tanpa Login</AlertTitle>
                      <AlertDescription className="text-green-800">
                        Anda dapat mengirim feedback tanpa perlu membuat akun. Kami akan memberikan tracking code untuk melacak status feedback Anda.
                      </AlertDescription>
                    </Alert>

                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="nama">Nama Lengkap *</Label>
                      <Input
                        id="nama"
                        value={formData.nama}
                        onChange={(e) => handleChange("nama", e.target.value)}
                        placeholder="Masukkan nama lengkap Anda"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="nama@email.com"
                        required
                      />
                    </div>

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
                      <p className="text-sm text-gray-500">{formData.message.length} karakter</p>
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
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Kirim Feedback
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

