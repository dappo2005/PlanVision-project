import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Clock, Image as ImageIcon, AlertCircle, 
  Activity, FileText, Shield, TrendingUp, Calendar 
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Headers untuk bypass ngrok warning page
const fetchHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
};

interface DetectionRecord {
  id: number;
  image_url: string;
  disease_name: string;
  confidence: number;
  severity: string;
  description: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  detection_date: string;
}

const DetectionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DetectionRecord | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = userData.user_id;

  useEffect(() => {
    if (!userId) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/");
      return;
    }

    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/detection-history/${userId}`, {
        headers: fetchHeaders
      });
      const data = await response.json();

      if (response.ok) {
        setHistory(data.history || []);
      } else {
        toast.error(data.error || "Gagal memuat riwayat deteksi");
      }
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Terjadi kesalahan saat memuat riwayat");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "tinggi":
        return "bg-red-100 text-red-800 border-red-300";
      case "sedang":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "rendah":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getDiseaseColor = (disease: string) => {
    const colors: { [key: string]: string } = {
      "Black spot": "bg-gray-800 text-white",
      "Canker": "bg-orange-600 text-white",
      "Greening": "bg-yellow-600 text-white",
      "Healthy": "bg-green-600 text-white",
      "Melanose": "bg-purple-600 text-white",
    };
    return colors[disease] || "bg-blue-600 text-white";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredHistory = history.filter((record) => {
    if (filterSeverity === "all") return true;
    return record.severity.toLowerCase() === filterSeverity.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-green-200 
                hover:bg-green-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Kembali</span>
            </button>

            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Riwayat Deteksi</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter */}
        <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-green-100">
          <span className="text-sm font-medium text-gray-700">Filter Severity:</span>
          <div className="flex gap-2">
            {["all", "tinggi", "sedang", "rendah"].map((severity) => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterSeverity === severity
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {severity === "all" ? "Semua" : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
          <div className="ml-auto text-sm text-gray-600">
            {filteredHistory.length} dari {history.length} hasil
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-12 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum ada riwayat deteksi</h3>
            <p className="text-gray-500 mb-6">
              {filterSeverity !== "all" 
                ? `Tidak ada hasil deteksi dengan severity ${filterSeverity}` 
                : "Lakukan deteksi penyakit untuk melihat riwayat"}
            </p>
            <button
              onClick={() => navigate("/disease-detector")}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 
                transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Mulai Deteksi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl shadow-md border border-green-100 overflow-hidden 
                  hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => setSelectedRecord(record)}
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={`${API_URL}${record.image_url}`}
                    alt={record.disease_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDiseaseColor(record.disease_name)}`}>
                      {record.disease_name}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getSeverityColor(record.severity)}`}>
                      Severity: {record.severity}
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {record.confidence.toFixed(1)}%
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {record.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(record.detection_date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Detail Deteksi</h2>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Image & Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={`${API_URL}${selectedRecord.image_url}`}
                    alt={selectedRecord.disease_name}
                    className="w-full h-64 object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${getDiseaseColor(selectedRecord.disease_name)}`}>
                      {selectedRecord.disease_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="text-xl font-bold text-green-600">{selectedRecord.confidence.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-500">Severity</p>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-semibold border ${getSeverityColor(selectedRecord.severity)}`}>
                        {selectedRecord.severity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {formatDate(selectedRecord.detection_date)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Deskripsi</h3>
                </div>
                <p className="text-sm text-gray-700">{selectedRecord.description}</p>
              </div>

              {/* Symptoms */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-gray-900">Gejala</h3>
                </div>
                <ul className="space-y-2">
                  {selectedRecord.symptoms.map((symptom, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-red-600 mt-1">•</span>
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Treatment */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Penanganan</h3>
                </div>
                <ul className="space-y-2">
                  {selectedRecord.treatment.map((treat, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>{treat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prevention */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Pencegahan</h3>
                </div>
                <ul className="space-y-2">
                  {selectedRecord.prevention.map((prev, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-purple-600 mt-1">→</span>
                      <span>{prev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionHistory;
