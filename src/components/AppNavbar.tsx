import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';

export default function AppNavbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg app-navbar">
      <div className="container-fluid">
        
        {/* LOGO / BRAND */}
        <Link to="/dashboard" className="navbar-brand fw-bold">
          MokaWeb
        </Link>

        {/* RIGHT SIDE */}
        <div className="d-flex align-items-center gap-3">

          <Link to="/dashboard" className="btn btn-outline-light btn-sm">
            Home
          </Link>

          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}