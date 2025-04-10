//to prevent rate limit of gemini(wont be useful when we got cred in api)

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
  private lastRequestTime: number = 0;
  private readonly rateLimit: number = 20; 
  private readonly requestDelay: number = 10000; // 10 sec
  private intervalId: NodeJS.Timeout;
  
  constructor() {
    this.intervalId = setInterval(() => {
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
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    const waitTime = this.calculateWaitTime();
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const request = this.queue.shift();
    if (!request) {
      setTimeout(() => this.processQueue(), 0);
      return;
    }

    try {
      this.requestsThisMinute++;
      this.lastRequestTime = Date.now();
      
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
      

      request.resolve(result);
    } catch (error) {
      console.error("Error processing request:", error);
      request.reject(error);
    }

    setTimeout(() => this.processQueue(), 0);
  }

  private calculateWaitTime(): number {
    const now = Date.now();
    
    const timeSinceLastRequest = now - this.lastRequestTime;
    const timeNeededForDelay = Math.max(0, this.requestDelay - timeSinceLastRequest);
    
    let timeNeededForRateLimit = 0;
    if (this.requestsThisMinute >= this.rateLimit) {
      const elapsedTime = now - this.lastResetTime;
      timeNeededForRateLimit = Math.max(0, 60 * 1000 - elapsedTime);
    }
    

    return Math.max(timeNeededForDelay, timeNeededForRateLimit);
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