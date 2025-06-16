declare module 'jaconv' {
  const jaconv: {
    toKanaKana: (input: string) => string;
    toKatakana: (input: string) => string;
    toHanKana: (input: string) => string;
  };
  export = jaconv;
}
