import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionResponse,
  CreateImageRequestSizeEnum,
  OpenAIApi
} from "openai";

// import "@logseq/libs";
import { backOff } from "exponential-backoff";
// import axios from "axios";
// import fetch from "typescript";
// import fetch from "fetch-cross";

export type DalleImageSize = 256 | 512 | 1024;

export interface OpenAIOptions {
  apiKey: string;
  baseUrl?: string;
  completionEngine?: string;
  temperature?: number;
  maxTokens?: number;
  dalleImageSize?: DalleImageSize;
  chatPrompt?: string;
}

const OpenAIDefaults = (apiKey: string): OpenAIOptions => ({
  apiKey,
  completionEngine: "gpt-3.5-turbo",
  temperature: 1.0,
  maxTokens: 1000,
  dalleImageSize: 1024
});

const retryOptions = {
  numOfAttempts: 7,
  retry: (err: any) => {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      // Handle the TypeError: Failed to fetch error
      console.warn("retrying due to network error", err);
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
  }
};

export async function whisper(file: File, openAiOptions: OpenAIOptions): Promise<string> {
  const apiKey = openAiOptions.apiKey;
  const baseUrl = openAiOptions.baseUrl ? "https://api.openai.com/v1" : openAiOptions.baseUrl;
  const model = "whisper-1";

  // Create a FormData object and append the file
  const formData = new FormData();
  formData.append("model", model);
  formData.append("file", file);

  // Send a request to the OpenAI API using a form post
  const response = await backOff(
    () => fetch(baseUrl + "/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: formData
    }), retryOptions);

  // Check if the response status is OK
  if (!response.ok) {
    throw new Error(`Error transcribing audio: ${response.statusText}`);
  }

  // Parse the response JSON and extract the transcription
  const jsonResponse = await response.json() as any;
  return jsonResponse.text;
}

export async function dallE(
  prompt: string,
  openAiOptions: OpenAIOptions
): Promise<string | undefined> {
  const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions };

  const configuration = new Configuration({
    apiKey: options.apiKey
  });

  const openai = new OpenAIApi(configuration, options.baseUrl);
  const imageSizeRequest: CreateImageRequestSizeEnum =
    `${options.dalleImageSize}x${options.dalleImageSize}` as CreateImageRequestSizeEnum;

  const response = await backOff(
    () =>
      openai.createImage({
        prompt,
        n: 1,
        size: imageSizeRequest
      }),
    retryOptions
  );
  return response.data.data[0].url;
}

export async function openAI(
  input: string,
  openAiOptions: OpenAIOptions
): Promise<string | null> {
  const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions };
  const engine = options.completionEngine!;

  const configuration = new Configuration({
    apiKey: options.apiKey
  });

  const openai = new OpenAIApi(configuration, options.baseUrl);
  try {
    if (engine.startsWith("gpt-3.5") || engine.startsWith("gpt-4")) {
      const inputMessages: ChatCompletionRequestMessage[] = [{ role: "user", content: input }];
      if (openAiOptions.chatPrompt && openAiOptions.chatPrompt.length > 0) {
        inputMessages.unshift({ role: "system", content: openAiOptions.chatPrompt });

      }
      const response = await backOff(
        () =>
           openai.createChatCompletion({
            messages: inputMessages,
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            model: engine
          })
        ,
        retryOptions
      );
      const choices = response.data.choices;
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
          openai.createCompletion({
            prompt: input,
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
    const inputMessages: ChatCompletionRequestMessage[] = [{ role: "user", content: input }];
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
          fetch(`${options.baseUrl}/chat/completions`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { Authorization: `Bearer ${options.apiKey}`,
              "Content-Type": "application/json",
              "Accept": "text/event-stream"
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
                    return Promise.resolve({choices:[{message: {content: result}}]});
                  }

                  const matches = [...value.split("data:")];
                  const data = matches.filter(content => content.trim().length > 0 && !content.trim().includes("[DONE]") )
                    .map(match => JSON.parse(match));
                  if (!data || !data[0]) {
                    return readStream();
                  }

                  let res = ""
                  for(let i = 0; i < data.length; i++) {
                    res += data[i].choices[0]?.delta?.content || ""
                  }
                  console.log(res)
                  result += res
                  onContent(res)
                  // do something if success
                  // and cancel the stream
                  // reader.cancel().catch(() => null);

                  return readStream();
                });
              return readStream();
            } else {
              return Promise.reject(response);
            }
          }),
      retryOptions
    );
    const choices = (response as CreateChatCompletionResponse)?.choices;
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
  } catch (e: any) {
    if (e?.response?.data?.error) {
      console.error(e?.response?.data?.error);
      throw new Error(e?.response?.data?.error?.message);
    } else {
      throw e;
    }
  }
}

// export async function openAIWithStream(
//   input: string,
//   openAiOptions: OpenAIOptions,
//   onContent: (content: string) => void,
//   onStop: () => void
// ): Promise<string | null> {
//   const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions };
//   const engine = options.completionEngine!;
//
//   try {
//     const inputMessages: ChatCompletionRequestMessage[] = [{ role: "user", content: input }];
//     if (openAiOptions.chatPrompt && openAiOptions.chatPrompt.length > 0) {
//       inputMessages.unshift({ role: "system", content: openAiOptions.chatPrompt });
//     }
//     const response = await backOff(
//       () =>
//         new Promise((resolve, reject) => {
//           axios.post(`${options.baseUrl}/chat/completions`, {
//             messages: inputMessages,
//             temperature: options.temperature,
//             max_tokens: options.maxTokens,
//             top_p: 1,
//             frequency_penalty: 0,
//             presence_penalty: 0,
//             model: engine,
//             stream: true
//           }, {
//             responseType: 'stream',
//             headers: { Authorization: `Bearer ${options.apiKey}`,
//               "Content-Type": "application/json",
//               "Accept": "text/event-stream"
//             }
//           }).then((response) => {
//             let result = "";
//             response.data.on("data", (data: any) => {
//               let content = data.toString();
//               // console.log(content);
//               let isDone = false;
//               if (content.includes("data:")) {
//                 content += content.split("data:").map((s: string) => {
//                   if (s.includes("[DONE]")) {
//                     isDone = true;
//                     return "";
//                   } else if (s.trim().length == 0) {
//                     return "";
//                   } else {
//                     console.log("s:" + s);
//                     return JSON.parse(s)?.choices[0]?.delta?.content || "";
//                   }
//                 }).join("");
//               }
//
//               result += content;
//               onContent(content);
//               if (isDone) {
//                 resolve({ choices: [{ message: { content: result } }] } as unknown as CreateChatCompletionResponse);
//                 onStop();
//                 return;
//               }
//             });
//           }).catch((e) => {
//             reject(e);
//           });
//         }),
//       retryOptions
//     );
//     const choices = (response as CreateChatCompletionResponse)?.choices;
//     if (
//       choices &&
//       choices[0] &&
//       choices[0].message &&
//       choices[0].message.content &&
//       choices[0].message.content.length > 0
//     ) {
//       return trimLeadingWhitespace(choices[0].message.content);
//     } else {
//       return null;
//     }
//   } catch (e: any) {
//     if (e?.response?.data?.error) {
//       console.error(e?.response?.data?.error);
//       throw new Error(e?.response?.data?.error?.message);
//     } else {
//       throw e;
//     }
//   }
// }

function trimLeadingWhitespace(s: string): string {
  return s.replace(/^\s+/, "");
}
