import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";
import { DalleImageSize, OpenAIOptions } from "./openai";

interface PluginOptions extends OpenAIOptions {
  injectPrefix?: string;
  converterHost?: string;
  converterPort?: number;
}

export const settingsSchema: SettingSchemaDesc[] = [
  {
    key: "openAIKey",
    type: "string",
    default: "",
    title: "OpenAI API Key",
    description:
      "Your OpenAI API key. You can get one at https://platform.openai.com",
  },
  {
    key: "openAICompletionEngine",
    type: "string",
    default: "gpt-3.5-turbo",
    title: "OpenAI Completion Engine",
    description: "See Models in OpenAI docs. Examples: gpt-3.5-turbo, gpt-4, gpt-4-turbo",
  },
  {
    key: "chatCompletionEndpoint",
    type: "string",
    default: "https://api.openai.com/v1",
    title: "OpenAI API Completion Endpoint",
    description:
      "The endpoint to use for OpenAI API completion requests. You shouldn't need to change this unless using a proxy or alternative service.",
  },
  {
    key: "chatPrompt",
    type: "string",
    default:
      "Do not refer to yourself in your answers. Do not say as an AI language model...",
    title: "OpenAI Chat Prompt",
    description:
      "Initial system message that tells ChatGPT how to answer. See https://platform.openai.com/docs/guides/chat/introduction for more info.",
  },
  {
    key: "openAITemperature",
    type: "number",
    default: 1.0,
    title: "OpenAI Temperature",
    description:
      "Controls randomness in output (0.0-2.0). Lower values make output more focused and deterministic.<br/>" +
      "You can set a different temperature in your own prompt templates by adding a 'prompt-template' property to the block.",
  },
  {
    key: "openAIMaxTokens",
    type: "number",
    default: 1000,
    title: "OpenAI Max Tokens",
    description:
      "Maximum tokens to generate. Roughly 1 token = 4 characters or 0.75 words for English text.<br/>" +
      "Note: Input + output tokens combined must not exceed the model's context length.",
  },
  {
    key: "injectPrefix",
    type: "string",
    default: "",
    title: "Output prefix",
    description:
      "Prepends output with this string. Examples: [[gpt3]] for a tag, > for blockquote.<br/>" +
      "Add a space at the end for spacing, or \\n for a line break.",
  },
  {
    key: "dalleImageSize",
    type: "string",
    default: "1024x1024",
    title: "DALL-E Image Size",
    description:
      "Image size to generate.<br/>" +
      "DALL-E 2: 256x256, 512x512, 1024x1024<br/>" +
      "DALL-E 3: 1024x1024, 1792x1024, 1024x1792",
  },
  {
    key: "dalleModel",
    type: "string",
    default: "dall-e-3",
    title: "DALL-E Model",
    description: "The DALL-E model to use. Options: dall-e-2, dall-e-3",
  },
  {
    key: "dalleStyle",
    type: "string",
    default: "vivid",
    title: "DALL-E Style",
    description:
      "Image style for DALL-E 3.<br/>" +
      "vivid: Hyper-real and dramatic images<br/>" +
      "natural: More natural, less hyper-real images",
  },
  {
    key: "dalleQuality",
    type: "string",
    default: "standard",
    title: "DALL-E Quality",
    description:
      "Image quality for DALL-E 3.<br/>" +
      "standard: Standard quality<br/>" +
      "hd: Higher detail and consistency (costs more)",
  },
  {
    key: "converterHost",
    type: "string",
    default: "127.0.0.1",
    title: "AAC Converter Host",
    description:
      "Host address for the AAC converter service.<br/>" +
      "Default: 127.0.0.1 (localhost)<br/>" +
      "Change this if running the converter on a different machine.<br/>" +
      "Example: 192.168.1.100 for a different computer on your network",
  },
  {
    key: "converterPort",
    type: "number",
    default: 3456,
    title: "AAC Converter Port",
    description:
      "Port number for the AAC converter service.<br/>" +
      "Default: 3456<br/>" +
      "Make sure this matches the port configured in the converter service.",
  },
  {
    key: "shortcutBlock",
    type: "string",
    default: "mod+j",
    title: "Keyboard Shortcut for /gpt-block",
    description: "Keyboard shortcut to trigger GPT on current block. Format: mod+key (mod = Ctrl/Cmd)",
  },
  {
    key: "popupShortcut",
    type: "string",
    default: "mod+g",
    title: "Keyboard Shortcut for /gpt popup",
    description: "Keyboard shortcut to open GPT popup. Format: mod+key (mod = Ctrl/Cmd)",
  },
];

function unescapeNewlines(s: string) {
  return s.replace(/\\n/g, "\n");
}

export function getOpenaiSettings(): PluginOptions {
  const apiKey = logseq.settings!["openAIKey"];
  const completionEngine = logseq.settings!["openAICompletionEngine"];
  const injectPrefix = unescapeNewlines(logseq.settings!["injectPrefix"]);
  const temperature = Number.parseFloat(logseq.settings!["openAITemperature"]);
  const maxTokens = Number.parseInt(logseq.settings!["openAIMaxTokens"]);
  const dalleImageSize = logseq.settings!["dalleImageSize"] as DalleImageSize;
  const dalleModel = logseq.settings!["dalleModel"];
  const dalleStyle = logseq.settings!["dalleStyle"];
  const dalleQuality = logseq.settings!["dalleQuality"];
  const chatPrompt = logseq.settings!["chatPrompt"];
  const completionEndpoint = logseq.settings!["chatCompletionEndpoint"];
  const converterHost = logseq.settings!["converterHost"] || "127.0.0.1";
  const converterPort = logseq.settings!["converterPort"] || 3456;

  return {
    apiKey,
    completionEngine,
    temperature,
    maxTokens,
    dalleImageSize,
    dalleModel,
    dalleQuality,
    dalleStyle,
    injectPrefix,
    chatPrompt,
    completionEndpoint,
    converterHost,
    converterPort,
  };
}