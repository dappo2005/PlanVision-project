import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Upload, Camera, AlertCircle, CheckCircle2, Leaf, Droplets, Bug, Eye, ArrowLeft, Home, FileText, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import jsPDF from "jspdf";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.171.214:5000  :5000";

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

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast.error("Tidak ada gambar yang dipilih");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Get user_id from localStorage (assuming it's saved during login)
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).user_id : null;

      // Convert base64 image to File object
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const file = new File([blob], "leaf_image.jpg", { type: "image/jpeg" });

      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      if (userId) {
        formData.append('user_id', userId.toString());
      }

      // Call backend API
      const apiResponse = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      
      // Map API response to our result format
      const mappedResult: DetectionResult = {
        disease: data.disease_info.disease,
        confidence: Math.round(data.top_probability * 100),
        severity: data.disease_info.severity as "rendah" | "sedang" | "tinggi",
        description: data.disease_info.description,
        symptoms: data.disease_info.symptoms,
        treatment: data.disease_info.treatment,
        prevention: data.disease_info.prevention,
        color: getColorForDisease(data.top_class)
      };

      setResult(mappedResult);
      
      // Warning jika confidence rendah
      if (data.top_probability < 0.75) {
        toast.warning("Confidence rendah - Hasil mungkin kurang akurat", {
          description: `Model hanya ${Math.round(data.top_probability * 100)}% yakin. Coba foto dengan pencahayaan lebih baik atau angle berbeda.`
        });
      } else {
        toast.success("Deteksi berhasil!", {
          description: `Terdeteksi: ${data.disease_info.disease} (${Math.round(data.top_probability * 100)}% yakin)`
        });
      }

    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error("Gagal mendeteksi penyakit", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan. Pastikan backend Flask sudah berjalan di port 5000."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getColorForDisease = (className: string): string => {
    const colorMap: Record<string, string> = {
      "Canker": "#E74C3C",
      "Greening": "#F39C12",
      "Melanose": "#9B59B6",
      "Black spot": "#34495E",
      "Healthy": "#2ECC71"
    };
    return colorMap[className] || "#95A5A6";
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      rendah: "bg-green-100 text-green-800 border-green-300",
      sedang: "bg-yellow-100 text-yellow-800 border-yellow-300",
      tinggi: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[severity as keyof typeof colors];
  };

  const exportToPDF = async () => {
    if (!result) {
      toast.error("Tidak ada hasil deteksi untuk diekspor", {
        description: "Silakan upload foto dan lakukan deteksi terlebih dahulu"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header with gradient effect
      doc.setFillColor(46, 204, 113); // #2ECC71
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("PlantVision", margin, 28);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Laporan Hasil Deteksi Penyakit Daun Jeruk", margin, 38);

      yPosition = 55;

      // Date
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Tanggal: ${currentDate}`, margin, yPosition);
      yPosition += 12;

      // Disease Information Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Hasil Deteksi", margin, yPosition);
      yPosition += 10;

      // Calculate available width for text (leave space for image on right if exists)
      const imageAreaWidth = selectedImage ? 75 : 0;
      const textAreaWidth = pageWidth - 2 * margin - imageAreaWidth;

      // Disease Name
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const diseaseLines = doc.splitTextToSize(result.disease, textAreaWidth);
      if (Array.isArray(diseaseLines)) {
        diseaseLines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });
      } else {
        doc.text(diseaseLines, margin, yPosition);
        yPosition += 7;
      }
      yPosition += 5;

      // Severity and Confidence
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const severityText = `Tingkat Keparahan: ${result.severity.toUpperCase()}`;
      doc.text(severityText, margin, yPosition);
      yPosition += 7;

      const confidenceText = `Tingkat Keyakinan: ${result.confidence}%`;
      doc.text(confidenceText, margin, yPosition);
      yPosition += 10;

      // Description
      doc.setFontSize(11);
      // Use textAreaWidth to avoid overlapping with image
      const descriptionLines = doc.splitTextToSize(result.description, textAreaWidth);
      if (Array.isArray(descriptionLines)) {
        descriptionLines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });
      } else {
        doc.text(descriptionLines, margin, yPosition);
        yPosition += 7;
      }
      yPosition += 10;

      // Add uploaded image on the right side (after text content starts)
      if (selectedImage) {
        try {
          // Create a promise to load the image
          const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = src;
            });
          };

          const img = await loadImage(selectedImage);
          
          // Calculate image dimensions to fit in PDF
          const maxWidth = 60;
          const maxHeight = 80;
          let imgWidth = img.width;
          let imgHeight = img.height;
          
          // Scale image to fit
          const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
          imgWidth = imgWidth * ratio;
          imgHeight = imgHeight * ratio;
          
          // Position image on the right side, starting from after header
          const imageX = pageWidth - margin - imgWidth;
          const imageY = 55; // Start from same position as date
          
          // Draw a border around image
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.rect(imageX - 2, imageY - 2, imgWidth + 4, imgHeight + 15);
          
          // Add image to PDF
          doc.addImage(selectedImage, 'JPEG', imageX, imageY, imgWidth, imgHeight);
          
          // Add label below image
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.setFont("helvetica", "normal");
          doc.text("Foto Daun", imageX + imgWidth / 2, imageY + imgHeight + 8, { align: 'center' });
        } catch (imgError) {
          console.error("Error adding image to PDF:", imgError);
          // Continue without image if there's an error
        }
      }

      // Check if we need a new page before symptoms
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      // Symptoms Section
      // Note: Image area is only at top, so full width can be used for content below
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 53, 69); // Red
      doc.text("Gejala yang Terlihat", margin, yPosition);
      yPosition += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      // Full width available for symptoms (image is only at top)
      const contentWidth = pageWidth - 2 * margin;
      const lineHeight = 6;
      result.symptoms.forEach((symptom, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }
        // Use simple dash instead of bullet for better compatibility
        const symptomText = `- ${symptom}`;
        // Split text and add line by line to ensure proper rendering
        const symptomLines = doc.splitTextToSize(symptomText, contentWidth);
        if (Array.isArray(symptomLines)) {
          symptomLines.forEach((line: string, lineIndex: number) => {
            if (yPosition > pageHeight - 40) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
        } else {
          doc.text(symptomLines, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += 2; // Add spacing between items
      });
      yPosition += 5;

      // Check if we need a new page before treatment
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      // Treatment Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 167, 69); // Green
      doc.text("Cara Pengobatan", margin, yPosition);
      yPosition += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      result.treatment.forEach((treatment, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }
        // Use simple number instead of checkmark for better compatibility
        const treatmentText = `${index + 1}. ${treatment}`;
        // Split text and add line by line to ensure proper rendering
        const treatmentLines = doc.splitTextToSize(treatmentText, contentWidth);
        if (Array.isArray(treatmentLines)) {
          treatmentLines.forEach((line: string, lineIndex: number) => {
            if (yPosition > pageHeight - 40) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
        } else {
          doc.text(treatmentLines, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += 2; // Add spacing between items
      });
      yPosition += 5;

      // Check if we need a new page before prevention
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      // Prevention Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 123, 255); // Blue
      doc.text("Pencegahan", margin, yPosition);
      yPosition += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      result.prevention.forEach((prev, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }
        // Use simple number instead of arrow for better compatibility
        const prevText = `${index + 1}. ${prev}`;
        // Split text and add line by line to ensure proper rendering
        const prevLines = doc.splitTextToSize(prevText, contentWidth);
        if (Array.isArray(prevLines)) {
          prevLines.forEach((line: string, lineIndex: number) => {
            if (yPosition > pageHeight - 40) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
        } else {
          doc.text(prevLines, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += 2; // Add spacing between items
      });

      // Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Halaman ${i} dari ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          "© 2025 PlantVision - Platform IoT & Machine Learning untuk Deteksi Penyakit Daun Jeruk",
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `Hasil_Deteksi_${result.disease.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success("PDF berhasil diekspor", {
        description: `File ${fileName} telah diunduh`
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Gagal mengekspor PDF", {
        description: "Terjadi kesalahan saat membuat file PDF"
      });
    }
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-[#F39C12]" />
                    Hasil Deteksi
                  </CardTitle>
                  {result && (
                    <Button
                      onClick={exportToPDF}
                      className="bg-[#2ECC71] hover:bg-[#27AE60] text-white shadow-md hover:shadow-lg transition-all"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  )}
                </div>
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

