import OpenAI from "openai";
import "@logseq/libs";
import { backOff } from "exponential-backoff";

export type DalleImageSize = '256' | '256x256' | '512' | '512x512' | '1024' | '1024x1024' | '1024x1792' | '1792x1024';
export type DalleModel = 'dall-e-2' | 'dall-e-3';
export type DalleQuality = 'standard' | 'hd';
export type DalleStyle = 'natural' | 'vivid';
export interface OpenAIOptions {
  apiKey: string;
  completionEngine?: string;
  temperature?: number;
  maxTokens?: number;
  dalleImageSize?: DalleImageSize;
  dalleModel?: DalleModel;
  dalleQuality?: DalleQuality;
  dalleStyle?: DalleStyle;
  chatPrompt?: string;
  completionEndpoint?: string;
}

const OpenAIDefaults = (apiKey: string): OpenAIOptions => ({
  apiKey,
  completionEngine: "gpt-3.5-turbo",
  temperature: 1.0,
  maxTokens: 1000,
  dalleImageSize: '1024',
  dalleModel: 'dall-e-3',
  dalleQuality: 'standard',
  dalleStyle: 'vivid'
});

const retryOptions = {
  numOfAttempts: 7,
  retry: (err: any) => {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      // Handle the TypeError: Failed to fetch error
      console.warn('retrying due to network error', err);
      return true;
    }

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
    if (err.response.status >= 500) {
      return true;
    }

    return false;
  },
};

function migrateOldUrl(url: string) {
  if (url.startsWith("http://api.openai.com")) {
    return url.replace("http://api.openai.com", "https://api.openai.com");
  }
  return url;
}

export async function whisper(file: File,openAiOptions:OpenAIOptions): Promise<string> {
    const apiKey = openAiOptions.apiKey;
    const baseUrl = openAiOptions.completionEndpoint ? migrateOldUrl(openAiOptions.completionEndpoint)  : "https://api.openai.com/v1";
    const model = 'whisper-1';
  
    // Create a FormData object and append the file
    const formData = new FormData();
    formData.append('model', model);
    formData.append('file', file);
  
    // Send a request to the OpenAI API using a form post
    const response = await backOff(

    () => fetch(baseUrl + '/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    }), retryOptions);

    // Check if the response status is OK
    if (!response.ok) {
      throw new Error(`Error transcribing audio: ${response.statusText}`);
    }

    // Parse the response JSON and extract the transcription
    const jsonResponse = await response.json();
    return jsonResponse.text;
  }

export async function dallE(
  prompt: string,
  openAiOptions: OpenAIOptions
): Promise<string | undefined> {
  const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions };

  const openai = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.completionEndpoint,
    dangerouslyAllowBrowser: true
  });

  // TODO : fix this typing loop
  // @ts-ignore  
  const imageSizeRequest: OpenAI.ImageGenerateParams["size"] = options.dalleImageSize ?
  options.dalleImageSize!.includes('x') 
    ? options.dalleImageSize 
    : `${options.dalleImageSize}x${options.dalleImageSize}` : '256x256';  

  const imageParameters: OpenAI.ImageGenerateParams = {
    prompt,
    n: 1,
    size: imageSizeRequest,
    model: options.dalleModel,
    quality: options.dalleQuality,
    style: options.dalleStyle
  };

  const response = await backOff(
    () =>
      openai.images.generate(imageParameters),
    retryOptions
  );
  return response.data[0].url;
}

export async function openAI(
  input: string,
  openAiOptions: OpenAIOptions
): Promise<string | null> {
  const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions };
  const engine = options.completionEngine!;

  const openai = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.completionEndpoint
  });
  try {
    if (engine.startsWith("gpt-3.5") || engine.startsWith("gpt-4")) {
      const inputMessages:OpenAI.Chat.CreateChatCompletionRequestMessage[] =  [{ role: "user", content: input }];
      if (openAiOptions.chatPrompt && openAiOptions.chatPrompt.length > 0) {
        inputMessages.unshift({ role: "system", content: openAiOptions.chatPrompt });

      }
      const response = await backOff(
        () =>
          openai.chat.completions.create({
            messages: inputMessages,
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            model: engine,
          }),
        retryOptions
      );
      const choices = response.choices;
      if (
        choices &&
        choices[0] &&
        choices[0].message &&
        choices[0].message.content &&
        choices[0].message.content.length > 0
      ) {
        return trimLeadingWhitespace(choices[0].message.content);
      } else {
        return null;
      }
    } else {
      const response = await backOff(() =>
        openai.completions.create({
          prompt: input,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          model: engine,
        }),
        retryOptions
      );
      const choices = response.choices;
      if (
        choices &&
        choices[0] &&
        choices[0].text &&
        choices[0].text.length > 0
      ) {
        return trimLeadingWhitespace(choices[0].text);
      } else {
        return null;
      }
    }
  } catch (e: any) {
    if (e?.response?.data?.error) {
      console.error(e?.response?.data?.error);
      throw new Error(e?.response?.data?.error?.message);
    } else {
      throw e;
    }
  }
}

export async function openAIWithStream(
  input: string,
  openAiOptions: OpenAIOptions,
  onContent: (content: string) => void,
  onStop: () => void
): Promise<string | null> {
  const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions };
  const engine = options.completionEngine!;

  try {
    if (engine.startsWith("gpt-3.5") || engine.startsWith("gpt-4")) {
      const inputMessages: OpenAI.Chat.CreateChatCompletionRequestMessage[] = [{ role: "user", content: input }];
      if (openAiOptions.chatPrompt && openAiOptions.chatPrompt.length > 0) {
        inputMessages.unshift({ role: "system", content: openAiOptions.chatPrompt });
      }
      const body = {
        messages: inputMessages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        model: engine,
        stream: true
      }
      const response = await backOff(
        () =>
          fetch(`${options.completionEndpoint}/chat/completions`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
              Authorization: `Bearer ${options.apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream'
            }
          }).then((response) => {
            if (response.ok && response.body) {
              const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
              let result = ""
              const readStream = (): any =>
                reader.read().then(({
                                      value,
                                      done
                                    }) => {
                  if (done) {
                    reader.cancel();
                    onStop();
                    return Promise.resolve({ choices: [{ message: { content: result } }] });
                  }

                  const data = getDataFromStreamValue(value);
                  if (!data || !data[0]) {
                    return readStream();
                  }

                  let res = ""
                  for (let i = 0; i < data.length; i++) {
                    res += data[i].choices[0]?.delta?.content || ""
                  }
                  result += res
                  onContent(res)
                  return readStream();
                });
              return readStream();
            } else {
              return Promise.reject(response);
            }
          }),
        retryOptions
      );
      const choices = (response as OpenAI.Chat.Completions.ChatCompletion)?.choices;
      if (
        choices &&
        choices[0] &&
        choices[0].message &&
        choices[0].message.content &&
        choices[0].message.content.length > 0
      ) {
        return trimLeadingWhitespace(choices[0].message.content);
      } else {
        return null;
      }
    } else {
      const body = {
        prompt: input,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        model: engine,
        stream: true
      }
      const response = await backOff(
        () =>
          fetch(`${options.completionEndpoint}/completions`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
              Authorization: `Bearer ${options.apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream'
            }
          }).then((response) => {
            if (response.ok && response.body) {
              const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
              let result = ""
              const readStream = (): any =>
                reader.read().then(({
                                      value,
                                      done
                                    }) => {
                  if (done) {
                    reader.cancel();
                    onStop();
                    return Promise.resolve({ choices: [{ text: result }]});
                  }

                  const data = getDataFromStreamValue(value);
                  if (!data || !data[0]) {
                    return readStream();
                  }

                  let res = ""
                  for (let i = 0; i < data.length; i++) {
                    res += data[i].choices[0]?.text || ""
                  }
                  result += res
                  onContent(res)
                  return readStream();
                });
              return readStream();
            } else {
              return Promise.reject(response);
            }
          }),
        retryOptions
      );
      const choices = (response as OpenAI.Completion)?.choices;
      if (
        choices &&
        choices[0] &&
        choices[0].text &&
        choices[0].text.length > 0
      ) {
        return trimLeadingWhitespace(choices[0].text);
      } else {
        return null;
      }
    }
  } catch (e: any) {
    if (e?.response?.data?.error) {
      console.error(e?.response?.data?.error);
      throw new Error(e?.response?.data?.error?.message);
    } else {
      throw e;
    }
  }
}

function getDataFromStreamValue(value: string) {
  const matches = [...value.split("data:")];
  return matches.filter(content => content.trim().length > 0 && !content.trim().includes("[DONE]"))
    .map(match =>{
      try{
        return JSON.parse(match)
      } catch(e) {
        return null
      }
    });
}

function trimLeadingWhitespace(s: string): string {
  return s.replace(/^\s+/, "");
}
