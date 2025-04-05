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
    <div className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center max-w-7xl px-6 py-17 mx-auto my-16 bg-purple-100 rounded-lg shadow-lg sm:px-12">
        <h1 className="text-4xl font-extrabold text-center text-purple-800 sm:text-5xl">
          Create Your Learning Journey
        </h1>
        <div className="flex items-start p-6 mt-8 bg-purple-100 border border-purple-300 rounded-lg">
          <InfoIcon className="w-10 h-10 mr-4 text-purple-600" />
          <p className="text-purple-700">
            Got something you want to learn? Type in a course title and list the units you’re curious about — our AI will whip up a course just for you!
          </p>
        </div>
        <div className="w-full mt-10">
          <CreateCourseForm />
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
