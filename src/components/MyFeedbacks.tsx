import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, MessageSquare, Clock, CheckCircle, XCircle, Eye, Star } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Feedback {
  feedback_id: number;
  rating: number;
  category: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  admin_notes: string | null;
}

interface MyFeedbacksProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
}

export default function MyFeedbacks({ onLogout, onNavigateToDashboard }: MyFeedbacksProps) {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Load user data
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        const id = user.user_id || user.id;
        setUserId(id);
        loadFeedbacks(id);
      } else {
        toast.error("Error", {
          description: "User tidak ditemukan. Silakan login ulang."
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, [navigate]);

  const loadFeedbacks = async (uid: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/feedback/my-feedbacks/${uid}`);
      const data = await response.json();

      if (response.ok) {
        setFeedbacks(data.feedbacks || []);
      } else {
        toast.error("Gagal memuat feedback", {
          description: data.error || "Terjadi kesalahan"
        });
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      toast.error("Gagal memuat feedback", {
        description: "Tidak dapat terhubung ke server"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      in_review: "bg-blue-100 text-blue-800 border-blue-300",
      resolved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300"
    };

    const labels = {
      pending: "Pending",
      in_review: "Dalam Review",
      resolved: "Resolved",
      rejected: "Ditolak"
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      umum: "Umum",
      fitur: "Fitur / Fungsionalitas",
      bug: "Bug / Error",
      desain: "Desain / UI/UX",
      saran: "Saran Fitur Baru"
    };
    return labels[category as keyof typeof labels] || category;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                onClick={() => navigate('/feedback')}
                className="text-gray-700 hover:text-[#2ECC71]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900 tracking-tight">Riwayat Feedback Saya</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={onNavigateToDashboard}
              >
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2">Riwayat Feedback Anda</h1>
            <p className="text-gray-600">
              Lihat status dan balasan dari feedback yang telah Anda kirimkan
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Memuat feedback...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && feedbacks.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl text-gray-900 mb-2">Belum ada feedback</h3>
                <p className="text-gray-600 mb-6">
                  Anda belum pernah mengirimkan feedback. Sampaikan saran atau kritik Anda sekarang!
                </p>
                <Button 
                  onClick={() => navigate('/feedback')}
                  className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                >
                  Kirim Feedback
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Feedback List */}
          {!isLoading && feedbacks.length > 0 && (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <Card key={feedback.feedback_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            {getCategoryLabel(feedback.category)}
                          </CardTitle>
                          {getStatusBadge(feedback.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(feedback.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-[#F39C12] text-[#F39C12]" />
                            {feedback.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Message */}
                    <div>
                      <p className="text-gray-700">{feedback.message}</p>
                    </div>

                    {/* Admin Notes */}
                    {feedback.admin_notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">Catatan dari Admin:</p>
                            <p className="text-sm text-blue-800">{feedback.admin_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Info */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm text-gray-500">
                        {feedback.status === 'resolved' && feedback.resolved_at && (
                          <span>✅ Resolved pada {formatDate(feedback.resolved_at)}</span>
                        )}
                        {feedback.status === 'pending' && (
                          <span>⏳ Menunggu review dari admin</span>
                        )}
                        {feedback.status === 'in_review' && (
                          <span>👁️ Sedang ditinjau oleh admin</span>
                        )}
                        {feedback.status === 'rejected' && (
                          <span>❌ Feedback ditolak</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Prioritas: {feedback.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Button */}
          {!isLoading && feedbacks.length > 0 && (
            <div className="mt-8 text-center">
              <Button 
                onClick={() => navigate('/feedback')}
                className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Kirim Feedback Baru
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

