import { getCurrentUserSession } from "../../lib/auth";
import React from "react";
import { redirect } from "next/navigation";
import { InfoIcon } from "lucide-react";
import CreateCourseForm from "@/components/CreateCourseForm";


const CreatePage = async () => {
  const session = await getCurrentUserSession();
  if (!session?.user) {
    return redirect("/gallery");
  }
  return (
    <div className="flex flex-col items-start max-w-xl px-8 mx-auto my-16 sm:px-0">
      <h1 className="self-center text-3xl font-bold text-center sm:text-6xl">
        Learning Journey
      </h1>
      <div className="flex p-4 mt-5 border-none bg-secondary">
        <InfoIcon className="w-12 h-12 mr-3 text-blue-400" />
        <div>
        Got something you want to learn? Type in a course title and list the units you’re curious about — our AI will whip up a course just for you!
        </div>
      </div>
      <CreateCourseForm/>
    </div>
  );
};

export default CreatePage;
