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
      "You are an educational content creator specializing in creating structured learning courses with clear, precise learning objectives",
      new Array(units.length).fill(
        `Create a detailed unit for a course about "${title}". Follow these strict guidelines:
        1. Each unit must cover a specific subtopic within the main course subject
        2. Each chapter title must be descriptive and specific (10 words maximum)
        3. Each YouTube search query MUST include:
           - The exact topic name
           - At least one educational keyword (e.g., "tutorial", "explanation", "lecture")
           - Be specific enough to return videos teaching exactly that concept
           - Format: "topic + educational keyword + specificity" (e.g., "mitosis process detailed explanation biology")
        4. Ensure logical progression from basic to advanced concepts
        5. No generic or vague titles or search queries allowed`
      ),
      {
        title: "Clear, specific unit title that precisely describes the content (maximum 8 words)",
        chapters: "Array of chapters with highly specific youtube_search_query and descriptive chapter_title for each"
      }
    );
    const imageResponse = await refined_output(
      "You are a specialist in educational content visualization",
      `Provide a precise image search term that would find a high-quality, professional image representing a course about "${title}". 
       The search term should be specific, educational in nature, and contain 3-5 words that will yield relevant, professional results.`,
      {
        image_search_term: "Specific, educational, professional image search term (3-5 words)"
      }
    );
    
    const courseImage = await getUnsplashImage(
      imageResponse.image_search_term
    );

    
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
    
    
    return NextResponse.json({
      success: false,
      error: "Failed to create course",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}