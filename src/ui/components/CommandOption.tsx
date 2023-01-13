import { Combobox } from "@headlessui/react";
import clsx from "clsx";
import "../style.css";
import { Command } from "../LogseqAI";

const CommandOption = ({ command }: { command: Command }) => {
  if (command.type === "custom") {
    return (
      <>
        <span className="text-sm mr-2 text-slate-400">Custom:</span>
        <span className="text-sm text-left flex flex-auto">{command.name}</span>
      </>
    );
  } else {
    return (
      <span className="text-sm text-left flex flex-auto">{command.name}</span>
    );
  }
};
export const CommandOptions = ({ commands }: { commands: Command[] }) => (
  <>
    {commands.map((command: any, idx: any) => (
      <Combobox.Option key={idx} value={command}>
        {({ active }) => (
          <div
            className={clsx(
              "w-full h-[46px] text-white flex items-center hover:bg-primary/40 cursor-default transition-colors duration-100 ease-in",
              active ? "bg-primary/40" : ""
            )}
          >
            <div className="px-3.5 flex items-center w-full">
              <CommandOption command={command} />
            </div>
          </div>
        )}
      </Combobox.Option>
    ))}
  </>
);
