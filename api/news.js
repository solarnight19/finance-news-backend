import { NewsAPIClient } from '../lib/newsapi.js';
import { OpenAIClient } from '../lib/openai.js';
import { SimpleCache } from '../lib/cache.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;
    
    // Validate date
    const targetDate = date || new Date().toISOString().split('T')[0];
    const parsedDate = new Date(targetDate);
    
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Check cache first
    const cacheKey = `news_${targetDate}`;
    const cachedData = SimpleCache.get(cacheKey);
    
    if (cachedData) {
      return res.status(200).json({
        success: true,
        date: targetDate,
        cached: true,
        data: cachedData
      });
    }

    // Fetch news from News API
    const newsClient = new NewsAPIClient();
    const openaiClient = new OpenAIClient();

    console.log(`Fetching news for date: ${targetDate}`);
    
    // Get Australian business news
    let articles = await newsClient.getAustralianFinanceNews(targetDate);
    
    // If not enough articles, search for finance-related terms
    if (articles.length < 10) {
      const searchTerms = ['finance', 'banking', 'ASX', 'economy', 'investment'];
      
      for (const term of searchTerms) {
        const searchResults = await newsClient.searchFinanceNews(term, targetDate, 20);
        articles = [...articles, ...searchResults];
        
        if (articles.length >= 30) break;
      }
    }

    // Remove duplicates
    const uniqueArticles = articles.filter((article, index, arr) => 
      arr.findIndex(a => a.title === article.title) === index
    );

    if (uniqueArticles.length === 0) {
      return res.status(200).json({
        success: true,
        date: targetDate,
        data: [],
        message: 'No news found for this date'
      });
    }

    console.log(`Found ${uniqueArticles.length} articles, sending to OpenAI for summarization`);

    // Summarize with ChatGPT
    const summarizedNews = await openaiClient.summarizeNews(uniqueArticles);

    // Add timestamps and format
    const formattedNews = summarizedNews.map((item, index) => ({
      ...item,
      time: new Date().toLocaleTimeString('en-AU', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      rank: index + 1,
      date: targetDate
    }));

    // Cache the results
    SimpleCache.set(cacheKey, formattedNews);

    console.log(`Successfully processed ${formattedNews.length} news items`);

    return res.status(200).json({
      success: true,
      date: targetDate,
      cached: false,
      data: formattedNews
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch and process news',
      message: error.message
    });
  }
}
