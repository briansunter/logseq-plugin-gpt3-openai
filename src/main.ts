import "./style.css";
import "@logseq/libs";
import { openAI } from "./lib/openai";
import { SettingSchemaDesc, IHookEvent } from "@logseq/libs/dist/LSPlugin.user";
import { backOff } from "exponential-backoff";

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

async function runOpenAI(b: IHookEvent) {
  const apiKey = logseq.settings!["openAIKey"];
  const completionEngine = logseq.settings!["openAICompletionEngine"];
  const temperature = Number.parseFloat(logseq.settings!["openAITemperature"]);
  const maxTokens = Number.parseInt(logseq.settings!["openAIMaxTokens"]);

  if (!apiKey) {
    console.error("Need API key set in settings.");
    logseq.App.showMsg(
      "Need openai API key. Add one in plugin settings.",
      "error"
    );
    return;
  }

  const currentBlock = await logseq.Editor.getBlock(b.uuid);
  if (currentBlock) {
    try {
      const retryOptions = {
        numOfAttempts: 3,
        retry: (err: any) => {
          if (!err.response || !err.response.data || !err.response.data.error) {
            return false;
          }
          if (err.response.status === 429) {
            const errorCode = err.response.data.error.code;
            if (errorCode === "insufficient_quota") {
              return false;
            }
            console.warn("Rate limit exceeded. Retrying...");
            return true;
          }
          return false;
        },
      };
      const result = await backOff(
        () =>
          openAI(currentBlock.content, {
            apiKey,
            completionEngine,
            maxTokens,
            temperature,
          }),
        retryOptions
      );
      if (result) {
        await logseq.Editor.insertBlock(currentBlock.uuid, result, {
          sibling: false,
        });
      } else {
        logseq.App.showMsg("No OpenAI results.", "warning");
      }
    } catch (e: any) {
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
        if (errorCode === "insufficient_quota") {
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
  }
}
async function main() {
  logseq.Editor.registerSlashCommand("gpt3", runOpenAI);
  logseq.Editor.registerBlockContextMenuItem("gpt3", runOpenAI);
}

logseq.ready(main).catch(console.error);
