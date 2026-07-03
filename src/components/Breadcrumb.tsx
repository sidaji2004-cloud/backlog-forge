import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className="text-sm text-zinc-500">
      {items.map((item, i) => (
        <span key={i}>
          {item.href ? (
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ) : (
            item.label
          )}
          {i < items.length - 1 && <span> / </span>}
        </span>
      ))}
    </div>
  );
}
