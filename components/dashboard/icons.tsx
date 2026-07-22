import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function CursorClickIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 3.5 9 9m0-5.5L4.5 5m4.5-1.5L13 5" />
      <path d="M9 9 20 13.5 14.5 15.5 12.5 21 9 9Z" strokeLinejoin="round" />
    </Icon>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 5.2c1.3.4 2.2 1.6 2.2 3s-.9 2.6-2.2 3" />
      <path d="M17 14c2.5.3 4.5 2 4.5 5" />
    </Icon>
  );
}

export function PercentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <circle cx="7.5" cy="7.5" r="2" />
      <circle cx="16.5" cy="16.5" r="2" />
    </Icon>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
      <line x1="8" y1="3" x2="8" y2="6.5" />
      <line x1="16" y1="3" x2="16" y2="6.5" />
    </Icon>
  );
}

export function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 11a8 8 0 0 0-14.9-3.5M4 5v4h4" />
      <path d="M4 13a8 8 0 0 0 14.9 3.5M20 19v-4h-4" />
    </Icon>
  );
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
      <polyline points="15 8 19 12 15 16" />
      <line x1="19" y1="12" x2="9" y2="12" />
    </Icon>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="19.5" y1="19.5" x2="15.2" y2="15.2" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Icon>
  );
}

export function TableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
      <line x1="9.5" y1="9.5" x2="9.5" y2="19.5" />
    </Icon>
  );
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="6" y="12" width="3" height="8" rx="0.5" />
      <rect x="13" y="7" width="3" height="13" rx="0.5" />
    </Icon>
  );
}

export function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 14a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 1 0-5.66-5.66L11.5 6.84" />
      <path d="M14 10a4 4 0 0 0-5.66 0L5.51 12.83a4 4 0 1 0 5.66 5.66L12.5 17.16" />
    </Icon>
  );
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 13l4 4L19 7" />
    </Icon>
  );
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4v11" />
      <path d="m7.5 11.5 4.5 4.5 4.5-4.5" />
      <path d="M5 19.5h14" />
    </Icon>
  );
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Icon>
  );
}

export function DollarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M16 7.5c0-1.7-1.8-3-4-3s-4 1.1-4 2.75S9.8 10 12 10s4 .8 4 2.75S14.2 15.5 12 15.5s-4-1.3-4-3" />
    </Icon>
  );
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="18" cy="5.5" r="2.25" />
      <circle cx="6" cy="12" r="2.25" />
      <circle cx="18" cy="18.5" r="2.25" />
      <path d="M8 10.7 16 6.7" />
      <path d="M8 13.3 16 17.3" />
    </Icon>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Icon>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </Icon>
  );
}
