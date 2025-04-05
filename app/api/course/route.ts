import { NextResponse } from "next/server";
import { createChaptersSchema } from "@/util/course";
import { z } from "zod";
import { refined_output } from "@/lib/gemini";
import { getUnsplashImage } from "@/lib/unsplash";
import { prisma } from "@/lib/db";
import { getCurrentUserSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }
    
    const body = await req.json();
    const { title, units } = createChaptersSchema.parse(body);
    

    interface ChapterContent {
      youtube_search_query: string;
      chapter_title: string;
    }
    
    interface UnitContent {
      title: string;
      chapters: ChapterContent[];
    }
    
    const outputUnits: UnitContent[] = await refined_output(
      "You are an educational content creator specializing in creating structured learning courses",
      new Array(units.length).fill(
        `Create a detailed unit for a course about "${title}". For each chapter, provide both an informative title and a specific YouTube search query that would find an educational video teaching that exact topic.`
      ),
      {
        title: "Clear, concise unit title",
        chapters: "Array of chapters with youtube_search_query and chapter_title for each"
      }
    );
    const imageResponse = await refined_output(
      "You are a specialist in educational content visualization",
      `Provide a precise image search term that would find a high-quality, professional image representing a course about "${title}"`,
      {
        image_search_term: "Specific, relevant image search term"
      }
    );
    
    const courseImage = await getUnsplashImage(
      imageResponse.image_search_term
    );

    console.log(33,courseImage)
    
    const result = await prisma.$transaction(async (tx) => {

      const course = await tx.course.create({
        data: {
          name: title,
          image: courseImage
        }
      });
      
      for (let i = 0; i < outputUnits.length; i++) {
        const unit = outputUnits[i];
        
    
        const createdUnit = await tx.unit.create({
          data: {
            name: unit.title,
            courseId: course.id,
          }
        });
        
        await tx.chapter.createMany({
          data: unit.chapters.map((chapter) => ({
            name: chapter.chapter_title,
            youtubeSearchQuery: chapter.youtube_search_query,
            unitId: createdUnit.id,
          }))
        });
      }
      
      return course;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        courseId: result.id,
        title: result.name,
        units: outputUnits.length,
        totalChapters: outputUnits.reduce((acc, unit) => acc + unit.chapters.length, 0)
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 });
    }
    
    console.error("Course creation error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to create course",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}