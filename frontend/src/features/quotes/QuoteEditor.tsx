import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuotes } from './useQuotes';
import { useAuth } from '../auth/useAuth';
import { QuoteStatus } from '../../shared/types/models';

// Validation schema
const quoteEditorSchema = z.object({
  customer_name: z
    .string()
    .min(1, 'Customer name is required')
    .max(200, 'Customer name must be less than 200 characters'),
  customer_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  customer_phone: z
    .string()
    .regex(/^(\+?61|0)?[2-478]( ?\d){8}$/, 'Invalid Australian phone number (e.g., 0412 345 678)')
    .optional()
    .or(z.literal('')),
  customer_address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  suburb: z.string().max(100, 'Suburb must be less than 100 characters').optional(),
  postcode: z
    .string()
    .regex(/^\d{4}$/, 'Invalid postcode (must be 4 digits)')
    .optional()
    .or(z.literal('')),
  gps_latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional()
    .or(z.literal(undefined)),
  gps_longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
    .or(z.literal(undefined)),
});

type QuoteEditorFormData = z.infer<typeof quoteEditorSchema>;

export function QuoteEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createNewQuote } = useQuotes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<QuoteEditorFormData>({
    resolver: zodResolver(quoteEditorSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_address: '',
      suburb: '',
      postcode: '',
      gps_latitude: undefined,
      gps_longitude: undefined,
    },
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('gps_latitude', position.coords.latitude);
        setValue('gps_longitude', position.coords.longitude);
        setGpsEnabled(true);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get location: ' + error.message);
        setGettingLocation(false);
      },
    );
  };

  const onSubmit = async (data: QuoteEditorFormData) => {
    setIsSubmitting(true);
    try {
      const quoteData = {
        user_id: user?.email || '',
        customer_name: data.customer_name,
        customer_email: data.customer_email || undefined,
        customer_phone: data.customer_phone || undefined,
        customer_address: data.customer_address || undefined,
        location: {
          suburb: data.suburb || undefined,
          postcode: data.postcode || undefined,
          gps:
            data.gps_latitude && data.gps_longitude
              ? {
                  latitude: data.gps_latitude,
                  longitude: data.gps_longitude,
                }
              : undefined,
        },
        status: QuoteStatus.DRAFT,
      };

      const newQuote = await createNewQuote(quoteData);
      navigate(`/quotes/${newQuote.id}`);
    } catch (error) {
      console.error('Failed to create quote:', error);
      alert('Failed to create quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Quotes
          </button>
          <h1 className="text-3xl font-bold text-gray-900">New Quote</h1>
          <p className="text-gray-600 mt-2">Enter customer information to get started</p>
        </div>

        {/* Offline Warning */}
        {!navigator.onLine && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              📵 You're offline. Quote will be saved locally and synced when you're back online.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            {/* Customer Name */}
            <div>
              <label
                htmlFor="customer_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('customer_name')}
                type="text"
                id="customer_name"
                className={`input-field ${errors.customer_name ? 'border-red-500' : ''}`}
                placeholder="John Smith"
              />
              {errors.customer_name && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
              )}
            </div>

            {/* Customer Email */}
            <div>
              <label
                htmlFor="customer_email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                {...register('customer_email')}
                type="email"
                id="customer_email"
                className={`input-field ${errors.customer_email ? 'border-red-500' : ''}`}
                placeholder="john.smith@example.com"
              />
              {errors.customer_email && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_email.message}</p>
              )}
            </div>

            {/* Customer Phone */}
            <div>
              <label
                htmlFor="customer_phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone
              </label>
              <input
                {...register('customer_phone')}
                type="tel"
                id="customer_phone"
                className={`input-field ${errors.customer_phone ? 'border-red-500' : ''}`}
                placeholder="0412 345 678"
              />
              {errors.customer_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_phone.message}</p>
              )}
            </div>

            {/* Customer Address */}
            <div>
              <label
                htmlFor="customer_address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Street Address
              </label>
              <textarea
                {...register('customer_address')}
                id="customer_address"
                rows={3}
                className={`input-field ${errors.customer_address ? 'border-red-500' : ''}`}
                placeholder="123 Main Street"
              />
              {errors.customer_address && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_address.message}</p>
              )}
            </div>

            {/* Suburb and Postcode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 mb-2">
                  Suburb
                </label>
                <input
                  {...register('suburb')}
                  type="text"
                  id="suburb"
                  className={`input-field ${errors.suburb ? 'border-red-500' : ''}`}
                  placeholder="Sydney"
                />
                {errors.suburb && (
                  <p className="mt-1 text-sm text-red-600">{errors.suburb.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <input
                  {...register('postcode')}
                  type="text"
                  id="postcode"
                  maxLength={4}
                  className={`input-field ${errors.postcode ? 'border-red-500' : ''}`}
                  placeholder="2000"
                />
                {errors.postcode && (
                  <p className="mt-1 text-sm text-red-600">{errors.postcode.message}</p>
                )}
              </div>
            </div>

            {/* GPS Location */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">GPS Location (Optional)</label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  {gettingLocation ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Getting location...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Get Current Location
                    </>
                  )}
                </button>
              </div>

              {gpsEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="gps_latitude"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Latitude
                    </label>
                    <input
                      {...register('gps_latitude', { valueAsNumber: true })}
                      type="number"
                      step="any"
                      id="gps_latitude"
                      className={`input-field ${errors.gps_latitude ? 'border-red-500' : ''}`}
                      placeholder="-33.8688"
                      readOnly
                    />
                    {errors.gps_latitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.gps_latitude.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="gps_longitude"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Longitude
                    </label>
                    <input
                      {...register('gps_longitude', { valueAsNumber: true })}
                      type="number"
                      step="any"
                      id="gps_longitude"
                      className={`input-field ${errors.gps_longitude ? 'border-red-500' : ''}`}
                      placeholder="151.2093"
                      readOnly
                    />
                    {errors.gps_longitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.gps_longitude.message}</p>
                    )}
                  </div>
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                GPS coordinates help locate the job site on a map and can be used for route
                planning.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="btn-secondary"
            >
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
                  Creating Quote...
                </span>
              ) : (
                'Create Quote'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuoteEditor;
