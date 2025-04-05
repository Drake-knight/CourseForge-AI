"use client";
import { cn } from "@/lib/utils";
import { Chapter } from "../prisma/generated/prisma/client";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import React from "react";
import { toast } from "react-hot-toast"; 
import { Loader2 } from "lucide-react";

type Props = {
  chapter: Chapter;
  chapterIndex: number;
  completedChapters: Set<string>;
  setCompletedChapters: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export type ChapCardHandler = {
  triggerLoad: () => void;
};

const ChapCard = React.forwardRef<ChapCardHandler, Props>(
  ({ chapter, setCompletedChapters }, ref) => {
    const [success, setSuccess] = React.useState<boolean | null>(null);
    const mutation = useMutation({
      mutationFn: async () => {
        const response = await axios.post("/api/chapter", {
          chapterId: chapter.id,
        });
        return response.data;
      },
    });
    const getChapterInfo = mutation.mutate;
    const isLoading = mutation.status === "pending";

    const addChapterIdToSet = React.useCallback(() => {
      setCompletedChapters((prev) => {
        const newSet = new Set(prev);
        newSet.add(chapter.id);
        return newSet;
      });
    }, [chapter.id, setCompletedChapters]);

    React.useEffect(() => {
      if (chapter.videoId) {
        setSuccess(true);
        addChapterIdToSet();
      }
    }, [chapter, addChapterIdToSet]);

    React.useImperativeHandle(ref, () => ({
      async triggerLoad() {
        if (chapter.videoId) {
          addChapterIdToSet();
          return;
        }
        getChapterInfo(undefined, {
          onSuccess: () => {
            setSuccess(true);
            addChapterIdToSet();
          },
          onError: (error) => {
            console.error(error);
            setSuccess(false);
            toast.error("There was an error loading your chapter"); 
            addChapterIdToSet();
          },
        });
      },
    }));

    return (
      <div
        key={chapter.id}
        className={cn("px-4 py-2 mt-2 rounded flex justify-between", {
          "bg-secondary": success === null,
          "bg-red-500": success === false,
          "bg-green-500": success === true,
        })}
      >
        <h5>{chapter.name}</h5>
        {isLoading && <Loader2 className="animate-spin" />}
      </div>
    );
  }
);

ChapCard.displayName = "ChapCard";

export default ChapCard;
