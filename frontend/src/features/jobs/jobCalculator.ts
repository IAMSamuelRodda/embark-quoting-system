/**
 * Job Calculator Service (Frontend)
 *
 * Calculates materials, labour, and subtotal for each job type
 * Uses hardcoded price data for offline-first operation
 *
 * This mirrors the backend calculator logic to ensure consistent calculations
 * even when completely offline.
 *
 * Price data matches backend/database/seed-dev.js
 */

// Price data (matches backend seed data)
const PRICE_MAP = new Map([
  // Retaining wall materials
  ['block', { price: 12.5, unit: 'per block' }],
  ['road base', { price: 45.0, unit: 'm³' }],
  ['ag pipe', { price: 8.5, unit: 'm' }],
  ['orange plastic', { price: 3.2, unit: 'm' }],

  // Driveway materials
  ['20mm gravel', { price: 55.0, unit: 'm³' }],

  // Stormwater materials
  ['pvc 90mm pipe', { price: 12.0, unit: 'm' }],
  ['t-joint', { price: 18.0, unit: 'unit' }],
  ['elbow', { price: 15.0, unit: 'unit' }],
  ['downpipe adaptor', { price: 22.0, unit: 'unit' }],

  // Site prep materials
  ['paving sand', { price: 65.0, unit: 'm³' }],

  // Labour
  ['labour rate', { price: 85.0, unit: 'per hour' }],
]);

/**
 * Get price from map with error handling
 */
function getPrice(itemName: string): number {
  const item = PRICE_MAP.get(itemName.toLowerCase());
  if (!item) {
    console.error(`Price not found for: ${itemName}, returning 0`);
    return 0;
  }
  return item.price;
}

export interface Material {
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total: number;
}

export interface Labour {
  hours: number;
  rate_per_hour: number;
  total: number;
}

export interface JobCalculation {
  materials: Material[];
  labour: Labour;
  subtotal: number;
  calculations?: Record<string, number>;
}

/**
 * Calculate materials and labour for a job
 */
export function calculateJob(jobType: string, parameters: Record<string, unknown>): JobCalculation {
  switch (jobType) {
    case 'retaining_wall':
      return calculateRetainingWall(parameters);
    case 'driveway':
      return calculateDriveway(parameters);
    case 'trenching':
      return calculateTrenching(parameters);
    case 'stormwater':
      return calculateStormwater(parameters);
    case 'site_prep':
      return calculateSitePrep(parameters);
    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}

/**
 * Calculate Retaining Wall Job
 *
 * Parameters:
 * - bays (number)
 * - height (200-1000mm in 200mm increments)
 * - length (meters)
 * - include_ag_pipe (boolean)
 * - include_orange_plastic (boolean)
 */
function calculateRetainingWall(params: Record<string, unknown>): JobCalculation {
  const { bays, height, length, ag_pipe, orange_plastic } = params;

  if (!bays || !height || !length) {
    throw new Error('Missing required parameters: bays, height, length');
  }

  // Type assertions for numeric parameters
  const numBays = bays as number;
  const numHeight = height as number;
  const numLength = length as number;

  const materials: Material[] = [];

  // Calculate blocks needed
  const rows = Math.ceil(numHeight / 200);
  const totalBlocks = numBays * rows;
  const blockPrice = getPrice('block');

  materials.push({
    name: 'Retaining Wall Block',
    quantity: totalBlocks,
    unit: 'blocks',
    price_per_unit: blockPrice,
    total: totalBlocks * blockPrice,
  });

  // Calculate road base
  const roadBaseM3 = numLength * 1 * 0.1; // length * width(1m) * depth(0.1m)
  const roadBasePrice = getPrice('road base');

  materials.push({
    name: 'Road Base',
    quantity: roadBaseM3,
    unit: 'm³',
    price_per_unit: roadBasePrice,
    total: roadBaseM3 * roadBasePrice,
  });

  // AG Pipe (optional)
  if (ag_pipe) {
    const agPipePrice = getPrice('ag pipe');
    materials.push({
      name: 'AG Pipe',
      quantity: numLength,
      unit: 'm',
      price_per_unit: agPipePrice,
      total: numLength * agPipePrice,
    });
  }

  // Orange Plastic (optional)
  if (orange_plastic) {
    const plasticPrice = getPrice('orange plastic');
    materials.push({
      name: 'Orange Plastic',
      quantity: numLength,
      unit: 'm',
      price_per_unit: plasticPrice,
      total: numLength * plasticPrice,
    });
  }

  // Calculate subtotal
  const materialsCost = materials.reduce((sum, material) => sum + material.total, 0);

  // Labour
  const labourHours = numBays * rows * 0.5; // 30 min per block
  const labourRate = getPrice('labour rate');

  const labour: Labour = {
    hours: labourHours,
    rate_per_hour: labourRate,
    total: labourHours * labourRate,
  };

  return {
    materials,
    labour,
    calculations: {
      totalBlocks,
      rows,
      roadBaseM3,
      labourHours,
    },
    subtotal: parseFloat((materialsCost + labour.total).toFixed(2)),
  };
}

/**
 * Calculate Driveway Job
 *
 * Parameters:
 * - length (meters)
 * - width (meters)
 * - base_thickness (number, in mm)
 * - topping_enabled (boolean)
 * - topping_thickness (number, in mm, optional)
 * - topping_type (string, optional)
 */
function calculateDriveway(params: Record<string, unknown>): JobCalculation {
  const { length, width, base_thickness, topping_enabled, topping_thickness, topping_type } =
    params;

  if (!length || !width || !base_thickness) {
    throw new Error('Missing required parameters: length, width, base_thickness');
  }

  // Type assertions for numeric parameters
  const numLength = length as number;
  const numWidth = width as number;
  const numBaseThickness = base_thickness as number;

  const materials: Material[] = [];

  // Base material calculation
  const baseM3 = numLength * numWidth * (numBaseThickness / 1000);
  const roadBasePrice = getPrice('road base');

  materials.push({
    name: 'Road Base (Base)',
    quantity: baseM3,
    unit: 'm³',
    price_per_unit: roadBasePrice,
    total: baseM3 * roadBasePrice,
  });

  // Topping material (optional)
  if (topping_enabled && topping_thickness) {
    const numToppingThickness = topping_thickness as number;
    const toppingM3 = numLength * numWidth * (numToppingThickness / 1000);
    const toppingPrice = getPrice((topping_type as string) || '20mm gravel');

    materials.push({
      name: `${(topping_type as string) || '20mm gravel'} (Topping)`,
      quantity: toppingM3,
      unit: 'm³',
      price_per_unit: toppingPrice,
      total: toppingM3 * toppingPrice,
    });
  }

  const materialsCost = materials.reduce((sum, material) => sum + material.total, 0);

  // Labour
  const labourHours = (numLength * numWidth) / 10; // ~10m²/hour
  const labourRate = getPrice('labour rate');

  const labour: Labour = {
    hours: labourHours,
    rate_per_hour: labourRate,
    total: labourHours * labourRate,
  };

  return {
    materials,
    labour,
    calculations: {
      baseM3,
      toppingM3:
        topping_enabled && topping_thickness
          ? numLength * numWidth * ((topping_thickness as number) / 1000)
          : 0,
      labourHours,
    },
    subtotal: parseFloat((materialsCost + labour.total).toFixed(2)),
  };
}

/**
 * Calculate Trenching Job
 *
 * Parameters:
 * - length (meters)
 * - width_mm (300-1000mm)
 * - depth (meters)
 */
function calculateTrenching(params: Record<string, unknown>): JobCalculation {
  const { length, width, depth } = params;

  if (!length || !width || !depth) {
    throw new Error('Missing required parameters: length, width, depth');
  }

  // Type assertions for numeric parameters
  const numLength = length as number;
  const numWidth = width as number;
  const numDepth = depth as number;

  const materials: Material[] = [];

  // Calculate road base for backfill
  const volumeM3 = numLength * (numWidth / 1000) * numDepth;
  const roadBasePrice = getPrice('road base');

  materials.push({
    name: 'Road Base (Backfill)',
    quantity: volumeM3,
    unit: 'm³',
    price_per_unit: roadBasePrice,
    total: volumeM3 * roadBasePrice,
  });

  const materialsCost = materials.reduce((sum, material) => sum + material.total, 0);

  // Labour (trenching is labour-intensive)
  const labourHours = numLength * 0.5; // 30 min per linear meter
  const labourRate = getPrice('labour rate');

  const labour: Labour = {
    hours: labourHours,
    rate_per_hour: labourRate,
    total: labourHours * labourRate,
  };

  return {
    materials,
    labour,
    calculations: {
      volumeM3,
      labourHours,
    },
    subtotal: parseFloat((materialsCost + labour.total).toFixed(2)),
  };
}

/**
 * Calculate Stormwater Job
 *
 * Parameters:
 * - total_length (meters of pipe)
 * - num_t_joints (number)
 * - num_elbows (number)
 * - num_downpipes (number)
 */
function calculateStormwater(params: Record<string, unknown>): JobCalculation {
  const { pipe_length, t_joints, elbows, downpipe_adaptors } = params;

  if (!pipe_length) {
    throw new Error('Missing required parameter: pipe_length');
  }

  // Type assertions for numeric parameters
  const numPipeLength = pipe_length as number;
  const numTJoints = (t_joints as number) || 0;
  const numElbows = (elbows as number) || 0;
  const numDownpipeAdaptors = (downpipe_adaptors as number) || 0;

  const materials: Material[] = [];

  // PVC pipe
  const pipePrice = getPrice('pvc 90mm pipe');
  materials.push({
    name: 'PVC 90mm Pipe',
    quantity: numPipeLength,
    unit: 'm',
    price_per_unit: pipePrice,
    total: numPipeLength * pipePrice,
  });

  // T-joints
  if (t_joints && numTJoints > 0) {
    const tJointPrice = getPrice('t-joint');
    materials.push({
      name: 'T-Joint',
      quantity: numTJoints,
      unit: 'unit',
      price_per_unit: tJointPrice,
      total: numTJoints * tJointPrice,
    });
  }

  // Elbows
  if (elbows && numElbows > 0) {
    const elbowPrice = getPrice('elbow');
    materials.push({
      name: 'Elbow',
      quantity: numElbows,
      unit: 'unit',
      price_per_unit: elbowPrice,
      total: numElbows * elbowPrice,
    });
  }

  // Downpipe adaptors
  if (downpipe_adaptors && numDownpipeAdaptors > 0) {
    const adaptorPrice = getPrice('downpipe adaptor');
    materials.push({
      name: 'Downpipe Adaptor',
      quantity: numDownpipeAdaptors,
      unit: 'unit',
      price_per_unit: adaptorPrice,
      total: numDownpipeAdaptors * adaptorPrice,
    });
  }

  const materialsCost = materials.reduce((sum, material) => sum + material.total, 0);

  // Labour
  const labourHours = numPipeLength * 0.3 + (numTJoints + numElbows + numDownpipeAdaptors) * 0.25;
  const labourRate = getPrice('labour rate');

  const labour: Labour = {
    hours: labourHours,
    rate_per_hour: labourRate,
    total: labourHours * labourRate,
  };

  return {
    materials,
    labour,
    calculations: {
      labourHours,
    },
    subtotal: parseFloat((materialsCost + labour.total).toFixed(2)),
  };
}

/**
 * Calculate Site Prep Job
 *
 * Parameters:
 * - area (square meters)
 * - depth (compaction depth in meters)
 * - backfill_type (string: 'road_base' or 'paving_sand', optional)
 */
function calculateSitePrep(params: Record<string, unknown>): JobCalculation {
  const { area, depth, backfill_type } = params;

  if (!area || !depth) {
    throw new Error('Missing required parameters: area, depth');
  }

  // Type assertions for numeric parameters
  const numArea = area as number;
  const numDepth = depth as number;

  const materials: Material[] = [];

  // Road base for compaction
  const roadBaseM3 = numArea * numDepth;
  const roadBasePrice = getPrice('road base');

  materials.push({
    name: 'Road Base',
    quantity: roadBaseM3,
    unit: 'm³',
    price_per_unit: roadBasePrice,
    total: roadBaseM3 * roadBasePrice,
  });

  // Paving sand (optional - if backfill_type is 'paving_sand')
  if (backfill_type === 'paving_sand') {
    // Assume 50mm of paving sand
    const sandM3 = numArea * 0.05;
    const sandPrice = getPrice('paving sand');

    materials.push({
      name: 'Paving Sand',
      quantity: sandM3,
      unit: 'm³',
      price_per_unit: sandPrice,
      total: sandM3 * sandPrice,
    });
  }

  const materialsCost = materials.reduce((sum, material) => sum + material.total, 0);

  // Labour
  const labourHours = numArea / 20; // ~20m²/hour for site prep
  const labourRate = getPrice('labour rate');

  const labour: Labour = {
    hours: labourHours,
    rate_per_hour: labourRate,
    total: labourHours * labourRate,
  };

  return {
    materials,
    labour,
    calculations: {
      roadBaseM3,
      sandM3: backfill_type === 'paving_sand' ? numArea * 0.05 : 0,
      labourHours,
    },
    subtotal: parseFloat((materialsCost + labour.total).toFixed(2)),
  };
}
