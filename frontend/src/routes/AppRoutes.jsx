import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClientsPage from '../features/clients/ClientsPage';
import PetsPage from '../features/pets/PetsPage';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import HealthPage from '../pages/HealthPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/pets" element={<PetsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
}
