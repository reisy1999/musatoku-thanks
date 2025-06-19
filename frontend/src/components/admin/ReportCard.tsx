import React from 'react';

export interface Report {
  id: number;
  reporter_name?: string | null;
  reason: string;
  status: 'pending' | 'deleted' | 'ignored';
}

type Props = {
  report: Report;
  onDelete?: () => void;
  onIgnore?: () => void;
  readOnly?: boolean;
};

const badgeClass = (status: string) => {
  const base = 'px-2 py-0.5 rounded text-xs';
  switch (status) {
    case 'deleted':
      return `${base} bg-red-100 text-red-800`;
    case 'ignored':
      return `${base} bg-blue-100 text-blue-800`;
    case 'pending':
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
};

const ReportCard: React.FC<Props> = ({ report, onDelete, onIgnore, readOnly }) => {
  return (
    <div className="text-sm space-y-1">
      <div className="flex justify-between items-start">
        <div className="max-h-24 overflow-y-auto whitespace-pre-wrap mr-2">
          <span className="font-semibold">
            {report.reporter_name ?? 'Unknown'}:
          </span>{' '}
          {report.reason}
        </div>
        <span className={badgeClass(report.status)}>{report.status}</span>
      </div>
      {report.status === 'pending' && !readOnly && (
        <div className="space-x-2">
          <button
            className="text-red-600 hover:underline"
            onClick={onDelete}
          >
            Delete post
          </button>
          <button
            className="text-gray-600 hover:underline"
            onClick={onIgnore}
          >
            Ignore
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportCard;
