import OpenAI from 'openai';

export class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async summarizeNews(articles) {
    if (!articles || articles.length === 0) {
      return [];
    }

    try {
      const newsText = articles.map((article, index) => 
        `${index + 1}. ${article.title}\n${article.description || article.content || 'No description available'}\nSource: ${article.source?.name || 'Unknown'}\n`
      ).join('\n');

      const prompt = `Analyze these Australian finance news articles and create the top 20 most important stories. For each story, provide:

1. A clear, engaging title
2. A concise 2-3 sentence summary highlighting key financial impacts
3. Rank by importance to Australian investors and economy

Format as JSON array with objects containing: title, summary, source, rank (1-20)

News articles:
${newsText}

Focus on: ASX movements, RBA decisions, major corporate earnings, housing market, banking sector, mining/commodities, economic indicators, and regulatory changes.`;

      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system", 
            content: "You are a financial news analyst specializing in Australian markets. Provide accurate, concise summaries focusing on market impact and investor relevance."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response);
        return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', parseError);
        return this.fallbackParsing(response);
      }

    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to summarize news');
    }
  }

  fallbackParsing(response) {
    // Fallback parsing if JSON parsing fails
    const lines = response.split('\n');
    const summaries = [];
    let currentItem = {};

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('"title"') && trimmed.includes('"summary"')) {
        // Try to extract basic info
        const titleMatch = trimmed.match(/"title":\s*"([^"]+)"/);
        const summaryMatch = trimmed.match(/"summary":\s*"([^"]+)"/);
        
        if (titleMatch && summaryMatch) {
          summaries.push({
            title: titleMatch[1],
            summary: summaryMatch[1],
            source: 'Various',
            rank: summaries.length + 1
          });
        }
      }
    });

    return summaries.slice(0, 20);
  }
}