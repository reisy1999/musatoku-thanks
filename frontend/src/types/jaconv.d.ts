declare module "jaconv" {
  export function toHanKana(input: string): string;
  export function toKatakana(input: string): string;
  export function toHiragana(input: string): string;

  const jaconv: {
    toHanKana: typeof toHanKana;
    toKatakana: typeof toKatakana;
    toHiragana: typeof toHiragana;
  };
  export default jaconv;
}
