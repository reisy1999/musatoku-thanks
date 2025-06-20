import React from 'react';

export interface Report {
  id: number;
  reporter_name?: string | null;
  reason: string;
  status: 'pending' | 'deleted' | 'ignored';
}

type Props = {
  report: Report;
};

const ReportCard: React.FC<Props> = ({ report }) => {
  return (
    <div className="text-sm space-y-1">
      <div className="flex justify-between items-start">
        <div className="max-h-24 overflow-y-auto whitespace-pre-wrap mr-2">
          <span className="font-semibold">
            {report.reporter_name ?? 'Unknown'}:
          </span>{' '}
          {report.reason}
        </div>
      </div>
      {/* actions removed - status handled at post level */}
    </div>
  );
};

export default ReportCard;
