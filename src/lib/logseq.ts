import { BlockEntity, BlockUUIDTuple } from "@logseq/libs/dist/LSPlugin.user";

function isBlockEntity(b: BlockEntity | BlockUUIDTuple): b is BlockEntity {
  return (b as BlockEntity).uuid !== undefined;
}
async function doGetPageContent(b: BlockEntity) {
  let content = "";
  const trimmedBlockContent = b.content.trim();
  if (trimmedBlockContent.length > 0) {
    content += b.content.trim();
  }

  if (b.children) {
    for (const child of b.children) {
      if (isBlockEntity(child)) {
        content += await doGetPageContent(child);
      } else {
        const childBlock = await logseq.Editor.getBlock(child[1], {
          includeChildren: true,
        });
        if (childBlock) {
          content += await doGetPageContent(childBlock);
        }
      }
    }
  }
  return content;
}

async function getPageContentFromBlock(b: BlockEntity): Promise<string> {
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
    const blockContent = await doGetPageContent(pageBlock);
    blockContents.push(blockContent);
  }
  return blockContents.join(" ");
}

export { getPageContentFromBlock };
