import { GoogleGenerativeAI,  GenerationConfig } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}


export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model_name: string = "gemini-pro",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const list_input: boolean = Array.isArray(user_prompt);
  
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));
  
  const generationConfig: GenerationConfig = {
    temperature: temperature,
    topP: 0.8,
    topK: 40,
  };

  const model = genAI.getGenerativeModel({ model: model_name, generationConfig });
  
  let error_msg: string = "";

  for (let i = 0; i < num_tries; i++) {
    try {
      let output_format_prompt: string = `\nYou are to output ${
        list_output ? "an array of objects in" : ""
      } the following json format: ${JSON.stringify(
        output_format
      )}. \nDo not include any markdown formatting, backticks, or json labels in your response.`;

      if (list_output) {
        output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
      }

      if (dynamic_elements) {
        output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it.`;
      }

      if (list_input) {
        output_format_prompt += `\nGenerate an array of json objects, one json for each input element.`;
      }

      const fullPrompt = system_prompt + output_format_prompt + error_msg;
      const userContent = user_prompt.toString();
      
      if (verbose) {
        console.log("System prompt:", fullPrompt);
        console.log("\nUser prompt:", userContent);
      }

      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: fullPrompt + "\n\n" + userContent }] }
        ],
      });
      
      let responseText = result.response.text();
      
      responseText = responseText
        .replace(/```json/g, '')  
        .replace(/```/g, '')      
        .replace(/'/g, '"')       
        .replace(/(\w)"(\w)/g, "$1'$2")  
        .trim();                  
      
      if (verbose) {
        console.log("\nGemini response:", responseText);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let output: any = JSON.parse(responseText);
      
      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error("Output format not in an array of json");
        }
      } else {
        output = [output];
      }
      
      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          if (/<.*?>/.test(key)) {
            continue;
          }
          
          if (!(key in output[index])) {
            throw new Error(`${key} not in json output`);
          }

          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            
            if (Array.isArray(output[index][key])) {
              output[index][key] = output[index][key][0];
            }
            
            if (!choices.includes(output[index][key]) && default_category) {
              output[index][key] = default_category;
            }
            if (output[index][key].includes(":")) {
              output[index][key] = output[index][key].split(":")[0];
            }
          }
        }

        if (output_value_only) {
          output[index] = Object.values(output[index]);
          if (output[index].length === 1) {
            output[index] = output[index][0];
          }
        }
      }
      
      return list_input ? output : output[0];
      
    } catch (e) {
      error_msg = `\n\nPrevious attempt failed with error: ${e}\nPlease ensure your response is valid JSON matching the required format exactly.`;
      console.log("Attempt failed:", e);
      
      if (i === num_tries - 1) {
        console.error("All attempts failed to generate valid structured output");
        return list_input ? [] : {};
      }
    }
  }

  return [];
}