import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Job, JobType } from '../../shared/types/models';

// Validation schema for retaining wall job
const retainingWallSchema = z.object({
  bays: z.number().int().min(1, 'Must have at least 1 bay').max(100, 'Maximum 100 bays'),
  height: z.enum(['200', '400', '600', '800', '1000'], {
    message: 'Height must be 200-1000mm in 200mm increments',
  }),
  length: z
    .number()
    .positive('Length must be greater than 0')
    .max(1000, 'Maximum length is 1000 meters'),
  ag_pipe: z.boolean(),
  orange_plastic: z.boolean(),
});

type RetainingWallFormData = z.infer<typeof retainingWallSchema>;

interface RetainingWallFormProps {
  quoteId: string;
  onSave: (jobData: Partial<Job>) => Promise<void>;
  onCancel: () => void;
  existingJob?: Job;
}

export function RetainingWallForm({
  quoteId,
  onSave,
  onCancel,
  existingJob,
}: RetainingWallFormProps) {
  const isEditing = !!existingJob;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RetainingWallFormData>({
    resolver: zodResolver(retainingWallSchema),
    defaultValues: existingJob
      ? {
          bays: (existingJob.parameters.bays as number) || 1,
          height: String(existingJob.parameters.height) as '200' | '400' | '600' | '800' | '1000',
          length: (existingJob.parameters.length as number) || 0,
          ag_pipe: (existingJob.parameters.ag_pipe as boolean) || false,
          orange_plastic: (existingJob.parameters.orange_plastic as boolean) || false,
        }
      : {
          bays: 1,
          height: '600',
          length: 0,
          ag_pipe: false,
          orange_plastic: false,
        },
  });

  // Watch form values for real-time calculation preview
  const formValues = watch();

  // Calculate material estimates (simplified - backend will do full calculation)
  const calculateEstimate = () => {
    const heightNum = parseInt(formValues.height || '600');
    const blocksPerBay = heightNum / 200; // One block per 200mm
    const totalBlocks = formValues.bays * blocksPerBay;

    return {
      blocks: Math.ceil(totalBlocks),
      length: formValues.length || 0,
      agPipeRequired: formValues.ag_pipe ? formValues.length : 0,
    };
  };

  const estimate = calculateEstimate();

  const onSubmit = async (data: RetainingWallFormData) => {
    const jobData: Partial<Job> = {
      quote_id: quoteId,
      job_type: JobType.RETAINING_WALL,
      parameters: {
        bays: data.bays,
        height: parseInt(data.height),
        length: data.length,
        ag_pipe: data.ag_pipe,
        orange_plastic: data.orange_plastic,
      },
      // Backend will calculate materials, labour, calculations, and subtotal
    };

    await onSave(jobData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit' : 'Add'} Retaining Wall
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Enter wall dimensions and select additional options
        </p>
      </div>

      <div className="space-y-6">
        {/* Bays */}
        <div>
          <label htmlFor="bays" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Bays <span className="text-red-500">*</span>
          </label>
          <input
            {...register('bays', { valueAsNumber: true })}
            type="number"
            id="bays"
            min="1"
            max="100"
            className={`input-field ${errors.bays ? 'border-red-500' : ''}`}
            placeholder="e.g., 5"
          />
          {errors.bays && <p className="mt-1 text-sm text-red-600">{errors.bays.message}</p>}
          <p className="mt-1 text-xs text-gray-500">Each bay is a section of the retaining wall</p>
        </div>

        {/* Height */}
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
            Height (mm) <span className="text-red-500">*</span>
          </label>
          <select
            {...register('height')}
            id="height"
            className={`input-field ${errors.height ? 'border-red-500' : ''}`}
          >
            <option value="200">200mm (1 block)</option>
            <option value="400">400mm (2 blocks)</option>
            <option value="600">600mm (3 blocks)</option>
            <option value="800">800mm (4 blocks)</option>
            <option value="1000">1000mm (5 blocks)</option>
          </select>
          {errors.height && <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>}
        </div>

        {/* Length */}
        <div>
          <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
            Total Length (meters) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('length', { valueAsNumber: true })}
            type="number"
            id="length"
            step="0.1"
            min="0"
            max="1000"
            className={`input-field ${errors.length ? 'border-red-500' : ''}`}
            placeholder="e.g., 15.5"
          />
          {errors.length && <p className="mt-1 text-sm text-red-600">{errors.length.message}</p>}
          <p className="mt-1 text-xs text-gray-500">Linear meters of retaining wall</p>
        </div>

        {/* Additional Options */}
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">Additional Options</label>

          <div className="space-y-3">
            {/* AG Pipe */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register('ag_pipe')}
                type="checkbox"
                className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Include AG Pipe</span>
                <p className="text-xs text-gray-500 mt-1">
                  Agricultural drainage pipe for water management behind wall
                </p>
              </div>
            </label>

            {/* Orange Plastic */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register('orange_plastic')}
                type="checkbox"
                className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Include Orange Plastic</span>
                <p className="text-xs text-gray-500 mt-1">Waterproof membrane behind wall</p>
              </div>
            </label>
          </div>
        </div>

        {/* Material Estimate Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Estimated Materials</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Blocks:</span>
              <span className="font-medium">~{estimate.blocks} blocks</span>
            </div>
            <div className="flex justify-between">
              <span>Wall Length:</span>
              <span className="font-medium">{estimate.length.toFixed(1)}m</span>
            </div>
            {formValues.ag_pipe && (
              <div className="flex justify-between">
                <span>AG Pipe:</span>
                <span className="font-medium">~{estimate.agPipeRequired.toFixed(1)}m</span>
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
