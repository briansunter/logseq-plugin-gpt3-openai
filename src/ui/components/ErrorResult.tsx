export const ErrorResult = ({ message }: { message: string }) => (
  <div className="flex items-center flex-col justify-center w-full h-40 bg-red-100 dark:bg-red-800">
    <div className="flex items-center text-2xl text-red-600 dark:text-red-400">
      <svg
        className="h-5 w-5 text-red-600 dark:text-red-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
      <span className="ml-2 text-red-600 dark:text-red-400">Error</span>
    </div>
    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
      {message}
    </span>
  </div>
);
