declare module "react-google-recaptcha" {
  import type { ForwardRefExoticComponent, RefAttributes } from "react";

  export interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    theme?: "light" | "dark";
    type?: "image" | "audio";
    tabindex?: number;
    onExpired?: () => void;
    onErrored?: () => void;
    size?: "compact" | "normal" | "invisible";
    stoken?: string;
    hl?: string;
    badge?: "bottomright" | "bottomleft" | "inline";
  }

  /** Instance API exposed via ref (matches runtime class component). */
  export interface ReCAPTCHAInstance {
    getValue(): string | null;
    getWidgetId(): number | null;
    reset(): void;
    execute(): void;
    executeAsync(): Promise<string>;
  }

  const ReCAPTCHA: ForwardRefExoticComponent<
    ReCAPTCHAProps & RefAttributes<ReCAPTCHAInstance>
  >;

  export default ReCAPTCHA;
}
