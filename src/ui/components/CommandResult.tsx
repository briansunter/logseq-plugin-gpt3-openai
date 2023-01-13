import { PropsWithChildren, ReactElement } from "react";

interface CommandResultProps {
  toolbar: ReactElement;
}

export const CommandResult = ({
  children,
  toolbar,
}: PropsWithChildren<CommandResultProps>) => {
  return (
    <form>
      <div className="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
        <div className="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
          {children}
        </div>
        {toolbar}
      </div>
    </form>
  );
};
