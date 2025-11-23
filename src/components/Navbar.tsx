import { useState } from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Leaf,
  Menu,
  Camera,
  MessageSquare,
  Newspaper,
  MessageCircle,
  Phone,
  LayoutDashboard,
  X,
} from "lucide-react";

interface NavbarProps {
  variant: "landing" | "authenticated";
  onLogin?: () => void;
  onLogout?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToDetector?: () => void;
  onNavigateToChatAI?: () => void;
  onNavigateToNews?: () => void;
  onNavigateToFeedback?: () => void;
  onNavigateToContact?: () => void;
}

export default function Navbar({
  variant = "landing",
  onLogin,
  onLogout,
  onNavigateToDashboard,
  onNavigateToDetector,
  onNavigateToChatAI,
  onNavigateToNews,
  onNavigateToFeedback,
  onNavigateToContact,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems =
    variant === "authenticated"
      ? [
          {
            label: "Dashboard",
            icon: <LayoutDashboard className="w-4 h-4" />,
            onClick: onNavigateToDashboard,
          },
          {
            label: "Deteksi Penyakit",
            icon: <Camera className="w-4 h-4" />,
            onClick: onNavigateToDetector,
          },
          {
            label: "Chat AI",
            icon: <MessageSquare className="w-4 h-4" />,
            onClick: onNavigateToChatAI,
          },
          {
            label: "Berita",
            icon: <Newspaper className="w-4 h-4" />,
            onClick: onNavigateToNews,
          },
          {
            label: "Saran & Kritik",
            icon: <MessageCircle className="w-4 h-4" />,
            onClick: onNavigateToFeedback,
          },
          {
            label: "Kontak",
            icon: <Phone className="w-4 h-4" />,
            onClick: onNavigateToContact,
          },
        ]
      : [
          { label: "Beranda", href: "#beranda" },
          { label: "Tentang", href: "#tentang" },
          { label: "Fitur", href: "#fitur" },
          { label: "Tim", href: "#tim" },
        ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={variant === "authenticated" ? onNavigateToDashboard : undefined}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-gray-900 tracking-tight group-hover:text-[#2ECC71] transition-colors">
              PlantVision
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {variant === "authenticated" ? (
              // Authenticated menu with buttons
              navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#2ECC71] hover:bg-green-50 rounded-lg transition-all"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))
            ) : (
              // Landing page menu with anchors
              navItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="px-4 py-2 text-gray-700 hover:text-[#2ECC71] hover:bg-green-50 rounded-lg transition-all"
                >
                  {item.label}
                </a>
              ))
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {variant === "authenticated" ? (
              <>
                <Button
                  onClick={onNavigateToDetector}
                  className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Mulai Deteksi
                </Button>
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Keluar
                </Button>
              </>
            ) : (
              <Button
                onClick={onLogin}
                className="bg-[#2ECC71] hover:bg-[#27AE60] text-white"
              >
                Masuk
              </Button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#2ECC71] to-[#F39C12] rounded-lg flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-900">PlantVision</span>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Navigation */}
              <nav className="space-y-2">
                {variant === "authenticated" ? (
                  <>
                    {navItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          item.onClick?.();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-[#2ECC71] hover:bg-green-50 rounded-lg transition-all text-left"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {navItems.map((item, index) => (
                      <a
                        key={index}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 text-gray-700 hover:text-[#2ECC71] hover:bg-green-50 rounded-lg transition-all"
                      >
                        {item.label}
                      </a>
                    ))}
                  </>
                )}
              </nav>

              {/* Mobile Actions */}
              <div className="mt-6 space-y-2 border-t border-gray-200 pt-6">
                {variant === "authenticated" ? (
                  <>
                    <Button
                      onClick={() => {
                        onNavigateToDetector?.();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Mulai Deteksi
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onLogout?.();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full border-gray-300"
                    >
                      Keluar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      onLogin?.();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white"
                  >
                    Masuk
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

