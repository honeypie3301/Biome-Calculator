import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  ChevronDown,
  Trash2,
  Plus,
  Terminal,
  FileText
} from "lucide-react";
import { 
  BACKWOODS_DIMENSIONS,
  VANILLA_DIMENSIONS, 
  Biome, 
  ClimatePoint, 
  ClimateRange, 
  getBiomeBounds 
} from "./biomeData";

// Deterministic seed-based noise sampler matching standard Minecraft-like multi-noise systems
class SimplePerlin {
  private perm: Int32Array;

  constructor(rng: () => number) {
    this.perm = new Int32Array(512);
    const source = Array.from({ length: 256 }, (_, i) => i);
    // Shuffle using the seeded RNG
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = source[i];
      source[i] = source[j];
      source[j] = temp;
    }
    for (let i = 0; i < 256; i++) {
      this.perm[i] = source[i];
      this.perm[i + 256] = source[i];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : z;
    const v = h < 4 ? z : (h === 12 || h === 14 ? x : 0);
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public sample(x: number, z: number): number {
    const ix = Math.floor(x);
    const iz = Math.floor(z);

    const X = ix & 255;
    const Z = iz & 255;

    const fx = x - ix;
    const fz = z - iz;

    const u = this.fade(fx);
    const w = this.fade(fz);

    const AA = this.perm[this.perm[X] + Z];
    const AB = this.perm[this.perm[X] + Z + 1];
    const BA = this.perm[this.perm[X + 1] + Z];
    const BB = this.perm[this.perm[X + 1] + Z + 1];

    return this.lerp(w,
      this.lerp(u, this.grad(AA, fx, fz), this.grad(BA, fx - 1, fz)),
      this.lerp(u, this.grad(AB, fx, fz - 1), this.grad(BB, fx - 1, fz - 1))
    );
  }
}

class OctavePerlin {
  private samplers: SimplePerlin[];
  private amplitudes: number[];

  constructor(rng: () => number, octavesCount: number) {
    this.samplers = [];
    this.amplitudes = [];
    for (let i = 0; i < octavesCount; i++) {
      this.samplers.push(new SimplePerlin(rng));
      this.amplitudes.push(Math.pow(0.5, i));
    }
  }

  public sample(x: number, z: number): number {
    let total = 0;
    let freq = 1.0;
    let maxAmp = 0;
    for (let i = 0; i < this.samplers.length; i++) {
      total += this.amplitudes[i] * this.samplers[i].sample(x * freq, z * freq);
      maxAmp += this.amplitudes[i];
      freq *= 2.0;
    }
    return total / maxAmp;
  }
}

class DoublePerlin {
  private first: OctavePerlin;
  private second: OctavePerlin;

  constructor(rng: () => number, octavesCount: number) {
    this.first = new OctavePerlin(rng, octavesCount);
    this.second = new OctavePerlin(rng, octavesCount);
  }

  public sample(x: number, z: number): number {
    const v1 = this.first.sample(x, z);
    const v2 = this.second.sample(x + 15.5, z + 15.5);
    return (v1 + v2) * 0.5;
  }
}

const subtleNoise = (x: number, y: number, s: number) => {
  const sinX = Math.sin(x * 12.9898 + y * 78.233 + s * 43758.5453);
  return (sinX - Math.floor(sinX));
};

// Precise number input component
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

  useEffect(() => {
    const parsedTemp = parseFloat(tempValue);
    if (isNaN(parsedTemp) || parsedTemp !== value) {
      setTempValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setTempValue(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
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

// Default custom sandbox biomes (V2 structure, multi-point)
const DEFAULT_SANDBOX_BIOMES: Biome[] = [
  {
    id: "sandbox_valley",
    name: "Sandbox Valley",
    color: "#4db6ac",
    description: "A custom sandbox biome representing a warm, temperate valley.",
    baseRarity: 1.0,
    points: [
      {
        temp: { min: -0.4, max: 0.4 },
        hum: { min: -0.4, max: 0.4 },
        cont: { min: -0.5, max: 0.5 },
        eros: { min: -0.5, max: 0.5 },
        weird: { min: -0.5, max: 0.5 },
        depth: { min: -0.5, max: 0.5 }
      }
    ]
  },
  {
    id: "sandbox_peaks",
    name: "Sandbox Peaks",
    color: "#ff7043",
    description: "A rugged, custom sandbox biome representing sharp, frozen peaks.",
    baseRarity: 0.5,
    points: [
      {
        temp: { min: -1.0, max: -0.3 },
        hum: { min: -0.8, max: -0.2 },
        cont: { min: 0.2, max: 1.0 },
        eros: { min: 0.3, max: 0.9 },
        weird: { min: 0.4, max: 1.0 },
        depth: { min: 0.8, max: 2.0 }
      }
    ]
  }
];

// Helper to calculate 6D climate distance to a specific biome placement point
const calculatePointDistance = (
  t: number, h: number, c: number, e: number, w: number, d: number,
  pt: ClimatePoint
) => {
  // Use midpoint as the representative parameter point coordinate for MultiNoise nearest-neighbor matching
  const midT = (pt.temp.min + pt.temp.max) / 2;
  const midH = (pt.hum.min + pt.hum.max) / 2;
  const midC = (pt.cont.min + pt.cont.max) / 2;
  const midE = (pt.eros.min + pt.eros.max) / 2;
  const midW = (pt.weird.min + pt.weird.max) / 2;
  const midD = (pt.depth.min + pt.depth.max) / 2;

  const dT = t - midT;
  const dH = h - midH;
  const dC = c - midC;
  const dE = e - midE;
  const dW = w - midW;
  const dD = d - midD;

  return Math.sqrt(dT*dT + dH*dH + dC*dC + dE*dE + dW*dW + dD*dD);
};

// Helper to calculate hypervolume of a 6D point box
const calculatePointVolume = (pt: ClimatePoint) => {
  const dT = Math.max(0.01, pt.temp.max - pt.temp.min);
  const dH = Math.max(0.01, pt.hum.max - pt.hum.min);
  const dC = Math.max(0.01, pt.cont.max - pt.cont.min);
  const dE = Math.max(0.01, pt.eros.max - pt.eros.min);
  const dW = Math.max(0.01, pt.weird.max - pt.weird.min);
  const dD = Math.max(0.01, pt.depth.max - pt.depth.min);
  return dT * dH * dC * dE * dW * dD;
};

// Helper to find the original default base rarity of a biome across all dimensions & sandboxes
const getOriginalBaseRarity = (biomeId: string): number => {
  for (const d of BACKWOODS_DIMENSIONS) {
    const found = d.biomes.find(b => b.id === biomeId);
    if (found) return found.baseRarity;
  }
  for (const d of VANILLA_DIMENSIONS) {
    const found = d.biomes.find(b => b.id === biomeId);
    if (found) return found.baseRarity;
  }
  const foundSandbox = DEFAULT_SANDBOX_BIOMES.find(b => b.id === biomeId);
  if (foundSandbox) return foundSandbox.baseRarity;
  return 1.0;
};

export default function App() {
  // Dimension state: custom Backwoods dimensions, Vanilla, or custom_sandbox
  const [selectedDimensionId, setSelectedDimensionId] = useState<string>("the_grain");
  const [dimensionBiomes, setDimensionBiomes] = useState<{ [dimId: string]: Biome[] }>(() => {
    const initial: { [dimId: string]: Biome[] } = {};
    for (const d of BACKWOODS_DIMENSIONS) {
      initial[d.id] = d.biomes;
    }
    for (const d of VANILLA_DIMENSIONS) {
      initial[d.id] = d.biomes;
    }
    
    // Only load the custom sandbox from local storage
    const savedSandbox = localStorage.getItem("sandbox_biomes_v3");
    if (savedSandbox) {
      try {
        initial["custom_sandbox"] = JSON.parse(savedSandbox);
      } catch (e) {
        initial["custom_sandbox"] = DEFAULT_SANDBOX_BIOMES;
      }
    } else {
      initial["custom_sandbox"] = DEFAULT_SANDBOX_BIOMES;
    }
    return initial;
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [weightInputVal, setWeightInputVal] = useState<string>("");

  // LocalStorage persistence for ONLY custom sandbox biomes
  useEffect(() => {
    if (dimensionBiomes["custom_sandbox"]) {
      localStorage.setItem("sandbox_biomes_v3", JSON.stringify(dimensionBiomes["custom_sandbox"]));
    }
  }, [dimensionBiomes["custom_sandbox"]]);

  const biomes = useMemo(() => {
    return dimensionBiomes[selectedDimensionId] || [];
  }, [dimensionBiomes, selectedDimensionId]);

  const selectedDimension = useMemo(() => {
    const d = BACKWOODS_DIMENSIONS.find(x => x.id === selectedDimensionId) || 
              VANILLA_DIMENSIONS.find(x => x.id === selectedDimensionId);
    if (d) return d;
    if (selectedDimensionId === "custom_sandbox") {
      return {
        id: "custom_sandbox",
        name: "Custom Sandbox",
        description: "Your own custom testing dimension containing your authored biomes.",
        seaLevel: 63,
        defaultBlock: "stone",
        defaultFixed: { temp: 0.0, hum: 0.0, cont: 0.0, eros: 0.0, weird: 0.0, depth: 0.0 }
      };
    }
    return null;
  }, [selectedDimensionId]);

  // Selected biome for manual point details / sliders
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>("splinter_nest");

  useEffect(() => {
    if (biomes.length > 0) {
      const exists = biomes.some(b => b.id === selectedBiomeId);
      if (!exists) {
        setSelectedBiomeId(biomes[0].id);
      }
    } else {
      setSelectedBiomeId("");
    }
  }, [biomes, selectedBiomeId]);

  // Noise Router Inputs replaced with static constants as the interactive panel was removed
  const routerTemp = 0.0;
  const routerHum = 0.0;
  const routerCont = 0.0;
  const routerEros = 0.0;
  const routerWeird = 0.0;
  const routerDepth = 0.0;

  // Selected Point Index for details slider panel
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);

  useEffect(() => {
    setSelectedPointIndex(0);
  }, [selectedBiomeId]);

  // Seed settings for 2D Map simulation
  const [seedInput, setSeedInput] = useState<string>("42");

  const simulationSeed = useMemo(() => {
    const trimmed = seedInput.trim();
    if (!trimmed) return 0;
    if (/^[+-]?\d+$/.test(trimmed)) {
      try {
        const big = BigInt(trimmed);
        const MIN_LONG = -9223372036854775808n;
        const MAX_LONG = 9223372036854775807n;
        if (big >= MIN_LONG && big <= MAX_LONG) {
          return Number(big);
        }
      } catch (e) {}
    }
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = ((hash << 5) - hash) + trimmed.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }, [seedInput]);

  // Seed-based noise samplers initialized when simulationSeed changes
  const noiseSamplers = useMemo(() => {
    const createRng = (channelSeed: number) => {
      let s = channelSeed;
      return () => {
        s = (s * 1664525 + 1013904223) | 0;
        return (s >>> 0) / 4294967296;
      };
    };

    return {
      temp: new DoublePerlin(createRng(simulationSeed ^ 111111), 3),
      hum: new DoublePerlin(createRng(simulationSeed ^ 222222), 3),
      cont: new DoublePerlin(createRng(simulationSeed ^ 333333), 4),
      eros: new DoublePerlin(createRng(simulationSeed ^ 444444), 3),
      weird: new DoublePerlin(createRng(simulationSeed ^ 555555), 3),
      depth: new DoublePerlin(createRng(simulationSeed ^ 666666), 3),
      river: new DoublePerlin(createRng(simulationSeed ^ 777777), 2),
    };
  }, [simulationSeed]);

  // F3 Diagnostics Input & Parsing removed

  const handleUpdateCustomBiomeColor = (biomeId: string, color: string) => {
    setDimensionBiomes(prev => {
      const current = prev[selectedDimensionId] || [];
      const updated = current.map(b => b.id === biomeId ? { ...b, color } : b);
      return { ...prev, [selectedDimensionId]: updated };
    });
  };

  const handleUpdateCustomBiomeName = (biomeId: string, name: string) => {
    setDimensionBiomes(prev => {
      const current = prev[selectedDimensionId] || [];
      const updated = current.map(b => b.id === biomeId ? { ...b, name } : b);
      return { ...prev, [selectedDimensionId]: updated };
    });
  };

  const handleUpdateCustomBiomeBaseRarity = (biomeId: string, baseRarity: number, changeType?: "common" | "rare" | "multiply", multiplierFactor?: number) => {
    setDimensionBiomes(prev => {
      const current = prev[selectedDimensionId] || [];
      const updated = current.map(b => {
        if (b.id !== biomeId) return b;
        
        // Update points if we are editing sliders
        const updatedPoints = b.points.map((p, pIdx) => {
          if (pIdx !== selectedPointIndex) return p;
          
          if (changeType === "common") {
            // Reset to standard common wide ranges
            return {
              temp: { min: -0.3, max: 0.3 },
              hum: { min: -0.3, max: 0.3 },
              cont: { min: -0.3, max: 0.3 },
              eros: { min: -0.3, max: 0.3 },
              weird: { min: -0.3, max: 0.3 },
              depth: { min: -1.0, max: 1.0 }
            };
          } else if (changeType === "rare") {
            // Tighten to rare narrow ranges
            return {
              temp: { min: -0.1, max: 0.1 },
              hum: { min: -0.1, max: 0.1 },
              cont: { min: 0.4, max: 0.6 },
              eros: { min: 0.3, max: 0.5 },
              weird: { min: 0.2, max: 0.4 },
              depth: { min: -0.5, max: 0.5 }
            };
          } else if (changeType === "multiply" && multiplierFactor !== undefined) {
            // Scale the ranges based on multiplier factor
            const scaleRange = (range: { min: number, max: number }, factor: number) => {
              const mid = (range.min + range.max) / 2;
              const halfWidth = (range.max - range.min) / 2;
              // Wider if factor > 1 (making it more common/weighty), narrower if factor < 1 (making it more rare)
              const newHalfWidth = Math.max(0.01, halfWidth * factor);
              return {
                min: parseFloat(Math.max(-2.0, Math.min(2.0, mid - newHalfWidth)).toFixed(4)),
                max: parseFloat(Math.max(-2.0, Math.min(2.0, mid + newHalfWidth)).toFixed(4))
              };
            };
            return {
              temp: scaleRange(p.temp, multiplierFactor),
              hum: scaleRange(p.hum, multiplierFactor),
              cont: scaleRange(p.cont, multiplierFactor),
              eros: scaleRange(p.eros, multiplierFactor),
              weird: scaleRange(p.weird, multiplierFactor),
              depth: scaleRange(p.depth, multiplierFactor)
            };
          }
          return p;
        });

        return {
          ...b,
          baseRarity: parseFloat(Math.max(0.0001, Math.min(100.0, baseRarity)).toFixed(4)),
          points: updatedPoints
        };
      });
      return { ...prev, [selectedDimensionId]: updated };
    });
  };

  const handleCommitWeight = (biome: Biome, valStr: string) => {
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      const newWeight = Math.max(0.0001, Math.min(100.0, parsed));
      const currentWeight = biome.baseRarity;
      if (Math.abs(newWeight - currentWeight) > 0.00001) {
        // Calculate multiplier factor based on weight ratio change
        const factor = newWeight / currentWeight;
        handleUpdateCustomBiomeBaseRarity(biome.id, newWeight, "multiply", factor);
      }
    } else {
      // Revert to current biome's weight if invalid input
      setWeightInputVal(biome.baseRarity.toString());
    }
  };

  const handleResetBiomeToDefault = (biomeId: string) => {
    let originalBiome: Biome | undefined;
    for (const d of BACKWOODS_DIMENSIONS) {
      const found = d.biomes.find(b => b.id === biomeId);
      if (found) { originalBiome = found; break; }
    }
    if (!originalBiome) {
      for (const d of VANILLA_DIMENSIONS) {
        const found = d.biomes.find(b => b.id === biomeId);
        if (found) { originalBiome = found; break; }
      }
    }
    if (!originalBiome) {
      originalBiome = DEFAULT_SANDBOX_BIOMES.find(b => b.id === biomeId);
    }

    if (originalBiome) {
      const orig = originalBiome;
      setDimensionBiomes(prev => {
        const current = prev[selectedDimensionId] || [];
        const updated = current.map(b => b.id === biomeId ? { ...b, baseRarity: orig.baseRarity, points: JSON.parse(JSON.stringify(orig.points)) } : b);
        return { ...prev, [selectedDimensionId]: updated };
      });
      setSelectedPointIndex(0);
    }
  };

  const handleApplyClimateTemplate = (templateValues: {
    temp: { min: number; max: number };
    hum: { min: number; max: number };
    cont: { min: number; max: number };
    eros: { min: number; max: number };
    weird: { min: number; max: number };
    depth: { min: number; max: number };
  }) => {
    setDimensionBiomes(prev => {
      const current = prev[selectedDimensionId] || [];
      const updated = current.map(b => {
        if (b.id !== selectedBiomeId) return b;
        return {
          ...b,
          points: b.points.map((p, pIdx) => {
            if (pIdx !== selectedPointIndex) return p;
            return {
              temp: { min: parseFloat(templateValues.temp.min.toFixed(4)), max: parseFloat(templateValues.temp.max.toFixed(4)) },
              hum: { min: parseFloat(templateValues.hum.min.toFixed(4)), max: parseFloat(templateValues.hum.max.toFixed(4)) },
              cont: { min: parseFloat(templateValues.cont.min.toFixed(4)), max: parseFloat(templateValues.cont.max.toFixed(4)) },
              eros: { min: parseFloat(templateValues.eros.min.toFixed(4)), max: parseFloat(templateValues.eros.max.toFixed(4)) },
              weird: { min: parseFloat(templateValues.weird.min.toFixed(4)), max: parseFloat(templateValues.weird.max.toFixed(4)) },
              depth: { min: parseFloat(templateValues.depth.min.toFixed(4)), max: parseFloat(templateValues.depth.max.toFixed(4)) }
            };
          })
        };
      });
      return { ...prev, [selectedDimensionId]: updated };
    });
  };

  const handleAddCustomBiome = () => {
    const current = dimensionBiomes[selectedDimensionId] || [];
    const id = `custom_biome_${Date.now()}`;
    const newBiome: Biome = {
      id,
      name: `Custom Biome ${current.length + 1}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      description: "A custom biome with adjustable 6D climate placement regions.",
      baseRarity: 1.0,
      points: [
        {
          temp: { min: -0.5, max: 0.5 },
          hum: { min: -0.5, max: 0.5 },
          cont: { min: -0.5, max: 0.5 },
          eros: { min: -0.5, max: 0.5 },
          weird: { min: -0.5, max: 0.5 },
          depth: { min: -0.5, max: 0.5 }
        }
      ]
    };
    setDimensionBiomes(prev => {
      const cur = prev[selectedDimensionId] || [];
      return { ...prev, [selectedDimensionId]: [...cur, newBiome] };
    });
    setSelectedBiomeId(id);
  };

  const handleDeleteCustomBiome = (biomeId: string) => {
    setDimensionBiomes(prev => {
      const current = prev[selectedDimensionId] || [];
      const updated = current.filter(b => b.id !== biomeId);
      if (selectedBiomeId === biomeId) {
        setSelectedBiomeId(updated[0]?.id || "");
      }
      return { ...prev, [selectedDimensionId]: updated };
    });
  };

  // Manage Sandbox Biome placement points
  const handleAddPointToSelectedBiome = () => {
    setDimensionBiomes(prev => {
      const current = prev[selectedDimensionId] || [];
      const updated = current.map(b => {
        if (b.id !== selectedBiomeId) return b;
        return {
          ...b,
          points: [
            ...b.points,
            {
              temp: { min: -0.2, max: 0.2 },
              hum: { min: -0.2, max: 0.2 },
              cont: { min: -0.2, max: 0.2 },
              eros: { min: -0.2, max: 0.2 },
              weird: { min: -0.2, max: 0.2 },
              depth: { min: -0.2, max: 0.2 }
            }
          ]
        };
      });
      return { ...prev, [selectedDimensionId]: updated };
    });

    // Select the newly added point
    const currentList = dimensionBiomes[selectedDimensionId] || [];
    const currentBiome = currentList.find(b => b.id === selectedBiomeId);
    if (currentBiome) {
      setSelectedPointIndex(currentBiome.points.length);
    }
  };

  const handleDeletePointFromSelectedBiome = (idx: number) => {
    const currentList = dimensionBiomes[selectedDimensionId] || [];
    const currentBiome = currentList.find(b => b.id === selectedBiomeId);
    if (!currentBiome || currentBiome.points.length <= 1) return;

    setDimensionBiomes(prev => {
      const current = prev[selectedDimensionId] || [];
      const updated = current.map(b => {
        if (b.id !== selectedBiomeId) return b;
        return {
          ...b,
          points: b.points.filter((_, pIdx) => pIdx !== idx)
        };
      });
      return { ...prev, [selectedDimensionId]: updated };
    });
    setSelectedPointIndex(0);
  };

  const handlePointRangeChange = (
    biomeId: string,
    pointIdx: number,
    dim: "temp" | "hum" | "cont" | "eros" | "weird" | "depth",
    bound: "min" | "max",
    val: number
  ) => {
    setDimensionBiomes(prev => {
      const current = prev[selectedDimensionId] || [];
      const updated = current.map(b => {
        if (b.id !== biomeId) return b;
        return {
          ...b,
          points: b.points.map((p, pIdx) => {
            if (pIdx !== pointIdx) return p;
            return {
              ...p,
              [dim]: {
                ...p[dim],
                [bound]: parseFloat(val.toFixed(4))
              }
            };
          })
        };
      });
      return { ...prev, [selectedDimensionId]: updated };
    });
  };

  const handleRestoreDimensionDefaults = () => {
    let defaults: Biome[] = [];
    if (selectedDimensionId === "custom_sandbox") {
      defaults = DEFAULT_SANDBOX_BIOMES;
    } else {
      const dim = BACKWOODS_DIMENSIONS.find(d => d.id === selectedDimensionId) || 
                  VANILLA_DIMENSIONS.find(d => d.id === selectedDimensionId);
      if (dim) {
        defaults = dim.biomes;
      }
    }
    if (defaults.length > 0) {
      setDimensionBiomes(prev => ({
        ...prev,
        [selectedDimensionId]: defaults
      }));
      setSelectedBiomeId(defaults[0]?.id || "");
    }
  };

  // Rarity calculations based on 6D climate point hypervolumes and baseRarity
  const biomeRarities = useMemo(() => {
    let totalScore = 0;
    const items = biomes.map(biome => {
      let totalVolume = 0;
      for (const pt of biome.points) {
        totalVolume += calculatePointVolume(pt);
      }
      const score = totalVolume * biome.baseRarity;
      totalScore += score;
      return {
        id: biome.id,
        name: biome.name,
        color: biome.color,
        volume: totalVolume,
        score
      };
    });

    return items.map(item => {
      const spacePercent = totalScore > 0 ? (item.score / totalScore) * 100 : 0;
      
      // Determine display visual rank
      let rarityLabel = "Common";
      let colorClass = "text-emerald-400";
      if (spacePercent < 0.1) {
        rarityLabel = "Mythic";
        colorClass = "text-fuchsia-400 font-extrabold";
      } else if (spacePercent < 0.5) {
        rarityLabel = "Ultra Rare";
        colorClass = "text-pink-400 font-bold";
      } else if (spacePercent < 2.0) {
        rarityLabel = "Rare";
        colorClass = "text-amber-400 font-semibold";
      } else if (spacePercent < 6.0) {
        rarityLabel = "Uncommon";
        colorClass = "text-sky-400";
      }

      return {
        ...item,
        spacePercent,
        rarityLabel,
        colorClass
      };
    }).sort((a, b) => b.spacePercent - a.spacePercent);
  }, [biomes]);

  // Core distance matching algorithms: matching a query point to all biomes
  const matchingResults = useMemo(() => {
    const list = biomes.map(biome => {
      let minDistance = Infinity;
      let matchedPointIdx = 0;

      biome.points.forEach((pt, idx) => {
        const rawDist = calculatePointDistance(
          routerTemp, routerHum, routerCont, routerEros, routerWeird, routerDepth,
          pt
        );
        // Apply baseRarity as a divisor to scale down distance for high-weight biomes (making them match easier)
        const dist = rawDist / (biome.baseRarity || 1.0);
        if (dist < minDistance) {
          minDistance = dist;
          matchedPointIdx = idx;
        }
      });

      // Map distance [0.0, 2.5] onto similarity percentage
      const similarity = Math.max(0, Math.min(100, (1 - minDistance / 2.0) * 100));

      return {
        biome,
        distance: minDistance,
        similarity,
        matchedPointIdx
      };
    });

    // Sort by distance ascending (closest match first)
    const sorted = [...list].sort((a, b) => a.distance - b.distance);
    return {
      best: sorted[0] || null,
      topMatches: sorted.slice(0, 10)
    };
  }, [biomes, routerTemp, routerHum, routerCont, routerEros, routerWeird, routerDepth]);

  // Selected biome structure
  const selectedBiome = useMemo(() => {
    return biomes.find(b => b.id === selectedBiomeId) || biomes[0];
  }, [biomes, selectedBiomeId]);

  // Active parameter point details for sliders
  const activePoint = useMemo(() => {
    if (!selectedBiome || selectedBiome.points.length === 0) return null;
    return selectedBiome.points[selectedPointIndex] || selectedBiome.points[0];
  }, [selectedBiome, selectedPointIndex]);

  // Sync weightInputVal when selectedBiome changes or its baseRarity is updated by other actions
  useEffect(() => {
    if (selectedBiome) {
      setWeightInputVal(selectedBiome.baseRarity.toString());
    }
  }, [selectedBiomeId, selectedBiome?.baseRarity]);

  // Canvas visualizer maps
  const [mapMode, setMapMode] = useState<"slice" | "chunkbase">("slice");
  const [xAxisDim, setXAxisDim] = useState<string>("temp");
  const [yAxisDim, setYAxisDim] = useState<string>("hum");

  const [chunkbaseX, setChunkbaseX] = useState<number>(0);
  const [chunkbaseZ, setChunkbaseZ] = useState<number>(0);
  const [chunkbaseZoom, setChunkbaseZoom] = useState<number>(1024);

  const [showOceans, setShowOceans] = useState<boolean>(true);
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; cx: number; cz: number } | null>(null);

  // Hover coordinate inspection state
  const [hoveredCoords, setHoveredCoords] = useState<{
    x: number;
    z: number;
    t: number;
    h: number;
    c: number;
    e: number;
    w: number;
    d: number;
    biomeName: string | null;
    biomeColor: string | null;
    distance: number;
    similarity: number;
  } | null>(null);

  // Helper for computing simulated Multi-Noise values at any given (X, Z) in the world
  const getNoiseAtCoordinates = useCallback((worldX: number, worldZ: number, seed: number) => {
    const t = noiseSamplers.temp.sample(worldX * 0.0035, worldZ * 0.0035);
    const h = noiseSamplers.hum.sample(worldX * 0.0035, worldZ * 0.0035);
    const c = noiseSamplers.cont.sample(worldX * 0.0022, worldZ * 0.0022);
    const e = noiseSamplers.eros.sample(worldX * 0.0032, worldZ * 0.0032);
    const w = noiseSamplers.weird.sample(worldX * 0.0045, worldZ * 0.0045);
    const d = noiseSamplers.depth.sample(worldX * 0.0028, worldZ * 0.0028);
    const riverVal = noiseSamplers.river.sample(worldX * 0.015, worldZ * 0.015);
    return { t, h, c, e, w, d, riverVal };
  }, [noiseSamplers]);

  // Map arbitrary 6D climate back to closest matching biome
  const getBiomeAtNoise = useCallback((
    t: number, h: number, c: number, e: number, w: number, d: number, riverVal: number
  ) => {
    let bestBiome: Biome | null = null;
    let minDistance = Infinity;

    for (const b of biomes) {
      for (const pt of b.points) {
        const rawDist = calculatePointDistance(t, h, c, e, w, d, pt);
        const dist = rawDist / (b.baseRarity || 1.0);
        if (dist < minDistance) {
          minDistance = dist;
          bestBiome = b;
        }
      }
    }

    // Standard water overlays (Oceans & Rivers) - specific to Overworld dimension
    if (selectedDimensionId === "overworld") {
      if (showOceans && c < -0.19) {
        // Find nearest ocean biome based on temperature and humidity
        const oceanBiomes = biomes.filter(b => b.id.includes("ocean"));
        let minOceanDist = Infinity;
        let matchedOcean = bestBiome;
        for (const b of oceanBiomes) {
          for (const pt of b.points) {
            const rawDist = calculatePointDistance(t, h, c, e, w, d, pt);
            const dist = rawDist / (b.baseRarity || 1.0);
            if (dist < minOceanDist) {
              minOceanDist = dist;
              matchedOcean = b;
            }
          }
        }
        if (matchedOcean) {
          bestBiome = matchedOcean;
        }
      } else if (showRivers && Math.abs(riverVal - 0.5) < 0.045 && c > -0.15) {
        // Return standard river or frozen river based on temperature
        const riverBiome = biomes.find(b => b.id === (t < -0.45 ? "frozen_river" : "river"));
        if (riverBiome) bestBiome = riverBiome;
      }
    }

    return bestBiome;
  }, [biomes, showOceans, showRivers, selectedDimensionId]);

  // Main canvas rendering
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
      // 6D Coordinate Slice Projection
      for (let py = 0; py < height; py += step) {
        for (let px = 0; px < width; px += step) {
          const valX = -1.0 + (px / width) * 2.0;
          const valY = 1.0 - (py / height) * 2.0;

          let t = routerTemp;
          let h = routerHum;
          let c = routerCont;
          let e = routerEros;
          let w = routerWeird;
          let d = routerDepth;

          if (xAxisDim === "temp") t = valX;
          else if (xAxisDim === "hum") h = valX;
          else if (xAxisDim === "cont") c = valX;
          else if (xAxisDim === "eros") e = valX;
          else if (xAxisDim === "weird") w = valX;
          else if (xAxisDim === "depth") d = valX;

          if (yAxisDim === "temp") t = valY;
          else if (yAxisDim === "hum") h = valY;
          else if (yAxisDim === "cont") c = valY;
          else if (yAxisDim === "eros") e = valY;
          else if (yAxisDim === "weird") w = valY;
          else if (yAxisDim === "depth") d = valY;

          const matched = getBiomeAtNoise(t, h, c, e, w, d, 0.5);
          const biomeColor = matched ? matched.color : "#0a0707";

          const r = parseInt(biomeColor.slice(1, 3), 16);
          const g = parseInt(biomeColor.slice(3, 5), 16);
          const b = parseInt(biomeColor.slice(5, 7), 16);

          const n = subtleNoise(px, py, simulationSeed) * 12 - 6;
          const r_final = Math.max(0, Math.min(255, r + n));
          const g_final = Math.max(0, Math.min(255, g + n));
          const b_final = Math.max(0, Math.min(255, b + n));

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
      // Chunkbase 2D World Map Simulation
      for (let py = 0; py < height; py += step) {
        for (let px = 0; px < width; px += step) {
          const worldX = chunkbaseX + (px - width / 2) * (chunkbaseZoom / width);
          const worldZ = chunkbaseZ + (py - height / 2) * (chunkbaseZoom / height);

          const { t, h, c, e, w, d, riverVal } = getNoiseAtCoordinates(worldX, worldZ, simulationSeed);
          const matched = getBiomeAtNoise(t, h, c, e, w, d, riverVal);
          const biomeColor = matched ? matched.color : "#0a0707";

          const r = parseInt(biomeColor.slice(1, 3), 16);
          const g = parseInt(biomeColor.slice(3, 5), 16);
          const b = parseInt(biomeColor.slice(5, 7), 16);

          const n = subtleNoise(px, py, simulationSeed) * 10 - 5;
          const r_final = Math.max(0, Math.min(255, r + n));
          const g_final = Math.max(0, Math.min(255, g + n));
          const b_final = Math.max(0, Math.min(255, b + n));

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
    biomes, xAxisDim, yAxisDim, routerTemp, routerHum, routerCont, routerEros, routerWeird, routerDepth,
    mapMode, chunkbaseX, chunkbaseZ, chunkbaseZoom, showOceans, showRivers, simulationSeed,
    getNoiseAtCoordinates, getBiomeAtNoise, isDragging, isDraggingSlider
  ]);

  // Canvas Interactions
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
        const { t, h, c, e: eros, w, d, riverVal } = getNoiseAtCoordinates(worldX, worldZ, simulationSeed);
        const matched = getBiomeAtNoise(t, h, c, eros, w, d, riverVal);

        let minDistance = Infinity;
        if (matched) {
          matched.points.forEach(pt => {
            const rawDist = calculatePointDistance(t, h, c, eros, w, d, pt);
            const dist = rawDist / (matched.baseRarity || 1.0);
            if (dist < minDistance) minDistance = dist;
          });
        }
        const similarity = Math.max(0, Math.min(100, (1 - minDistance / 2.0) * 100));

        setHoveredCoords({
          x: worldX,
          z: worldZ,
          t,
          h,
          c,
          e: eros,
          w,
          d,
          biomeName: matched ? matched.name : "None",
          biomeColor: matched ? matched.color : null,
          distance: minDistance,
          similarity
        });
      } else {
        const valX = -1.0 + (px / canvas.width) * 2.0;
        const valY = 1.0 - (py / canvas.height) * 2.0;

        let t = routerTemp;
        let h = routerHum;
        let c = routerCont;
        let eVal = routerEros;
        let w = routerWeird;
        let d = routerDepth;

        if (xAxisDim === "temp") t = valX;
        else if (xAxisDim === "hum") h = valX;
        else if (xAxisDim === "cont") c = valX;
        else if (xAxisDim === "eros") eVal = valX;
        else if (xAxisDim === "weird") w = valX;
        else if (xAxisDim === "depth") d = valX;

        if (yAxisDim === "temp") t = valY;
        else if (yAxisDim === "hum") h = valY;
        else if (yAxisDim === "cont") c = valY;
        else if (yAxisDim === "eros") eVal = valY;
        else if (yAxisDim === "weird") w = valY;
        else if (yAxisDim === "depth") d = valY;

        const matched = getBiomeAtNoise(t, h, c, eVal, w, d, 0.5);

        let minDistance = Infinity;
        if (matched) {
          matched.points.forEach(pt => {
            const rawDist = calculatePointDistance(t, h, c, eVal, w, d, pt);
            const dist = rawDist / (matched.baseRarity || 1.0);
            if (dist < minDistance) minDistance = dist;
          });
        }
        const similarity = Math.max(0, Math.min(100, (1 - minDistance / 2.0) * 100));

        setHoveredCoords({
          x: parseFloat(valX.toFixed(3)),
          z: parseFloat(valY.toFixed(3)),
          t, h, c, e: eVal, w, d,
          biomeName: matched ? matched.name : "None",
          biomeColor: matched ? matched.color : null,
          distance: minDistance,
          similarity
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
    <div className="min-h-screen w-full flex flex-col bg-[#070505] text-[#a4a090] font-sans antialiased selection:bg-[#ff7043] selection:text-white overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <header className="border-b border-[#1c1212] bg-[#0c0808] py-4 px-4 sm:px-6 shrink-0">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#ff7043] rounded flex items-center justify-center text-[#080808] shrink-0">
              <Compass className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
                Backwoods Biome Rarity Calculator <span className="text-[10px] bg-[#221010] text-[#ff7043] px-2 py-0.5 rounded border border-[#521313] font-mono">1.21.1 Multi-Noise</span>
              </h1>
              <p className="text-xs text-[#8c8779] mt-0.5">Custom Mod Dimensions & Mojang Multi-Noise 6D Coordinate Matcher</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#110c0c] border border-[#221313] px-3 py-2 rounded self-start sm:self-auto">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[#8c8779] font-mono">Precision: 6D Noise Matrix</span>
          </div>
        </div>
      </header>

      {/* CORE CONTENT LAYOUT */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT COLUMN: SELECTION, ROUTER INPUTS, SLIDERS & DIAGNOSTICS (7 COLS) */}
        <section className="lg:col-span-7 flex flex-col gap-6 h-full overflow-y-auto pr-0 lg:pr-1">
          
          {/* DIMENSION SELECTOR & LIST */}
          <div className="bg-[#0c0808] border border-[#1c1212] rounded-xl p-4 sm:p-5">
            <div className="bg-[#110c0c] border border-[#221313] p-3 rounded-lg mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-[10px] text-[#ff7043] font-mono uppercase tracking-wider font-bold">
                  Active Worldgen Dimension
                </label>
                <select
                  value={selectedDimensionId}
                  onChange={(e) => setSelectedDimensionId(e.target.value)}
                  className="bg-[#050303] border border-[#421712] rounded px-3 py-1.5 text-[#ffab91] text-xs font-mono focus:outline-none focus:border-[#ff7043] cursor-pointer sm:w-72"
                >
                  <optgroup label="Backwoods Mod Dimensions" className="text-gray-400 bg-[#0c0808]">
                    <option value="the_grain" className="text-white bg-[#050303]">The Grain (6 Biomes)</option>
                    <option value="the_petrified_weald" className="text-white bg-[#050303]">The Petrified Weald (5 Biomes)</option>
                    <option value="backwoods" className="text-white bg-[#050303]">The Backwoods (3 Biomes)</option>
                    <option value="the_familiar" className="text-white bg-[#050303]">The Familiar (8 Biomes)</option>
                    <option value="rotting" className="text-white bg-[#050303]">Rotting (1 Biome)</option>
                    <option value="the_still" className="text-white bg-[#050303]">The Still (1 Biome)</option>
                    <option value="the_sub_strata" className="text-white bg-[#050303]">The Sub Strata (1 Biome)</option>
                    <option value="loss" className="text-white bg-[#050303]">Loss (1 Biome)</option>
                  </optgroup>
                  <optgroup label="Vanilla Minecraft Reference" className="text-gray-400 bg-[#0c0808]">
                    <option value="overworld" className="text-white bg-[#050303]">Overworld (53 Biomes)</option>
                    <option value="nether" className="text-white bg-[#050303]">Nether (5 Biomes)</option>
                  </optgroup>
                  <optgroup label="Sandbox Arena" className="text-gray-400 bg-[#0c0808]">
                    <option value="custom_sandbox" className="text-white bg-[#050303]">Custom Sandbox ({(dimensionBiomes["custom_sandbox"] || []).length} Biomes)</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {selectedDimension && (
              <div className="bg-[#110a0a] border border-[#301614] p-3 rounded-lg mb-4 text-xs">
                <p className="text-[#a4a090] leading-relaxed mb-2.5">
                  {selectedDimension.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-[#1f1313] pt-2">
                  <div className="bg-[#070505] p-2 rounded border border-[#1c1212] flex items-center justify-between">
                    <span className="text-[#70685c]">Sea Level:</span>
                    <span className="text-[#ffab91] font-bold">
                      {selectedDimension.seaLevel !== undefined ? selectedDimension.seaLevel : "N/A"}
                    </span>
                  </div>
                  <div className="bg-[#070505] p-2 rounded border border-[#1c1212] flex items-center justify-between">
                    <span className="text-[#70685c]">Default Block:</span>
                    <span className="text-[#4db6ac] font-bold truncate max-w-[120px]" title={selectedDimension.defaultBlock || "stone"}>
                      {selectedDimension.defaultBlock || "stone"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold tracking-wider uppercase text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#ff7043]" />
                Registered Biomes Directory
              </h2>
              {selectedDimensionId === "custom_sandbox" && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddCustomBiome}
                    className="text-[11px] text-white hover:bg-[#203a20] transition flex items-center gap-1.5 bg-[#142914] border border-[#235e23] px-2.5 py-1.5 rounded cursor-pointer font-bold font-mono"
                  >
                    <Plus className="h-3 w-3 text-[#4db6ac]" />
                    Add Biome
                  </button>
                  <button 
                    onClick={handleRestoreDimensionDefaults}
                    className="text-[11px] text-red-400 hover:bg-red-950/20 transition flex items-center gap-1 bg-[#1a0c0c] border border-[#5c1a1a] px-2.5 py-1.5 rounded cursor-pointer font-bold font-mono"
                    title="Restore default biomes and settings for this dimension"
                  >
                    <RefreshCw className="h-3 w-3 text-red-500" />
                    Reset Sandbox
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
              {biomes.map(b => {
                const isSelected = b.id === selectedBiomeId;
                const rarityInfo = biomeRarities.find(r => r.id === b.id);
                const isEditable = selectedDimensionId === "custom_sandbox";
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBiomeId(b.id)}
                    className={`p-2.5 rounded-lg text-left border transition flex flex-col justify-between cursor-pointer ${
                      isSelected 
                        ? "bg-[#221010] border-[#ff7043] text-white shadow-md shadow-[#ff7043]/5" 
                        : "bg-[#0d0909] border-[#1f1313] hover:border-[#3d2727] text-[#a4a090]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <div className="flex items-center gap-1.5 truncate flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                        {isEditable ? (
                          <>
                            <input
                              type="color"
                              value={b.color}
                              onChange={(e) => handleUpdateCustomBiomeColor(b.id, e.target.value)}
                              className="w-3.5 h-3.5 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0 focus:outline-none"
                              title="Set biome color"
                            />
                            <input
                              type="text"
                              value={b.name}
                              onChange={(e) => handleUpdateCustomBiomeName(b.id, e.target.value)}
                              className="bg-transparent border-b border-transparent hover:border-[#ff7043]/30 focus:border-[#ff7043] text-white font-semibold text-xs truncate focus:outline-none w-full py-0.5 font-mono"
                            />
                          </>
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                            <span className="font-semibold text-xs truncate font-mono text-white">{b.name}</span>
                          </>
                        )}
                      </div>
                      {isEditable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomBiome(b.id);
                          }}
                          className="p-0.5 text-red-400 hover:text-red-300 hover:bg-[#2c1313] rounded transition shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-[9px] text-[#8c8779] flex items-center justify-between mt-1 font-mono">
                      <span>Occurence:</span>
                      <span className={`font-semibold ${rarityInfo?.colorClass}`}>
                        {rarityInfo ? rarityInfo.spacePercent.toFixed(3) : "0"}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BIOME CONFIGURATION PLACEMENT POINTS */}
          {selectedBiome && (
            <div className="bg-[#0c0808] border border-[#1c1212] rounded-xl p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1c1212] pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: selectedBiome.color }} />
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedBiome.name} Placement Regions</h3>
                    <p className="text-[11px] text-[#8c8779] font-mono">This biome generates in {selectedBiome.points.length} distinct multi-noise region{selectedBiome.points.length > 1 ? "s" : ""}</p>
                  </div>
                </div>

                {selectedDimensionId === "custom_sandbox" && (
                  <button
                    onClick={handleAddPointToSelectedBiome}
                    className="text-[10px] text-emerald-400 hover:bg-[#203a20] transition bg-[#142914] border border-[#235e23] px-2 py-1 rounded font-mono cursor-pointer"
                  >
                    + Add Region
                  </button>
                )}
              </div>

              {/* Point Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-[#1f1313] pb-2">
                {selectedBiome.points.map((pt, idx) => {
                  const vol = calculatePointVolume(pt);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedPointIndex(idx)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                        selectedPointIndex === idx
                          ? "bg-[#2c1512] text-white border-[#ff7043]"
                          : "bg-[#0d0909] text-[#8c8779] border-transparent hover:border-[#3a2222]"
                      }`}
                    >
                      Region #{idx + 1}
                      <span className="text-[9px] bg-[#110c0c] px-1 py-0.5 rounded text-[#70685c]">
                        Vol: {vol.toFixed(4)}
                      </span>
                      {selectedDimensionId === "custom_sandbox" && selectedBiome.points.length > 1 && (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePointFromSelectedBiome(idx);
                          }}
                          className="text-red-400 hover:text-red-300 ml-1 font-bold text-[10px]"
                        >
                          ×
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {activePoint ? (
                <div className="flex flex-col gap-4 mt-1">
                  
                  <div className="flex flex-col gap-3">
                    <div className="bg-[#110c0c] border border-[#221313] rounded-lg p-3 flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-[10px] font-mono text-[#4db6ac] font-bold uppercase tracking-wider block">Biome Generation Weight (Base Rarity)</span>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <span className="text-[10px] text-[#70685c] font-mono">Current Weight:</span>                          <input
                            type="number"
                            step="0.01"
                            min="0.0001"
                            max="100.0"
                            value={weightInputVal}
                            onChange={(e) => setWeightInputVal(e.target.value)}
                            onBlur={() => handleCommitWeight(selectedBiome, weightInputVal)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCommitWeight(selectedBiome, weightInputVal);
                              }
                            }}
                            className="w-16 bg-[#050303] border border-[#235e5e]/40 rounded px-1.5 py-0.5 text-white text-xs font-mono text-center focus:outline-none focus:border-[#4db6ac]"
                          />
                          <button
                            onClick={() => handleResetBiomeToDefault(selectedBiome.id)}
                            className="text-[10px] bg-rose-950/40 text-rose-300 hover:bg-rose-950/60 border border-rose-900/50 rounded px-2 py-0.5 font-mono cursor-pointer transition font-bold"
                            title="Reset biome baseRarity and climate slider values to original defaults"
                          >
                            Reset ({getOriginalBaseRarity(selectedBiome.id).toFixed(2)})
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 mt-1">
                        {/* Standard Absolute Level Presets */}
                        <button 
                          onClick={() => handleUpdateCustomBiomeBaseRarity(selectedBiome.id, 1.0, "common")} 
                          className="px-2 py-1.5 bg-[#0d0909] border border-[#1f1313] hover:bg-[#1f1313] text-[#70685c] rounded text-[11px] cursor-pointer font-mono"
                          title="Set weight to standard common level (1.0) and expand climate ranges"
                        >
                          Common (1.0)
                        </button>
                        <button 
                          onClick={() => handleUpdateCustomBiomeBaseRarity(selectedBiome.id, 0.15, "rare")} 
                          className="px-2 py-1.5 bg-[#0d0909] border border-[#1f1313] hover:bg-[#1f1313] text-[#70685c] rounded text-[11px] cursor-pointer font-mono"
                          title="Set weight to standard rare level (0.15) and narrow climate ranges"
                        >
                          Rare (0.15)
                        </button>
                        {/* Additive presets (adds factor increments of original default rarity) */}
                        <button 
                          onClick={() => {
                            const orig = getOriginalBaseRarity(selectedBiome.id);
                            handleUpdateCustomBiomeBaseRarity(selectedBiome.id, selectedBiome.baseRarity + orig * 1.0, "multiply", 2.0);
                          }} 
                          className="px-2 py-1.5 bg-[#4db6ac]/10 hover:bg-[#4db6ac]/20 border border-[#4db6ac]/25 text-[#4db6ac] rounded text-[11px] cursor-pointer font-mono font-semibold"
                          title="Add 100% of original default base rarity and widen climate ranges by 2.0x"
                        >
                          +1.0x (2x)
                        </button>
                        <button 
                          onClick={() => {
                            const orig = getOriginalBaseRarity(selectedBiome.id);
                            handleUpdateCustomBiomeBaseRarity(selectedBiome.id, selectedBiome.baseRarity + orig * 0.5, "multiply", 1.5);
                          }} 
                          className="px-2 py-1.5 bg-[#4db6ac]/10 hover:bg-[#4db6ac]/20 border border-[#4db6ac]/25 text-[#4db6ac] rounded text-[11px] cursor-pointer font-mono font-semibold"
                          title="Add 50% of original default base rarity and widen climate ranges by 1.5x"
                        >
                          +0.5x (1.5x)
                        </button>
                        <button 
                          onClick={() => {
                            const orig = getOriginalBaseRarity(selectedBiome.id);
                            handleUpdateCustomBiomeBaseRarity(selectedBiome.id, selectedBiome.baseRarity - orig * 0.25, "multiply", 0.75);
                          }} 
                          className="px-2 py-1.5 bg-[#101a18] border border-[#1b3e39] hover:bg-[#1a2e2b] text-white rounded text-[11px] cursor-pointer font-mono font-semibold"
                          title="Subtract 25% of original default base rarity and narrow climate ranges by 0.75x"
                        >
                          -0.25x (0.75x)
                        </button>
                        <button 
                          onClick={() => {
                            const orig = getOriginalBaseRarity(selectedBiome.id);
                            handleUpdateCustomBiomeBaseRarity(selectedBiome.id, selectedBiome.baseRarity - orig * 0.5, "multiply", 0.5);
                          }} 
                          className="px-2 py-1.5 bg-[#101a18] border border-[#1b3e39] hover:bg-[#1a2e2b] text-white rounded text-[11px] cursor-pointer font-mono font-semibold"
                          title="Subtract 50% of original default base rarity and narrow climate ranges by 0.5x"
                        >
                          -0.5x (0.5x)
                        </button>
                        <button 
                          onClick={() => {
                            const orig = getOriginalBaseRarity(selectedBiome.id);
                            handleUpdateCustomBiomeBaseRarity(selectedBiome.id, selectedBiome.baseRarity + orig * 2.0, "multiply", 3.0);
                          }} 
                          className="px-2 py-1.5 bg-[#4db6ac]/15 hover:bg-[#4db6ac]/25 border border-[#4db6ac]/30 text-[#4db6ac] rounded text-[11px] cursor-pointer font-mono font-semibold"
                          title="Add 200% of original default base rarity and widen climate ranges by 3.0x"
                        >
                          +2.0x (3x)
                        </button>
                        <button 
                          onClick={() => {
                            const orig = getOriginalBaseRarity(selectedBiome.id);
                            handleUpdateCustomBiomeBaseRarity(selectedBiome.id, selectedBiome.baseRarity - orig * 0.75, "multiply", 0.25);
                          }} 
                          className="px-2 py-1.5 bg-[#101a18] border border-[#1b3e39] hover:bg-[#1a2e2b] text-white rounded text-[11px] cursor-pointer font-mono font-semibold"
                          title="Subtract 75% of original default base rarity and narrow climate ranges by 0.25x"
                        >
                          -0.75x (0.25x)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sliders Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {([
                      { key: "temp", name: "Temperature", colorClass: "text-[#ff8a65]" },
                      { key: "hum", name: "Humidity / Veg", colorClass: "text-[#4db6ac]" },
                      { key: "cont", name: "Continentalness", colorClass: "text-[#9ccc65]" },
                      { key: "eros", name: "Erosion", colorClass: "text-[#64b5f6]" },
                      { key: "weird", name: "Weirdness", colorClass: "text-[#ba68c8]" },
                      { key: "depth", name: "Depth", colorClass: "text-sky-400" },
                    ] as const).map(dim => {
                      const range = activePoint[dim.key];
                      return (
                        <div key={dim.key} className="bg-[#0d0909] border border-[#1f1313] p-3 rounded-lg font-mono">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[11px] font-bold uppercase ${dim.colorClass}`}>{dim.name}</span>
                            <span className="text-[10px] text-[#70685c]">
                              [{range.min.toFixed(2)} to {range.max.toFixed(2)}]
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 text-xs">
                            {/* Min bound */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] text-[#70685c] w-8">Min:</span>
                              <PreciseNumberInput
                                value={range.min}
                                onChange={(val) => handlePointRangeChange(selectedBiomeId, selectedPointIndex, dim.key, "min", val)}
                                className="w-14 bg-[#050303] border border-[#3e1b16] rounded px-1 py-0.5 text-white text-center text-[11px]"
                              />
                              <input
                                type="range"
                                min="-2.0"
                                max="2.0"
                                step="0.05"
                                value={range.min}
                                onChange={(e) => handlePointRangeChange(selectedBiomeId, selectedPointIndex, dim.key, "min", parseFloat(e.target.value))}
                                className="flex-1 accent-[#ff7043] h-1 cursor-pointer"
                              />
                            </div>
                            {/* Max bound */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] text-[#70685c] w-8">Max:</span>
                              <PreciseNumberInput
                                value={range.max}
                                onChange={(val) => handlePointRangeChange(selectedBiomeId, selectedPointIndex, dim.key, "max", val)}
                                className="w-14 bg-[#050303] border border-[#3e1b16] rounded px-1 py-0.5 text-white text-center text-[11px]"
                              />
                              <input
                                type="range"
                                min="-2.0"
                                max="2.0"
                                step="0.05"
                                value={range.max}
                                onChange={(e) => handlePointRangeChange(selectedBiomeId, selectedPointIndex, dim.key, "max", parseFloat(e.target.value))}
                                className="flex-1 accent-[#ff7043] h-1 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Climate Presets Section */}
                  <div className="bg-[#110c0c] border border-[#221313] p-3 rounded-lg mt-2">
                    <span className="text-[10px] font-mono text-[#ff7043] font-bold uppercase tracking-wider block mb-2">
                      Quick Climate Presets (Applies to all 6 sliders)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { name: "Plains-like", desc: "Flat, temperate, moderately dry", icon: "🌱", values: { temp: { min: -0.15, max: 0.15 }, hum: { min: -0.1, max: 0.1 }, cont: { min: 0.1, max: 0.4 }, eros: { min: 0.2, max: 0.6 }, weird: { min: -0.2, max: 0.2 }, depth: { min: 0.0, max: 0.2 } } },
                        { name: "Mountain Peaks", desc: "Cold, dry, rugged slopes", icon: "🏔️", values: { temp: { min: -0.5, max: 0.0 }, hum: { min: -0.3, max: 0.3 }, cont: { min: 0.55, max: 1.0 }, eros: { min: -0.8, max: -0.4 }, weird: { min: 0.3, max: 0.8 }, depth: { min: 0.5, max: 1.5 } } },
                        { name: "Desert Dunes", desc: "Hot, arid sand dunes", icon: "🏜️", values: { temp: { min: 0.8, max: 1.5 }, hum: { min: -1.0, max: -0.6 }, cont: { min: 0.2, max: 0.6 }, eros: { min: -0.4, max: 0.2 }, weird: { min: -0.5, max: 0.5 }, depth: { min: -0.1, max: 0.1 } } },
                        { name: "Swampy Wet", desc: "Warm, extremely humid swamp", icon: "🐊", values: { temp: { min: 0.4, max: 0.8 }, hum: { min: 0.6, max: 1.0 }, cont: { min: -0.1, max: 0.2 }, eros: { min: 0.2, max: 0.6 }, weird: { min: -0.3, max: 0.1 }, depth: { min: -0.2, max: 0.0 } } },
                        { name: "Deep Ocean", desc: "Wet, deep ocean floor", icon: "🌊", values: { temp: { min: -0.2, max: 0.5 }, hum: { min: -0.5, max: 0.5 }, cont: { min: -1.0, max: -0.25 }, eros: { min: -0.5, max: 0.5 }, weird: { min: -1.0, max: 1.0 }, depth: { min: -1.5, max: -0.8 } } },
                        { name: "Underground Caves", desc: "Cool subterranean cave", icon: "🕳️", values: { temp: { min: -0.1, max: 0.1 }, hum: { min: -0.1, max: 0.1 }, cont: { min: 0.2, max: 1.0 }, eros: { min: -0.2, max: 0.2 }, weird: { min: 0.4, max: 1.0 }, depth: { min: -1.5, max: -1.0 } } }
                      ].map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleApplyClimateTemplate(preset.values)}
                          className="px-2 py-1.5 bg-[#0d0909] border border-[#221313] hover:border-[#ff7043] hover:bg-[#110c0c] rounded text-[11px] text-[#a4a090] text-left cursor-pointer transition flex flex-col gap-0.5"
                          title={preset.desc}
                        >
                          <span className="font-bold text-white flex items-center gap-1">
                            <span>{preset.icon}</span>
                            <span>{preset.name}</span>
                          </span>
                          <span className="text-[9px] text-[#70685c] leading-tight truncate">{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MCreator Clipboard Exporter Section */}
                  <div className="bg-[#110c0c] border border-[#221313] p-3 rounded-lg mt-2">
                    <div className="flex items-center justify-between border-b border-[#221313] pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-[#ff7043]" />
                        <span className="text-[10px] font-mono text-[#ff7043] font-bold uppercase tracking-wider block">
                          MCreator Parameter Exporter
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const jsonStr = JSON.stringify({
                            temperature: [activePoint.temp.min, activePoint.temp.max],
                            humidity: [activePoint.hum.min, activePoint.hum.max],
                            continentalness: [activePoint.cont.min, activePoint.cont.max],
                            erosion: [activePoint.eros.min, activePoint.eros.max],
                            weirdness: [activePoint.weird.min, activePoint.weird.max],
                            depth: [activePoint.depth.min, activePoint.depth.max]
                          }, null, 2);
                          navigator.clipboard.writeText(jsonStr);
                          setCopiedField("json");
                          setTimeout(() => setCopiedField(null), 1500);
                        }}
                        className="text-[9px] bg-[#ff7043]/10 hover:bg-[#ff7043]/20 text-[#ff7043] border border-[#ff7043]/30 px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1 cursor-pointer transition"
                      >
                        {copiedField === "json" ? "✓ Copied!" : "📋 Copy All as JSON"}
                      </button>
                    </div>

                    <p className="text-[9px] text-[#70685c] leading-relaxed mb-2.5">
                      Click the values below to instantly copy them for fast pasting into MCreator biome editor min/max fields:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      {[
                        { label: "Temperature", min: activePoint.temp.min, max: activePoint.temp.max, key: "temp" },
                        { label: "Humidity / Veg", min: activePoint.hum.min, max: activePoint.hum.max, key: "hum" },
                        { label: "Continentalness", min: activePoint.cont.min, max: activePoint.cont.max, key: "cont" },
                        { label: "Erosion", min: activePoint.eros.min, max: activePoint.eros.max, key: "eros" },
                        { label: "Weirdness", min: activePoint.weird.min, max: activePoint.weird.max, key: "weird" },
                        { label: "Depth", min: activePoint.depth.min, max: activePoint.depth.max, key: "depth" }
                      ].map(field => {
                        return (
                          <div key={field.label} className="bg-[#050303] border border-[#1f1212] p-2 rounded flex flex-col gap-1.5 justify-between">
                            <span className="text-[#a4a090] text-[10px] font-bold">{field.label}:</span>
                            <div className="flex items-center gap-1.5 justify-between">
                              {/* Min button */}
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(field.min.toFixed(4));
                                  setCopiedField(`${field.key}-min`);
                                  setTimeout(() => setCopiedField(null), 1000);
                                }}
                                className="flex-1 px-1.5 py-1 bg-[#100b0b] border border-[#ff7043]/20 hover:border-[#ff7043]/50 text-white rounded text-center text-[10px] transition cursor-pointer font-bold"
                              >
                                {copiedField === `${field.key}-min` ? "✓ Copied!" : `Min: ${field.min.toFixed(4)}`}
                              </button>
                              {/* Max button */}
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(field.max.toFixed(4));
                                  setCopiedField(`${field.key}-max`);
                                  setTimeout(() => setCopiedField(null), 1000);
                                }}
                                className="flex-1 px-1.5 py-1 bg-[#100b0b] border border-[#ff7043]/20 hover:border-[#ff7043]/50 text-white rounded text-center text-[10px] transition cursor-pointer font-bold"
                              >
                                {copiedField === `${field.key}-max` ? "✓ Copied!" : `Max: ${field.max.toFixed(4)}`}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[10px] text-[#70685c] italic leading-relaxed mt-3">
                    <span>* Slide the climate ranges or adjust the generation weights to reshape your biomes. Updates will instantly refresh the 6D slice maps and 2D world visualizer. Use the "Restore Defaults" button in the biomes directory to reset a dimension's configurations anytime.</span>
                  </p>

                </div>
              ) : null}
            </div>
          )}



        </section>

        {/* RIGHT COLUMN: VISUAL MAP & MATCHING RESULTS (5 COLS) */}
        <section className="lg:col-span-5 flex flex-col gap-6 h-full overflow-y-auto pr-0 lg:pr-1">
          
          {/* 2D PROJECTION CANVAS */}
          <div className="bg-[#0c0808] border border-[#1c1212] rounded-xl p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wider uppercase text-white flex items-center gap-2">
                <Map className="h-4 w-4 text-[#ff7043]" />
                Interactive Visual Map
              </h2>
              <div className="flex bg-[#110c0c] p-0.5 rounded border border-[#221313] text-xs">
                <button
                  onClick={() => setMapMode("slice")}
                  className={`px-2.5 py-1 text-center text-[11px] font-mono rounded font-medium transition cursor-pointer ${mapMode === "slice" ? "bg-[#ff7043] text-[#080808]" : "text-[#8c8779] hover:text-white"}`}
                >
                  6D Slice
                </button>
                <button
                  onClick={() => setMapMode("chunkbase")}
                  className={`px-2.5 py-1 text-center text-[11px] font-mono rounded font-medium transition cursor-pointer flex items-center gap-1 ${mapMode === "chunkbase" ? "bg-[#ff7043] text-[#080808]" : "text-[#8c8779] hover:text-white"}`}
                >
                  <Globe className="h-3 w-3" />
                  World
                </button>
              </div>
            </div>

            {/* SEED INPUT BLOCK */}
            <div className="bg-[#110c0c] border border-[#221313] p-3 rounded-lg text-xs">
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <label className="text-[10px] text-[#ff7043] font-bold uppercase tracking-wider block">
                  World Generator Seed
                </label>
                {seedInput.trim() !== simulationSeed.toString() && (
                  <span className="text-[9px] text-[#8c8779]" title="Hashed signed 32-bit seed">
                    Hash: {simulationSeed}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="e.g. 42 or biome_rules"
                  className="flex-1 bg-[#050303] border border-[#421b16] rounded px-3 py-1 text-white text-xs font-mono focus:border-[#ff7043] focus:outline-none placeholder-[#4a2e2a]"
                />
                <button
                  onClick={() => setSeedInput((Math.floor(Math.random() * 999999999) + 1).toString())}
                  className="px-2.5 py-1 bg-[#1a0f0e] border border-[#521c16] text-[#ff7043] rounded text-xs hover:border-[#ff7043]/50 transition font-mono"
                >
                  Random
                </button>
              </div>
            </div>

            {mapMode === "slice" ? (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-[#70685c] block mb-1">X-Axis</label>
                  <select 
                    value={xAxisDim} 
                    onChange={(e) => setXAxisDim(e.target.value)}
                    className="w-full bg-[#110c0c] border border-[#221313] rounded p-1.5 text-white cursor-pointer"
                  >
                    <option value="temp">Temperature</option>
                    <option value="hum">Humidity</option>
                    <option value="cont">Continentalness</option>
                    <option value="eros">Erosion</option>
                    <option value="weird">Weirdness</option>
                    <option value="depth">Depth</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#70685c] block mb-1">Y-Axis</label>
                  <select 
                    value={yAxisDim} 
                    onChange={(e) => setYAxisDim(e.target.value)}
                    className="w-full bg-[#110c0c] border border-[#221313] rounded p-1.5 text-white cursor-pointer"
                  >
                    <option value="temp">Temperature</option>
                    <option value="hum">Humidity</option>
                    <option value="cont">Continentalness</option>
                    <option value="eros">Erosion</option>
                    <option value="weird">Weirdness</option>
                    <option value="depth">Depth</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 bg-[#110c0c] border border-[#221313] p-3 rounded-lg text-xs font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#ff7043] block mb-1">Center X</label>
                    <input
                      type="number"
                      value={chunkbaseX}
                      onChange={(e) => setChunkbaseX(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#050303] border border-[#421b16] rounded p-1.5 text-white text-xs font-mono focus:border-[#ff7043] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#ff7043] block mb-1">Center Z</label>
                    <input
                      type="number"
                      value={chunkbaseZ}
                      onChange={(e) => setChunkbaseZ(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#050303] border border-[#421b16] rounded p-1.5 text-white text-xs font-mono focus:border-[#ff7043] focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#1f1313] text-[10px]">
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showOceans}
                        onChange={(e) => setShowOceans(e.target.checked)}
                        className="rounded accent-[#ff7043] cursor-pointer"
                      />
                      Oceans
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showRivers}
                        onChange={(e) => setShowRivers(e.target.checked)}
                        className="rounded accent-[#ff7043] cursor-pointer"
                      />
                      Rivers
                    </label>
                  </div>
                  
                  <select
                    value={chunkbaseZoom}
                    onChange={(e) => setChunkbaseZoom(parseInt(e.target.value))}
                    className="bg-[#050303] border border-[#421b16] rounded px-1.5 py-1 text-[#ff7043] text-[10px] cursor-pointer focus:outline-none"
                  >
                    <option value={128}>Zoom: 128 (Close)</option>
                    <option value={512}>Zoom: 512 (Normal)</option>
                    <option value={1024}>Zoom: 1024 (Wide)</option>
                    <option value={2048}>Zoom: 2048 (World)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Canvas Frame */}
            <div className="flex flex-col items-center justify-center bg-[#050303] rounded-xl border border-[#1f1313] p-3.5 relative select-none overflow-hidden">
              {mapMode === "chunkbase" ? (
                <>
                  <div className="absolute top-1.5 left-2 text-[8px] text-[#4d322f] font-mono pointer-events-none">
                    X: {Math.round(chunkbaseX - chunkbaseZoom / 2)} <br />
                    Z: {Math.round(chunkbaseZ - chunkbaseZoom / 2)}
                  </div>
                  <div className="absolute top-1.5 right-2 text-[8px] text-[#4d322f] font-mono text-right pointer-events-none">
                    X: {Math.round(chunkbaseX + chunkbaseZoom / 2)} <br />
                    Z: {Math.round(chunkbaseZ - chunkbaseZoom / 2)}
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute top-1 right-2 text-[8px] text-[#4d322f] font-mono">
                    Y-Axis ({yAxisDim.toUpperCase()})
                  </div>
                  <div className="absolute bottom-1 left-2 text-[8px] text-[#4d322f] font-mono">
                    X-Axis ({xAxisDim.toUpperCase()})
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
                className={`rounded-lg shadow-2xl max-w-full max-h-full aspect-square border border-[#120808] transition select-none ${mapMode === "chunkbase" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}`}
              />

              {mapMode === "chunkbase" && (
                <div className="w-full flex items-center justify-between text-[9px] font-mono text-[#5c4a47] mt-2 px-1">
                  <span className="flex items-center gap-0.5">
                    <Move className="h-2.5 w-2.5 text-[#ff7043]" />
                    Drag to scroll
                  </span>
                  <span className="flex items-center gap-1.5">
                    <button onClick={() => { setChunkbaseX(0); setChunkbaseZ(0); }} className="px-1.5 py-0.5 bg-[#120808] border border-[#2d1715] hover:border-[#ff7043] rounded text-[#ff7043] cursor-pointer">Spawn (0,0)</button>
                    <button onClick={() => setChunkbaseZoom(prev => Math.max(128, prev / 2))} className="p-0.5 bg-[#120808] border border-[#2d1715] hover:border-[#ff7043] rounded text-white cursor-pointer"><ZoomIn className="h-2.5 w-2.5" /></button>
                    <button onClick={() => setChunkbaseZoom(prev => Math.min(4096, prev * 2))} className="p-0.5 bg-[#120808] border border-[#2d1715] hover:border-[#ff7043] rounded text-white cursor-pointer"><ZoomOut className="h-2.5 w-2.5" /></button>
                  </span>
                </div>
              )}
            </div>

            {/* Hover Tooltip / Inspect Details */}
            <div className="bg-[#050303] border border-[#1c1212] rounded-xl p-3">
              {hoveredCoords ? (
                <div className="flex flex-col gap-2 font-mono">
                  <div className="flex items-center justify-between border-b border-[#221313] pb-1.5">
                    <span className="text-[10px] text-[#ff7043]">
                      {mapMode === "chunkbase" ? `Block X: ${hoveredCoords.x}, Z: ${hoveredCoords.z}` : `Coords X: ${hoveredCoords.x}, Y: ${hoveredCoords.z}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: hoveredCoords.biomeColor || "#1e1e1e" }} />
                      <span className="text-xs font-bold text-white uppercase">{hoveredCoords.biomeName}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-center text-[10px]">
                    <div className="bg-[#0f0a0a] p-1 rounded border border-[#221313]">
                      <span className="text-[8px] text-[#ff8a65] block">T</span>
                      <span className="font-bold text-white">{hoveredCoords.t.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#0f0a0a] p-1 rounded border border-[#221313]">
                      <span className="text-[8px] text-[#4db6ac] block">H</span>
                      <span className="font-bold text-white">{hoveredCoords.h.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#0f0a0a] p-1 rounded border border-[#221313]">
                      <span className="text-[8px] text-[#9ccc65] block">C</span>
                      <span className="font-bold text-white">{hoveredCoords.c.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#0f0a0a] p-1 rounded border border-[#221313]">
                      <span className="text-[8px] text-[#64b5f6] block">E</span>
                      <span className="font-bold text-white">{hoveredCoords.e.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#0f0a0a] p-1 rounded border border-[#221313]">
                      <span className="text-[8px] text-[#ba68c8] block">W</span>
                      <span className="font-bold text-white">{hoveredCoords.w.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#0f0a0a] p-1 rounded border border-[#221313]">
                      <span className="text-[8px] text-sky-400 block">D</span>
                      <span className="font-bold text-white">{hoveredCoords.d.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-[#8c8779] border-t border-[#221313] pt-1">
                    <span>Similarity: <strong className="text-white">{hoveredCoords.similarity.toFixed(1)}%</strong></span>
                    <span>Distance Score: <strong className="text-white">{hoveredCoords.distance.toFixed(3)}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-[#70685c] italic py-2 font-mono">
                  * Hover cursor or drag over map to analyze climate values
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE POINT CLIMATE QUERY RESULTS (6D DISTANCE MATCHING) */}
          <div className="bg-[#0c0808] border border-[#1c1212] rounded-xl p-4 sm:p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#ff7043]" />
                Climate Query Diagnostics
              </h3>
              <p className="text-[11px] text-[#8c8779] mt-0.5">
                Displays real-time proximity and distance resolution across all biomes based on Noise Router coordinates.
              </p>
            </div>

            {/* Best Match Hero Card */}
            {matchingResults.best && (
              <div className="bg-[#120a08] border border-[#522019] p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-white/20 shrink-0 flex items-center justify-center font-bold text-white text-lg shadow" style={{ backgroundColor: matchingResults.best.biome.color }}>
                    ★
                  </div>
                  <div>
                    <span className="text-[8px] bg-[#521c15] text-[#ff7043] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">Best Match</span>
                    <h4 className="text-base font-extrabold text-white mt-0.5 font-mono">{matchingResults.best.biome.name}</h4>
                    <p className="text-xs text-[#8c8779] mt-0.5 max-w-sm line-clamp-1">{matchingResults.best.biome.description}</p>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0">
                  <span className="text-xs text-[#8c8779] block">Fit Accuracy</span>
                  <span className="text-xl font-black text-emerald-400 block">{matchingResults.best.similarity.toFixed(1)}%</span>
                  <span className="text-[10px] text-[#70685c] block">Dist: {matchingResults.best.distance.toFixed(4)}</span>
                </div>
              </div>
            )}

            {/* Top 10 Closest List */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-[#ff7043] font-mono uppercase tracking-wider font-bold block mb-1">Top 10 Closest Dimension Biomes:</span>
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                {matchingResults.topMatches.map((match, idx) => (
                  <div 
                    key={match.biome.id}
                    onClick={() => setSelectedBiomeId(match.biome.id)}
                    className="flex items-center justify-between p-2 rounded bg-[#0d0909] border border-[#1f1313] hover:border-[#ff7043]/30 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-mono text-[#70685c] w-4 text-right">#{idx + 1}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: match.biome.color }} />
                      <span className="text-xs text-white font-bold font-mono truncate">{match.biome.name}</span>
                      <span className="text-[9px] bg-[#110c0c] text-[#70685c] font-mono px-1.5 py-0.5 rounded">
                        Region #{match.matchedPointIdx + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[11px] shrink-0">
                      <span className="text-[#8c8779]">Dist: <strong className="text-white">{match.distance.toFixed(3)}</strong></span>
                      <span className={`font-bold w-12 text-right ${match.similarity > 75 ? "text-emerald-400" : match.similarity > 40 ? "text-sky-400" : "text-[#8c8779]"}`}>
                        {match.similarity.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* FOOTER STATS SECTION */}
      <footer className="border-t border-[#1c1212] bg-[#0c0808] py-4 px-6 text-center text-xs text-[#70685c] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 font-mono">
          <span>© 2026 Mojang AB. Minecraft and worldgen variables are registered trademarks.</span>
          <span>Designed with high-contrast, fully responsive UI. Total biomes compiled: 58</span>
        </div>
      </footer>

    </div>
  );
}
