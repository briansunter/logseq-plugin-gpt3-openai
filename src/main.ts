import "./style.css";
import "@logseq/libs";
import { openAI, OpenAIOptions } from "./lib/openai";
import { getPageContentFromBlock } from "./lib/logseq";
import { SettingSchemaDesc, IHookEvent } from "@logseq/libs/dist/LSPlugin.user";

const settingsSchema: SettingSchemaDesc[] = [
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
    default: "text-davinci-002",
    title: "OpenAI Completion Engine",
    description: "See Engines in OpenAI docs.",
  },
  {
    key: "openAITemperature",
    type: "number",
    default: 1.0,
    title: "OpenAI Temperature",
    description:
      "The temperature controls how much randomness is in the output.",
  },
  {
    key: "openAIMaxTokens",
    type: "number",
    default: 1000,
    title: "OpenAI Max Tokens",
    description:
      "The maximum amount of tokens to generate. Tokens can be words or just chunks of characters. The number of tokens processed in a given API request depends on the length of both your inputs and outputs. As a rough rule of thumb, 1 token is approximately 4 characters or 0.75 words for English text. One limitation to keep in mind is that your text prompt and generated completion combined must be no more than the model's maximum context length (for most models this is 2048 tokens, or about 1500 words).",
  },
];

logseq.useSettingsSchema(settingsSchema);

function getOpenaiSettings(): OpenAIOptions {
  const apiKey = logseq.settings!["openAIKey"];
  const completionEngine = logseq.settings!["openAICompletionEngine"];
  const temperature = Number.parseFloat(logseq.settings!["openAITemperature"]);
  const maxTokens = Number.parseInt(logseq.settings!["openAIMaxTokens"]);
  return { apiKey, completionEngine, temperature, maxTokens };
}

function handleOpenAIError(e: any) {
  if (
    !e.response ||
    !e.response.status ||
    !e.response.data ||
    !e.response.data.error
  ) {
    console.error(`Unknown OpenAI error: ${e}`);
    logseq.App.showMsg("Unknown OpenAI Error", "error");
    return;
  }

  const httpStatus = e.response.status;
  const errorCode = e.response.data.error.code;
  const errorMessage = e.response.data.error.message;
  const errorType = e.response.data.error.type;

  if (httpStatus === 401) {
    console.error("OpenAI API key is invalid.");
    logseq.App.showMsg("Invalid OpenAI API Key.", "error");
  } else if (httpStatus === 429) {
    if (errorType === "insufficient_quota") {
      console.error(
        "Exceeded OpenAI API quota. Or your trial is over. You can buy more at https://beta.openai.com/account/billing/overview"
      );
      logseq.App.showMsg("OpenAI Quota Reached", "error");
    } else {
      console.warn(
        "OpenAI API rate limit exceeded. Try slowing down your requests."
      );
      logseq.App.showMsg("OpenAI Rate Limited", "warning");
    }
  } else {
    logseq.App.showMsg("OpenAI Plugin Error", "error");
  }
  console.error(`OpenAI error: ${errorType} ${errorCode}  ${errorMessage}`);
}

function validateSettings(settings: OpenAIOptions) {
  if (!settings.apiKey) {
    console.error("Need API key set in settings.");
    logseq.App.showMsg(
      "Need openai API key. Add one in plugin settings.",
      "error"
    );
    throw new Error("Need API key set in settings.");
  }
}

async function runGptBlock(b: IHookEvent) {
  const openAISettings = getOpenaiSettings();
  validateSettings(openAISettings);

  const currentBlock = await logseq.Editor.getBlock(b.uuid);
  if (currentBlock) {
    try {
      const result = await openAI(currentBlock.content, openAISettings);
      if (result) {
        await logseq.Editor.insertBlock(currentBlock.uuid, result, {
          sibling: false,
        });
      } else {
        logseq.App.showMsg("No OpenAI results.", "warning");
      }
    } catch (e: any) {
      handleOpenAIError(e);
    }
  }
}

async function runGptPage(b: IHookEvent) {
  const openAISettings = getOpenaiSettings();
  validateSettings(openAISettings);

  const pageContents = await getPageContentFromBlock(b.uuid);
  const currentBlock = await logseq.Editor.getBlock(b.uuid);
  if (!currentBlock) {
    return;
  }
  const page = await logseq.Editor.getPage(currentBlock.page.id);
  if (!page) {
    return;
  }

  console.log(pageContents);
  if (pageContents.length > 0 && currentBlock) {
    try {
      const result = await openAI(pageContents, openAISettings);
      if (result) {
        await logseq.Editor.appendBlockInPage(page.uuid, result);
      } else {
        logseq.App.showMsg("No OpenAI results.", "warning");
      }
    } catch (e: any) {
      handleOpenAIError(e);
    }
  }
}

async function main() {
  logseq.Editor.registerSlashCommand("gpt3-block", runGptBlock);
  logseq.Editor.registerBlockContextMenuItem("gpt3-block", runGptBlock);
  logseq.Editor.registerSlashCommand("gpt-page", runGptPage);
  logseq.Editor.registerBlockContextMenuItem("gpt3-page", runGptPage);
}

logseq.ready(main).catch(console.error);
