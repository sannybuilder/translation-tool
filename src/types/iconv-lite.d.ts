declare module 'iconv-lite' {
  export function encode(str: string, encoding: string): Buffer;
  export function decode(buffer: Buffer | Uint8Array, encoding: string): string;
  export function encodingExists(encoding: string): boolean;
  export function decodeStream(encoding: string): NodeJS.ReadWriteStream;
  export function encodeStream(encoding: string): NodeJS.ReadWriteStream;
  
  const iconv: {
    encode: typeof encode;
    decode: typeof decode;
    encodingExists: typeof encodingExists;
    decodeStream: typeof decodeStream;
    encodeStream: typeof encodeStream;
  };
  
  export default iconv;
}
