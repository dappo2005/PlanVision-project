import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  BarChart3, Users, MessageSquare, Newspaper, 
  Activity, Shield, ArrowLeft, Eye, Edit, Trash2,
  Plus, Search, Filter, Download, Calendar, Clock, CheckCircle2,
  XCircle, AlertCircle, Star, UserPlus, FileText
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
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

interface ActivityItem {
  type: 'detection' | 'new_user';
  description: string;
  user_nama: string;
  user_email: string;
  timestamp: string | null;
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

  // Activities state
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  // Users management state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // User Modals State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [addForm, setAddForm] = useState({
    nama: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    role: 'user',
    status: 'aktif'
  });

  const [editForm, setEditForm] = useState({
    nama: '',
    email: '',
    username: '',
    phone: '',
    role: 'user',
    status: 'aktif'
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("User berhasil dibuat!");
        setShowAddModal(false);
        setAddForm({ nama: '', email: '', username: '', password: '', phone: '', role: 'user', status: 'aktif' });
        loadUsers();
      } else {
        toast.error(data.error || "Gagal membuat user");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${selectedUser.user_id}`, {
        method: 'PUT',
        headers: fetchHeaders,
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("User berhasil diperbarui!");
        setShowEditModal(false);
        loadUsers();
      } else {
        toast.error(data.error || "Gagal memperbarui user");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${selectedUser.user_id}`, {
        method: 'DELETE',
        headers: fetchHeaders
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("User berhasil dihapus!");
        setShowDeleteModal(false);
        loadUsers();
      } else {
        toast.error(data.error || "Gagal menghapus user");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server");
    }
  };

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

  // Load stats & activities when adminId is available
  useEffect(() => {
    if (adminId && isAdmin) {
      loadDashboardStats();
      loadActivities();
    }
  }, [adminId, isAdmin]);

  const loadActivities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/activities`, { headers: fetchHeaders });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (e) {
      console.error('Error loading activities:', e);
    }
  };

  // Load users when tab changes to users
  useEffect(() => {
    if (adminId && isAdmin && activeTab === 'users') {
      loadUsers();
    }
  }, [adminId, isAdmin, activeTab, currentPage, searchQuery, roleFilter]);

  // Headers untuk bypass ngrok warning page
  const fetchHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter) params.append('role', roleFilter);
      
      const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: fetchHeaders
      });
      
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
      // Load stats from multiple endpoints with ngrok headers
      const [usersRes, feedbacksRes, detectionsRes, newsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users/stats`, { headers: fetchHeaders }).catch(() => null),
        fetch(`${API_URL}/api/admin/feedbacks/stats?admin_id=${adminId}`, { headers: fetchHeaders }).catch(() => null),
        fetch(`${API_URL}/api/admin/detections/stats`, { headers: fetchHeaders }).catch(() => null),
        fetch(`${API_URL}/api/admin/news/stats`, { headers: fetchHeaders }).catch(() => null)
      ]);

      const usersData = usersRes?.ok ? await usersRes.json() : { total: 0, active: 0 };
      const feedbacksData = feedbacksRes?.ok ? await feedbacksRes.json() : { total: 0, pending: 0, by_status: {} };
      const detectionsData = detectionsRes?.ok ? await detectionsRes.json() : { total: 0 };
      const newsData = newsRes?.ok ? await newsRes.json() : { total: 0 };

      setStats({
        totalUsers: usersData.total || 0,
        totalFeedbacks: feedbacksData.total || 0,
        totalNews: newsData.total || 0,
        totalDetections: detectionsData.total || 0,
        activeUsers: usersData.active || 0,
        pendingFeedbacks: feedbacksData.by_status?.pending || feedbacksData.pending || 0,
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
        <div className="container mx-auto px-4 py-4 pl-16 lg:pl-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-500 mt-1">Kelola seluruh sistem PlantVision</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex bg-purple-50 text-purple-700 border-purple-200">
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
          <TabsList className="inline-flex w-full sm:w-auto items-center justify-center gap-1 p-1.5 bg-gray-100 rounded-2xl border border-gray-200 mx-auto">
              <TabsTrigger 
                value="overview" 
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-700 hover:text-gray-900 whitespace-nowrap"
              >
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-700 hover:text-gray-900 whitespace-nowrap"
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger 
                value="feedbacks" 
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-700 hover:text-gray-900 whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Feedbacks</span>
              </TabsTrigger>
              <TabsTrigger 
                value="news" 
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-700 hover:text-gray-900 whitespace-nowrap"
              >
                <Newspaper className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Berita</span>
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
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity - Dynamic */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Aktivitas terbaru di sistem (real-time)</CardDescription>
                      </div>
                      <button
                        onClick={loadActivities}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-all"
                      >
                        Refresh
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activities.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Belum ada aktivitas</p>
                        </div>
                      ) : activities.map((act, i) => {
                        const isDetection = act.type === 'detection';
                        const timeLabel = act.timestamp ? (() => {
                          const diff = Date.now() - new Date(act.timestamp).getTime();
                          const mins = Math.floor(diff / 60000);
                          const hrs = Math.floor(mins / 60);
                          const days = Math.floor(hrs / 24);
                          if (mins < 60) return `${mins} menit lalu`;
                          if (hrs < 24) return `${hrs} jam lalu`;
                          return `${days} hari lalu`;
                        })() : '-';
                        return (
                          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isDetection ? 'bg-green-100' : 'bg-blue-100'}`}>
                              {isDetection
                                ? <Activity className="w-4 h-4 text-green-600" />
                                : <Users className="w-4 h-4 text-blue-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{act.user_nama}</p>
                              <p className="text-xs text-gray-500 truncate">{act.description}</p>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{timeLabel}</span>
                          </div>
                        );
                      })}
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
                  <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowAddModal(true)}>
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
                      <div className="border rounded-lg overflow-hidden overflow-x-auto">
                        <table className="w-full min-w-[900px]">
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
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      title="Detail User"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowDetailModal(true);
                                      }}
                                    >
                                      <Eye className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      title="Edit User"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setEditForm({
                                          nama: user.nama,
                                          email: user.email,
                                          username: user.username,
                                          phone: user.phone || '',
                                          role: user.role,
                                          status: user.status
                                        });
                                        setShowEditModal(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4 text-amber-600" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      title="Hapus User"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowDeleteModal(true);
                                      }}
                                    >
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
        </Tabs>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
            <DialogDescription>Informasi lengkap akun pengguna</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">User ID</span>
                <span className="text-gray-900 font-semibold">{selectedUser.user_id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Nama</span>
                <span className="text-gray-900">{selectedUser.nama}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Email</span>
                <span className="text-gray-900">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Username</span>
                <span className="text-gray-900">{selectedUser.username}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">No. Telepon</span>
                <span className="text-gray-900">{selectedUser.phone || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Role</span>
                <Badge variant={selectedUser.role === 'superadmin' ? 'default' : 'secondary'}>
                  {selectedUser.role}
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Status</span>
                <Badge variant={selectedUser.status === 'aktif' ? 'default' : 'secondary'}>
                  {selectedUser.status}
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Tanggal Daftar</span>
                <span className="text-gray-900">
                  {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('id-ID') : '-'}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Perbarui data dan hak akses pengguna</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-nama">Nama Lengkap</Label>
              <Input
                id="edit-nama"
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">No. Telepon</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <select
                  id="edit-role"
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status Akun</Label>
                <select
                  id="edit-status"
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun user <strong>{selectedUser?.nama}</strong> ({selectedUser?.email})? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Hapus User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>Buat akun baru secara manual oleh Admin</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div>
              <Label htmlFor="add-nama">Nama Lengkap</Label>
              <Input
                id="add-nama"
                value={addForm.nama}
                onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                placeholder="cth: Budi Santoso"
                required
              />
            </div>
            <div>
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="cth: budi@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="add-username">Username</Label>
              <Input
                id="add-username"
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                placeholder="cth: budisantoso"
                required
              />
            </div>
            <div>
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
            <div>
              <Label htmlFor="add-phone">No. Telepon (Opsional)</Label>
              <Input
                id="add-phone"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                placeholder="cth: 08123456789"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-role">Role</Label>
                <select
                  id="add-role"
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div>
                <Label htmlFor="add-status">Status Akun</Label>
                <select
                  id="add-status"
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                  value={addForm.status}
                  onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Batal</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Buat User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

