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