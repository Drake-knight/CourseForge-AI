//to prevent rate limit of gemini(wont be usedful when we got cred in api)


/* eslint-disable @typescript-eslint/no-explicit-any */
import { refined_output } from './gemini';

interface QueuedRequest {
  systemPrompt: string;
  userPrompt: string | string[];
  outputFormat: any;
  defaultCategory: string;
  outputValueOnly: boolean;
  modelName?: string;
  temperature?: number;
  numTries?: number;
  verbose?: boolean;
  isChapterApiRequest?: boolean;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing: boolean = false;
  private requestsThisMinute: number = 0;
  private lastResetTime: number = Date.now();
  private readonly rateLimit: number = 20; 
  private intervalId: NodeJS.Timeout;
  
  constructor() {

    this.intervalId = setInterval(() => {
      console.log(`Rate limit reset. Processed ${this.requestsThisMinute} requests in the last minute.`);
      this.requestsThisMinute = 0;
      this.lastResetTime = Date.now();
      
      if (this.queue.length > 0 && !this.processing) {
        this.processQueue();
      }
    }, 60 * 1000);
  }

  public async enqueue(
    systemPrompt: string,
    userPrompt: string | string[],
    outputFormat: any,
    defaultCategory: string = "",
    outputValueOnly: boolean = false,
    modelName: string = "gemini-2.0-flash",
    temperature: number = 1,
    numTries: number = 3,
    verbose: boolean = false,
    isChapterApiRequest: boolean = false
  ): Promise<any> {
    console.log(`Enqueueing new request. Current queue length: ${this.queue.length}`);
    
    return new Promise((resolve, reject) => {
      this.queue.push({
        systemPrompt,
        userPrompt,
        outputFormat,
        defaultCategory,
        outputValueOnly,
        modelName,
        temperature,
        numTries,
        verbose,
        isChapterApiRequest,
        resolve,
        reject
      });
      
      if (!this.processing) {
        console.log("Starting queue processing");
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      console.log("Queue is empty, stopping processing");
      this.processing = false;
      return;
    }

    this.processing = true;

    const timeUntilNextRequest = this.calculateWaitTime();
    
    if (timeUntilNextRequest > 0) {
      console.log(`Rate limit reached. Waiting ${timeUntilNextRequest}ms before next request.`);
      await new Promise(resolve => setTimeout(resolve, timeUntilNextRequest));
    }

    const request = this.queue.shift();
    if (!request) {
      console.log("No request found in queue, continuing");
      setTimeout(() => this.processQueue(), 0);
      return;
    }

    try {
      console.log(`Processing request. Queue length: ${this.queue.length}`);
      this.requestsThisMinute++;
      
      const result = await refined_output(
        request.systemPrompt,
        request.userPrompt,
        request.outputFormat,
        request.defaultCategory,
        request.outputValueOnly,
        request.modelName || "gemini-2.0-flash",
        request.temperature || 1,
        request.numTries || 3,
        request.verbose || false,
      );
      
      console.log("Request processed successfully");
      request.resolve(result);
    } catch (error) {
      console.error("Error processing request:", error);
      request.reject(error);
    }

    setTimeout(() => this.processQueue(), 0);
  }

  private calculateWaitTime(): number {
    if (this.requestsThisMinute < this.rateLimit) {
      return 0;
    }

    const elapsedTime = Date.now() - this.lastResetTime;
    const timeUntilReset = Math.max(0, 60 * 1000 - elapsedTime);
    
    return timeUntilReset;
  }

  public getStatus(): { queueLength: number, requestsThisMinute: number, isProcessing: boolean } {
    return {
      queueLength: this.queue.length,
      requestsThisMinute: this.requestsThisMinute,
      isProcessing: this.processing
    };
  }
  
  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export const requestQueue = new RequestQueue();