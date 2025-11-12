import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Leaf, ArrowLeft, Home, Send, Bot, User, Sparkles, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";

interface ChatAIProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToDetector: () => void;
  onNavigateToChatAI: () => void;
  onNavigateToNews: () => void;
  onNavigateToFeedback: () => void;
  onNavigateToContact: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  "Bagaimana cara mengatasi citrus canker?",
  "Apa penyebab daun jeruk menguning?",
  "Kapan waktu terbaik memangkas pohon jeruk?",
  "Pupuk apa yang cocok untuk jeruk?",
  "Bagaimana cara mencegah hama kutu loncat?",
];

const aiResponses: Record<string, string> = {
  "citrus canker": "Citrus Canker disebabkan oleh bakteri Xanthomonas citri. Cara mengatasinya:\n\n✓ Pangkas dan bakar bagian tanaman yang terinfeksi\n✓ Semprot dengan bakterisida berbasis tembaga (Copper hydroxide 77%)\n✓ Aplikasikan setiap 7-10 hari saat musim hujan\n✓ Isolasi tanaman yang terinfeksi\n✓ Gunakan antibiotik streptomycin sulfate 20% (100-200 ppm)\n\nPencegahan: Gunakan bibit bersertifikat, hindari pemangkasan saat hujan, jaga jarak tanam minimal 5-6 meter.",
  
  "menguning": "Daun jeruk menguning bisa disebabkan beberapa faktor:\n\n1. **Defisiensi Nitrogen**: Daun tua menguning, solusi: pupuk NPK atau urea\n2. **Huanglongbing (HLB)**: Menguning tidak merata (blotchy), TIDAK ADA OBAT - cabut tanaman\n3. **Kelebihan Air**: Akar busuk, perbaiki drainase\n4. **Defisiensi Zat Besi**: Daun muda menguning, gunakan chelated iron\n\nLakukan diagnosa tepat sebelum treatment!",
  
  "memangkas": "Waktu terbaik memangkas pohon jeruk:\n\n🌤️ **Musim Kemarau** (Juni-Agustus):\n✓ Luka pangkasan cepat kering\n✓ Risiko infeksi rendah\n✓ Pertumbuhan tunas baru optimal\n\n❌ **Hindari Musim Hujan**:\n- Luka basah mudah terinfeksi bakteri\n- Penyebaran penyakit lebih cepat\n\nTips: Sterilkan alat pangkas dengan alkohol 70% atau lysol sebelum dan sesudah digunakan.",
  
  "pupuk": "Rekomendasi pemupukan jeruk:\n\n🌱 **Tanaman Muda (0-3 tahun)**:\n- NPK 15-15-15: 100-300 gram/pohon/bulan\n- Pupuk organik: 10-20 kg/pohon/6 bulan\n\n🍊 **Tanaman Produktif (>3 tahun)**:\n- NPK 16-16-16: 500-1000 gram/pohon/bulan\n- Pupuk organik: 30-50 kg/pohon/tahun\n- Dolomit: 2-3 kg/pohon/tahun (jika pH tanah <5.5)\n\n💧 **Mikronutrien**:\n- Semprot daun dengan ZnSO4, MnSO4, dan Borax setiap 2 bulan\n\nWaktu pemupukan: Awal musim hujan dan menjelang berbunga.",
  
  "kutu loncat": "Kutu loncat (Diaphorina citri) adalah vektor HLB yang sangat berbahaya!\n\n🎯 **Pengendalian Terpadu**:\n\n1. **Kimiawi**:\n   - Imidacloprid 20% SL (0.5 ml/liter)\n   - Thiamethoxam 25% WG (0.2 gram/liter)\n   - Aplikasi setiap 2 minggu\n\n2. **Biologis**:\n   - Lepas predator: Curinus coeruleus\n   - Parasitoid: Tamarixia radiata\n\n3. **Mekanis**:\n   - Pasang perangkap kuning\n   - Buang tunas yang terserang\n\n4. **Kultur Teknis**:\n   - Bersihkan gulma sekitar\n   - Jaga sanitasi kebun\n   - Monitoring rutin setiap minggu\n\n⚠️ PENTING: Kutu ini menularkan HLB yang tidak bisa disembuhkan!",
  
  "default": "Terima kasih atas pertanyaan Anda! Sebagai asisten AI PlantVision, saya siap membantu dengan:\n\n🌿 Identifikasi penyakit jeruk\n🌱 Panduan budidaya dan perawatan\n💊 Rekomendasi pestisida dan fungisida\n🌤️ Tips pemupukan dan irigasi\n🐛 Pengendalian hama dan penyakit\n\nSilakan tanyakan pertanyaan spesifik Anda tentang pertanian jeruk, dan saya akan memberikan jawaban yang detail dan praktis!"
};

export default function ChatAI({ 
  onLogout, 
  onNavigateToDashboard,
  onNavigateToDetector,
  onNavigateToChatAI,
  onNavigateToNews,
  onNavigateToFeedback,
  onNavigateToContact
}: ChatAIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Halo! 👋 Saya PlantVision AI Assistant. Saya siap membantu Anda dengan pertanyaan seputar budidaya jeruk, penanganan penyakit, pemupukan, dan masalah pertanian lainnya. Ada yang bisa saya bantu?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(aiResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return aiResponses.default;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 mb-4">
              <Sparkles className="w-5 h-5 text-[#F39C12]" />
              <span className="text-gray-700">AI-Powered Agricultural Assistant</span>
            </div>
            <h1 className="text-4xl md:text-5xl text-gray-900 mb-4">
              Tanya PlantVision AI
            </h1>
            <p className="text-xl text-gray-600">
              Dapatkan jawaban instan untuk pertanyaan seputar budidaya dan penyakit jeruk
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b bg-gradient-to-r from-[#2ECC71]/5 to-[#F39C12]/5">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#2ECC71]" />
                    Percakapan
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {message.role === "assistant" && (
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-[#2ECC71] to-[#F39C12] text-white">
                                <Bot className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              message.role === "user"
                                ? "bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="whitespace-pre-line">{message.content}</p>
                            <span className={`text-xs mt-1 block ${message.role === "user" ? "text-white/70" : "text-gray-500"}`}>
                              {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {message.role === "user" && (
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gray-300 text-gray-700">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-[#2ECC71] to-[#F39C12] text-white">
                              <Bot className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-100 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="border-t p-4 bg-white">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ketik pertanyaan Anda..."
                        className="flex-1"
                      />
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                        disabled={!inputMessage.trim() || isTyping}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Questions Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#F39C12]" />
                    Pertanyaan Populer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 hover:bg-green-50 hover:border-[#2ECC71]"
                      onClick={() => handleQuickQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#2ECC71]/10 to-[#F39C12]/10 border-[#2ECC71]/30">
                <CardHeader>
                  <CardTitle className="text-[#2ECC71]">💡 Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-gray-700">
                  <p>• Tanyakan hal spesifik untuk jawaban lebih detail</p>
                  <p>• AI ini dilatih khusus untuk pertanian jeruk</p>
                  <p>• Gunakan bahasa yang jelas dan sederhana</p>
                  <Badge className="bg-[#F39C12] text-white mt-2">Beta Version</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
