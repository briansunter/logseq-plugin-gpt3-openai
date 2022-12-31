import Fuse from "fuse.js";
import { Command } from "../LogseqAI";

export const makeCustomCommand = (name: string): Command => {
  return { type: "custom", name: name, prompt: name + "\n" };
};

export class CommandQuery {
  fuse: Fuse<Command>;
  constructor(public commands: Command[]) {
    this.fuse = new Fuse(commands, { includeScore: true, keys: ["name"] });
    this.commands = commands;
  }
  query(query: string) {
    const filteredCommands =
      query === ""
        ? this.commands
        : this.fuse
            .search(query)
            .filter((res) => (res.score ? res.score < 0.5 : false))
            .map((res) => ({ ...res.item }));

    if (filteredCommands.length === 0) {
      return [makeCustomCommand(query)];
    } else if (query !== "") {
      return [...filteredCommands, makeCustomCommand(query)];
    } else {
      return filteredCommands;
    }
  }
}
