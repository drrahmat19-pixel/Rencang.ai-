import Image from "next/image";

export function BrandLogo({
  className = "w-[148px]",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/rencang-ai-logo.png"
      alt="Rencang AI"
      width={2172}
      height={724}
      priority={priority}
      className={`h-auto object-contain ${className}`}
    />
  );
}
