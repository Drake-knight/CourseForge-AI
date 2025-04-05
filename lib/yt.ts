import axios from "axios";
import { YoutubeTranscript } from "youtube-transcript";
import { strict_output } from "./gemini";

interface Question {
    question: string;
    answer: string;
    option1: string;
    option2: string;
    option3: string;
  }
  

export async function searchYoutube(searchQuery: string): Promise<string | null> {
  try {
    const encodedQuery = encodeURIComponent(searchQuery);
    
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          key: process.env.YOUTUBE_API_KEY,
          q: encodedQuery,
          part: "snippet",
          videoDuration: "medium",
          videoEmbeddable: true,
          type: "video",
          maxResults: 5,
          relevanceLanguage: "en"
        }
      }
    );
    
    if (!response.data || !response.data.items || response.data.items.length === 0) {
      console.error("YouTube API returned no results for query:", searchQuery);
      return null;
    }
    
    return response.data.items[0].id.videoId;
    
  } catch (error) {
    console.error("YouTube search failed:", error);
    return null;
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

export async function getQuestionsFromTranscript(
  transcript: string,
  topicTitle: string
): Promise<Question[]> {
  try {

    const questions: Question[] = await strict_output(
      "You are an educational content creator specializing in creating engaging multiple-choice questions based on educational content.",
      new Array(5).fill(
        `Create a challenging multiple-choice question about "${topicTitle}" based on this content: ${transcript}`
      ),
      {
        question: "Clear, concise question text",
        answer: "The correct answer (maximum 15 words)",
        option1: "First incorrect option (maximum 15 words)",
        option2: "Second incorrect option (maximum 15 words)",
        option3: "Third incorrect option (maximum 15 words)",
      }
    );
    
    return questions;
    
  } catch (error) {
    console.error("Failed to generate questions:", error);
    return [];
  }
}