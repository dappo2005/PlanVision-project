import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Clock, Image as ImageIcon, AlertCircle, 
  Activity, FileText, Shield, TrendingUp, Calendar,
  Search, Filter, Users, BarChart2, Zap, ChevronLeft, ChevronRight,
  User as UserIcon
} from "lucide-react";
import { toast } from "sonner";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

// Headers untuk bypass ngrok warning page
const fetchHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
};

// ─── Interfaces ────────────────────────────────────────────────────────────────

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

interface AdminDetectionRecord extends DetectionRecord {
  user_id: number;
  user_nama: string;
  user_email: string;
}

interface AdminStats {
  total_all: number;
  avg_confidence: number;
  recent_7days: number;
  top_disease: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "tinggi": return "bg-red-100 text-red-800 border-red-300";
    case "sedang": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "rendah": return "bg-green-100 text-green-800 border-green-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getSeverityDot = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "tinggi": return "bg-red-500";
    case "sedang": return "bg-yellow-500";
    case "rendah": return "bg-green-500";
    default: return "bg-gray-400";
  }
};

const getDiseaseColor = (disease: string) => {
  const colors: { [key: string]: string } = {
    "Black spot": "bg-gray-800 text-white",
    "Black Spot": "bg-gray-800 text-white",
    "Black Spot (Bercak Hitam)": "bg-gray-800 text-white",
    "Canker": "bg-orange-600 text-white",
    "Citrus Canker (Kanker Jeruk)": "bg-orange-600 text-white",
    "Greening": "bg-yellow-600 text-white",
    "Citrus Greening (Huanglongbing/HLB)": "bg-yellow-600 text-white",
    "Healthy": "bg-green-600 text-white",
    "Daun Sehat": "bg-green-600 text-white",
    "Tanaman Sehat": "bg-green-600 text-white",
    "Melanose": "bg-purple-600 text-white",
  };
  return colors[disease] || "bg-blue-600 text-white";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const timeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${diffDays} hari lalu`;
};

// ─── Admin View ────────────────────────────────────────────────────────────────

const AdminDetectionAudit: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [detections, setDetections] = useState<AdminDetectionRecord[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AdminDetectionRecord | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterDisease, setFilterDisease] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  const DISEASE_OPTIONS = [
    "all", "Melanose", "Canker", "Citrus Canker (Kanker Jeruk)",
    "Greening", "Citrus Greening (Huanglongbing/HLB)",
    "Black Spot (Bercak Hitam)", "Black spot",
    "Healthy", "Daun Sehat", "Tanaman Sehat"
  ];

  const loadDetections = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
      });
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);
      if (filterDisease !== 'all') params.append('disease', filterDisease);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`${API_URL}/api/admin/detections?${params}`, { headers: fetchHeaders });
      if (res.ok) {
        const data = await res.json();
        setDetections(data.detections || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error("Gagal memuat data deteksi");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadDetections(1);
  }, [filterSeverity, filterDisease]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      loadDetections(1);
    }, 450);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    loadDetections(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white/90 backdrop-blur-md shadow-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 pl-16 lg:pl-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 
                  hover:bg-gray-50 transition-all duration-200 shadow-sm text-sm font-medium text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">Audit Deteksi Global</h1>
                  <p className="text-xs text-purple-600 font-medium hidden sm:block">Panel Superadmin — Monitoring Sistem AI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                Live Monitor
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ─── KPI Stats ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "Total Deteksi Sistem",
              value: stats?.total_all ?? "—",
              suffix: " deteksi",
              icon: <Activity className="w-5 h-5 text-white" />,
              gradient: "from-purple-500 to-indigo-600",
            },
            {
              label: "Deteksi 7 Hari Terakhir",
              value: stats?.recent_7days ?? "—",
              suffix: " baru",
              icon: <Calendar className="w-5 h-5 text-white" />,
              gradient: "from-blue-500 to-cyan-600",
            },
            {
              label: "Rata-rata Akurasi AI",
              value: stats?.avg_confidence ?? "—",
              suffix: "%",
              icon: <TrendingUp className="w-5 h-5 text-white" />,
              gradient: "from-emerald-500 to-green-600",
            },
            {
              label: "Penyakit Paling Sering",
              value: stats?.top_disease ?? "—",
              suffix: "",
              icon: <Zap className="w-5 h-5 text-white" />,
              gradient: "from-orange-500 to-red-500",
              small: true,
            },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden relative">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${kpi.gradient} opacity-10 rounded-full -translate-y-6 translate-x-6`} />
              <div className={`w-9 h-9 bg-gradient-to-br ${kpi.gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                {kpi.icon}
              </div>
              <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
              <p className={`font-bold text-gray-900 mt-0.5 leading-tight ${kpi.small ? 'text-sm' : 'text-2xl'}`}>
                {kpi.value}{kpi.suffix}
              </p>
            </div>
          ))}
        </div>

        {/* ─── Filter & Search Bar ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama user, email, atau penyakit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 bg-gray-50"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", "tinggi", "sedang", "rendah"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                    filterSeverity === s
                      ? s === "all"
                        ? "bg-purple-600 text-white border-purple-600"
                        : s === "tinggi"
                        ? "bg-red-500 text-white border-red-500"
                        : s === "sedang"
                        ? "bg-yellow-500 text-white border-yellow-500"
                        : "bg-green-500 text-white border-green-500"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {s === "all" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Disease Filter */}
            <select
              value={filterDisease}
              onChange={(e) => setFilterDisease(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 text-gray-700 min-w-[140px]"
            >
              {DISEASE_OPTIONS.map((d) => (
                <option key={d} value={d}>{d === "all" ? "Semua Penyakit" : d}</option>
              ))}
            </select>
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Menampilkan <span className="font-semibold text-gray-700">{detections.length}</span> dari{" "}
              <span className="font-semibold text-gray-700">{total}</span> total deteksi
            </p>
            <p className="text-xs text-gray-400">Halaman {currentPage}/{totalPages}</p>
          </div>
        </div>

        {/* ─── Detection Cards ──────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : detections.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Activity className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Tidak Ada Hasil</h3>
            <p className="text-sm text-gray-400">Coba ubah filter atau kata pencarian Anda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {detections.map((record) => (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden 
                  hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
              >
                {/* Image - Standardized uniform aspect ratio & size */}
                <div className="relative h-48 sm:h-52 w-full aspect-[4/3] bg-gray-100 overflow-hidden border-b border-gray-100">
                  <img
                    src={`${API_URL}${record.image_url}`}
                    alt={record.disease_name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+`;
                    }}
                  />
                  {/* Disease badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-sm ${getDiseaseColor(record.disease_name)}`}>
                      {record.disease_name}
                    </span>
                  </div>
                  {/* Severity dot */}
                  <div className="absolute top-2.5 right-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full shadow-md ring-2 ring-white ${getSeverityDot(record.severity)}`} title={`Severity: ${record.severity}`} />
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* User attribution */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{record.user_nama}</p>
                      <p className="text-xs text-gray-400 truncate">{record.user_email}</p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getSeverityColor(record.severity)}`}>
                      {record.severity}
                    </span>
                    <span className="text-base font-bold text-emerald-600">{record.confidence.toFixed(1)}%</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                    <Clock className="w-3 h-3" />
                    {timeAgo(record.detection_date)} · {formatDate(record.detection_date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Pagination ───────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium
                text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    p === currentPage
                      ? "bg-purple-600 text-white shadow-sm"
                      : "border border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium
                text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Detail Modal ─────────────────────────────────────────────── */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detail Audit Deteksi</h2>
                <p className="text-xs text-gray-500 mt-0.5">ID #{selectedRecord.id}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* User attribution banner */}
              <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedRecord.user_nama}</p>
                  <p className="text-sm text-gray-500">{selectedRecord.user_email}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-400">User ID</p>
                  <p className="text-sm font-bold text-purple-700">#{selectedRecord.user_id}</p>
                </div>
              </div>

              {/* Image + basic info */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-100 h-56 sm:h-64 w-full aspect-[4/3]">
                  <img
                    src={`${API_URL}${selectedRecord.image_url}`}
                    alt={selectedRecord.disease_name}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div className="space-y-3">
                  <span className={`inline-block px-4 py-1.5 rounded-lg text-sm font-bold ${getDiseaseColor(selectedRecord.disease_name)}`}>
                    {selectedRecord.disease_name}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs text-gray-500">Confidence AI</p>
                      <p className="text-2xl font-bold text-emerald-600">{selectedRecord.confidence.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Severity</p>
                      <span className={`inline-block mt-1 px-3 py-0.5 rounded-lg text-sm font-semibold border ${getSeverityColor(selectedRecord.severity)}`}>
                        {selectedRecord.severity}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {formatDate(selectedRecord.detection_date)}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedRecord.description && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-800 text-sm">Deskripsi Penyakit</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedRecord.description}</p>
                </div>
              )}

              {/* Symptoms */}
              {selectedRecord.symptoms?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <h3 className="font-semibold text-gray-800 text-sm">Gejala</h3>
                  </div>
                  <ul className="space-y-1">
                    {selectedRecord.symptoms.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-red-500 flex-shrink-0">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Treatment + Prevention */}
              <div className="grid sm:grid-cols-2 gap-4">
                {selectedRecord.treatment?.length > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      <h3 className="font-semibold text-gray-800 text-sm">Penanganan</h3>
                    </div>
                    <ul className="space-y-1">
                      {selectedRecord.treatment.map((t, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-green-500 flex-shrink-0">✓</span>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedRecord.prevention?.length > 0 && (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <h3 className="font-semibold text-gray-800 text-sm">Pencegahan</h3>
                    </div>
                    <ul className="space-y-1">
                      {selectedRecord.prevention.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-purple-500 flex-shrink-0">→</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── User (Personal) View ──────────────────────────────────────────────────────

const UserDetectionHistory: React.FC<{ userId: number }> = ({ userId }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DetectionRecord | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [warning, setWarning] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/detection-history/${userId}`, { headers: fetchHeaders });
      const data = await response.json();
      if (response.ok) {
        setHistory(data.history || []);
        if (data.warning) { setWarning(data.warning); toast.warning(data.warning); }
        else if (data.source === "mock") {
          setWarning("Mode mock aktif: history hanya in-memory. Set USE_MOCK_DB=0 untuk pakai MySQL.");
        } else { setWarning(null); }
      } else {
        if (data.warning) setWarning(data.warning);
        toast.error(data.error || "Gagal memuat riwayat deteksi");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat riwayat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [userId]);

  const filteredHistory = history.filter((r) =>
    filterSeverity === "all" ? true : r.severity.toLowerCase() === filterSeverity.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 pl-16 lg:pl-6">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {warning && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{warning}</p>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-green-100 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter Severity:</span>
          <div className="flex gap-2">
            {["all", "tinggi", "sedang", "rendah"].map((severity) => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterSeverity === severity ? "text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={filterSeverity === severity ? { backgroundColor: '#16a34a' } : {}}
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
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/disease-detector")}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md"
              >
                Mulai Deteksi
              </button>
              <button
                onClick={loadHistory}
                className="px-6 py-3 bg-white border border-green-300 text-green-700 rounded-xl hover:bg-green-50 transition-all"
              >
                Muat Ulang
              </button>
            </div>
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
                <div className="relative h-48 sm:h-52 w-full aspect-[4/3] bg-gray-100 overflow-hidden border-b border-green-50">
                  <img
                    src={`${API_URL}${record.image_url}`}
                    alt={record.disease_name}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDiseaseColor(record.disease_name)}`}>
                      {record.disease_name}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getSeverityColor(record.severity)}`}>
                      Severity: {record.severity}
                    </span>
                    <span className="text-sm font-bold text-green-600">{record.confidence.toFixed(1)}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{record.description}</p>
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

      {/* Detail Modal (Personal) */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Detail Deteksi</h2>
                <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-100 h-56 sm:h-64 w-full aspect-[4/3]">
                  <img src={`${API_URL}${selectedRecord.image_url}`} alt={selectedRecord.disease_name} className="w-full h-full object-cover object-center" />
                </div>
                <div className="space-y-4">
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${getDiseaseColor(selectedRecord.disease_name)}`}>
                    {selectedRecord.disease_name}
                  </span>
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
              {selectedRecord.description && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-900">Deskripsi</h3></div>
                  <p className="text-sm text-gray-700">{selectedRecord.description}</p>
                </div>
              )}
              {selectedRecord.symptoms?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3"><AlertCircle className="w-5 h-5 text-red-600" /><h3 className="font-semibold text-gray-900">Gejala</h3></div>
                  <ul className="space-y-2">{selectedRecord.symptoms.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-red-600 mt-1">•</span><span>{s}</span></li>)}</ul>
                </div>
              )}
              {selectedRecord.treatment?.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3"><Activity className="w-5 h-5 text-green-600" /><h3 className="font-semibold text-gray-900">Penanganan</h3></div>
                  <ul className="space-y-2">{selectedRecord.treatment.map((t, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-600 mt-1">✓</span><span>{t}</span></li>)}</ul>
                </div>
              )}
              {selectedRecord.prevention?.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-gray-900">Pencegahan</h3></div>
                  <ul className="space-y-2">{selectedRecord.prevention.map((p, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-purple-600 mt-1">→</span><span>{p}</span></li>)}</ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component (Role Router) ─────────────────────────────────────────────

const DetectionHistory: React.FC = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = userData.user_id;
  const userRole = userData.role || "user";
  const isSuperadmin = userRole === "superadmin" || userRole === "admin";

  useEffect(() => {
    if (!userId) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/");
    }
  }, [userId, navigate]);

  if (!userId) return null;

  if (isSuperadmin) {
    return <AdminDetectionAudit onBack={() => navigate("/admin")} />;
  }

  return <UserDetectionHistory userId={userId} />;
};

export default DetectionHistory;
