import { cn } from "@/lib/utils";
import { Chapter, Course, Unit } from "../prisma/generated/prisma/client";
import Link from "next/link";
import React from "react";
import { Separator } from "./ui/separator";

type Props = {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
};

const Sidebar = async ({ course, currentChapterId }: Props) => {
  return (
    <div className="w-[350px] mt-45 absolute top-1/2 -translate-y-1/2 p-6 rounded-r-3xl bg-white text-purple-700 shadow-lg pt-20">
      <h1 className="text-4xl font-bold">{course.name}</h1>
      <div className="mt-14">
        {course.units.map((unit, unitIndex) => {
          return (
            <div
              key={unit.id}
              className={`mt-6 p-4 rounded-lg bg-purple-100 shadow-md ${
                unitIndex === 0 ? "mt-10" : ""
              }`}
            >
              <h2 className="text-sm uppercase text-purple-500">
                Unit {unitIndex + 1}
              </h2>
              <h2 className="text-2xl font-semibold">{unit.name}</h2>
              {unit.chapters.map((chapter, chapterIndex) => {
                return (
                  <div key={chapter.id} className="mt-2">
                    <Link
                      href={`/course/${course.id}/${unitIndex}/${chapterIndex}`}
                      className={cn("text-purple-600 hover:text-purple-800 transition", {
                        "text-purple-800 font-bold": chapter.id === currentChapterId,
                      })}
                    >
                      {chapter.name}
                    </Link>
                  </div>
                );
              })}
              <Separator className="mt-4 bg-purple-300" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
