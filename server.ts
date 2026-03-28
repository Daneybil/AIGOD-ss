import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// --- 1. SETUP PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(process.cwd(), "dist");

const app = express();
const PORT = 3000;

// --- 2. IMMEDIATE PORT BINDING (THE FIX) ---
// This MUST happen before any heavy libraries are loaded.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 [AIGODS] Server is ONLINE on Port ${PORT}`);
});

// --- 3. IMMEDIATE PRODUCTION SERVING ---
// We serve the website files immediately so the screen clears.
app.use(express.static(distPath));

// --- 4. DYNAMIC LOADING OF HEAVY LIBRARIES ---
// We load these in the background so they don't block the server startup.
const initializeApp = async () => {
  const { default: cors } = await import("cors");
  const { default: dotenv } = await import("dotenv");
  const { default: axios } = await import("axios");
  const { default: multer } = await import("multer");

  console.log("📦 [AIGODS] Heavy libraries loaded. Activating APIs...");
  dotenv.config();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const upload = multer({ storage: multer.memoryStorage() });
  const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
  const NVIDIA_WHISPER_URL = "https://integrate.api.nvidia.com/v1/audio/transcriptions";
  const NVIDIA_TTS_URL = "https://ai.api.nvidia.com/v1/audio/nvidia/tts/magpie-tts";

  app.get("/api/health", (req, res) => {
    const thinkingKey = process.env.NVIDIA_THINKING_API_KEY || process.env.NVIDIA_THINKING || process.env['NVIDIA thinking'];
    const whisperKey = process.env.NVIDIA_WHISPER_API_KEY || process.env.NVIDIA_WHISPER || process.env['NVIDIA Whisper'];
    const ttsKey = process.env.NVIDIA_MAGPIE_TTS_API_KEY || process.env.NVIDIA_MAGPIE_TTS || process.env.NVIDIA_MAGPIE || process.env['NVIDIA Macpai'];

    console.log("🔍 [AIGODS] API Key Status Check:");
    console.log(`   - Thinking/Vision Key: ${thinkingKey ? "✅ LOADED" : "❌ MISSING"}`);
    console.log(`   - Whisper Key: ${whisperKey ? "✅ LOADED" : "❌ MISSING"}`);
    console.log(`   - TTS Key: ${ttsKey ? "✅ LOADED" : "❌ MISSING"}`);

    res.json({ 
      status: "ok", 
      mode: process.env.NODE_ENV,
      config: {
        thinking: !!thinkingKey,
        whisper: !!whisperKey,
        tts: !!ttsKey
      }
    });
  });

  app.get("/api/test-connection", async (req, res) => {
    const results: any = {};
    const thinkingKey = process.env.NVIDIA_THINKING_API_KEY || process.env.NVIDIA_THINKING || process.env['NVIDIA thinking'];
    const whisperKey = process.env.NVIDIA_WHISPER_API_KEY || process.env.NVIDIA_WHISPER || process.env['NVIDIA Whisper'];
    const ttsKey = process.env.NVIDIA_MAGPIE_TTS_API_KEY || process.env.NVIDIA_MAGPIE_TTS || process.env.NVIDIA_MAGPIE || process.env['NVIDIA Macpai'];

    // 1. Test Chat/Vision API
    try {
      if (!thinkingKey) throw new Error("Key missing in environment variables");
      const chatRes = await axios.post(NVIDIA_CHAT_URL, {
        model: "meta/llama-3.1-70b-instruct",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
      }, {
        headers: { Authorization: `Bearer ${thinkingKey}`, "Content-Type": "application/json" },
        timeout: 30000
      });
      results.thinking = { status: "✅ Success", details: "API responded correctly" };
    } catch (error: any) {
      results.thinking = { status: "❌ Error", details: error.response?.data || error.message };
    }

    // 2. Test Whisper API (Key check only)
    try {
      if (!whisperKey) throw new Error("Key missing in environment variables");
      results.whisper = { status: "✅ Key Loaded", details: "Key is present, ready for audio upload" };
    } catch (error: any) {
      results.whisper = { status: "❌ Error", details: error.message };
    }

    // 3. Test TTS API
    try {
      const ttsKey = process.env.NVIDIA_MAGPIE_TTS_API_KEY || process.env.NVIDIA_MAGPIE_TTS || process.env.NVIDIA_MAGPIE || process.env['NVIDIA Macpai'];
      if (!ttsKey) throw new Error("Key missing in environment variables");
      await axios.post(NVIDIA_TTS_URL, {
        input: "test",
        voice: "en-US-Female-1"
      }, {
        headers: { 
          Authorization: `Bearer ${ttsKey}`, 
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        timeout: 30000
      });
      results.tts = { status: "✅ Success", details: "API responded correctly" };
    } catch (error: any) {
      console.error("Test Connection TTS Error:", error.response?.data || error.message);
      results.tts = { status: "❌ Error", details: error.response?.data || error.message };
    }

    res.json(results);
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const key = process.env.NVIDIA_THINKING_API_KEY || process.env.NVIDIA_THINKING || process.env['NVIDIA thinking'];
      if (!key) throw new Error("NVIDIA_THINKING_API_KEY is missing");

      const { messages } = req.body;
      const response = await axios.post(NVIDIA_CHAT_URL, {
        model: "meta/llama-3.1-70b-instruct",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }, {
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Chat Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Chat API Error", details: error.response?.data || error.message });
    }
  });

  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      const { default: FormData } = await import("form-data");
      const key = process.env.NVIDIA_WHISPER_API_KEY || process.env.NVIDIA_WHISPER || process.env['NVIDIA Whisper'];
      if (!key) throw new Error("NVIDIA_WHISPER_API_KEY is missing");
      if (!req.file) return res.status(400).json({ error: "No file" });
      
      const form = new FormData();
      form.append("file", req.file.buffer, { filename: "audio.webm", contentType: "audio/webm" });
      form.append("model", "openai/whisper-large-v3");
      form.append("response_format", "json");
      
      const response = await axios.post(NVIDIA_WHISPER_URL, form, {
        headers: { 
          ...form.getHeaders(),
          Authorization: `Bearer ${key}`
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Whisper Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Whisper API Error", details: error.response?.data || error.message });
    }
  });

  app.post("/api/speak", async (req, res) => {
    try {
      const key = process.env.NVIDIA_MAGPIE_TTS_API_KEY || process.env.NVIDIA_MAGPIE_TTS || process.env.NVIDIA_MAGPIE || process.env['NVIDIA Macpai'];
      if (!key) throw new Error("NVIDIA_MAGPIE_TTS_API_KEY is missing");

      const { text } = req.body;
      const response = await axios.post(NVIDIA_TTS_URL, {
        input: text,
        voice: "en-US-Female-1"
      }, {
        headers: { 
          Authorization: `Bearer ${key}`, 
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        responseType: "arraybuffer",
      });
      res.set("Content-Type", "audio/mpeg");
      res.send(Buffer.from(response.data));
    } catch (error: any) {
      console.error("TTS Error:", error.response?.data || error.message);
      res.status(500).json({ error: "TTS API Error", details: error.response?.data || error.message });
    }
  });

  app.post("/api/vision", upload.single("image"), async (req, res) => {
    try {
      const key = process.env.NVIDIA_THINKING_API_KEY || process.env.NVIDIA_THINKING || process.env['NVIDIA thinking'];
      if (!key) throw new Error("NVIDIA_THINKING_API_KEY is missing");
      if (!req.file) return res.status(400).json({ error: "No image" });
      
      const base64Image = req.file.buffer.toString("base64");
      const response = await axios.post(NVIDIA_CHAT_URL, {
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: req.body.prompt || "What is in this image?" },
            { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${base64Image}` } },
          ],
        }],
        max_tokens: 1024,
      }, {
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Vision Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Vision API Error", details: error.response?.data || error.message });
    }
  });

  // --- 5. SPA FALLBACK ---
  app.get("*all", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // --- 6. GLOBAL ERROR HANDLER ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Critical Server Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });
};

initializeApp();
