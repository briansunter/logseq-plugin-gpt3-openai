import "./ui/style.css";
import "@logseq/libs";
import { openAI } from "./lib/openai";
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { Command, LogseqAI } from "./ui/LogseqAI";
import { loadUserCommands, loadBuiltInCommands } from "./lib/prompts";
import { getOpenaiSettings, settingsSchema } from "./lib/settings";
import { runDalleBlock, runGptBlock, runGptPage } from "./lib/rawCommands";
import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";

logseq.useSettingsSchema(settingsSchema);

async function main() {
  const root = ReactDOM.createRoot(document.getElementById("app")!);
  root.render(
    <React.StrictMode>
      <LogseqApp />
    </React.StrictMode>
  );

  function createModel() {
    return {
      show() {
        logseq.showMainUI({ autoFocus: true });
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });
}

logseq.ready(main).catch(console.error);

const LogseqApp = () => {
  const [builtInCommands, setBuiltInCommands] = useState<Command[]>([]);
  const [userCommands, setUserCommands] = useState<Command[]>([]);
  const [activeBlock, setActiveBlock] = useState<BlockEntity|null>(null);

  const openUI = async () => {
    const reloadedUserCommands = await loadUserCommands();
    setUserCommands(reloadedUserCommands);
    logseq.showMainUI({ autoFocus: true });
    setTimeout(() => {
      document.getElementById("logseq-openai-search")?.focus();
    }, 100);
  };

  React.useEffect(() => {
    const doLoadBuiltInCommands = async () => {
      const loadedBuiltInCommands = await loadBuiltInCommands();
      setBuiltInCommands(loadedBuiltInCommands);
    };

    doLoadBuiltInCommands();
  }, []);

  React.useEffect(() => {
    const doLoadUserCommands = async () => {
      const loadedUserCommands = await loadUserCommands();
      setUserCommands(loadedUserCommands);
    };
    doLoadUserCommands();
  }, []);

  React.useEffect(() => {
    if (logseq.settings!["popupShortcut"]) {
    logseq.App.registerCommandShortcut(
      {
        binding: logseq.settings!["popupShortcut"],
      },
      async () => {
        const activeText = await logseq.Editor.getEditingCursorPosition();
        const currentBlock = await logseq.Editor.getCurrentBlock();
        const currentPage = await logseq.Editor.getCurrentPage();

        if (!activeText && !currentPage) {
          logseq.App.showMsg("Put cursor in block or navigate to specific page to use keyboard shortcut", "warning");
           return;
        }
        if (activeText && currentBlock){
          setActiveBlock(currentBlock);
        } else {
          setActiveBlock(null);
        }
        openUI();
      }
    );
    }
  }, []);

  React.useEffect(() => {
    logseq.Editor.registerBlockContextMenuItem("gpt", async (b) => {
      const block = await logseq.Editor.getBlock(b.uuid);
      if (block) {
        setActiveBlock(block);
        openUI();
      }
    });

    logseq.Editor.registerSlashCommand("gpt", async (b) => {
      const block = await logseq.Editor.getBlock(b.uuid);
      if (block) {
        setActiveBlock(block);
        openUI();
      }
    });

    logseq.Editor.registerSlashCommand("gpt-page", runGptPage);
    logseq.Editor.registerBlockContextMenuItem("gpt-page", runGptPage);
    logseq.Editor.registerSlashCommand("gpt-block", runGptBlock);
    logseq.Editor.registerBlockContextMenuItem("gpt-block", runGptBlock);
    logseq.Editor.registerSlashCommand("dalle", runDalleBlock);
    logseq.Editor.registerBlockContextMenuItem("dalle", runDalleBlock);

    if (logseq.settings!["shortcutBlock"]) {
      logseq.App.registerCommandShortcut(
        { "binding": logseq.settings!["shortcutBlock"] },
        runGptBlock
      );
    }
  }, []);

  const allCommands = [...builtInCommands, ...userCommands];

  const handleCommand = async (command: Command): Promise<string> => {
    const inputText = activeBlock?.content || "";
    const openAISettings = getOpenaiSettings();
    const response = await openAI(command.prompt + inputText, openAISettings);
    if (response) {
      return response;
    } else {
      throw new Error("No OpenAI results.");
    }
  };

  const onInsert = async (text: string) => {
    let result = text;
    if (getOpenaiSettings().injectPrefix) {
      result = getOpenaiSettings().injectPrefix + result;
    }
    if (activeBlock) {
      if (activeBlock.content.length > 0) {
        logseq.Editor.insertBlock(activeBlock.uuid, result, {
          sibling: false,
        });
      } else {
        logseq.Editor.updateBlock(activeBlock.uuid, result);
      }
    } else {
      const currentPage = await logseq.Editor.getCurrentPage();
      if (currentPage) {
        logseq.Editor.appendBlockInPage(currentPage.uuid, result);
      }
    }
    logseq.hideMainUI({ restoreEditingCursor: true });
  };

  const onReplace = async (text: string) => {
    let result = text;
    // if (getOpenaiSettings().injectPrefix) {
    //   result = getOpenaiSettings().injectPrefix + result;
    // }
    if (activeBlock) {
      logseq.Editor.updateBlock(activeBlock.uuid, result);
    } else {
      const currentPage = await logseq.Editor.getCurrentPage();
      if (currentPage) {
        logseq.Editor.appendBlockInPage(currentPage, result);
      }
    }
    logseq.hideMainUI({ restoreEditingCursor: true });
  };

  const onClose = () => {
    logseq.hideMainUI({ restoreEditingCursor: true });
    setActiveBlock(null);
  };

  return (
    <LogseqAI
      commands={allCommands}
      handleCommand={handleCommand}
      onClose={onClose}
      onInsert={onInsert}
      onReplace={onReplace}
    />
  );
};
