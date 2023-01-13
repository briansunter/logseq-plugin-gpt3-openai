import { ReactElement } from "react";

export const CommandToolbar = ({
  left,
  right,
}: {
  left: ReactElement;
  right: ReactElement;
}) => (
  <div className="flex items-center justify-between px-3 py-2 border-t dark:border-gray-600">
    <div className="flex pl-0 space-x-1 sm:pl-2">{left}</div>
    <div className="flex pl-0 space-x-1 sm:pl-2">{right}</div>
  </div>
);
