import { ViewTransition, type ReactNode } from "react";

const navigationAnimations = {
  "auth-forward": "auth-forward",
  "auth-back": "auth-back",
  default: "none",
};

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={navigationAnimations}
      exit={navigationAnimations}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
