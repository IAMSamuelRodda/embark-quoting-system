import { create } from 'zustand';
import { type Job } from '../../shared/types/models';
import apiClient from '../../shared/api/apiClient';

interface JobsState {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadJobsForQuote: (quoteId: string) => Promise<void>;
  createJob: (jobData: Partial<Job>) => Promise<Job>;
  updateJob: (jobId: string, updates: Partial<Job>) => Promise<Job>;
  deleteJob: (jobId: string) => Promise<void>;
  reorderJobs: (quoteId: string, jobOrders: { id: string; order_index: number }[]) => Promise<void>;
  clearJobs: () => void;
}

export const useJobs = create<JobsState>((set) => ({
  jobs: [],
  isLoading: false,
  error: null,

  loadJobsForQuote: async (quoteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Job[]>(`/jobs/quote/${quoteId}`);
      set({ jobs: response.data!, isLoading: false });
    } catch (error) {
      console.error('Failed to load jobs:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load jobs',
        isLoading: false,
      });
    }
  },

  createJob: async (jobData: Partial<Job>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<Job>('/jobs', jobData);
      const newJob = response.data!;

      // Add to local state
      set((state) => ({
        jobs: [...state.jobs, newJob],
        isLoading: false,
      }));

      return newJob;
    } catch (error) {
      console.error('Failed to create job:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create job',
        isLoading: false,
      });
      throw error;
    }
  },

  updateJob: async (jobId: string, updates: Partial<Job>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put<Job>(`/jobs/${jobId}`, updates);
      const updatedJob = response.data!;

      // Update in local state
      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === jobId ? updatedJob : job)),
        isLoading: false,
      }));

      return updatedJob;
    } catch (error) {
      console.error('Failed to update job:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update job',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteJob: async (jobId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/jobs/${jobId}`);

      // Remove from local state
      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== jobId),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to delete job:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete job',
        isLoading: false,
      });
      throw error;
    }
  },

  reorderJobs: async (quoteId: string, jobOrders: { id: string; order_index: number }[]) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.put<void>(`/jobs/quote/${quoteId}/reorder`, { jobOrders });

      // Update local state order
      const orderMap = new Map(jobOrders.map((j) => [j.id, j.order_index]));
      set((state) => ({
        jobs: state.jobs
          .map(
            (job): Job => ({
              ...job,
              order_index: orderMap.get(job.id) ?? job.order_index,
            }),
          )
          .sort((a, b) => a.order_index - b.order_index),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to reorder jobs:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to reorder jobs',
        isLoading: false,
      });
      throw error;
    }
  },

  clearJobs: () => {
    set({ jobs: [], error: null });
  },
}));
