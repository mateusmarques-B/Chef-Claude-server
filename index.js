import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "https://chef-claude-pi-nine.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
res.send("Chef Claude API online 🍳");
});

async function generateRecipe(ingredients, model) {
  console.log(`🧠 Using model: ${model}`);
  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      inputs: `Create a detailed cooking recipe using the following ingredients: ${ingredients.join(
        ", "
      )}. Include title, ingredients list, and step-by-step instructions.`,
      parameters: { max_new_tokens: 512 },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_ACCESS_TOKEN}`,
      },
      timeout: 120000,
    }
  );

  return response.data;
}

app.post("/api/recipe", async (req, res) => {
  const { ingredients } = req.body;
  console.log("🧾 Request received with ingredients:", ingredients);

  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: "Invalid ingredients format" });
  }

  try {
    const primaryModel = "HuggingFaceH4/zephyr-7b-beta";
    let data;

    try {
      data = await generateRecipe(ingredients, primaryModel);
    } catch (error) {
      console.warn("⚠️ Primary model failed, trying fallback...");
      const fallbackModel = "mistralai/Mistral-7B-Instruct-v0.3";
      data = await generateRecipe(ingredients, fallbackModel);
    }

    console.log("✅ Response from Hugging Face:", data);

    const recipe =
      data[0]?.generated_text ||
      data.generated_text ||
      "No recipe generated.";

    res.json({ recipe });
  } catch (error) {
    console.error(
      "❌ Error generating recipe:",
      error.response?.status,
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Error when searching for recipe" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Chef Claude API online 🍳 | Running on port: ${PORT}`);
});

