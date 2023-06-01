import { Command } from "../ui/LogseqAI";
import toml from "toml";
import prompts from "../prompts/prompts.toml?raw";
//extract content from inside ```gpt-prompt codeblock
function extractCodeblock(content: string) {
  const codeblockRegex = /```prompt\s+([\s\S]+)\s+```/g;
  const codeblock = content.match(codeblockRegex);
  if (codeblock) {
    return codeblock[0].replace(codeblockRegex, "$1");
  }
  return "";
}

export async function loadUserCommands() {
  const templatesQuery = `
[:find (pull ?b [*])
           :where
           [?b :block/properties ?props]
           [(get ?props :prompt-template)]]
`;

  const gptCodeBlock = "```prompt";

  const templatesContentsQuery = `
[:find (pull ?b [*])
           :where
           [?p :block/properties ?props]
           [(get ?props :prompt-template)]
           [?b :block/parent ?p]
           [?b :block/content ?c]
           [(re-pattern "${gptCodeBlock}") ?q]
           [(re-find ?q ?c)]]
`;

  const templateContentsResults = await logseq.DB.datascriptQuery(
    templatesContentsQuery
  );
  const templateContents = new Map<number, string>();
  for (const result of templateContentsResults) {
    const content = extractCodeblock(result[0].content);
    templateContents.set(result[0].parent.id, content);
  }
  const customTemplatesResults = await logseq.DB.datascriptQuery(
    templatesQuery
  );
  let customCommands = new Array<Command>();

  for (const result of customTemplatesResults) {
    const type = result[0].properties["prompt-template"];
    const prompt = templateContents.get(result[0].id);
    if (type && prompt) {
      customCommands.push({
        type: type,
        name: type,
        temperature: Number(result[0].properties["prompt-temperature"]),
        prompt: prompt,
      });
    }
  }

  return customCommands;
}

interface Prompt {
  name: string;
  temperature: number;
  description: string;
  prompt: string;
}
type Prompts = Record<string, Prompt>;

function promptsToCommands(prompts: Prompts): Command[] {
  return Object.entries(prompts).map(([name, prompt]) => {
    return {
      type: name,
      name: prompt.name,
      description: prompt.description,
      prompt: prompt.prompt,
      temperature: prompt.temperature,
    };
  });
}

export async function loadBuiltInCommands() {
  const parsedPrompts: Prompts = toml.parse(prompts);
  const parsedCommands = promptsToCommands(parsedPrompts);
  return parsedCommands;
}
