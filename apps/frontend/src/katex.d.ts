declare module 'katex/dist/contrib/auto-render' {
  export interface AutoRenderOptions {
    delimiters?: Array<{
      left: string
      right: string
      display: boolean
    }>;
    ignoredTags?: string[];
    ignoredClasses?: string[];
    errorCallback?: (msg: string, err: Error) => void;
    preProcess?: (math: string) => string;
    strict?: boolean | string | Function;
    throwOnError?: boolean;
  }

  export default function renderMathInElement(
    element: HTMLElement,
    options?: AutoRenderOptions
  ): void;
}
