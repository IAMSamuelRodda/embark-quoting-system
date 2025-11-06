import { useState } from 'react';
import { JobType, type Job } from '../../shared/types/models';
import { RetainingWallForm } from './RetainingWallForm';
import { DrivewayForm } from './DrivewayForm';
import { TrenchingForm } from './TrenchingForm';
import { StormwaterForm } from './StormwaterForm';
import { SitePrepForm } from './SitePrepForm';

interface JobSelectorProps {
  quoteId: string;
  onSave: (jobData: Partial<Job>) => Promise<void>;
  onCancel: () => void;
  existingJob?: Job;
}

type JobTypeOption = {
  value: JobType;
  label: string;
  description: string;
  icon: string;
};

const jobTypeOptions: JobTypeOption[] = [
  {
    value: JobType.RETAINING_WALL,
    label: 'Retaining Wall',
    description: 'Concrete block retaining walls with optional drainage',
    icon: '🧱',
  },
  {
    value: JobType.DRIVEWAY,
    label: 'Driveway',
    description: 'Road base with optional gravel topping',
    icon: '🚗',
  },
  {
    value: JobType.TRENCHING,
    label: 'Trenching',
    description: 'Excavation for pipes, cables, or drainage',
    icon: '⛏️',
  },
  {
    value: JobType.STORMWATER,
    label: 'Stormwater',
    description: 'Drainage pipes, fittings, and connections',
    icon: '💧',
  },
  {
    value: JobType.SITE_PREP,
    label: 'Site Preparation',
    description: 'Excavation, backfill, and site leveling',
    icon: '🏗️',
  },
];

export function JobSelector({ quoteId, onSave, onCancel, existingJob }: JobSelectorProps) {
  const [selectedJobType, setSelectedJobType] = useState<JobType | null>(
    existingJob?.job_type || null,
  );

  // If editing, skip job type selection
  if (existingJob) {
    return renderJobForm(existingJob.job_type);
  }

  // Job type selection screen
  if (!selectedJobType) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Select Job Type</h3>
          <p className="text-sm text-gray-600 mt-1">Choose the type of work to add to this quote</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedJobType(option.value)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left group"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{option.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-700">
                    {option.label}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 group-hover:text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render selected job form
  return renderJobForm(selectedJobType);

  function renderJobForm(jobType: JobType) {
    const commonProps = {
      quoteId,
      onSave,
      onCancel: existingJob ? onCancel : () => setSelectedJobType(null),
      existingJob,
    };

    switch (jobType) {
      case JobType.RETAINING_WALL:
        return <RetainingWallForm {...commonProps} />;
      case JobType.DRIVEWAY:
        return <DrivewayForm {...commonProps} />;
      case JobType.TRENCHING:
        return <TrenchingForm {...commonProps} />;
      case JobType.STORMWATER:
        return <StormwaterForm {...commonProps} />;
      case JobType.SITE_PREP:
        return <SitePrepForm {...commonProps} />;
      default:
        return null;
    }
  }
}
