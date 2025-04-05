import { Chapter, Unit } from "../prisma/generated/prisma/client";
import React from "react";

type Props = {
  chapter: Chapter;
  unit: Unit;
  unitIndex: number;
  chapterIndex: number;
};

const Video = ({
  unitIndex,
  chapter,
  chapterIndex,
}: Props) => {
  return (
    <div className="flex-[2] mt-3 h-[100%] bg-purple-50 p-6 rounded-lg shadow-md">
      <h4 className="text-sm uppercase text-purple-700">
        Unit {unitIndex + 1} &bull; Chapter {chapterIndex + 1}
      </h4>
      <h1 className="text-4xl font-bold text-purple-900">{chapter.name}</h1>
      <iframe
        title="chapter video"
        className="w-full mt-4 aspeect-video h-[700px] rounded-lg border border-purple-200"
        src={`https://www.youtube.com/embed/${chapter.videoId}`}
        allowFullScreen
      />
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm max-h-[200px] overflow-y-auto">
        <h3 className="text-3xl font-semibold text-purple-800">Summary</h3>
        <p className="mt-2 text-purple-700">{chapter.summary}</p>
      </div>
    </div>
  );
};

export default Video;
