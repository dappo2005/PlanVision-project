import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Upload, Camera, AlertCircle, CheckCircle2, Leaf, Droplets, Bug, Eye, ArrowLeft, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";

interface DetectionResult {
  disease: string;
  confidence: number;
  severity: "rendah" | "sedang" | "tinggi";
  description: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  color: string;
}

const diseaseDatabase: Record<string, DetectionResult> = {
  canker: {
    disease: "Citrus Canker (Kanker Jeruk)",
    confidence: 89,
    severity: "tinggi",
    description: "Penyakit bakteri yang menyebabkan lesi pada daun, buah, dan ranting jeruk. Disebabkan oleh Xanthomonas citri.",
    symptoms: [
      "Bercak coklat dengan lingkaran kuning di sekitarnya",
      "Permukaan daun yang menonjol atau cekung",
      "Daun menggulung dan rontok prematur",
      "Buah berbintik dan berkeropeng"
    ],
    treatment: [
      "Pangkas dan bakar bagian tanaman yang terinfeksi",
      "Semprot dengan bakterisida berbasis tembaga (Copper hydroxide 77%)",
      "Aplikasikan setiap 7-10 hari saat musim hujan",
      "Isolasi tanaman yang terinfeksi dari tanaman sehat",
      "Gunakan antibiotik streptomycin sulfate 20% (100-200 ppm)"
    ],
    prevention: [
      "Gunakan bibit yang bersertifikat bebas penyakit",
      "Hindari pemangkasan saat musim hujan",
      "Jaga jarak tanam yang cukup (minimal 5-6 meter)",
      "Sanitasi alat pangkas dengan disinfektan",
      "Pasang windbreak untuk mengurangi penyebaran"
    ],
    color: "#E74C3C"
  },
  greening: {
    disease: "Citrus Greening (Huanglongbing/HLB)",
    confidence: 92,
    severity: "tinggi",
    description: "Penyakit mematikan yang disebabkan oleh bakteri Candidatus Liberibacter asiaticus, ditularkan oleh kutu Diaphorina citri.",
    symptoms: [
      "Daun menguning tidak merata (blotchy mottle)",
      "Tulang daun tetap hijau saat daun menguning",
      "Buah kecil, asimetris, dan tidak matang sempurna",
      "Ranting mengering dari ujung ke pangkal"
    ],
    treatment: [
      "TIDAK ADA OBAT - Segera cabut dan musnahkan tanaman terinfeksi",
      "Kendalikan vektor kutu dengan insektisida sistemik (Imidacloprid 20% SL)",
      "Aplikasi antibiotik Oxytetracycline untuk memperlambat gejala",
      "Injeksi trunk dengan Penicillin G (dosis 0.5-1 gram/pohon)",
      "Tingkatkan nutrisi tanaman dengan pemupukan berimbang"
    ],
    prevention: [
      "Gunakan bibit bebas penyakit dari sumber terpercaya",
      "Pasang perangkap kuning untuk monitoring kutu",
      "Semprot insektisida secara rutin (interval 2 minggu)",
      "Tanam varietas yang lebih toleran",
      "Lakukan roguing (pencabutan) tanaman terinfeksi segera"
    ],
    color: "#F39C12"
  },
  melanose: {
    disease: "Melanose",
    confidence: 85,
    severity: "sedang",
    description: "Penyakit jamur yang disebabkan oleh Diaporthe citri, menginfeksi daun muda dan buah.",
    symptoms: [
      "Bintik-bintik kecil coklat kehitaman pada daun",
      "Permukaan kasar seperti amplas pada buah",
      "Daun muda lebih rentan terserang",
      "Lesi berbentuk tidak beraturan"
    ],
    treatment: [
      "Aplikasikan fungisida berbasis tembaga (Copper oxychloride 50% WP)",
      "Semprot Mancozeb 80% WP dengan dosis 2-3 gram/liter",
      "Lakukan penyemprotan saat tunas baru muncul",
      "Ulangi aplikasi setiap 10-14 hari",
      "Pangkas ranting yang mati untuk mengurangi inokulum"
    ],
    prevention: [
      "Pemangkasan untuk meningkatkan sirkulasi udara",
      "Hindari penyiraman dari atas (overhead irrigation)",
      "Bersihkan sisa-sisa tanaman yang gugur",
      "Aplikasi fungisida preventif saat musim hujan",
      "Jaga kelembaban kebun tidak terlalu tinggi"
    ],
    color: "#9B59B6"
  },
  blackspot: {
    disease: "Black Spot (Bercak Hitam)",
    confidence: 87,
    severity: "sedang",
    description: "Penyakit jamur yang disebabkan oleh Phyllosticta citricarpa, menyerang buah dan daun jeruk.",
    symptoms: [
      "Bercak hitam bulat dengan tepi coklat pada buah",
      "Bercak cekung dengan titik hitam di tengah",
      "Daun dengan lesi coklat kehitaman",
      "Buah rontok prematur jika infeksi parah"
    ],
    treatment: [
      "Semprot dengan fungisida Azoxystrobin 25% SC (0.5 ml/liter)",
      "Aplikasikan Copper hydroxide setiap 2-3 minggu",
      "Gunakan Mancozeb + Metalaxyl untuk proteksi ganda",
      "Semprot saat bunga mekar hingga buah muda terbentuk",
      "Kumpulkan dan musnahkan buah yang terinfeksi"
    ],
    prevention: [
      "Sanitasi kebun dengan membuang buah gugur",
      "Pemangkasan untuk meningkatkan penetrasi cahaya",
      "Hindari kelembaban berlebih",
      "Rotasi fungisida untuk menghindari resistensi",
      "Aplikasi fungisida preventif sebelum musim hujan"
    ],
    color: "#34495E"
  },
  healthy: {
    disease: "Daun Sehat",
    confidence: 95,
    severity: "rendah",
    description: "Daun dalam kondisi sehat, tidak terdeteksi gejala penyakit.",
    symptoms: [
      "Warna hijau merata dan cerah",
      "Permukaan daun halus tanpa bercak",
      "Pertumbuhan normal dan vigor baik",
      "Tidak ada kerusakan atau lesi"
    ],
    treatment: [
      "Tidak diperlukan perawatan khusus",
      "Lanjutkan pemeliharaan rutin",
      "Monitoring berkala untuk deteksi dini penyakit"
    ],
    prevention: [
      "Pemupukan berimbang (NPK + mikronutrien)",
      "Penyiraman teratur sesuai kebutuhan",
      "Pemangkasan sanitasi untuk sirkulasi udara",
      "Monitoring hama dan penyakit secara berkala",
      "Jaga kebersihan area sekitar tanaman"
    ],
    color: "#2ECC71"
  }
};

interface DiseaseDetectorProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToDetector: () => void;
  onNavigateToChatAI: () => void;
  onNavigateToNews: () => void;
  onNavigateToFeedback: () => void;
  onNavigateToContact: () => void;
}

export default function DiseaseDetector({ 
  onLogout, 
  onNavigateToDashboard,
  onNavigateToDetector,
  onNavigateToChatAI,
  onNavigateToNews,
  onNavigateToFeedback,
  onNavigateToContact
}: DiseaseDetectorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar", {
          description: "Maksimal ukuran file adalah 10MB"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setResult(null);
        toast.success("Foto berhasil diupload", {
          description: "Klik 'Deteksi Penyakit' untuk menganalisis"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = () => {
    setIsAnalyzing(true);
    setResult(null);

    // Simulate AI analysis with random disease detection
    setTimeout(() => {
      const diseases = Object.keys(diseaseDatabase);
      const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
      setResult(diseaseDatabase[randomDisease]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      rendah: "bg-green-100 text-green-800 border-green-300",
      sedang: "bg-yellow-100 text-yellow-800 border-yellow-300",
      tinggi: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[severity as keyof typeof colors];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 mb-4">
              <Camera className="w-5 h-5 text-[#F39C12]" />
              <span className="text-gray-700">AI-Powered Detection</span>
            </div>
            <h1 className="text-4xl md:text-5xl text-gray-900 mb-4">
              Deteksi Penyakit Daun Jeruk
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload foto daun jeruk dan dapatkan diagnosa penyakit beserta panduan pengobatan secara instan
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 orange-slice opacity-10 -mr-16 -mt-16" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#2ECC71]" />
                  Upload Foto Daun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedImage ? (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#2ECC71] transition-all hover:bg-green-50 bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-full flex items-center justify-center mb-4">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                      <p className="mb-2 text-gray-700">
                        <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                      </p>
                      <p className="text-gray-500">PNG, JPG atau JPEG (Max. 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                      <img 
                        src={selectedImage} 
                        alt="Uploaded leaf" 
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="flex-1 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Menganalisis...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Deteksi Penyakit
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedImage(null);
                          setResult(null);
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Tips Foto Terbaik</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Gunakan pencahayaan yang cukup</li>
                      <li>Fokus pada bagian daun yang bergejala</li>
                      <li>Foto dari jarak dekat (close-up)</li>
                      <li>Hindari bayangan yang berlebihan</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Result Section */}
            <Card className="relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-32 h-32 orange-slice opacity-10 -ml-16 -mb-16" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-[#F39C12]" />
                  Hasil Deteksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Bug className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-center">
                      Upload foto dan klik "Deteksi Penyakit"<br />untuk melihat hasil analisis
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Disease Name & Confidence */}
                    <div className="p-4 rounded-xl border-2" style={{ borderColor: result.color, backgroundColor: `${result.color}15` }}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl text-gray-900">{result.disease}</h3>
                        <Badge className={getSeverityBadge(result.severity)}>
                          {result.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" style={{ color: result.color }} />
                        <span className="text-gray-700">Confidence: {result.confidence}%</span>
                      </div>
                      <p className="text-gray-600 mt-3">{result.description}</p>
                    </div>

                    {/* Symptoms */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h4 className="text-red-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Gejala yang Terlihat
                      </h4>
                      <ul className="space-y-2">
                        {result.symptoms.map((symptom, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-red-800">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Treatment */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h4 className="text-green-900 mb-3 flex items-center gap-2">
                        <Droplets className="w-5 h-5" />
                        Cara Pengobatan
                      </h4>
                      <ul className="space-y-2">
                        {result.treatment.map((treatment, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-green-800">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{treatment}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prevention */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="text-blue-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Pencegahan
                      </h4>
                      <ul className="space-y-2">
                        {result.prevention.map((prev, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-blue-800">
                            <span className="text-blue-500 mt-1">→</span>
                            <span>{prev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
