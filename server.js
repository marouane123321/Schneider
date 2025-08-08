import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const MODEL = "gpt2";

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "الرجاء إرسال نص" });

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`السيرفر يعمل على http://localhost:${port}`));
