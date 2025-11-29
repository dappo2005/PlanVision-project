import { useState, useEffect } from "react";
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
import Contact from "./components/Contact";
import Navbar from "./components/Navbar";
import { Toaster } from "./components/ui/sonner";

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        setIsAuthenticated(true);
        setUserRole(user.role || 'user');
        
        // Jika require admin tapi bukan superadmin, redirect
        if (requireAdmin && user.role !== 'superadmin') {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (_) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
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

  // Check auth status on mount and route change
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      setIsAuthenticated(!!stored);
    } catch (_) {
      setIsAuthenticated(false);
    }
  }, [location.pathname]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowLoginDialog(false);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    try { localStorage.removeItem('user'); } catch (_) {}
    setIsAuthenticated(false);
    navigate("/");
  };

  // Determine navbar variant based on current path
  const isLandingPage = location.pathname === "/";
  const isGuestPage = location.pathname === "/feedback/guest";

  return (
    <>
      {/* Navbar - Only show on non-guest pages */}
      {!isGuestPage && (
        <Navbar
          variant={isLandingPage ? "landing" : "authenticated"}
          onLogin={() => setShowLoginDialog(true)}
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

      <Toaster />
    </>
  );
}

