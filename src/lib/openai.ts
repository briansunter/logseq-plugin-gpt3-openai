import { Configuration, CreateImageRequestSizeEnum, OpenAIApi } from "openai";
import "@logseq/libs";
import { backOff } from "exponential-backoff";

export type DalleImageSize = 256 | 512 | 1024;
export interface OpenAIOptions {
  apiKey: string;
  completionEngine?: string;
  temperature?: number;
  maxTokens?: number;
  dalleImageSize?: DalleImageSize;
}

const OpenAIDefaults = (apiKey: string): OpenAIOptions => ({
  apiKey,
  completionEngine: "text-davinci-003",
  temperature: 1.0,
  maxTokens: 1000,
  dalleImageSize: 1024,
});

const retryOptions = {
  numOfAttempts: 3,
  retry: (err: any) => {
    if (!err.response || !err.response.data || !err.response.data.error) {
      return false;
    }
    if (err.response.status === 429) {
      const errorType = err.response.data.error.type;
      if (errorType === "insufficient_quota") {
        return false;
      }
      console.warn("Rate limit exceeded. Retrying...");
      return true;
    }
    return false;
  },
};
export async function dallE(
  prompt: string,
  openAiOptions: OpenAIOptions
): Promise<string | undefined> {
  const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions };

  const configuration = new Configuration({
    apiKey: options.apiKey,
  });

  const openai = new OpenAIApi(configuration);
const imageSizeRequest: CreateImageRequestSizeEnum = `${options.dalleImageSize}x${options.dalleImageSize}` as CreateImageRequestSizeEnum;

  const response = await backOff(() => openai.createImage({
    prompt,
    n: 1,
    size: imageSizeRequest,
  }), retryOptions);
  return response.data.data[0].url;
}
  
export async function openAI(
  input: string,
  openAiOptions: OpenAIOptions,
  action: string = "default",
): Promise<string | null> {
  const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions };
  const engine = options.completionEngine!;

  const configuration = new Configuration({
    apiKey: options.apiKey,
  });

  const openai = new OpenAIApi(configuration);

  // Build prompt
  let userPrompt = "";
  if (action === "rephrase-block") {
    userPrompt = input + "\nGenerate a variation of the text above. Ideally make it shorter and more engaging.";
  } else {
    userPrompt = input;
  }

  const response = await backOff(
    () =>
      openai.createCompletion({
        prompt: userPrompt,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        model: engine
      }),
    retryOptions
  );

  const choices = response.data.choices;
  if (choices && choices[0] && choices[0].text && choices[0].text.length > 0) {
    return trimLeadingWhitespace(choices[0].text);
  } else {
    return null;
  }
}

function trimLeadingWhitespace(s: string): string {
  return s.replace(/^\s+/, "");
}