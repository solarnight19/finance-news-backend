import axios from 'axios';

export class NewsAPIClient {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
    this.baseUrl = 'https://newsapi.org/v2';
  }

  async getAustralianFinanceNews(date = null, pageSize = 50) {
    const today = new Date();
    const targetDate = date ? new Date(date) : today;
    
    // Format date for API (YYYY-MM-DD)
    const dateStr = targetDate.toISOString().split('T')[0];
    
    const params = {
      apiKey: this.apiKey,
      country: 'au',
      category: 'business',
      pageSize: pageSize,
      from: dateStr,
      to: dateStr,
      sortBy: 'popularity',
      language: 'en'
    };

    try {
      const response = await axios.get(`${this.baseUrl}/top-headlines`, { params });
      return response.data.articles || [];
    } catch (error) {
      console.error('News API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch news');
    }
  }

  async searchFinanceNews(query, date, pageSize = 50) {
    const targetDate = new Date(date);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    const params = {
      apiKey: this.apiKey,
      q: `${query} AND (Australia OR Australian OR ASX OR RBA)`,
      from: dateStr,
      to: dateStr,
      sortBy: 'relevancy',
      language: 'en',
      pageSize: pageSize
    };

    try {
      const response = await axios.get(`${this.baseUrl}/everything`, { params });
      return response.data.articles || [];
    } catch (error) {
      console.error('News search error:', error.response?.data || error.message);
      throw new Error('Failed to search news');
    }
  }
}
