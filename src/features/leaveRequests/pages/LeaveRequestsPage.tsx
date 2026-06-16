import { useEffect, useMemo, useState } from 'react';

import LeaveRequestTable from '../components/LeaveRequestTable';
import type {
  LeaveRequest,
  LeaveRequestStatus,
} from '../types/leaveRequestTypes';
import {
  approveLeaveRequest,
  rejectLeaveRequest,
  searchLeaveRequests,
} from '../api/leaveRequestService';

type FilterType = 'ALL' | LeaveRequestStatus;

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadLeaveRequests() {
    try {
      setErrorMessage('');

      const data = await searchLeaveRequests();
      setLeaveRequests(data);
    } catch (error) {
      console.error('LOAD LEAVE REQUESTS ERROR:', error);
      setErrorMessage('Unable to load leave requests.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (filter === 'ALL') return leaveRequests;

    return leaveRequests.filter((request) => request.status === filter);
  }, [leaveRequests, filter]);

  async function handleApprove(id: number) {
    setIsActionLoading(true);
    setErrorMessage('');

    try {
      await approveLeaveRequest(id);
      await loadLeaveRequests();
    } catch (error) {
      console.error('APPROVE LEAVE REQUEST ERROR:', error);
      setErrorMessage('Unable to approve request.');
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleReject(id: number) {
    setIsActionLoading(true);
    setErrorMessage('');

    try {
      await rejectLeaveRequest(id);
      await loadLeaveRequests();
    } catch (error) {
      console.error('REJECT LEAVE REQUEST ERROR:', error);
      setErrorMessage('Unable to reject request.');
    } finally {
      setIsActionLoading(false);
    }
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <h1 className="dashboard-menu-title mb-3">Leave Requests</h1>
      </header>

      <section className="card moka-soft-card mb-3 p-3 shadow-sm">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h2 className="h6 mb-1">Filter</h2>
            <p className="text-muted mb-0 small">
              Total: {leaveRequests.length} — Pending:{' '}
              {
                leaveRequests.filter((request) => request.status === 'PENDING')
                  .length
              }{' '}
              — Approved:{' '}
              {
                leaveRequests.filter((request) => request.status === 'APPROVED')
                  .length
              }{' '}
              — Rejected:{' '}
              {
                leaveRequests.filter((request) => request.status === 'REJECTED')
                  .length
              }
            </p>
          </div>

          <div className="btn-group">
            <button
              type="button"
              className={filter === 'ALL' ? 'btn moka-btn active' : 'btn moka-btn'}
              onClick={() => setFilter('ALL')}
            >
              All
            </button>

            <button
              type="button"
              className={
                filter === 'PENDING' ? 'btn moka-btn active' : 'btn moka-btn'
              }
              onClick={() => setFilter('PENDING')}
            >
              Pending
            </button>

            <button
              type="button"
              className={
                filter === 'APPROVED' ? 'btn moka-btn active' : 'btn moka-btn'
              }
              onClick={() => setFilter('APPROVED')}
            >
              Approved
            </button>

            <button
              type="button"
              className={
                filter === 'REJECTED' ? 'btn moka-btn active' : 'btn moka-btn'
              }
              onClick={() => setFilter('REJECTED')}
            >
              Rejected
            </button>
          </div>
        </div>
      </section>

      {isLoading && <p className="text-white">Loading leave requests...</p>}

      {errorMessage && (
        <div className="alert alert-danger">{errorMessage}</div>
      )}

      {!isLoading && !errorMessage && filteredRequests.length === 0 && (
        <div className="alert alert-warning">No requests found.</div>
      )}

      {!isLoading && !errorMessage && filteredRequests.length > 0 && (
        <LeaveRequestTable
          leaveRequests={filteredRequests}
          onApprove={handleApprove}
          onReject={handleReject}
          isActionLoading={isActionLoading}
        />
      )}
    </main>
  );
}