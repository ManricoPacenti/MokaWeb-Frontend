import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '../app/hooks';
import { login } from '../features/auth/authSlice';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  //precompiled value allowed only for exam demonstration
  const [email, setEmail] = useState('admin@moka.local');
  const [rawPassword, setRawPassword] = useState('Password123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      await dispatch(login({ email, rawPassword })).unwrap();
      navigate('/dashboard');
    } catch {
      setError('Login failed. Please check email and password');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="moka-login-bg">
      <div className="container text-center">
        
        {/*BRAND HEADER*/}
        <header className="mb-5 text-white">
          <h1 className="display-4 fw-bold mb-2">Moka Web</h1>
          <p className="lead mb-0 opacity-75">
            Employee & Shift management system
          </p>
        </header>
  
        {/*LOGIN CARD*/}
        <div className="row justify-content-center">
          <div className="col-lg-4 col-md-6">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
  
                <form onSubmit={handleSubmit}>
                  <div className="mb-3 text-start">
                    <label className="form-label">
                      Email
                    </label>

                    <input
                      type="email"
                      className="form-control form-control-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
  
                  <div className="mb-4 text-start">
                    <label className="form-label">
                      Password
                    </label>

                    <input
                      type="password"
                      className="form-control form-control-lg"
                      value={rawPassword}
                      onChange={(e) => setRawPassword(e.target.value)}
                    />
                  </div>
  
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Login'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}