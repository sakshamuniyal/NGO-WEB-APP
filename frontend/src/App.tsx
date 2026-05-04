import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import Navbar from "@/components/user/navbar";
import ProtectedRoute from "@/routes/ProtectedRoutes";
import Spinner from "@/components/custom/spinner";
import Cases from "./pages/user/Cases";

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));

const Home = lazy(() => import("./pages/user/Home"));
const Donate = lazy(() => import("./pages/user/Donate"));
const LoginWithOTP = lazy(() => import("./pages/user/LoginwithOTP"));
const CompleteProfile = lazy(() => import("./pages/user/CompleteProfile"));
const Dashboard = lazy(() => import("./pages/user/Dashboard"));
const PaymentStatus = lazy(() => import("./pages/user/PaymentStatus"));
const PaymentSuccess = lazy(() => import("./pages/user/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/user/PaymentFailed"));
const PaymentPending = lazy(() => import("./pages/user/PaymentPending"));
const Contact = lazy(() => import("./pages/user/Contact"));
const About = lazy(() => import("./pages/user/About"));
const Vision = lazy(() => import("./pages/user/Vision"));
const Gallery = lazy(() => import("./pages/user/Gallery"));

function RoutedLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login";

  return (
    <>
      <ScrollToTop />
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginWithOTP />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/about" element={<About />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          <Route path="/donation-processing" element={<PaymentStatus />} />
          <Route path="/donation-success" element={<PaymentSuccess />} />
          <Route path="/donation-failed" element={<PaymentFailed />} />
          <Route path="/donation-pending" element={<PaymentPending />} />

          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <RoutedLayout />
    </Router>
  );
};

export default App;
