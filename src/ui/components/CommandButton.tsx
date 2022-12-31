import clsx from "clsx";
import { PropsWithChildren } from "react";

export const CommandButton = ({
  disabled,
  children,
  onClick,
}: PropsWithChildren<{ disabled: boolean; onClick: () => any }>) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={clsx(
      "inline-flex items-center py-2.5 px-4 text-xs font-medium text-center",
      !disabled &&
        " text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800",
      disabled &&
        "text-gray-200 bg-gray-400 rounded-lg opacity-60 cursor-not-allowed"
    )}
  >
    {children}
  </button>
);
