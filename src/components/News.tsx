import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Leaf, ArrowLeft, Home, Newspaper, Calendar, Tag, ExternalLink, TrendingUp, Filter } from "lucide-react";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";

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
    ? newsData 
    : newsData.filter(news => news.category === selectedCategory);

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
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Informasi terbaru seputar teknologi, budidaya, pasar, dan penelitian di industri jeruk Indonesia
            </p>
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
                        <Button className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white">
                          Baca Selengkapnya
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
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
                        <span className="text-gray-500">{article.author}</span>
                        <Button variant="ghost" size="sm" className="text-[#2ECC71] hover:text-[#27AE60]">
                          Baca <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Newsletter Subscription */}
          <Card className="mt-12 bg-gradient-to-r from-[#2ECC71] to-[#F39C12] text-white">
            <CardContent className="p-8 text-center">
              <Newspaper className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl mb-2">Dapatkan Update Berita Terbaru</h3>
              <p className="mb-6 opacity-90">
                Berlangganan newsletter kami dan dapatkan artikel terbaru langsung di email Anda
              </p>
              <div className="flex gap-3 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Masukkan email Anda"
                  className="flex-1 px-4 py-2 rounded-lg text-gray-900"
                />
                <Button className="bg-white text-[#2ECC71] hover:bg-gray-100">
                  Berlangganan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
