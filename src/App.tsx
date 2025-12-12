import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SKUHistory from "./pages/SKUHistory";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import { isAuthenticated } from "@/services/authService";


const queryClient = new QueryClient();

const App = () => {
  // Check if user is already logged in
  const authenticated = isAuthenticated();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Login route */}
            <Route 
              path="/login" 
              element={authenticated ? <Navigate to="/" replace /> : <Login />} 
            />
            
            {/* Protected routes with navigation */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/history" element={<SKUHistory />} />
                    </Routes>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
