import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Warehouses from './pages/Warehouses.jsx';
import StockMovements from './pages/StockMovements.jsx';
import Orders from './pages/Orders.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/"                 element={<Dashboard />} />
          <Route path="/products"         element={<Products />} />
          <Route path="/warehouses"       element={<Warehouses />} />
          <Route path="/stock-movements"  element={<StockMovements />} />
          <Route path="/orders"           element={<Orders />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
