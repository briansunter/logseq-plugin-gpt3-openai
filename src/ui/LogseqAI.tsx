import { useState, useCallback, useEffect } from "react";
import { Combobox, Dialog } from "@headlessui/react";
import { CommandOptions } from "./components/CommandOption";
import { CommandResult } from "./components/CommandResult";
import { CommandQuery } from "./lib/CommandQuery";
import { CommandButton } from "./components/CommandButton";
import { CommandToolbar } from "./components/CommandToolbar";
import { LoadingResult } from "./components/LoadingResult";
import { ErrorResult } from "./components/ErrorResult";
import { SuccessResult } from "./components/SuccessResult";

export interface Command {
  type: string;
  name: string;
  prompt: string;
  temperature?: number;
  shortcut?: string;
}

export type CommandState = ReadyState | SuccessState | ErrorState;

export interface ReadyState {
  status: "ready" | "loading";
}

export interface SuccessState {
  status: "success";
  result: string;
}

export interface ErrorState {
  status: "error";
  error: Error;
}

interface LogseqAIProps {
  commands: Command[];
  handleCommand: (command: Command) => Promise<string>;
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
  onClose: () => void;
}

export const LogseqAI = ({
  commands,
  handleCommand,
  onClose,
  onInsert,
  onReplace,
}: LogseqAIProps) => {
  const [commandState, setCommandState] = useState<CommandState>({
    status: "ready",
  });
  const [previousCommand, setPreviousCommand] = useState<Command | null>(null);

  const [query, setQuery] = useState("");
  const commandQuery = new CommandQuery(commands);

  async function runCommand(command: Command) {
    setPreviousCommand(command);
    setQuery(command.name);
    setCommandState({ status: "loading" });
    try {
      const result = await handleCommand(command);
      setCommandState({ status: "success", result });
    } catch (e) {
      if (e instanceof Error) {
        setCommandState({ status: "error", error: e });
      } else {
        setCommandState({ status: "error", error: new Error("Unknown error") });
      }
    }
  }
  async function runPreviousCommand() {
    if (previousCommand) {
      await runCommand(previousCommand);
    }
  }

  function reset() {
    setQuery("");
    setCommandState({ status: "ready" });
  }

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (commandState.status === "success" && event.key === "Enter") {
        onInsert(commandState.result);
        reset();
      }
    },
    [commandState]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  let result;
  if (commandState.status === "ready") {
    result = (
      <Combobox.Options
        className="max-h-40 overflow-y-auto flex flex-col"
        static
      >
        <CommandOptions commands={commandQuery.query(query)} />
      </Combobox.Options>
    );
  } else {
    const insertDisabled = commandState.status !== "success";
    const regenerateDisabled =
      commandState.status !== "success" && commandState.status !== "error";

    const commandToolbar = (
      <CommandToolbar
        left={
          <CommandButton
            disabled={regenerateDisabled}
            onClick={runPreviousCommand}
          >
            Regenerate
          </CommandButton>
        }
        right={
          <>
            <CommandButton
              disabled={insertDisabled}
              onClick={() => {
                commandState.status === "success" &&
                  onReplace(commandState.result);
                reset();
              }}
            >
              Replace
            </CommandButton>
            <CommandButton
              disabled={insertDisabled}
              onClick={() => {
                commandState.status === "success" &&
                  onInsert(commandState.result);
                reset();
              }}
            >
              Insert ⏎
            </CommandButton>
          </>
        }
      />
    );

    let commandResult;
    if (commandState.status === "loading") {
      commandResult = <LoadingResult />;
    } else if (commandState.status === "error") {
      commandResult = <ErrorResult message={commandState.error.message} />;
    } else if (commandState.status === "success") {
      commandResult = <SuccessResult result={commandState.result} />;
    }

    result = (
      <CommandResult toolbar={commandToolbar}>{commandResult}</CommandResult>
    );
  }

  return (
    <Dialog
      open={true}
      onClose={() => {
        onClose();
        reset();
      }}
      className="fixed top-1/2 inset-0 z-50 overflow-y-auto"
    >
      <Dialog.Panel className="bg-accent-dark max-w-2xl mx-auto rounded-lg shadow-2xl relative flex flex-col p-4">
        <Combobox as="div" onChange={runCommand}>
          <div className="flex items-center text-lg font-medium border-b border-slate-500">
            <Combobox.Input
              id="logseq-openai-search"
              autoFocus={true}
              className="p-5 text-white placeholder-gray-200 w-full bg-transparent border-0 outline-none"
              placeholder="Type a command or search for template..."
              onChange={(e) => {
                setQuery(e.target.value);
                setCommandState({ status: "ready" });
              }}
              displayValue={() => query}
              value={query}
            />
          </div>
          {result}
        </Combobox>
      </Dialog.Panel>
    </Dialog>
  );
};
