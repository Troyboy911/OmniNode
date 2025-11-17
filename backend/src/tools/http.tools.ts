import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

export interface HttpResponse {
  success: boolean;
  status?: number;
  data?: any;
  headers?: any;
  error?: string;
  duration?: number;
}

export interface ScrapeResult {
  success: boolean;
  data?: any[];
  metadata?: {
    url: string;
    title?: string;
    timestamp: Date;
    itemsCount: number;
  };
  error?: string;
}

export class HttpTools {
  private defaultTimeout: number = 30000;
  private defaultHeaders: Record<string, string> = {
    'User-Agent': 'OmniNode-Scraper/1.0',
  };

  /**
   * Make GET request
   */
  async get(url: string, config: AxiosRequestConfig = {}): Promise<HttpResponse> {
    const startTime = Date.now();
    try {
      const response: AxiosResponse = await axios.get(url, {
        timeout: this.defaultTimeout,
        headers: { ...this.defaultHeaders, ...config.headers },
        ...config,
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        status: error.response?.status,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Make POST request
   */
  async post(url: string, data: any, config: AxiosRequestConfig = {}): Promise<HttpResponse> {
    const startTime = Date.now();
    try {
      const response: AxiosResponse = await axios.post(url, data, {
        timeout: this.defaultTimeout,
        headers: { ...this.defaultHeaders, ...config.headers },
        ...config,
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        status: error.response?.status,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Make PUT request
   */
  async put(url: string, data: any, config: AxiosRequestConfig = {}): Promise<HttpResponse> {
    const startTime = Date.now();
    try {
      const response: AxiosResponse = await axios.put(url, data, {
        timeout: this.defaultTimeout,
        headers: { ...this.defaultHeaders, ...config.headers },
        ...config,
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        status: error.response?.status,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Make DELETE request
   */
  async delete(url: string, config: AxiosRequestConfig = {}): Promise<HttpResponse> {
    const startTime = Date.now();
    try {
      const response: AxiosResponse = await axios.delete(url, {
        timeout: this.defaultTimeout,
        headers: { ...this.defaultHeaders, ...config.headers },
        ...config,
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        status: error.response?.status,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Scrape webpage with CSS selectors
   */
  async scrape(url: string, selectors: Record<string, string>, config: AxiosRequestConfig = {}): Promise<ScrapeResult> {
    try {
      const response = await this.get(url, config);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to fetch page',
        };
      }

      const $ = cheerio.load(response.data);
      const results: any[] = [];
      
      // Extract data based on selectors
      const data: any = {};
      for (const [key, selector] of Object.entries(selectors)) {
        const elements = $(selector);
        
        if (elements.length === 1) {
          // Single element
          data[key] = elements.text().trim();
        } else if (elements.length > 1) {
          // Multiple elements
          data[key] = elements.map((_, el) => $(el).text().trim()).get();
        }
      }

      results.push(data);

      return {
        success: true,
        data: results,
        metadata: {
          url,
          title: $('title').text().trim(),
          timestamp: new Date(),
          itemsCount: results.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Scrape list items (e.g., search results, product listings)
   */
  async scrapeList(
    url: string,
    listSelector: string,
    itemSelectors: Record<string, string>,
    config: AxiosRequestConfig = {}
  ): Promise<ScrapeResult> {
    try {
      const response = await this.get(url, config);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to fetch page',
        };
      }

      const $ = cheerio.load(response.data);
      const results: any[] = [];
      
      // Find all list items
      $(listSelector).each((_, element) => {
        const item: any = {};
        const $el = $(element);
        
        // Extract data for each item using item selectors
        for (const [key, selector] of Object.entries(itemSelectors)) {
          const found = $el.find(selector);
          
          if (found.length > 0) {
            if (selector.includes('@')) {
              // Extract attribute
              const [sel, attr] = selector.split('@');
              item[key] = $el.find(sel).attr(attr) || '';
            } else {
              item[key] = found.text().trim();
            }
          }
        }
        
        results.push(item);
      });

      return {
        success: true,
        data: results,
        metadata: {
          url,
          title: $('title').text().trim(),
          timestamp: new Date(),
          itemsCount: results.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse HTML content
   */
  parseHTML(html: string, selectors: Record<string, string>): any {
    const $ = cheerio.load(html);
    const data: any = {};
    
    for (const [key, selector] of Object.entries(selectors)) {
      const elements = $(selector);
      
      if (elements.length === 1) {
        data[key] = elements.text().trim();
      } else if (elements.length > 1) {
        data[key] = elements.map((_, el) => $(el).text().trim()).get();
      }
    }
    
    return data;
  }

  /**
   * Download file
   */
  async download(url: string, config: AxiosRequestConfig = {}): Promise<HttpResponse> {
    const startTime = Date.now();
    try {
      const response: AxiosResponse = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: this.defaultTimeout * 3, // Longer timeout for downloads
        headers: { ...this.defaultHeaders, ...config.headers },
        ...config,
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        status: error.response?.status,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
}

export const httpTools = new HttpTools();
