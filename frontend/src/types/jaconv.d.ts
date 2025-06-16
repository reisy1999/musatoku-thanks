declare module 'jaconv' {
  const jaconv: {
    toHebon: (s: string) => string;
    toKatakana: (s: string) => string;
    toHiragana: (s: string) => string;
    toHanAscii: (s: string) => string;
    toZenAscii: (s: string) => string;
    toHanKana: (s: string) => string;
    toZenKana: (s: string) => string;
    toHan: (s: string) => string;
    toZen: (s: string) => string;
    normalize: (s: string) => string;
  };
  export default jaconv;
}
