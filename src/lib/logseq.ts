import { BlockEntity, BlockUUIDTuple } from "@logseq/libs/dist/LSPlugin.user";


async function lastBlockOnPageOfBlock(
  b: BlockEntity
): Promise<BlockEntity | null> {
  const currentBlock = await logseq.Editor.getBlock(b);
  if (!currentBlock) {
    return null;
  }
  const page = await logseq.Editor.getPage(currentBlock.page.id);
  if (!page) {
    return null;
  }
  const pageBlocks = await logseq.Editor.getPageBlocksTree(page.name);
  return pageBlocks[pageBlocks.length - 1];
}

function isBlockEntity(b: BlockEntity | BlockUUIDTuple): b is BlockEntity {
  return (b as BlockEntity).uuid !== undefined;
}

async function doGetPageContent(b: BlockEntity) {
  let content = "";
  if (b.content.trim().length > 0) {
    content += b.content;
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
  if (currentBlock) {
    const page = await logseq.Editor.getPage(currentBlock.page.id);
    if (page) {
      const pageBlocks = await logseq.Editor.getPageBlocksTree(page.name);
      for (const pageBlock of pageBlocks) {
        const blockContent = await doGetPageContent(pageBlock);
        blockContents.push(blockContent);
      }
    }
  }
  console.log(blockContents.join(" "));
  return blockContents.join(" ");
}

export { getPageContentFromBlock, lastBlockOnPageOfBlock };
