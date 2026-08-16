declare module "qrcode" {
  type QROptions = { width?: number; margin?: number; errorCorrectionLevel?: "L" | "M" | "Q" | "H" };
  const QRCode: { toDataURL(text: string, options?: QROptions): Promise<string> };
  export default QRCode;
}
