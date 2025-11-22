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
}

const newsData: NewsArticle[] = [
  {
    id: "1",
    title: "Teknologi AI Meningkatkan Deteksi Penyakit Citrus Greening Hingga 95%",
    excerpt: "Penelitian terbaru menunjukkan bahwa kombinasi machine learning dan sensor IoT dapat mendeteksi Huanglongbing lebih awal, memberikan waktu lebih banyak untuk penanganan.",
    category: "teknologi",
    date: "3 November 2024",
    image: "https://images.unsplash.com/photo-1642519561465-d9c699d2dddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    author: "Dr. Ahmad Suryanto",
    readTime: "5 menit"
  },
  {
    id: "2",
    title: "Harga Jeruk Lokal Naik 30% Menjelang Musim Panen Raya",
    excerpt: "Petani jeruk di Kabupaten Batu optimis dengan kenaikan harga yang mencapai Rp 8.000-10.000 per kg di pasar lokal. Permintaan ekspor juga meningkat signifikan.",
    category: "pasar",
    date: "1 November 2024",
    image: "https://images.unsplash.com/photo-1741012253484-43b5b9b99491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    author: "Budi Hartono",
    readTime: "4 menit"
  },
  {
    id: "3",
    title: "Metode Pangkas Santai Tingkatkan Produktivitas Jeruk Hingga 40%",
    excerpt: "Teknik pemangkasan baru yang dikembangkan IPB University terbukti meningkatkan jumlah buah per pohon tanpa mengurangi kualitas. Metode ini lebih hemat tenaga dan waktu.",
    category: "budidaya",
    date: "30 Oktober 2024",
    image: "https://images.unsplash.com/photo-1730810618606-9a3f016d826d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    author: "Prof. Siti Aminah",
    readTime: "6 menit"
  },
  {
    id: "4",
    title: "Penemuan Varietas Jeruk Tahan HLB dari Hasil Penelitian 10 Tahun",
    excerpt: "BPTP Jawa Timur berhasil mengembangkan varietas jeruk baru yang memiliki ketahanan tinggi terhadap penyakit Huanglongbing (HLB) yang selama ini menjadi momok petani.",
    category: "penelitian",
    date: "28 Oktober 2024",
    image: "https://images.unsplash.com/photo-1741012253484-43b5b9b99491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    author: "Dr. Agus Wijaya",
    readTime: "7 menit"
  },
  {
    id: "5",
    title: "Sensor IoT Bantu Petani Monitoring Kelembaban Tanah Real-Time",
    excerpt: "Implementasi sensor kelembaban tanah berbasis IoT di kebun jeruk Batu membantu petani menghemat air hingga 35% dan meningkatkan efisiensi pemupukan.",
    category: "teknologi",
    date: "26 Oktober 2024",
    image: "https://images.unsplash.com/photo-1642519561465-d9c699d2dddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    author: "Ir. Andi Prasetyo",
    readTime: "5 menit"
  },
  {
    id: "6",
    title: "Ekspor Jeruk Indonesia ke Jepang Meningkat 50% di Kuartal III 2024",
    excerpt: "Kementerian Pertanian mencatat peningkatan signifikan ekspor jeruk premium ke pasar Jepang berkat peningkatan kualitas dan sertifikasi GAP.",
    category: "pasar",
    date: "25 Oktober 2024",
    image: "https://images.unsplash.com/photo-1741012253484-43b5b9b99491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    author: "Maya Kusuma",
    readTime: "4 menit"
  },
  {
    id: "7",
    title: "Pupuk Organik Kombinasi Kompos-Biochar Tingkatkan Hasil Panen 25%",
    excerpt: "Penelitian kolaboratif Universitas Brawijaya dan BPTP menunjukkan bahwa kombinasi kompos dan biochar dapat meningkatkan kesuburan tanah secara berkelanjutan.",
    category: "budidaya",
    date: "23 Oktober 2024",
    image: "https://images.unsplash.com/photo-1730810618606-9a3f016d826d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    author: "Dr. Bambang Sutrisno",
    readTime: "6 menit"
  },
  {
    id: "8",
    title: "Drone Semprot Pestisida Hemat Waktu 70% dan Lebih Presisi",
    excerpt: "Penggunaan drone untuk penyemprotan pestisida di perkebunan jeruk skala besar terbukti lebih efisien, presisi, dan mengurangi paparan kimia pada pekerja.",
    category: "teknologi",
    date: "20 Oktober 2024",
    image: "https://images.unsplash.com/photo-1642519561465-d9c699d2dddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    author: "Dedi Kurniawan",
    readTime: "5 menit"
  }
];

export default function News({ onLogout, onNavigateToDashboard }: NewsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newsList, setNewsList] = useState<NewsArticle[]>(newsData);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  
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

  const handleCreateArticle = (e: React.FormEvent) => {
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

    // Create new article
    const article: NewsArticle = {
      id: Date.now().toString(),
      title: newArticle.title,
      excerpt: newArticle.excerpt,
      category: newArticle.category,
      date: new Date().toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      image: newArticle.image,
      author: newArticle.author,
      readTime: newArticle.readTime,
      content: newArticle.content
    };

    // Add to news list (prepend to show at top)
    setNewsList([article, ...newsList]);
    
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
    
    toast.success("Berita berhasil dibuat", {
      description: "Berita baru telah ditambahkan"
    });
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

  const handleUpdateArticle = (e: React.FormEvent) => {
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

    // Update article
    const updatedArticle: NewsArticle = {
      id: editingArticleId,
      title: newArticle.title,
      excerpt: newArticle.excerpt,
      category: newArticle.category,
      date: newsList.find(a => a.id === editingArticleId)?.date || new Date().toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      image: newArticle.image,
      author: newArticle.author,
      readTime: newArticle.readTime,
      content: newArticle.content
    };

    // Update news list
    setNewsList(newsList.map(article => 
      article.id === editingArticleId ? updatedArticle : article
    ));
    
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
    
    toast.success("Berita berhasil diperbarui", {
      description: "Perubahan telah disimpan"
    });
  };

  const handleDeleteArticle = (articleId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
      setNewsList(newsList.filter(article => article.id !== articleId));
      toast.success("Berita berhasil dihapus", {
        description: "Berita telah dihapus dari daftar"
      });
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
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900 tracking-tight">PlantVision - Berita</span>
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
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-[#2ECC71] to-[#F39C12] hover:from-[#27AE60] hover:to-[#E67E22] text-white shadow-lg"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Buat Berita Baru
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="semua" className="mb-8" onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full md:w-auto grid-cols-5 mb-8">
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
              {/* Featured News */}
              {filteredNews.length > 0 && (
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
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )}

              {/* News Grid */}
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Create News Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            if (!open) {
              handleDialogClose();
            }
          }}>
            <DialogContent className="sm:max-w-lg max-h-[75vh] p-0 !grid-rows-[auto_1fr_auto] [&>button]:z-10">
              <DialogHeader className="flex-shrink-0 px-3 pt-3 pb-2 border-b">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#2ECC71]" />
                  Buat Berita Baru
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Lengkapi form di bawah untuk membuat berita baru
                </DialogDescription>
              </DialogHeader>

              <form id="create-news-form" onSubmit={handleCreateArticle} className="flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
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
                    <Select
                      value={newArticle.category}
                      onValueChange={(value: "teknologi" | "budidaya" | "pasar" | "penelitian") =>
                        setNewArticle({ ...newArticle, category: value })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teknologi">Teknologi</SelectItem>
                        <SelectItem value="budidaya">Budidaya</SelectItem>
                        <SelectItem value="pasar">Pasar</SelectItem>
                        <SelectItem value="penelitian">Penelitian</SelectItem>
                      </SelectContent>
                    </Select>
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
                <div className="flex justify-end gap-2 pt-2 border-t flex-shrink-0 px-3 pb-3 bg-white">
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
            <DialogContent className="sm:max-w-lg max-h-[75vh] p-0 !grid-rows-[auto_1fr_auto] [&>button]:z-10">
              <DialogHeader className="flex-shrink-0 px-3 pt-3 pb-2 border-b">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Edit Berita
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Edit informasi berita di bawah ini
                </DialogDescription>
              </DialogHeader>

              <form id="edit-news-form" onSubmit={handleUpdateArticle} className="flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
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
                      <Select
                        value={newArticle.category}
                        onValueChange={(value: "teknologi" | "budidaya" | "pasar" | "penelitian") =>
                          setNewArticle({ ...newArticle, category: value })
                        }
                      >
                        <SelectTrigger id="edit-category">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teknologi">Teknologi</SelectItem>
                          <SelectItem value="budidaya">Budidaya</SelectItem>
                          <SelectItem value="pasar">Pasar</SelectItem>
                          <SelectItem value="penelitian">Penelitian</SelectItem>
                        </SelectContent>
                      </Select>
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
                <div className="flex justify-end gap-2 pt-2 border-t flex-shrink-0 px-3 pb-3 bg-white">
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
