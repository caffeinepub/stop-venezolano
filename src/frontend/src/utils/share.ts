export interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

export function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

export async function shareViaWebShare(options: ShareOptions): Promise<boolean> {
  if (!canUseWebShare()) {
    return false;
  }

  try {
    await navigator.share(options);
    return true;
  } catch (error) {
    // User cancelled or error occurred
    console.error('Web Share error:', error);
    return false;
  }
}

export function getWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getTelegramShareUrl(text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(text)}`;
}

export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function buildInviteMessage(roomCode: string, joinUrl: string, messageTemplate: string): string {
  return messageTemplate.replace('{code}', roomCode).replace('{link}', joinUrl);
}

export function buildJoinUrl(roomCode: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/lobby/${roomCode}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Clipboard error:', error);
    return false;
  }
}
