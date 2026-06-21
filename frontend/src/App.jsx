import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import Layout from "./components/Layout";

const BikeForm = lazy(() => import("./pages/BikeForm"));
const BikeRecords = lazy(() => import("./pages/BikeRecords"));
const Login = lazy(() => import("./pages/Login"));

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<div className="page-loader"><span /></div>}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route index element={<BikeRecords />} />
          <Route path="add-bike" element={<BikeForm />} />
          <Route path="edit-bike/:id" element={<BikeForm />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
