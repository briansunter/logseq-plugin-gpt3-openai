import "./style.css";
import "@logseq/libs";
import { openAI } from "./lib/openai";
import {
  SettingSchemaDesc,
  IHookEvent,
  BlockEntity,
  BlockUUIDTuple,
} from "@logseq/libs/dist/LSPlugin.user";

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
    default: 500,
    title: "OpenAI Max Tokens",
    description:
      "The maximum amount of tokens to generate. Tokens can be words or just chunks of characters. The number of tokens processed in a given API request depends on the length of both your inputs and outputs. As a rough rule of thumb, 1 token is approximately 4 characters or 0.75 words for English text. One limitation to keep in mind is that your text prompt and generated completion combined must be no more than the model's maximum context length (for most models this is 2048 tokens, or about 1500 words).",
  },
];

logseq.useSettingsSchema(settingsSchema);
function isBlock(pet: BlockEntity | BlockUUIDTuple): pet is BlockEntity {
  return (pet as BlockEntity).id !== undefined;
}

function isBlockTuple(
  pet: BlockEntity | BlockUUIDTuple
): pet is BlockUUIDTuple {
  return (pet as BlockUUIDTuple)[0] === "uuid";
}

// async function getAncestorText(block: BlockEntity) {
//   let finished = false;
//   let text = [];
//   let currentBlock = block;
//   while (!finished) {
//     text.push(currentBlock.content);
//     if (!currentBlock.parent) {
//       finished = true;
//     } else {
//       const parent = await logseq.Editor.getBlock(currentBlock.parent.id, {includeChildren: true});
//       if (!parent) {
//         finished = true;
//         break;
//       }
//       if (parent.children) {
//         // console.log(`parent: ${JSON.stringify(parent)}`);
//         for (const child of parent.children) {
//           if (isBlock(child)) {
//             const t = await getChildrenText(child);
//             text.push(t);
//           } else {
//             const b = await logseq.Editor.getBlock(child[1], {
//               includeChildren: true,
//             });
//             if (b) {
//               const t = await getChildrenText(b);
//               text.push(t);
//             }
//           }
//         }
//         currentBlock = parent;
//       }
//     }
//   }
//   return text.reverse().join("\n");
// }
async function getAncestorText(block: BlockEntity) {
  let currentBlock = block;
  let finished = false;

  while (!finished){
    if (!currentBlock.parent) {
      finished = true;
    } else {
      const parent = await logseq.Editor.getBlock(currentBlock.parent.id, {
        includeChildren: true,
      });
      if (!parent) {
        finished = true;
        break;
      } else {
        currentBlock = parent;
      }
    } 
  }
  return getChildrenText(currentBlock);
}


async function getChildrenText(block: BlockEntity) {
  let text = "";
  const doGetChildrenText = async (block: BlockEntity) => {
    if (isBlock(block)) {
      text += block.content;
      text += "\n";
      if (block.children) {
        for (const child of block.children) {
          if (isBlock(child)) {
            await doGetChildrenText(child);
          } else if (isBlockTuple(child)) {
            const childBlock = await logseq.Editor.getBlock(child[1]);
            if (childBlock) {
              await doGetChildrenText(childBlock);
            }
          }
        }
      }
    } else if (isBlockTuple(block)) {
      const childBlock = await logseq.Editor.getBlock(block[1], {
        includeChildren: true,
      });
      if (childBlock) {
        await doGetChildrenText(childBlock);
      }
    }
  };

  await doGetChildrenText(block);
  return text;
}
interface RunOpenAICommand {
  type: "current" | "up" | "down";
}

async function runOpenAI(b: IHookEvent, cmd: RunOpenAICommand) {
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
  let openaiPrompt = "";
  const currentBlock = await logseq.Editor.getBlock(b.uuid);
  if (cmd.type === "current") {
    if (currentBlock) {
      openaiPrompt = currentBlock.content;
    }
  } else if (cmd.type === "up") {
    if (currentBlock) {
      openaiPrompt = await getAncestorText(currentBlock);
    }
  } else if (cmd.type === "down") {
    const currentBlock = await logseq.Editor.getBlock(b.uuid, {
      includeChildren: true,
    });
    if (currentBlock) {
      const childText = await getChildrenText(currentBlock);
      if (childText) {
        openaiPrompt = childText;
      }
    }
  } else {
    console.error("Unknown command type");
  }
  console.log(openaiPrompt);
  if (openaiPrompt && currentBlock) {
    try {
      const result = await openAI(openaiPrompt, {
        apiKey,
        completionEngine,
        maxTokens,
        temperature,
      });
      if (result) {
        await logseq.Editor.insertBlock(currentBlock.uuid, result, {
          sibling: false,
        });
      } else {
        logseq.App.showMsg("No OpenAI results.", "warning");
      }
    } catch (e) {
      console.error("openai plugin error");
      console.error(e);
      logseq.App.showMsg("OpenAI Plugin Error", "error");
    }
  }
}

async function main() {
  logseq.Editor.registerSlashCommand("gpt-current", (e) =>
    runOpenAI(e, { type: "current" })
  );
  logseq.Editor.registerBlockContextMenuItem("gpt-current", (e) =>
    runOpenAI(e, { type: "current" })
  );

  logseq.Editor.registerSlashCommand("gpt-down", (e) =>
    runOpenAI(e, { type: "down" })
  );
  logseq.Editor.registerBlockContextMenuItem("gpt-down", (e) =>
    runOpenAI(e, { type: "down" })
  );

  logseq.Editor.registerSlashCommand("gpt-up", (e) =>
    runOpenAI(e, { type: "up" })
  );
  logseq.Editor.registerBlockContextMenuItem("gpt-up", (e) =>
    runOpenAI(e, { type: "up" })
  );
}

logseq.ready(main).catch(console.error);
