import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Job, JobType } from '../../shared/types/models';

// Validation schema for driveway job
const drivewaySchema = z.object({
  length: z
    .number()
    .positive('Length must be greater than 0')
    .max(1000, 'Maximum length is 1000 meters'),
  width: z
    .number()
    .positive('Width must be greater than 0')
    .max(100, 'Maximum width is 100 meters'),
  base_thickness: z
    .number()
    .int()
    .min(50, 'Minimum base thickness is 50mm')
    .max(500, 'Maximum base thickness is 500mm'),
  topping_enabled: z.boolean(),
  topping_thickness: z
    .number()
    .int()
    .min(50, 'Minimum topping thickness is 50mm')
    .max(300, 'Maximum topping thickness is 300mm')
    .optional(),
  topping_type: z.string().optional(),
});

type DrivewayFormData = z.infer<typeof drivewaySchema>;

interface DrivewayFormProps {
  quoteId: string;
  onSave: (jobData: Partial<Job>) => Promise<void>;
  onCancel: () => void;
  existingJob?: Job;
}

export function DrivewayForm({ quoteId, onSave, onCancel, existingJob }: DrivewayFormProps) {
  const isEditing = !!existingJob;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DrivewayFormData>({
    resolver: zodResolver(drivewaySchema),
    defaultValues: existingJob
      ? {
          length: (existingJob.parameters.length as number) || 0,
          width: (existingJob.parameters.width as number) || 0,
          base_thickness: (existingJob.parameters.base_thickness as number) || 200,
          topping_enabled: (existingJob.parameters.topping_enabled as boolean) || false,
          topping_thickness: (existingJob.parameters.topping_thickness as number) || 100,
          topping_type: (existingJob.parameters.topping_type as string) || '20mm gravel',
        }
      : {
          length: 0,
          width: 0,
          base_thickness: 200,
          topping_enabled: false,
          topping_thickness: 100,
          topping_type: '20mm gravel',
        },
  });

  const formValues = watch();

  // Calculate material estimates
  const calculateEstimate = () => {
    const area = (formValues.length || 0) * (formValues.width || 0);
    const baseVolume = (area * (formValues.base_thickness || 200)) / 1000; // m³
    const toppingVolume =
      formValues.topping_enabled && formValues.topping_thickness
        ? (area * formValues.topping_thickness) / 1000
        : 0;

    return {
      area: area.toFixed(2),
      baseVolume: baseVolume.toFixed(2),
      toppingVolume: toppingVolume.toFixed(2),
    };
  };

  const estimate = calculateEstimate();

  const onSubmit = async (data: DrivewayFormData) => {
    const jobData: Partial<Job> = {
      quote_id: quoteId,
      job_type: JobType.DRIVEWAY,
      parameters: {
        length: data.length,
        width: data.width,
        base_thickness: data.base_thickness,
        topping_enabled: data.topping_enabled,
        topping_thickness: data.topping_enabled ? data.topping_thickness : undefined,
        topping_type: data.topping_enabled ? data.topping_type : undefined,
      },
      // Backend will calculate materials, labour, calculations, and subtotal
    };

    await onSave(jobData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit' : 'Add'} Driveway
        </h3>
        <p className="text-sm text-gray-600 mt-1">Enter driveway dimensions and specifications</p>
      </div>

      <div className="space-y-6">
        {/* Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="e.g., 20.5"
            />
            {errors.length && <p className="mt-1 text-sm text-red-600">{errors.length.message}</p>}
          </div>

          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
              Width (meters) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('width', { valueAsNumber: true })}
              type="number"
              id="width"
              step="0.1"
              min="0"
              max="100"
              className={`input-field ${errors.width ? 'border-red-500' : ''}`}
              placeholder="e.g., 3.5"
            />
            {errors.width && <p className="mt-1 text-sm text-red-600">{errors.width.message}</p>}
          </div>
        </div>

        {/* Base Thickness */}
        <div>
          <label htmlFor="base_thickness" className="block text-sm font-medium text-gray-700 mb-2">
            Base Thickness (mm) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('base_thickness', { valueAsNumber: true })}
            type="number"
            id="base_thickness"
            step="10"
            min="50"
            max="500"
            className={`input-field ${errors.base_thickness ? 'border-red-500' : ''}`}
            placeholder="200"
          />
          {errors.base_thickness && (
            <p className="mt-1 text-sm text-red-600">{errors.base_thickness.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Recommended: 200mm for residential driveways</p>
        </div>

        {/* Topping Options */}
        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              {...register('topping_enabled')}
              type="checkbox"
              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">Add Topping Layer</span>
              <p className="text-xs text-gray-500 mt-1">
                Additional surface layer (gravel or crushed rock)
              </p>
            </div>
          </label>

          {formValues.topping_enabled && (
            <div className="ml-7 space-y-4 animate-in fade-in duration-200">
              <div>
                <label
                  htmlFor="topping_thickness"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Topping Thickness (mm)
                </label>
                <input
                  {...register('topping_thickness', { valueAsNumber: true })}
                  type="number"
                  id="topping_thickness"
                  step="10"
                  min="50"
                  max="300"
                  className={`input-field ${errors.topping_thickness ? 'border-red-500' : ''}`}
                  placeholder="100"
                />
                {errors.topping_thickness && (
                  <p className="mt-1 text-sm text-red-600">{errors.topping_thickness.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="topping_type"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Topping Type
                </label>
                <input
                  {...register('topping_type')}
                  type="text"
                  id="topping_type"
                  className="input-field"
                  placeholder="20mm gravel"
                />
              </div>
            </div>
          )}
        </div>

        {/* Material Estimate Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Estimated Materials</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Total Area:</span>
              <span className="font-medium">{estimate.area} m²</span>
            </div>
            <div className="flex justify-between">
              <span>Base Material:</span>
              <span className="font-medium">~{estimate.baseVolume} m³ road base</span>
            </div>
            {formValues.topping_enabled && (
              <div className="flex justify-between">
                <span>Topping Material:</span>
                <span className="font-medium">
                  ~{estimate.toppingVolume} m³ {formValues.topping_type || 'gravel'}
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
