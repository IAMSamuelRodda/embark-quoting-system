import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Job, JobType } from '../../shared/types/models';

// Validation schema for stormwater job
const stormwaterSchema = z.object({
  pipe_length: z
    .number()
    .positive('Pipe length must be greater than 0')
    .max(1000, 'Maximum pipe length is 1000 meters'),
  pipe_type: z.string().min(1, 'Pipe type is required'),
  t_joints: z
    .number()
    .int()
    .nonnegative('T-joints cannot be negative')
    .max(100, 'Maximum 100 T-joints'),
  elbows: z.number().int().nonnegative('Elbows cannot be negative').max(100, 'Maximum 100 elbows'),
  downpipe_adaptors: z
    .number()
    .int()
    .nonnegative('Downpipe adaptors cannot be negative')
    .max(100, 'Maximum 100 downpipe adaptors'),
  include_trenching: z.boolean(),
  // Optional trenching details if include_trenching is true
  trench_length: z
    .number()
    .positive('Trench length must be greater than 0')
    .max(1000, 'Maximum trench length is 1000 meters')
    .optional(),
  trench_width: z
    .number()
    .int()
    .positive('Trench width must be greater than 0')
    .max(1000, 'Maximum trench width is 1000mm')
    .optional(),
});

type StormwaterFormData = z.infer<typeof stormwaterSchema>;

interface StormwaterFormProps {
  quoteId: string;
  onSave: (jobData: Partial<Job>) => Promise<void>;
  onCancel: () => void;
  existingJob?: Job;
}

export function StormwaterForm({ quoteId, onSave, onCancel, existingJob }: StormwaterFormProps) {
  const isEditing = !!existingJob;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StormwaterFormData>({
    resolver: zodResolver(stormwaterSchema),
    defaultValues: existingJob
      ? {
          pipe_length: (existingJob.parameters.pipe_length as number) || 0,
          pipe_type: (existingJob.parameters.pipe_type as string) || 'PVC 90mm',
          t_joints: (existingJob.parameters.t_joints as number) || 0,
          elbows: (existingJob.parameters.elbows as number) || 0,
          downpipe_adaptors: (existingJob.parameters.downpipe_adaptors as number) || 0,
          include_trenching: (existingJob.parameters.include_trenching as boolean) || false,
          trench_length: (existingJob.parameters.trench_length as number) || 0,
          trench_width: (existingJob.parameters.trench_width as number) || 600,
        }
      : {
          pipe_length: 0,
          pipe_type: 'PVC 90mm',
          t_joints: 0,
          elbows: 0,
          downpipe_adaptors: 0,
          include_trenching: false,
          trench_length: 0,
          trench_width: 600,
        },
  });

  const formValues = watch();

  // Calculate material estimates
  const calculateEstimate = () => {
    const totalFittings =
      (formValues.t_joints || 0) + (formValues.elbows || 0) + (formValues.downpipe_adaptors || 0);

    return {
      pipeLength: formValues.pipe_length || 0,
      totalFittings,
      hasTrenching: formValues.include_trenching,
      trenchLength: formValues.include_trenching ? formValues.trench_length || 0 : 0,
    };
  };

  const estimate = calculateEstimate();

  const onSubmit = async (data: StormwaterFormData) => {
    const jobData: Partial<Job> = {
      quote_id: quoteId,
      job_type: JobType.STORMWATER,
      parameters: {
        pipe_length: data.pipe_length,
        pipe_type: data.pipe_type,
        t_joints: data.t_joints,
        elbows: data.elbows,
        downpipe_adaptors: data.downpipe_adaptors,
        include_trenching: data.include_trenching,
        ...(data.include_trenching && {
          trench_length: data.trench_length,
          trench_width: data.trench_width,
        }),
      },
      // Backend will calculate materials, labour, calculations, and subtotal
    };

    await onSave(jobData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit' : 'Add'} Stormwater Drainage
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Enter pipe specifications and fittings required
        </p>
      </div>

      <div className="space-y-6">
        {/* Pipe Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pipe_length" className="block text-sm font-medium text-gray-700 mb-2">
              Pipe Length (meters) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('pipe_length', { valueAsNumber: true })}
              type="number"
              id="pipe_length"
              step="0.1"
              min="0"
              max="1000"
              className={`input-field ${errors.pipe_length ? 'border-red-500' : ''}`}
              placeholder="e.g., 30.5"
            />
            {errors.pipe_length && (
              <p className="mt-1 text-sm text-red-600">{errors.pipe_length.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="pipe_type" className="block text-sm font-medium text-gray-700 mb-2">
              Pipe Type <span className="text-red-500">*</span>
            </label>
            <input
              {...register('pipe_type')}
              type="text"
              id="pipe_type"
              className={`input-field ${errors.pipe_type ? 'border-red-500' : ''}`}
              placeholder="PVC 90mm"
            />
            {errors.pipe_type && (
              <p className="mt-1 text-sm text-red-600">{errors.pipe_type.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Default: PVC 90mm</p>
          </div>
        </div>

        {/* Fittings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Fittings and Connections
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="t_joints" className="block text-sm font-medium text-gray-700 mb-2">
                T-Joints
              </label>
              <input
                {...register('t_joints', { valueAsNumber: true })}
                type="number"
                id="t_joints"
                min="0"
                max="100"
                className={`input-field ${errors.t_joints ? 'border-red-500' : ''}`}
                placeholder="0"
              />
              {errors.t_joints && (
                <p className="mt-1 text-sm text-red-600">{errors.t_joints.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="elbows" className="block text-sm font-medium text-gray-700 mb-2">
                Elbows (90°)
              </label>
              <input
                {...register('elbows', { valueAsNumber: true })}
                type="number"
                id="elbows"
                min="0"
                max="100"
                className={`input-field ${errors.elbows ? 'border-red-500' : ''}`}
                placeholder="0"
              />
              {errors.elbows && (
                <p className="mt-1 text-sm text-red-600">{errors.elbows.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="downpipe_adaptors"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Downpipe Adaptors
              </label>
              <input
                {...register('downpipe_adaptors', { valueAsNumber: true })}
                type="number"
                id="downpipe_adaptors"
                min="0"
                max="100"
                className={`input-field ${errors.downpipe_adaptors ? 'border-red-500' : ''}`}
                placeholder="0"
              />
              {errors.downpipe_adaptors && (
                <p className="mt-1 text-sm text-red-600">{errors.downpipe_adaptors.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Trenching Integration */}
        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              {...register('include_trenching')}
              type="checkbox"
              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">Include Trenching</span>
              <p className="text-xs text-gray-500 mt-1">Add trenching work for pipe installation</p>
            </div>
          </label>

          {formValues.include_trenching && (
            <div className="ml-7 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="trench_length"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Trench Length (meters)
                  </label>
                  <input
                    {...register('trench_length', { valueAsNumber: true })}
                    type="number"
                    id="trench_length"
                    step="0.1"
                    min="0"
                    max="1000"
                    className={`input-field ${errors.trench_length ? 'border-red-500' : ''}`}
                    placeholder="e.g., 30.0"
                  />
                  {errors.trench_length && (
                    <p className="mt-1 text-sm text-red-600">{errors.trench_length.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="trench_width"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Trench Width (mm)
                  </label>
                  <input
                    {...register('trench_width', { valueAsNumber: true })}
                    type="number"
                    id="trench_width"
                    step="100"
                    min="300"
                    max="1000"
                    className={`input-field ${errors.trench_width ? 'border-red-500' : ''}`}
                    placeholder="600"
                  />
                  {errors.trench_width && (
                    <p className="mt-1 text-sm text-red-600">{errors.trench_width.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Common: 300mm, 600mm, or 900mm</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Material Estimate Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Estimated Materials</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Pipe Length:</span>
              <span className="font-medium">
                {estimate.pipeLength}m {formValues.pipe_type || 'PVC 90mm'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Fittings:</span>
              <span className="font-medium">{estimate.totalFittings} pieces</span>
            </div>
            {estimate.hasTrenching && (
              <div className="flex justify-between">
                <span>Trenching:</span>
                <span className="font-medium">
                  {estimate.trenchLength}m × {formValues.trench_width || 600}mm
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-blue-600 mt-3">
            Final materials and pricing will be calculated after saving
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="mt-8 flex items-center justify-end gap-4">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-secondary">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </span>
          ) : (
            `${isEditing ? 'Update' : 'Add'} Job`
          )}
        </button>
      </div>
    </form>
  );
}
