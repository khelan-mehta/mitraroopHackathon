import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import Navbar from './components/Navbar';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Marketplace from './pages/marketplace/Marketplace';
import NoteViewer from './pages/note/NoteViewer';
import NoteMakerDashboard from './pages/notemaker/NoteMakerDashboard';
import CreateNote from './pages/notemaker/CreateNote';
import AdminPanel from './pages/admin/AdminPanel';
import Wallet from './pages/wallet/Wallet';
import Profile from './pages/profile/Profile';

// Protected Route Component
const ProtectedRoute = ({ children, requireNoteMaker = false, requireAdmin = false }) => {
  const { isAuthenticated, isNoteMaker, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  if (requireNoteMaker && !isNoteMaker) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/notes/:id" element={<NoteViewer />} />

          <Route
            path="/notemaker"
            element={
              <ProtectedRoute requireNoteMaker>
                <NoteMakerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notemaker/create"
            element={
              <ProtectedRoute requireNoteMaker>
                <CreateNote />
              </ProtectedRoute>
            }
          />

          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/marketplace" />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
