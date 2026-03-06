import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import DemoPage from './pages/DemoPage';
import KYCPage from './pages/KYCPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"             element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/demo"         element={<DemoPage />} />
          <Route path="/kyc"          element={<KYCPage />} />
          <Route path="/dashboard"    element={<DashboardPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
