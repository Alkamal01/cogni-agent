import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { SuiProvider } from './contexts/SuiContext';
import { ProtectedRoute, GuestRoute } from './components/auth';
import { Layout } from './components/shared';
import { LearningPathDetail } from './components/learning';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import Testimonials from './pages/Testimonials';
import NotFound from './pages/NotFound';
import { Dashboard, StudyGroupsPage, GroupDetail, Analytics, LearningPaths, Achievements, Profile, UserProfile, Billing, TutorsPage, TutorSession, Settings } from './pages';
import { AdminLogin, AdminDashboard } from './pages/admin';
import ScrollToTop from './components/utils/ScrollToTop';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      {/* AuthProvider and ToastProvider are now wrapping the app in main.jsx */}
          <SubscriptionProvider>
            <SuiProvider>
            <SocketProvider>
              <Router>
              <ScrollToTop />
              <Routes>
                  {/* Public marketing pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/groups" element={<StudyGroupsPage />} />
                    <Route path="/groups/:id" element={<GroupDetail />} />
                      <Route path="/analytics" element={<Analytics />} />
                    <Route path="/learning-paths" element={<LearningPaths />} />
                    <Route path="/learning-paths/:id" element={<LearningPathDetail />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/profile" element={<Profile />} />
                      <Route path="/profile/:publicId" element={<UserProfile />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/tutors" element={<TutorsPage />} />
                    <Route path="/tutors/:id" element={<TutorSession />} />
                      <Route path="/tutors/:id/:sessionId" element={<TutorSession />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>
                
                  <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            </SocketProvider>
          </SuiProvider>
          </SubscriptionProvider>
    </ThemeProvider>
  );
};

export default App; 