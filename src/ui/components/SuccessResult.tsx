export const SuccessResult = ({ result }: { result: string }) => (
  <textarea
    rows={10}
    value={result}
    readOnly
    className="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
  />
);
