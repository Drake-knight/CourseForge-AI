/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from "@/lib/db";

import { enhanced_output } from "@/lib/enhanced-gemini";
import {
  getTranscript,
  searchYoutube,
} from "@/lib/yt";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
});

const MAX_VIDEO_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chapterId } = requestSchema.parse(body);
    
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        name: true,
        youtubeSearchQuery: true,
      }
    });

    if (!chapter) {
      return NextResponse.json({
        success: false,
        error: "Chapter not found"
      }, { status: 404 });
    }

    const videoIds = await searchYoutube(chapter.youtubeSearchQuery, MAX_VIDEO_ATTEMPTS);
    if (!videoIds || videoIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Failed to find any relevant videos"
      }, { status: 422 });
    }

    let transcript = null;
    let videoId = null;
    
    for (let i = 0; i < videoIds.length; i++) {
      const currentVideoId = videoIds[i];
      
      try {
        const currentTranscript = await getTranscript(currentVideoId);
        if (currentTranscript && currentTranscript.length > 100) { 
          transcript = currentTranscript;
          videoId = currentVideoId;
          break;
        }
      } catch (e) {
      }
    }

    if (!transcript || !videoId) {
      return NextResponse.json({
        success: false,
        error: "Could not find any videos with valid transcripts for this topic"
      }, { status: 422 });
    }

    const maxLength = 500;
    transcript = transcript.split(" ").slice(0, maxLength).join(" ");

    const { summary } = await enhanced_output(
        "You are an educational content summarizer that creates concise, informative summaries",
        `Create a clear, informative summary of this educational content. Keep it under 250 words, 
         focus only on the main educational content, and avoid mentioning sponsors or tangential topics:\n${transcript}`,
        { summary: "educational summary of the content" },
        "", 
        false,  
    );
    // Update the chapter with video ID and summary only
    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        videoId,
        summary,
      },
    });

    return NextResponse.json({ 
      success: true,
      data: {
        videoId,
        summaryLength: summary.length,
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request format",
        details: error.errors,
      }, { status: 400 });
    }
    

    
    return NextResponse.json({
      success: false,
      error: "Failed to process chapter",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }, { status: 500 });
  }
}