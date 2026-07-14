import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini SDK with telemetry headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// pure-TypeScript Java .class file parser
function parseClassFile(buffer: Buffer) {
  try {
    const magic = buffer.readUInt32BE(0);
    if (magic !== 0xCAFEBABE) {
      throw new Error("Invalid class file: Magic number CAFEBABE not found");
    }
    const minor = buffer.readUInt16BE(4);
    const major = buffer.readUInt16BE(6);
    const constantPoolCount = buffer.readUInt16BE(8);

    const constantPool: any[] = [];
    let offset = 10;

    for (let i = 1; i < constantPoolCount; i++) {
      const tag = buffer.readUInt8(offset);
      offset += 1;

      switch (tag) {
        case 1: { // Utf8
          const length = buffer.readUInt16BE(offset);
          const str = buffer.toString("utf8", offset + 2, offset + 2 + length);
          constantPool[i] = { tag, value: str };
          offset += 2 + length;
          break;
        }
        case 3: // Integer
        case 4: { // Float
          constantPool[i] = { tag, value: buffer.readInt32BE(offset) };
          offset += 4;
          break;
        }
        case 5: // Long
        case 6: { // Double
          constantPool[i] = { tag, value: buffer.readBigInt64BE(offset) };
          offset += 8;
          i++; // Long and Double take up two entries
          break;
        }
        case 7: { // Class
          constantPool[i] = { tag, nameIndex: buffer.readUInt16BE(offset) };
          offset += 2;
          break;
        }
        case 8: { // String
          constantPool[i] = { tag, stringIndex: buffer.readUInt16BE(offset) };
          offset += 2;
          break;
        }
        case 9: // Fieldref
        case 10: // Methodref
        case 11: { // InterfaceMethodref
          constantPool[i] = {
            tag,
            classIndex: buffer.readUInt16BE(offset),
            nameAndTypeIndex: buffer.readUInt16BE(offset + 2),
          };
          offset += 4;
          break;
        }
        case 12: { // NameAndType
          constantPool[i] = {
            tag,
            nameIndex: buffer.readUInt16BE(offset),
            descriptorIndex: buffer.readUInt16BE(offset + 2),
          };
          offset += 4;
          break;
        }
        case 15: { // MethodHandle
          offset += 3;
          break;
        }
        case 16: { // MethodType
          offset += 2;
          break;
        }
        case 17: // Dynamic
        case 18: { // InvokeDynamic
          offset += 4;
          break;
        }
        case 19: // Module
        case 20: { // Package
          offset += 2;
          break;
        }
        default:
          // If we fail parsing an advanced class tag, exit pool parse early
          i = constantPoolCount;
          break;
      }
    }

    // Resolve constant pool references
    const resolvedPool: any[] = [];
    for (let i = 1; i < constantPool.length; i++) {
      const entry = constantPool[i];
      if (!entry) continue;
      if (entry.tag === 7) {
        const nameEntry = constantPool[entry.nameIndex];
        resolvedPool.push({ index: i, type: "Class", value: nameEntry ? nameEntry.value : `Index #${entry.nameIndex}` });
      } else if (entry.tag === 8) {
        const strEntry = constantPool[entry.stringIndex];
        resolvedPool.push({ index: i, type: "String", value: strEntry ? strEntry.value : `Index #${entry.stringIndex}` });
      } else if (entry.tag === 1) {
        resolvedPool.push({ index: i, type: "Utf8", value: entry.value });
      } else if (entry.tag === 12) {
        const nameEntry = constantPool[entry.nameIndex];
        const descEntry = constantPool[entry.descriptorIndex];
        resolvedPool.push({
          index: i,
          type: "NameAndType",
          name: nameEntry ? nameEntry.value : `Index #${entry.nameIndex}`,
          descriptor: descEntry ? descEntry.value : `Index #${entry.descriptorIndex}`,
        });
      } else if (entry.tag === 9 || entry.tag === 10 || entry.tag === 11) {
        const classEntry = constantPool[entry.classIndex];
        const ntEntry = constantPool[entry.nameAndTypeIndex];
        let className = "unknown";
        if (classEntry) {
          const nameEntry = constantPool[classEntry.nameIndex];
          if (nameEntry) className = nameEntry.value;
        }
        let name = "unknown";
        let desc = "unknown";
        if (ntEntry) {
          const nameEntry = constantPool[ntEntry.nameIndex];
          const descEntry = constantPool[ntEntry.descriptorIndex];
          if (nameEntry) name = nameEntry.value;
          if (descEntry) desc = descEntry.value;
        }
        resolvedPool.push({
          index: i,
          type: entry.tag === 9 ? "Fieldref" : entry.tag === 10 ? "Methodref" : "InterfaceMethodref",
          class: className,
          name,
          descriptor: desc,
        });
      }
    }

    // Extract basic structure if parsing offset is still valid
    let className = "Unknown";
    let superClassName = "java/lang/Object";
    const interfaces: string[] = [];
    const fields: any[] = [];
    const methods: any[] = [];

    if (offset + 8 <= buffer.length) {
      const accessFlags = buffer.readUInt16BE(offset);
      const thisClassIndex = buffer.readUInt16BE(offset + 2);
      const superClassIndex = buffer.readUInt16BE(offset + 4);
      const interfacesCount = buffer.readUInt16BE(offset + 6);
      offset += 8;

      for (let i = 0; i < interfacesCount; i++) {
        if (offset + 2 <= buffer.length) {
          const idx = buffer.readUInt16BE(offset);
          offset += 2;
          const classEntry = constantPool[idx];
          if (classEntry) {
            const nameEntry = constantPool[classEntry.nameIndex];
            if (nameEntry) interfaces.push(nameEntry.value);
          }
        }
      }

      // Fields
      if (offset + 2 <= buffer.length) {
        const fieldsCount = buffer.readUInt16BE(offset);
        offset += 2;
        for (let i = 0; i < fieldsCount; i++) {
          if (offset + 8 <= buffer.length) {
            const fFlags = buffer.readUInt16BE(offset);
            const fNameIdx = buffer.readUInt16BE(offset + 2);
            const fDescIdx = buffer.readUInt16BE(offset + 4);
            const fAttrsCount = buffer.readUInt16BE(offset + 6);
            offset += 8;

            const fName = constantPool[fNameIdx]?.value || `Index #${fNameIdx}`;
            const fDesc = constantPool[fDescIdx]?.value || `Index #${fDescIdx}`;

            for (let j = 0; j < fAttrsCount; j++) {
              if (offset + 6 <= buffer.length) {
                const attrLen = buffer.readUInt32BE(offset + 2);
                offset += 6 + attrLen;
              }
            }
            fields.push({ name: fName, descriptor: fDesc, flags: fFlags });
          }
        }
      }

      // Methods
      if (offset + 2 <= buffer.length) {
        const methodsCount = buffer.readUInt16BE(offset);
        offset += 2;
        for (let i = 0; i < methodsCount; i++) {
          if (offset + 8 <= buffer.length) {
            const mFlags = buffer.readUInt16BE(offset);
            const mNameIdx = buffer.readUInt16BE(offset + 2);
            const mDescIdx = buffer.readUInt16BE(offset + 4);
            const mAttrsCount = buffer.readUInt16BE(offset + 6);
            offset += 8;

            const mName = constantPool[mNameIdx]?.value || `Index #${mNameIdx}`;
            const mDesc = constantPool[mDescIdx]?.value || `Index #${mDescIdx}`;

            for (let j = 0; j < mAttrsCount; j++) {
              if (offset + 6 <= buffer.length) {
                const attrLen = buffer.readUInt32BE(offset + 2);
                offset += 6 + attrLen;
              }
            }
            methods.push({ name: mName, descriptor: mDesc, flags: mFlags });
          }
        }
      }

      const thisClassEntry = constantPool[thisClassIndex];
      if (thisClassEntry) {
        const nameEntry = constantPool[thisClassEntry.nameIndex];
        if (nameEntry) className = nameEntry.value;
      }

      const superClassEntry = constantPool[superClassIndex];
      if (superClassEntry) {
        const nameEntry = constantPool[superClassEntry.nameIndex];
        if (nameEntry) superClassName = nameEntry.value;
      }
    }

    return {
      className,
      superClassName,
      interfaces,
      fields,
      methods,
      constantPool: resolvedPool.slice(0, 150), // Send a representative sample to avoid bloating prompt
      allStrings: constantPool
        .filter((c) => c && c.tag === 1)
        .map((c) => c.value)
        .filter((s) => s && s.length > 1),
    };
  } catch (err: any) {
    return {
      error: err.message,
    };
  }
}

// Recursively find files in a folder
function getFilesRecursively(dir: string, baseDir: string = ""): { name: string; path: string; isDir: boolean }[] {
  let results: { name: string; path: string; isDir: boolean }[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const relPath = baseDir ? `${baseDir}/${file}` : file;
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results.push({ name: file, path: relPath, isDir: true });
      results = results.concat(getFilesRecursively(filePath, relPath));
    } else {
      results.push({ name: file, path: relPath, isDir: false });
    }
  });
  return results;
}

// Get file tree endpoint
app.get("/api/files", (req, res) => {
  try {
    const workspaceRoot = process.cwd();
    const viltrumiteCoreDir = path.join(workspaceRoot, "viltrumitecore-1.3.0");
    const viltrumiteFlightDir = path.join(workspaceRoot, "viltrumiteflight-1.4.1");

    const coreFiles = getFilesRecursively(viltrumiteCoreDir).map((f) => ({
      ...f,
      mod: "viltrumitecore-1.3.0",
      fullPath: path.join(viltrumiteCoreDir, f.path),
    }));

    const flightFiles = getFilesRecursively(viltrumiteFlightDir).map((f) => ({
      ...f,
      mod: "viltrumiteflight-1.4.1",
      fullPath: path.join(viltrumiteFlightDir, f.path),
    }));

    res.json({
      success: true,
      files: [...coreFiles, ...flightFiles],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Decompile/Read Endpoint
app.post("/api/decompile", async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ success: false, error: "Missing filePath" });
    }

    // Verify file is within correct dirs
    const workspaceRoot = process.cwd();
    const resolvedPath = path.resolve(filePath);
    if (
      !resolvedPath.startsWith(path.join(workspaceRoot, "viltrumitecore-1.3.0")) &&
      !resolvedPath.startsWith(path.join(workspaceRoot, "viltrumiteflight-1.4.1"))
    ) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    const fileExt = path.extname(resolvedPath).toLowerCase();

    if (fileExt !== ".class") {
      // It's a text/asset file
      const content = fs.readFileSync(resolvedPath, "utf8");
      return res.json({
        success: true,
        type: "text",
        content,
      });
    }

    // It's a .class file. Parse bytecode metadata first!
    const buffer = fs.readFileSync(resolvedPath);
    const parsedClass = parseClassFile(buffer);

    if ("error" in parsedClass) {
      return res.status(500).json({
        success: false,
        error: `Could not parse class file structure: ${parsedClass.error}`,
      });
    }

    // Formulate a prompt for Gemini to decompile the Java class
    const prompt = `You are a professional Java decompiler and Minecraft Modding expert.
Your goal is to decompile a JVM .class file of the Fabric 1.20.1 Minecraft Mod "Viltrumite Mod" into fully reconstructed, clean, readable, and compiles-ready Java source code.

Here is the parsed metadata of the Class file:
- Class Name: ${parsedClass.className}
- Super Class: ${parsedClass.superClassName}
- Interfaces Implemented: ${JSON.stringify(parsedClass.interfaces)}
- Fields: ${JSON.stringify(parsedClass.fields)}
- Methods: ${JSON.stringify(parsedClass.methods)}

Key Strings and UTF-8 Literals extracted from bytecode Constant Pool:
${JSON.stringify(parsedClass.allStrings, null, 2)}

Representative Constant Pool References (fields, methods, classes):
${JSON.stringify(parsedClass.constantPool, null, 2)}

Based on this structured metadata and extracted strings, reconstruct the fully-qualified Fabric 1.20.1 Java source code for this class.
Make sure you include correct package declarations, imports, annotations, method skeletons, registrations, and logic. Mod-specific identifiers (like 'viltrumitecore', abilities, locks, etc.) are highly correlated with the string literals.
Provide ONLY the decompiled Java class inside a single markdown code block. Do not write any general explanations before or after.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const decompiledCode = response.text || "Failed to decompile.";

    res.json({
      success: true,
      type: "class",
      metadata: {
        className: parsedClass.className,
        superClassName: parsedClass.superClassName,
        interfaces: parsedClass.interfaces,
        fieldsCount: parsedClass.fields?.length || 0,
        methodsCount: parsedClass.methods?.length || 0,
      },
      content: decompiledCode,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Port Fabric 1.20.1 to NeoForge 1.21.1 endpoint
app.post("/api/port", async (req, res) => {
  try {
    const { sourceCode, fileName } = req.body;
    if (!sourceCode) {
      return res.status(400).json({ success: false, error: "Missing sourceCode" });
    }

    const prompt = `You are a Minecraft Mod porting expert.
You need to port the following Fabric 1.20.1 Minecraft Mod source code to **NeoForge 1.21.1**.

Follow these exact migration principles from Fabric 1.20.1 to NeoForge 1.21.1:
1. Package & Mod setup:
   - Mod annotation: Replace Fabric ModInitializer with @Mod("viltrumitecore") or @Mod("viltrumiteflight") depending on the package.
   - Use standard NeoForge Event buses for initialization (e.g. FMLCommonSetupEvent, RegisterEvent, or subscribe to EventBusSubscriber).
2. Registries:
   - Replace Fabric's \`Registry.register(Registries.BLOCK, ...)\` or similar with NeoForge's \`DeferredRegister\` or \`DeferredHolder\` system (e.g. \`DeferredRegister.createBlocks\`, \`DeferredRegister.createItems\`).
3. Mappings:
   - Map Yarn mappings to official Mojang mappings used by 1.21.1:
     - \`Identifier\` -> \`ResourceLocation\` (use \`ResourceLocation.fromNamespaceAndPath\` or \`ResourceLocation.parse\`).
     - \`World\` -> \`Level\`
     - \`PlayerEntity\` -> \`Player\`
     - \`ClientPlayerEntity\` -> \`LocalPlayer\`
     - \`NbtCompound\` -> \`CompoundTag\`
     - \`NbtList\` -> \`ListTag\`
     - \`PacketByteBuf\` -> \`FriendlyByteBuf\` or \`RegistryFriendlyByteBuf\`
     - \`BlockState\` -> \`BlockState\`
     - \`BlockPos\` -> \`BlockPos\`
     - \`TypedActionResult\` -> \`InteractionResultHolder\`
     - \`ActionResult\` -> \`InteractionResult\`
4. Network Packets:
   - Fabric Networking API (ServerPlayNetworking, ClientPlayNetworking) -> NeoForge's Payload Registration System. In 1.21.1, NeoForge uses \`CustomPacketPayload\`, registering payloads via the \`RegisterPayloadHandlersEvent\` with a stream codec and handler.
5. Mixins:
   - Ensure the mixin target class and mapped method names match Mojang 1.21.1 method names.
6. Return only the complete Java code in a markdown block, followed by a short summary section detailing what major changes were introduced.

Here is the source code of the class or file (originally in Fabric 1.20.1):
\`\`\`java
${sourceCode}
\`\`\`

Provide the complete ported code in a markdown code block.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      portedContent: response.text || "Failed to port.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save Port Endpoint - saves the ported Java code directly under a new "neoforge-1.21.1" directory in the workspace
app.post("/api/save-port", (req, res) => {
  try {
    const { relativePath, content, modName } = req.body;
    if (!relativePath || !content || !modName) {
      return res.status(400).json({ success: false, error: "Missing relativePath, content, or modName" });
    }

    const workspaceRoot = process.cwd();
    // Save in /ported-neoforge/
    const targetBaseDir = path.join(workspaceRoot, "ported-neoforge", modName);
    const targetPath = path.join(targetBaseDir, relativePath);

    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, "utf8");

    res.json({
      success: true,
      savedPath: path.relative(workspaceRoot, targetPath),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite Setup for Development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
