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

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

const quickQuestions = [
  "Bagaimana cara mengatasi citrus canker?",
  "Apa penyebab daun jeruk menguning?",
  "Kapan waktu terbaik memangkas pohon jeruk?",
  "Pupuk apa yang cocok untuk jeruk?",
  "Bagaimana cara mencegah hama kutu loncat?",
];



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

 const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // 1. Tambahkan pesan user ke UI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage; // Simpan pesan untuk dikirim
    setInputMessage(""); // Clear input
    setIsTyping(true); // Tampilkan loading

    try {
      // 2. Panggil API Backend Flask
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghubungi AI');
      }

      // 3. Tambahkan balasan AI ke UI
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply, // Ambil text dari response backend
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Chat Error:", error);
      // Tampilkan pesan error ke chat bubble jika gagal
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Maaf, terjadi kesalahan koneksi. Silakan coba lagi.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false); // Matikan loading
    }
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
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-[#F39C12]" />
                    Pertanyaan Populer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4 rounded-lg border-2 border-gray-200 hover:bg-gradient-to-r hover:from-green-50 hover:to-orange-50 hover:border-[#2ECC71] hover:shadow-sm transition-all duration-200 text-sm font-normal whitespace-normal"
                      onClick={() => handleQuickQuestion(question)}
                    >
                      <span className="text-gray-700">{question}</span>
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

