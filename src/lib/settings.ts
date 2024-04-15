import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";
import { DalleImageSize, OpenAIOptions } from "./openai";

interface PluginOptions extends OpenAIOptions {
  injectPrefix?: string;
}

export const settingsSchema: SettingSchemaDesc[] = [
  {
    key: "openAIKey",
    type: "string",
    default: "",
    title: "OpenAI API Key",
    description:
      "Your OpenAI API key. You can get one at https://beta.openai.com",
  },
  {
    key: "openAICompletionEngine",
    type: "string",
    default: "gpt-3.5-turbo",
    title: "OpenAI Completion Engine",
    description: "See Engines in OpenAI docs.",
  },
  {
    key: "chatCompletionEndpoint",
    type: "string",
    default: "http://api.openai.com/v1/chat/completions",
    title: "OpenAI API Completion Endpoint",
    description: "The endpoint to use for OpenAI API completion requests. You shouldn't need to change this."
  },
  {
    key: "customHeaders",
    type: "string",
    default: "",
    title: "OpenAI API Custom Headers3",
    description: "Custom headers to use for OpenAI API completion requests. You typically don't need to change this."
  },
  {
    key: "chatPrompt",
    type: "string",
    default: "Do not refer to yourself in your answers. Do not say as an AI language model...",
    title: "OpenAI Chat Prompt",
    description: "Initial message that tells ChatGPT how to answer. Only used for gpt-3.5. See https://platform.openai.com/docs/guides/chat/introduction for more info.",
  },
  {
    key: "openAITemperature",
    type: "number",
    default: 1.0,
    title: "OpenAI Temperature",
    description:
      "The temperature controls how much randomness is in the output.<br/>"+
      "You can set a different temperature in your own prompt templates by adding a 'prompt-template' property to the block.",
  },
  {
    key: "openAIMaxTokens",
    type: "number",
    default: 1000,
    title: "OpenAI Max Tokens",
    description:
      "The maximum amount of tokens to generate. Tokens can be words or just chunks of characters. The number of tokens processed in a given API request depends on the length of both your inputs and outputs. As a rough rule of thumb, 1 token is approximately 4 characters or 0.75 words for English text. One limitation to keep in mind is that your text prompt and generated completion combined must be no more than the model's maximum context length (for most models this is 2048 tokens, or about 1500 words).",
  },
  {
    key: "injectPrefix",
    type: "string",
    default: "",
    title: "Output prefix",
    description:
      "Prepends the output with this string. Such as a tag like [[gpt3]] or markdown like > to blockquote. Add a space at the end if you want a space between the prefix and the output or \\n for a linebreak.",
  },
  {
    key: "dalleImageSize",
    type: "number",
    default: 1024,
    title: "DALL-E Image Size",
    description:
      "Size of the image to generate. Can be 256, 512, or 1024. Smaller images are faster to generate.",
  },
  {
    key: "shortcutBlock",
    type: "string",
    default: "mod+j",
    title: "Keyboard Shortcut for /gpt-block",
    description: ""
  },
  {
    key: "popupShortcut",
    type: "string",
    default: "mod+g",
    title: "Keyboard Shortcut for /gpt popup",
    description: ""
  },
];

function unescapeNewlines(s: string) {
  return s.replace(/\\n/g, "\n");
}

export function getOpenaiSettings(): PluginOptions {
  const apiKey = logseq.settings!["openAIKey"];
  const customHeaders = logseq.settings!["customHeaders"];
  const completionEngine = logseq.settings!["openAICompletionEngine"];
  const injectPrefix = unescapeNewlines(logseq.settings!["injectPrefix"]);
  const temperature = Number.parseFloat(logseq.settings!["openAITemperature"]);
  const maxTokens = Number.parseInt(logseq.settings!["openAIMaxTokens"]);
  const dalleImageSize = Number.parseInt(
    logseq.settings!["dalleImageSize"]
  ) as DalleImageSize;
  const chatPrompt = logseq.settings!["chatPrompt"];
  const completionEndpoint = logseq.settings!["chatCompletionEndpoint"];
  return {
    apiKey,
    customHeaders,
    completionEngine,
    temperature,
    maxTokens,
    dalleImageSize,
    injectPrefix,
    chatPrompt,
    completionEndpoint,
  };
}
