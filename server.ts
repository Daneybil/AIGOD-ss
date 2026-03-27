import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// NVIDIA API Endpoints
const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_WHISPER_URL = "https://integrate.api.nvidia.com/v1/audio/transcriptions";
const NVIDIA_TTS_URL = "https://integrate.api.nvidia.com/v1/audio/speech";

// Check for API Keys
const checkKeys = () => {
  const keys = {
    NVIDIA_THINKING_API_KEY: process.env.NVIDIA_THINKING_API_KEY || process.env.NVIDIA_THINKING,
    NVIDIA_WHISPER_API_KEY: process.env.NVIDIA_WHISPER_API_KEY || process.env.NVIDIA_WHISPER,
    NVIDIA_MAGPIE_TTS_API_KEY: process.env.NVIDIA_MAGPIE_TTS_API_KEY || process.env.NVIDIA_MAGPIE_TTS || process.env.NVIDIA_MAGPIE,
  };
  Object.entries(keys).forEach(([name, value]) => {
    if (!value) {
      console.warn(`⚠️  WARNING: ${name} (or variant) is not set in environment variables.`);
    } else {
      console.log(`✅  ${name} is configured.`);
    }
  });
  return keys;
};
const activeKeys = checkKeys();

// 1. Chat Completion (Thinking)
app.post("/api/chat", async (req, res) => {
  try {
    const key = process.env.NVIDIA_THINKING_API_KEY || process.env.NVIDIA_THINKING;
    const { messages } = req.body;
    const response = await axios.post(
      NVIDIA_CHAT_URL,
      {
        model: "meta/llama-3.1-70b-instruct", // Faster model for better responsiveness
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error("Chat Error:", JSON.stringify(errorData, null, 2));
    res.status(error.response?.status || 500).json({ 
      error: "Failed to communicate with NVIDIA Thinking",
      details: errorData
    });
  }
});

// 2. Transcription (Whisper)
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const key = process.env.NVIDIA_WHISPER_API_KEY || process.env.NVIDIA_WHISPER;
    if (!req.file) return res.status(400).json({ error: "No audio file provided" });

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append("file", blob, "audio.webm");
    formData.append("model", "openai/whisper-large-v3");

    const response = await axios.post(NVIDIA_WHISPER_URL, formData, {
      headers: {
        Authorization: `Bearer ${key}`,
        // Let axios set the Content-Type with boundary automatically
      },
    });
    res.json(response.data);
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error("Whisper Error:", JSON.stringify(errorData, null, 2));
    res.status(error.response?.status || 500).json({ 
      error: "Failed to transcribe audio",
      details: errorData
    });
  }
});

// 3. Text-to-Speech (Magpie)
app.post("/api/speak", async (req, res) => {
  try {
    const key = process.env.NVIDIA_MAGPIE_TTS_API_KEY || process.env.NVIDIA_MAGPIE_TTS || process.env.NVIDIA_MAGPIE;
    const { text } = req.body;
    const response = await axios.post(
      NVIDIA_TTS_URL,
      {
        input: text,
        model: "nvidia/magpie-tts-multilingual",
        voice: "long", // Default voice
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(response.data));
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error("TTS Error:", JSON.stringify(errorData, null, 2));
    res.status(error.response?.status || 500).json({ 
      error: "Failed to generate speech",
      details: errorData
    });
  }
});

// 4. Vision (Image Analysis)
app.post("/api/vision", upload.single("image"), async (req, res) => {
  try {
    const key = process.env.NVIDIA_THINKING_API_KEY || process.env.NVIDIA_THINKING;
    if (!req.file) return res.status(400).json({ error: "No image provided" });
    const { prompt } = req.body;

    const base64Image = req.file.buffer.toString("base64");
    const response = await axios.post(
      NVIDIA_CHAT_URL,
      {
        model: "nvidia/neva-22b", // Vision-Language Model
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || "What is in this image?" },
              { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${base64Image}` } },
            ],
          },
        ],
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error: any) {
    console.error("Vision Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

app.get("/api/health", (req, res) => {
  const keys = checkKeys();
  res.json({
    status: "ok",
    config: {
      thinking: !!keys.NVIDIA_THINKING_API_KEY,
      whisper: !!keys.NVIDIA_WHISPER_API_KEY,
      tts: !!keys.NVIDIA_MAGPIE_TTS_API_KEY,
    }
  });
});

// Vite middleware for development
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
