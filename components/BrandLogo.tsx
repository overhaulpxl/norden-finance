import Image from 'next/image';

type BrandLogoProps = {
  variant?: 'icon' | 'horizontal';
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({ variant = 'horizontal', className = '', priority = false }: BrandLogoProps) {
  const isIcon = variant === 'icon';

  return (
    <Image
      src={isIcon ? '/brand/norden-icon.png?v=3' : '/brand/norden-horizontal.png?v=3'}
      alt={isIcon ? 'Norden Finance' : 'Norden Finance logo'}
      width={isIcon ? 697 : 523}
      height={isIcon ? 697 : 191}
      priority={priority}
      unoptimized
      className={`object-contain ${className}`}
    />
  );
}
