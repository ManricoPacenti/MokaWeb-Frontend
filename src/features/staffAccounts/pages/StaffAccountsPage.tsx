import { useEffect, useState } from 'react';
import Avatar from '../../../components/Avatar';
import {
  deleteUserAccount,
  findStaffAccounts,
  updateUserAccountEnabled,
  updateUserAccountProfileImage,
  type StaffAccountLookup,
} from '../api/staffAccountLookup';



export default function StaffAccountsPage() {
  const [accounts, setAccounts] = useState<StaffAccountLookup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [error, setError] = useState('');

  async function loadAccounts() {
    try {
      setError('');
      const data = await findStaffAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('LOAD STAFF ACCOUNTS ERROR:', error);
      setError('Unable to load staff accounts.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  function startEditingProfileImage(account: StaffAccountLookup) {
    setEditingImageId(account.id);
    setProfileImageUrl(account.profileImageUrl ?? '');
    setError('');
  }

  function cancelEditingProfileImage() {
    setEditingImageId(null);
    setProfileImageUrl('');
  }

  async function handleUpdateProfileImage(account: StaffAccountLookup) {
    setUpdatingId(account.id);
    setError('');

    try {
      const updated = await updateUserAccountProfileImage(
        account.id,
        profileImageUrl.trim(),
      );

      setAccounts((previousAccounts) =>
        previousAccounts.map((currentAccount) =>
          currentAccount.id === updated.id ? updated : currentAccount,
        ),
      );

      cancelEditingProfileImage();
    } catch (error) {
      console.error('UPDATE STAFF PROFILE IMAGE ERROR:', error);
      setError('Unable to update profile image.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteStaffAccount(account: StaffAccountLookup) {
    const confirmed = window.confirm(
      `Do you want to delete staff account ${account.username}?`,
    );

    if (!confirmed) return;

    setError('');
    setUpdatingId(account.id);

    try {
      await deleteUserAccount(account.id);

      setAccounts((previousAccounts) =>
        previousAccounts.filter(
          (currentAccount) => currentAccount.id !== account.id,
        ),
      );
    } catch (error) {
      console.error('DELETE STAFF ACCOUNT ERROR:', error);
      setError('Unable to delete staff account.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleEnabled(account: StaffAccountLookup) {
    setUpdatingId(account.id);
    setError('');

    try {
      const updated = await updateUserAccountEnabled(
        account.id,
        !account.enabled,
      );

      setAccounts((previousAccounts) =>
        previousAccounts.map((currentAccount) =>
          currentAccount.id === updated.id ? updated : currentAccount,
        ),
      );
    } catch (error) {
      console.error('UPDATE STAFF ACCOUNT ENABLED ERROR:', error);
      setError('Unable to update staff account access.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <h1 className="dashboard-menu-title mb-3">Staff Accounts</h1>
      </header>

      {isLoading && <p className="text-white">Loading staff accounts...</p>}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && !error && accounts.length === 0 && (
        <div className="alert alert-warning">No staff accounts found.</div>
      )}

      {!isLoading && !error && accounts.length > 0 && (
        <section className="card moka-soft-card shadow-sm">
          <div className="card-header moka-soft-card-header">
            <h2 className="h5 mb-0">Staff account list</h2>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle moka-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Profile</th>
                  <th>Email login</th>
                  <th>Employee ID</th>
                  <th>Access status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {accounts.map((account) => {
                  const isUpdating = updatingId === account.id;
                  const isEditingImage = editingImageId === account.id;

                  return (
                    <tr
                      key={account.id}
                      className={!account.enabled ? 'table-secondary' : ''}
                    >
                      <td>{account.id}</td>

                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <button
                            type="button"
                            className="staff-avatar-button"
                            onClick={() => startEditingProfileImage(account)}
                            disabled={isUpdating}
                            aria-label={`Edit ${account.username} profile image`}
                          >
                            <Avatar
                              firstName={account.firstName}
                              lastName={account.lastName}
                              profileImageUrl={account.profileImageUrl}
                              size={48}
                            />
                            
                            <span>Edit</span>
                          </button>

                          <div className="flex-grow-1">
                            <div className="fw-semibold">
                              {account.firstName} {account.lastName}
                            </div>

                            <div className="text-muted small">
                              @{account.username}
                            </div>

                            {isEditingImage && (
                              <div className="mt-2">
                                <input
                                  className="form-control form-control-sm mb-2"
                                  value={profileImageUrl}
                                  onChange={(event) =>
                                    setProfileImageUrl(event.target.value)
                                  }
                                  placeholder="https://example.com/profile.png"
                                />

                                <div className="d-flex gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    className="btn btn-sm moka-btn"
                                    onClick={() =>
                                      handleUpdateProfileImage(account)
                                    }
                                    disabled={isUpdating}
                                  >
                                    {isUpdating ? 'Saving...' : 'Save image'}
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-sm moka-btn"
                                    onClick={cancelEditingProfileImage}
                                    disabled={isUpdating}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{account.email}</td>

                      <td>{account.employeeId}</td>

                      <td>
                        {account.enabled ? (
                          <span className="badge text-bg-success">Enabled</span>
                        ) : (
                          <span className="badge text-bg-danger">Disabled</span>
                        )}
                      </td>

                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-sm moka-btn"
                            onClick={() => handleToggleEnabled(account)}
                            disabled={isUpdating}
                          >
                            {isUpdating
                              ? 'Updating...'
                              : account.enabled
                                ? 'Disable'
                                : 'Enable'}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm moka-btn"
                            onClick={() => handleDeleteStaffAccount(account)}
                            disabled={isUpdating}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}