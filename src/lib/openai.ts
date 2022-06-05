import { Configuration, OpenAIApi } from "openai";
import "@logseq/libs";

interface OpenAIOptions {
  apiKey: string;
  completionEngine?: string;
  temperature?: number;
  maxTokens?: number;
}

const OpenAIDefaults = (apiKey: string): OpenAIOptions => ({
  apiKey,
  completionEngine: 'text-davinci-002',
  temperature: 1.0,
  maxTokens: 1000,
});

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

  const response = await openai.createCompletion(engine, {
    prompt: input,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  const choices = response.data.choices;
  if (choices && choices[0] && choices[0].text) {
    return choices[0].text;
  } else {
    return null;
  }
}
