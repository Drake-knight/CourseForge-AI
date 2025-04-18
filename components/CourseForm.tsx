"use client";
import React from "react";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { z } from "zod";
import { createChaptersSchema } from '../util/course';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Plus, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast"; 
import { useRouter } from "next/navigation";


type Input = z.infer<typeof createChaptersSchema>;

const CourseForm = () => {
  const router = useRouter();
  const { mutate: createChapters, status } = useMutation({
    mutationFn: async ({ title, units }: Input) => {
      const response = await axios.post("/api/course", {
        title,
        units,
      });
      return response.data;
    },
  });
  const form = useForm<Input>({
    resolver: zodResolver(createChaptersSchema),
    defaultValues: {
      title: "",
      units: ["", "", ""],
    },
  });

  function onSubmit(data: Input) {
    if (data.units.some((unit) => unit === "")) {
      toast.error("Please fill all the units");
      return;
    }
    createChapters(data, {
      onSuccess: (response) => {


        if (!response.data.courseId) {
          console.error("No course_id in response:", response);
          toast.error("Missing course ID in response");
          return;
        }
        
        toast.success("Course created successfully");

        router.push(`/create/${response.data.courseId}`);
      },
      onError: () => {
        toast.error("Something went wrong");  
      },
    });
  }

  form.watch();

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full mt-4 ">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => {
              return (
                <FormItem className="flex flex-col items-start w-full sm:items-center sm:flex-row mb-6">
                  <FormControl className="flex-[6]">
                    <Input
                      placeholder="Enter the main topic of the course"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />

          <AnimatePresence>
            {form.watch("units").map((_, index) => {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    height: { duration: 0.2 },
                  }}
                  className={`w-1/2 ${index % 2 === 0 ? 'pr-4' : 'pl-4'} inline-block mb-4`}
                >
                  <FormField
                    key={index}
                    control={form.control}
                    name={`units.${index}`}
                    render={({ field }) => {
                      return (
                        <FormItem className="flex flex-col items-start w-full sm:items-center sm:flex-row">
                          <FormControl className="flex-[6]">
                            <Input
                              placeholder="Enter subtopic of the course"
                              {...field}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="flex items-center justify-center mt-4">
            <Separator className="flex-[1]" />
            <div className="mx-4 flex justify-center">
              <Button
                type="button"
                variant="secondary"
                className="font-semibold"
                onClick={() => {
                  form.setValue("units", [...form.watch("units"), ""]);
                }}
              >
                Add Unit
                <Plus className="w-4 h-4 ml-2 text-green-500" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="font-semibold ml-2"
                onClick={() => {
                  if (form.watch("units").length > 1) {
                    form.setValue("units", form.watch("units").slice(0, -1));
                  }
                }}
                disabled={form.watch("units").length <= 1} // Disable if only one unit
              >
                Remove Unit
                <Trash className="w-4 h-4 ml-2 text-red-500" />
              </Button>
            </div>
            <Separator className="flex-[1]" />
          </div>
          <div className="flex justify-center mt-6">
            <Button
              disabled={status === "pending"}
              type="submit"
              className="max-w-1000"
              size="lg"
            >
              Lets Go!
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CourseForm;
