import type {
  LeaveRequest,
  LeaveRequestStatus,
} from '../types/leaveRequestTypes';

type LeaveRequestTableProps = {
  leaveRequests: LeaveRequest[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isActionLoading: boolean;
};

export default function LeaveRequestTable({
  leaveRequests,
  onApprove,
  onReject,
  isActionLoading,
}: LeaveRequestTableProps) {
  function getStatusBadge(status: LeaveRequestStatus) {
    if (status === 'APPROVED') return 'badge text-bg-success';
    if (status === 'REJECTED') return 'badge text-bg-danger';

    return 'badge text-bg-warning';
  }

  return (
    <section className="card moka-soft-card shadow-sm">
      <div className="card-header moka-soft-card-header">
        <h2 className="h5 mb-0">Leave request list</h2>
      </div>

      <div className="table-responsive">
        <table className="table table-hover mb-0 align-middle moka-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Note</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {leaveRequests.map((request) => (
              <tr key={request.id}>
                <td>{request.id}</td>

                <td>
                  {request.employeeFirstName && request.employeeLastName
                    ? `${request.employeeFirstName} ${request.employeeLastName}`
                    : `Employee #${request.employeeId}`}
                </td>

                <td>{request.leaveDate}</td>

                <td>
                  {request.startTime.slice(0, 5)} -{' '}
                  {request.endTime.slice(0, 5)}
                </td>

                <td>{request.leaveType}</td>

                <td>{request.note || '-'}</td>

                <td>
                  <span className={getStatusBadge(request.status)}>
                    {request.status}
                  </span>
                </td>

                <td>
                  {request.status === 'PENDING' ? (
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-sm moka-btn"
                        disabled={isActionLoading}
                        onClick={() => onApprove(request.id)}
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm moka-btn"
                        disabled={isActionLoading}
                        onClick={() => onReject(request.id)}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted">Handled</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}