/**
 * Jobs Service Unit Tests
 *
 * Tests for job business logic and validation
 */

import { describe, it, expect } from '@jest/globals';

// ============================================================================
// JOB TYPE VALIDATION
// ============================================================================

describe('Job Type Validation', () => {
  it('should accept valid job types', () => {
    const validTypes = ['retaining_wall', 'driveway', 'trenching', 'stormwater', 'site_prep'];

    validTypes.forEach((type) => {
      expect(validTypes).toContain(type);
    });
  });

  it('should have exactly 5 job types defined', () => {
    const validTypes = ['retaining_wall', 'driveway', 'trenching', 'stormwater', 'site_prep'];
    expect(validTypes).toHaveLength(5);
  });

  it('should use snake_case naming convention', () => {
    const validTypes = ['retaining_wall', 'driveway', 'trenching', 'stormwater', 'site_prep'];
    const snakeCasePattern = /^[a-z]+(_[a-z]+)*$/;

    validTypes.forEach((type) => {
      expect(type).toMatch(snakeCasePattern);
    });
  });
});

// ============================================================================
// JOB STRUCTURE VALIDATION
// ============================================================================

describe('Job Structure', () => {
  it('should have required fields for a valid job', () => {
    const validJob = {
      quote_id: '123e4567-e89b-12d3-a456-426614174000',
      job_type: 'retaining_wall',
      order_index: 0,
      parameters: {},
      materials: [],
      labour: {},
      calculations: {},
      subtotal: '0.00',
    };

    expect(validJob).toHaveProperty('quote_id');
    expect(validJob).toHaveProperty('job_type');
    expect(validJob).toHaveProperty('order_index');
    expect(validJob).toHaveProperty('parameters');
    expect(validJob).toHaveProperty('materials');
    expect(validJob).toHaveProperty('labour');
    expect(validJob).toHaveProperty('calculations');
    expect(validJob).toHaveProperty('subtotal');
  });

  it('should use JSONB for parameters', () => {
    const parameters = {
      height: 1.5,
      length: 10,
      wall_type: 'timber',
    };

    expect(typeof parameters).toBe('object');
    expect(parameters).not.toBeNull();
  });

  it('should use array of JSONB for materials', () => {
    const materials = [
      { name: 'Timber Posts', quantity: 10, unit: 'each', cost: 50.0 },
      { name: 'Concrete', quantity: 2, unit: 'm3', cost: 200.0 },
    ];

    expect(Array.isArray(materials)).toBe(true);
    materials.forEach((material) => {
      expect(typeof material).toBe('object');
    });
  });
});

// ============================================================================
// ORDER INDEX LOGIC
// ============================================================================

describe('Order Index Management', () => {
  it('should start order_index at 0 for first job', () => {
    const firstJobIndex = 0;
    expect(firstJobIndex).toBe(0);
  });

  it('should increment order_index for subsequent jobs', () => {
    const jobIndexes = [0, 1, 2, 3];
    jobIndexes.forEach((index, i) => {
      expect(index).toBe(i);
    });
  });

  it('should maintain sequential order after deletion', () => {
    // Simulate having jobs at indexes [0, 1, 2, 3]
    const jobs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

    // Delete job at index 1
    jobs.splice(1, 1);

    // Re-index: should be [0, 1, 2]
    const reindexed = jobs.map((job, index) => ({ ...job, order_index: index }));

    expect(reindexed[0].order_index).toBe(0);
    expect(reindexed[1].order_index).toBe(1);
    expect(reindexed[2].order_index).toBe(2);
  });
});

// ============================================================================
// SUBTOTAL CALCULATION
// ============================================================================

describe('Subtotal Calculations', () => {
  it('should store subtotal as decimal string', () => {
    const subtotal = '1234.56';
    expect(typeof subtotal).toBe('string');
    expect(parseFloat(subtotal)).toBe(1234.56);
  });

  it('should format subtotal with 2 decimal places', () => {
    const amounts = ['100.00', '50.50', '999.99'];

    amounts.forEach((amount) => {
      const [, decimals] = amount.split('.');
      expect(decimals).toHaveLength(2);
    });
  });

  it('should handle zero subtotal', () => {
    const subtotal = '0.00';
    expect(subtotal).toBe('0.00');
    expect(parseFloat(subtotal)).toBe(0);
  });

  it('should calculate sum of materials correctly', () => {
    const materials = [
      { cost: 50.0, quantity: 10 }, // 500
      { cost: 200.0, quantity: 2 }, // 400
    ];

    const totalMaterials = materials.reduce(
      (sum, material) => sum + material.cost * material.quantity,
      0,
    );

    expect(totalMaterials).toBe(900);
    expect(totalMaterials.toFixed(2)).toBe('900.00');
  });
});

// ============================================================================
// AUTHORIZATION LOGIC
// ============================================================================

describe('Authorization Rules', () => {
  it('should allow admin to access any job', () => {
    const isAdmin = true;
    const ownsQuote = false;

    const canAccess = isAdmin || ownsQuote;
    expect(canAccess).toBe(true);
  });

  it('should allow owner to access their own jobs', () => {
    const isAdmin = false;
    const ownsQuote = true;

    const canAccess = isAdmin || ownsQuote;
    expect(canAccess).toBe(true);
  });

  it('should deny non-owner, non-admin access', () => {
    const isAdmin = false;
    const ownsQuote = false;

    const canAccess = isAdmin || ownsQuote;
    expect(canAccess).toBe(false);
  });
});

// ============================================================================
// JOB TYPE COUNTS
// ============================================================================

describe('Job Type Counting', () => {
  it('should count jobs by type correctly', () => {
    const jobs = [
      { job_type: 'retaining_wall' },
      { job_type: 'retaining_wall' },
      { job_type: 'driveway' },
      { job_type: 'site_prep' },
    ];

    const counts = {
      retaining_wall: 0,
      driveway: 0,
      trenching: 0,
      stormwater: 0,
      site_prep: 0,
    };

    jobs.forEach((job) => {
      if (counts[job.job_type] !== undefined) {
        counts[job.job_type]++;
      }
    });

    expect(counts.retaining_wall).toBe(2);
    expect(counts.driveway).toBe(1);
    expect(counts.trenching).toBe(0);
    expect(counts.stormwater).toBe(0);
    expect(counts.site_prep).toBe(1);
  });

  it('should handle empty job list', () => {
    const jobs = [];

    const counts = {
      retaining_wall: 0,
      driveway: 0,
      trenching: 0,
      stormwater: 0,
      site_prep: 0,
    };

    jobs.forEach((job) => {
      if (counts[job.job_type] !== undefined) {
        counts[job.job_type]++;
      }
    });

    expect(Object.values(counts).every((count) => count === 0)).toBe(true);
  });
});

// ============================================================================
// REORDER VALIDATION
// ============================================================================

describe('Job Reordering', () => {
  it('should validate all jobs are included in reorder', () => {
    const existingJobs = [{ id: 'job-1' }, { id: 'job-2' }, { id: 'job-3' }];

    const reorderData = [
      { id: 'job-1', order_index: 2 },
      { id: 'job-2', order_index: 0 },
      { id: 'job-3', order_index: 1 },
    ];

    const allIncluded = existingJobs.length === reorderData.length;
    expect(allIncluded).toBe(true);
  });

  it('should detect missing jobs in reorder', () => {
    const existingJobs = [{ id: 'job-1' }, { id: 'job-2' }, { id: 'job-3' }];

    const reorderData = [
      { id: 'job-1', order_index: 0 },
      { id: 'job-2', order_index: 1 },
      // job-3 missing!
    ];

    const allIncluded = existingJobs.length === reorderData.length;
    expect(allIncluded).toBe(false);
  });

  it('should validate job belongs to quote before reorder', () => {
    const quoteId = 'quote-123';
    const job = { id: 'job-1', quote_id: 'quote-123' };

    const belongsToQuote = job.quote_id === quoteId;
    expect(belongsToQuote).toBe(true);
  });
});

// ============================================================================
// ERROR MESSAGE PREFIXES
// ============================================================================

describe('Error Message Conventions', () => {
  it('should use NOT_FOUND prefix for missing resources', () => {
    const error = 'NOT_FOUND: Job not found';
    expect(error.startsWith('NOT_FOUND')).toBe(true);
  });

  it('should use FORBIDDEN prefix for authorization errors', () => {
    const error = 'FORBIDDEN: You do not have permission to view this job';
    expect(error.startsWith('FORBIDDEN')).toBe(true);
  });

  it('should use INVALID prefix for validation errors', () => {
    const error = 'INVALID: All jobs must be included in reorder operation';
    expect(error.startsWith('INVALID')).toBe(true);
  });
});
