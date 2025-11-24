import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  BarChart3, Users, MessageSquare, Newspaper, TrendingUp, 
  Activity, Shield, Settings, ArrowLeft, Eye, Edit, Trash2,
  Plus, Search, Filter, Download, Calendar, Clock, CheckCircle2,
  XCircle, AlertCircle, Star, UserPlus, FileText, PieChart
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/input";
import AdminFeedbackDashboard from "./AdminFeedbackDashboard";

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
}

interface DashboardStats {
  totalUsers: number;
  totalFeedbacks: number;
  totalNews: number;
  totalDetections: number;
  activeUsers: number;
  pendingFeedbacks: number;
  recentActivity: any[];
}

interface User {
  user_id: number;
  nama: string;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard({ onLogout, onNavigateToDashboard }: AdminDashboardProps) {
  const navigate = useNavigate();
  const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
  
  const [adminId, setAdminId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Users management state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Load admin data
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        const id = user.user_id || user.id;
        const role = user.role;
        
        console.log('[AdminDashboard] User data:', { id, role });
        
        // Check if user is superadmin
        if (role === 'superadmin') {
          setAdminId(id);
          setIsAdmin(true);
        } else {
          toast.error("Akses Ditolak", {
            description: "Anda tidak memiliki akses ke halaman admin"
          });
          navigate('/dashboard');
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading admin:', error);
      navigate('/');
    }
  }, [navigate]);

  // Load stats when adminId is available
  useEffect(() => {
    if (adminId && isAdmin) {
      loadDashboardStats();
    }
  }, [adminId, isAdmin]);

  // Load users when tab changes to users
  useEffect(() => {
    if (adminId && isAdmin && activeTab === 'users') {
      loadUsers();
    }
  }, [adminId, isAdmin, activeTab, currentPage, searchQuery, roleFilter]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter) params.append('role', roleFilter);
      
      const response = await fetch(`${API_URL}/api/admin/users?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error("Gagal memuat data user");
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error("Gagal terhubung ke server");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      // Load stats from multiple endpoints
      const [usersRes, feedbacksRes, detectionsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users/stats`).catch(() => null),
        fetch(`${API_URL}/api/admin/feedbacks/stats?admin_id=${adminId}`).catch(() => null),
        fetch(`${API_URL}/api/admin/detections/stats`).catch(() => null)
      ]);

      const usersData = usersRes?.ok ? await usersRes.json() : { total: 0, active: 0 };
      const feedbacksData = feedbacksRes?.ok ? await feedbacksRes.json() : { total: 0, pending: 0 };
      const detectionsData = detectionsRes?.ok ? await detectionsRes.json() : { total: 0 };

      setStats({
        totalUsers: usersData.total || 0,
        totalFeedbacks: feedbacksData.total || 0,
        totalNews: 0, // Will be loaded separately
        totalDetections: detectionsData.total || 0,
        activeUsers: usersData.active || 0,
        pendingFeedbacks: feedbacksData.by_status?.pending || 0,
        recentActivity: []
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Set default stats if API fails
      setStats({
        totalUsers: 0,
        totalFeedbacks: 0,
        totalNews: 0,
        totalDetections: 0,
        activeUsers: 0,
        pendingFeedbacks: 0,
        recentActivity: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking admin status
  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToDashboard}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-purple-600" />
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-500 mt-1">Kelola seluruh sistem PlantVision</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Shield className="w-3 h-3 mr-1" />
                Administrator
              </Badge>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="feedbacks" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedbacks</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">Berita</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Activity className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Memuat data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                      <Users className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="text-green-600">{stats?.activeUsers || 0}</span> aktif
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Feedbacks</CardTitle>
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{stats?.totalFeedbacks || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="text-yellow-600">{stats?.pendingFeedbacks || 0}</span> pending
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Detections</CardTitle>
                      <Activity className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{stats?.totalDetections || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">Semua waktu</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Berita</CardTitle>
                      <Newspaper className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{stats?.totalNews || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">Artikel tersedia</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Akses cepat ke fitur admin</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setActiveTab("users")}
                      >
                        <UserPlus className="w-5 h-5" />
                        <span className="text-xs">Tambah User</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setActiveTab("feedbacks")}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-xs">Kelola Feedback</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setActiveTab("news")}
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-xs">Tambah Berita</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setActiveTab("analytics")}
                      >
                        <PieChart className="w-5 h-5" />
                        <span className="text-xs">Lihat Analytics</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Aktivitas terbaru di sistem</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">User baru terdaftar</p>
                          <p className="text-xs text-gray-500">2 jam yang lalu</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Feedback baru diterima</p>
                          <p className="text-xs text-gray-500">5 jam yang lalu</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Activity className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Deteksi penyakit baru</p>
                          <p className="text-xs text-gray-500">1 hari yang lalu</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Kelola semua pengguna sistem ({stats?.totalUsers || 0} users)</CardDescription>
                  </div>
                  <Button className="flex items-center gap-2" disabled>
                    <UserPlus className="w-4 h-4" />
                    Tambah User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Cari user (nama, email, username)..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Semua Role</option>
                      <option value="user">User</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>

                  {/* Users Table */}
                  {usersLoading ? (
                    <div className="text-center py-12">
                      <Activity className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Memuat data user...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-500">Tidak ada user ditemukan</p>
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                              <tr key={user.user_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{user.user_id}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.nama}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{user.username}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{user.phone || '-'}</td>
                                <td className="px-4 py-3">
                                  <Badge 
                                    variant={user.role === 'superadmin' ? 'default' : 'secondary'}
                                    className={user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}
                                  >
                                    {user.role}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={user.status === 'aktif' ? 'default' : 'secondary'}>
                                    {user.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {new Date(user.created_at).toLocaleDateString('id-ID', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button variant="ghost" size="sm" disabled>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" disabled>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" disabled>
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Halaman {currentPage} dari {totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedbacks Tab */}
          <TabsContent value="feedbacks" className="mt-0">
            <AdminFeedbackDashboard 
              onLogout={onLogout}
              onNavigateToDashboard={() => setActiveTab("overview")}
              embedded={true}
            />
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>News Management</CardTitle>
                    <CardDescription>Kelola artikel dan berita</CardDescription>
                  </div>
                  <Button className="flex items-center gap-2" onClick={() => navigate('/news')}>
                    <Plus className="w-4 h-4" />
                    Tambah Berita
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Newspaper className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Kelola berita di halaman Berita</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/news')}>
                    Buka Halaman Berita
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>Statistik dan laporan sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Analytics akan segera tersedia</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Pengaturan sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Settings akan segera tersedia</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

