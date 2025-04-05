import { requestQueue } from './request-queue';

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

export async function enhanced_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  return requestQueue.enqueue(
    system_prompt,
    user_prompt,
    output_format,
    default_category,
    output_value_only
  );
}