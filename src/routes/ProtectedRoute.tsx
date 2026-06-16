import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { token, user, loading } = useAppSelector((state) => state.auth);

  //Wait until the authentication state is restored
  if (loading) {
    return (
      <main className="container py-5">
        <p>Caricamento...</p>
      </main>
    );
  }

  //redirect unauthenticated users 
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  //redirect authenticated users without the required role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}