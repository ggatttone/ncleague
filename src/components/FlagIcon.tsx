import { getNationalityCountryCode } from '@/lib/utils';

interface FlagIconProps {
  nationality: string;
  size?: number;
  className?: string;
}

export function FlagIcon({ nationality, size = 20, className = '' }: FlagIconProps) {
  const code = getNationalityCountryCode(nationality);
  if (!code) return <span className={className}>🌍</span>;

  return (
    <img
      src={`https://flagcdn.com/w${size}/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w${size * 2}/${code.toLowerCase()}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={nationality}
      className={`inline-block ${className}`}
      loading="lazy"
    />
  );
}
