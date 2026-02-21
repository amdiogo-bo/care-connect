import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import PatientDashboard from "@/pages/patient/Dashboard";
import DoctorsList from "@/pages/patient/DoctorsList";
import BookAppointment from "@/pages/patient/BookAppointment";
import MyAppointments from "@/pages/patient/MyAppointments";
import DoctorDashboard from "@/pages/doctor/Dashboard";
import SecretaryDashboard from "@/pages/secretary/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Patient */}
            <Route element={<ProtectedRoute allowedRoles={['patient']}><AppLayout /></ProtectedRoute>}>
              <Route path="/patient" element={<PatientDashboard />} />
              <Route path="/patient/doctors" element={<DoctorsList />} />
              <Route path="/patient/book" element={<BookAppointment />} />
              <Route path="/patient/appointments" element={<MyAppointments />} />
            </Route>

            {/* Doctor */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']}><AppLayout /></ProtectedRoute>}>
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/doctor/schedule" element={<DoctorDashboard />} />
              <Route path="/doctor/patients" element={<DoctorDashboard />} />
              <Route path="/doctor/availabilities" element={<DoctorDashboard />} />
              <Route path="/doctor/stats" element={<DoctorDashboard />} />
            </Route>

            {/* Secretary */}
            <Route element={<ProtectedRoute allowedRoles={['secretary']}><AppLayout /></ProtectedRoute>}>
              <Route path="/secretary" element={<SecretaryDashboard />} />
              <Route path="/secretary/appointments" element={<SecretaryDashboard />} />
              <Route path="/secretary/schedule" element={<SecretaryDashboard />} />
              <Route path="/secretary/patients" element={<SecretaryDashboard />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']}><AppLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminDashboard />} />
              <Route path="/admin/appointments" element={<AdminDashboard />} />
              <Route path="/admin/stats" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
