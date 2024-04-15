import { IHookEvent } from "@logseq/libs/dist/LSPlugin.user";
import { getAudioFile, getPageContentFromBlock, saveDalleImage } from "./logseq";
import { OpenAIOptions, dallE, whisper, openAIWithStream } from "./openai";
import { getOpenaiSettings } from "./settings";

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

  if (
    settings.dalleImageSize !== 256 &&
    settings.dalleImageSize !== 512 &&
    settings.dalleImageSize !== 1024
  ) {
    console.error("DALL-E image size must be 256, 512, or 1024.");
    logseq.App.showMsg("DALL-E image size must be 256, 512, or 1024.", "error");
    throw new Error("DALL-E image size must be 256, 512, or 1024.");
  }
}

export async function runGptBlock(b: IHookEvent) {
  const openAISettings = getOpenaiSettings();
  validateSettings(openAISettings);

  const currentBlock = await logseq.Editor.getBlock(b.uuid);
  if (!currentBlock) {
    console.error("No current block");
    return;
  }

  if (currentBlock.content.trim().length === 0) {
    logseq.App.showMsg("Empty Content", "warning");
    console.warn("Blank page");
    return;
  }

  try {
    let result = "";
    const insertBlock = await logseq.Editor.insertBlock(currentBlock.uuid, result, {
      sibling: false,
    });

    if(openAISettings.injectPrefix && result.length == 0) {
      result = openAISettings.injectPrefix + result;
    }

    await openAIWithStream(currentBlock.prompt, currentBlock.content, openAISettings,  async (content: string) => {
      result += content || "";
      if(null != insertBlock) {
         await logseq.Editor.updateBlock(insertBlock.uuid, result);
      }
    }, () => {});

    if (!result) {
      logseq.App.showMsg("No OpenAI content" , "warning");
      return;
    }
  } catch (e: any) {
    handleOpenAIError(e);
  }
}

export async function runGptPage(b: IHookEvent) {
  const openAISettings = getOpenaiSettings();
  validateSettings(openAISettings);

  const prompt = await b.uuid.prompt;
  const pageContents = await getPageContentFromBlock(b.uuid);
  const currentBlock = await logseq.Editor.getBlock(b.uuid);

  if (pageContents.length === 0) {
    logseq.App.showMsg("Empty Content", "warning");
    console.warn("Blank page");
    return;
  }

  if (!currentBlock) {
    console.error("No current block");
    return;
  }

  const page = await logseq.Editor.getPage(currentBlock.page.id);
  if (!page) {
    return;
  }

  try {
    let result = "";
    const insertBlock = await logseq.Editor.appendBlockInPage(page.uuid, result);

    if (openAISettings.injectPrefix && result.length == 0) {
      result = openAISettings.injectPrefix + result;
    }

    await openAIWithStream(prompt, pageContents, openAISettings,  async (content: string) => {
      result += content || "";
      if(null != insertBlock) {
        await logseq.Editor.updateBlock(insertBlock.uuid, result);
      }
    }, () => {});
    if (!result) {
      logseq.App.showMsg("No OpenAI content" , "warning");
      return;
    }

  } catch (e: any) {
    handleOpenAIError(e);
  }
}

export async function runDalleBlock(b: IHookEvent) {
  const openAISettings = getOpenaiSettings();
  validateSettings(openAISettings);

  const currentBlock = await logseq.Editor.getBlock(b.uuid);
  if (!currentBlock) {
    console.error("No current block");
    return;
  }

  if (currentBlock.content.trim().length === 0) {
    logseq.App.showMsg("Empty Content", "warning");
    console.warn("Blank block");
    return;
  }

  try {
    const imageURL = await dallE(currentBlock.content, openAISettings);
    if (!imageURL) {
      logseq.App.showMsg("No Dalle results.", "warning");
      return;
    }
    const imageFileName = await saveDalleImage(imageURL);
    await logseq.Editor.insertBlock(currentBlock.uuid, imageFileName, {
      sibling: false,
    });
  } catch (e: any) {
    handleOpenAIError(e);
  }
}

export async function runWhisper(b: IHookEvent) {
  const currentBlock = await logseq.Editor.getBlock(b.uuid);
  if (currentBlock) {
    const audioFile = await getAudioFile(currentBlock.content);
    if (!audioFile) {
      logseq.App.showMsg("No supported audio file found in block.", "warning");
      return;
    }
    const openAISettings = getOpenaiSettings();
    try {
      const transcribe = await whisper(audioFile, openAISettings);
      if (transcribe) {
        await logseq.Editor.insertBlock(currentBlock.uuid, transcribe);
      }
    } catch (e: any) {
      handleOpenAIError(e);
    }
  }
}