import React from 'react';

interface IcProps {
  size?: number;
  stroke?: string;
  sw?: number;
  style?: React.CSSProperties;
}

function Ic({ size = 22, stroke = 'currentColor', sw = 1.6, children, style }: IcProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      {children}
    </svg>
  );
}

export const IcBell = (p: IcProps) => (
  <Ic {...p}>
    <path d="M6 16h12l-1.2-1.6a3 3 0 0 1-.6-1.8V10a4.2 4.2 0 0 0-8.4 0v2.6a3 3 0 0 1-.6 1.8L6 16z"/>
    <path d="M10.5 19a1.5 1.5 0 0 0 3 0"/>
    <path d="M12 4.5V3.2"/>
  </Ic>
);

export const IcReceipt = (p: IcProps) => (
  <Ic {...p}>
    <path d="M7 3v18l2-1.4 2 1.4 2-1.4 2 1.4 2-1.4V3z"/>
    <path d="M10 8h7M10 12h7M10 16h4"/>
  </Ic>
);

export const IcPlate = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="8.5"/>
    <circle cx="12" cy="12" r="4.5"/>
    <path d="M12 7.5V5.5"/>
  </Ic>
);

export const IcGlass = (p: IcProps) => (
  <Ic {...p}>
    <path d="M7.5 4h9l-1 14.5a2 2 0 0 1-2 1.8h-3a2 2 0 0 1-2-1.8L7.5 4z"/>
    <path d="M8 9.5c1.6 1 3 1 4.5 0s2.9-1 3.9-.4"/>
  </Ic>
);

export const IcAlert = (p: IcProps) => (
  <Ic {...p}>
    <path d="M12 4.5L21 19.5H3z"/>
    <path d="M12 10v4.5"/>
    <circle cx="12" cy="17" r="0.5" fill={p?.stroke ?? 'currentColor'}/>
  </Ic>
);

export const IcChat = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3.5v-3.5H6a2 2 0 0 1-2-2z"/>
  </Ic>
);

export const IcCheck = (p: IcProps) => (
  <Ic {...p}>
    <path d="M5 12.5l4.5 4.5L19 7"/>
  </Ic>
);

export const IcUser = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="8" r="3.5"/>
    <path d="M5 20c1-3.5 4-5 7-5s6 1.5 7 5"/>
  </Ic>
);

export const IcClock = (p: IcProps) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="8.5"/>
    <path d="M12 7v5l3 2"/>
  </Ic>
);

export const IcSound = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/>
    <path d="M16 9c1.4 1 1.4 5 0 6"/>
    <path d="M18.5 7c2.5 2 2.5 8 0 10"/>
  </Ic>
);

export const IcMute = (p: IcProps) => (
  <Ic {...p}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/>
    <path d="M16 9.5l5 5M21 9.5l-5 5"/>
  </Ic>
);

export const IcX = (p: IcProps) => (
  <Ic {...p}>
    <path d="M6 6l12 12M18 6L6 18"/>
  </Ic>
);

export const ICON_BY_TYPE: Record<string, React.ComponentType<IcProps>> = {
  server:       IcBell,
  refill:       IcGlass,
  request_bill: IcReceipt,
  bill:         IcReceipt,
  order:        IcPlate,
  special:      IcChat,
  urgent_help:  IcAlert,
  urgent:       IcAlert,
};
