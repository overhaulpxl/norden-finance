import Image from 'next/image';

type BrandLogoProps = {
  variant?: 'icon' | 'horizontal';
  className?: string;
  priority?: boolean;
  theme?: 'auto' | 'light' | 'dark';
};

export default function BrandLogo({ variant = 'horizontal', className = '', priority = false, theme = 'auto' }: BrandLogoProps) {
  const isIcon = variant === 'icon';

  if (isIcon) {
    return (
      <Image
        src="/brand/norden-icon.png?v=3"
        alt="Norden Finance"
        width={697}
        height={697}
        priority={priority}
        unoptimized
        className={`object-contain ${className}`}
      />
    );
  }

  if (theme === 'light') {
    return (
      <Image
        src="/brand/norden-horizontal.png?v=5"
        alt="Norden Finance logo"
        width={523}
        height={191}
        priority={priority}
        unoptimized
        className={`object-contain ${className}`}
      />
    );
  }

  if (theme === 'dark') {
    return (
      <Image
        src="/brand/norden-horizontal-dark.png?v=5"
        alt="Norden Finance logo"
        width={523}
        height={191}
        priority={priority}
        unoptimized
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <>
      <Image
        src="/brand/norden-horizontal.png?v=5"
        alt="Norden Finance logo"
        width={523}
        height={191}
        priority={priority}
        unoptimized
        className={`object-contain dark:hidden ${className}`}
      />
      <Image
        src="/brand/norden-horizontal-dark.png?v=5"
        alt="Norden Finance logo"
        width={523}
        height={191}
        priority={priority}
        unoptimized
        className={`object-contain hidden dark:inline-block ${className}`}
      />
    </>
  );
}
