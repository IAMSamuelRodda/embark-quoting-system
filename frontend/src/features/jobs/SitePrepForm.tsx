import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Job, JobType } from '../../shared/types/models';

// Validation schema for site prep job
const sitePrepSchema = z.object({
  area: z
    .number()
    .positive('Area must be greater than 0')
    .max(100000, 'Maximum area is 100,000 m²'),
  depth: z.number().positive('Depth must be greater than 0').max(10, 'Maximum depth is 10 meters'),
  backfill_enabled: z.boolean(),
  backfill_type: z.enum(['road_base', 'paving_sand']).optional(),
  dumping_required: z.boolean(),
  dumping_distance: z
    .number()
    .nonnegative('Distance cannot be negative')
    .max(500, 'Maximum dumping distance is 500km')
    .optional(),
  supply_distance: z
    .number()
    .nonnegative('Distance cannot be negative')
    .max(500, 'Maximum supply distance is 500km'),
});

type SitePrepFormData = z.infer<typeof sitePrepSchema>;

interface SitePrepFormProps {
  quoteId: string;
  onSave: (jobData: Partial<Job>) => Promise<void>;
  onCancel: () => void;
  existingJob?: Job;
}

export function SitePrepForm({ quoteId, onSave, onCancel, existingJob }: SitePrepFormProps) {
  const isEditing = !!existingJob;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SitePrepFormData>({
    resolver: zodResolver(sitePrepSchema),
    defaultValues: existingJob
      ? {
          area: (existingJob.parameters.area as number) || 0,
          depth: (existingJob.parameters.depth as number) || 0,
          backfill_enabled: !!(existingJob.parameters.backfill_type as string),
          backfill_type:
            (existingJob.parameters.backfill_type as 'road_base' | 'paving_sand') || 'road_base',
          dumping_required: (existingJob.parameters.dumping_required as boolean) || false,
          dumping_distance: (existingJob.parameters.dumping_distance as number) || 0,
          supply_distance: (existingJob.parameters.supply_distance as number) || 0,
        }
      : {
          area: 0,
          depth: 0,
          backfill_enabled: false,
          backfill_type: 'road_base',
          dumping_required: false,
          dumping_distance: 0,
          supply_distance: 0,
        },
  });

  const formValues = watch();

  // Calculate material estimates
  const calculateEstimate = () => {
    const volume = (formValues.area || 0) * (formValues.depth || 0);
    const backfillVolume = formValues.backfill_enabled ? volume : 0;

    // Approximate truck loads (assuming 10m³ per truck)
    const excavationLoads = Math.ceil(volume / 10);
    const backfillLoads = Math.ceil(backfillVolume / 10);

    return {
      volume: volume.toFixed(2),
      backfillVolume: backfillVolume.toFixed(2),
      excavationLoads,
      backfillLoads,
    };
  };

  const estimate = calculateEstimate();

  const onSubmit = async (data: SitePrepFormData) => {
    const jobData: Partial<Job> = {
      quote_id: quoteId,
      job_type: JobType.SITE_PREP,
      parameters: {
        area: data.area,
        depth: data.depth,
        backfill_type: data.backfill_enabled ? data.backfill_type : undefined,
        dumping_required: data.dumping_required,
        dumping_distance: data.dumping_required ? data.dumping_distance : undefined,
        supply_distance: data.supply_distance,
      },
      // Explicitly include required fields with defaults (backend validation expects these)
      materials: undefined,
      labour: undefined,
      calculations: {},
      subtotal: 0,
    };

    await onSave(jobData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit' : 'Add'} Site Preparation
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Enter site dimensions and material requirements
        </p>
      </div>

      <div className="space-y-6">
        {/* Area and Depth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
              Area (m²) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('area', { valueAsNumber: true })}
              type="number"
              id="area"
              step="0.1"
              min="0"
              max="100000"
              className={`input-field ${errors.area ? 'border-red-500' : ''}`}
              placeholder="e.g., 250.5"
            />
            {errors.area && <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>}
            <p className="mt-1 text-xs text-gray-500">Total area to be prepared</p>
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
              placeholder="e.g., 0.5"
            />
            {errors.depth && <p className="mt-1 text-sm text-red-600">{errors.depth.message}</p>}
            <p className="mt-1 text-xs text-gray-500">Excavation or fill depth</p>
          </div>
        </div>

        {/* Backfill Options */}
        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              {...register('backfill_enabled')}
              type="checkbox"
              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">Include Backfill</span>
              <p className="text-xs text-gray-500 mt-1">
                Fill excavated area with road base or paving sand
              </p>
            </div>
          </label>

          {formValues.backfill_enabled && (
            <div className="ml-7 animate-in fade-in duration-200">
              <label
                htmlFor="backfill_type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Backfill Material
              </label>
              <select {...register('backfill_type')} id="backfill_type" className="input-field">
                <option value="road_base">Road Base</option>
                <option value="paving_sand">Paving Sand</option>
              </select>
            </div>
          )}
        </div>

        {/* Dumping Options */}
        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              {...register('dumping_required')}
              type="checkbox"
              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">Dumping Required</span>
              <p className="text-xs text-gray-500 mt-1">
                Excavated material needs to be removed and dumped off-site
              </p>
            </div>
          </label>

          {formValues.dumping_required && (
            <div className="ml-7 animate-in fade-in duration-200">
              <label
                htmlFor="dumping_distance"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Dumping Distance (km)
              </label>
              <input
                {...register('dumping_distance', { valueAsNumber: true })}
                type="number"
                id="dumping_distance"
                step="0.1"
                min="0"
                max="500"
                className={`input-field ${errors.dumping_distance ? 'border-red-500' : ''}`}
                placeholder="e.g., 15.5"
              />
              {errors.dumping_distance && (
                <p className="mt-1 text-sm text-red-600">{errors.dumping_distance.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Distance to dump site from job location</p>
            </div>
          )}
        </div>

        {/* Supply Distance */}
        <div>
          <label htmlFor="supply_distance" className="block text-sm font-medium text-gray-700 mb-2">
            Material Supply Distance (km) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('supply_distance', { valueAsNumber: true })}
            type="number"
            id="supply_distance"
            step="0.1"
            min="0"
            max="500"
            className={`input-field ${errors.supply_distance ? 'border-red-500' : ''}`}
            placeholder="e.g., 10.0"
          />
          {errors.supply_distance && (
            <p className="mt-1 text-sm text-red-600">{errors.supply_distance.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Distance from supplier to job location (affects transport costs)
          </p>
        </div>

        {/* Material Estimate Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Estimated Volumes</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Excavation Volume:</span>
              <span className="font-medium">{estimate.volume} m³</span>
            </div>
            <div className="flex justify-between">
              <span>Truck Loads (excavation):</span>
              <span className="font-medium">~{estimate.excavationLoads} loads</span>
            </div>
            {formValues.backfill_enabled && (
              <>
                <div className="flex justify-between">
                  <span>Backfill Volume:</span>
                  <span className="font-medium">{estimate.backfillVolume} m³</span>
                </div>
                <div className="flex justify-between">
                  <span>Truck Loads (backfill):</span>
                  <span className="font-medium">~{estimate.backfillLoads} loads</span>
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
