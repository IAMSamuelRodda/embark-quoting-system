import { create } from 'zustand';
import { type Job } from '../../shared/types/models';
import * as jobsDb from './jobsDb';

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
      // Load from IndexedDB (offline-first)
      const jobs = await jobsDb.getJobsByQuoteId(quoteId);
      set({ jobs, isLoading: false });
      console.log(`[useJobs] Loaded ${jobs.length} jobs for quote ${quoteId} from IndexedDB`);
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
      const { quote_id } = jobData;
      if (!quote_id) {
        throw new Error('quote_id is required to create a job');
      }

      // Create job in IndexedDB (offline-first)
      // No need to check backend - job will sync automatically via sync queue
      console.log(`[useJobs] Creating job for quote ${quote_id} (offline-first)`);
      const newJob = await jobsDb.createJob(jobData, quote_id);

      // Add to local state
      set((state) => ({
        jobs: [...state.jobs, newJob],
        isLoading: false,
      }));

      console.log(`[useJobs] ✓ Job created: ${newJob.id} (sync_status: ${newJob.sync_status})`);
      console.log('[useJobs] Job will sync to backend automatically via sync queue');

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
      // Update job in IndexedDB (offline-first)
      await jobsDb.updateJob(jobId, updates);

      // Get updated job from IndexedDB
      const updatedJob = await jobsDb.getJobById(jobId);

      if (!updatedJob) {
        throw new Error(`Job ${jobId} not found after update`);
      }

      // Update in local state
      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === jobId ? updatedJob : job)),
        isLoading: false,
      }));

      console.log(`[useJobs] ✓ Job updated: ${jobId} (sync_status: ${updatedJob.sync_status})`);

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
      // Delete job from IndexedDB (offline-first)
      await jobsDb.deleteJob(jobId);

      // Remove from local state
      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== jobId),
        isLoading: false,
      }));

      console.log(`[useJobs] ✓ Job deleted: ${jobId}`);
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
      // Reorder jobs in IndexedDB (offline-first)
      await jobsDb.reorderJobs(quoteId, jobOrders);

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

      console.log(`[useJobs] ✓ Jobs reordered for quote ${quoteId}`);
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
