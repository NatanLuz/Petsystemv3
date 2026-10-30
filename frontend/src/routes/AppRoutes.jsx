import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage';
import ProtectedRoute from './ProtectedRoute';
import ClientsPage from '../features/clients/ClientsPage';
import ClientDetailPage from '../features/clients/ClientDetailPage';
import PetsPage from '../features/pets/PetsPage';
import PetDetailPage from '../features/pets/PetDetailPage';
import ServicesPage from '../features/services/ServicesPage';
import AppointmentsPage from '../features/appointments/AppointmentsPage';
import AttendancesPage from '../features/attendances/AttendancesPage';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import HealthPage from '../pages/HealthPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><MainLayout><Outlet /></MainLayout></ProtectedRoute>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/pets/:id" element={<PetDetailPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/attendances" element={<AttendancesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
