import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { 
  ArrowLeft, MessageSquare, TrendingUp, Clock, CheckCircle, XCircle, 
  Star, Filter, Search, Eye, Edit, Send, BarChart3 
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

interface Stats {
  total: number;
  by_status: { [key: string]: number };
  by_category: { [key: string]: number };
  by_rating: { [key: string]: number };
  by_user_role: { [key: string]: number };
  avg_rating: number;
  recent_count: number;
}

interface Feedback {
  feedback_id: number;
  user_id: number | null;
  nama: string;
  email: string;
  rating: number;
  category: string;
  message: string;
  user_role: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
  admin_notes: string | null;
}

interface AdminFeedbackDashboardProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
  embedded?: boolean; // Jika true, tidak tampilkan Navbar
}

export default function AdminFeedbackDashboard({ onLogout, onNavigateToDashboard, embedded = false }: AdminFeedbackDashboardProps) {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const [adminId, setAdminId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    priority: '',
    admin_notes: ''
  });
  const [responseText, setResponseText] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    // Load admin data
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        const id = user.user_id || user.id;
        const role = user.role;
        
        setAdminId(id);
        
        // Check if user is superadmin
        if (role === 'superadmin') {
          setIsAdmin(true);
          loadStats(id);
          loadFeedbacks(id);
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

  const loadStats = async (aid: number) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/feedbacks/stats?admin_id=${aid}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadFeedbacks = async (aid: number, status?: string, category?: string, sort?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        admin_id: aid.toString(),
        sort: sort || sortBy
      });
      
      if (status && status !== 'all') params.append('status', status);
      if (category && category !== 'all') params.append('category', category);
      
      const response = await fetch(`${API_URL}/api/admin/feedbacks?${params}`);
      const data = await response.json();

      if (response.ok) {
        setFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminId && isAdmin) {
      loadFeedbacks(adminId, statusFilter, categoryFilter, sortBy);
    }
  }, [statusFilter, categoryFilter, sortBy]);

  const handleUpdateStatus = async () => {
    if (!selectedFeedback || !adminId) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/feedbacks/${selectedFeedback.feedback_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminId,
          status: updateForm.status,
          priority: updateForm.priority,
          admin_notes: updateForm.admin_notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Status berhasil diupdate!");
        setShowUpdateDialog(false);
        loadFeedbacks(adminId, statusFilter, categoryFilter, sortBy);
        loadStats(adminId);
      } else {
        toast.error("Gagal update status", { description: data.error });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Gagal update status");
    }
  };

  const handleAddResponse = async () => {
    if (!selectedFeedback || !adminId || !responseText) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/feedbacks/${selectedFeedback.feedback_id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminId,
          response_text: responseText,
          is_internal: isInternal
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Response berhasil ditambahkan!");
        setResponseText('');
        setIsInternal(false);
      } else {
        toast.error("Gagal menambahkan response", { description: data.error });
      }
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error("Gagal menambahkan response");
    }
  };

  const openDetailDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailDialog(true);
  };

  const openUpdateDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setUpdateForm({
      status: feedback.status,
      priority: feedback.priority,
      admin_notes: feedback.admin_notes || ''
    });
    setShowUpdateDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      in_review: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    return <Badge className={styles[status as keyof typeof styles]}>{status}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      umum: "Umum", fitur: "Fitur", bug: "Bug", desain: "Desain", saran: "Saran"
    };
    return labels[category as keyof typeof labels] || category;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      fb.nama.toLowerCase().includes(query) ||
      fb.email.toLowerCase().includes(query) ||
      fb.message.toLowerCase().includes(query)
    );
  });

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  const containerClass = embedded 
    ? "bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-lg"
    : "min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50";
  
  const contentClass = embedded ? "p-6" : "container mx-auto px-4 py-8";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Total Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500 mt-1">{stats.recent_count} baru (7 hari)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Rating Rata-rata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-gray-900">{stats.avg_rating}</p>
                  <Star className="w-6 h-6 fill-[#F39C12] text-[#F39C12]" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600">{stats.by_status.pending || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{stats.by_status.resolved || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Kategori</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="umum">Umum</SelectItem>
                    <SelectItem value="fitur">Fitur</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="desain">Desain</SelectItem>
                    <SelectItem value="saran">Saran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Terbaru" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="date_desc">Terbaru</SelectItem>
                    <SelectItem value="date_asc">Terlama</SelectItem>
                    <SelectItem value="rating_desc">Rating Tertinggi</SelectItem>
                    <SelectItem value="rating_asc">Rating Terendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama, email, pesan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Memuat feedback...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <Card key={feedback.feedback_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{feedback.nama}</h3>
                        {getStatusBadge(feedback.status)}
                        <Badge variant="outline">{getCategoryLabel(feedback.category)}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {feedback.user_role === 'guest' ? '👤 Guest' : '✅ User'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feedback.email}</p>
                      <p className="text-gray-700 mb-3">{feedback.message.substring(0, 150)}...</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-[#F39C12] text-[#F39C12]" />
                          {feedback.rating}/5
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(feedback.created_at)}
                        </span>
                        <span>Priority: {feedback.priority}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetailDialog(feedback)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={() => openUpdateDialog(feedback)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredFeedbacks.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada feedback ditemukan</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Feedback</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama</Label>
                  <p className="text-gray-900">{selectedFeedback.nama}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-gray-900">{selectedFeedback.email}</p>
                </div>
                <div>
                  <Label>Rating</Label>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < selectedFeedback.rating
                            ? "fill-[#F39C12] text-[#F39C12]"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <p className="text-gray-900">{getCategoryLabel(selectedFeedback.category)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedFeedback.status)}</div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <p className="text-gray-900">{selectedFeedback.priority}</p>
                </div>
              </div>
              <div>
                <Label>Pesan</Label>
                <p className="text-gray-900 mt-2 p-4 bg-gray-50 rounded">{selectedFeedback.message}</p>
              </div>
              {selectedFeedback.admin_notes && (
                <div>
                  <Label>Admin Notes</Label>
                  <p className="text-gray-900 mt-2 p-4 bg-blue-50 rounded">{selectedFeedback.admin_notes}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Add Response</Label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Tulis response untuk user..."
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isInternal"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                  />
                  <Label htmlFor="isInternal">Internal note (tidak dikirim ke user)</Label>
                </div>
                <Button onClick={handleAddResponse} disabled={!responseText}>
                  <Send className="w-4 h-4 mr-2" />
                  Kirim Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Feedback Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Priority</Label>
              <select
                value={updateForm.priority}
                onChange={(e) => setUpdateForm({...updateForm, priority: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Admin Notes</Label>
              <Textarea
                value={updateForm.admin_notes}
                onChange={(e) => setUpdateForm({...updateForm, admin_notes: e.target.value})}
                placeholder="Catatan internal atau pesan untuk user..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Batal</Button>
            <Button onClick={handleUpdateStatus}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

