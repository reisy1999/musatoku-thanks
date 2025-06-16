declare module 'jaconv' {
  const jaconv: {
    toKatakana: (s: string) => string;
    toHanKana: (s: string) => string;
  };
  export default jaconv;
}
