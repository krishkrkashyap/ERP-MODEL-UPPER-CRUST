import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import RawMaterials from './pages/RawMaterials';
import WastageTracking from './pages/WastageTracking';
import CustomerProfiles from './pages/CustomerProfiles';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="raw-materials" element={<RawMaterials />} />
              <Route path="wastage" element={<WastageTracking />} />
              <Route path="customers" element={<CustomerProfiles />} />
              <Route path="financial" element={<Financial />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
