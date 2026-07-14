import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { 
  Sliders, 
  Map, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Compass, 
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  Globe,
  ZoomIn,
  ZoomOut,
  Move,
  MapPin,
  ChevronLeft,
  ChevronUp,
  ChevronDown
} from "lucide-react";

// Types for Biome parameters
interface BiomeRange {
  min: number;
  max: number;
}

interface Biome {
  id: string;
  name: string;
  color: string;
  temp: BiomeRange;
  hum: BiomeRange;
  cont: BiomeRange;
  eros: BiomeRange;
  weird: BiomeRange;
  description: string;
}

interface DimensionDefinition {
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
  };
}

const DIMENSIONS: DimensionDefinition[] = [
  {
    id: "the_grain",
    name: "The Grain",
    description: "Vast, woodbound world of colossal arches, high tension nests, and hidden grids.",
    defaultFixed: { temp: 0.2, hum: 0.0, cont: 0.85, eros: 0.0, weird: 0.5 },
    biomes: [
      {
        id: "uniform_grain",
        name: "Uniform Grain",
        color: "#d7ccc8",
        temp: { min: -0.5, max: 0.5 },
        hum: { min: -0.3, max: 0.5 },
        cont: { min: -1.0, max: 0.2 },
        eros: { min: -1.0, max: 0.2 },
        weird: { min: -1.0, max: -0.3 },
        description: "The primary base biome. Vast flat grains of wood and standard woodbound structures."
      },
      {
        id: "stillwood",
        name: "Stillwood",
        color: "#5d4037",
        temp: { min: 0.1, max: 1.0 },
        hum: { min: 0.2, max: 0.8 },
        cont: { min: 0.5, max: 1.0 },
        eros: { min: -0.7, max: 0.3 },
        weird: { min: 0.2, max: 0.7 },
        description: "A moderately common, dense and quiet forest biome with tall oak arches."
      },
      {
        id: "splinter_nest",
        name: "Splinter Nest",
        color: "#ff7043",
        temp: { min: 0.0083, max: 0.7917 },
        hum: { min: -0.8358, max: 0.5358 },
        cont: { min: 0.7041, max: 1.0959 },
        eros: { min: -0.5395, max: 0.4395 },
        weird: { min: 0.778, max: 1.072 },
        description: "An extremely hostile nest of woodbound entities. High tension and dangerous traps."
      },
      {
        id: "labyrinthine_grids",
        name: "Labyrinthine Grids",
        color: "#00796b",
        temp: { min: -0.2, max: 0.2 },
        hum: { min: 0.6, max: 1.0 },
        cont: { min: 0.0, max: 0.5 },
        eros: { min: 0.8, max: 1.0 },
        weird: { min: 0.4, max: 0.6 },
        description: "A grid-locked maze of high walls, mist, and cardinal-bound Lignum Palus stalks."
      },
      {
        id: "fractured_barrens",
        name: "Fractured Barrens",
        color: "#c2185b",
        temp: { min: 0.7, max: 0.9 },
        hum: { min: -1.0, max: -0.6 },
        cont: { min: 0.3, max: 0.5 },
        eros: { min: -0.1, max: 0.1 },
        weird: { min: -0.3, max: -0.1 },
        description: "Dry, scorched barrens featuring vertical fissures and mechanical sentinel remnants."
      },
      {
        id: "pillar_thicket",
        name: "Pillar Thicket",
        color: "#ffd54f",
        temp: { min: 0.0, max: 0.1 },
        hum: { min: -0.1, max: 0.1 },
        cont: { min: 0.85, max: 0.95 },
        eros: { min: 0.6, max: 0.8 },
        weird: { min: -0.6, max: -0.4 },
        description: "A near-mythical, highly claustrophobic grove of massive pillar blockages."
      }
    ]
  },
  {
    id: "the_petrified_weald",
    name: "The Petrified Weald",
    description: "An ancient, silent land where vegetation and the ground itself have hardened into stone.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.3, weird: 0.4 },
    biomes: [
      {
        id: "weald_outskirts",
        name: "Weald Outskirts",
        color: "#8d6e63",
        temp: { min: -0.5, max: 0.0 },
        hum: { min: -0.5, max: 0.0 },
        cont: { min: -0.5, max: 0.5 },
        eros: { min: 0.2, max: 0.5 },
        weird: { min: 0.0, max: 0.3 },
        description: "The transition zone into the petrified weald, featuring scattered calcified trees."
      },
      {
        id: "calcified_plains",
        name: "Calcified Plains",
        color: "#b0bec5",
        temp: { min: -1.0, max: -0.5 },
        hum: { min: -0.5, max: -0.1 },
        cont: { min: -0.5, max: 0.5 },
        eros: { min: 0.5, max: 1.0 },
        weird: { min: -0.3, max: 0.0 },
        description: "A pale, dusty field of petrified soil, fossilized remnants, and white chalk-like rocks."
      },
      {
        id: "petrified_thickwoods",
        name: "Petrified Thickwoods",
        color: "#4e342e",
        temp: { min: 0.0, max: 0.5 },
        hum: { min: 0.0, max: 0.5 },
        cont: { min: -0.5, max: 0.5 },
        eros: { min: -0.2, max: 0.2 },
        weird: { min: 0.3, max: 0.6 },
        description: "An ancient, dense wood where every trunk has hardened into solid stone."
      },
      {
        id: "fossilized_core",
        name: "Fossilized Core",
        color: "#37474f",
        temp: { min: 0.245, max: 1.255 },
        hum: { min: 0.245, max: 1.255 },
        cont: { min: 0.045, max: 1.055 },
        eros: { min: -0.6038, max: 0.2038 },
        weird: { min: 0.3962, max: 1.2038 },
        description: "The deep, dense center of fossilized relics, containing highly valuable petrified materials."
      },
      {
        id: "ashen_barrens",
        name: "Ashen Barrens",
        color: "#78909c",
        temp: { min: -0.7, max: 0.3 },
        hum: { min: -0.7, max: 0.3 },
        cont: { min: -0.5, max: 0.5 },
        eros: { min: 0.3, max: 0.7 },
        weird: { min: 0.35, max: 0.67 },
        description: "Scorched ash fields covered in volcanic dust and high-temperature fossil geysers."
      }
    ]
  },
  {
    id: "backwoods",
    name: "The Backwoods",
    description: "The dark, dense primal layers of ancient towering trunks and overgrown thickets.",
    defaultFixed: { temp: 0.0, hum: 0.2, cont: 0.5, eros: -0.3, weird: 0.5 },
    biomes: [
      {
        id: "wood_plains",
        name: "Wood Plains",
        color: "#a1887f",
        temp: { min: -0.1, max: 0.5 },
        hum: { min: -0.3, max: 0.5 },
        cont: { min: 0.2, max: 1.0 },
        eros: { min: -1.0, max: -0.4 },
        weird: { min: -1.0, max: 1.0 },
        description: "An expansive woodbound plain with sparse vegetation and clear wood horizons."
      },
      {
        id: "deep_backwoods",
        name: "Deep Backwoods",
        color: "#3e2723",
        temp: { min: -0.2, max: 0.2 },
        hum: { min: -0.1, max: 0.3 },
        cont: { min: 0.4, max: 0.8 },
        eros: { min: 0.0, max: 0.3 },
        weird: { min: 0.6, max: 1.0 },
        description: "Dark, ancient woodland featuring colossal towering trunks and thick moss overlays."
      },
      {
        id: "the_thicket",
        name: "The Thicket",
        color: "#2e7d32",
        temp: { min: -0.1, max: 0.1 },
        hum: { min: -0.1, max: 0.8 },
        cont: { min: 0.2, max: 1.0 },
        eros: { min: -0.7, max: 0.0 },
        weird: { min: 0.3, max: 0.7 },
        description: "A tangled, chaotic web of low-hanging branches, thorns, and dense brushwood."
      }
    ]
  },
  {
    id: "the_familiar",
    name: "The Familiar",
    description: "A surreal mirror world, replicating Overworld structures and biomes with glass-like materials.",
    defaultFixed: { temp: 0.3, hum: 0.0, cont: -0.4, eros: 0.0, weird: -0.2 },
    biomes: [
      {
        id: "mirrored_plains",
        name: "Mirrored Plains",
        color: "#eceff1",
        temp: { min: -0.1, max: 1.0 },
        hum: { min: -1.0, max: 1.0 },
        cont: { min: -1.0, max: -0.2 },
        eros: { min: -0.35, max: 0.25 },
        weird: { min: -0.5, max: 0.0 },
        description: "A flat, reflective prairie mimicking the Overworld but with a haunting, pale sky."
      },
      {
        id: "mirrored_forest",
        name: "Mirrored Forest",
        color: "#78909c",
        temp: { min: 0.1, max: 0.5 },
        hum: { min: 0.2, max: 0.7 },
        cont: { min: 0.3, max: 1.0 },
        eros: { min: -0.5, max: 0.5 },
        weird: { min: -1.0, max: 1.0 },
        description: "A dense forest of glass-like leaves and hollow trunks, mirroring standard trees."
      },
      {
        id: "mirrored_birch_forest",
        name: "Mirrored Birch Forest",
        color: "#cfd8dc",
        temp: { min: 0.0, max: 0.4 },
        hum: { min: 0.4, max: 0.9 },
        cont: { min: 0.3, max: 1.0 },
        eros: { min: -0.5, max: 0.5 },
        weird: { min: -1.0, max: 1.0 },
        description: "A bright, high-contrast birch grove with white and black bark and glowing canopies."
      },
      {
        id: "mirrored_desert",
        name: "Mirrored Desert",
        color: "#ffe082",
        temp: { min: 0.7, max: 1.0 },
        hum: { min: -1.0, max: -0.6 },
        cont: { min: 0.3, max: 1.0 },
        eros: { min: -0.5, max: 0.5 },
        weird: { min: -1.0, max: 1.0 },
        description: "A vast desert of crystalline sand dunes and shimmering, fossilized cacti."
      },
      {
        id: "mirrored_savannah",
        name: "Mirrored Savannah",
        color: "#ffcc80",
        temp: { min: 0.5, max: 1.0 },
        hum: { min: -0.5, max: 0.0 },
        cont: { min: 0.3, max: 1.0 },
        eros: { min: -0.5, max: 0.5 },
        weird: { min: -1.0, max: 1.0 },
        description: "Dry, flat acacia plains under an amber sun, mirroring the Overworld savannah."
      },
      {
        id: "mirrored_jungle",
        name: "Mirrored Jungle",
        color: "#81c784",
        temp: { min: 0.6, max: 1.0 },
        hum: { min: 0.5, max: 1.0 },
        cont: { min: 0.3, max: 1.0 },
        eros: { min: -0.7, max: 0.5 },
        weird: { min: -1.0, max: 0.8 },
        description: "An overgrown jungle of gargantuan scale with hanging vines and ancient ruins."
      },
      {
        id: "mirrored_ocean",
        name: "Mirrored Ocean",
        color: "#4fc3f7",
        temp: { min: -0.4, max: -0.1 },
        hum: { min: -0.5, max: 0.5 },
        cont: { min: -1.0, max: -0.2 },
        eros: { min: -0.5, max: 0.5 },
        weird: { min: -1.0, max: 1.0 },
        description: "A deep, glass-clear body of water hosting bioluminescent woodbound reefs."
      },
      {
        id: "mirrored_taiga",
        name: "Mirrored Taiga",
        color: "#90a4ae",
        temp: { min: -1.0, max: -0.5 },
        hum: { min: -0.3, max: 0.3 },
        cont: { min: 0.3, max: 1.0 },
        eros: { min: -0.1, max: 0.4 },
        weird: { min: -1.0, max: 1.0 },
        description: "Chilly, pine-scented woods covered in cold, reflecting frosted needles."
      }
    ]
  },
  {
    id: "rotting",
    name: "Rotting",
    description: "A damp, dark subterranean dimension composed of ancient rotten wood and decayed soils.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0 },
    biomes: [
      {
        id: "rotting_deep",
        name: "Rotting Deep",
        color: "#1a237e",
        temp: { min: -0.5, max: 0.5 },
        hum: { min: -0.5, max: 0.5 },
        cont: { min: -0.0001, max: 0.0 },
        eros: { min: 0.8, max: 1.0 },
        weird: { min: -0.0001, max: 0.0 },
        description: "The singular, heavy decayed wood forest. It dominates the entire dimension's surface."
      }
    ]
  },
  {
    id: "the_still",
    name: "The Still",
    description: "A frozen moment in spacetime where winds are completely silent and trees never sway.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0 },
    biomes: [
      {
        id: "still",
        name: "Still",
        color: "#311b92",
        temp: { min: -0.5, max: 0.5 },
        hum: { min: -0.5, max: 0.5 },
        cont: { min: -0.0001, max: 0.0 },
        eros: { min: 0.8, max: 1.0 },
        weird: { min: -0.0001, max: 0.0 },
        description: "An absolute static biome where sounds are dampened and light stands still."
      }
    ]
  },
  {
    id: "the_sub_strata",
    name: "The Sub Strata",
    description: "The deep rocky mantle layer far beneath the wood, consisting of petrified bedrock.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0 },
    biomes: [
      {
        id: "the_dead_grain",
        name: "The Dead Grain",
        color: "#212121",
        temp: { min: 0.0, max: 0.5 },
        hum: { min: 0.0, max: 0.5 },
        cont: { min: 0.3, max: 0.5 },
        eros: { min: 0.8, max: 1.0 },
        weird: { min: -0.1, max: 0.1 },
        description: "Shattered rock veins and lifeless petrified dust blockages deep underground."
      }
    ]
  },
  {
    id: "loss",
    name: "Loss",
    description: "The corrupted edge of reality where coordinate values fall into void anomalies and nullstone.",
    defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0 },
    biomes: [
      {
        id: "confusion",
        name: "Confusion",
        color: "#d50000",
        temp: { min: -0.5, max: -0.2 },
        hum: { min: 0.7, max: 1.0 },
        cont: { min: -0.2, max: 0.3 },
        eros: { min: 0.7, max: 1.0 },
        weird: { min: -1.0, max: -0.5 },
        description: "An unpredictable, shifting rift biome where gravity and light behave erratically."
      }
    ]
  }
];

// Deterministic hash functions for high quality Value Noise
const randomValueNoise = (x: number, y: number, seed: number) => {
  const h = Math.sin(x * 12.9898 + y * 78.233 + seed * 4.3758) * 43758.5453123;
  return h - Math.floor(h);
};

const fadeCurve = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerpInterp = (a: number, b: number, t: number) => a + t * (b - a);

const cellNoise = (x: number, y: number, seed: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const u = fadeCurve(fx);
  const v = fadeCurve(fy);

  const a = randomValueNoise(ix, iy, seed);
  const b = randomValueNoise(ix + 1, iy, seed);
  const c = randomValueNoise(ix, iy + 1, seed);
  const d = randomValueNoise(ix + 1, iy + 1, seed);

  return lerpInterp(lerpInterp(a, b, u), lerpInterp(c, d, u), v);
};

const fbmFractal = (x: number, y: number, octaves: number, seed: number) => {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * cellNoise(x * frequency, y * frequency, seed);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
};

const subtleNoise = (x: number, y: number, s: number) => {
  const sinX = Math.sin(x * 12.9898 + y * 78.233 + s * 43758.5453);
  return (sinX - Math.floor(sinX));
};

const INITIAL_BIOMES = DIMENSIONS[0].biomes;

// A precise numeric input component that handles typing negative signs, decimals, and empty inputs gracefully
function PreciseNumberInput({
  value,
  onChange,
  className = ""
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}) {
  const [tempValue, setTempValue] = useState<string>(value.toString());

  // Sync temp value when the external value changes (e.g. from sliders or presets)
  useEffect(() => {
    // Only update if the parsed value is different from the current input to avoid cursor resetting
    const parsedTemp = parseFloat(tempValue);
    if (isNaN(parsedTemp) || parsedTemp !== value) {
      setTempValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setTempValue(valStr);
    
    // Parse the value
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    // On blur, format to a valid number if invalid
    const parsed = parseFloat(tempValue);
    if (isNaN(parsed)) {
      setTempValue(value.toString());
    } else {
      setTempValue(parsed.toString());
    }
  };

  return (
    <input
      type="text"
      value={tempValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}

export default function App() {
  const [selectedDimensionId, setSelectedDimensionId] = useState<string>("the_grain");
  const [biomes, setBiomes] = useState<Biome[]>(INITIAL_BIOMES);
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>("splinter_nest");
  
  // Custom fixed coordinates for dimensions NOT projected in the 2D map
  const [fixedTemp, setFixedTemp] = useState<number>(0.2);
  const [fixedHum, setFixedHum] = useState<number>(0.0);
  const [fixedCont, setFixedCont] = useState<number>(0.85);
  const [fixedEros, setFixedEros] = useState<number>(0.0);
  const [fixedWeird, setFixedWeird] = useState<number>(0.5);

  // Map settings
  const [xAxisDim, setXAxisDim] = useState<string>("temp");
  const [yAxisDim, setYAxisDim] = useState<string>("hum");
  const [generationAlgorithm, setGenerationAlgorithm] = useState<"euclidean" | "strict">("euclidean");
  const [seedInput, setSeedInput] = useState<string>("42");

  // Derive stable seed mimicking Minecraft/Java's parsing and hashing rules exactly
  const simulationSeed = useMemo(() => {
    const trimmed = seedInput.trim();
    if (!trimmed) return 0;

    // 1. If it's a valid integer, try parsing as a 64-bit long (matching Java's behavior)
    if (/^[+-]?\d+$/.test(trimmed)) {
      try {
        const big = BigInt(trimmed);
        const MIN_LONG = -9223372036854775808n;
        const MAX_LONG = 9223372036854775807n;
        if (big >= MIN_LONG && big <= MAX_LONG) {
          // Inside Java long bounds: use the numeric value (cast safely to standard JS number)
          return Number(big);
        }
      } catch (e) {
        // Fall through to String.hashCode on error
      }
    }

    // 2. Otherwise (non-integers, decimals, or out-of-bounds numbers), compute Java's String.hashCode()
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = ((hash << 5) - hash) + trimmed.charCodeAt(i);
      hash |= 0; // Convert to a 32-bit signed integer
    }
    return hash;
  }, [seedInput]);

  // Chunkbase 2D World Map settings
  const [mapMode, setMapMode] = useState<"slice" | "chunkbase">("slice");
  const [chunkbaseX, setChunkbaseX] = useState<number>(0);
  const [chunkbaseZ, setChunkbaseZ] = useState<number>(0);
  const [chunkbaseZoom, setChunkbaseZoom] = useState<number>(1024); // viewWidth in blocks (256 to 4096)
  const [showOceans, setShowOceans] = useState<boolean>(true);
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Global listener to detect when a slider range is being dragged, allowing for low-res real-time rendering
  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === "range") {
        setIsDraggingSlider(true);
      }
    };
    const handleGlobalMouseUp = () => {
      setIsDraggingSlider(false);
    };
    const handleGlobalTouchStart = (e: TouchEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === "range") {
        setIsDraggingSlider(true);
      }
    };
    const handleGlobalTouchEnd = () => {
      setIsDraggingSlider(false);
    };

    window.addEventListener("mousedown", handleGlobalMouseDown);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchstart", handleGlobalTouchStart, { passive: true });
    window.addEventListener("touchend", handleGlobalTouchEnd);
    return () => {
      window.removeEventListener("mousedown", handleGlobalMouseDown);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchstart", handleGlobalTouchStart);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, []);

  // Hover coordinate state
  const [hoveredCoords, setHoveredCoords] = useState<{
    x: number;
    z: number;
    t: number;
    h: number;
    c: number;
    e: number;
    w: number;
    biomeName: string | null;
    biomeColor: string | null;
    isWater: boolean;
    waterType: string | null;
  } | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; cx: number; cz: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Precompute biome midpoints for faster distance calculations
  const biomesWithMidpoints = useMemo(() => {
    return biomes.map(biome => ({
      ...biome,
      midT: (biome.temp.min + biome.temp.max) / 2,
      midH: (biome.hum.min + biome.hum.max) / 2,
      midC: (biome.cont.min + biome.cont.max) / 2,
      midE: (biome.eros.min + biome.eros.max) / 2,
      midW: (biome.weird.min + biome.weird.max) / 2,
    }));
  }, [biomes]);

  // Helper for computing multi-noise values at coordinates (X, Z)
  const getNoiseAtCoordinates = useCallback((worldX: number, worldZ: number, seed: number) => {
    // Calculate simulated Multi-Noise values for Temperature, Humidity, Continentalness, Erosion, Weirdness using external fbmFractal
    const t = fbmFractal(worldX * 0.0035 + 150.5, worldZ * 0.0035 + 150.5, 3, seed) * 2.0 - 1.0;
    const h = fbmFractal(worldX * 0.0035 - 280.2, worldZ * 0.0035 - 280.2, 3, seed) * 2.0 - 1.0;
    const c = fbmFractal(worldX * 0.0022 + 430.8, worldZ * 0.0022 + 430.8, 4, seed) * 2.0 - 1.0;
    const e = fbmFractal(worldX * 0.0032 - 590.1, worldZ * 0.0032 + 270.4, 3, seed) * 2.0 - 1.0;
    const w = fbmFractal(worldX * 0.0045 + 710.3, worldZ * 0.0045 - 380.2, 3, seed) * 2.0 - 1.0;

    // Fast coordinate-based winding river channel using external cellNoise
    const riverVal = cellNoise(worldX * 0.015 + 10.5, worldZ * 0.015 + 10.5, seed);

    return { t, h, c, e, w, riverVal };
  }, []);

  // Map 5D point to a specific biome with optional water overlay
  const getBiomeAtNoise = useCallback((
    t: number, h: number, c: number, e: number, w: number, riverVal: number,
    localBiomesWithMidpoints: (Biome & { midT: number; midH: number; midC: number; midE: number; midW: number })[],
    localAlgorithm: "strict" | "euclidean"
  ) => {
    let matchingBiome: Biome | null = null;
    let minDistance = Infinity;

    if (localAlgorithm === "strict") {
      for (const biome of localBiomesWithMidpoints) {
        const inTemp = t >= biome.temp.min && t <= biome.temp.max;
        const inHum = h >= biome.hum.min && h <= biome.hum.max;
        const inCont = c >= biome.cont.min && c <= biome.cont.max;
        const inEros = e >= biome.eros.min && e <= biome.eros.max;
        const inWeird = w >= biome.weird.min && w <= biome.weird.max;

        if (inTemp && inHum && inCont && inEros && inWeird) {
          matchingBiome = biome;
          break;
        }
      }
    } else {
      for (const biome of localBiomesWithMidpoints) {
        const dT = t < biome.temp.min ? biome.temp.min - t : (t > biome.temp.max ? t - biome.temp.max : 0);
        const dH = h < biome.hum.min ? biome.hum.min - h : (h > biome.hum.max ? h - biome.hum.max : 0);
        const dC = c < biome.cont.min ? biome.cont.min - c : (c > biome.cont.max ? c - biome.cont.max : 0);
        const dE = e < biome.eros.min ? biome.eros.min - e : (e > biome.eros.max ? e - biome.eros.max : 0);
        const dW = w < biome.weird.min ? biome.weird.min - w : (w > biome.weird.max ? w - biome.weird.max : 0);

        let dist = Math.sqrt(dT*dT + dH*dH + dC*dC + dE*dE + dW*dW);
        if (dist === 0) {
          // If inside the bounds, break tie using distance to midpoint to maintain priority/natural flow
          const midDT = t - biome.midT;
          const midDH = h - biome.midH;
          const midDC = c - biome.midC;
          const midDE = e - biome.midE;
          const midDW = w - biome.midW;
          const midDist = Math.sqrt(midDT*midDT + midDH*midDH + midDC*midDC + midDE*midDE + midDW*midDW);
          dist = midDist * 0.001; // Scale down so it only acts as a tie breaker
        }

        if (dist < minDistance) {
          minDistance = dist;
          matchingBiome = biome;
        }
      }
    }

    // Determine water overlays (Oceans & Rivers) - ONLY for the_familiar dimension
    let isWater = false;
    let waterType: string | null = null;
    let waterColor: string | null = null;

    if (selectedDimensionId === "the_familiar") {
      if (showOceans && c < -0.25) {
        isWater = true;
        if (c < -0.45) {
          waterType = "Deep Ocean";
          waterColor = "#00003f";
        } else {
          waterType = "Shallow Ocean";
          waterColor = "#0a228c";
        }
      } else if (showRivers && Math.abs(riverVal - 0.5) < 0.045 && c > -0.2) {
        isWater = true;
        waterType = "River";
        waterColor = "#002aff";
      }
    }

    return {
      biome: matchingBiome,
      isWater,
      waterType,
      color: isWater ? waterColor! : (matchingBiome ? matchingBiome.color : "#0f0f0f")
    };
  }, [showOceans, showRivers, selectedDimensionId]);

  // Derive selected dimension
  const selectedDimension = useMemo(() => {
    return DIMENSIONS.find(d => d.id === selectedDimensionId) || DIMENSIONS[0];
  }, [selectedDimensionId]);

  // Handle changing the dimension
  const handleDimensionChange = (dimensionId: string) => {
    setSelectedDimensionId(dimensionId);
    const dim = DIMENSIONS.find(d => d.id === dimensionId) || DIMENSIONS[0];
    setBiomes(dim.biomes);
    setSelectedBiomeId(dim.biomes[0].id);
    setFixedTemp(dim.defaultFixed.temp);
    setFixedHum(dim.defaultFixed.hum);
    setFixedCont(dim.defaultFixed.cont);
    setFixedEros(dim.defaultFixed.eros);
    setFixedWeird(dim.defaultFixed.weird);
  };

  // Calculate selected biome
  const selectedBiome = useMemo(() => {
    return biomes.find(b => b.id === selectedBiomeId) || biomes[0];
  }, [biomes, selectedBiomeId]);

  // Suggest commonizer configurations for the selected biome generically
  const handleApplyPreset = (type: "moderate" | "frequent" | "restored") => {
    const originalDim = DIMENSIONS.find(d => d.id === selectedDimensionId) || DIMENSIONS[0];
    const originalBiome = originalDim.biomes.find(b => b.id === selectedBiomeId);
    if (!originalBiome) return;

    let updatedBiome: Biome;
    if (type === "moderate") {
      // Moderate: broaden boundaries by expanding ranges around center by 35%
      const expandDim = (range: { min: number; max: number }) => {
        const center = (range.min + range.max) / 2;
        const halfWidth = (range.max - range.min) / 2;
        const newHalfWidth = Math.max(0.15, halfWidth * 1.35);
        return {
          min: parseFloat(Math.max(-5.0, center - newHalfWidth).toFixed(4)),
          max: parseFloat(Math.min(5.0, center + newHalfWidth).toFixed(4))
        };
      };
      updatedBiome = {
        ...selectedBiome,
        temp: expandDim(selectedBiome.temp),
        hum: expandDim(selectedBiome.hum),
        cont: expandDim(selectedBiome.cont),
        eros: expandDim(selectedBiome.eros),
        weird: expandDim(selectedBiome.weird)
      };
    } else if (type === "frequent") {
      // Frequent: broaden boundaries significantly by 75%
      const expandDim = (range: { min: number; max: number }) => {
        const center = (range.min + range.max) / 2;
        const halfWidth = (range.max - range.min) / 2;
        const newHalfWidth = Math.max(0.3, halfWidth * 1.75);
        return {
          min: parseFloat(Math.max(-5.0, center - newHalfWidth).toFixed(4)),
          max: parseFloat(Math.min(5.0, center + newHalfWidth).toFixed(4))
        };
      };
      updatedBiome = {
        ...selectedBiome,
        temp: expandDim(selectedBiome.temp),
        hum: expandDim(selectedBiome.hum),
        cont: expandDim(selectedBiome.cont),
        eros: expandDim(selectedBiome.eros),
        weird: expandDim(selectedBiome.weird)
      };
    } else {
      // Restore initial
      updatedBiome = { ...originalBiome };
    }

    setBiomes(prev => prev.map(b => b.id === selectedBiomeId ? updatedBiome : b));
  };

  // Global presets for all biomes of the CURRENT dimension
  const handleApplyGlobalPreset = (type: "default" | "equal") => {
    if (type === "default") {
      setBiomes(selectedDimension.biomes);
    } else if (type === "equal") {
      setBiomes(prev => {
        const N = prev.length;
        return prev.map((b, i) => {
          const minVal = -1.0 + i * (2.0 / N);
          const maxVal = -1.0 + (i + 1) * (2.0 / N);
          return {
            ...b,
            temp: { min: parseFloat(minVal.toFixed(4)), max: parseFloat(maxVal.toFixed(4)) },
            hum: { min: -1.0, max: 1.0 },
            cont: { min: -1.0, max: 1.0 },
            eros: { min: -1.0, max: 1.0 },
            weird: { min: -1.0, max: 1.0 }
          };
        });
      });
    }
  };

  // Dynamically scale target biome rarity and shift other biomes proportionately
  const handleScaleAndBalance = (targetId: string, factor: number) => {
    setBiomes(prev => {
      // 1D scaling factor is the 5th root of the volume scale factor
      const d1Factor = Math.pow(factor, 0.2);
      
      return prev.map(b => {
        if (b.id === targetId) {
          // Adjust target biome (expand/shrink its boundaries)
          const adjustDim = (range: { min: number; max: number }) => {
            const center = (range.min + range.max) / 2;
            const halfWidth = (range.max - range.min) / 2;
            const newHalfWidth = Math.max(0.001, Math.min(5.0, halfWidth * d1Factor));
            return {
              min: parseFloat((center - newHalfWidth).toFixed(4)),
              max: parseFloat((center + newHalfWidth).toFixed(4))
            };
          };
          return {
            ...b,
            temp: adjustDim(b.temp),
            hum: adjustDim(b.hum),
            cont: adjustDim(b.cont),
            eros: adjustDim(b.eros),
            weird: adjustDim(b.weird)
          };
        } else {
          // Adjust other biomes inversely to maintain global space balance
          const inverseD1Factor = 1 / d1Factor;
          // Dampen inverse factor to prevent extremely unstable values
          const dampFactor = 1 + (inverseD1Factor - 1) * 0.45;
          
          const adjustDim = (range: { min: number; max: number }) => {
            const center = (range.min + range.max) / 2;
            const halfWidth = (range.max - range.min) / 2;
            const newHalfWidth = Math.max(0.001, Math.min(5.0, halfWidth * dampFactor));
            return {
              min: parseFloat((center - newHalfWidth).toFixed(4)),
              max: parseFloat((center + newHalfWidth).toFixed(4))
            };
          };
          return {
            ...b,
            temp: adjustDim(b.temp),
            hum: adjustDim(b.hum),
            cont: adjustDim(b.cont),
            eros: adjustDim(b.eros),
            weird: adjustDim(b.weird)
          };
        }
      });
    });
  };

  // Generic handler for individual range changes
  const handleRangeChange = (
    biomeId: string, 
    dimension: "temp" | "hum" | "cont" | "eros" | "weird", 
    bound: "min" | "max", 
    value: number
  ) => {
    setBiomes(prev => prev.map(b => {
      if (b.id !== biomeId) return b;
      const dim = b[dimension];
      const newValue = parseFloat(value.toFixed(4));
      
      let updatedRange = { ...dim };
      if (bound === "min") {
        updatedRange.min = newValue;
      } else {
        updatedRange.max = newValue;
      }

      return {
        ...b,
        [dimension]: updatedRange
      };
    }));
  };

  // Calculate volume of each biome in noise space
  // Noise dimensions go from -1.0 to 1.0. Length of each dimension = 2.0. Total 5D hypervolume = 2.0^5 = 32.0
  const biomeRarities = useMemo(() => {
    return biomes.map(biome => {
      const wTemp = Math.max(0, biome.temp.max - biome.temp.min);
      const wHum = Math.max(0, biome.hum.max - biome.hum.min);
      const wCont = Math.max(0, biome.cont.max - biome.cont.min);
      const wEros = Math.max(0, biome.eros.max - biome.eros.min);
      const wWeird = Math.max(0, biome.weird.max - biome.weird.min);

      const volume = wTemp * wHum * wCont * wEros * wWeird;
      const spacePercent = (volume / 32.0) * 100;

      // Map to vanilla comparison
      let vanillaEquivalent = "Extremely Rare (Mushroom Fields)";
      let colorClass = "text-red-400";
      if (spacePercent > 10.0) {
        vanillaEquivalent = "Abundant (Plains / Forest)";
        colorClass = "text-emerald-400";
      } else if (spacePercent > 2.0) {
        vanillaEquivalent = "Very Common (Birch Forest / Taiga)";
        colorClass = "text-green-400";
      } else if (spacePercent > 0.5) {
        vanillaEquivalent = "Common (Dark Forest / Swamp)";
        colorClass = "text-blue-400";
      } else if (spacePercent > 0.1) {
        vanillaEquivalent = "Uncommon (Badlands / Jungle)";
        colorClass = "text-yellow-400";
      } else if (spacePercent > 0.01) {
        vanillaEquivalent = "Rare (Ice Spikes / Windswept)";
        colorClass = "text-amber-400";
      }

      return {
        id: biome.id,
        name: biome.name,
        volume,
        spacePercent,
        vanillaEquivalent,
        colorClass
      };
    });
  }, [biomes]);

  // Sum of all volume percentages
  const totalVolumePercent = useMemo(() => {
    return biomeRarities.reduce((sum, r) => sum + r.spacePercent, 0);
  }, [biomeRarities]);

  // Conflict analyzer (find overlapping bounds)
  const conflicts = useMemo(() => {
    const list: string[] = [];
    
    for (let i = 0; i < biomes.length; i++) {
      for (let j = i + 1; j < biomes.length; j++) {
        const b1 = biomes[i];
        const b2 = biomes[j];

        // Check 5D overlap
        const tempOverlap = b1.temp.min < b2.temp.max && b1.temp.max > b2.temp.min;
        const humOverlap = b1.hum.min < b2.hum.max && b1.hum.max > b2.hum.min;
        const contOverlap = b1.cont.min < b2.cont.max && b1.cont.max > b2.cont.min;
        const erosOverlap = b1.eros.min < b2.eros.max && b1.eros.max > b2.eros.min;
        const weirdOverlap = b1.weird.min < b2.weird.max && b1.weird.max > b2.weird.min;

        if (tempOverlap && humOverlap && contOverlap && erosOverlap && weirdOverlap) {
          list.push(`${b1.name} & ${b2.name} overlap completely in all 5 parameters! Minecraft's distance resolution will split their borders.`);
        } else {
          // Track partial dimensional overlaps to show helpful indicators
          const overlappingDims: string[] = [];
          if (tempOverlap) overlappingDims.push("Temperature");
          if (humOverlap) overlappingDims.push("Humidity");
          if (contOverlap) overlappingDims.push("Continentalness");
          if (erosOverlap) overlappingDims.push("Erosion");
          if (weirdOverlap) overlappingDims.push("Weirdness");

          if (overlappingDims.length >= 4) {
            list.push(`High proximity: ${b1.name} and ${b2.name} overlap in ${overlappingDims.length} dimensions (${overlappingDims.join(", ")}).`);
          }
        }
      }
    }
    return list;
  }, [biomes]);

  // Draw simulation to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.createImageData(width, height);

    const step = (isDragging || isDraggingSlider) ? 4 : 1;

    if (mapMode === "slice") {
      // Calculate color for each coordinate point
      for (let py = 0; py < height; py += step) {
        for (let px = 0; px < width; px += step) {
          // Map pixel coordinates to Minecraft Multi-noise range [-1.0, 1.0]
          const valX = -1.0 + (px / width) * 2.0;
          const valY = 1.0 - (py / height) * 2.0; // Invert Y to match traditional Cartesian coordinates

          // Reconstruct the 5D point for this coordinate
          let t = fixedTemp;
          let h = fixedHum;
          let c = fixedCont;
          let e = fixedEros;
          let w = fixedWeird;

          // Overlay selected project axes onto these values
          if (xAxisDim === "temp") t = valX;
          else if (xAxisDim === "hum") h = valX;
          else if (xAxisDim === "cont") c = valX;
          else if (xAxisDim === "eros") e = valX;
          else if (xAxisDim === "weird") w = valX;

          if (yAxisDim === "temp") t = valY;
          else if (yAxisDim === "hum") h = valY;
          else if (yAxisDim === "cont") c = valY;
          else if (yAxisDim === "eros") e = valY;
          else if (yAxisDim === "weird") w = valY;

          let selectedColor = { r: 15, g: 15, b: 15 }; // Default empty space
          let minDistance = Infinity;
          let matchingBiomeColor: string | null = null;

          if (generationAlgorithm === "strict") {
            // Strict range check: point must fall strictly within biome bounds
            for (const biome of biomesWithMidpoints) {
              const inTemp = t >= biome.temp.min && t <= biome.temp.max;
              const inHum = h >= biome.hum.min && h <= biome.hum.max;
              const inCont = c >= biome.cont.min && c <= biome.cont.max;
              const inEros = e >= biome.eros.min && e <= biome.eros.max;
              const inWeird = w >= biome.weird.min && w <= biome.weird.max;

              if (inTemp && inHum && inCont && inEros && inWeird) {
                matchingBiomeColor = biome.color;
                break; // Standard priority list
              }
            }
          } else {
            // Euclidean distance formula (closest fit - Minecraft's actual system)
            // Biome target is assumed to be the midpoint of its ranges
            for (const biome of biomesWithMidpoints) {
              // Compute distance in 5D space to the boundaries of the biome's ranges
              const dT = t < biome.temp.min ? biome.temp.min - t : (t > biome.temp.max ? t - biome.temp.max : 0);
              const dH = h < biome.hum.min ? biome.hum.min - h : (h > biome.hum.max ? h - biome.hum.max : 0);
              const dC = c < biome.cont.min ? biome.cont.min - c : (c > biome.cont.max ? c - biome.cont.max : 0);
              const dE = e < biome.eros.min ? biome.eros.min - e : (e > biome.eros.max ? e - biome.eros.max : 0);
              const dW = w < biome.weird.min ? biome.weird.min - w : (w > biome.weird.max ? w - biome.weird.max : 0);

              let dist = Math.sqrt(dT*dT + dH*dH + dC*dC + dE*dE + dW*dW);
              if (dist === 0) {
                // If inside the bounds, break tie using distance to midpoint to maintain priority/natural flow
                const midDT = t - biome.midT;
                const midDH = h - biome.midH;
                const midDC = c - biome.midC;
                const midDE = e - biome.midE;
                const midDW = w - biome.midW;
                const midDist = Math.sqrt(midDT*midDT + midDH*midDH + midDC*midDC + midDE*midDE + midDW*midDW);
                dist = midDist * 0.001; // Scale down so it only acts as a tie breaker
              }

              if (dist < minDistance) {
                minDistance = dist;
                matchingBiomeColor = biome.color;
              }
            }
          }

          // Convert hex color to rgb
          if (matchingBiomeColor) {
            const r = parseInt(matchingBiomeColor.slice(1, 3), 16);
            const g = parseInt(matchingBiomeColor.slice(3, 5), 16);
            const b = parseInt(matchingBiomeColor.slice(5, 7), 16);
            selectedColor = { r, g, b };
          }

          // Add subtle noise overlay for that organic pixelated feel
          const n = subtleNoise(px, py, simulationSeed) * 12 - 6;
          const r_final = Math.max(0, Math.min(255, selectedColor.r + n));
          const g_final = Math.max(0, Math.min(255, selectedColor.g + n));
          const b_final = Math.max(0, Math.min(255, selectedColor.b + n));

          // Draw a step x step block
          for (let dy = 0; dy < step; dy++) {
            for (let dx = 0; dx < step; dx++) {
              const index = ((py + dy) * width + (px + dx)) * 4;
              if (index < imgData.data.length) {
                imgData.data[index] = r_final;
                imgData.data[index + 1] = g_final;
                imgData.data[index + 2] = b_final;
                imgData.data[index + 3] = 255;
              }
            }
          }
        }
      }
    } else {
      // Chunkbase 2D World Map simulation
      for (let py = 0; py < height; py += step) {
        for (let px = 0; px < width; px += step) {
          // Map to world coordinates
          const worldX = chunkbaseX + (px - width / 2) * (chunkbaseZoom / width);
          const worldZ = chunkbaseZ + (py - height / 2) * (chunkbaseZoom / height);

          // Get multi-noise values
          const { t, h, c, e: eros, w, riverVal } = getNoiseAtCoordinates(worldX, worldZ, simulationSeed);

          // Get matching biome / water
          const result = getBiomeAtNoise(t, h, c, eros, w, riverVal, biomesWithMidpoints, generationAlgorithm);

          const r = parseInt(result.color.slice(1, 3), 16);
          const g = parseInt(result.color.slice(3, 5), 16);
          const b = parseInt(result.color.slice(5, 7), 16);

          // Add a subtle texture/noise element to simulate terrain/sand/leaves
          const n = subtleNoise(px, py, simulationSeed) * 8 - 4;
          const r_final = Math.max(0, Math.min(255, r + n));
          const g_final = Math.max(0, Math.min(255, g + n));
          const b_final = Math.max(0, Math.min(255, b + n));

          // Draw a step x step block
          for (let dy = 0; dy < step; dy++) {
            for (let dx = 0; dx < step; dx++) {
              const index = ((py + dy) * width + (px + dx)) * 4;
              if (index < imgData.data.length) {
                imgData.data[index] = r_final;
                imgData.data[index + 1] = g_final;
                imgData.data[index + 2] = b_final;
                imgData.data[index + 3] = 255;
              }
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [
    biomesWithMidpoints, xAxisDim, yAxisDim, fixedTemp, fixedHum, fixedCont, fixedEros, fixedWeird,
    generationAlgorithm, simulationSeed, mapMode, chunkbaseX, chunkbaseZ, chunkbaseZoom,
    showOceans, showRivers, getNoiseAtCoordinates, getBiomeAtNoise, isDragging, isDraggingSlider, selectedDimensionId
  ]);

  // Drag-to-pan event handlers for Chunkbase map
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mapMode !== "chunkbase") return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      cx: chunkbaseX,
      cz: chunkbaseZ
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
      if (mapMode === "chunkbase") {
        const worldX = Math.round(chunkbaseX + (px - canvas.width / 2) * (chunkbaseZoom / canvas.width));
        const worldZ = Math.round(chunkbaseZ + (py - canvas.height / 2) * (chunkbaseZoom / canvas.height));
        const { t, h, c, e: eros, w, riverVal } = getNoiseAtCoordinates(worldX, worldZ, simulationSeed);
        const result = getBiomeAtNoise(t, h, c, eros, w, riverVal, biomesWithMidpoints, generationAlgorithm);

        setHoveredCoords({
          x: worldX,
          z: worldZ,
          t,
          h,
          c,
          e: eros,
          w,
          biomeName: result.biome ? result.biome.name : "None",
          biomeColor: result.biome ? result.biome.color : null,
          isWater: result.isWater,
          waterType: result.waterType
        });
      } else {
        // Slice mode coordinate extraction
        const valX = -1.0 + (px / canvas.width) * 2.0;
        const valY = 1.0 - (py / canvas.height) * 2.0;
        setHoveredCoords({
          x: parseFloat(valX.toFixed(3)),
          z: parseFloat(valY.toFixed(3)),
          t: xAxisDim === "temp" ? valX : (yAxisDim === "temp" ? valY : fixedTemp),
          h: xAxisDim === "hum" ? valX : (yAxisDim === "hum" ? valY : fixedHum),
          c: xAxisDim === "cont" ? valX : (yAxisDim === "cont" ? valY : fixedCont),
          e: xAxisDim === "eros" ? valX : (yAxisDim === "eros" ? valY : fixedEros),
          w: xAxisDim === "weird" ? valX : (yAxisDim === "weird" ? valY : fixedWeird),
          biomeName: null,
          biomeColor: null,
          isWater: false,
          waterType: null
        });
      }
    }

    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const scale = chunkbaseZoom / canvas.width;
      setChunkbaseX(Math.round(dragStartRef.current.cx - dx * scale));
      setChunkbaseZ(Math.round(dragStartRef.current.cz - dy * scale));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    setHoveredCoords(null);
  };

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden flex flex-col bg-[#080808] text-[#a4a090] font-sans antialiased selection:bg-[#ff7043] selection:text-white">
      {/* HEADER SECTION */}
      <header className="border-b border-[#1c1414] bg-[#0c0909] py-3 px-6 shrink-0">
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#ff7043] rounded flex items-center justify-center text-[#080808]">
              <Compass className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {selectedDimension.name} <span className="text-xs bg-[#201414] text-[#ff7043] px-2.5 py-0.5 rounded border border-[#5c1414]">Biome Rarity Tool</span>
              </h1>
              <p className="text-xs text-[#8c8779] mt-0.5">Procedural Multi-Noise Hyper-Space Calculator & Simulator</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#110d0d] border border-[#201414] px-4 py-2.5 rounded">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[#8c8779]">Simulation Sync: Active</span>
          </div>
        </div>
      </header>

      {/* CORE CONTENT LAYOUT */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: CONTROLS & BIOME EDITORS (7 COLS) */}
        <section className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4 overflow-y-auto pr-1 h-full min-h-0">
          
          {/* OVERVIEW & SELECTOR */}
          <div className="bg-[#0c0909] border border-[#1c1414] rounded-lg p-4">
            {/* Dimension Selection */}
            <div className="bg-[#110d0d] border border-[#201414] p-3 rounded-lg mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[10px] text-[#ff7043] font-mono uppercase tracking-wider font-bold">
                  Select Active Mod Dimension
                </label>
                <select
                  value={selectedDimensionId}
                  onChange={(e) => handleDimensionChange(e.target.value)}
                  className="bg-[#050505] border border-[#3e2723] rounded px-3 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#ff7043] cursor-pointer sm:w-64"
                >
                  {DIMENSIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.biomes.length} Biomes)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wider uppercase text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#ff7043]" />
                {selectedDimension.name} Biomes
              </h2>
              <button 
                onClick={() => {
                  setBiomes(selectedDimension.biomes);
                  setFixedTemp(selectedDimension.defaultFixed.temp);
                  setFixedHum(selectedDimension.defaultFixed.hum);
                  setFixedCont(selectedDimension.defaultFixed.cont);
                  setFixedEros(selectedDimension.defaultFixed.eros);
                  setFixedWeird(selectedDimension.defaultFixed.weird);
                }}
                className="text-xs text-[#ff7043] hover:text-white transition flex items-center gap-1 bg-[#1a1111] border border-[#5c1414] px-3 py-1.5 rounded"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Ranges
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#110d0d] p-2.5 rounded border border-[#201414]">
              <span className="text-[11px] text-[#8c8779] font-mono uppercase tracking-wider mr-1">Global Presets:</span>
              <button
                onClick={() => {
                  handleApplyGlobalPreset("default");
                  setFixedTemp(selectedDimension.defaultFixed.temp);
                  setFixedHum(selectedDimension.defaultFixed.hum);
                  setFixedCont(selectedDimension.defaultFixed.cont);
                  setFixedEros(selectedDimension.defaultFixed.eros);
                  setFixedWeird(selectedDimension.defaultFixed.weird);
                }}
                className="text-[11px] text-white bg-[#1a1313] hover:bg-[#2c2020] border border-[#2e2020] px-2 py-1 rounded transition"
              >
                Default {selectedDimension.name}
              </button>
              <button
                onClick={() => {
                  handleApplyGlobalPreset("equal");
                }}
                className="text-[11px] text-[#ff7043] bg-[#221210] hover:bg-[#3d1a15] border border-[#521c15] px-2 py-1 rounded transition flex items-center gap-1"
              >
                All Equal Biomes ({(100 / biomes.length).toFixed(3)}% each)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {biomes.map(biome => {
                const isSelected = biome.id === selectedBiomeId;
                const rarityInfo = biomeRarities.find(r => r.id === biome.id);
                return (
                  <button
                    key={biome.id}
                    onClick={() => setSelectedBiomeId(biome.id)}
                    className={`p-3 rounded-lg text-left border transition flex flex-col gap-1.5 ${
                      isSelected 
                        ? "bg-[#1f1616] border-[#ff7043] text-white" 
                        : "bg-[#0d0909] border-[#201414] hover:border-[#3a2c2c] text-[#a4a090]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: biome.color }} />
                      <span className="font-semibold text-xs truncate">{biome.name}</span>
                    </div>
                    <div className="text-[10px] text-[#8c8779] flex items-center justify-between">
                      <span>Rarity:</span>
                      <span className={`font-mono font-medium ${rarityInfo?.colorClass}`}>
                        {rarityInfo ? rarityInfo.spacePercent.toFixed(4) : "0"}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE BIOME DETAILED PARAMETER SLIDERS */}
          <div className="bg-[#0c0909] border border-[#1c1414] rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1c1414] pb-3 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: selectedBiome.color }} />
                <h3 className="text-sm font-bold text-white">{selectedBiome.name} Range Settings</h3>
              </div>
              
              <div className="flex items-center gap-1.5 bg-[#1f1512] border border-[#ff7043]/30 px-2.5 py-1.5 rounded-lg text-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#ff7043] animate-pulse" />
                <span className="text-[#ff7043] font-medium">{selectedBiome.name} Presets:</span>
                <div className="flex gap-1 ml-1">
                  <button 
                    onClick={() => handleApplyPreset("moderate")}
                    className="px-2 py-0.5 rounded bg-[#ff7043] hover:bg-[#ff8a65] text-[#080808] font-bold text-[10px] transition"
                    title="Expands ranges around coordinate center to boost absolute generation chance."
                  >
                    Moderate
                  </button>
                  <button 
                    onClick={() => handleApplyPreset("frequent")}
                    className="px-2 py-0.5 rounded bg-[#d84315] hover:bg-[#ff7043] text-white font-bold text-[10px] transition"
                    title="Significantly broadens range boundaries to make the biome common."
                  >
                    Frequent
                  </button>
                  <button 
                    onClick={() => handleApplyPreset("restored")}
                    className="px-2 py-0.5 rounded bg-[#201414] text-[#8c8779] hover:text-white text-[10px] transition"
                    title="Restores this biome to original mod repository settings."
                  >
                    Default
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Rarity Rebalancer controls */}
            <div className="bg-[#110d0d] border border-[#231a1a] rounded-lg p-3 mb-4 flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[8px] bg-[#3e1a17] text-[#ff7043] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">SYSTEM PRESET</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide">Proportional Rarity Auto-Balancer</h4>
                </div>
                <p className="text-[11px] text-[#8c8779]">
                  Scale <strong>{selectedBiome.name}</strong>'s volume. Other boundaries adapt to maintain world equilibrium.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                <button
                  onClick={() => handleScaleAndBalance(selectedBiomeId, 1.5)}
                  className="px-2 py-1.5 text-center text-[10px] font-semibold rounded bg-[#ff7043]/10 hover:bg-[#ff7043]/20 text-[#ff7043] border border-[#ff7043]/25 transition cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis"
                  title="Expands dimensions by factor of ~1.08 each, shrinking other biomes proportionately."
                >
                  Increase Rarity (+50%)
                </button>
                <button
                  onClick={() => handleScaleAndBalance(selectedBiomeId, 2.0)}
                  className="px-2 py-1.5 text-center text-[10px] font-semibold rounded bg-[#ff7043] hover:bg-[#ff8a65] text-[#080808] transition cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis"
                  title="Expands dimensions by factor of ~1.15 each, shrinking other biomes proportionately."
                >
                  Double Rarity (2x)
                </button>
                <button
                  onClick={() => handleScaleAndBalance(selectedBiomeId, 0.5)}
                  className="px-2 py-1.5 text-center text-[10px] font-semibold rounded bg-[#1a1313] hover:bg-[#2c2020] text-white border border-[#2e2020] transition cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis"
                  title="Shrinks dimensions by factor of ~0.87 each, expanding other biomes proportionately."
                >
                  Halve Rarity (0.5x)
                </button>
                <button
                  onClick={() => handleScaleAndBalance(selectedBiomeId, 0.1)}
                  className="px-2 py-1.5 text-center text-[10px] font-semibold rounded bg-red-950/20 hover:bg-red-900/35 text-red-400 border border-red-900/30 transition cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis"
                  title="Shrinks dimensions by factor of ~0.63 each, expanding other biomes proportionately."
                >
                  Ultra Rare (0.1x)
                </button>
              </div>
            </div>

            {/* Slider List */}
            <div className="flex flex-col gap-5">
              {([
                { key: "temp", name: "Temperature", colorClass: "text-[#ff8a65]", desc: "Determines hot vs cold biome thresholds" },
                { key: "hum", name: "Humidity", colorClass: "text-[#4db6ac]", desc: "Wet/dry conditions (rain forest to barrens)" },
                { key: "cont", name: "Continentalness", colorClass: "text-[#9ccc65]", desc: "Distance to ocean/inland depth zones" },
                { key: "eros", name: "Erosion", colorClass: "text-[#64b5f6]", desc: "Flatness vs steep mountains" },
                { key: "weird", name: "Weirdness", colorClass: "text-[#ba68c8]", desc: "Signifies variant non-standard geography" }
              ] as const).map((dim) => {
                const value = selectedBiome[dim.key];
                return (
                  <div key={dim.key} className="bg-[#0e0a0a] border border-[#1a1313] p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs font-bold uppercase ${dim.colorClass}`}>{dim.name}</span>
                        <span className="text-[10px] text-[#70685c]">{dim.desc}</span>
                      </div>
                      <div className="flex gap-3 text-xs font-mono">
                        <span className="text-[#8c8779]">Min: <strong className="text-white">{value.min.toFixed(4)}</strong></span>
                        <span className="text-[#8c8779]">Max: <strong className="text-white">{value.max.toFixed(4)}</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Min Limit */}
                      <div className="bg-[#110d0d] p-3 rounded border border-[#201414]">
                        <div className="flex items-center justify-between text-[11px] text-[#8c8779] mb-1.5 font-mono">
                          <span>Minimum limit</span>
                          {value.min > value.max && <span className="text-red-400 text-[10px]">Min &gt; Max</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <PreciseNumberInput
                            value={value.min}
                            onChange={(val) => handleRangeChange(selectedBiomeId, dim.key, "min", val)}
                            className="w-20 bg-[#070505] border border-[#3e2723] rounded px-2 py-1 text-white text-xs font-mono text-center focus:outline-none focus:border-[#ff7043]"
                          />
                          <input 
                            type="range" 
                            min="-5.0" 
                            max="5.0" 
                            step="0.001"
                            value={value.min} 
                            onChange={(e) => handleRangeChange(selectedBiomeId, dim.key, "min", parseFloat(e.target.value))}
                            className="flex-1 accent-[#ff7043] bg-[#201414] h-1 rounded appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Max Limit */}
                      <div className="bg-[#110d0d] p-3 rounded border border-[#201414]">
                        <div className="flex items-center justify-between text-[11px] text-[#8c8779] mb-1.5 font-mono">
                          <span>Maximum limit</span>
                          {value.min > value.max && <span className="text-red-400 text-[10px]">Min &gt; Max</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <PreciseNumberInput
                            value={value.max}
                            onChange={(val) => handleRangeChange(selectedBiomeId, dim.key, "max", val)}
                            className="w-20 bg-[#070505] border border-[#3e2723] rounded px-2 py-1 text-white text-xs font-mono text-center focus:outline-none focus:border-[#ff7043]"
                          />
                          <input 
                            type="range" 
                            min="-5.0" 
                            max="5.0" 
                            step="0.001"
                            value={value.max} 
                            onChange={(e) => handleRangeChange(selectedBiomeId, dim.key, "max", parseFloat(e.target.value))}
                            className="flex-1 accent-[#ff7043] bg-[#201414] h-1 rounded appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OVERLAP AND CONFLICT ANALYZER */}
          <div className="bg-[#0c0909] border border-[#1c1414] rounded-lg p-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Overlaps &amp; Generation Conflicts
            </h3>

            {conflicts.length === 0 ? (
              <div className="flex items-center gap-2.5 bg-[#0a120c] border border-emerald-500/20 p-3.5 rounded-lg text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>No major conflicts or tight overlaps detected! Your dimension biomes have distinct coordinate niches in noise space.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="flex gap-2 bg-[#120a0a] border border-red-500/10 p-3 rounded-lg text-xs text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>{conflict}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>

        {/* RIGHT COLUMN: VISUAL MAP (5 COLS) */}
        <section className="lg:col-span-6 xl:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1 h-full min-h-0">
          
          {/* 2D MAP VISUALIZER */}
          <div className="bg-[#0c0909] border border-[#1c1414] rounded-lg p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-sm font-semibold tracking-wider uppercase text-white flex items-center gap-2">
                <Map className="h-4 w-4 text-[#ff7043]" />
                2D Projection Map
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#8c8779]">
                <span>Type:</span>
                <select 
                  value={generationAlgorithm} 
                  onChange={(e: any) => setGenerationAlgorithm(e.target.value)}
                  className="bg-[#1a1313] border border-[#3e2723] rounded px-1.5 py-0.5 text-[#ff7043] focus:outline-none cursor-pointer text-xs"
                >
                  <option value="euclidean">Minecraft (Euclidean)</option>
                  <option value="strict">Strict (MCreator Bounds)</option>
                </select>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-[#110d0d] p-1 rounded border border-[#201414] mb-4">
              <button
                onClick={() => {
                  setMapMode("slice");
                  setHoveredCoords(null);
                }}
                className={`flex-1 text-center py-1.5 text-xs font-mono rounded font-semibold transition cursor-pointer ${mapMode === "slice" ? "bg-[#ff7043] text-[#080808]" : "text-[#8c8779] hover:text-white"}`}
              >
                5D Noise Slice
              </button>
              <button
                onClick={() => {
                  setMapMode("chunkbase");
                  setHoveredCoords(null);
                }}
                className={`flex-1 text-center py-1.5 text-xs font-mono rounded font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${mapMode === "chunkbase" ? "bg-[#ff7043] text-[#080808]" : "text-[#8c8779] hover:text-white"}`}
              >
                <Globe className="h-3.5 w-3.5" />
                Chunkbase 2D Map
              </button>
            </div>

            {/* World Seed Input (Applies to both maps) */}
            <div className="bg-[#110d0d] border border-[#201414] p-3.5 rounded-lg mb-4 text-xs">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-[#ff7043] font-bold uppercase tracking-wider block">
                  World Generation Seed
                </label>
                {seedInput.trim() !== simulationSeed.toString() && (
                  <span className="text-[9px] font-mono text-[#8c8779] bg-[#1a1313] px-1.5 py-0.5 rounded border border-[#2c1d1a]" title="This is the 32-bit integer Minecraft calculates by hashing your text input">
                    Hashed: {simulationSeed}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="Enter a Minecraft seed (e.g. 42 or gargamel)"
                  className="flex-1 bg-[#050505] border border-[#3e2723] rounded px-3 py-1.5 text-white text-xs font-mono focus:border-[#ff7043] focus:outline-none placeholder-[#4d4a41]"
                />
                <button
                  onClick={() => {
                    const randomSeed = Math.floor(Math.random() * 99999999) + 1;
                    setSeedInput(randomSeed.toString());
                  }}
                  className="px-3 py-1.5 bg-[#1a1111] border border-[#5c1414] hover:border-[#ff7043]/40 rounded text-[#ff7043] transition flex items-center gap-1 shrink-0 font-medium font-mono text-[11px]"
                  title="Randomize seed"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                  Random
                </button>
              </div>
            </div>

            {mapMode === "slice" ? (
              /* Projection Selector (Original) */
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div>
                  <label className="text-[10px] text-[#70685c] uppercase block mb-1 font-semibold">X Axis Dimension</label>
                  <select 
                    value={xAxisDim} 
                    onChange={(e) => setXAxisDim(e.target.value)}
                    className="w-full bg-[#110d0d] border border-[#201414] rounded p-2 text-white cursor-pointer"
                  >
                    <option value="temp">Temperature</option>
                    <option value="hum">Humidity</option>
                    <option value="cont">Continentalness</option>
                    <option value="eros">Erosion</option>
                    <option value="weird">Weirdness</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#70685c] uppercase block mb-1 font-semibold">Y Axis Dimension</label>
                  <select 
                    value={yAxisDim} 
                    onChange={(e) => setYAxisDim(e.target.value)}
                    className="w-full bg-[#110d0d] border border-[#201414] rounded p-2 text-white cursor-pointer"
                  >
                    <option value="temp">Temperature</option>
                    <option value="hum">Humidity</option>
                    <option value="cont">Continentalness</option>
                    <option value="eros">Erosion</option>
                    <option value="weird">Weirdness</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Chunkbase 2D World Map controls */
              <div className="flex flex-col gap-3 bg-[#110d0d] border border-[#201414] p-3.5 rounded-lg mb-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#ff7043] font-bold uppercase block mb-1">Center X Coordinate</label>
                    <input
                      type="number"
                      value={chunkbaseX}
                      onChange={(e) => setChunkbaseX(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#050505] border border-[#3e2723] rounded p-2 text-white text-xs font-mono focus:border-[#ff7043] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#ff7043] font-bold uppercase block mb-1">Center Z Coordinate</label>
                    <input
                      type="number"
                      value={chunkbaseZ}
                      onChange={(e) => setChunkbaseZ(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#050505] border border-[#3e2723] rounded p-2 text-white text-xs font-mono focus:border-[#ff7043] focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2.5 mt-1 border-t border-[#1c1414] pt-2.5 text-[11px]">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-[#8c8779] hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={showOceans}
                        onChange={(e) => setShowOceans(e.target.checked)}
                        className="rounded accent-[#ff7043] cursor-pointer"
                      />
                      Show Oceans
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#8c8779] hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={showRivers}
                        onChange={(e) => setShowRivers(e.target.checked)}
                        className="rounded accent-[#ff7043] cursor-pointer"
                      />
                      Show Rivers
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[#70685c]">Zoom Level:</span>
                    <select
                      value={chunkbaseZoom}
                      onChange={(e) => setChunkbaseZoom(parseInt(e.target.value))}
                      className="bg-[#050505] border border-[#3e2723] rounded px-2 py-1 text-[#ff7043] font-mono text-[10px] cursor-pointer focus:outline-none"
                    >
                      <option value={128}>128 blocks (Extreme Close-up)</option>
                      <option value={256}>256 blocks (Close)</option>
                      <option value={512}>512 blocks (Detailed)</option>
                      <option value={1024}>1024 blocks (Default)</option>
                      <option value={2048}>2048 blocks (Wide-angle)</option>
                      <option value={4096}>4096 blocks (Continent level)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Canvas Area */}
            <div className="flex flex-col items-center justify-center bg-[#050505] rounded-lg border border-[#201414] p-4 relative group">
              {/* Corner coordinate markers matching the screenshot */}
              {mapMode === "chunkbase" ? (
                <>
                  <div className="absolute top-2 left-2 text-[9px] text-[#4d4a41] font-mono select-none pointer-events-none">
                    X: {Math.round(chunkbaseX - chunkbaseZoom / 2)} <br />
                    Z: {Math.round(chunkbaseZ - chunkbaseZoom / 2)}
                  </div>
                  <div className="absolute top-2 right-2 text-[9px] text-[#4d4a41] font-mono text-right select-none pointer-events-none">
                    X: {Math.round(chunkbaseX + chunkbaseZoom / 2)} <br />
                    Z: {Math.round(chunkbaseZ - chunkbaseZoom / 2)}
                  </div>
                  <div className="absolute bottom-2 left-2 text-[9px] text-[#4d4a41] font-mono select-none pointer-events-none">
                    X: {Math.round(chunkbaseX - chunkbaseZoom / 2)} <br />
                    Z: {Math.round(chunkbaseZ + chunkbaseZoom / 2)}
                  </div>
                  <div className="absolute bottom-2 right-2 text-[9px] text-[#4d4a41] font-mono text-right select-none pointer-events-none">
                    X: {Math.round(chunkbaseX + chunkbaseZoom / 2)} <br />
                    Z: {Math.round(chunkbaseZ + chunkbaseZoom / 2)}
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute top-1 right-2 text-[9px] text-[#4d4a41] font-mono select-none">
                    Y Axis ({yAxisDim.toUpperCase()})
                  </div>
                  <div className="absolute bottom-1 left-2 text-[9px] text-[#4d4a41] font-mono select-none">
                    X Axis ({xAxisDim.toUpperCase()})
                  </div>
                </>
              )}
              
              <canvas 
                ref={canvasRef} 
                width={512} 
                height={512}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className={`rounded-md shadow-2xl max-w-full max-h-full aspect-square border border-[#110c0c] transition select-none ${mapMode === "chunkbase" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}`}
              />

              {mapMode === "slice" ? (
                <div className="w-full flex justify-between text-[10px] font-mono text-[#70685c] mt-2 px-1 shrink-0">
                  <span>Min Limit (-1.0)</span>
                  <span className="text-[#ff7043] font-bold">Center (0.0)</span>
                  <span>Max Limit (1.0)</span>
                </div>
              ) : (
                <div className="w-full mt-2 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-mono text-[#70685c]">
                    Center: <strong className="text-white">{chunkbaseX}, {chunkbaseZ}</strong> (Z ↑)
                  </span>
                  {/* Floating Action Buttons / Compass */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setChunkbaseX(0);
                        setChunkbaseZ(0);
                      }}
                      className="p-1 rounded bg-[#110d0d] hover:bg-[#201414] border border-[#201414] text-[#ff7043] transition cursor-pointer"
                      title="Reset to Spawn (0,0)"
                    >
                      <Compass className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setChunkbaseZoom(prev => Math.max(128, prev / 2))}
                      className="p-1 rounded bg-[#110d0d] hover:bg-[#201414] border border-[#201414] text-white transition cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setChunkbaseZoom(prev => Math.min(4096, prev * 2))}
                      className="p-1 rounded bg-[#110d0d] hover:bg-[#201414] border border-[#201414] text-white transition cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drag & Seed Info Badges */}
            {mapMode === "chunkbase" && (
              <div className="mt-2.5 flex flex-wrap items-center justify-between text-[10px] text-[#70685c] font-mono px-1">
                <span className="flex items-center gap-1">
                  <Move className="h-3 w-3 text-[#ff7043]" />
                  Drag map to pan around
                </span>
                <span className="bg-[#141010] text-[#ff7043]/80 border border-[#2e1a1a] px-1.5 py-0.5 rounded text-[9px]">
                  Seed: {simulationSeed}
                </span>
              </div>
            )}

            {/* DYNAMIC HOVER STATUS TOOLTIP PANEL */}
            <div className="mt-4 bg-[#0a0707] border border-[#1b1212] rounded-lg p-3">
              {hoveredCoords ? (
                <div>
                  <div className="flex items-center justify-between border-b border-[#1f1616] pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#ff7043]" />
                      <span className="text-xs font-mono text-white">
                        {mapMode === "chunkbase" ? `Block X: ${hoveredCoords.x}, Z: ${hoveredCoords.z}` : `X: ${hoveredCoords.x}, Y: ${hoveredCoords.z}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: hoveredCoords.isWater ? (hoveredCoords.waterType === "Deep Ocean" ? "#00003f" : hoveredCoords.waterType === "Shallow Ocean" ? "#0a228c" : "#002aff") : (hoveredCoords.biomeColor || "#1e1e1e") }} />
                      <span className="text-xs font-bold text-white uppercase">
                        {hoveredCoords.isWater ? hoveredCoords.waterType : (hoveredCoords.biomeName || "None")}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    <div className="bg-[#110d0d] p-1.5 rounded border border-[#1a1111]">
                      <span className="text-[9px] text-[#ff8a65] block font-mono">Temp</span>
                      <span className="text-xs font-bold text-white font-mono">{hoveredCoords.t.toFixed(3)}</span>
                    </div>
                    <div className="bg-[#110d0d] p-1.5 rounded border border-[#1a1111]">
                      <span className="text-[9px] text-[#4db6ac] block font-mono">Humid</span>
                      <span className="text-xs font-bold text-white font-mono">{hoveredCoords.h.toFixed(3)}</span>
                    </div>
                    <div className="bg-[#110d0d] p-1.5 rounded border border-[#1a1111]">
                      <span className="text-[9px] text-[#9ccc65] block font-mono">Cont</span>
                      <span className="text-xs font-bold text-white font-mono">{hoveredCoords.c.toFixed(3)}</span>
                    </div>
                    <div className="bg-[#110d0d] p-1.5 rounded border border-[#1a1111]">
                      <span className="text-[9px] text-[#64b5f6] block font-mono">Eros</span>
                      <span className="text-xs font-bold text-white font-mono">{hoveredCoords.e.toFixed(3)}</span>
                    </div>
                    <div className="bg-[#110d0d] p-1.5 rounded border border-[#1a1111]">
                      <span className="text-[9px] text-[#ba68c8] block font-mono">Weird</span>
                      <span className="text-xs font-bold text-white font-mono">{hoveredCoords.w.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-xs text-[#70685c] italic">
                  Hover or drag over map to inspect coordinates and noise variables
                </div>
              )}
            </div>

            {/* Flat dimensions controls (Only shown in Slice mode) */}
            {mapMode === "slice" && (
              <div className="mt-5 border-t border-[#1c1414] pt-4">
                <h4 className="text-xs font-semibold text-white mb-3">Adjust Fixed Dimensions:</h4>
                <div className="flex flex-col gap-3 text-xs">
                  {xAxisDim !== "temp" && yAxisDim !== "temp" && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#8c8779] shrink-0 w-24">Fixed Temp:</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <PreciseNumberInput
                          value={fixedTemp}
                          onChange={(val) => setFixedTemp(val)}
                          className="w-16 bg-[#070505] border border-[#3e2723] rounded px-1.5 py-0.5 text-white text-xs font-mono text-center focus:outline-none focus:border-[#ff7043]"
                        />
                        <input 
                          type="range" min="-5.0" max="5.0" step="0.001" value={fixedTemp} 
                          onChange={(e) => setFixedTemp(parseFloat(e.target.value))}
                          className="w-32 accent-[#ff7043]" 
                        />
                      </div>
                    </div>
                  )}
                  {xAxisDim !== "hum" && yAxisDim !== "hum" && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#8c8779] shrink-0 w-24">Fixed Humidity:</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <PreciseNumberInput
                          value={fixedHum}
                          onChange={(val) => setFixedHum(val)}
                          className="w-16 bg-[#070505] border border-[#3e2723] rounded px-1.5 py-0.5 text-white text-xs font-mono text-center focus:outline-none focus:border-[#ff7043]"
                        />
                        <input 
                          type="range" min="-5.0" max="5.0" step="0.001" value={fixedHum} 
                          onChange={(e) => setFixedHum(parseFloat(e.target.value))}
                          className="w-32 accent-[#ff7043]" 
                        />
                      </div>
                    </div>
                  )}
                  {xAxisDim !== "cont" && yAxisDim !== "cont" && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#8c8779] shrink-0 w-24">Fixed Cont:</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <PreciseNumberInput
                          value={fixedCont}
                          onChange={(val) => setFixedCont(val)}
                          className="w-16 bg-[#070505] border border-[#3e2723] rounded px-1.5 py-0.5 text-white text-xs font-mono text-center focus:outline-none focus:border-[#ff7043]"
                        />
                        <input 
                          type="range" min="-5.0" max="5.0" step="0.001" value={fixedCont} 
                          onChange={(e) => setFixedCont(parseFloat(e.target.value))}
                          className="w-32 accent-[#ff7043]" 
                        />
                      </div>
                    </div>
                  )}
                  {xAxisDim !== "eros" && yAxisDim !== "eros" && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#8c8779] shrink-0 w-24">Fixed Erosion:</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <PreciseNumberInput
                          value={fixedEros}
                          onChange={(val) => setFixedEros(val)}
                          className="w-16 bg-[#070505] border border-[#3e2723] rounded px-1.5 py-0.5 text-white text-xs font-mono text-center focus:outline-none focus:border-[#ff7043]"
                        />
                        <input 
                          type="range" min="-5.0" max="5.0" step="0.001" value={fixedEros} 
                          onChange={(e) => setFixedEros(parseFloat(e.target.value))}
                          className="w-32 accent-[#ff7043]" 
                        />
                      </div>
                    </div>
                  )}
                  {xAxisDim !== "weird" && yAxisDim !== "weird" && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#8c8779] shrink-0 w-24">Fixed Weirdness:</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <PreciseNumberInput
                          value={fixedWeird}
                          onChange={(val) => setFixedWeird(val)}
                          className="w-16 bg-[#070505] border border-[#3e2723] rounded px-1.5 py-0.5 text-white text-xs font-mono text-center focus:outline-none focus:border-[#ff7043]"
                        />
                        <input 
                          type="range" min="-5.0" max="5.0" step="0.001" value={fixedWeird} 
                          onChange={(e) => setFixedWeird(parseFloat(e.target.value))}
                          className="w-32 accent-[#ff7043]" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </section>

      </main>
    </div>
  );
}
