import axios from "axios";

export const getUnsplashImage = async (query: string): Promise<string> => {
  try {

    const sanitizedQuery = encodeURIComponent(query.trim());
    
    const response = await axios.get(
      `https://api.unsplash.com/search/photos`, {
        params: {
          query: sanitizedQuery,
          per_page: 1,
          client_id: process.env.UNSPLASH_API_KEY
        }
      }
    );
    
    if (!response.data.results || response.data.results.length === 0) {
      throw new Error(`No images found for query: ${query}`);
    }
    
    return response.data.results[0].urls.small_s3;
  } catch (error) {
    console.error(`Error fetching Unsplash image for "${query}":`, error);
    throw error;
  }
};