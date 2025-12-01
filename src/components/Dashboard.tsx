import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Leaf,
  Camera,
  Network,
  Radio,
  BarChart3,
  FileText,
  Cloud,
  Microscope,
  Cpu,
  Database,
  Zap,
  Upload,
  TrendingUp,
  CheckCircle2,
  Users,
  Target,
  Clock,
  History,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";

interface DashboardProps {
  onLogout: () => void;
  onNavigateToDetector: () => void;
  onNavigateToMonitoring: () => void;
  onNavigateToChatAI: () => void;
  onNavigateToNews: () => void;
  onNavigateToFeedback: () => void;
  onNavigateToContact: () => void;
}

interface TeamMember {
  name: string;
  role: string;
  expertise: string;
  avatar: string;
  color: string;
  photo?: string;
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
      <CardContent className="p-6 text-center">
        <div className="relative w-24 h-24 mx-auto mb-4 group-hover:scale-110 transition-transform">
          <div
            className={`w-24 h-24 ${member.color} rounded-full flex items-center justify-center text-white text-2xl overflow-hidden border-4 border-white shadow-lg`}
          >
            {member.photo && !imageError ? (
              <img
                src={member.photo}
                alt={member.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span>{member.avatar}</span>
            )}
          </div>
        </div>
        <h3 className="text-gray-900 mb-1 font-semibold">
          {member.name}
        </h3>
        <p className="text-[#2ECC71] mb-1 font-medium">
          {member.role}
        </p>
        <p className="text-gray-600 text-sm">
          {member.expertise}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard({
  onLogout,
  onNavigateToDetector,
  onNavigateToMonitoring,
  onNavigateToChatAI,
  onNavigateToNews,
  onNavigateToFeedback,
  onNavigateToContact,
}: DashboardProps) {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('user');

  // Check user role
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        setUserRole(user.role || 'user');
      }
    } catch (_) {
      setUserRole('user');
    }
  }, []);

  const [userData, setUserData] = useState<{nama: string, email: string, role: string} | null>(null);

  // Load user data and role - with auto-sync from backend
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const user = JSON.parse(stored);
          const userId = user.user_id || user.id;
          
          // ALWAYS sync role from backend to ensure it's up-to-date
          if (user.email) {
            try {
              const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
              console.log('[Dashboard] Syncing role from:', `${API_URL}/api/user/role?email=${encodeURIComponent(user.email)}`);
              const response = await fetch(`${API_URL}/api/user/role?email=${encodeURIComponent(user.email)}`, {
                headers: {
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true'
                }
              });
              console.log('[Dashboard] Role sync response status:', response.status);
              if (response.ok) {
                const data = await response.json();
                console.log('[Dashboard] Role sync response data:', data);
                if (data.role) {
                  // ALWAYS update localStorage with role from backend (force sync)
                  const updatedUser = { ...user, role: data.role };
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  user.role = data.role;
                  console.log('[Dashboard] Role FORCE SYNC from backend:', data.role, '(was:', user.role || 'undefined', ')');
                }
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Dashboard] Role sync failed:', response.status, errorData);
              }
            } catch (error) {
              console.error('[Dashboard] Could not sync role from backend:', error);
            }
          }
          
          setUserData({
            nama: user.nama || 'User',
            email: user.email || '',
            role: user.role || 'user'
          });
          setUserRole(user.role || 'user');
          console.log('[Dashboard] User role:', user.role);
          console.log('[Dashboard] User data:', user);
        }
      } catch (_) {
        setUserRole('user');
      }
    };
    
    loadUserData();
  }, []);

  const isSuperadmin = userRole === 'superadmin';

  const kpiData = [
    {
      name: "Akurasi",
      value: 87,
      target: 85,
      color: "#2ECC71",
    },
    {
      name: "Waktu Respon",
      value: 2.5,
      target: 3,
      unit: "s",
      color: "#F39C12",
    },
    {
      name: "Jenis Penyakit",
      value: 5,
      target: 3,
      color: "#3498DB",
    },
    {
      name: "Uptime",
      value: 97,
      target: 95,
      unit: "%",
      color: "#9B59B6",
    },
  ];

  const detectionData = [
    { month: "Nov W1", deteksi: 45, akurasi: 85 },
    { month: "Nov W2", deteksi: 62, akurasi: 86 },
    { month: "Nov W3", deteksi: 78, akurasi: 87 },
    { month: "Nov W4", deteksi: 95, akurasi: 87 },
    { month: "Des W1", deteksi: 110, akurasi: 88 },
  ];

  const diseaseDistribution = [
    { name: "Citrus Canker", value: 35, color: "#E74C3C" },
    { name: "Citrus Greening", value: 28, color: "#F39C12" },
    { name: "Melanose", value: 20, color: "#9B59B6" },
    { name: "Black Spot", value: 12, color: "#3498DB" },
    { name: "Sehat", value: 5, color: "#2ECC71" },
  ];

  const timelineData = [
    {
      phase: "Komunikasi",
      start: "1 Nov",
      end: "3 Nov",
      progress: 100,
      color: "bg-[#2ECC71]",
    },
    {
      phase: "Perencanaan",
      start: "4 Nov",
      end: "8 Nov",
      progress: 100,
      color: "bg-[#3498DB]",
    },
    {
      phase: "Desain Sistem",
      start: "9 Nov",
      end: "15 Nov",
      progress: 100,
      color: "bg-[#9B59B6]",
    },
    {
      phase: "Prototype",
      start: "16 Nov",
      end: "25 Nov",
      progress: 85,
      color: "bg-[#F39C12]",
    },
    {
      phase: "Uji Pengguna",
      start: "26 Nov",
      end: "30 Nov",
      progress: 60,
      color: "bg-[#E67E22]",
    },
    {
      phase: "Perbaikan",
      start: "1 Des",
      end: "8 Des",
      progress: 40,
      color: "bg-[#E74C3C]",
    },
    {
      phase: "Finalisasi",
      start: "9 Des",
      end: "15 Des",
      progress: 20,
      color: "bg-[#95A5A6]",
    },
  ];

  const teamMembers = [
    {
      name: "Daffa Maulana KAL",
      role: "Project Manager",
      expertise: "Backend Developer",
      avatar: "DM",
      color: "bg-gradient-to-br from-[#2ECC71] to-[#27AE60]",
      photo: "/images/team/daffa.jpeg",
    },
    {
      name: "Aisyah Putri Harmelia",
      role: "Frontend Developer",
      expertise: "Data Analyst",
      avatar: "AP",
      color: "bg-gradient-to-br from-[#F39C12] to-[#E67E22]",
      photo: "/images/team/ais.jpeg",
    },
    {
      name: "Refael Tresia Sibarani",
      role: "System Analyst",
      expertise: "Requirement Engineer",
      avatar: "RT",
      color: "bg-gradient-to-br from-[#2ECC71] to-[#F39C12]",
      photo: "/images/team/refa.jpeg",
    },
    {
      name: "Imam Yanif",
      role: "Database Analyst",
      expertise: "Deployment Specialist",
      avatar: "IY",
      color: "bg-gradient-to-br from-[#E67E22] to-[#D35400]",
      photo: "/images/team/imam.jpeg",
    },
  ];

  const methodology = [
    {
      step: 1,
      title: "Komunikasi",
      icon: <Users className="w-6 h-6" />,
      desc: "Diskusi kebutuhan dengan stakeholder",
    },
    {
      step: 2,
      title: "Perencanaan",
      icon: <Target className="w-6 h-6" />,
      desc: "Merancang roadmap dan KPI proyek",
    },
    {
      step: 3,
      title: "Desain",
      icon: <Cpu className="w-6 h-6" />,
      desc: "Membuat arsitektur sistem dan UI/UX",
    },
    {
      step: 4,
      title: "Prototype",
      icon: <Zap className="w-6 h-6" />,
      desc: "Implementasi fitur dan pengujian awal",
    },
    {
      step: 5,
      title: "Uji Pengguna",
      icon: <CheckCircle2 className="w-6 h-6" />,
      desc: "Pengujian dengan pengguna nyata",
    },
    {
      step: 6,
      title: "Perbaikan",
      icon: <TrendingUp className="w-6 h-6" />,
      desc: "Iterasi berdasarkan feedback",
    },
    {
      step: 7,
      title: "Finalisasi",
      icon: <Cloud className="w-6 h-6" />,
      desc: "Deployment dan dokumentasi",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Decorative Orange Elements */}
      <div
        className="fixed top-32 right-16 w-24 h-24 orange-slice opacity-5 pointer-events-none animate-pulse"
        style={{ animationDuration: "5s" }}
      />
      <div
        className="fixed bottom-40 left-16 w-32 h-32 orange-slice opacity-5 pointer-events-none animate-pulse"
        style={{
          animationDuration: "4s",
          animationDelay: "1s",
        }}
      />
      <div
        className="fixed top-1/3 left-1/4 w-16 h-16 orange-slice opacity-5 pointer-events-none animate-pulse"
        style={{
          animationDuration: "6s",
          animationDelay: "2s",
        }}
      />

      {/* Hero Section - Fullscreen */}
      <section
        id="beranda"
        className="relative bg-gradient-to-br from-[#2ECC71] to-[#F39C12] text-white min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1667880271916-069ccc2cbe01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>
        <div className="absolute top-10 right-10 w-40 h-40 rounded-full border-4 border-white/20 opacity-30" />
        <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full border-4 border-white/20 opacity-20" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 orange-slice opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* User Info & Role Badge */}
            {userData && (
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="bg-white/20 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 border border-white/30">
                  <div className="text-left">
                    <p className="text-sm opacity-80">Selamat datang,</p>
                    <p className="text-lg font-semibold">{userData.nama}</p>
                  </div>
                  <div className="h-8 w-px bg-white/30"></div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30">
                    {isSuperadmin ? (
                      <>
                        <div className="w-2.5 h-2.5 bg-purple-300 rounded-full"></div>
                        <span className="text-sm font-medium">Administrator</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2.5 h-2.5 bg-green-300 rounded-full"></div>
                        <span className="text-sm font-medium">Petani</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <h1 className="text-5xl md:text-6xl">
              Deteksi Penyakit Daun Jeruk Secara Cepat dan
              Akurat dengan PlantVision
            </h1>
            <p className="text-xl opacity-90">
              Website berbasis IoT & Machine Learning untuk
              membantu petani mendeteksi penyakit daun jeruk
              secara real-time.
            </p>
            <div className="flex flex-col items-center gap-4 pt-4">
              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <Button
                  size="lg"
                  onClick={onNavigateToDetector}
                  className="bg-white text-[#2ECC71] hover:bg-gray-100 shadow-xl w-full sm:w-auto min-w-[180px]"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Mulai Sekarang
                </Button>
              </div>
              
              {/* Secondary Action Button */}
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/90 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white hover:shadow-xl transition-all w-full sm:w-auto font-medium"
                asChild
              >
                <a href="#tentang" className="flex items-center justify-center gap-2">
                  Pelajari Lebih Lanjut
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl text-gray-900 mb-4">
                Tentang Proyek
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                PlantVision adalah solusi inovatif yang
                menggabungkan teknologi IoT dan Machine Learning
                untuk membantu petani jeruk mendeteksi penyakit
                tanaman secara dini dan akurat.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-gray-900 mb-2">Tujuan</h3>
                  <p className="text-gray-600">
                    Meningkatkan produktivitas petani dengan
                    deteksi penyakit yang cepat dan akurat
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Microscope className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-gray-900 mb-2">
                    Latar Belakang
                  </h3>
                  <p className="text-gray-600">
                    Penyakit tanaman jeruk sering terlambat
                    terdeteksi, menyebabkan kerugian besar bagi
                    petani
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#3498DB] to-[#2980B9] rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-gray-900 mb-2">
                    Manfaat
                  </h3>
                  <p className="text-gray-600">
                    Deteksi dini, penanganan cepat, dan
                    peningkatan hasil panen hingga 30%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-br from-green-50 to-orange-50 p-8 rounded-xl">
              <div className="text-center">
                <div className="text-3xl text-[#2ECC71] mb-2">
                  Project Manager
                </div>
                <p className="text-gray-700">
                  Daffa Maulana KAL
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl text-[#F39C12] mb-2">
                  Project Mentor
                </div>
                <p className="text-gray-700">
                  Bintang Aprilio S.Tr. Kom. 
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl text-[#3498DB] mb-2">
                  Owner
                </div>
                <p className="text-gray-700">Tim BEBAS G1 - TEK IPB</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl text-gray-900 mb-3">
              Akses Cepat
            </h2>
            <p className="text-gray-600">
              Jelajahi fitur-fitur PlantVision
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Button
              onClick={onNavigateToDetector}
              variant="outline"
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-[#2ECC71]/10 to-[#27AE60]/10 border-2 border-[#2ECC71]/30 hover:bg-gradient-to-br hover:from-[#2ECC71] hover:to-[#27AE60] hover:text-white hover:border-[#2ECC71] transition-all duration-300 hover:scale-110 hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/20 to-[#27AE60]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Camera className="w-6 h-6 relative z-10 group-hover:animate-bounce" />
              <span className="relative z-10 font-semibold">Deteksi Penyakit</span>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#2ECC71]/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
            <Button
              onClick={() => navigate('/detection-history')}
              variant="outline"
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border-2 border-indigo-500/30 hover:bg-gradient-to-br hover:from-indigo-500 hover:to-indigo-600 hover:text-white hover:border-indigo-500 transition-all duration-300 hover:scale-110 hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <History className="w-6 h-6 relative z-10 group-hover:animate-bounce" />
              <span className="relative z-10 font-semibold">Riwayat Deteksi</span>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
            <Button
              onClick={onNavigateToMonitoring}
              variant="outline"
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-2 border-cyan-500/30 hover:bg-gradient-to-br hover:from-cyan-500 hover:to-cyan-600 hover:text-white hover:border-cyan-500 transition-all duration-300 hover:scale-110 hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Radio className="w-6 h-6 relative z-10 group-hover:animate-bounce" />
              <span className="relative z-10 font-semibold">Monitoring</span>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
            <Button
              onClick={onNavigateToChatAI}
              variant="outline"
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:border-blue-500 transition-all duration-300 hover:scale-110 hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Cpu className="w-6 h-6 relative z-10 group-hover:animate-bounce" />
              <span className="relative z-10 font-semibold">Chat AI</span>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
            <Button
              onClick={onNavigateToNews}
              variant="outline"
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-500 hover:to-purple-600 hover:text-white hover:border-purple-500 transition-all duration-300 hover:scale-110 hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <FileText className="w-6 h-6 relative z-10 group-hover:animate-bounce" />
              <span className="relative z-10 font-semibold">Berita</span>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
            <Button
              onClick={onNavigateToFeedback}
              variant="outline"
              className="h-24 md:col-start-2 md:col-span-1 flex flex-col gap-2 bg-gradient-to-br from-[#F39C12]/10 to-[#E67E22]/10 border-2 border-[#F39C12]/30 hover:bg-gradient-to-br hover:from-[#F39C12] hover:to-[#E67E22] hover:text-white hover:border-[#F39C12] transition-all duration-300 hover:scale-110 hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#F39C12]/20 to-[#E67E22]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Upload className="w-6 h-6 relative z-10 group-hover:animate-bounce" />
              <span className="relative z-10 font-semibold">Saran & Kritik</span>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#F39C12]/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </div>

          {/* Admin Section - Hanya untuk Superadmin */}
          {isSuperadmin && (
            <div className="mt-12">
              <div className="text-center mb-6">
                <h3 className="text-2xl text-gray-900 mb-2">Panel Admin</h3>
                <p className="text-gray-600">Fitur khusus untuk administrator</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                <Button
                  onClick={() => window.location.href = '/admin'}
                  variant="outline"
                  className="h-24 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-500 hover:text-purple-600 border-2"
                >
                  <BarChart3 className="w-6 h-6" />
                  <span>Admin Panel</span>
                  <span className="text-xs text-gray-500">Kelola seluruh sistem</span>
                </Button>
                <Button
                  onClick={onNavigateToNews}
                  variant="outline"
                  className="h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 border-2"
                >
                  <FileText className="w-6 h-6" />
                  <span>Kelola Berita</span>
                  <span className="text-xs text-gray-500">Buat & edit berita</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">
              Fitur Utama
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Teknologi canggih untuk monitoring dan deteksi
              penyakit tanaman jeruk
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={onNavigateToDetector}
            >
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-lg flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  Deteksi Otomatis Citra Daun
                </h3>
                <p className="text-gray-600">
                  Menggunakan algoritma Machine Learning untuk
                  mendeteksi penyakit dari gambar daun dengan
                  akurasi tinggi
                </p>
                <Button className="w-full mt-4 bg-[#2ECC71] hover:bg-[#27AE60]">
                  Mulai Deteksi
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-lg flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                  <Network className="w-8 h-8" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  Integrasi IoT
                </h3>
                <p className="text-gray-600">
                  Sensor warna TCS3200 dan kamera ESP32-CAM
                  terintegrasi untuk monitoring real-time
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#3498DB] to-[#2980B9] rounded-lg flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  Dashboard Monitoring
                </h3>
                <p className="text-gray-600">
                  Visualisasi data sensor dan hasil deteksi
                  penyakit dalam satu dashboard interaktif
                </p>
              </CardContent>
            </Card>

            <Card
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={onNavigateToNews}
            >
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] rounded-lg flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  Berita & Artikel
                </h3>
                <p className="text-gray-600">
                  Update terbaru seputar pertanian jeruk,
                  teknologi, dan penelitian terkini
                </p>
                <Button className="w-full mt-4 bg-[#9B59B6] hover:bg-[#8E44AD]">
                  Lihat Berita
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#E74C3C] to-[#C0392B] rounded-lg flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  Ekspor Laporan
                </h3>
                <p className="text-gray-600">
                  Download hasil deteksi dan analisis dalam
                  format Excel atau PDF untuk dokumentasi
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1ABC9C] to-[#16A085] rounded-lg flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  Real-time Analysis
                </h3>
                <p className="text-gray-600">
                  Analisis cepat dengan waktu respon kurang dari
                  3 detik untuk hasil instan
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* KPI Section */}
      <section id="kpi" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">
              KPI dan Target Proyek
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Metrik performa untuk memastikan kualitas dan
              efektivitas sistem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-6xl mx-auto">
            {kpiData.map((kpi, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-700">
                      {kpi.name}
                    </h3>
                    <CheckCircle2 className="w-6 h-6 text-[#2ECC71]" />
                  </div>
                  <div className="text-3xl text-gray-900 mb-2">
                    {kpi.value}
                    {kpi.unit || "%"}
                  </div>
                  <div className="text-gray-500 mb-3">
                    Target: {kpi.target}
                    {kpi.unit || "%"}
                  </div>
                  <Progress
                    value={
                      kpi.unit === "s"
                        ? (kpi.target / kpi.value) * 100
                        : (kpi.value / kpi.target) * 100
                    }
                    className="h-2"
                    style={{
                      backgroundColor: "#E5E7EB",
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Trend Deteksi & Akurasi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={detectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="deteksi"
                      stroke="#2ECC71"
                      strokeWidth={2}
                      name="Jumlah Deteksi"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="akurasi"
                      stroke="#F39C12"
                      strokeWidth={2}
                      name="Akurasi (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Jenis Penyakit</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={diseaseDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {diseaseDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section
        id="tim"
        className="py-20 bg-gradient-to-b from-green-50 to-orange-50"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">
              Tim Pengembang
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tim BEBAS G1 - Ahli IoT & Computer Vision yang
              berdedikasi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => (
              <TeamMemberCard key={index} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="dokumentasi" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">
              Metodologi Prototype
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Pendekatan sistematis dalam pengembangan
              PlantVision
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {methodology.slice(0, 4).map((step, index) => (
                <Card
                  key={index}
                  className="relative overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#2ECC71]/10 to-[#F39C12]/10 rounded-bl-full" />
                    <div className="text-4xl text-[#2ECC71] mb-3">
                      {step.step}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center mb-3 text-white">
                      {step.icon}
                    </div>
                    <h3 className="text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {methodology.slice(4, 7).map((step, index) => (
                <Card
                  key={index}
                  className="relative overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#F39C12]/10 to-[#2ECC71]/10 rounded-bl-full" />
                    <div className="text-4xl text-[#F39C12] mb-3">
                      {step.step}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-lg flex items-center justify-center mb-3 text-white">
                      {step.icon}
                    </div>
                    <h3 className="text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline/Gantt Chart Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">
              Timeline & Gantt Chart Proyek
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Jadwal pengembangan November - Desember 2025
            </p>
          </div>
          <Card className="max-w-6xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-6">
                {timelineData.map((phase, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <h3 className="text-gray-900">
                          {phase.phase}
                        </h3>
                      </div>
                      <div className="text-gray-600">
                        {phase.start} - {phase.end}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full ${phase.color} transition-all duration-500 flex items-center justify-end pr-2`}
                            style={{
                              width: `${phase.progress}%`,
                            }}
                          >
                            <span className="text-white text-xs">
                              {phase.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="kontak"
        className="bg-gray-900 text-gray-300 py-12"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/images/plantvision-logo.png" 
                  alt="PlantVision Logo" 
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-gray-400">
                Platform IoT & Machine Learning untuk deteksi
                penyakit daun jeruk
              </p>
            </div>
            <div>
              <h4 className="text-white mb-4">Fitur</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={onNavigateToDetector}
                    className="hover:text-[#2ECC71] transition-colors text-left"
                  >
                    Deteksi Penyakit
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToChatAI}
                    className="hover:text-[#2ECC71] transition-colors text-left"
                  >
                    Chat AI
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToNews}
                    className="hover:text-[#2ECC71] transition-colors text-left"
                  >
                    Berita Pertanian
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToFeedback}
                    className="hover:text-[#2ECC71] transition-colors text-left"
                  >
                    Saran & Kritik
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Dokumentasi</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#kpi"
                    className="hover:text-[#2ECC71] transition-colors"
                  >
                    KPI Proyek
                  </a>
                </li>
                <li>
                  <a
                    href="#dokumentasi"
                    className="hover:text-[#2ECC71] transition-colors"
                  >
                    Metodologi
                  </a>
                </li>
                <li>
                  <a
                    href="#tentang"
                    className="hover:text-[#2ECC71] transition-colors"
                  >
                    Tentang Proyek
                  </a>
                </li>
                <li>
                  <a
                    href="#tim"
                    className="hover:text-[#2ECC71] transition-colors"
                  >
                    Tim Developer
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Hubungi Kami</h4>
              <ul className="space-y-2 mb-4">
                <li>Email: info@plantvision.id</li>
                <li>Tim BEBAS G1 - IoT & Computer Vision</li>
                <li>TEKOMk</li>
                <li>IPB University</li>
              </ul>
              <Button
                onClick={onNavigateToContact}
                className="bg-gradient-to-r from-[#2ECC71] to-[#F39C12] hover:from-[#27AE60] hover:to-[#E67E22] text-white"
              >
                Hubungi Kami
              </Button>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            © 2025 PlantVision | Tim Pengembang G1 – IoT &
            Computer Vision
          </div>
        </div>
      </footer>
    </div>
  );
}
