/**
 * Job Calculator Service
 *
 * Calculates materials, labour, and subtotal for each job type
 * Uses price sheet data and job-specific formulas
 *
 * Each job type has its own calculation logic based on parameters
 * from specs/BLUEPRINT.yaml
 */

import { db } from '../../shared/db/index.js';
import { priceSheets, priceItems } from '../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Calculate materials and labour for a job
 *
 * @param {string} jobType - Job type (retaining_wall, driveway, etc.)
 * @param {Object} parameters - Job-specific parameters
 * @param {string} priceSheetId - Price sheet ID to use (optional, uses latest if not provided)
 * @returns {Promise<Object>} Calculated job data
 */
export async function calculateJob(jobType, parameters, priceSheetId = null) {
  // Get price sheet (use latest if not specified)
  const priceSheet = await getPriceSheet(priceSheetId);

  if (!priceSheet) {
    throw new Error('No price sheet available. Please create a price sheet first.');
  }

  // Get all price items for this sheet
  const items = await db.select().from(priceItems).where(eq(priceItems.price_sheet_id, priceSheet.id));

  // Create lookup map for easy price retrieval
  const priceMap = new Map();
  for (const item of items) {
    priceMap.set(item.name.toLowerCase(), {
      price: parseFloat(item.price),
      unit: item.unit,
    });
  }

  // Calculate based on job type
  switch (jobType) {
    case 'retaining_wall':
      return calculateRetainingWall(parameters, priceMap);
    case 'driveway':
      return calculateDriveway(parameters, priceMap);
    case 'trenching':
      return calculateTrenching(parameters, priceMap);
    case 'stormwater':
      return calculateStormwater(parameters, priceMap);
    case 'site_prep':
      return calculateSitePrep(parameters, priceMap);
    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}

/**
 * Get price sheet (latest or specific)
 */
async function getPriceSheet(priceSheetId = null) {
  if (priceSheetId) {
    const sheets = await db.select().from(priceSheets).where(eq(priceSheets.id, priceSheetId));
    return sheets[0] || null;
  }

  // Get latest price sheet
  const sheets = await db.select().from(priceSheets).orderBy(priceSheets.created_at, 'desc').limit(1);
  return sheets[0] || null;
}

/**
 * Get price from map with error handling
 */
function getPrice(priceMap, itemName) {
  const item = priceMap.get(itemName.toLowerCase());
  if (!item) {
    throw new Error(`Price not found for: ${itemName}. Please add this item to the price sheet.`);
  }
  return item.price;
}

// ============================================================================
// JOB TYPE CALCULATORS
// ============================================================================

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
function calculateRetainingWall(params, priceMap) {
  const { bays, height, length, include_ag_pipe, include_orange_plastic } = params;

  // Validate required parameters
  if (!bays || !height || !length) {
    throw new Error('Missing required parameters: bays, height, length');
  }

  const materials = [];

  // Calculate blocks needed
  // Each bay = 1 block, height determines rows
  // height in mm / 200mm per block = rows
  const rows = Math.ceil(height / 200);
  const totalBlocks = bays * rows;
  const blockPrice = getPrice(priceMap, 'block');

  materials.push({
    name: 'Retaining Wall Block',
    quantity: totalBlocks,
    unit: 'blocks',
    unitPrice: blockPrice,
    totalCost: totalBlocks * blockPrice,
  });

  // Calculate road base (for compaction)
  // Assume 100mm base depth per linear meter
  const roadBaseM3 = (length * 1 * 0.1); // length * width(1m) * depth(0.1m)
  const roadBasePrice = getPrice(priceMap, 'road base');

  materials.push({
    name: 'Road Base',
    quantity: roadBaseM3,
    unit: 'm³',
    unitPrice: roadBasePrice,
    totalCost: roadBaseM3 * roadBasePrice,
  });

  // AG Pipe (optional)
  if (include_ag_pipe) {
    const agPipePrice = getPrice(priceMap, 'ag pipe');
    materials.push({
      name: 'AG Pipe',
      quantity: length,
      unit: 'm',
      unitPrice: agPipePrice,
      totalCost: length * agPipePrice,
    });
  }

  // Orange Plastic (optional)
  if (include_orange_plastic) {
    const plasticPrice = getPrice(priceMap, 'orange plastic');
    materials.push({
      name: 'Orange Plastic',
      quantity: length,
      unit: 'm',
      unitPrice: plasticPrice,
      totalCost: length * plasticPrice,
    });
  }

  // Calculate subtotal (sum of all materials)
  const subtotal = materials.reduce((sum, material) => sum + material.totalCost, 0);

  // Labour (estimate based on complexity)
  const labourHours = bays * rows * 0.5; // 30 min per block
  const labourRate = priceMap.get('labour rate')?.price || 0;

  const labour = {
    hours: labourHours,
    rate: labourRate,
    totalCost: labourHours * labourRate,
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
    subtotal: parseFloat((subtotal + labour.totalCost).toFixed(2)),
  };
}

/**
 * Calculate Driveway Job
 */
function calculateDriveway(params, priceMap) {
  const { length, width, base_thickness_mm, include_topping, topping_thickness_mm, topping_type } =
    params;

  if (!length || !width || !base_thickness_mm) {
    throw new Error('Missing required parameters: length, width, base_thickness_mm');
  }

  const materials = [];

  // Base material calculation
  const baseM3 = (length * width * (base_thickness_mm / 1000));
  const roadBasePrice = getPrice(priceMap, 'road base');

  materials.push({
    name: 'Road Base (Base)',
    quantity: baseM3,
    unit: 'm³',
    unitPrice: roadBasePrice,
    totalCost: baseM3 * roadBasePrice,
  });

  // Topping material (optional)
  if (include_topping && topping_thickness_mm) {
    const toppingM3 = (length * width * (topping_thickness_mm / 1000));
    const toppingPrice = getPrice(priceMap, topping_type || '20mm gravel');

    materials.push({
      name: `${topping_type || '20mm gravel'} (Topping)`,
      quantity: toppingM3,
      unit: 'm³',
      unitPrice: toppingPrice,
      totalCost: toppingM3 * toppingPrice,
    });
  }

  const subtotal = materials.reduce((sum, material) => sum + material.totalCost, 0);

  // Labour
  const labourHours = (length * width) / 10; // ~10m²/hour
  const labourRate = priceMap.get('labour rate')?.price || 0;

  const labour = {
    hours: labourHours,
    rate: labourRate,
    totalCost: labourHours * labourRate,
  };

  return {
    materials,
    labour,
    calculations: {
      baseM3,
      toppingM3: include_topping ? (length * width * (topping_thickness_mm / 1000)) : 0,
      labourHours,
    },
    subtotal: parseFloat((subtotal + labour.totalCost).toFixed(2)),
  };
}

/**
 * Calculate Trenching Job
 */
function calculateTrenching(params, priceMap) {
  const { length, width_mm, depth_mm, include_stormwater, pipe_length, t_joints, elbows, downpipe_adaptors } = params;

  if (!length || !width_mm || !depth_mm) {
    throw new Error('Missing required parameters: length, width_mm, depth_mm');
  }

  const materials = [];

  // Calculate excavation volume
  const volumeM3 = (length * (width_mm / 1000) * (depth_mm / 1000));

  // Labour for trenching (estimated based on volume)
  const labourHours = volumeM3 * 2; // ~2 hours per m³
  const labourRate = priceMap.get('labour rate')?.price || 0;

  const labour = {
    hours: labourHours,
    rate: labourRate,
    totalCost: labourHours * labourRate,
  };

  // Stormwater components (optional)
  if (include_stormwater) {
    if (pipe_length) {
      const pipePrice = getPrice(priceMap, 'pvc 90mm pipe');
      materials.push({
        name: 'PVC 90mm Pipe',
        quantity: pipe_length,
        unit: 'm',
        unitPrice: pipePrice,
        totalCost: pipe_length * pipePrice,
      });
    }

    if (t_joints) {
      const tJointPrice = getPrice(priceMap, 't-joint');
      materials.push({
        name: 'T-Joint',
        quantity: t_joints,
        unit: 'units',
        unitPrice: tJointPrice,
        totalCost: t_joints * tJointPrice,
      });
    }

    if (elbows) {
      const elbowPrice = getPrice(priceMap, 'elbow');
      materials.push({
        name: 'Elbow',
        quantity: elbows,
        unit: 'units',
        unitPrice: elbowPrice,
        totalCost: elbows * elbowPrice,
      });
    }

    if (downpipe_adaptors) {
      const adaptorPrice = getPrice(priceMap, 'downpipe adaptor');
      materials.push({
        name: 'Downpipe Adaptor',
        quantity: downpipe_adaptors,
        unit: 'units',
        unitPrice: adaptorPrice,
        totalCost: downpipe_adaptors * adaptorPrice,
      });
    }
  }

  const subtotal = materials.reduce((sum, material) => sum + material.totalCost, 0);

  return {
    materials,
    labour,
    calculations: {
      volumeM3,
      labourHours,
    },
    subtotal: parseFloat((subtotal + labour.totalCost).toFixed(2)),
  };
}

/**
 * Calculate Stormwater Job
 */
function calculateStormwater(params, priceMap) {
  const { pipe_length, pipe_type, t_joints, elbows, downpipe_adaptors, include_trenching, trench_length, trench_width_mm } = params;

  if (!pipe_length || !pipe_type) {
    throw new Error('Missing required parameters: pipe_length, pipe_type');
  }

  const materials = [];

  // Pipe
  const pipePrice = getPrice(priceMap, pipe_type.toLowerCase());
  materials.push({
    name: pipe_type,
    quantity: pipe_length,
    unit: 'm',
    unitPrice: pipePrice,
    totalCost: pipe_length * pipePrice,
  });

  // Fittings
  if (t_joints) {
    const tJointPrice = getPrice(priceMap, 't-joint');
    materials.push({
      name: 'T-Joint',
      quantity: t_joints,
      unit: 'units',
      unitPrice: tJointPrice,
      totalCost: t_joints * tJointPrice,
    });
  }

  if (elbows) {
    const elbowPrice = getPrice(priceMap, 'elbow');
    materials.push({
      name: 'Elbow',
      quantity: elbows,
      unit: 'units',
      unitPrice: elbowPrice,
      totalCost: elbows * elbowPrice,
    });
  }

  if (downpipe_adaptors) {
    const adaptorPrice = getPrice(priceMap, 'downpipe adaptor');
    materials.push({
      name: 'Downpipe Adaptor',
      quantity: downpipe_adaptors,
      unit: 'units',
      unitPrice: adaptorPrice,
      totalCost: downpipe_adaptors * adaptorPrice,
    });
  }

  // Trenching (optional)
  let labourHours = pipe_length * 0.3; // ~18 min per meter of pipe installation

  if (include_trenching && trench_length) {
    const trenchVolumeM3 = (trench_length * (trench_width_mm / 1000) * 0.5); // Assume 500mm depth
    labourHours += trenchVolumeM3 * 2;
  }

  const labourRate = priceMap.get('labour rate')?.price || 0;
  const labour = {
    hours: labourHours,
    rate: labourRate,
    totalCost: labourHours * labourRate,
  };

  const subtotal = materials.reduce((sum, material) => sum + material.totalCost, 0);

  return {
    materials,
    labour,
    calculations: {
      labourHours,
    },
    subtotal: parseFloat((subtotal + labour.totalCost).toFixed(2)),
  };
}

/**
 * Calculate Site Prep Job
 */
function calculateSitePrep(params, priceMap) {
  const { area, depth_mm, include_backfill, backfill_type, requires_dumping, dump_distance_km, supply_distance_km } = params;

  if (!area || !depth_mm) {
    throw new Error('Missing required parameters: area, depth_mm');
  }

  const materials = [];

  // Calculate volume to excavate
  const volumeM3 = (area * (depth_mm / 1000));

  // Backfill material (optional)
  if (include_backfill && backfill_type) {
    const backfillPrice = getPrice(priceMap, backfill_type);
    materials.push({
      name: backfill_type,
      quantity: volumeM3,
      unit: 'm³',
      unitPrice: backfillPrice,
      totalCost: volumeM3 * backfillPrice,
    });
  }

  // Labour for excavation/prep
  let labourHours = volumeM3 * 1.5; // ~1.5 hours per m³

  // Additional labour for dumping/supply
  if (requires_dumping && dump_distance_km) {
    labourHours += (dump_distance_km / 50) * volumeM3; // Travel time
  }

  if (supply_distance_km) {
    labourHours += (supply_distance_km / 50) * volumeM3;
  }

  const labourRate = priceMap.get('labour rate')?.price || 0;
  const labour = {
    hours: labourHours,
    rate: labourRate,
    totalCost: labourHours * labourRate,
  };

  const subtotal = materials.reduce((sum, material) => sum + material.totalCost, 0);

  return {
    materials,
    labour,
    calculations: {
      volumeM3,
      labourHours,
    },
    subtotal: parseFloat((subtotal + labour.totalCost).toFixed(2)),
  };
}
