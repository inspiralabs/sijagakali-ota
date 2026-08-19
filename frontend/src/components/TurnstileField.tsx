import { Turnstile } from '@marsidev/react-turnstile';

const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ?? '';

export function isTurnstileConfigured(): boolean {
  return Boolean(siteKey);
}

export function TurnstileField({ onToken }: { onToken: (token: string | null) => void }) {
  if (!siteKey) return null;

  return (
    <Turnstile
      siteKey={siteKey}
      options={{ theme: 'auto', language: 'id' }}
      onSuccess={(token) => onToken(token)}
      onExpire={() => onToken(null)}
      onError={() => onToken(null)}
    />
  );
}
