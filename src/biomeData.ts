export interface ClimateRange {
  min: number;
  max: number;
}

export interface ClimatePoint {
  temp: ClimateRange;
  hum: ClimateRange;
  cont: ClimateRange;
  eros: ClimateRange;
  weird: ClimateRange;
  depth: ClimateRange;
}

export interface Biome {
  id: string;
  name: string;
  color: string;
  description: string;
  points: ClimatePoint[];
  baseRarity: number; // Vanilla generation weight/frequency (high = common, low = rare)
}

export interface DimensionDefinition {
  id: string;
  name: string;
  description: string;
  biomes: Biome[];
  defaultFixed: {
    temp: number;
    hum: number;
    cont: number;
    eros: number;
    weird: number;
    depth: number;
  };
}

// Bounding box helper to convert multiple points into a single overall bounding box
// for backward-compatibility with elements that might need overall ranges.
export function getBiomeBounds(biome: Biome) {
  if (biome.points.length === 0) {
    return {
      temp: { min: -1, max: 1 },
      hum: { min: -1, max: 1 },
      cont: { min: -1, max: 1 },
      eros: { min: -1, max: 1 },
      weird: { min: -1, max: 1 },
      depth: { min: -1, max: 1 }
    };
  }
  const bounds = {
    temp: { min: Infinity, max: -Infinity },
    hum: { min: Infinity, max: -Infinity },
    cont: { min: Infinity, max: -Infinity },
    eros: { min: Infinity, max: -Infinity },
    weird: { min: Infinity, max: -Infinity },
    depth: { min: Infinity, max: -Infinity }
  };
  for (const p of biome.points) {
    bounds.temp.min = Math.min(bounds.temp.min, p.temp.min);
    bounds.temp.max = Math.max(bounds.temp.max, p.temp.max);
    bounds.hum.min = Math.min(bounds.hum.min, p.hum.min);
    bounds.hum.max = Math.max(bounds.hum.max, p.hum.max);
    bounds.cont.min = Math.min(bounds.cont.min, p.cont.min);
    bounds.cont.max = Math.max(bounds.cont.max, p.cont.max);
    bounds.eros.min = Math.min(bounds.eros.min, p.eros.min);
    bounds.eros.max = Math.max(bounds.eros.max, p.eros.max);
    bounds.weird.min = Math.min(bounds.weird.min, p.weird.min);
    bounds.weird.max = Math.max(bounds.weird.max, p.weird.max);
    bounds.depth.min = Math.min(bounds.depth.min, p.depth.min);
    bounds.depth.max = Math.max(bounds.depth.max, p.depth.max);
  }
  return bounds;
}

export const BACKWOODS_DIMENSIONS: DimensionDefinition[] = [
  {
    id: "the_grain",
    name: "The Grain",
    description: "Vast, woodbound world of colossal arches, high tension nests, and hidden grids.",
    defaultFixed: { temp: 0.2, hum: 0.0, cont: 0.85, eros: 0.0, weird: 0.5, depth: 0.0 },
    biomes: [
      {
        id: "uniform_grain",
        name: "Uniform Grain",
        color: "#d7ccc8",
        description: "The primary base biome. Vast flat grains of wood and standard woodbound structures.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.5, max: 0.5 },
            hum: { min: -0.3, max: 0.5 },
            cont: { min: -1.0, max: 0.2 },
            eros: { min: -1.0, max: 0.2 },
            weird: { min: -1.0, max: -0.3 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "stillwood",
        name: "Stillwood",
        color: "#5d4037",
        description: "A moderately common, dense and quiet forest biome with tall oak arches.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.1, max: 1.0 },
            hum: { min: 0.2, max: 0.8 },
            cont: { min: 0.5, max: 1.0 },
            eros: { min: -0.7, max: 0.3 },
            weird: { min: 0.2, max: 0.7 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "splinter_nest",
        name: "Splinter Nest",
        color: "#ff7043",
        description: "An extremely hostile nest of woodbound entities. High tension and dangerous traps.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.0083, max: 0.7917 },
            hum: { min: -0.8358, max: 0.5358 },
            cont: { min: 0.7041, max: 1.0959 },
            eros: { min: -0.5395, max: 0.4395 },
            weird: { min: 0.778, max: 1.072 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "labyrinthine_grids",
        name: "Labyrinthine Grids",
        color: "#00796b",
        description: "A grid-locked maze of high walls, mist, and cardinal-bound Lignum Palus stalks.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.2, max: 0.2 },
            hum: { min: 0.6, max: 1.0 },
            cont: { min: 0.0, max: 0.5 },
            eros: { min: 0.8, max: 1.0 },
            weird: { min: 0.4, max: 0.6 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "fractured_barrens",
        name: "Fractured Barrens",
        color: "#c2185b",
        description: "Dry, scorched barrens featuring vertical fissures and mechanical sentinel remnants.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.7, max: 0.9 },
            hum: { min: -1.0, max: -0.6 },
            cont: { min: 0.3, max: 0.5 },
            eros: { min: -0.1, max: 0.1 },
            weird: { min: -0.3, max: -0.1 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "pillar_thicket",
        name: "Pillar Thicket",
        color: "#ffd54f",
        description: "A near-mythical, highly claustrophobic grove of massive pillar blockages.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.0, max: 0.1 },
            hum: { min: -0.1, max: 0.1 },
            cont: { min: 0.85, max: 0.95 },
            eros: { min: 0.6, max: 0.8 },
            weird: { min: -0.6, max: -0.4 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      }
    ]
  },
  {
    id: "the_petrified_weald",
    name: "The Petrified Weald",
    description: "An ancient, silent land where vegetation and the ground itself have hardened into stone.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.3, weird: 0.4, depth: 0.0 },
    biomes: [
      {
        id: "weald_outskirts",
        name: "Weald Outskirts",
        color: "#8d6e63",
        description: "The transition zone into the petrified weald, featuring scattered calcified trees.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.5, max: 0.0 },
            hum: { min: -0.5, max: 0.0 },
            cont: { min: -0.5, max: 0.5 },
            eros: { min: 0.2, max: 0.5 },
            weird: { min: 0.0, max: 0.3 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "calcified_plains",
        name: "Calcified Plains",
        color: "#b0bec5",
        description: "A pale, dusty field of petrified soil, fossilized remnants, and white chalk-like rocks.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -1.0, max: -0.5 },
            hum: { min: -0.5, max: -0.1 },
            cont: { min: -0.5, max: 0.5 },
            eros: { min: 0.5, max: 1.0 },
            weird: { min: -0.3, max: 0.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "petrified_thickwoods",
        name: "Petrified Thickwoods",
        color: "#4e342e",
        description: "An ancient, dense wood where every trunk has hardened into solid stone.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.0, max: 0.5 },
            hum: { min: 0.0, max: 0.5 },
            cont: { min: -0.5, max: 0.5 },
            eros: { min: -0.2, max: 0.2 },
            weird: { min: 0.3, max: 0.6 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "fossilized_core",
        name: "Fossilized Core",
        color: "#37474f",
        description: "The deep, dense center of fossilized relics, containing highly valuable petrified materials.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.245, max: 1.255 },
            hum: { min: 0.245, max: 1.255 },
            cont: { min: 0.045, max: 1.055 },
            eros: { min: -0.6038, max: 0.2038 },
            weird: { min: 0.3962, max: 1.2038 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "ashen_barrens",
        name: "Ashen Barrens",
        color: "#78909c",
        description: "Scorched ash fields covered in volcanic dust and high-temperature fossil geysers.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.7, max: 0.3 },
            hum: { min: -0.7, max: 0.3 },
            cont: { min: -0.5, max: 0.5 },
            eros: { min: 0.3, max: 0.7 },
            weird: { min: 0.35, max: 0.67 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      }
    ]
  },
  {
    id: "backwoods",
    name: "The Backwoods",
    description: "The dark, dense primal layers of ancient towering trunks and overgrown thickets.",
    defaultFixed: { temp: 0.0, hum: 0.2, cont: 0.5, eros: -0.3, weird: 0.5, depth: 0.0 },
    biomes: [
      {
        id: "wood_plains",
        name: "Wood Plains",
        color: "#a1887f",
        description: "An expansive woodbound plain with sparse vegetation and clear wood horizons.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.1, max: 0.5 },
            hum: { min: -0.3, max: 0.5 },
            cont: { min: 0.2, max: 1.0 },
            eros: { min: -1.0, max: -0.4 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "deep_backwoods",
        name: "Deep Backwoods",
        color: "#3e2723",
        description: "Dark, ancient woodland featuring colossal towering trunks and thick moss overlays.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.2, max: 0.2 },
            hum: { min: -0.1, max: 0.3 },
            cont: { min: 0.4, max: 0.8 },
            eros: { min: 0.0, max: 0.3 },
            weird: { min: 0.6, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "the_thicket",
        name: "The Thicket",
        color: "#2e7d32",
        description: "A tangled, chaotic web of low-hanging branches, thorns, and dense brushwood.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.1, max: 0.1 },
            hum: { min: -0.1, max: 0.8 },
            cont: { min: 0.2, max: 1.0 },
            eros: { min: -0.7, max: 0.0 },
            weird: { min: 0.3, max: 0.7 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      }
    ]
  },
  {
    id: "the_familiar",
    name: "The Familiar",
    description: "A surreal mirror world, replicating Overworld structures and biomes with glass-like materials.",
    defaultFixed: { temp: 0.3, hum: 0.0, cont: -0.4, eros: 0.0, weird: -0.2, depth: 0.0 },
    biomes: [
      {
        id: "mirrored_plains",
        name: "Mirrored Plains",
        color: "#eceff1",
        description: "A flat, reflective prairie mimicking the Overworld but with a haunting, pale sky.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.1, max: 1.0 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -1.0, max: -0.2 },
            eros: { min: -0.35, max: 0.25 },
            weird: { min: -0.5, max: 0.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "mirrored_forest",
        name: "Mirrored Forest",
        color: "#78909c",
        description: "A dense forest of glass-like leaves and hollow trunks, mirroring standard trees.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.1, max: 0.5 },
            hum: { min: 0.2, max: 0.7 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.5, max: 0.5 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "mirrored_birch_forest",
        name: "Mirrored Birch Forest",
        color: "#cfd8dc",
        description: "A bright, high-contrast birch grove with white and black bark and glowing canopies.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.0, max: 0.4 },
            hum: { min: 0.4, max: 0.9 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.5, max: 0.5 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "mirrored_desert",
        name: "Mirrored Desert",
        color: "#ffe082",
        description: "A vast desert of crystalline sand dunes and shimmering, fossilized cacti.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.7, max: 1.0 },
            hum: { min: -1.0, max: -0.6 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.5, max: 0.5 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "mirrored_savannah",
        name: "Mirrored Savannah",
        color: "#ffcc80",
        description: "Dry, flat acacia plains under an amber sun, mirroring the Overworld savannah.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.5, max: 1.0 },
            hum: { min: -0.5, max: 0.0 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.5, max: 0.5 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "mirrored_jungle",
        name: "Mirrored Jungle",
        color: "#81c784",
        description: "An overgrown jungle of gargantuan scale with hanging vines and ancient ruins.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.6, max: 1.0 },
            hum: { min: 0.5, max: 1.0 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.7, max: 0.5 },
            weird: { min: -1.0, max: 0.8 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "mirrored_ocean",
        name: "Mirrored Ocean",
        color: "#4fc3f7",
        description: "A deep, glass-clear body of water hosting bioluminescent woodbound reefs.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.4, max: -0.1 },
            hum: { min: -0.5, max: 0.5 },
            cont: { min: -1.0, max: -0.2 },
            eros: { min: -0.5, max: 0.5 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "mirrored_taiga",
        name: "Mirrored Taiga",
        color: "#90a4ae",
        description: "Chilly, pine-scented woods covered in cold, reflecting frosted needles.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -1.0, max: -0.5 },
            hum: { min: -0.3, max: 0.3 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.1, max: 0.4 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      }
    ]
  },
  {
    id: "rotting",
    name: "Rotting",
    description: "A damp, dark subterranean dimension composed of ancient rotten wood and decayed soils.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0, depth: 0.0 },
    biomes: [
      {
        id: "rotting_deep",
        name: "Rotting Deep",
        color: "#1a237e",
        description: "The singular, heavy decayed wood forest. It dominates the entire dimension's surface.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.5, max: 0.5 },
            hum: { min: -0.5, max: 0.5 },
            cont: { min: -0.0001, max: 0.0 },
            eros: { min: 0.8, max: 1.0 },
            weird: { min: -0.0001, max: 0.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      }
    ]
  },
  {
    id: "the_still",
    name: "The Still",
    description: "A frozen moment in spacetime where winds are completely silent and trees never sway.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0, depth: 0.0 },
    biomes: [
      {
        id: "still",
        name: "Still",
        color: "#311b92",
        description: "An absolute static biome where sounds are dampened and light stands still.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.5, max: 0.5 },
            hum: { min: -0.5, max: 0.5 },
            cont: { min: -0.0001, max: 0.0 },
            eros: { min: 0.8, max: 1.0 },
            weird: { min: -0.0001, max: 0.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      }
    ]
  },
  {
    id: "the_sub_strata",
    name: "The Sub Strata",
    description: "The deep rocky mantle layer far beneath the wood, consisting of petrified bedrock.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0, depth: 0.0 },
    biomes: [
      {
        id: "the_dead_grain",
        name: "The Dead Grain",
        color: "#212121",
        description: "Shattered rock veins and lifeless petrified dust blockages deep underground.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: 0.0, max: 0.5 },
            hum: { min: 0.0, max: 0.5 },
            cont: { min: 0.3, max: 0.5 },
            eros: { min: 0.8, max: 1.0 },
            weird: { min: -0.1, max: 0.1 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      }
    ]
  },
  {
    id: "loss",
    name: "Loss",
    description: "The corrupted edge of reality where coordinate values fall into void anomalies and nullstone.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0, depth: 0.0 },
    biomes: [
      {
        id: "confusion",
        name: "Confusion",
        color: "#d50000",
        description: "An unpredictable, shifting rift biome where gravity and light behave erratically.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.5, max: -0.2 },
            hum: { min: 0.7, max: 1.0 },
            cont: { min: -0.2, max: 0.3 },
            eros: { min: 0.7, max: 1.0 },
            weird: { min: -1.0, max: -0.5 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      }
    ]
  }
];

export const VANILLA_DIMENSIONS: DimensionDefinition[] = [
  {
    id: "overworld",
    name: "Overworld",
    description: "The primary terrestrial dimension, featuring a vast and complex 3D multi-noise climate distribution with 53 distinct biomes.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0, depth: 0.0 },
    biomes: [
      {
        id: "plains",
        name: "Plains",
        color: "#8db360",
        description: "A flat, grassy biome with sparse trees. Very common in neutral-to-dry climates with flat erosion.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.15, max: 0.2 },
            hum: { min: -0.35, max: 0.1 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: 0.05, max: 0.55 },
            weird: { min: -1.0, max: 0.1667 },
            depth: { min: -0.1, max: 0.5 }
          },
          {
            temp: { min: 0.0, max: 0.35 },
            hum: { min: -0.1, max: 0.2 },
            cont: { min: 0.03, max: 0.3 },
            eros: { min: 0.05, max: 0.45 },
            weird: { min: -0.5, max: 0.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "sunflower_plains",
        name: "Sunflower Plains",
        color: "#b5db88",
        description: "A variation of plains completely blanketed with beautiful yellow sunflowers. Generates at high weirdness values.",
        baseRarity: 0.15,
        points: [
          {
            temp: { min: -0.15, max: 0.2 },
            hum: { min: -0.35, max: 0.1 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: 0.05, max: 0.45 },
            weird: { min: 0.1667, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "snowy_plains",
        name: "Snowy Plains",
        color: "#fafafc",
        description: "A vast, frozen, snow-covered plain. Formerly known as Snowy Tundra.",
        baseRarity: 0.45,
        points: [
          {
            temp: { min: -1.0, max: -0.45 },
            hum: { min: -0.35, max: 0.1 },
            cont: { min: -0.11, max: 1.0 },
            eros: { min: 0.05, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "ice_spikes",
        name: "Ice Spikes",
        color: "#b4dcdc",
        description: "A rare, stunning snowy plain featuring colossal packed ice spires shooting into the sky.",
        baseRarity: 0.015,
        points: [
          {
            temp: { min: -1.0, max: -0.6 },
            hum: { min: -0.5, max: -0.1 },
            cont: { min: 0.2, max: 0.8 },
            eros: { min: 0.05, max: 0.45 },
            weird: { min: 0.5, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "desert",
        name: "Desert",
        color: "#fae97d",
        description: "An arid, sand-covered wasteland with cacti, dead bushes, and desert temples. Very hot and dry.",
        baseRarity: 0.6,
        points: [
          {
            temp: { min: 0.55, max: 1.0 },
            hum: { min: -1.0, max: -0.35 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          },
          {
            temp: { min: 0.7, max: 1.0 },
            hum: { min: -0.8, max: -0.4 },
            cont: { min: 0.1, max: 0.9 },
            eros: { min: 0.05, max: 0.55 },
            weird: { min: -0.2, max: 0.6 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "swamp",
        name: "Swamp",
        color: "#07f9b2",
        description: "A wet, muddy, dark biome with giant lily pads, shallow water, clay, and blue orchids. Home to witches.",
        baseRarity: 0.35,
        points: [
          {
            temp: { min: 0.2, max: 0.55 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: -0.19, max: 0.3 },
            eros: { min: 0.45, max: 0.55 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.3 }
          }
        ]
      },
      {
        id: "mangrove_swamp",
        name: "Mangrove Swamp",
        color: "#2c402e",
        description: "A tropical, dense swamp variant consisting of massive muddy mangrove trees and warm, shallow waters.",
        baseRarity: 0.18,
        points: [
          {
            temp: { min: 0.55, max: 1.0 },
            hum: { min: 0.35, max: 1.0 },
            cont: { min: -0.19, max: 0.3 },
            eros: { min: 0.45, max: 0.55 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.3 }
          }
        ]
      },
      {
        id: "forest",
        name: "Forest",
        color: "#056633",
        description: "A common woodland with abundant oak and birch trees. Generates in temperate, slightly humid regions.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.15, max: 0.2 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 0.1667 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "flower_forest",
        name: "Flower Forest",
        color: "#2dba74",
        description: "A forest featuring a dense, colorful carpet of all common flowers. Placed at high weirdness values.",
        baseRarity: 0.15,
        points: [
          {
            temp: { min: -0.15, max: 0.2 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: 0.1667, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "birch_forest",
        name: "Birch Forest",
        color: "#307444",
        description: "A tranquil forest consisting exclusively of white-barked birch trees. Cool and slightly humid.",
        baseRarity: 0.65,
        points: [
          {
            temp: { min: -0.45, max: -0.15 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 0.1667 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "old_growth_birch_forest",
        name: "Old Growth Birch Forest",
        color: "#5f9b73",
        description: "A birch forest containing taller, wider birch trunks. Placed in similar climates at higher weirdness.",
        baseRarity: 0.15,
        points: [
          {
            temp: { min: -0.45, max: -0.15 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: 0.1667, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "dark_forest",
        name: "Dark Forest",
        color: "#40511a",
        description: "An incredibly thick forest with a canopy so dense it allows monsters to spawn during the day. Home to Woodland Mansions.",
        baseRarity: 0.25,
        points: [
          {
            temp: { min: -0.15, max: 0.25 },
            hum: { min: 0.35, max: 1.0 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: 0.1667, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "taiga",
        name: "Taiga",
        color: "#054533",
        description: "A chilly coniferous forest dominated by spruce trees and fern ground cover. Wolves spawn here.",
        baseRarity: 0.8,
        points: [
          {
            temp: { min: -0.45, max: -0.15 },
            hum: { min: -0.1, max: 0.1 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 0.1667 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "snowy_taiga",
        name: "Snowy Taiga",
        color: "#e0f0e0",
        description: "A freezing spruce forest heavily laden with snow blocks and ice. Home to arctic foxes.",
        baseRarity: 0.3,
        points: [
          {
            temp: { min: -1.0, max: -0.45 },
            hum: { min: -0.1, max: 0.1 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "old_growth_pine_taiga",
        name: "Old Growth Pine Taiga",
        color: "#596b42",
        description: "A giant taiga containing massive redwood pine trees and podzol forest floors.",
        baseRarity: 0.2,
        points: [
          {
            temp: { min: -0.45, max: -0.15 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "old_growth_spruce_taiga",
        name: "Old Growth Spruce Taiga",
        color: "#4e5e34",
        description: "A giant taiga where spruce trees grow to monumental heights. Placed in slightly drier old-growth regions.",
        baseRarity: 0.2,
        points: [
          {
            temp: { min: -0.45, max: -0.15 },
            hum: { min: -0.1, max: 0.1 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "jungle",
        name: "Jungle",
        color: "#537b09",
        description: "A tropical, humid rainforest with colossal 2x2 trees, cocoa beans, leopards/ocelots, and parrots.",
        baseRarity: 0.22,
        points: [
          {
            temp: { min: 0.55, max: 1.0 },
            hum: { min: 0.35, max: 1.0 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 0.1667 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "sparse_jungle",
        name: "Sparse Jungle",
        color: "#628b19",
        description: "The jungle's edge biome, featuring smaller and more widely dispersed trees.",
        baseRarity: 0.18,
        points: [
          {
            temp: { min: 0.55, max: 1.0 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "bamboo_jungle",
        name: "Bamboo Jungle",
        color: "#76a61e",
        description: "A dense tropical jungle dominated by towering green stalks of bamboo. Home to pandas.",
        baseRarity: 0.12,
        points: [
          {
            temp: { min: 0.55, max: 1.0 },
            hum: { min: 0.35, max: 1.0 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: 0.1667, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "savanna",
        name: "Savanna",
        color: "#bdb25c",
        description: "A warm, dry grassland with flat-canopied acacia trees. Outposts and villages spawn here.",
        baseRarity: 0.7,
        points: [
          {
            temp: { min: 0.2, max: 0.55 },
            hum: { min: -0.35, max: -0.1 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 0.1667 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "savanna_plateau",
        name: "Savanna Plateau",
        color: "#a79c4c",
        description: "A flat-topped savanna hill terminating in high plateaus with sheer vertical cliffs.",
        baseRarity: 0.3,
        points: [
          {
            temp: { min: 0.2, max: 0.55 },
            hum: { min: -0.35, max: -0.1 },
            cont: { min: -0.11, max: 0.55 },
            eros: { min: 0.45, max: 0.55 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "windswept_savanna",
        name: "Windswept Savanna",
        color: "#c7b55c",
        description: "A heavily eroded, chaotic savanna featuring sky-scaling rock arches and floating islands.",
        baseRarity: 0.08,
        points: [
          {
            temp: { min: 0.2, max: 0.55 },
            hum: { min: -0.35, max: -0.1 },
            cont: { min: 0.03, max: 0.55 },
            eros: { min: -0.78, max: -0.2225 },
            weird: { min: 0.1667, max: 1.0 },
            depth: { min: 0.1, max: 0.8 }
          }
        ]
      },
      {
        id: "windswept_hills",
        name: "Windswept Hills",
        color: "#597d72",
        description: "High, grassy slopes with dramatic cliffs, spruce/oak trees, and llamas. Formerly Extreme Hills.",
        baseRarity: 0.4,
        points: [
          {
            temp: { min: -0.15, max: 0.15 },
            hum: { min: -0.35, max: 0.35 },
            cont: { min: 0.03, max: 0.55 },
            eros: { min: -0.78, max: -0.2225 },
            weird: { min: -1.0, max: 0.1667 },
            depth: { min: 0.1, max: 0.8 }
          }
        ]
      },
      {
        id: "windswept_gravelly_hills",
        name: "Windswept Gravelly Hills",
        color: "#728a80",
        description: "A windswept hill composed almost entirely of gravel and bare stone. Extremely sparse vegetation.",
        baseRarity: 0.15,
        points: [
          {
            temp: { min: -0.15, max: 0.15 },
            hum: { min: -0.35, max: 0.35 },
            cont: { min: 0.03, max: 0.55 },
            eros: { min: -0.78, max: -0.2225 },
            weird: { min: 0.1667, max: 1.0 },
            depth: { min: 0.1, max: 0.8 }
          }
        ]
      },
      {
        id: "windswept_forest",
        name: "Windswept Forest",
        color: "#3d6458",
        description: "A mountainous, windswept hill densely dotted with gnarled oak and spruce trees.",
        baseRarity: 0.2,
        points: [
          {
            temp: { min: -0.15, max: 0.15 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: 0.03, max: 0.55 },
            eros: { min: -0.78, max: -0.2225 },
            weird: { min: 0.1667, max: 1.0 },
            depth: { min: 0.1, max: 0.8 }
          }
        ]
      },
      {
        id: "badlands",
        name: "Badlands",
        color: "#d94515",
        description: "A dry canyon biome of multi-colored terracotta layers. Gold ore generates abundantly here.",
        baseRarity: 0.25,
        points: [
          {
            temp: { min: 0.55, max: 1.0 },
            hum: { min: -1.0, max: -0.35 },
            cont: { min: 0.03, max: 0.55 },
            eros: { min: -0.2225, max: 0.45 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "wooded_badlands",
        name: "Wooded Badlands",
        color: "#b0501a",
        description: "A high badlands plateau decorated with oak trees and sparse grass cover.",
        baseRarity: 0.18,
        points: [
          {
            temp: { min: 0.55, max: 1.0 },
            hum: { min: -1.0, max: -0.35 },
            cont: { min: 0.03, max: 0.55 },
            eros: { min: 0.45, max: 0.55 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "eroded_badlands",
        name: "Eroded Badlands",
        color: "#ff6a3c",
        description: "A breathtaking badlands subset featuring towering spires of multi-layered terracotta.",
        baseRarity: 0.04,
        points: [
          {
            temp: { min: 0.55, max: 1.0 },
            hum: { min: -1.0, max: -0.35 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.78, max: -0.375 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.5 }
          }
        ]
      },
      {
        id: "meadow",
        name: "Meadow",
        color: "#7cb155",
        description: "A gorgeous, high-altitude grassy shelf filled with colorful flowers and sweet-berry bushes.",
        baseRarity: 0.22,
        points: [
          {
            temp: { min: -0.15, max: 0.2 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: 0.03, max: 0.55 },
            eros: { min: -0.78, max: -0.2225 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: 0.6, max: 1.5 }
          }
        ]
      },
      {
        id: "grove",
        name: "Grove",
        color: "#7a9a85",
        description: "A high-altitude forest of snow-laden spruce trees. Chilly and tranquil.",
        baseRarity: 0.18,
        points: [
          {
            temp: { min: -0.45, max: -0.15 },
            hum: { min: 0.1, max: 0.35 },
            cont: { min: 0.03, max: 0.55 },
            eros: { min: -0.78, max: -0.2225 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: 0.6, max: 1.5 }
          }
        ]
      },
      {
        id: "snowy_slopes",
        name: "Snowy Slopes",
        color: "#ffffff",
        description: "A bare mountain slope blanketed in deep powder snow and solid ice. Home to goats.",
        baseRarity: 0.2,
        points: [
          {
            temp: { min: -1.0, max: -0.45 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: 0.03, max: 1.0 },
            eros: { min: -0.78, max: -0.2225 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: 0.6, max: 1.5 }
          }
        ]
      },
      {
        id: "jagged_peaks",
        name: "Jagged Peaks",
        color: "#d0d8ec",
        description: "An incredibly steep, sharp mountain peak completely covered in snow and stone layers.",
        baseRarity: 0.08,
        points: [
          {
            temp: { min: -1.0, max: -0.45 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -1.0, max: -0.78 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: 1.2, max: 2.5 }
          }
        ]
      },
      {
        id: "frozen_peaks",
        name: "Frozen Peaks",
        color: "#b0ccf0",
        description: "An icy mountain peak completely covered in glaciers and packed ice. Generated in very cold ranges.",
        baseRarity: 0.06,
        points: [
          {
            temp: { min: -1.0, max: -0.6 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -1.0, max: -0.78 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: 1.2, max: 2.5 }
          }
        ]
      },
      {
        id: "stony_peaks",
        name: "Stony Peaks",
        color: "#969696",
        description: "A mountain peak dominated purely by bare stone and gravel. Generates in warm and desert-adjacent climates.",
        baseRarity: 0.06,
        points: [
          {
            temp: { min: 0.2, max: 1.0 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -1.0, max: -0.78 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: 1.2, max: 2.5 }
          }
        ]
      },
      {
        id: "cherry_grove",
        name: "Cherry Grove",
        color: "#ffb7c5",
        description: "A rare, beautiful mountain slope blanketed with pink cherry blossom trees, petals, and unique pink carpet. Placed at very high humidity.",
        baseRarity: 0.05,
        points: [
          {
            temp: { min: -0.15, max: 0.35 },
            hum: { min: 0.35, max: 1.0 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -0.78, max: -0.2225 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: 0.6, max: 1.5 }
          }
        ]
      },
      {
        id: "ocean",
        name: "Ocean",
        color: "#000080",
        description: "A wide ocean body of deep water. Generates at negative continentalness ranges.",
        baseRarity: 1.2,
        points: [
          {
            temp: { min: -0.15, max: 0.2 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -0.455, max: -0.19 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: -0.1 }
          }
        ]
      },
      {
        id: "deep_ocean",
        name: "Deep Ocean",
        color: "#000040",
        description: "A very deep marine environment stretching across vast negative continentalness values.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.15, max: 0.2 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -1.2, max: -0.455 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.5, max: -0.5 }
          }
        ]
      },
      {
        id: "warm_ocean",
        name: "Warm Ocean",
        color: "#0020ff",
        description: "A warm, clear ocean hosting colorful coral reefs, tropical fish, and sea pickles.",
        baseRarity: 0.25,
        points: [
          {
            temp: { min: 0.55, max: 1.0 },
            hum: { min: -0.35, max: 1.0 },
            cont: { min: -0.455, max: -0.19 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: -0.1 }
          }
        ]
      },
      {
        id: "lukewarm_ocean",
        name: "Lukewarm Ocean",
        color: "#0040ff",
        description: "A slightly warm ocean with deep-blue water color and standard marine plants.",
        baseRarity: 0.5,
        points: [
          {
            temp: { min: 0.2, max: 0.55 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -0.455, max: -0.19 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: -0.1 }
          }
        ]
      },
      {
        id: "deep_lukewarm_ocean",
        name: "Deep Lukewarm Ocean",
        color: "#0020c0",
        description: "A deep, warm ocean variant stretching far into the deep seabed.",
        baseRarity: 0.35,
        points: [
          {
            temp: { min: 0.2, max: 0.55 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -1.2, max: -0.455 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.5, max: -0.5 }
          }
        ]
      },
      {
        id: "cold_ocean",
        name: "Cold Ocean",
        color: "#2040c0",
        description: "A cold ocean body with deep dark-blue/grey waters. Salmon and cod spawn here.",
        baseRarity: 0.45,
        points: [
          {
            temp: { min: -0.45, max: -0.15 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -0.455, max: -0.19 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: -0.1 }
          }
        ]
      },
      {
        id: "deep_cold_ocean",
        name: "Deep Cold Ocean",
        color: "#102080",
        description: "A chilling deep ocean environment with massive underwater ravines.",
        baseRarity: 0.35,
        points: [
          {
            temp: { min: -0.45, max: -0.15 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -1.2, max: -0.455 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.5, max: -0.5 }
          }
        ]
      },
      {
        id: "frozen_ocean",
        name: "Frozen Ocean",
        color: "#70a0ff",
        description: "A frozen ocean covered in sheets of ice blocks and floating icebergs. Polar bears spawn here.",
        baseRarity: 0.2,
        points: [
          {
            temp: { min: -1.0, max: -0.45 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -0.455, max: -0.19 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: -0.1 }
          }
        ]
      },
      {
        id: "deep_frozen_ocean",
        name: "Deep Frozen Ocean",
        color: "#4060c0",
        description: "A deep freezing marine environment containing magnificent underwater ice glaciers.",
        baseRarity: 0.15,
        points: [
          {
            temp: { min: -1.0, max: -0.45 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -1.2, max: -0.455 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.5, max: -0.5 }
          }
        ]
      },
      {
        id: "beach",
        name: "Beach",
        color: "#f0e0a0",
        description: "A warm sand-covered shoreline separating ocean from terrestrial biomes.",
        baseRarity: 0.5,
        points: [
          {
            temp: { min: -0.15, max: 0.8 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -0.19, max: -0.11 },
            eros: { min: -0.2225, max: 0.55 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.2 }
          }
        ]
      },
      {
        id: "snowy_beach",
        name: "Snowy Beach",
        color: "#faf0e0",
        description: "A freezing beach shoreline covered in thick snow blocks. Chilly and bare.",
        baseRarity: 0.15,
        points: [
          {
            temp: { min: -1.0, max: -0.45 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -0.19, max: -0.11 },
            eros: { min: -0.2225, max: 0.55 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.2 }
          }
        ]
      },
      {
        id: "stony_shore",
        name: "Stony Shore",
        color: "#808080",
        description: "A cliff shoreline composed purely of stone and boulders. Formerly known as Stone Beach.",
        baseRarity: 0.2,
        points: [
          {
            temp: { min: -0.45, max: 0.1 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -0.19, max: -0.11 },
            eros: { min: -0.78, max: -0.2225 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.1, max: 0.2 }
          }
        ]
      },
      {
        id: "mushroom_fields",
        name: "Mushroom Fields",
        color: "#ff00ff",
        description: "An incredibly rare, isolated island biome composed of mycelium and red/brown giant mushrooms. Hostile mobs never spawn naturally here.",
        baseRarity: 0.005,
        points: [
          {
            temp: { min: 0.1, max: 0.3 },
            hum: { min: 0.35, max: 0.7 },
            cont: { min: -1.2, max: -1.05 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: 0.5, max: 1.0 },
            depth: { min: 0.0, max: 0.8 }
          }
        ]
      },
      {
        id: "river",
        name: "River",
        color: "#007fff",
        description: "A winding freshwater channel slicing through the overworld terrain. Clay, sugar canes, and fish generate here.",
        baseRarity: 0.6,
        points: [
          {
            temp: { min: -0.15, max: 0.8 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -0.19, max: 0.55 },
            eros: { min: 0.55, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.2, max: 0.0 }
          }
        ]
      },
      {
        id: "frozen_river",
        name: "Frozen River",
        color: "#a0c0ff",
        description: "A freezing river channel covered in standard solid ice. Generated in very cold regions.",
        baseRarity: 0.2,
        points: [
          {
            temp: { min: -1.0, max: -0.45 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -0.19, max: 0.55 },
            eros: { min: 0.55, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -0.2, max: 0.0 }
          }
        ]
      },
      {
        id: "lush_caves",
        name: "Lush Caves",
        color: "#12bb0e",
        description: "An underground oasis biome, boasting clay shelves covered in drip-leaves, moss, glow-berries, and spawning cute axolotls.",
        baseRarity: 0.15,
        points: [
          {
            temp: { min: 0.1, max: 0.6 },
            hum: { min: 0.1, max: 1.0 },
            cont: { min: -1.0, max: 1.0 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.2, max: -0.4 }
          }
        ]
      },
      {
        id: "dripstone_caves",
        name: "Dripstone Caves",
        color: "#a57d3a",
        description: "An underground cavern covered in dripstone blocks, pointed stalactites, and hanging stalagmites.",
        baseRarity: 0.15,
        points: [
          {
            temp: { min: -0.2, max: 0.5 },
            hum: { min: -1.0, max: -0.1 },
            cont: { min: -1.0, max: 1.0 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.2, max: -0.4 }
          }
        ]
      },
      {
        id: "deep_dark",
        name: "Deep Dark",
        color: "#0a1321",
        description: "An extremely deep subterranean biome blanketed in sculk growths, sensors, and shrieker nodes. Home of the terrifying Warden.",
        baseRarity: 0.05,
        points: [
          {
            temp: { min: -1.0, max: 1.0 },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: 0.3, max: 1.0 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -2.0, max: -0.8 }
          }
        ]
      }
    ]
  },
  {
    id: "nether",
    name: "Nether",
    description: "The underworld dimension, featuring active lava lakes, basalt ruins, and unique fungi biomes placed on temperature and humidity coordinate systems.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0, depth: 0.0 },
    biomes: [
      {
        id: "nether_wastes",
        name: "Nether Wastes",
        color: "#8b2222",
        description: "The traditional crimson underworld landscape. Highly volcanic, covered in netherrack and quartz veins.",
        baseRarity: 1.0,
        points: [
          {
            temp: { min: -0.2, max: 0.2 },
            hum: { min: -0.2, max: 0.2 },
            cont: { min: -1.0, max: 1.0 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "soul_sand_valley",
        name: "Soul Sand Valley",
        color: "#4e382c",
        description: "A chilling valley composed of slow-sinking soul sand and soul soil. Littered with fossilized skeletons.",
        baseRarity: 0.45,
        points: [
          {
            temp: { min: -1.0, max: -0.2 },
            hum: { min: -1.0, max: -0.2 },
            cont: { min: -1.0, max: 1.0 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "crimson_forest",
        name: "Crimson Forest",
        color: "#990000",
        description: "A dense biome of blood-red fungi growing on nether wart blocks. Spawns piglins and hoglins.",
        baseRarity: 0.55,
        points: [
          {
            temp: { min: 0.2, max: 1.0 },
            hum: { min: -0.6, max: 0.2 },
            cont: { min: -1.0, max: 1.0 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "warped_forest",
        name: "Warped Forest",
        color: "#17a2b8",
        description: "A mesmerizing, safe biome composed of glowing cyan-colored fungi. Home of endermen in the Nether.",
        baseRarity: 0.5,
        points: [
          {
            temp: { min: -1.0, max: -0.2 },
            hum: { min: 0.2, max: 1.0 },
            cont: { min: -1.0, max: 1.0 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      },
      {
        id: "basalt_deltas",
        name: "Basalt Deltas",
        color: "#4a4a5a",
        description: "A soot-covered waste consisting of high pillars of basalt, blackstone, and active lava geysers.",
        baseRarity: 0.4,
        points: [
          {
            temp: { min: 0.2, max: 1.0 },
            hum: { min: -1.0, max: -0.6 },
            cont: { min: -1.0, max: 1.0 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 },
            depth: { min: -1.0, max: 1.0 }
          }
        ]
      }
    ]
  }
];
