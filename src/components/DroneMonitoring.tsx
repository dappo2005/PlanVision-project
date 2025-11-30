import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { 
  Camera, 
  Radio, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Wifi,
  WifiOff,
  Zap,
  Play,
  TestTube,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

// Default ke localhost, user bisa ubah di UI
const DEFAULT_API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface DetectionResult {
  disease: string;
  confidence: number;
  severity: "rendah" | "sedang" | "tinggi";
  description: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  color: string;
  class: string;
}

interface DroneMonitoringProps {
  onNavigateToDashboard?: () => void;
}

// Fungsi-fungsi ini akan didefinisikan di dalam component untuk menggunakan apiUrl state

export default function DroneMonitoring({ onNavigateToDashboard }: DroneMonitoringProps) {
  const navigate = useNavigate();
  
  // Auto-detect: coba localhost dulu, jika gagal bisa ubah manual
  const [apiUrl, setApiUrl] = useState(() => {
    // Cek dari localStorage dulu (jika user sudah set sebelumnya)
    const saved = localStorage.getItem('drone_monitoring_api_url');
    return saved || DEFAULT_API_URL;
  });
  
  // Save ke localStorage saat berubah
  useEffect(() => {
    if (apiUrl) {
      localStorage.setItem('drone_monitoring_api_url', apiUrl);
    }
  }, [apiUrl]);
  
  // Auto-detect localhost saat component mount
  useEffect(() => {
    const testLocalhost = async () => {
      // Jika apiUrl bukan localhost, coba test localhost dulu
      if (apiUrl !== "http://localhost:5000" && apiUrl !== DEFAULT_API_URL) {
        try {
          const testResponse = await fetch("http://localhost:5000/api/dataset/random-stream", {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 detik timeout
          });
          if (testResponse.ok) {
            // Localhost bisa diakses! Update ke localhost
            setApiUrl("http://localhost:5000");
            toast.success("Backend terdeteksi di localhost:5000", {
              description: "URL backend otomatis diubah ke localhost"
            });
          }
        } catch (error) {
          // Localhost tidak bisa diakses, tetap pakai URL yang ada
          console.log("Localhost tidak bisa diakses, menggunakan URL:", apiUrl);
        }
      }
    };
    
    // Test setelah 1 detik (biarkan component render dulu)
    const timer = setTimeout(testLocalhost, 1000);
    return () => clearTimeout(timer);
  }, []); // Hanya sekali saat mount
  const [isSimulationMode, setIsSimulationMode] = useState(true); // Default: simulasi mode
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [droneIp, setDroneIp] = useState("192.168.4.1"); // Default ESP32 Access Point IP
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentDummyImageIndex, setCurrentDummyImageIndex] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const streamRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoDetectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State untuk auto-detect hasil (reminder di live stream)
  const [autoDetectResult, setAutoDetectResult] = useState<DetectionResult | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true); // Toggle untuk enable/disable auto-detect
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true); // Auto-capture saat terdeteksi
  const pendingDetectionRef = useRef<boolean>(false);
  const lastDetectedImageUrlRef = useRef<string>(""); // Track gambar yang sudah dideteksi untuk mencegah double
  
  // Fungsi untuk mendapatkan URL gambar dari dataset
  const getDummyStreamImageUrl = () => {
    return `${apiUrl}/api/dataset/random-stream?t=${Date.now()}`;
  };

  const getDummyCaptureImageUrl = () => {
    return `${apiUrl}/api/dataset/random-capture?t=${Date.now()}`;
  };
  
  // State untuk menyimpan URL gambar yang sedang ditampilkan di stream
  const [currentStreamImageUrl, setCurrentStreamImageUrl] = useState<string>("");

  // Fungsi untuk mendapatkan warna berdasarkan penyakit
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

  // Fungsi untuk mendapatkan severity badge
  const getSeverityBadge = (severity: string) => {
    const colors = {
      rendah: "bg-green-100 text-green-800 border-green-300",
      sedang: "bg-yellow-100 text-yellow-800 border-yellow-300",
      tinggi: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[severity as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Start/Stop Live Stream
  const toggleStream = () => {
    if (isStreaming) {
      // Stop stream
      setIsStreaming(false);
      setStreamUrl("");
      setConnectionStatus("disconnected");
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
      toast.info("Live stream dihentikan");
    } else {
      if (isSimulationMode) {
        // Mode simulasi: gunakan gambar dari dataset lokal
        setIsStreaming(true);
        setConnectionStatus("connecting");
        setIsLoadingImage(true);
        setStreamError(null);
        
        // Test endpoint dengan timeout pendek (5 detik)
        const testUrl = getDummyStreamImageUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 detik timeout
        
        fetch(testUrl, { signal: controller.signal })
          .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            // Jika berhasil, set URL langsung tanpa menunggu load
            setStreamUrl(testUrl);
            setConnectionStatus("connected");
            setIsLoadingImage(false);
            
            // Simulasi stream dengan mengubah gambar setiap 10 detik
            const updateStreamImage = () => {
              // Clear hasil deteksi lama saat gambar akan berubah
              setAutoDetectResult(null);
              
              // Reset tracking agar gambar baru bisa dideteksi
              lastDetectedImageUrlRef.current = "";
              
              const newUrl = getDummyStreamImageUrl();
              setStreamUrl(newUrl);
              setCurrentStreamImageUrl(newUrl); // Simpan URL gambar yang sedang ditampilkan
              setCurrentDummyImageIndex((prev) => prev + 1);
            };
            
            // Set gambar pertama
            updateStreamImage();
            
            // Update setiap 10 detik (sesuai permintaan user)
            streamIntervalRef.current = setInterval(updateStreamImage, 10000);
            
            toast.success("Mode Simulasi Aktif", {
              description: "Menggunakan gambar dari dataset lokal untuk simulasi stream"
            });
          })
          .catch(error => {
            clearTimeout(timeoutId);
            console.error("Error testing endpoint:", error);
            setConnectionStatus("disconnected");
            setIsStreaming(false);
            setIsLoadingImage(false);
            
            if (error.name === 'AbortError') {
              setStreamError("Timeout: Backend tidak merespons dalam 5 detik");
              toast.error("Koneksi timeout", {
                description: `Backend di ${apiUrl} tidak merespons. Coba ubah URL backend atau pastikan Flask berjalan.`,
                duration: 10000
              });
            } else {
              setStreamError(`Tidak bisa akses backend: ${error.message}`);
              toast.error("Gagal menghubungkan ke backend", {
                description: `Pastikan backend Flask berjalan di ${apiUrl}. Error: ${error.message}`,
                duration: 10000
              });
            }
          });
      } else {
        // Mode real: koneksi ke ESP32
        if (!droneIp || droneIp.trim() === "") {
          toast.error("IP Drone tidak boleh kosong", {
            description: "Masukkan IP address ESP32 drone (contoh: 192.168.4.1)"
          });
          return;
        }

        // ESP32-CAM biasanya menggunakan endpoint /stream atau /mjpeg
        const streamEndpoint = `http://${droneIp}/stream`;
        setStreamUrl(streamEndpoint);
        setIsStreaming(true);
        setConnectionStatus("connecting");
        
        // Test koneksi
        testConnection(streamEndpoint);
      }
    }
  };

  // Test koneksi ke ESP32
  const testConnection = async (url: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // ESP32 mungkin tidak support CORS
      });
      
      clearTimeout(timeoutId);
      setConnectionStatus("connected");
      toast.success("Terhubung ke drone!", {
        description: "Live stream aktif"
      });
    } catch (error) {
      // Jika gagal, tetap coba tampilkan stream (karena mungkin CORS issue)
      setConnectionStatus("connected");
      toast.warning("Koneksi terdeteksi (mungkin ada masalah CORS)", {
        description: "Stream akan tetap dicoba ditampilkan"
      });
    }
  };

  // Capture foto dari stream dan kirim ke API
  const captureAndDetect = async () => {
    if (!isStreaming) {
      toast.error("Live stream belum aktif", {
        description: "Aktifkan live stream terlebih dahulu"
      });
      return;
    }

    setIsDetecting(true);
    setDetectionResult(null);
    setCapturedImage(null);

    try {
      let imageBlob: Blob;
      
      if (isSimulationMode) {
        // Mode simulasi: ambil gambar yang SAMA dengan yang sedang ditampilkan di stream
        // PENTING: Capture dari gambar yang sedang terlihat di layar, bukan random baru!
        
        if (streamRef.current && streamRef.current.complete && streamRef.current.naturalWidth > 0) {
          // Method 1: Capture dari canvas (gambar yang sedang ditampilkan di layar)
          const canvas = canvasRef.current;
          const img = streamRef.current;
          
          if (canvas) {
            // Set canvas size sesuai dengan gambar
            canvas.width = img.naturalWidth || 640;
            canvas.height = img.naturalHeight || 480;
            
            // Draw gambar yang sedang ditampilkan ke canvas
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              
              // Convert to blob
              imageBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error("Gagal convert canvas ke blob"));
                  }
                }, 'image/jpeg', 0.95);
              });
              
              toast.info("Mode Simulasi: Mengambil foto dari stream", {
                description: "Menggunakan gambar yang sedang ditampilkan di live stream"
              });
            } else {
              throw new Error("Tidak bisa mendapatkan canvas context");
            }
          } else {
            throw new Error("Canvas tidak tersedia");
          }
        } else {
          // Fallback: Fetch URL yang sama dengan yang di stream
          const captureUrl = currentStreamImageUrl || streamUrl || getDummyStreamImageUrl();
          
          toast.info("Mode Simulasi: Mengambil foto dari stream", {
            description: "Menggunakan gambar yang sedang ditampilkan di live stream"
          });
          
          // Fetch gambar yang SAMA dengan yang di stream
          const response = await fetch(captureUrl);
          if (!response.ok) {
            throw new Error("Gagal mengambil gambar dari dataset. Pastikan backend berjalan dan dataset ada di folder data/plantvision_dataset");
          }
          imageBlob = await response.blob();
        }
      } else {
        // Mode real: ambil dari ESP32
        // Method 1: Ambil foto langsung dari ESP32 (jika ada endpoint capture)
        const captureUrl = `http://${droneIp}/capture`;
        
        try {
          // Coba ambil dari endpoint capture (resolusi tinggi)
          const captureResponse = await fetch(captureUrl, {
            mode: 'no-cors' // ESP32 mungkin tidak support CORS
          });
          
          if (!captureResponse.ok) {
            throw new Error("Capture endpoint tidak tersedia, menggunakan canvas capture");
          }
          
          imageBlob = await captureResponse.blob();
        } catch (error) {
          // Fallback: Capture dari canvas (dari stream yang sedang berjalan)
          if (!streamRef.current) {
            throw new Error("Stream element tidak tersedia");
          }
          
          const canvas = canvasRef.current;
          const video = streamRef.current;
          
          if (!canvas) {
            throw new Error("Canvas tidak tersedia");
          }

          // Set canvas size - untuk img element, gunakan naturalWidth/naturalHeight
          const imgWidth = video.naturalWidth || 640;
          const imgHeight = video.naturalHeight || 480;
          canvas.width = imgWidth;
          canvas.height = imgHeight;
          
          // Draw current frame
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error("Tidak bisa mendapatkan canvas context");
          }
          
          // Pastikan gambar sudah loaded sebelum draw
          if (video.complete && video.naturalWidth > 0) {
            ctx.drawImage(video, 0, 0);
          } else {
            throw new Error("Gambar stream belum siap");
          }
          
          // Convert to blob
          imageBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Gagal convert canvas ke blob"));
              }
            }, 'image/jpeg', 0.95);
          });
        }
      }

      // Tampilkan preview gambar yang di-capture
      const imageUrl = URL.createObjectURL(imageBlob);
      setCapturedImage(imageUrl);

      // Buat File object untuk dikirim ke API
      const file = new File([imageBlob], "drone_capture.jpg", { type: "image/jpeg" });

      // Get user_id from localStorage
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).user_id : null;

      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      if (userId) {
        formData.append('user_id', userId.toString());
      }

      // Kirim ke API /api/predict
      const apiResponse = await fetch(`${apiUrl}/api/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `API error: ${apiResponse.status}`;
        
        // Jika error karena TensorFlow tidak terinstall, gunakan mock data untuk simulasi
        if (isSimulationMode && (errorMessage.includes("TensorFlow") || errorMessage.includes("Model AI belum siap"))) {
          toast.warning("TensorFlow tidak terinstall, menggunakan data simulasi", {
            description: "Hasil deteksi menggunakan data dummy untuk testing UI"
          });
          
          // Gunakan mock data berdasarkan gambar yang diambil (rotate setiap kali)
          const mockDiseases = [
            { 
              class: "Canker", 
              disease: "Citrus Canker (Kanker Jeruk)", 
              confidence: 87, 
              severity: "tinggi" as const,
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
                "Isolasi tanaman yang terinfeksi dari tanaman sehat"
              ],
              prevention: [
                "Gunakan bibit yang bersertifikat bebas penyakit",
                "Hindari pemangkasan saat musim hujan",
                "Jaga jarak tanam yang cukup (minimal 5-6 meter)",
                "Sanitasi alat pangkas dengan disinfektan"
              ]
            },
            { 
              class: "Greening", 
              disease: "Citrus Greening (Huanglongbing/HLB)", 
              confidence: 92, 
              severity: "tinggi" as const,
              description: "Penyakit mematikan yang disebabkan oleh bakteri Candidatus Liberibacter asiaticus, ditularkan oleh kutu Diaphorina citri.",
              symptoms: [
                "Daun menguning tidak merata (blotchy mottle)",
                "Tulang daun tetap hijau saat daun menguning",
                "Buah kecil, asimetris, dan tidak matang sempurna",
                "Ranting mengering dari ujung ke pangkal"
              ],
              treatment: [
                "TIDAK ADA OBAT - Segera cabut dan musnahkan tanaman terinfeksi",
                "Kendalikan vektor kutu dengan insektisida sistemik",
                "Aplikasi antibiotik Oxytetracycline untuk memperlambat gejala",
                "Tingkatkan nutrisi tanaman dengan pemupukan berimbang"
              ],
              prevention: [
                "Gunakan bibit bebas penyakit dari sumber terpercaya",
                "Pasang perangkap kuning untuk monitoring kutu",
                "Semprot insektisida secara rutin (interval 2 minggu)",
                "Lakukan roguing (pencabutan) tanaman terinfeksi segera"
              ]
            },
            { 
              class: "Melanose", 
              disease: "Melanose", 
              confidence: 85, 
              severity: "sedang" as const,
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
                "Pangkas ranting yang mati untuk mengurangi inokulum"
              ],
              prevention: [
                "Pemangkasan untuk meningkatkan sirkulasi udara",
                "Hindari penyiraman dari atas (overhead irrigation)",
                "Bersihkan sisa-sisa tanaman yang gugur",
                "Aplikasi fungisida preventif saat musim hujan"
              ]
            },
            { 
              class: "Black spot", 
              disease: "Black Spot (Bercak Hitam)", 
              confidence: 88, 
              severity: "sedang" as const,
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
                "Kumpulkan dan musnahkan buah yang terinfeksi"
              ],
              prevention: [
                "Sanitasi kebun dengan membuang buah gugur",
                "Pemangkasan untuk meningkatkan penetrasi cahaya",
                "Hindari kelembaban berlebih",
                "Rotasi fungisida untuk menghindari resistensi"
              ]
            },
            { 
              class: "Healthy", 
              disease: "Daun Sehat", 
              confidence: 95, 
              severity: "rendah" as const,
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
                "Monitoring hama dan penyakit secara berkala"
              ]
            },
          ];
          
          // Pilih berdasarkan index (rotate setiap kali)
          const mockResult = mockDiseases[currentDummyImageIndex % mockDiseases.length];
          
          const mockData: DetectionResult = {
            disease: mockResult.disease,
            confidence: mockResult.confidence,
            severity: mockResult.severity,
            description: mockResult.description,
            symptoms: mockResult.symptoms,
            treatment: mockResult.treatment,
            prevention: mockResult.prevention,
            color: getColorForDisease(mockResult.class),
            class: mockResult.class
          };
          
          setDetectionResult(mockData);
          toast.success("Deteksi simulasi berhasil!", {
            description: `Terdeteksi: ${mockResult.disease} (${mockResult.confidence}% - Data Dummy untuk Testing)`
          });
          return; // Exit early, tidak perlu lanjut ke API
        }
        
        throw new Error(errorMessage);
      }

      const data = await apiResponse.json();
      
      // Parse confidence
      const confidenceValue = parseFloat(data.confidence.replace('%', ''));
      
      // Map API response ke format DetectionResult
      const mappedResult: DetectionResult = {
        disease: data.disease_info.disease,
        confidence: Math.round(confidenceValue),
        severity: data.disease_info.severity as "rendah" | "sedang" | "tinggi",
        description: data.disease_info.description,
        symptoms: data.disease_info.symptoms,
        treatment: data.disease_info.treatment,
        prevention: data.disease_info.prevention,
        color: getColorForDisease(data.class),
        class: data.class
      };

      setDetectionResult(mappedResult);
      
      // Notifikasi hasil
      if (confidenceValue < 75) {
        toast.warning("Confidence rendah", {
          description: `Model hanya ${Math.round(confidenceValue)}% yakin. Coba posisikan drone lebih dekat.`
        });
      } else {
        toast.success("Deteksi berhasil!", {
          description: `Terdeteksi: ${data.disease_info.disease} (${Math.round(confidenceValue)}% yakin)`
        });
      }

    } catch (error) {
      console.error("Error capturing and detecting:", error);
      toast.error("Gagal mengambil foto atau mendeteksi", {
        description: error instanceof Error ? error.message : "Pastikan drone terhubung dan backend Flask berjalan"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle stream load error
  const handleStreamError = (e?: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e?.currentTarget;
    const imgSrc = img?.src || streamUrl;
    console.error("Error loading image:", imgSrc);
    setIsLoadingImage(false);
    
    if (!isSimulationMode) {
      setConnectionStatus("disconnected");
      setStreamError("Gagal memuat live stream dari ESP32");
      toast.error("Gagal memuat live stream", {
        description: "Pastikan IP drone benar dan ESP32 sudah menyala"
      });
    } else {
      // Mode simulasi: coba reload gambar jika error
      setStreamError("Gagal memuat gambar dari dataset. Pastikan backend berjalan dan dataset ada.");
      console.error("Gambar dari dataset mungkin belum siap atau endpoint error");
      
      // Test endpoint
      fetch(getDummyStreamImageUrl())
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.blob();
        })
        .then(() => {
          // Retry dengan gambar yang berbeda
          setTimeout(() => {
            if (isStreaming && isSimulationMode) {
              setStreamUrl(getDummyStreamImageUrl());
              setStreamError(null);
              setIsLoadingImage(true);
            }
          }, 1000);
        })
        .catch(error => {
          console.error("Endpoint test failed:", error);
              toast.error("Backend endpoint error", {
                description: `Tidak bisa akses /api/dataset/random-stream. Pastikan backend Flask berjalan di ${apiUrl}`
              });
        });
    }
  };

  // Handle stream load success - Trigger auto-detect saat gambar baru muncul (1 gambar = 1 deteksi)
  const handleStreamLoad = () => {
    setIsLoadingImage(false);
    setStreamError(null);
    if (connectionStatus === "connecting") {
      setConnectionStatus("connected");
    }
    
    // Saat gambar baru muncul, cek apakah ini gambar baru (belum dideteksi)
    if (isStreaming && autoDetectEnabled && streamRef.current) {
      const currentImageUrl = streamRef.current.src || streamUrl;
      
      // Jika ini gambar yang sama dengan yang sudah dideteksi, skip
      if (currentImageUrl === lastDetectedImageUrlRef.current) {
        return;
      }
      
      // Ini gambar baru! Clear hasil deteksi lama dan trigger deteksi baru
      setAutoDetectResult(null);
      lastDetectedImageUrlRef.current = currentImageUrl; // Mark gambar ini sudah akan dideteksi
      
      // Trigger auto-detect untuk gambar yang baru (delay sedikit untuk memastikan gambar sudah fully loaded)
      setTimeout(() => {
        if (isStreaming && autoDetectEnabled && streamRef.current?.complete) {
          performAutoDetect();
        }
      }, 500);
    }
  };

  // Auto-detect: Deteksi penyakit 1 kali per gambar (1 gambar = 1 deteksi)
  const performAutoDetect = async () => {
    // Skip jika request sebelumnya masih pending
    if (pendingDetectionRef.current) {
      return;
    }

    if (!isStreaming || !autoDetectEnabled || !streamRef.current) {
      return;
    }

    // Pastikan gambar sudah loaded
    if (!streamRef.current.complete || streamRef.current.naturalWidth === 0) {
      return;
    }

    // Cek apakah gambar ini sudah dideteksi
    const currentImageUrl = streamRef.current.src || streamUrl;
    if (currentImageUrl === lastDetectedImageUrlRef.current && autoDetectResult) {
      // Gambar ini sudah dideteksi, skip
      return;
    }

    pendingDetectionRef.current = true;
    setIsAutoDetecting(true);

    try {
      // Capture frame dari stream ke canvas
      const canvas = canvasRef.current;
      const img = streamRef.current;
      
      if (!canvas) {
        return;
      }

      // Set canvas size
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      
      // Draw gambar ke canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob      
      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Gagal convert canvas ke blob"));
          }
        }, 'image/jpeg', 0.85);
      });

      // Buat File object
      const file = new File([imageBlob], "auto_detect.jpg", { type: "image/jpeg" });
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).user_id : null;

      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      if (userId) {
        formData.append('user_id', userId.toString());
      }

      // Kirim ke API
      const apiResponse = await fetch(`${apiUrl}/api/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        // Jika error, coba gunakan mock data untuk testing (hanya di mode simulasi)
        if (isSimulationMode) {
          console.log("API error, menggunakan mock data untuk testing");
          // Mock data untuk testing - random disease
          const mockDiseases = [
            { 
              class: "Canker", 
              disease: "Citrus Canker (Kanker Jeruk)", 
              confidence: 87, 
              severity: "tinggi" as const,
              description: "Penyakit bakteri yang menyebabkan lesi pada daun, buah, dan ranting jeruk.",
              symptoms: ["Bercak coklat dengan lingkaran kuning", "Permukaan daun menonjol"],
              treatment: ["Pangkas bagian terinfeksi", "Semprot bakterisida"],
              prevention: ["Gunakan bibit bersertifikat", "Jaga jarak tanam"]
            },
            { 
              class: "Greening", 
              disease: "Citrus Greening (HLB)", 
              confidence: 92, 
              severity: "tinggi" as const,
              description: "Penyakit mematikan yang disebabkan oleh bakteri.",
              symptoms: ["Daun menguning tidak merata", "Buah kecil dan asimetris"],
              treatment: ["Cabut tanaman terinfeksi", "Kendalikan vektor kutu"],
              prevention: ["Gunakan bibit bebas penyakit", "Pasang perangkap kuning"]
            }
          ];
          
          // Random pilih mock disease (untuk testing)
          const randomMock = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
          const mockResult: DetectionResult = {
            disease: randomMock.disease,
            confidence: randomMock.confidence,
            severity: randomMock.severity,
            description: randomMock.description,
            symptoms: randomMock.symptoms,
            treatment: randomMock.treatment,
            prevention: randomMock.prevention,
            color: getColorForDisease(randomMock.class),
            class: randomMock.class
          };
          
          setAutoDetectResult(mockResult);
          toast.info("⚠️ POTENSI PENYAKIT TERDETEKSI! (Mock Data)", {
            description: `${mockResult.disease} (${mockResult.confidence}% yakin)`,
            duration: 3000
          });
        }
        return;
      }

      const data = await apiResponse.json();
      console.log("Auto-detect response:", data); // Debug log
      
      const confidenceValue = parseFloat(data.confidence.replace('%', ''));
      console.log("Confidence value:", confidenceValue, "Class:", data.class); // Debug log
      
      // Hanya tampilkan reminder jika confidence >= 70% dan bukan "Sehat"
      if (confidenceValue >= 70 && data.class !== "Sehat") {
        const mappedResult: DetectionResult = {
          disease: data.disease_info.disease,
          confidence: Math.round(confidenceValue),
          severity: data.disease_info.severity as "rendah" | "sedang" | "tinggi",
          description: data.disease_info.description,
          symptoms: data.disease_info.symptoms,
          treatment: data.disease_info.treatment,
          prevention: data.disease_info.prevention,
          color: getColorForDisease(data.class),
          class: data.class
        };

        console.log("Setting autoDetectResult:", mappedResult); // Debug log
        setAutoDetectResult(mappedResult);
        
        // Mark gambar ini sudah dideteksi
        const currentImageUrl = streamRef.current?.src || streamUrl;
        lastDetectedImageUrlRef.current = currentImageUrl;
        
        // Tampilkan notifikasi
        toast.info("⚠️ POTENSI PENYAKIT TERDETEKSI!", {
          description: `${data.disease_info.disease} (${Math.round(confidenceValue)}% yakin)`,
          duration: 3000
        });

        // Auto-capture jika enabled dan confidence tinggi
        if (autoCaptureEnabled && confidenceValue >= 80) {
          // Delay sedikit untuk memastikan overlay sudah muncul
          setTimeout(() => {
            handleAutoCapture(mappedResult);
          }, 1000);
        }
      } else {
        // Jika sehat atau confidence rendah, clear reminder tapi tetap mark gambar sudah dideteksi
        console.log("No disease detected or low confidence:", confidenceValue, data.class);
        setAutoDetectResult(null);
        
        // Mark gambar ini sudah dideteksi (meskipun tidak ada penyakit)
        const currentImageUrl = streamRef.current?.src || streamUrl;
        lastDetectedImageUrlRef.current = currentImageUrl;
      }
    } catch (error) {
      // Log error untuk debug
      console.error("Auto-detect error:", error);
      
      // Di mode simulasi, gunakan mock data jika error
      if (isSimulationMode) {
        const mockResult: DetectionResult = {
          disease: "Citrus Canker (Kanker Jeruk)",
          confidence: 85,
          severity: "tinggi",
          description: "Penyakit bakteri yang menyebabkan lesi pada daun.",
          symptoms: ["Bercak coklat", "Daun menonjol"],
          treatment: ["Pangkas bagian terinfeksi"],
          prevention: ["Gunakan bibit bersertifikat"],
          color: getColorForDisease("Canker"),
          class: "Canker"
        };
        setAutoDetectResult(mockResult);
        toast.info("⚠️ POTENSI PENYAKIT TERDETEKSI! (Mock - Testing)", {
          description: `${mockResult.disease} (${mockResult.confidence}% yakin)`,
          duration: 3000
        });
      }
    } finally {
      setIsAutoDetecting(false);
      pendingDetectionRef.current = false;
    }
  };

  // Auto-capture saat penyakit terdeteksi
  const handleAutoCapture = async (result: DetectionResult) => {
    if (!streamRef.current || !streamRef.current.complete) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const img = streamRef.current;
      
      if (!canvas) {
        return;
      }

      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Gagal convert canvas ke blob"));
          }
        }, 'image/jpeg', 0.95);
      });
      
      // Convert blob ke base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // Simpan hasil deteksi ke localStorage (hanya field yang diperlukan oleh DiseaseDetector)
        const resultForStorage = {
          disease: result.disease,
          confidence: result.confidence,
          severity: result.severity,
          description: result.description,
          symptoms: result.symptoms,
          treatment: result.treatment,
          prevention: result.prevention,
          color: result.color
        };
        
        localStorage.setItem('drone_detection_result', JSON.stringify({
          image: base64String,
          result: resultForStorage,
          autoCaptured: true
        }));
        
        // Redirect ke halaman deteksi
        toast.success("Foto otomatis diambil!", {
          description: "Mengarahkan ke halaman deteksi..."
        });
        
        setTimeout(() => {
          navigate('/disease-detector');
        }, 1000);
      };
      reader.readAsDataURL(imageBlob);
    } catch (error) {
      console.error("Auto-capture error:", error);
    }
  };

  // Fungsi untuk handle klik overlay reminder -> auto-capture dan redirect
  const handleReminderClick = async () => {
    if (!autoDetectResult) return;
    
    // Auto-capture dan redirect ke halaman deteksi
    toast.info("Mengambil foto dan mengarahkan ke halaman deteksi...");
    
    // Capture gambar
    try {
      let imageBlob: Blob;
      
      if (streamRef.current && streamRef.current.complete && streamRef.current.naturalWidth > 0) {
        const canvas = canvasRef.current;
        const img = streamRef.current;
        
        if (canvas) {
          canvas.width = img.naturalWidth || 640;
          canvas.height = img.naturalHeight || 480;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            
            imageBlob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("Gagal convert canvas ke blob"));
                }
              }, 'image/jpeg', 0.95);
            });
            
            // Convert blob ke base64 untuk dikirim ke halaman deteksi
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              
              // Simpan hasil deteksi ke localStorage untuk halaman deteksi (hanya field yang diperlukan)
              const resultForStorage = {
                disease: autoDetectResult.disease,
                confidence: autoDetectResult.confidence,
                severity: autoDetectResult.severity,
                description: autoDetectResult.description,
                symptoms: autoDetectResult.symptoms,
                treatment: autoDetectResult.treatment,
                prevention: autoDetectResult.prevention,
                color: autoDetectResult.color
              };
              
              localStorage.setItem('drone_detection_result', JSON.stringify({
                image: base64String,
                result: resultForStorage,
                autoCaptured: false // Manual click
              }));
              
              // Redirect ke halaman deteksi
              navigate('/disease-detector');
            };
            reader.readAsDataURL(imageBlob);
          }
        }
      }
    } catch (error) {
      toast.error("Gagal mengambil foto", {
        description: "Silakan coba lagi"
      });
    }
  };

  // Cleanup interval saat component unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      if (autoDetectIntervalRef.current) {
        clearInterval(autoDetectIntervalRef.current);
      }
    };
  }, []);

  // Reset detection tracking saat stream stop
  useEffect(() => {
    if (!isStreaming) {
      setAutoDetectResult(null);
      pendingDetectionRef.current = false;
      lastDetectedImageUrlRef.current = ""; // Reset tracking
    }
  }, [isStreaming]);

  return (
    <>
      {/* CSS Animations untuk overlay */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-[#2ECC71] to-[#F39C12] text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl md:text-3xl flex items-center gap-3">
                  <Radio className="w-8 h-8" />
                  Drone Monitoring Dashboard
                </CardTitle>
                <p className="text-white/90 mt-2">
                  Live monitoring dan deteksi penyakit daun jeruk menggunakan drone IoT
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Connection Settings */}
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wifi className="w-6 h-6 text-blue-600" />
              <span className="text-gray-900">Pengaturan Koneksi</span>
              {isSimulationMode && !isStreaming && (
                <Badge className="ml-auto bg-blue-500 text-white animate-pulse">
                  Klik "START DEMO" di bawah →
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mode Toggle */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TestTube className="w-5 h-5 text-blue-600" />
                  <div>
                    <label className="text-sm font-semibold text-gray-900 cursor-pointer">
                      Mode Simulasi (Demo)
                    </label>
                    <p className="text-xs text-gray-600">
                      Aktifkan untuk testing tanpa drone fisik
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (isStreaming) {
                      toggleStream(); // Stop stream dulu
                    }
                    setIsSimulationMode(!isSimulationMode);
                    toast.info(
                      !isSimulationMode 
                        ? "Mode Simulasi diaktifkan" 
                        : "Mode Real diaktifkan",
                      {
                        description: !isSimulationMode 
                          ? "Menggunakan gambar dummy untuk testing" 
                          : "Akan terhubung ke ESP32 drone"
                      }
                    );
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isSimulationMode ? "bg-[#2ECC71]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isSimulationMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Auto-Detect Toggle */}
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-green-600" />
                  <div>
                    <label className="text-sm font-semibold text-gray-900 cursor-pointer">
                      Real-Time Auto-Detect Penyakit
                    </label>
                    <p className="text-xs text-gray-600">
                      Deteksi otomatis 1 kali per gambar (setiap 10 detik) dan tampilkan reminder jika terdeteksi penyakit
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAutoDetectEnabled(!autoDetectEnabled);
                    if (!autoDetectEnabled) {
                      setAutoDetectResult(null); // Clear reminder saat disable
                      lastDetectedImageUrlRef.current = ""; // Reset tracking
                    }
                    toast.info(
                      !autoDetectEnabled 
                        ? "Auto-Detect diaktifkan" 
                        : "Auto-Detect dinonaktifkan",
                      {
                        description: !autoDetectEnabled 
                          ? "Sistem akan mendeteksi penyakit 1 kali per gambar baru" 
                          : "Reminder penyakit tidak akan muncul otomatis"
                      }
                    );
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoDetectEnabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoDetectEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Auto-Capture Toggle */}
              {autoDetectEnabled && (
                <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-green-600" />
                    <div>
                      <label className="text-xs font-medium text-gray-700 cursor-pointer">
                        Auto-Capture saat Terdeteksi
                      </label>
                      <p className="text-xs text-gray-500">
                        Otomatis ambil foto dan redirect jika confidence ≥ 80%
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAutoCaptureEnabled(!autoCaptureEnabled);
                      toast.info(
                        !autoCaptureEnabled 
                          ? "Auto-Capture diaktifkan" 
                          : "Auto-Capture dinonaktifkan",
                        { duration: 1500 }
                      );
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      autoCaptureEnabled ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        autoCaptureEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Backend URL Setting untuk Mode Simulasi */}
            {isSimulationMode && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔧 Backend URL (jika timeout, ubah ke localhost:5000)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:5000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    disabled={isStreaming}
                  />
                  <Button
                    onClick={() => {
                      // Test koneksi
                      const testUrl = `${apiUrl}/api/dataset/random-stream`;
                      toast.info("Menguji koneksi backend...");
                      const controller = new AbortController();
                      const timeout = setTimeout(() => controller.abort(), 3000);
                      fetch(testUrl, { signal: controller.signal })
                        .then(() => {
                          clearTimeout(timeout);
                          toast.success("Backend terhubung!", {
                            description: `Berhasil terhubung ke ${apiUrl}`
                          });
                        })
                        .catch(() => {
                          clearTimeout(timeout);
                          toast.error("Backend tidak bisa diakses", {
                            description: `Tidak bisa akses ${apiUrl}. Pastikan Flask berjalan.`
                          });
                        });
                    }}
                    disabled={isStreaming}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3"
                    size="sm"
                  >
                    Test
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  💡 <strong>Tip:</strong> Pastikan URL sesuai dengan tempat backend Flask berjalan. 
                  Jika backend di komputer ini, gunakan <code className="bg-gray-100 px-1 rounded">http://localhost:5000</code>
                </p>
                {apiUrl !== "http://localhost:5000" && apiUrl.includes("192.168") && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="text-blue-700 mb-1">
                      ⚠️ Saat ini menggunakan: <strong>{apiUrl}</strong>
                    </p>
                    <button
                      onClick={() => {
                        setApiUrl("http://localhost:5000");
                        toast.info("URL diubah ke localhost:5000");
                      }}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Klik untuk ubah ke localhost:5000
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isSimulationMode ? "Mode Simulasi Aktif" : "IP Address Drone (ESP32)"}
                </label>
                <input
                  type="text"
                  value={droneIp}
                  onChange={(e) => setDroneIp(e.target.value)}
                  placeholder="192.168.4.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                  disabled={isStreaming || isSimulationMode}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isSimulationMode 
                    ? "Mode simulasi menggunakan gambar dummy - tidak perlu IP address" 
                    : "Default: 192.168.4.1 (ESP32 Access Point mode)"}
                </p>
              </div>
              <Button
                onClick={toggleStream}
                disabled={!isSimulationMode && (!droneIp || droneIp.trim() === "")}
                className={`min-w-[180px] text-base font-semibold shadow-lg ${
                  isStreaming 
                    ? "bg-red-500 hover:bg-red-600" 
                    : isSimulationMode
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white animate-pulse"
                    : "bg-[#2ECC71] hover:bg-[#27AE60]"
                }`}
                size="lg"
              >
                {isStreaming ? (
                  <>
                    <WifiOff className="w-5 h-5 mr-2" />
                    Stop Stream
                  </>
                ) : (
                  <>
                    {isSimulationMode ? (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        🚀 START DEMO
                      </>
                    ) : (
                      <>
                        <Wifi className="w-5 h-5 mr-2" />
                        Start Stream
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
            
            {/* Connection Status */}
            <div className="mt-4 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected" ? "bg-green-500" :
                connectionStatus === "connecting" ? "bg-yellow-500 animate-pulse" :
                "bg-gray-400"
              }`} />
              <span className="text-sm text-gray-600">
                {connectionStatus === "connected" ? "Terhubung" :
                 connectionStatus === "connecting" ? "Menghubungkan..." :
                 "Tidak terhubung"}
              </span>
              {isSimulationMode && !isStreaming && (
                <span className="text-xs text-blue-600 ml-2">
                  (Klik "Start Demo" untuk memulai)
                </span>
              )}
            </div>
            
            {/* Quick Start Guide untuk Mode Simulasi */}
            {isSimulationMode && !isStreaming && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Play className="w-6 h-6 text-blue-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      🚀 Quick Start - Mode Simulasi
                    </h4>
                    <div className="bg-white p-3 rounded-lg border border-blue-200 mb-3">
                      <p className="text-sm font-semibold text-blue-700 mb-2">📍 LOKASI TOMBOL:</p>
                      <p className="text-sm text-gray-700">
                        Tombol <strong className="text-blue-600 text-base">"🚀 START DEMO"</strong> ada di <strong>sebelah kanan input IP</strong> di atas (tombol biru besar dengan icon play)
                      </p>
                    </div>
                    <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                      <li>Scroll ke atas, cari tombol biru besar <strong className="text-blue-700">"🚀 START DEMO"</strong> di bagian "Pengaturan Koneksi"</li>
                      <li>Klik tombol tersebut → Status akan berubah menjadi <strong className="text-green-700">"Terhubung"</strong> (hijau)</li>
                      <li>Gambar dummy akan muncul di area Live Stream</li>
                      <li>Klik tombol <strong className="text-orange-700">"SIMULASI: AMBIL FOTO & DETEKSI"</strong> untuk test deteksi</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Baris 1: Live Stream (Full Width) */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Live Stream (Navigasi)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {isStreaming && streamUrl ? (
                  <>
                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Loading indicator */}
                    {(isLoadingImage || connectionStatus === "connecting") && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm font-semibold mb-1">
                            {isSimulationMode ? "Memuat gambar dari dataset..." : "Menghubungkan ke drone..."}
                          </p>
                          <p className="text-xs text-gray-300">
                            {isSimulationMode 
                              ? "Mengambil gambar random dari backend..." 
                              : "Menunggu koneksi ESP32..."}
                          </p>
                          {isSimulationMode && (
                            <p className="text-xs text-yellow-300 mt-2">
                              ⚠️ Jika lama, pastikan backend Flask berjalan di {apiUrl}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Error message */}
                    {streamError && (
                      <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center z-20">
                        <div className="text-center text-white p-4">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-300" />
                          <p className="text-sm font-semibold mb-1">Error Memuat Gambar</p>
                          <p className="text-xs text-red-200">{streamError}</p>
                          <Button
                            onClick={() => {
                              setStreamError(null);
                              setIsLoadingImage(true);
                              setStreamUrl(getDummyStreamImageUrl());
                            }}
                            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white text-xs"
                            size="sm"
                          >
                            Coba Lagi
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* MJPEG Stream - ESP32 biasanya mengirim MJPEG */}
                    <img
                      ref={streamRef}
                      src={streamUrl}
                      alt="Drone Live Stream"
                      className="w-full h-full object-contain"
                      onError={handleStreamError}
                      onLoad={handleStreamLoad}
                      crossOrigin="anonymous"
                      style={{ display: streamError ? 'none' : 'block' }}
                    />

                    {/* Bounding Box Overlay: Visual indicator di seluruh frame */}
                    {autoDetectResult && autoDetectEnabled && (
                      <>
                        {/* Bounding Box dengan border yang berkedip */}
                        <div 
                          className="absolute inset-0 z-20 pointer-events-none"
                          style={{
                            border: `4px solid ${autoDetectResult.color}`,
                            boxShadow: `0 0 30px ${autoDetectResult.color}, inset 0 0 30px ${autoDetectResult.color}60`,
                            animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                          }}
                        />
                        
                        {/* Text Overlay "POTENSI PENYAKIT TERDETEKSI" di atas */}
                        <div 
                          className="absolute top-0 left-0 right-0 z-30 py-3 px-4 text-center"
                          style={{
                            background: `linear-gradient(180deg, ${autoDetectResult.color} 0%, ${autoDetectResult.color}dd 100%)`,
                            boxShadow: `0 4px 20px ${autoDetectResult.color}80`
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
                            <h3 className="text-white font-bold text-lg tracking-wide">
                              ⚠️ POTENSI PENYAKIT TERDETEKSI ⚠️
                            </h3>
                            <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
                          </div>
                          <p className="text-white/90 text-sm mt-1 font-semibold">
                            {autoDetectResult.disease} - {autoDetectResult.confidence}% Keyakinan
                          </p>
                        </div>

                        {/* Reminder Card di pojok kanan atas */}
                        <div 
                          className="absolute top-20 right-4 z-30 bg-white/98 backdrop-blur-md rounded-lg shadow-2xl border-2 p-4 max-w-sm cursor-pointer hover:bg-white hover:scale-105 transition-all"
                          style={{ 
                            borderColor: autoDetectResult.color,
                            animation: 'slideInRight 0.3s ease-out'
                          }}
                          onClick={handleReminderClick}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center animate-pulse"
                              style={{ backgroundColor: `${autoDetectResult.color}20` }}
                            >
                              <AlertTriangle 
                                className="w-6 h-6" 
                                style={{ color: autoDetectResult.color }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 
                                  className="font-bold text-sm"
                                  style={{ color: autoDetectResult.color }}
                                >
                                  ⚠️ DETECTION ALERT
                                </h4>
                              </div>
                              <p className="text-xs font-semibold text-gray-800 mb-1">
                                {autoDetectResult.disease}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge 
                                  className="text-xs font-bold"
                                  style={{ 
                                    backgroundColor: `${autoDetectResult.color}20`,
                                    color: autoDetectResult.color,
                                    borderColor: autoDetectResult.color,
                                    borderWidth: '2px'
                                  }}
                                >
                                  {autoDetectResult.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className="text-xs font-semibold">
                                  {autoDetectResult.confidence}% yakin
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {autoDetectResult.description.substring(0, 80)}...
                              </p>
                              <Button
                                className="w-full text-xs py-2 mt-2 font-bold"
                                style={{ 
                                  backgroundColor: autoDetectResult.color,
                                  color: 'white'
                                }}
                                size="sm"
                              >
                                📸 Ambil Foto & Lihat Detail
                              </Button>
                              <p className="text-xs text-gray-500 mt-1 text-center">
                                Klik untuk auto-capture
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Indicator Auto-Detecting - Hanya tampilkan jika tidak ada hasil deteksi */}
                    {isAutoDetecting && autoDetectEnabled && !autoDetectResult && (
                      <div className="absolute bottom-4 left-4 z-30 bg-blue-500/90 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs shadow-lg">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menganalisis frame...</span>
                      </div>
                    )}
                    
                    {/* Indicator jika penyakit terdeteksi - Ganti indicator "Menganalisis" */}
                    {autoDetectResult && autoDetectEnabled && (
                      <div 
                        className="absolute bottom-4 left-4 z-30 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg animate-pulse"
                        style={{ backgroundColor: autoDetectResult.color }}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>✓ TERDETEKSI: {autoDetectResult.disease} ({autoDetectResult.confidence}%)</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-400 p-8">
                    <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2 font-semibold">Live Stream Belum Aktif</p>
                    <p className="text-sm mb-4">
                      {isSimulationMode 
                        ? "Klik tombol 'Start Demo' di atas untuk memulai simulasi stream"
                        : "Masukkan IP drone dan klik 'Start Stream' untuk memulai"}
                    </p>
                    {isSimulationMode && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700 mb-2">
                          💡 <strong>Tip:</strong> Mode simulasi menggunakan gambar dummy dari internet. Pastikan koneksi internet aktif.
                        </p>
                        <div className="mt-2 p-2 bg-white rounded border border-blue-300">
                          <p className="text-xs font-semibold text-blue-900 mb-1">📋 Langkah-langkah:</p>
                          <ol className="text-xs text-blue-800 text-left list-decimal list-inside space-y-1">
                            <li>Klik tombol <strong>"Start Demo"</strong> di bagian Pengaturan Koneksi</li>
                            <li>Tunggu gambar muncul di area ini</li>
                            <li>Klik tombol <strong>"SIMULASI: AMBIL FOTO & DETEKSI"</strong> di bawah</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Capture Button */}
              <Button
                onClick={captureAndDetect}
                disabled={!isStreaming || isDetecting || (!isSimulationMode && connectionStatus !== "connected")}
                className="w-full mt-4 bg-gradient-to-r from-[#F39C12] to-[#E67E22] hover:from-[#E67E22] hover:to-[#D35400] text-white text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses Deteksi...
                  </>
                ) : !isStreaming ? (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    {isSimulationMode ? "Aktifkan Demo Stream Dulu" : "Aktifkan Stream Dulu"}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    {isSimulationMode ? "SIMULASI: AMBIL FOTO & DETEKSI" : "AMBIL FOTO & DETEKSI"}
                  </>
                )}
              </Button>
              
              {isSimulationMode && isStreaming && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 text-center">
                    🎯 Mode Simulasi: Gambar akan dikirim ke API untuk deteksi penyakit
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Baris 2: Foto yang Diambil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Foto yang Diambil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured from drone"
                className="w-full rounded-lg border-2 border-gray-200"
              />
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada foto yang diambil</p>
                  <p className="text-xs mt-1">Klik tombol "AMBIL FOTO & DETEKSI" untuk mengambil foto</p>
                  <p className="text-xs mt-2 text-blue-600">
                    💡 Hasil deteksi lengkap akan ditampilkan di halaman Deteksi Penyakit
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

