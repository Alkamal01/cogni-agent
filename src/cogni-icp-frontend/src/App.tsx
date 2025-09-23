import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { SocketProvider } from './contexts/SocketContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { Login, Register, ConfirmPage, RegistrationSuccess, ForgotPassword, ResetPassword, ProtectedRoute, GuestRoute, OAuthCallback, ResendVerification } from './components/auth';
import { Layout } from './components/shared';
import { LearningPathDetail } from './components/learning';
import LandingPage from './pages/LandingPage';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import Testimonials from './pages/Testimonials';
import NotFound from './pages/NotFound';
import { Dashboard, StudyGroupsPage, GroupDetail, Analytics, LearningPaths, Achievements, Activities, Profile, UserProfile, Billing, TutorsPage, TutorSession, Settings, StudySets, StudySetDetail } from './pages';
import ICPTest from './pages/ICPTest';
import QuizTake from './pages/QuizTake';
import { AdminLogin, AdminDashboard } from './pages/admin';
import ScrollToTop from './components/utils/ScrollToTop';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <SubscriptionProvider>
            <SocketProvider>
              <Router>
              <ScrollToTop />
              <Routes>
                  {/* Public marketing pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                  {/* Guest routes (for non-logged-in users) */}
                  <Route element={<GuestRoute />}>
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                  </Route>

                  {/* Routes that don't need guest/auth protection */}
                  <Route path="/confirm/:token" element={<ConfirmPage />} />
                  <Route path="/verify-email/:token" element={<ConfirmPage />} />
                  <Route path="/resend-verification" element={<ResendVerification />} />
                  <Route path="/registration-success" element={<RegistrationSuccess />} />
                  <Route path="/oauth-callback" element={<OAuthCallback />} />
                
                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                  <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  </Route>
                
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
                    <Route path="/activities" element={<Activities />} />
                    <Route path="/profile" element={<Profile />} />
                      <Route path="/profile/:publicId" element={<UserProfile />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/tutors" element={<TutorsPage />} />
                    <Route path="/tutors/:id" element={<TutorSession />} />
                      <Route path="/tutors/:id/:sessionId" element={<TutorSession />} />
                    <Route path="/study-sets" element={<StudySets />} />
                    <Route path="/study-sets/:studySetId" element={<StudySetDetail />} />
                    <Route path="/study-sets/:studySetId/quizzes/:quizId/take" element={<QuizTake />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/icp-test" element={<ICPTest />} />
                  </Route>
                </Route>
                
                  <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            </SocketProvider>
          </SubscriptionProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 