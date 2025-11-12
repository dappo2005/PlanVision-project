import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Leaf, ArrowLeft, Home, MessageSquare, Star, Send, CheckCircle2, ThumbsUp, AlertCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface FeedbackProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
}

export default function Feedback({ onLogout, onNavigateToDashboard }: FeedbackProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: "5",
    category: "umum",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Terima kasih atas masukan Anda!", {
        description: "Feedback Anda sangat berharga untuk pengembangan PlantVision"
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          rating: "5",
          category: "umum",
          message: ""
        });
      }, 3000);
    }, 1500);
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
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900 tracking-tight">PlantVision - Saran & Kritik</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
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
                          onValueChange={(value) => handleChange("category", value)}
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
        </div>
      </div>
    </div>
  );
}
