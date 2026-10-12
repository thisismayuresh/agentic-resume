export const UPLOAD_ACCEPT = '.pdf,.doc,.docx';

const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export function isSupportedUpload(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}
