type Props = {
  steps: string[];
};

export default function PujaProcessSteps({ steps }: Props) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3 rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sagar-saffron text-xs font-bold text-white">
            {index + 1}
          </div>
          <p className="text-sm leading-relaxed text-sagar-ink/80">{step}</p>
        </li>
      ))}
    </ol>
  );
}

