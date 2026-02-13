type Deliverable = {
  stage: string;
  text: string;
};

type Props = {
  items: Deliverable[];
};

export default function DeliverablesTimeline({ items }: Props) {
  return (
    <ol className="space-y-2.5">
      {items.map((item) => (
        <li key={`${item.stage}-${item.text}`} className="flex items-start gap-2.5 text-sm text-sagar-ink/82">
          <span
            aria-hidden="true"
            className="mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sagar-saffron/30 bg-sagar-cream/55 text-[0.65rem] text-sagar-saffron"
          >
            ✓
          </span>
          <span>
            <span className="font-semibold text-sagar-ink">{item.stage}: </span>
            {item.text}
          </span>
        </li>
      ))}
    </ol>
  );
}
