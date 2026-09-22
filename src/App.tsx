import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import DiseaseDetector from "./components/DiseaseDetector";
import DroneMonitoring from "./components/DroneMonitoring";
import ChatAI from "./components/ChatAI";
import News from "./components/News";
import Feedback from "./components/Feedback";
import FeedbackGuest from "./components/FeedbackGuest";
import MyFeedbacks from "./components/MyFeedbacks";
import AdminFeedbackDashboard from "./components/admin/AdminFeedbackDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import DetectionHistory from "./components/DetectionHistory";
import Contact from "./components/Contact";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ResetPassword from "./pages/ResetPassword";
import SetPasswordDialog from "./components/SetPasswordDialog";
import { Toaster } from "./components/ui/sonner";
import { authClient, getStoredUser, installAuthInterceptor } from "./lib/auth-client";

// Pastikan request lama memakai cookie same-origin dan header CSRF.
installAuthInterceptor();

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authClient.validateSession()
      .then((user) => {
        if (!active) return;
        const role = user?.role || 'user';
        setUserRole(role);
        setIsAuthenticated(!!user);
      })
      .catch(() => { if (active) setIsAuthenticated(false); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [requireAdmin]);

  if (isLoading) return null;
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (requireAdmin && userRole !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [setPasswordEmail, setSetPasswordEmail] = useState("");

  // Cookie HttpOnly adalah sumber kebenaran; profil lokal hanya cache tampilan.
  useEffect(() => {
    if (!getStoredUser()) {
      setIsAuthenticated(false);
      return;
    }
    let active = true;
    authClient.validateSession()
      .then((user) => { if (active) setIsAuthenticated(!!user); })
      .catch(() => { if (active) setIsAuthenticated(false); });
    return () => { active = false; };
  }, [location.pathname]);

  // Google OAuth kini kembali dengan cookie HttpOnly, tanpa token di URL.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/auth')) {
      authClient.validateSession().then((data) => {
        if (!data) return;
        setIsAuthenticated(true);
        if (data.provider === 'google' && !data.has_password) {
          setShowSetPassword(true);
          setSetPasswordEmail(data.email || "");
        }
        navigate('/dashboard', { replace: true });
      }).catch(() => navigate('/', { replace: true }));
    }
  }, [navigate]);

  // Handle backward compatibility untuk email lama yang berisi hash: (#/reset-password?token=...)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/reset-password')) {
      const query = hash.includes('?') ? hash.split('?')[1] : '';
      navigate(`/reset-password${query ? `?${query}` : ''}`, { replace: true });
    }
  }, [navigate]);

  // Auto-open login dialog jika navigasi dari reset password sukses (?login=1)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('login') === '1' || params.get('login') === 'true') {
      setShowLoginDialog(true);
    }
  }, [location.search]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowLoginDialog(false);
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await authClient.logout();
    } catch (err) {
      console.warn('Logout error (non-blocking):', err);
      // Ensure local storage is cleared even if server revocation fails
      try { localStorage.removeItem('user'); } catch (_) {}
    }
    setIsAuthenticated(false);
    navigate("/");
  };

  // Determine navbar variant based on current path
  const isLandingPage = location.pathname === "/";
  const isGuestPage = location.pathname === "/feedback/guest";
  const isResetPage = location.pathname === "/reset-password";

  return (
    <>
      {/* Navbar - Only show on landing page */}
      {isLandingPage && !isGuestPage && (
        <Navbar
          variant="landing"
          onLogin={() => setShowLoginDialog(true)}
        />
      )}

      {/* Sidebar - Only show on authenticated pages (not landing and not guest) */}
      {!isLandingPage && !isGuestPage && !isResetPage && isAuthenticated && (
        <Sidebar
          onLogout={handleLogout}
          onNavigateToDashboard={() => navigate("/dashboard")}
          onNavigateToDetector={() => navigate("/disease-detector")}
          onNavigateToMonitoring={() => navigate("/monitoring")}
          onNavigateToChatAI={() => navigate("/chat-ai")}
          onNavigateToNews={() => navigate("/news")}
          onNavigateToFeedback={() => navigate("/feedback")}
          onNavigateToContact={() => navigate("/contact")}
        />
      )}

      {/* Main Content Area - dengan margin untuk sidebar yang menyesuaikan */}
      <main className={!isLandingPage && !isGuestPage && !isResetPage && isAuthenticated ? "min-h-screen sidebar-content" : ""}>
        <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <LandingPage 
              onLogin={handleLogin}
              showLoginDialog={showLoginDialog}
              setShowLoginDialog={setShowLoginDialog}
            />
          } 
        />
        
        {/* Guest Feedback (Public) */}
        <Route 
          path="/feedback/guest" 
          element={<FeedbackGuest />} 
        />
        
        {/* Reset Password (Public, via link di email) */}
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard 
                onLogout={handleLogout} 
                onNavigateToDetector={() => navigate("/disease-detector")}
                onNavigateToMonitoring={() => navigate("/monitoring")}
                onNavigateToChatAI={() => navigate("/chat-ai")}
                onNavigateToNews={() => navigate("/news")}
                onNavigateToFeedback={() => navigate("/feedback")}
                onNavigateToContact={() => navigate("/contact")}
              />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/disease-detector" 
          element={
            <ProtectedRoute>
              <DiseaseDetector 
                onLogout={handleLogout}
                onNavigateToDashboard={() => navigate("/dashboard")}
                onNavigateToDetector={() => navigate("/disease-detector")}
                onNavigateToChatAI={() => navigate("/chat-ai")}
                onNavigateToNews={() => navigate("/news")}
                onNavigateToFeedback={() => navigate("/feedback")}
                onNavigateToContact={() => navigate("/contact")}
              />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/monitoring" 
          element={
            <ProtectedRoute>
              <DroneMonitoring 
                onNavigateToDashboard={() => navigate("/dashboard")}
              />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/chat-ai" 
          element={
            <ProtectedRoute>
              <ChatAI 
                onLogout={handleLogout}
                onNavigateToDashboard={() => navigate("/dashboard")}
                onNavigateToDetector={() => navigate("/disease-detector")}
                onNavigateToChatAI={() => navigate("/chat-ai")}
                onNavigateToNews={() => navigate("/news")}
                onNavigateToFeedback={() => navigate("/feedback")}
                onNavigateToContact={() => navigate("/contact")}
              />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/news" 
          element={
            <ProtectedRoute>
              <News 
                onLogout={handleLogout}
                onNavigateToDashboard={() => navigate("/dashboard")}
                onNavigateToDetector={() => navigate("/disease-detector")}
                onNavigateToChatAI={() => navigate("/chat-ai")}
                onNavigateToNews={() => navigate("/news")}
                onNavigateToFeedback={() => navigate("/feedback")}
                onNavigateToContact={() => navigate("/contact")}
              />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/feedback" 
          element={
            <ProtectedRoute>
              <Feedback 
                onLogout={handleLogout}
                onNavigateToDashboard={() => navigate("/dashboard")}
                onNavigateToDetector={() => navigate("/disease-detector")}
                onNavigateToChatAI={() => navigate("/chat-ai")}
                onNavigateToNews={() => navigate("/news")}
                onNavigateToFeedback={() => navigate("/feedback")}
                onNavigateToContact={() => navigate("/contact")}
              />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/contact" 
          element={
            <ProtectedRoute>
              <Contact 
                onLogout={handleLogout}
                onNavigateToDashboard={() => navigate("/dashboard")}
                onNavigateToDetector={() => navigate("/disease-detector")}
                onNavigateToChatAI={() => navigate("/chat-ai")}
                onNavigateToNews={() => navigate("/news")}
                onNavigateToFeedback={() => navigate("/feedback")}
                onNavigateToContact={() => navigate("/contact")}
              />
            </ProtectedRoute>
          } 
        />
        
        {/* My Feedbacks (User) */}
        <Route 
          path="/feedback/my" 
          element={
            <ProtectedRoute>
              <MyFeedbacks 
                onLogout={handleLogout}
                onNavigateToDashboard={() => navigate("/dashboard")}
              />
            </ProtectedRoute>
          } 
        />
        
        {/* Detection History (User) */}
        <Route 
          path="/detection-history" 
          element={
            <ProtectedRoute>
              <DetectionHistory />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Dashboard (Superadmin Only) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard 
                onLogout={handleLogout}
                onNavigateToDashboard={() => navigate("/dashboard")}
              />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Feedback Dashboard (Superadmin Only) - Legacy route */}
        <Route 
          path="/admin/feedbacks" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminFeedbackDashboard 
                onLogout={handleLogout}
                onNavigateToDashboard={() => navigate("/admin")}
              />
            </ProtectedRoute>
          } 
        />

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <SetPasswordDialog
        open={showSetPassword}
        onOpenChange={(open) => setShowSetPassword(open)}
        email={setPasswordEmail}
        onSuccess={() => {
          // Update stored user provider jadi 'local'
          try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            u.provider = 'local';
            localStorage.setItem('user', JSON.stringify(u));
          } catch (_) {}
        }}
      />
      <Toaster />
    </>
  );
}

