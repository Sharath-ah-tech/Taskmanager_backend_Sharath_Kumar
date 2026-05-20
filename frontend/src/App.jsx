import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PasswordReset from './components/auth/PasswordReset';
import PasswordResetConfirm from './components/auth/PasswordResetConfirm';
import Dashboard from './components/Dashboard';
import GroupList from './components/groups/GroupList';
import GroupDetail from './components/groups/GroupDetail';
import TaskList from './components/tasks/TaskList';
import TaskDetail from './components/tasks/TaskDetail';
import TaskForm from './components/tasks/TaskForm';
import CalendarView from './components/calendar/CalendarView';
import GroupForm from './components/groups/GroupForm';
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboard from './components/AdminDashboard';
import Navbar from './components/common/Navbar';
import InactivityWarning from './components/common/InactivityWarning';
import './App.css';

// Wrapper component to show location state messages
const AppContent = () => {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className="bg-mesh">
      <Navbar />
      
      {message && (
        <div className="container mt-4">
          <div className="alert alert-info">
            {message}
          </div>
        </div>
      )}
      
      <div className="container app-wrapper animate-fade-in">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/password-reset-confirm/:uidb64/:token" element={<PasswordResetConfirm />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><GroupList /></ProtectedRoute>} />
          <Route path="/groups/new" element={<ProtectedRoute><GroupForm /></ProtectedRoute>} />
          <Route path="/groups/:id/edit" element={<ProtectedRoute><GroupForm /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
          <Route path="/tasks/new" element={<ProtectedRoute><TaskForm /></ProtectedRoute>} />
          <Route path="/tasks/:id/edit" element={<ProtectedRoute><TaskForm /></ProtectedRoute>} />
          <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <InactivityWarning />
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;