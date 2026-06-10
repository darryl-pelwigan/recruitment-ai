export default function BrandLogo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center shadow-sm">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z"
          className="fill-white dark:fill-gray-900"
        />
        <path
          d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-white dark:stroke-gray-900"
        />
        <path
          d="M12 12V16M10 14H14"
          stroke="gray"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-gray-400 dark:stroke-gray-600"
        />
      </svg>
    </div>
  );
}
