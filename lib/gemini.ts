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
        5. AVOID using any quotation marks inside text values if possible
        6. If quotation marks are absolutely necessary, use single quotes (') instead of double quotes
        7. NEVER use unescaped double quotes inside JSON string values`;
      

      if (list_output) {
        output_format_prompt += `\n8. If an output field is a list, choose the single best element from that list`;
      }

      if (dynamic_elements) {
        output_format_prompt += `\n9. For any text enclosed by < and >, generate appropriate content to replace it
10. For any output key containing < and >, generate an appropriate key name to replace it`;
      }

      if (list_input) {
        output_format_prompt += `\n11. Return an array of JSON objects, one for each input element
12. Each JSON object must strictly follow the specified format
13. IMPORTANT: Ensure each output has UNIQUE content based on its specific input
14. For each different input, generate completely different chapter names, topics, and content
15. Check that no duplicate names or content exist across the different outputs`;
      }
      
      output_format_prompt += `\n\nBEFORE RESPONDING: Carefully review your response and verify that:
      1. It contains only valid JSON
      2. There are NO unescaped double quotes in any string values
      3. If quotes are needed, use single quotes (') instead of double quotes
      4. The structure exactly matches the required format`;
      
      output_format_prompt += `\n\nEXAMPLE OF CORRECT RESPONSE FORMAT:
${list_input ? '[' : ''}${JSON.stringify(output_format, null, 2)}${list_input ? ']' : ''}

EXAMPLES OF CORRECT TEXT HANDLING:
{"text": "He said, 'This is important' and I agreed."}
{"text": "The phrase commonly referred to as 'Hello World' is often used as a first program."}
{"text": "Avoid using quotation marks entirely when possible."}

BAD EXAMPLES (DO NOT DO THIS):
{"text": "He said "This is important" and I agreed."} // Unescaped quotes break JSON
{"text": "The term "variable" refers to a named storage location."} // Quotes break JSON
{"text": "The phrase commonly referred to as "Hello-World" is often used."} // Quotes break JSON

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


      if (!responseText.startsWith('{') && !responseText.startsWith('[')) {
        throw new Error("Response is not valid JSON format");
      }

      let output = JSON.parse(responseText);
      
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
      error_msg = `\n\nPrevious attempt failed with error: ${e}\nPlease ensure your response is ONLY valid JSON matching the required format exactly. No explanations, no markdown. AVOID using double quotes in text - use single quotes instead if quotes are absolutely necessary.`;
      console.log("Attempt failed:", e);
      
      if (i === num_tries - 1) {
        console.error("All attempts failed to generate valid structured output");
        return list_input ? [] : {};
      }
    }
  }

  return [];
}