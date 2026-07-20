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

export function SnowflakeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="5" y1="6.5" x2="19" y2="17.5" />
      <line x1="19" y1="6.5" x2="5" y2="17.5" />
    </Icon>
  );
}

export function WrenchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 4.9L4 16.5V20h3.5l5.3-5.3a4 4 0 0 0 4.9-5.4l-2.6 2.6-2-.7-.7-2 2.6-2.6Z" />
    </Icon>
  );
}

export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 21c-3.3 0-6-2.4-6-5.8 0-3 2.3-5 3.5-8 1 1.5.8 3 1.5 3 1-3 .3-5.5-1-8 4.5 2 7 6 6.5 10.2C16.3 14 18 14.7 18 17c0 2.2-2.7 4-6 4Z" />
    </Icon>
  );
}

export function TuneUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2.2M12 17.8V20M4 12h2.2M17.8 12H20M6.3 6.3l1.6 1.6M16.1 16.1l1.6 1.6M6.3 17.7l1.6-1.6M16.1 7.9l1.6-1.6" />
    </Icon>
  );
}

export function HeatPumpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 20V6" />
      <path d="M6.5 11.5 12 6l5.5 5.5" />
    </Icon>
  );
}

export function WindIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.5 8h11a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3.5 12.5h14.5a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3.5 17h8.5a2.5 2.5 0 1 1-2.5 2.5" />
    </Icon>
  );
}

export function AlertTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4 21 19H3L12 4Z" strokeLinejoin="round" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function HelpCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.3a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.2 1-1.2 1.9" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.3 2" />
    </Icon>
  );
}

export function LoaderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </Icon>
  );
}
