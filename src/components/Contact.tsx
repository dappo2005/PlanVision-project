import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Leaf, ArrowLeft, Home, Mail, Phone, MapPin, Send, Clock, Globe, MessageCircle, CheckCircle2, Instagram, Linkedin, Github } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface ContactProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
}

const teamMembers = [
  {
    name: "Daffa",
    role: "Project Manager & IoT Specialist",
    email: "daffa@plantvision.id",
    phone: "+62 812-3456-7890",
    instagram: "@daffa.dev"
  },
  {
    name: "Aisyah",
    role: "ML Engineer & Data Scientist",
    email: "aisyah@plantvision.id",
    phone: "+62 813-4567-8901",
    instagram: "@aisyah.tech"
  },
  {
    name: "Refael",
    role: "Full Stack Developer",
    email: "refael@plantvision.id",
    phone: "+62 814-5678-9012",
    instagram: "@refael.codes"
  },
  {
    name: "Imam",
    role: "UI/UX Designer & Frontend Dev",
    email: "imam@plantvision.id",
    phone: "+62 815-6789-0123",
    instagram: "@imam.design"
  }
];

export default function Contact({ onLogout, onNavigateToDashboard }: ContactProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Pesan berhasil dikirim!", {
        description: "Tim kami akan menghubungi Anda dalam 1x24 jam"
      });
      
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
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
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900 tracking-tight">PlantVision - Hubungi Kami</span>
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 mb-4">
              <MessageCircle className="w-5 h-5 text-[#F39C12]" />
              <span className="text-gray-700">Kami Siap Membantu</span>
            </div>
            <h1 className="text-4xl md:text-5xl text-gray-900 mb-4">
              Hubungi Kami
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Punya pertanyaan, saran, atau ingin berkolaborasi? Tim PlantVision siap membantu Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Quick Contact Info */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 mb-2">info@plantvision.id</p>
                <p className="text-gray-600">support@plantvision.id</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">Telepon</h3>
                <p className="text-gray-600 mb-2">+62 21 1234 5678</p>
                <p className="text-gray-600">+62 800 123 4567 (Toll Free)</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">Alamat</h3>
                <p className="text-gray-600 mb-2">Gedung Teknologi Pertanian</p>
                <p className="text-gray-600">Jl. Inovasi No. 123, Jakarta 12345</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              {isSubmitted ? (
                <Card className="border-2 border-[#2ECC71]">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-3">Pesan Terkirim!</h3>
                    <p className="text-gray-600 mb-6">
                      Terima kasih telah menghubungi kami. Tim PlantVision akan merespons pesan Anda dalam waktu 1x24 jam kerja.
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                    >
                      Kirim Pesan Lagi
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-[#2ECC71]" />
                      Kirim Pesan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nama Lengkap *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Nama Anda"
                            required
                          />
                        </div>

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
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Nomor Telepon</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="+62 812-3456-7890"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Subjek *</Label>
                          <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => handleChange("subject", e.target.value)}
                            placeholder="Topik pesan Anda"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Pesan *</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          placeholder="Tulis pesan Anda di sini..."
                          rows={6}
                          required
                        />
                      </div>

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
                            Kirim Pesan
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
              {/* Office Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#2ECC71]" />
                    Jam Operasional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Senin - Jumat</span>
                    <span className="text-gray-900">08:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sabtu</span>
                    <span className="text-gray-900">09:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minggu</span>
                    <span className="text-red-500">Tutup</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-gray-500">
                      Email support 24/7, response dalam 1x24 jam kerja
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#F39C12]" />
                    Media Sosial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Instagram className="w-4 h-4 mr-2" />
                    @plantvision.official
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Linkedin className="w-4 h-4 mr-2" />
                    PlantVision Indonesia
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Github className="w-4 h-4 mr-2" />
                    github.com/plantvision
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    plantvision@email.com
                  </Button>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card className="bg-gradient-to-br from-[#2ECC71]/10 to-[#F39C12]/10 border-[#2ECC71]/30">
                <CardHeader>
                  <CardTitle className="text-[#2ECC71]">💡 FAQ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-gray-700">
                  <p className="font-medium">Berapa lama respon email?</p>
                  <p className="text-gray-600 mb-3">Maksimal 1x24 jam kerja</p>
                  
                  <p className="font-medium">Apakah konsultasi gratis?</p>
                  <p className="text-gray-600 mb-3">Ya, konsultasi dasar gratis</p>
                  
                  <p className="font-medium">Bisa kunjungan langsung?</p>
                  <p className="text-gray-600">Ya, dengan perjanjian terlebih dahulu</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Team Members */}
          <div className="mt-12">
            <h2 className="text-3xl text-gray-900 text-center mb-8">Tim Pengembang PlantVision</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <Card key={index} className="hover:shadow-xl transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                      {member.name.charAt(0)}
                    </div>
                    <h3 className="text-gray-900 text-center mb-1">{member.name}</h3>
                    <p className="text-[#2ECC71] text-center mb-4">{member.role}</p>
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#2ECC71]" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#F39C12]" />
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span>{member.instagram}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
