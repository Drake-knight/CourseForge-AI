/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from "@/lib/db";
import { strict_output } from "@/lib/gemini";
import {
  getQuestionsFromTranscript,
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
      console.log(`Attempting video ${i+1}/${videoIds.length}, ID: ${currentVideoId}`);
      
      try {
        const currentTranscript = await getTranscript(currentVideoId);
        if (currentTranscript && currentTranscript.length > 100) { 
          transcript = currentTranscript;
          videoId = currentVideoId;
          console.log(`Found valid transcript for video ID: ${videoId}`);
          break;
        }
      } catch (e) {
        console.log(`No transcript available for video ${currentVideoId}, trying next...`);
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

    const { summary } = await strict_output(
      "You are an educational content summarizer that creates concise, informative summaries",
      `Create a clear, informative summary of this educational content. Keep it under 250 words, 
       focus only on the main educational content, and avoid mentioning sponsors or tangential topics:\n${transcript}`,
      { summary: "educational summary of the content" }
    );
    
    const questions = await getQuestionsFromTranscript(
      transcript,
      chapter.name
    );
    
    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Failed to generate quiz questions"
      }, { status: 422 });
    }

    await prisma.$transaction([
      prisma.question.createMany({
        data: questions.map((question) => {
          const options = [
            question.answer,
            question.option1,
            question.option2,
            question.option3,
          ].sort(() => Math.random() - 0.5);
          
          return {
            question: question.question,
            answer: question.answer,
            options: JSON.stringify(options),
            chapterId: chapterId,
          };
        }),
      }),
      
      prisma.chapter.update({
        where: { id: chapterId },
        data: {
          videoId,
          summary,
        },
      }),
    ]);

    return NextResponse.json({ 
      success: true,
      data: {
        videoId,
        questionsCount: questions.length,
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
    
    console.error("Chapter processing error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to process chapter",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }, { status: 500 });
  }
}