import PrevCourses from "@/components/PrevCourses";
import { prisma } from "@/lib/db";
import React from "react";


const GalleryPage = async () => {
  const courses = await prisma.course.findMany({
    include: {
      units: {
        include: { chapters: true },
      },
    },
  });
  return (
    <div className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 min-h-screen flex items-center justify-center">
      <div className="py-8 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 place-items-center">
          {courses.map((course) => {
            return (
              <div className="bg-white p-4 rounded-lg shadow-md" key={course.id}>
                <PrevCourses course={course} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
