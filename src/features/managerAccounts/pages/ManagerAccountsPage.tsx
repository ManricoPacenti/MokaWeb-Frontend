import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  findManagerAccounts,
  updateManagerAccountEnabled,
  type ManagerAccount,
} from '../api/managerAccountService';

export default function ManagerAccountsPage() {
  const [accounts, setAccounts] = useState<ManagerAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function loadAccounts() {
    try {
      setError('');
      const data = await findManagerAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('LOAD MANAGER ACCOUNTS ERROR:', error);
      setError('Errore durante il caricamento degli account manager.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function handleToggleEnabled(account: ManagerAccount) {
    setUpdatingId(account.id);
    setError('');

    try {
      const updated = await updateManagerAccountEnabled(
        account.id,
        !account.enabled,
      );

      setAccounts((previousAccounts) =>
        previousAccounts.map((currentAccount) =>
          currentAccount.id === updated.id ? updated : currentAccount,
        ),
      );
    } catch (error) {
      console.error('UPDATE MANAGER ACCOUNT ENABLED ERROR:', error);
      setError('Errore durante la modifica dell’accesso manager.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="container py-5">
      <header className="mb-4 d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div>
          <h1>Manager Account</h1>
          <p className="text-muted mb-0">
            Gestione degli account manager autorizzati ad amministrare Moka Web.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/dashboard" className="btn btn-outline-secondary">
            ← Indietro
          </Link>

          <Link to="/manager-accounts/new" className="btn btn-primary">
            + Crea Manager
          </Link>
        </div>
      </header>

      {isLoading && <p>Caricamento manager account...</p>}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && !error && accounts.length === 0 && (
        <div className="alert alert-warning">
          Nessun manager account trovato.
        </div>
      )}

      {!isLoading && !error && accounts.length > 0 && (
        <section className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Manager</th>
                  <th>Email login</th>
                  <th>Stato accesso</th>
                  <th>Azioni</th>
                </tr>
              </thead>

              <tbody>
                {accounts.map((account) => {
                  const isUpdating = updatingId === account.id;

                  return (
                    <tr
                      key={account.id}
                      className={!account.enabled ? 'table-secondary' : ''}
                    >
                      <td>{account.id}</td>

                      <td>
                        <div className="fw-semibold">
                          {account.firstName} {account.lastName}
                        </div>
                        <div className="text-muted small">
                          @{account.username}
                        </div>
                      </td>

                      <td>{account.email}</td>

                      <td>
                        {account.enabled ? (
                          <span className="badge text-bg-success">
                            Accesso attivo
                          </span>
                        ) : (
                          <span className="badge text-bg-danger">
                            Accesso disattivato
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            account.enabled
                              ? 'btn btn-sm btn-outline-danger'
                              : 'btn btn-sm btn-outline-success'
                          }
                          onClick={() => handleToggleEnabled(account)}
                          disabled={isUpdating}
                        >
                          {isUpdating
                            ? 'Aggiornamento...'
                            : account.enabled
                              ? 'Disattiva accesso'
                              : 'Riattiva accesso'}
                        </button>
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