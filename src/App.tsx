import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SignupSelection from './pages/SignupSelection';
import SignupPatient from './pages/SignupPatient';
import SignupDoctor from './pages/SignupDoctor';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorVerification from './pages/DoctorVerification';
import PatientDashboard from './pages/PatientDashboard';
import ChatPage from './pages/ChatPage';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { session, userRole, loading } = useAuth();

    if (loading) return <LoadingSpinner />;
    if (!session) return <Navigate to="/login" replace />;

    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        if (userRole === 'admin') return <Navigate to="/admin" replace />;
        if (userRole === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
        return <Navigate to="/patient-dashboard" replace />;
    }

    return <Outlet />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignupSelection />} />
                    <Route path="/signup/patient" element={<SignupPatient />} />
                    <Route path="/signup/doctor" element={<SignupDoctor />} />

                    {/* TEMPORARY: Admin accessible without auth for testing */}
                    <Route path="/admin" element={<AdminDashboard />} />

                    {/* Protected Routes */}
                    {/* 
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route> 
          */}

                    <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                        <Route path="/doctor-verification" element={<DoctorVerification />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                        <Route path="/patient-dashboard" element={<PatientDashboard />} />
                    </Route>

                    <Route element={<ProtectedRoute />}>
                        <Route path="/chat" element={<ChatPage />} />
                    </Route>

                    <Route path="/" element={<RootRedirect />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

const RootRedirect = () => {
    const { session, userRole, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (!session) return <Navigate to="/login" replace />;
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
    if (userRole === 'patient') return <Navigate to="/patient-dashboard" replace />;
    return <Navigate to="/login" replace />;
};

export default App;
