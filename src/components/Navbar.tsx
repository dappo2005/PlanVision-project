import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Radio,
  X,
  BarChart3,
} from "lucide-react";
import React from "react";

interface NavbarProps {
  variant: "landing" | "authenticated";
  onLogin?: () => void;
  onLogout?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToDetector?: () => void;
  onNavigateToMonitoring?: () => void;
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
  onNavigateToMonitoring,
  onNavigateToChatAI,
  onNavigateToNews,
  onNavigateToFeedback,
  onNavigateToContact,
}: NavbarProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');

  // Check user role - with auto-sync from backend
  React.useEffect(() => {
    const loadUserRole = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const user = JSON.parse(stored);
          const userEmail = user.email;
          
          // ALWAYS sync role from backend to ensure it's up-to-date
          if (userEmail) {
            try {
              const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
              console.log('[Navbar] Syncing role from:', `${API_URL}/api/user/role?email=${encodeURIComponent(userEmail)}`);
              const response = await fetch(`${API_URL}/api/user/role?email=${encodeURIComponent(userEmail)}`);
              console.log('[Navbar] Role sync response status:', response.status);
              if (response.ok) {
                const data = await response.json();
                console.log('[Navbar] Role sync response data:', data);
                if (data.role) {
                  // ALWAYS update localStorage with role from backend (force sync)
                  const updatedUser = { ...user, role: data.role };
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  user.role = data.role;
                  console.log('[Navbar] Role FORCE SYNC from backend:', data.role, '(was:', user.role || 'undefined', ')');
                  // Update state immediately after sync
                  setUserRole(data.role);
                }
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Navbar] Role sync failed:', response.status, errorData);
              }
            } catch (error) {
              console.error('[Navbar] Could not sync role from backend:', error);
            }
          }
          
          const finalRole = user.role || 'user';
          setUserRole(finalRole);
          console.log('[Navbar] Final user role set to:', finalRole);
          console.log('[Navbar] Is superadmin?', finalRole === 'superadmin');
        } else {
          console.log('[Navbar] No user in localStorage');
          setUserRole('user');
        }
      } catch (error) {
        console.error('[Navbar] Error loading user role:', error);
        setUserRole('user');
      }
    };
    
    loadUserRole();
  }, []);

  // Strict check: only 'superadmin' is admin, everything else is user/petani
  const isSuperadmin = userRole === 'superadmin';
  
  console.log('[Navbar] Current state - userRole:', userRole, 'isSuperadmin:', isSuperadmin);

  const navItems =
    variant === "authenticated"
      ? [
          {
            label: "Dashboard",
            icon: <LayoutDashboard className="w-4 h-4" />,
            onClick: onNavigateToDashboard,
          },
          {
            label: "Monitoring",
            icon: <Radio className="w-4 h-4" />,
            onClick: onNavigateToMonitoring,
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
          // Admin menu (hanya untuk superadmin)
          ...(isSuperadmin ? [{
            label: "Admin Panel",
            icon: <BarChart3 className="w-4 h-4" />,
            onClick: () => navigate('/admin'),
            adminOnly: true,
          }] : []),
        ]
      : [
          { label: "Beranda", href: "#beranda" },
          { label: "Tentang", href: "#tentang" },
          { label: "Fitur", href: "#fitur" },
          { label: "Tim", href: "#tim" },
        ];

  return (
    <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
        <div className="flex items-center h-16 gap-3">
          {/* Logo - Kiri atas */}
          <div className="flex items-center flex-shrink-0 mr-3">
            <button
              onClick={variant === "authenticated" ? onNavigateToDashboard : undefined}
              className="flex items-center justify-center group cursor-pointer"
            >
              <img 
                src="/images/plantvision-logo.png" 
                alt="PlantVision Logo" 
                className="h-12 w-auto max-h-12 group-hover:scale-110 transition-transform object-contain block"
                style={{ display: 'block', maxWidth: '120px' }}
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          {variant === "authenticated" ? (
            // Authenticated: Menu mulai dari kiri setelah logo
            <nav className="hidden lg:flex items-center gap-1.5 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
              <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#2ECC71] hover:bg-green-50/80 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
                >
                  <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          ) : (
            // Landing page: Menu di tengah
            <nav className="hidden lg:flex items-center gap-1.5 flex-1 justify-center">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#2ECC71] hover:bg-green-50/80 rounded-lg transition-all duration-200 whitespace-nowrap"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Desktop Actions - Compact */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-auto">
            {variant === "authenticated" ? (
              <>
                {/* Role Badge - Rapi dengan text */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0">
                  {isSuperadmin ? (
                    <>
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-700">Admin</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-700">Petani</span>
                    </>
                  )}
                </div>
                <Button
                  onClick={onNavigateToDetector}
                  className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white shadow-md hover:shadow-lg transition-all text-sm"
                >
                  <Camera className="w-4 h-4 mr-1.5" />
                  Mulai Deteksi
                </Button>
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="border-gray-300 hover:bg-gray-50 text-sm"
                >
                  Keluar
                </Button>
              </>
            ) : (
              <Button
                onClick={onLogin}
                size="sm"
                className="bg-[#2ECC71] hover:bg-[#27AE60] text-white text-xs sm:text-sm"
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
                <SheetTitle className="flex items-center justify-center">
                  <img 
                    src="/images/plantvision-logo.png" 
                    alt="PlantVision Logo" 
                    className="h-10 w-auto"
                  />
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Navigation */}
              <nav className="space-y-1">
                {variant === "authenticated" ? (
                  <>
                    {navItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          item.onClick?.();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-[#2ECC71] hover:bg-green-50 rounded-lg transition-all text-left font-medium active:bg-green-100"
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
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
                        className="block px-4 py-3 text-gray-700 hover:text-[#2ECC71] hover:bg-green-50 rounded-lg transition-all font-medium"
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
                    {/* Role Badge - Mobile */}
                    <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 mb-2">
                      {isSuperadmin ? (
                        <>
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs font-medium text-purple-700">Administrator</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-green-700">Petani</span>
                        </>
                      )}
                    </div>
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

