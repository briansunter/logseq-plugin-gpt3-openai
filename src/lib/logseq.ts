import { BlockEntity, BlockUUIDTuple } from "@logseq/libs/dist/LSPlugin.user";

function isBlockEntity(b: BlockEntity | BlockUUIDTuple): b is BlockEntity {
  return (b as BlockEntity).uuid !== undefined;
}

async function getTreeContent(b: BlockEntity) {
  let content = "";
  const trimmedBlockContent = b.content.trim();
  if (trimmedBlockContent.length > 0) {
    content += trimmedBlockContent;
  }

  if (!b.children) {
    return content;
  }

  for (const child of b.children) {
    if (isBlockEntity(child)) {
      content += await getTreeContent(child);
    } else {
      const childBlock = await logseq.Editor.getBlock(child[1], {
        includeChildren: true,
      });
      if (childBlock) {
        content += await getTreeContent(childBlock);
      }
    }
  }
  return content;
}

export async function getPageContentFromBlock(b: BlockEntity): Promise<string> {
  let blockContents = [];

  const currentBlock = await logseq.Editor.getBlock(b);
  if (!currentBlock) {
    throw new Error("Block not found");
  }

  const page = await logseq.Editor.getPage(currentBlock.page.id);
  if (!page) {
    throw new Error("Page not found");
  }

  const pageBlocks = await logseq.Editor.getPageBlocksTree(page.name);
  for (const pageBlock of pageBlocks) {
    const blockContent = await getTreeContent(pageBlock);
    if (blockContent.length > 0) {
      blockContents.push(blockContent);
    }
  }
  return blockContents.join(" ");
}

export async function saveDalleImage(imageURL: string): Promise<string> {
  const s = logseq.Assets.makeSandboxStorage();
  const imageName = `dalle-${Date.now()}.png`;

  const response = await fetch(imageURL);

  const responseArrayBuffer: any = await response.arrayBuffer();
  await s.setItem(imageName, responseArrayBuffer);
  const imageFileName = `![](../assets/storages/logseq-plugin-gpt3-openai/${imageName})`;
  return imageFileName;
}

export async function getAudioFile(content: string): Promise<File | null> {
  //supported formats are mp3, mp4, mpeg, mpga, m4a, wav, and webm
  //extract file path in () from markdown link like ![my file](assets/2023-03-17-13-24-36.m4a)
  const regex = /!\[.*\]\((.*(mp3|mp4|mpeg|mpga|m4a|wav|webm))\)/;
  const path = (await logseq.App.getCurrentGraph())?.path;
  const match = regex.exec(content);
  if (!match || !match[1]) {
    return null;
  }
  //get extension from file path
  const extension = match[1].split(".").pop();
  if (!extension) {
    return null;
  }
  //remove ../ from path
  const filepath = match[1].replace("../", "");
  // get filename from path by removing assets/ from path
  const filename = filepath.replace("assets/", "");
  const fullFilename = "file://" + path + "/" + filepath;
  const response = await fetch(fullFilename);
  const audioBlob = await response.blob();
  const file = new File([audioBlob], filename, { type: `audio/${extension}` });
  return file;
}

