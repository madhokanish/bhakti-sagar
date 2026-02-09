type Props = {
  href: string;
  label: string;
};

export default function StickyBottomCTA({ href, label }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-3 z-30 px-4 md:hidden">
      <a
        href={href}
        className="block rounded-full bg-sagar-saffron px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sagar-soft"
      >
        {label}
      </a>
    </div>
  );
}

