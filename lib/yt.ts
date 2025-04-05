import axios from "axios";
import { YoutubeTranscript } from "youtube-transcript";

  
export async function searchYoutube(searchQuery: string, maxResults: number = 5): Promise<string[]> {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        searchQuery
      )}&key=${process.env.YOUTUBE_API_KEY}&type=video&maxResults=${maxResults}`
    );

    if (response.data.items.length === 0) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.items.map((item: any) => item.id.videoId);
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return [];
  }
}

export async function getTranscript(videoId: string): Promise<string> {
  try {
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, {
     lang: "en",
    });
    
    const transcript = transcriptArray
      .map(segment => segment.text)
      .join(" ")
      .replaceAll("\n", " ")
      .replace(/\s+/g, " ") 
      .trim();
    
    return transcript;
    
  } catch (error) {
    console.error(`Failed to get transcript for video ${videoId}:`, error);
    return "";
  }
}

