import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
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
  BarChart3,
  LogOut,
  X,
  History,
  Pin,
  PinOff,
} from "lucide-react";
import React from "react";

interface SidebarProps {
  onLogout?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToDetector?: () => void;
  onNavigateToMonitoring?: () => void;
  onNavigateToChatAI?: () => void;
  onNavigateToNews?: () => void;
  onNavigateToFeedback?: () => void;
  onNavigateToContact?: () => void;
  onHoverChange?: (isHovered: boolean) => void;
}

export default function Sidebar({
  onLogout,
  onNavigateToDashboard,
  onNavigateToDetector,
  onNavigateToMonitoring,
  onNavigateToChatAI,
  onNavigateToNews,
  onNavigateToFeedback,
  onNavigateToContact,
  onHoverChange,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_pinned') === 'true';
    } catch { return false; }
  });

  // Derived: sidebar expanded jika pinned atau hovered
  const isExpanded = isPinned || isHovered;

  // Set initial sidebar width based on pinned state
  useEffect(() => {
    const w = isPinned ? '260px' : '80px';
    document.documentElement.style.setProperty('--sidebar-width', w);
  }, []);

  // Persist pinned state
  useEffect(() => {
    try { localStorage.setItem('sidebar_pinned', String(isPinned)); } catch {}
    const w = isExpanded ? '260px' : '80px';
    document.documentElement.style.setProperty('--sidebar-width', w);
    onHoverChange?.(isExpanded);
  }, [isPinned]);

  // Keep CSS var in sync when expanded changes via hover
  useEffect(() => {
    const w = isExpanded ? '260px' : '80px';
    document.documentElement.style.setProperty('--sidebar-width', w);
  }, [isExpanded]);

  // Check user role
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const user = JSON.parse(stored);
          const userEmail = user.email;
          
          if (userEmail) {
            try {
              const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
              const response = await fetch(`${API_URL}/api/user/role?email=${encodeURIComponent(userEmail)}`, {
                headers: {
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.role) {
                  const updatedUser = { ...user, role: data.role };
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  setUserRole(data.role);
                  return;
                }
              }
            } catch (error) {
              console.error('Error fetching role:', error);
            }
          }
          
          const fallbackRole = user.role || 'user';
          setUserRole(fallbackRole);
        } else {
          setUserRole('user');
        }
      } catch (error) {
        console.error('Error:', error);
        setUserRole('user');
      }
    };
    
    loadUserRole();
  }, []);

  const isSuperadmin = userRole === 'superadmin';

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      onClick: onNavigateToDashboard,
      path: "/dashboard",
    },
    {
      label: "Monitoring",
      icon: <Radio className="w-5 h-5" />,
      onClick: onNavigateToMonitoring,
      path: "/monitoring",
    },
    {
      label: "Deteksi Penyakit",
      icon: <Camera className="w-5 h-5" />,
      onClick: onNavigateToDetector,
      path: "/disease-detector",
    },
    {
      label: "Riwayat Deteksi",
      icon: <History className="w-5 h-5" />,
      onClick: () => navigate('/detection-history'),
      path: "/detection-history",
    },
    {
      label: "Chat AI",
      icon: <MessageSquare className="w-5 h-5" />,
      onClick: onNavigateToChatAI,
      path: "/chat-ai",
    },
    {
      label: "Berita",
      icon: <Newspaper className="w-5 h-5" />,
      onClick: onNavigateToNews,
      path: "/news",
    },
    {
      label: "Saran & Kritik",
      icon: <MessageCircle className="w-5 h-5" />,
      onClick: onNavigateToFeedback,
      path: "/feedback",
    },
    {
      label: "Kontak",
      icon: <Phone className="w-5 h-5" />,
      onClick: onNavigateToContact,
      path: "/contact",
    },
    ...(isSuperadmin ? [{
      label: "Admin Panel",
      icon: <BarChart3 className="w-5 h-5" />,
      onClick: () => navigate('/admin'),
      path: "/admin",
      adminOnly: true,
    }] : []),
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Desktop Sidebar dengan hover collapse/expand + pin/unpin
  const DesktopSidebar = () => (
    <aside 
      className={`hidden lg:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex-col z-50 shadow-sm sidebar-collapsible ${isPinned ? 'sidebar-pinned' : ''}`}
      onMouseEnter={() => {
        if (!isPinned) {
          setIsHovered(true);
          onHoverChange?.(true);
        }
      }}
      onMouseLeave={() => {
        if (!isPinned) {
          setIsHovered(false);
          onHoverChange?.(false);
        }
      }}
      style={{
        width: isExpanded ? '260px' : '80px',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Logo + Pin toggle */}
      <div className="flex items-center h-16 border-b border-gray-200 overflow-hidden px-2 gap-2">
        <button
          onClick={onNavigateToDashboard}
          className="flex items-center justify-center group flex-1 min-w-0"
          title="Ke Dashboard"
        >
          <img 
            src="/images/plantvision-logo.png" 
            alt="PlantVision Logo" 
            className="h-10 w-auto group-hover:scale-110 transition-transform"
          />
        </button>
        {/* Pin / Unpin button - only visible when expanded */}
        <button
          onClick={() => setIsPinned(v => !v)}
          className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all
            ${isPinned ? 'bg-[#2ECC71] text-white border-[#2ECC71] shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:text-[#2ECC71] hover:border-green-200'}
            ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          title={isPinned ? 'Lepas pin (hover mode)' : 'Pin sidebar (tetap terbuka)'}
          aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          type="button"
        >
          {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-1">
        <div className="space-y-1">
          {navItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full flex items-center rounded-lg transition-all font-medium ${
                  active
                    ? 'bg-[#2ECC71] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-green-50 hover:text-[#2ECC71]'
                } ${
                  !isExpanded 
                    ? 'justify-center py-3' 
                    : 'text-left gap-3 px-4 py-3'
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                <span className={`flex-shrink-0 flex items-center justify-center ${
                  !isExpanded ? 'w-full' : ''
                }`}>
                  {item.icon}
                </span>
                {isExpanded && (
                  <span className="whitespace-nowrap text-sm">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-3 space-y-3 overflow-hidden">
        {/* Role Badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 ${
          !isExpanded ? 'justify-center' : ''
        }`}>
          {isSuperadmin ? (
            <>
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
              {isExpanded && (
                <span className="text-xs font-medium text-purple-700 whitespace-nowrap">
                  Superadmin
                </span>
              )}
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              {isExpanded && (
                <span className="text-xs font-medium text-green-700 whitespace-nowrap">
                  Petani
                </span>
              )}
            </>
          )}
        </div>
        
        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={onLogout}
          className={`w-full border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 ${
            !isExpanded 
              ? 'justify-center px-2' 
              : 'justify-start px-4'
          }`}
          title={!isExpanded ? 'Keluar' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 flex items-center justify-center" />
          {isExpanded && (
            <span className="ml-2 whitespace-nowrap">
              Keluar
            </span>
          )}
        </Button>
      </div>
    </aside>
  );

  // Mobile Sidebar (Sheet)
  const MobileSidebar = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild className="lg:hidden">
        <Button 
          variant="ghost" 
          size="icon"
          className="fixed top-4 left-4 z-50 bg-white shadow-md lg:hidden"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto p-0">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
          <img 
            src="/images/plantvision-logo.png" 
            alt="PlantVision Logo" 
            className="h-10 w-auto"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navItems.map((item, index) => {
              const active = isActive(item.path);
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick?.();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left font-medium ${
                    active
                      ? 'bg-[#2ECC71] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-green-50 hover:text-[#2ECC71]'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* Role Badge */}
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
            {isSuperadmin ? (
              <>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-xs font-medium text-purple-700">Superadmin</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700">Petani</span>
              </>
            )}
          </div>
          
          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={() => {
              onLogout?.();
              setMobileMenuOpen(false);
            }}
            className="w-full border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}

