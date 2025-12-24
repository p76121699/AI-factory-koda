"use client";

import React from 'react';
import { FactoryProvider, useFactory } from '../context/FactoryContext';
import AppLayout from '../components/layout/AppLayout';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import InventoryPanel from '../components/panels/InventoryPanel';
import OrdersPanel from '../components/panels/OrdersPanel';
import ProductionPanel from '../components/panels/ProductionPanel';
import AlertsPanel from '../components/panels/AlertsPanel';
import FloatingAssistant from '../components/dashboard/FloatingAssistant';

function AppContent() {
  const { activePanel } = useFactory();

  return (
    <AppLayout>
      {activePanel === 'dashboard' && <DashboardPanel />}
      {activePanel === 'inventory' && <InventoryPanel />}
      {activePanel === 'orders' && <OrdersPanel />}
      {activePanel === 'production' && <ProductionPanel />}
      {activePanel === 'alerts' && <AlertsPanel />}

      <FloatingAssistant />
    </AppLayout>
  );
}

export default function Page() {
  return (
    <FactoryProvider>
      <AppContent />
    </FactoryProvider>
  );
}
