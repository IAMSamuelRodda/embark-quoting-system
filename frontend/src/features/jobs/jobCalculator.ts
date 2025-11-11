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
  ['block', { price: 12.50, unit: 'per block' }],
  ['road base', { price: 45.00, unit: 'm³' }],
  ['ag pipe', { price: 8.50, unit: 'm' }],
  ['orange plastic', { price: 3.20, unit: 'm' }],

  // Driveway materials
  ['20mm gravel', { price: 55.00, unit: 'm³' }],

  // Stormwater materials
  ['pvc 90mm pipe', { price: 12.00, unit: 'm' }],
  ['t-joint', { price: 18.00, unit: 'unit' }],
  ['elbow', { price: 15.00, unit: 'unit' }],
  ['downpipe adaptor', { price: 22.00, unit: 'unit' }],

  // Site prep materials
  ['paving sand', { price: 65.00, unit: 'm³' }],

  // Labour
  ['labour rate', { price: 85.00, unit: 'per hour' }],
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
export function calculateJob(jobType: string, parameters: Record<string, any>): JobCalculation {
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
function calculateRetainingWall(params: Record<string, any>): JobCalculation {
  const { bays, height, length, include_ag_pipe, include_orange_plastic } = params;

  if (!bays || !height || !length) {
    throw new Error('Missing required parameters: bays, height, length');
  }

  const materials: Material[] = [];

  // Calculate blocks needed
  const rows = Math.ceil(height / 200);
  const totalBlocks = bays * rows;
  const blockPrice = getPrice('block');

  materials.push({
    name: 'Retaining Wall Block',
    quantity: totalBlocks,
    unit: 'blocks',
    price_per_unit: blockPrice,
    total: totalBlocks * blockPrice,
  });

  // Calculate road base
  const roadBaseM3 = length * 1 * 0.1; // length * width(1m) * depth(0.1m)
  const roadBasePrice = getPrice('road base');

  materials.push({
    name: 'Road Base',
    quantity: roadBaseM3,
    unit: 'm³',
    price_per_unit: roadBasePrice,
    total: roadBaseM3 * roadBasePrice,
  });

  // AG Pipe (optional)
  if (include_ag_pipe) {
    const agPipePrice = getPrice('ag pipe');
    materials.push({
      name: 'AG Pipe',
      quantity: length,
      unit: 'm',
      price_per_unit: agPipePrice,
      total: length * agPipePrice,
    });
  }

  // Orange Plastic (optional)
  if (include_orange_plastic) {
    const plasticPrice = getPrice('orange plastic');
    materials.push({
      name: 'Orange Plastic',
      quantity: length,
      unit: 'm',
      price_per_unit: plasticPrice,
      total: length * plasticPrice,
    });
  }

  // Calculate subtotal
  const materialsCost = materials.reduce((sum, material) => sum + material.total, 0);

  // Labour
  const labourHours = bays * rows * 0.5; // 30 min per block
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
 * - base_thickness_mm (number)
 * - include_topping (boolean)
 * - topping_thickness_mm (number, optional)
 * - topping_type (string, optional)
 */
function calculateDriveway(params: Record<string, any>): JobCalculation {
  const { length, width, base_thickness_mm, include_topping, topping_thickness_mm, topping_type } = params;

  if (!length || !width || !base_thickness_mm) {
    throw new Error('Missing required parameters: length, width, base_thickness_mm');
  }

  const materials: Material[] = [];

  // Base material calculation
  const baseM3 = length * width * (base_thickness_mm / 1000);
  const roadBasePrice = getPrice('road base');

  materials.push({
    name: 'Road Base (Base)',
    quantity: baseM3,
    unit: 'm³',
    price_per_unit: roadBasePrice,
    total: baseM3 * roadBasePrice,
  });

  // Topping material (optional)
  if (include_topping && topping_thickness_mm) {
    const toppingM3 = length * width * (topping_thickness_mm / 1000);
    const toppingPrice = getPrice(topping_type || '20mm gravel');

    materials.push({
      name: `${topping_type || '20mm gravel'} (Topping)`,
      quantity: toppingM3,
      unit: 'm³',
      price_per_unit: toppingPrice,
      total: toppingM3 * toppingPrice,
    });
  }

  const materialsCost = materials.reduce((sum, material) => sum + material.total, 0);

  // Labour
  const labourHours = (length * width) / 10; // ~10m²/hour
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
      toppingM3: include_topping && topping_thickness_mm ? (length * width * (topping_thickness_mm / 1000)) : 0,
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
function calculateTrenching(params: Record<string, any>): JobCalculation {
  const { length, width_mm, depth } = params;

  if (!length || !width_mm || !depth) {
    throw new Error('Missing required parameters: length, width_mm, depth');
  }

  const materials: Material[] = [];

  // Calculate road base for backfill
  const volumeM3 = length * (width_mm / 1000) * depth;
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
  const labourHours = length * 0.5; // 30 min per linear meter
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
function calculateStormwater(params: Record<string, any>): JobCalculation {
  const { total_length, num_t_joints, num_elbows, num_downpipes } = params;

  if (!total_length) {
    throw new Error('Missing required parameter: total_length');
  }

  const materials: Material[] = [];

  // PVC pipe
  const pipePrice = getPrice('pvc 90mm pipe');
  materials.push({
    name: 'PVC 90mm Pipe',
    quantity: total_length,
    unit: 'm',
    price_per_unit: pipePrice,
    total: total_length * pipePrice,
  });

  // T-joints
  if (num_t_joints && num_t_joints > 0) {
    const tJointPrice = getPrice('t-joint');
    materials.push({
      name: 'T-Joint',
      quantity: num_t_joints,
      unit: 'unit',
      price_per_unit: tJointPrice,
      total: num_t_joints * tJointPrice,
    });
  }

  // Elbows
  if (num_elbows && num_elbows > 0) {
    const elbowPrice = getPrice('elbow');
    materials.push({
      name: 'Elbow',
      quantity: num_elbows,
      unit: 'unit',
      price_per_unit: elbowPrice,
      total: num_elbows * elbowPrice,
    });
  }

  // Downpipe adaptors
  if (num_downpipes && num_downpipes > 0) {
    const adaptorPrice = getPrice('downpipe adaptor');
    materials.push({
      name: 'Downpipe Adaptor',
      quantity: num_downpipes,
      unit: 'unit',
      price_per_unit: adaptorPrice,
      total: num_downpipes * adaptorPrice,
    });
  }

  const materialsCost = materials.reduce((sum, material) => sum + material.total, 0);

  // Labour
  const labourHours = total_length * 0.3 + (num_t_joints + num_elbows + num_downpipes) * 0.25;
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
 * - depth_mm (compaction depth in mm)
 * - include_paving_sand (boolean)
 */
function calculateSitePrep(params: Record<string, any>): JobCalculation {
  const { area, depth_mm, include_paving_sand } = params;

  if (!area || !depth_mm) {
    throw new Error('Missing required parameters: area, depth_mm');
  }

  const materials: Material[] = [];

  // Road base for compaction
  const roadBaseM3 = area * (depth_mm / 1000);
  const roadBasePrice = getPrice('road base');

  materials.push({
    name: 'Road Base',
    quantity: roadBaseM3,
    unit: 'm³',
    price_per_unit: roadBasePrice,
    total: roadBaseM3 * roadBasePrice,
  });

  // Paving sand (optional)
  if (include_paving_sand) {
    // Assume 50mm of paving sand
    const sandM3 = area * 0.05;
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
  const labourHours = area / 20; // ~20m²/hour for site prep
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
      sandM3: include_paving_sand ? area * 0.05 : 0,
      labourHours,
    },
    subtotal: parseFloat((materialsCost + labour.total).toFixed(2)),
  };
}
