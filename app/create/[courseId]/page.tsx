import GenVid from "@/components/GenVid";
import { getCurrentUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Info } from "lucide-react";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: {
    courseId: string;
  };
};

const CreateChapters = async (props: Props) => {
  const params = await props.params;
  const courseId = params.courseId;
  
  const session = await getCurrentUserSession();
  if (!session?.user) {
    return redirect("/gallery");
  }
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      units: {
        include: {
          chapters: true,
        },
      },
    },
  });
  if (!course) {
    return redirect("/create");
  }
  
  return (
    <div className="bg-gradient-to-b from-purple-800 to-purple-900 p-4">
      <div className="bg-purple-100 p-6 rounded-3xl shadow-xl mt-5">
        <div className="flex flex-col items-start max-w-3xl mx-auto my-16">
          <h5 className="text-sm uppercase text-seconday-foreground/60">
            Course Name
          </h5>
          <h1 className="text-5xl font-bold">{course.name}</h1>

          <div className="flex p-4 mt-5 border-none bg-secondary">
            <Info className="w-12 h-12 mr-3 text-blue-400" />
            <div>
              Chapters for all units have been successfully generated. Kindly review them and proceed by clicking the confirmation button
            </div>
          </div>
          <GenVid course={course} />
        </div>
      </div>
    </div>
  );
};

export default CreateChapters;
