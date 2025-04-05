import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

export async function refined_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model_name: string = "gemini-2.0-flash",
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
      let output_format_prompt: string = `\nIMPORTANT: You must respond ONLY with the exact JSON format specified below. No explanation, no conversation, no markdown.

        The JSON format must be: ${JSON.stringify(output_format)}

        STRICT REQUIREMENTS:
        1. Output ONLY raw JSON with no additional text
        2. Do not include markdown code blocks, backticks, or "json" labels
        3. Ensure all keys match exactly as specified
        4. Ensure all values are properly formatted strings or arrays
        5. CRITICAL: NEVER put quotes inside JSON string values without escaping them with a backslash (\\")
        6. Avoid using any quotation marks inside text values at any cost
        7. If you must include quotes in text, ALWAYS use \\" instead of plain "`;
      

      if (list_output) {
        output_format_prompt += `\n7. If an output field is a list, choose the single best element from that list`;
      }

      if (dynamic_elements) {
        output_format_prompt += `\n8. For any text enclosed by < and >, generate appropriate content to replace it
9. For any output key containing < and >, generate an appropriate key name to replace it`;
      }

      if (list_input) {
        output_format_prompt += `\n10. Return an array of JSON objects, one for each input element
11. Each JSON object must strictly follow the specified format
12. IMPORTANT: Ensure each output has UNIQUE content based on its specific input
13. For each different input, generate completely different chapter names, topics, and content
14. Check that no duplicate names or content exist across the different outputs`;
      }
      output_format_prompt += `\n\nCRITICAL: ABSOLUTELY NEVER USE STRAIGHT QUOTES IN VALUES
      - Instead of "quoted text" → use 'single quotes' or rephrase without quotes
      - All double quotes MUST be escaped as \\\"`
      output_format_prompt += `\n\nEXAMPLE OF CORRECT RESPONSE FORMAT:
${list_input ? '[' : ''}${JSON.stringify(output_format, null, 2)}${list_input ? ']' : ''}

EXAMPLES OF CORRECT QUOTE HANDLING:
{"text": "He said, \\"This is important\\" and I agreed."}
{"text": "The phrase commonly referred to as \\\"Hello World\\\" is often used as a first program."}
{"text": "Avoid using quotation marks entirely when possible."}

BAD EXAMPLES (DO NOT DO THIS):
{"text": "He said "This is important" and I agreed."} // Unescaped quotes break JSON
{"text": "The term "variable" refers to a named storage location."} // Quotes must be escaped
{"text": "The phrase commonly referred to as "Hello-World" is often used as a first program."} // Quotes must be escaped
{"text": "The phrase commonly referred to as (eg: "Hello-World") is often used as a first program."} // Quotes must be escaped
{"text": "The phrase commonly referred to as "Hello-World" is often used as a first program."} // Quotes must be escaped

ANY DEVIATION FROM THESE INSTRUCTIONS WILL RESULT IN FAILURE.`;

      const fullPrompt = system_prompt + output_format_prompt + error_msg;
      const userContent = Array.isArray(user_prompt) ? JSON.stringify(user_prompt) : user_prompt;
      
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
        .replace(/^json$/gim, '')
        .replace(/'/g, '"')       
        .replace(/(\w)"(\w)/g, "$1'$2")
        .trim();
      
        

      const firstBracketIndex = Math.min(
        responseText.indexOf('{') >= 0 ? responseText.indexOf('{') : Infinity,
        responseText.indexOf('[') >= 0 ? responseText.indexOf('[') : Infinity
      );
      
      const lastBracketIndex = Math.max(
        responseText.lastIndexOf('}'),
        responseText.lastIndexOf(']')
      );

      if (firstBracketIndex !== Infinity && lastBracketIndex !== -1) {
        responseText = responseText.substring(firstBracketIndex, lastBracketIndex + 1);
      }
      
      if (verbose) {
        console.log("\nGemini response:", responseText);
      }

      if (!responseText.startsWith('{') && !responseText.startsWith('[')) {
        throw new Error("Response is not valid JSON format");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(responseText);
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
      error_msg = `\n\nPrevious attempt failed with error: ${e}\nPlease ensure your response is ONLY valid JSON matching the required format exactly. No explanations, no markdown. REMEMBER: Always escape quotes inside strings with a backslash: \\".`;
      console.log("Attempt failed:", e);
      
      if (i === num_tries - 1) {
        console.error("All attempts failed to generate valid structured output");
        return list_input ? [] : {};
      }
    }
  }

  return [];
}