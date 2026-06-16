import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { createManagerAccount } from '../api/createManagerAccount';

export default function CreateManagerAccountPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    profileImageUrl: '',
    rawPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function validateForm(): string {
    if (!form.username.trim()) return 'Username is required.';
    if (!form.email.trim()) return 'Email is required.';

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(form.email)) return 'Invalid email.';

    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.rawPassword.trim()) return 'Password is required.';

    if (form.rawPassword.length < 8) {
      return 'Password must contain at least 8 characters.';
    }

    return '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await createManagerAccount({
        username: form.username.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        profileImageUrl: form.profileImageUrl.trim(),
        rawPassword: form.rawPassword,
      });

      navigate('/manager-accounts');
    } catch (error: any) {
      console.error('CREATE MANAGER ACCOUNT ERROR:', error);

      if (error.response?.status === 409) {
        setError('An account with this email or username already exists.');
      } else if (error.response?.status === 400) {
        setError('Invalid data. Please check the fields.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to create a manager account.');
      } else {
        setError('Unable to create manager account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="container py-5">
      <header className="mb-4">
        <h1>Create Manager Account</h1>
        <p className="text-muted mb-0">
          Create a MANAGER account authorized to manage the system.
        </p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label" htmlFor="username">
            Username
          </label>

          <input
            id="username"
            name="username"
            className="form-control"
            value={form.username}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="email">
            Email
          </label>

          <input
            id="email"
            name="email"
            className="form-control"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="firstName">
            First Name
          </label>

          <input
            id="firstName"
            name="firstName"
            className="form-control"
            value={form.firstName}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="lastName">
            Last Name
          </label>

          <input
            id="lastName"
            name="lastName"
            className="form-control"
            value={form.lastName}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="profileImageUrl">
            Profile Image URL
          </label>

          <input
            id="profileImageUrl"
            name="profileImageUrl"
            className="form-control"
            value={form.profileImageUrl}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="rawPassword">
            Password
          </label>

          <input
            id="rawPassword"
            name="rawPassword"
            type="password"
            className="form-control"
            value={form.rawPassword}
            onChange={handleChange}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate('/manager-accounts')}
            disabled={isSubmitting}
          >
            ← Back
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Manager Account'}
          </button>
        </div>
      </form>
    </main>
  );
}