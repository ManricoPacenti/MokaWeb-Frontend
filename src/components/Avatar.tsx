import { useEffect, useState } from 'react';

type AvatarProps = {
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  size?: number;
  className?: string;
};

function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);

  return `${firstInitial}${lastInitial}`.toUpperCase() || '?';
}

export default function Avatar({
  firstName,
  lastName,
  profileImageUrl,
  size = 48,
  className = '',
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const cleanImageUrl = profileImageUrl?.trim();
  const shouldShowImage = Boolean(cleanImageUrl) && !imageFailed;
  const initials = getInitials(firstName, lastName);

  useEffect(() => {
    setImageFailed(false);
  }, [cleanImageUrl]);

  if (shouldShowImage) {
    return (
      <img
        src={cleanImageUrl}
        alt={`${firstName} ${lastName}`}
        className={className}
        onError={() => setImageFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.22)',
          backgroundColor: '#64748B',
        }}
      />
    );
  }

  return (
    <div
      className={className}
      aria-label={`${firstName} ${lastName}`}
      title={`${firstName} ${lastName}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background:
          'linear-gradient(135deg, #6f4e37 0%, #8a6548 45%, #c7a56b 100%)',
        color: '#ffffff',
        fontWeight: 800,
        fontSize: Math.max(14, size * 0.34),
        letterSpacing: '0.04em',
        border: '3px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.22)',
        userSelect: 'none',
        textTransform: 'uppercase',
      }}
    >
      {initials}
    </div>
  );
}