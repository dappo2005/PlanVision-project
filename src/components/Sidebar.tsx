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

  // Set initial sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', '80px');
  }, []);

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
              const response = await fetch(`${API_URL}/api/user/role?email=${encodeURIComponent(userEmail)}`);
              
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

  // Desktop Sidebar dengan hover collapse/expand
  const DesktopSidebar = () => (
    <aside 
      className="hidden lg:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex-col z-50 shadow-sm sidebar-collapsible"
      onMouseEnter={() => {
        setIsHovered(true);
        onHoverChange?.(true);
        document.documentElement.style.setProperty('--sidebar-width', '260px');
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverChange?.(false);
        document.documentElement.style.setProperty('--sidebar-width', '80px');
      }}
      style={{
        width: isHovered ? '260px' : '80px',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 overflow-hidden">
        <button
          onClick={onNavigateToDashboard}
          className="flex items-center justify-center group w-full"
        >
          <img 
            src="/images/plantvision-logo.png" 
            alt="PlantVision Logo" 
            className="h-10 w-auto group-hover:scale-110 transition-transform"
          />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
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
                  !isHovered 
                    ? 'justify-center py-3' 
                    : 'text-left gap-3 px-4 py-3'
                }`}
                title={!isHovered ? item.label : undefined}
              >
                <span className={`flex-shrink-0 flex items-center justify-center ${
                  !isHovered ? 'w-full' : ''
                }`}>
                  {item.icon}
                </span>
                {isHovered && (
                  <span className="whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4 space-y-3 overflow-hidden">
        {/* Role Badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 ${
          !isHovered ? 'justify-center' : ''
        }`}>
          {isSuperadmin ? (
            <>
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
              {isHovered && (
                <span className="text-xs font-medium text-purple-700 whitespace-nowrap">
                  Admin
                </span>
              )}
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              {isHovered && (
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
            !isHovered 
              ? 'justify-center px-2' 
              : 'justify-start px-4'
          }`}
          title={!isHovered ? 'Keluar' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 flex items-center justify-center" />
          {isHovered && (
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
                <span className="text-xs font-medium text-purple-700">Administrator</span>
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

