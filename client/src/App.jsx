import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClockProvider } from './context/ClockContext';
import Navbar from './components/Navbar';

import LandingPage from './pages/LandingPage';
import RestaurantDashboard from './pages/RestaurantDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import ClaimsPage from './pages/ClaimsPage';
import ImpactDashboard from './pages/ImpactDashboard';
import LeaderboardsPage from './pages/LeaderboardsPage';
import CommunityHeroesPage from './pages/CommunityHeroesPage';
import CoordinatorPage from './pages/CoordinatorPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Router>
      <ClockProvider>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/restaurant" element={<RestaurantDashboard />} />
                <Route path="/volunteer" element={<VolunteerDashboard />} />
                <Route path="/claims" element={<ClaimsPage />} />
                <Route path="/impact" element={<ImpactDashboard />} />
                <Route path="/leaderboards" element={<LeaderboardsPage />} />
                <Route path="/community-heroes" element={<CommunityHeroesPage />} />
                <Route path="/coordinator" element={<CoordinatorPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ClockProvider>
    </Router>
  );
}
