import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post("/api/recipe", async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: "Invalid ingredients format" });
  }

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        inputs: `Make a recipe with: ${ingredients.join(", ")}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_ACCESS_TOKEN}`,
        },
        timeout: 100000,
      }
    );
    console.log(response.data);

    const recipe = response.data[0]?.generated_text || "No recipe found";

    res.json({ recipe });
  } catch (error) {
    console.error(
      "Error when searching for recipe:",
      error?.response?.data || error.message
    );
    res.status(500).json({ error: "Error when searching for recipe" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
