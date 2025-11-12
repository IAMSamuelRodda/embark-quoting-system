import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Job, JobType } from '../../shared/types/models';

// Validation schema for trenching job
const trenchingSchema = z.object({
  length: z
    .number()
    .positive('Length must be greater than 0')
    .max(1000, 'Maximum length is 1000 meters'),
  width: z.enum(['300', '600', '900'], {
    message: 'Width must be 300mm, 600mm, or 900mm',
  }),
  depth: z.number().positive('Depth must be greater than 0').max(10, 'Maximum depth is 10 meters'),
  for_stormwater: z.boolean(),
  // Optional stormwater details if for_stormwater is true
  pipe_length: z
    .number()
    .positive('Pipe length must be greater than 0')
    .max(1000, 'Maximum pipe length is 1000 meters')
    .optional(),
  t_joints: z
    .number()
    .int()
    .nonnegative('T-joints cannot be negative')
    .max(100, 'Maximum 100 T-joints')
    .optional(),
  elbows: z
    .number()
    .int()
    .nonnegative('Elbows cannot be negative')
    .max(100, 'Maximum 100 elbows')
    .optional(),
  downpipe_adaptors: z
    .number()
    .int()
    .nonnegative('Downpipe adaptors cannot be negative')
    .max(100, 'Maximum 100 downpipe adaptors')
    .optional(),
});

type TrenchingFormData = z.infer<typeof trenchingSchema>;

interface TrenchingFormProps {
  quoteId: string;
  onSave: (jobData: Partial<Job>) => Promise<void>;
  onCancel: () => void;
  existingJob?: Job;
}

export function TrenchingForm({ quoteId, onSave, onCancel, existingJob }: TrenchingFormProps) {
  const isEditing = !!existingJob;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TrenchingFormData>({
    resolver: zodResolver(trenchingSchema),
    defaultValues: existingJob
      ? {
          length: (existingJob.parameters.length as number) || 0,
          width: String(existingJob.parameters.width) as '300' | '600' | '900',
          depth: (existingJob.parameters.depth as number) || 0,
          for_stormwater: (existingJob.parameters.for_stormwater as boolean) || false,
          pipe_length: (existingJob.parameters.pipe_length as number) || 0,
          t_joints: (existingJob.parameters.t_joints as number) || 0,
          elbows: (existingJob.parameters.elbows as number) || 0,
          downpipe_adaptors: (existingJob.parameters.downpipe_adaptors as number) || 0,
        }
      : {
          length: 10,
          width: '600',
          depth: 0.5,
          for_stormwater: false,
          pipe_length: 10,
          t_joints: 0,
          elbows: 0,
          downpipe_adaptors: 0,
        },
  });

  const formValues = watch();

  // Calculate material estimates
  const calculateEstimate = () => {
    const widthInMeters = parseInt(formValues.width || '600') / 1000;
    const volume = (formValues.length || 0) * widthInMeters * (formValues.depth || 0);

    // Approximate truck loads (assuming 10m³ per truck)
    const excavationLoads = Math.ceil(volume / 10);

    return {
      volume: volume.toFixed(2),
      excavationLoads,
      pipeLength: formValues.for_stormwater ? formValues.pipe_length || 0 : 0,
    };
  };

  const estimate = calculateEstimate();

  const onSubmit = async (data: TrenchingFormData) => {
    const jobData: Partial<Job> = {
      quote_id: quoteId,
      job_type: JobType.TRENCHING,
      parameters: {
        length: data.length,
        width: parseInt(data.width),
        depth: data.depth,
        for_stormwater: data.for_stormwater,
        ...(data.for_stormwater && {
          pipe_length: data.pipe_length,
          t_joints: data.t_joints,
          elbows: data.elbows,
          downpipe_adaptors: data.downpipe_adaptors,
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
          {isEditing ? 'Edit' : 'Add'} Trenching
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Enter trench dimensions and stormwater requirements
        </p>
      </div>

      <div className="space-y-6">
        {/* Trench Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
              Length (meters) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('length', { valueAsNumber: true })}
              type="number"
              id="length"
              step="0.1"
              min="0"
              max="1000"
              className={`input-field ${errors.length ? 'border-red-500' : ''}`}
              placeholder="e.g., 25.5"
            />
            {errors.length && <p className="mt-1 text-sm text-red-600">{errors.length.message}</p>}
          </div>

          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
              Width (mm) <span className="text-red-500">*</span>
            </label>
            <select
              {...register('width')}
              id="width"
              className={`input-field ${errors.width ? 'border-red-500' : ''}`}
            >
              <option value="300">300mm</option>
              <option value="600">600mm</option>
              <option value="900">900mm</option>
            </select>
            {errors.width && <p className="mt-1 text-sm text-red-600">{errors.width.message}</p>}
          </div>

          <div>
            <label htmlFor="depth" className="block text-sm font-medium text-gray-700 mb-2">
              Depth (meters) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('depth', { valueAsNumber: true })}
              type="number"
              id="depth"
              step="0.1"
              min="0"
              max="10"
              className={`input-field ${errors.depth ? 'border-red-500' : ''}`}
              placeholder="e.g., 0.8"
            />
            {errors.depth && <p className="mt-1 text-sm text-red-600">{errors.depth.message}</p>}
          </div>
        </div>

        {/* Stormwater Integration */}
        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              {...register('for_stormwater')}
              type="checkbox"
              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">For Stormwater Drainage</span>
              <p className="text-xs text-gray-500 mt-1">
                Include stormwater pipes and fittings in this trench
              </p>
            </div>
          </label>

          {formValues.for_stormwater && (
            <div className="ml-7 space-y-4 animate-in fade-in duration-200">
              <div>
                <label
                  htmlFor="pipe_length"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Pipe Length (meters)
                </label>
                <input
                  {...register('pipe_length', { valueAsNumber: true })}
                  type="number"
                  id="pipe_length"
                  step="0.1"
                  min="0"
                  max="1000"
                  className={`input-field ${errors.pipe_length ? 'border-red-500' : ''}`}
                  placeholder="e.g., 25.0"
                />
                {errors.pipe_length && (
                  <p className="mt-1 text-sm text-red-600">{errors.pipe_length.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Length of PVC 90mm pipe required</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="t_joints"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
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
                    Elbows
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
          )}
        </div>

        {/* Material Estimate Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Estimated Materials</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Excavation Volume:</span>
              <span className="font-medium">{estimate.volume} m³</span>
            </div>
            <div className="flex justify-between">
              <span>Truck Loads:</span>
              <span className="font-medium">~{estimate.excavationLoads} loads</span>
            </div>
            {formValues.for_stormwater && (
              <>
                <div className="flex justify-between">
                  <span>Pipe Length:</span>
                  <span className="font-medium">{estimate.pipeLength}m PVC 90mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Fittings:</span>
                  <span className="font-medium">
                    {(formValues.t_joints || 0) +
                      (formValues.elbows || 0) +
                      (formValues.downpipe_adaptors || 0)}{' '}
                    pieces
                  </span>
                </div>
              </>
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
