import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const isAuthenticated = localStorage.getItem('user_id'); // or use your preferred auth check

    return isAuthenticated ? <Outlet /> : <Navigate to="/landingpage" replace />;
};

export default ProtectedRoute;
