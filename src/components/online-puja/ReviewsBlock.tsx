import type { PujaReview } from "@/lib/onlinePujaDetailConfig";

type Props = {
  ratingSummary: string;
  reviews: PujaReview[];
};

function stars(rating: number) {
  const full = Math.round(rating);
  return "★".repeat(full).padEnd(5, "☆");
}

export default function ReviewsBlock({ ratingSummary, reviews }: Props) {
  return (
    <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7" id="reviews">
      <h2 className="text-3xl text-sagar-ink md:text-4xl">Reviews</h2>
      <p className="mt-2 text-sm text-sagar-ink/72">{ratingSummary}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-sagar-ink">{review.name}</p>
                <p className="text-xs text-sagar-ink/65">{review.location}</p>
              </div>
              <p className="text-xs font-semibold tracking-[0.1em] text-sagar-ember" aria-label={`Rated ${review.rating} out of 5`}>
                {stars(review.rating)}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-sagar-ink/78">{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
