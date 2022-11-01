import { Configuration, OpenAIApi } from "openai";
import "@logseq/libs";
import { backOff } from "exponential-backoff";
export interface OpenAIOptions {
  apiKey: string;
  completionEngine?: string;
  temperature?: number;
  maxTokens?: number;
}

const OpenAIDefaults = (apiKey: string): OpenAIOptions => ({
  apiKey,
  completionEngine: "text-davinci-002",
  temperature: 1.0,
  maxTokens: 1000,
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

export async function openAI(
  input: string,
  openAiOptions: OpenAIOptions
): Promise<string | null> {
  const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions };
  const engine = options.completionEngine!;

  const configuration = new Configuration({
    apiKey: options.apiKey,
  });

  const openai = new OpenAIApi(configuration);

  const response = await backOff(
    () =>
      openai.createCompletion(engine, {
        prompt: input,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    retryOptions
  );

  const choices = response.data.choices;
  if (choices && choices[0] && choices[0].text && choices[0].text.length > 0) {
    return choices[0].text;
  } else {
    return null;
  }
}
