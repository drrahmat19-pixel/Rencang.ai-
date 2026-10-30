import Image from "next/image";

export function KangBisa({
  className = "",
  priority = false,
  alt = "Kang Bisa, sahabat digital Rencang AI",
}: {
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <Image
      src="/brand/kang-bisa-welcome.png"
      alt={alt}
      width={1312}
      height={1199}
      priority={priority}
      className={`h-auto object-contain ${className}`}
    />
  );
}
