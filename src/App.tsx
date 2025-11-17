import { useEffect, useState } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import DiseaseDetector from "./components/DiseaseDetector";
import ChatAI from "./components/ChatAI";
import News from "./components/News";
import Feedback from "./components/Feedback";
import Contact from "./components/Contact";
import Navbar from "./components/Navbar";
import { Toaster } from "./components/ui/sonner";

type Page = "landing" | "dashboard" | "detector" | "chat" | "news" | "feedback" | "contact";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Load persisted login state
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setCurrentPage("dashboard");
      }
    } catch (_) {
      // ignore storage errors
    }
  }, []);

  const handleLogin = () => {
    setCurrentPage("dashboard");
    setShowLoginDialog(false);
  };

  const handleLogout = () => {
    try { localStorage.removeItem('user'); } catch (_) {}
    setCurrentPage("landing");
  };

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <>
      {/* Navbar - Always visible */}
      <Navbar
        variant={currentPage === "landing" ? "landing" : "authenticated"}
        onLogin={() => setShowLoginDialog(true)}
        onLogout={handleLogout}
        onNavigateToDashboard={() => navigateToPage("dashboard")}
        onNavigateToDetector={() => navigateToPage("detector")}
        onNavigateToChatAI={() => navigateToPage("chat")}
        onNavigateToNews={() => navigateToPage("news")}
        onNavigateToFeedback={() => navigateToPage("feedback")}
        onNavigateToContact={() => navigateToPage("contact")}
      />

      {currentPage === "landing" && (
        <LandingPage 
          onLogin={handleLogin}
          showLoginDialog={showLoginDialog}
          setShowLoginDialog={setShowLoginDialog}
        />
      )}
      {currentPage === "dashboard" && (
        <Dashboard 
          onLogout={handleLogout} 
          onNavigateToDetector={() => navigateToPage("detector")}
          onNavigateToChatAI={() => navigateToPage("chat")}
          onNavigateToNews={() => navigateToPage("news")}
          onNavigateToFeedback={() => navigateToPage("feedback")}
          onNavigateToContact={() => navigateToPage("contact")}
        />
      )}
      {currentPage === "detector" && (
        <DiseaseDetector 
          onLogout={handleLogout}
          onNavigateToDashboard={() => navigateToPage("dashboard")}
          onNavigateToDetector={() => navigateToPage("detector")}
          onNavigateToChatAI={() => navigateToPage("chat")}
          onNavigateToNews={() => navigateToPage("news")}
          onNavigateToFeedback={() => navigateToPage("feedback")}
          onNavigateToContact={() => navigateToPage("contact")}
        />
      )}
      {currentPage === "chat" && (
        <ChatAI 
          onLogout={handleLogout}
          onNavigateToDashboard={() => navigateToPage("dashboard")}
          onNavigateToDetector={() => navigateToPage("detector")}
          onNavigateToChatAI={() => navigateToPage("chat")}
          onNavigateToNews={() => navigateToPage("news")}
          onNavigateToFeedback={() => navigateToPage("feedback")}
          onNavigateToContact={() => navigateToPage("contact")}
        />
      )}
      {currentPage === "news" && (
        <News 
          onLogout={handleLogout}
          onNavigateToDashboard={() => navigateToPage("dashboard")}
          onNavigateToDetector={() => navigateToPage("detector")}
          onNavigateToChatAI={() => navigateToPage("chat")}
          onNavigateToNews={() => navigateToPage("news")}
          onNavigateToFeedback={() => navigateToPage("feedback")}
          onNavigateToContact={() => navigateToPage("contact")}
        />
      )}
      {currentPage === "feedback" && (
        <Feedback 
          onLogout={handleLogout}
          onNavigateToDashboard={() => navigateToPage("dashboard")}
          onNavigateToDetector={() => navigateToPage("detector")}
          onNavigateToChatAI={() => navigateToPage("chat")}
          onNavigateToNews={() => navigateToPage("news")}
          onNavigateToFeedback={() => navigateToPage("feedback")}
          onNavigateToContact={() => navigateToPage("contact")}
        />
      )}
      {currentPage === "contact" && (
        <Contact 
          onLogout={handleLogout}
          onNavigateToDashboard={() => navigateToPage("dashboard")}
          onNavigateToDetector={() => navigateToPage("detector")}
          onNavigateToChatAI={() => navigateToPage("chat")}
          onNavigateToNews={() => navigateToPage("news")}
          onNavigateToFeedback={() => navigateToPage("feedback")}
          onNavigateToContact={() => navigateToPage("contact")}
        />
      )}
      <Toaster />
    </>
  );
}
