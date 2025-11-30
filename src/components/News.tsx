import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Leaf, ArrowLeft, Home, Newspaper, Calendar, Tag, ExternalLink, TrendingUp, Filter, Plus, Upload, X, Edit, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";

interface NewsProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
}

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: "teknologi" | "budidaya" | "pasar" | "penelitian";
  date: string;
  image: string;
  author: string;
  readTime: string;
  content?: string;
  url?: string; // URL untuk berita dari internet
  isRealNews?: boolean; // Flag untuk membedakan berita real vs lokal
}

export default function News({ onLogout, onNavigateToDashboard }: NewsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  
  // Check user role
  const [userRole, setUserRole] = useState<string>('user');
  
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        setUserRole(user.role || 'user');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }, []);

  // Fetch news from backend API
  React.useEffect(() => {
    fetchNewsFromBackend();
  }, [selectedCategory]);

  const fetchNewsFromBackend = async () => {
    setIsLoadingNews(true);
    setNewsError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const categoryParam = selectedCategory !== 'semua' ? `?category=${selectedCategory}` : '';
      
      const response = await fetch(`${API_URL}/api/news${categoryParam}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.news && Array.isArray(data.news)) {
          // Map backend data ke format NewsArticle
          const mappedNews: NewsArticle[] = data.news.map((item: any) => ({
            id: item.news_id.toString(),
            title: item.title,
            excerpt: item.excerpt,
            category: item.category,
            date: new Date(item.created_at).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            image: item.image_url,
            author: item.author,
            readTime: item.read_time,
            content: item.content,
            url: item.external_url,
            isRealNews: false
          }));
          
          setNewsList(mappedNews);
          setIsLoadingNews(false);
        }
      } else {
        throw new Error('Failed to fetch news from backend');
      }
    } catch (error) {
      console.error('Error fetching news from backend:', error);
      setNewsError("Tidak dapat memuat berita dari server. Pastikan backend berjalan.");
      setNewsList([]);
      setIsLoadingNews(false);
    }
  };

  // Fetch real news from external sources (optional, can be triggered manually)
  const fetchRealNews = async () => {
    setIsLoadingNews(true);
    setNewsError(null);
    
    try {
      // Menggunakan API berita Indonesia yang gratis
      const sources = [
        { url: 'https://api-berita-indonesia.vercel.app/cnn/terbaru', name: 'CNN' },
        { url: 'https://api-berita-indonesia.vercel.app/antaranews/terbaru', name: 'Antara' },
        { url: 'https://api-berita-indonesia.vercel.app/tribun/terbaru', name: 'Tribun' }
      ];

      const allNews: NewsArticle[] = [];
      
      // Fetch dari beberapa sumber
      for (const source of sources) {
        try {
          const response = await fetch(source.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            // Parse data dari API (format bisa berbeda per API)
            let articlesData: any[] = [];
            
            if (data.data && Array.isArray(data.data)) {
              articlesData = data.data;
            } else if (data.articles && Array.isArray(data.articles)) {
              articlesData = data.articles;
            } else if (data.results && Array.isArray(data.results)) {
              articlesData = data.results;
            } else if (Array.isArray(data)) {
              articlesData = data;
            }
            
            if (articlesData.length > 0) {
              const articles = articlesData.slice(0, 3).map((item: any, index: number) => {
                // Map ke format NewsArticle
                const title = item.title || item.headline || item.judul || '';
                const description = item.description || item.content || item.excerpt || item.isi || item.summary || '';
                const image = item.image || item.thumbnail || item.urlToImage || item.gambar || item.img || 'https://images.unsplash.com/photo-1642519561465-d9c699d2dddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
                const link = item.link || item.url || item.permalink || '';
                const pubDate = item.pubDate || item.publishedAt || item.tanggal || item.date || new Date().toISOString();
                
                // Kategorisasi berdasarkan keyword
                let category: "teknologi" | "budidaya" | "pasar" | "penelitian" = "teknologi";
                const titleLower = title.toLowerCase();
                const descLower = description.toLowerCase();
                
                if (titleLower.includes('budidaya') || titleLower.includes('tanam') || titleLower.includes('panen') || titleLower.includes('pertanian') || descLower.includes('budidaya') || descLower.includes('pertanian')) {
                  category = "budidaya";
                } else if (titleLower.includes('harga') || titleLower.includes('pasar') || titleLower.includes('ekspor') || titleLower.includes('komoditas') || descLower.includes('harga') || descLower.includes('pasar')) {
                  category = "pasar";
                } else if (titleLower.includes('penelitian') || titleLower.includes('riset') || titleLower.includes('studi') || titleLower.includes('penemuan') || descLower.includes('penelitian')) {
                  category = "penelitian";
                } else if (titleLower.includes('teknologi') || titleLower.includes('ai') || titleLower.includes('iot') || titleLower.includes('digital') || titleLower.includes('sensor') || descLower.includes('teknologi')) {
                  category = "teknologi";
                }

                return {
                  id: `real-${Date.now()}-${source.name}-${index}`,
                  title: title,
                  excerpt: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
                  category: category,
                  date: new Date(pubDate).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }),
                  image: image,
                  author: item.author || item.source || item.penulis || source.name || 'Sumber Berita',
                  readTime: `${Math.ceil((description.length || 500) / 200)} menit`,
                  content: description,
                  url: link,
                  isRealNews: true
                } as NewsArticle;
              });
              
              allNews.push(...articles);
            }
          }
        } catch (error) {
          console.error(`Error fetching from ${source.name}:`, error);
        }
      }

      // Jika berhasil mendapatkan berita eksternal
      if (allNews.length > 0) {
        setNewsList(allNews);
        toast.success(`Berhasil memuat ${allNews.length} berita terbaru dari internet`);
      } else {
        setNewsError("Tidak dapat memuat berita dari sumber eksternal");
        toast.error("Gagal memuat berita eksternal");
      }
    } catch (error) {
      console.error('Error fetching real news:', error);
      setNewsError("Gagal memuat berita dari internet");
      toast.error("Gagal memuat berita eksternal");
    } finally {
      setIsLoadingNews(false);
    }
  };
  
  const isAdmin = userRole === 'superadmin';
  
  // Form state untuk membuat berita baru
  const [newArticle, setNewArticle] = useState({
    title: "",
    excerpt: "",
    category: "teknologi" as "teknologi" | "budidaya" | "pasar" | "penelitian",
    content: "",
    image: "",
    author: "",
    readTime: "5 menit"
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const getCategoryColor = (category: string) => {
    const colors = {
      teknologi: "bg-blue-100 text-blue-800 border-blue-300",
      budidaya: "bg-green-100 text-green-800 border-green-300",
      pasar: "bg-orange-100 text-orange-800 border-orange-300",
      penelitian: "bg-purple-100 text-purple-800 border-purple-300"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredNews = selectedCategory === "semua" 
    ? newsList 
    : newsList.filter(news => news.category === selectedCategory);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar", {
          description: "Maksimal ukuran file adalah 5MB"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setNewArticle({ ...newArticle, image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newArticle.title || !newArticle.excerpt || !newArticle.content || !newArticle.author) {
      toast.error("Form tidak lengkap", {
        description: "Harap isi semua field yang wajib"
      });
      return;
    }

    if (!newArticle.image) {
      toast.error("Gambar wajib diisi", {
        description: "Silakan upload gambar untuk berita"
      });
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(`${API_URL}/api/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newArticle.title,
          excerpt: newArticle.excerpt,
          content: newArticle.content,
          category: newArticle.category,
          image_url: newArticle.image,
          author: newArticle.author,
          read_time: newArticle.readTime,
          created_by: user.user_id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Reset form
        setNewArticle({
          title: "",
          excerpt: "",
          category: "teknologi",
          content: "",
          image: "",
          author: "",
          readTime: "5 menit"
        });
        setImagePreview(null);
        setShowCreateDialog(false);
        
        // Refresh news list
        await fetchNewsFromBackend();
        
        toast.success("Berita berhasil dibuat", {
          description: "Berita baru telah ditambahkan ke database"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create news');
      }
    } catch (error: any) {
      console.error('Error creating news:', error);
      toast.error("Gagal membuat berita", {
        description: error.message || "Terjadi kesalahan saat membuat berita"
      });
    }
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    // Reset form when closing
    setNewArticle({
      title: "",
      excerpt: "",
      category: "teknologi",
      content: "",
      image: "",
      author: "",
      readTime: "5 menit"
    });
    setImagePreview(null);
  };

  const handleEditArticle = (article: NewsArticle) => {
    setEditingArticleId(article.id);
    setNewArticle({
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      content: article.content || article.excerpt,
      image: article.image,
      author: article.author,
      readTime: article.readTime
    });
    setImagePreview(article.image);
    setShowEditDialog(true);
  };

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingArticleId) return;

    // Validation
    if (!newArticle.title || !newArticle.excerpt || !newArticle.content || !newArticle.author) {
      toast.error("Form tidak lengkap", {
        description: "Harap isi semua field yang wajib"
      });
      return;
    }

    if (!newArticle.image) {
      toast.error("Gambar wajib diisi", {
        description: "Silakan upload gambar untuk berita"
      });
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(`${API_URL}/api/news/${editingArticleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newArticle.title,
          excerpt: newArticle.excerpt,
          content: newArticle.content,
          category: newArticle.category,
          image_url: newArticle.image,
          author: newArticle.author,
          read_time: newArticle.readTime,
          admin_id: user.user_id
        }),
      });

      if (response.ok) {
        // Reset form
        setNewArticle({
          title: "",
          excerpt: "",
          category: "teknologi",
          content: "",
          image: "",
          author: "",
          readTime: "5 menit"
        });
        setImagePreview(null);
        setEditingArticleId(null);
        setShowEditDialog(false);
        
        // Refresh news list
        await fetchNewsFromBackend();
        
        toast.success("Berita berhasil diperbarui", {
          description: "Perubahan telah disimpan ke database"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update news');
      }
    } catch (error: any) {
      console.error('Error updating news:', error);
      toast.error("Gagal memperbarui berita", {
        description: error.message || "Terjadi kesalahan saat memperbarui berita"
      });
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        const response = await fetch(`${API_URL}/api/news/${articleId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            admin_id: user.user_id
          }),
        });

        if (response.ok) {
          // Refresh news list
          await fetchNewsFromBackend();
          
          toast.success("Berita berhasil dihapus", {
            description: "Berita telah dihapus dari database"
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete news');
        }
      } catch (error: any) {
        console.error('Error deleting news:', error);
        toast.error("Gagal menghapus berita", {
          description: error.message || "Terjadi kesalahan saat menghapus berita"
        });
      }
    }
  };

  const handleEditDialogClose = () => {
    setShowEditDialog(false);
    setEditingArticleId(null);
    // Reset form when closing
    setNewArticle({
      title: "",
      excerpt: "",
      category: "teknologi",
      content: "",
      image: "",
      author: "",
      readTime: "5 menit"
    });
    setImagePreview(null);
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
                onClick={onNavigateToDashboard}
                className="text-gray-700 hover:text-[#2ECC71]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <div className="flex items-center gap-3">
                <img 
                  src="/images/plantvision-logo.png" 
                  alt="PlantVision Logo" 
                  className="h-10 w-auto"
                />
                <span className="text-gray-900 tracking-tight font-semibold">Berita</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={onNavigateToDashboard}
              >
                <Home className="w-4 h-4 mr-2" />
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 mb-4">
              <TrendingUp className="w-5 h-5 text-[#F39C12]" />
              <span className="text-gray-700">Update Terkini</span>
            </div>
            <h1 className="text-4xl md:text-5xl text-gray-900 mb-4">
              Berita Pertanian & Jeruk
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Informasi terbaru seputar teknologi, budidaya, pasar, dan penelitian di industri jeruk Indonesia
            </p>
            {/* Tombol Buat Berita - Hanya untuk Superadmin */}
            {isAdmin && (
              <div className="flex items-center justify-center">
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-[#2ECC71] to-[#F39C12] hover:from-[#27AE60] hover:to-[#E67E22] text-white shadow-lg"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Buat Berita Baru
                </Button>
              </div>
            )}
            {/* Error Message */}
            {newsError && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm max-w-2xl mx-auto">
                {newsError}
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="semua" className="mb-8" onValueChange={setSelectedCategory}>
            <TabsList className="flex w-full mb-6 gap-2 overflow-x-auto no-scrollbar">
              <TabsTrigger value="semua" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#2ECC71] data-[state=active]:to-[#27AE60] data-[state=active]:text-white">
                Semua
              </TabsTrigger>
              <TabsTrigger value="teknologi" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Teknologi
              </TabsTrigger>
              <TabsTrigger value="budidaya" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Budidaya
              </TabsTrigger>
              <TabsTrigger value="pasar" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Pasar
              </TabsTrigger>
              <TabsTrigger value="penelitian" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Penelitian
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              {/* Loading State */}
              {isLoadingNews && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2ECC71] mx-auto mb-4"></div>
                  <p className="text-gray-600">Memuat berita...</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoadingNews && filteredNews.length === 0 && (
                <Card className="p-12 text-center">
                  <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Berita</h3>
                  <p className="text-gray-500">
                    {selectedCategory === 'semua' 
                      ? 'Belum ada berita yang tersedia. Admin dapat menambahkan berita baru menggunakan tombol "Buat Berita Baru" di atas.'
                      : `Belum ada berita di kategori ${selectedCategory}.`}
                  </p>
                </Card>
              )}

              {/* Featured News */}
              {!isLoadingNews && filteredNews.length > 0 && (
                <Card className="mb-8 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-auto">
                      <ImageWithFallback 
                        src={filteredNews[0].image}
                        alt={filteredNews[0].title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className={`absolute top-4 left-4 ${getCategoryColor(filteredNews[0].category)}`}>
                        {filteredNews[0].category.toUpperCase()}
                      </Badge>
                    </div>
                    <CardContent className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {filteredNews[0].date}
                        </span>
                        <span>•</span>
                        <span>{filteredNews[0].readTime}</span>
                      </div>
                      <h2 className="text-3xl text-gray-900 mb-4">
                        {filteredNews[0].title}
                      </h2>
                      <p className="text-gray-600 mb-6">
                        {filteredNews[0].excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Oleh {filteredNews[0].author}</span>
                        <div className="flex items-center gap-2">
                          {/* Edit & Delete - Hanya untuk Superadmin */}
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditArticle(filteredNews[0])}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteArticle(filteredNews[0].id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Hapus
                              </Button>
                            </>
                          )}
                          {filteredNews[0].url ? (
                            <Button 
                              onClick={() => window.open(filteredNews[0].url, '_blank')}
                              className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                            >
                              Baca di Sumber Asli
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => {
                                setSelectedArticle(filteredNews[0]);
                                setShowDetailDialog(true);
                              }}
                              className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                            >
                              Baca Selengkapnya
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )}

              {/* News Grid */}
              {!isLoadingNews && filteredNews.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNews.slice(1).map((article) => (
                  <Card key={article.id} className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="relative h-48">
                      <ImageWithFallback 
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className={`absolute top-3 left-3 ${getCategoryColor(article.category)}`}>
                        {article.category.toUpperCase()}
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {article.date}
                        </span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>
                      <h3 className="text-gray-900 mb-3 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-gray-500 text-sm">{article.author}</span>
                        <div className="flex items-center gap-1">
                          {/* Edit & Delete - Hanya untuk Superadmin */}
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditArticle(article)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteArticle(article.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {article.url ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[#2ECC71] hover:text-[#27AE60]"
                              onClick={() => window.open(article.url, '_blank')}
                            >
                              Baca di Sumber <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[#2ECC71] hover:text-[#27AE60]"
                              onClick={() => {
                                setSelectedArticle(article);
                                setShowDetailDialog(true);
                              }}
                            >
                              Baca <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Create News Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            if (!open) {
              handleDialogClose();
            }
          }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] h-[90vh] p-0 flex flex-col [&>button]:z-10 overflow-visible">
              <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-3 border-b">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#2ECC71]" />
                  Buat Berita Baru
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Lengkapi form di bawah untuk membuat berita baru
                </DialogDescription>
              </DialogHeader>

              <form id="create-news-form" onSubmit={handleCreateArticle} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                  {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Berita *</Label>
                  <Input
                    id="title"
                    placeholder="Masukkan judul berita"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    required
                  />
                </div>

                {/* Category and Author */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <select
                      id="category"
                      value={newArticle.category}
                      onChange={(e) =>
                        setNewArticle({
                          ...newArticle,
                          category: e.target.value as "teknologi" | "budidaya" | "pasar" | "penelitian",
                        })
                      }
                      className="border-gray-300 dark:border-gray-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 rounded-lg border bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 w-full shadow-sm"
                      required
                    >
                      <option value="teknologi">Teknologi</option>
                      <option value="budidaya">Budidaya</option>
                      <option value="pasar">Pasar</option>
                      <option value="penelitian">Penelitian</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Penulis *</Label>
                    <Input
                      id="author"
                      placeholder="Nama penulis"
                      value={newArticle.author}
                      onChange={(e) => setNewArticle({ ...newArticle, author: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Ringkasan/Excerpt *</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Ringkasan singkat berita (akan ditampilkan di card berita)"
                    value={newArticle.excerpt}
                    onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <Label htmlFor="content" className="text-sm">Isi Berita *</Label>
                  <Textarea
                    id="content"
                    placeholder="Tulis isi berita lengkap di sini..."
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    rows={5}
                    required
                    className="min-h-[120px] text-sm"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-1">
                  <Label htmlFor="image" className="text-sm">Gambar Berita *</Label>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null);
                          setNewArticle({ ...newArticle, image: "" });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2ECC71] transition-all bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="mb-1 text-xs text-gray-500">
                          <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                        </p>
                        <p className="text-[10px] text-gray-500">PNG, JPG atau JPEG (Max. 5MB)</p>
                      </div>
                      <input
                        id="image"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        required={!newArticle.image}
                      />
                    </label>
                  )}
                </div>

                {/* Read Time */}
                <div className="space-y-2">
                  <Label htmlFor="readTime">Waktu Baca (opsional)</Label>
                  <Input
                    id="readTime"
                    placeholder="Contoh: 5 menit"
                    value={newArticle.readTime}
                    onChange={(e) => setNewArticle({ ...newArticle, readTime: e.target.value })}
                  />
                  </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex justify-end gap-2 pt-3 border-t flex-shrink-0 px-4 pb-4 bg-white mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDialogClose}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-gradient-to-r from-[#2ECC71] to-[#F39C12] hover:from-[#27AE60] hover:to-[#E67E22] text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Publikasikan
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit News Dialog */}
          <Dialog open={showEditDialog} onOpenChange={(open) => {
            if (!open) {
              handleEditDialogClose();
            }
          }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] h-[90vh] p-0 flex flex-col [&>button]:z-10 overflow-visible">
              <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-3 border-b">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Edit Berita
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Edit informasi berita di bawah ini
                </DialogDescription>
              </DialogHeader>

              <form id="edit-news-form" onSubmit={handleUpdateArticle} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Judul Berita *</Label>
                    <Input
                      id="edit-title"
                      placeholder="Masukkan judul berita"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                      required
                    />
                  </div>

                  {/* Category and Author */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Kategori *</Label>
                      <select
                        id="edit-category"
                        value={newArticle.category}
                        onChange={(e) =>
                          setNewArticle({
                            ...newArticle,
                            category: e.target.value as "teknologi" | "budidaya" | "pasar" | "penelitian",
                          })
                        }
                        className="border-gray-300 dark:border-gray-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 rounded-lg border bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 w-full shadow-sm"
                        required
                      >
                        <option value="teknologi">Teknologi</option>
                        <option value="budidaya">Budidaya</option>
                        <option value="pasar">Pasar</option>
                        <option value="penelitian">Penelitian</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-author">Penulis *</Label>
                      <Input
                        id="edit-author"
                        placeholder="Nama penulis"
                        value={newArticle.author}
                        onChange={(e) => setNewArticle({ ...newArticle, author: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-excerpt">Ringkasan/Excerpt *</Label>
                    <Textarea
                      id="edit-excerpt"
                      placeholder="Ringkasan singkat berita (akan ditampilkan di card berita)"
                      value={newArticle.excerpt}
                      onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-content" className="text-sm">Isi Berita *</Label>
                    <Textarea
                      id="edit-content"
                      placeholder="Tulis isi berita lengkap di sini..."
                      value={newArticle.content}
                      onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                      rows={5}
                      required
                      className="min-h-[120px] text-sm"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-image" className="text-sm">Gambar Berita *</Label>
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview(null);
                            setNewArticle({ ...newArticle, image: "" });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2ECC71] transition-all bg-gray-50">
                        <div className="flex flex-col items-center justify-center pt-4 pb-4">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="mb-1 text-xs text-gray-500">
                            <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                          </p>
                          <p className="text-[10px] text-gray-500">PNG, JPG atau JPEG (Max. 5MB)</p>
                        </div>
                <input 
                          id="edit-image"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          required={!newArticle.image}
                        />
                      </label>
                    )}
                  </div>

                  {/* Read Time */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-readTime">Waktu Baca (opsional)</Label>
                    <Input
                      id="edit-readTime"
                      placeholder="Contoh: 5 menit"
                      value={newArticle.readTime}
                      onChange={(e) => setNewArticle({ ...newArticle, readTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex justify-end gap-2 pt-3 border-t flex-shrink-0 px-4 pb-4 bg-white mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEditDialogClose}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-black"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* News Detail Dialog */}
          <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 !grid-rows-[auto_1fr_auto] [&>button]:z-10">
              {selectedArticle && (
                <>
                  <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(selectedArticle.category)}>
                        {selectedArticle.category.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {selectedArticle.date} • {selectedArticle.readTime}
                      </span>
                    </div>
                    <DialogTitle className="text-2xl text-gray-900">
                      {selectedArticle.title}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      Oleh {selectedArticle.author}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                    <div className="space-y-6">
                      {/* Featured Image */}
                      {selectedArticle.image && (
                        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                          <ImageWithFallback
                            src={selectedArticle.image}
                            alt={selectedArticle.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Excerpt */}
                      <div className="text-lg text-gray-700 font-medium border-l-4 border-[#2ECC71] pl-4 py-2 bg-green-50 rounded-r">
                        {selectedArticle.excerpt}
                      </div>

                      {/* Content */}
                      <div className="prose prose-lg max-w-none">
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {selectedArticle.content || selectedArticle.excerpt}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0 px-6 pb-6 bg-white">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailDialog(false)}
                    >
                      Tutup
                </Button>
              </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

