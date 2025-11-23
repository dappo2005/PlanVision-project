import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import DiseaseDetector from "./components/DiseaseDetector";
import ChatAI from "./components/ChatAI";
import News from "./components/News";
import Feedback from "./components/Feedback";
import FeedbackGuest from "./components/FeedbackGuest";
import MyFeedbacks from "./components/MyFeedbacks";
import AdminFeedbackDashboard from "./components/admin/AdminFeedbackDashboard";
import Contact from "./components/Contact";
import Navbar from "./components/Navbar";
import { Toaster } from "./components/ui/sonner";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      setIsAuthenticated(!!stored);
    } catch (_) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
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
        
        {/* Admin Feedback Dashboard (Superadmin Only) */}
        <Route 
          path="/admin/feedbacks" 
          element={
            <ProtectedRoute>
              <AdminFeedbackDashboard 
                onLogout={handleLogout}
                onNavigateToDashboard={() => navigate("/dashboard")}
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

