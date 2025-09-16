// api/finance-news.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    // Load API keys from Vercel environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const NEWS_API_KEY = process.env.NEWS_API_KEY;

    // Step 1: Get top finance headlines
    const newsRes = await fetch(
      `https://newsapi.org/v2/top-headlines?category=business&pageSize=20&apiKey=${NEWS_API_KEY}`
    );
    const newsData = await newsRes.json();

    const headlines = newsData.articles.map(a => a.title).join("\n");

    // Step 2: Summarize with OpenAI
    const summaryRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Summarize finance news clearly in bullet points." },
          { role: "user", content: headlines }
        ],
      }),
    });

    const summaryData = await summaryRes.json();
    const summary = summaryData.choices[0].message.content;

    res.status(200).json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch news summary." });
  }
}
