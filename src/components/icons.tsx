import type { SVGProps } from "react";

export function UrbanPulseLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3L2 9L12 15L22 9L12 3Z" />
      <path d="M2 9V15L12 21L22 15V9" />
      <path d="M12 3V15" />
    </svg>
  );
}
