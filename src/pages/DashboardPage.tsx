import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';

import Avatar from '../components/Avatar';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  updateCurrentUserProfileImage,
  uploadCurrentUserProfileImage,
} from '../features/auth/authSlice';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthLoading = useAppSelector((state) => state.auth.loading);

  const [isEditingImage, setIsEditingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImageError, setProfileImageError] = useState('');

  if (!user) {
    return (
      <main className="container py-5">
        <p>Loading user...</p>
      </main>
    );
  }

  const currentUser = user;
  const resolvedCurrentUserId = currentUser.id ?? currentUser.userId;

  if (resolvedCurrentUserId === undefined) {
    return (
      <main className="container py-5">
        <div className="alert alert-danger">
          Unable to read current user ID.
        </div>
      </main>
    );
  }

  const currentUserId: number = resolvedCurrentUserId;

  function startEditingImage() {
    setProfileImageUrl(currentUser.profileImageUrl ?? '');
    setProfileImageError('');
    setIsEditingImage(true);
  }

  function cancelEditingImage() {
    setProfileImageUrl('');
    setProfileImageError('');
    setIsEditingImage(false);
  }

  async function handleSubmitProfileImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setProfileImageError('');

    try {
      await dispatch(
        updateCurrentUserProfileImage({
          userId: currentUserId,
          profileImageUrl: profileImageUrl.trim(),
        }),
      ).unwrap();

      cancelEditingImage();
    } catch (error) {
      console.error('PROFILE IMAGE UPDATE ERROR:', error);
      setProfileImageError('Unable to update profile image.');
    }
  }

  async function handleUploadProfileImage(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const maxSizeInMb = 10;
    const maxSizeInBytes = maxSizeInMb * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      setProfileImageError(`File size cannot exceed ${maxSizeInMb}MB.`);
      event.target.value = '';
      return;
    }

    setProfileImageError('');

    try {
      await dispatch(
        uploadCurrentUserProfileImage({
          userId: currentUserId,
          file,
        }),
      ).unwrap();

      cancelEditingImage();
    } catch (error) {
      console.error('PROFILE IMAGE UPLOAD ERROR:', error);
      setProfileImageError('Unable to upload profile image.');
    } finally {
      event.target.value = '';
    }
  }

  function renderMenuLinks() {
    if (currentUser.role === 'ADMIN') {
      return (
        <>
          <Link
            to="/manager-accounts/new"
            className="btn moka-btn dashboard-menu-button"
          >
            Create Manager
          </Link>

          <Link
            to="/manager-accounts"
            className="btn moka-btn dashboard-menu-button"
          >
            Manager Accounts
          </Link>
        </>
      );
    }

    if (currentUser.role === 'MANAGER') {
      return (
        <>
          <Link to="/employees" className="btn moka-btn dashboard-menu-button">
            Employees
          </Link>

          <Link
            to="/staff-accounts/new"
            className="btn moka-btn dashboard-menu-button"
          >
            Create Staff Account
          </Link>

          <Link
            to="/staff-accounts"
            className="btn moka-btn dashboard-menu-button"
          >
            Staff Accounts
          </Link>

          <Link
            to="/leave-requests"
            className="btn moka-btn dashboard-menu-button"
          >
            Leave Requests
          </Link>

          <Link to="/templates" className="btn moka-btn dashboard-menu-button">
            Schedule Templates
          </Link>

          <Link
            to="/weekly-schedules"
            className="btn moka-btn dashboard-menu-button"
          >
            Saved Weekly Schedules
          </Link>
        </>
      );
    }

    if (currentUser.role === 'STAFF') {
      return (
        <>
          <Link
            to="/leave-requests/new"
            className="btn moka-btn dashboard-menu-button"
          >
            Request Leave
          </Link>

          <Link
            to="/my-schedule"
            className="btn moka-btn dashboard-menu-button"
          >
            My Schedule
          </Link>
        </>
      );
    }

    return (
      <p className="text-white mb-0">
        Financial data consultation area.
      </p>
    );
  }

  return (
    <main className="dashboard-scene py-5">
      <header className="dashboard-profile-zone">
        <button
          type="button"
          className="profile-avatar-wrapper border-0 p-0 bg-transparent position-relative d-flex align-items-center justify-content-center"
          onClick={startEditingImage}
          aria-label="Edit profile image"
        >
          <Avatar
            firstName={currentUser.firstName}
            lastName={currentUser.lastName}
            profileImageUrl={currentUser.profileImageUrl}
            size={120}
          />

          <span className="profile-avatar-overlay">Edit image</span>
        </button>

        <h1 className="dashboard-welcome display-5 mb-0">
          Welcome, {currentUser.firstName}
        </h1>
      </header>

      {isEditingImage && (
        <section className="card shadow-sm mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmitProfileImage}>
              <h2 className="h5 mb-3">Profile image</h2>

              <label className="form-label" htmlFor="profileImageFile">
                Upload image from your computer
              </label>

              <input
                id="profileImageFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="form-control mb-2"
                onChange={handleUploadProfileImage}
                disabled={isAuthLoading}
              />

              <div className="text-muted small mb-3">
                Accepted formats: JPG, PNG, WEBP. Maximum size: 10MB.
              </div>

              <div className="border-top pt-3 mt-3">
                <label className="form-label" htmlFor="profileImageUrl">
                  Or paste a profile image URL
                </label>

                <input
                  id="profileImageUrl"
                  className="form-control mb-2"
                  value={profileImageUrl}
                  onChange={(event) => setProfileImageUrl(event.target.value)}
                  placeholder="https://example.com/profile.png"
                />
              </div>

              <div className="d-flex align-items-center gap-3 mb-3">
                <Avatar
                  firstName={currentUser.firstName}
                  lastName={currentUser.lastName}
                  profileImageUrl={profileImageUrl}
                  size={64}
                  className="border"
                />

                <span className="text-muted small">
                  Leave the URL field empty to use the automatic avatar.
                </span>
              </div>

              {profileImageError && (
                <div className="alert alert-danger py-2">
                  {profileImageError}
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn moka-btn"
                  disabled={isAuthLoading}
                >
                  {isAuthLoading ? 'Saving...' : 'Save image URL'}
                </button>

                <button
                  type="button"
                  className="btn moka-btn"
                  onClick={cancelEditingImage}
                  disabled={isAuthLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <nav className="dashboard-floating-menu" aria-label="Dashboard menu">
        <h2 className="dashboard-menu-title mb-3">MENU</h2>

        <div className="d-grid gap-2">{renderMenuLinks()}</div>
      </nav>
    </main>
  );
}