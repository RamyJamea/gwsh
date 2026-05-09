import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Orders from './pages/Orders';
import Tables from './pages/Tables';
import History from './pages/History';
import Management from './pages/Management';
import { useApp } from './context/AppContext';

function IndexRoute() {
  const { user } = useApp();
  if (user?.role === 'cashier') {
    return <Navigate to="/tables" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexRoute />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="orders" element={<Orders />} />
        <Route path="tables" element={<Tables />} />
        <Route path="history" element={<History />} />
        <Route path="management" element={<Management />} />
      </Route>
    </Routes>
  );
}

export default App;
