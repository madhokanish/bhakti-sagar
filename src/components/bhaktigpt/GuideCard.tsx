import Image from "next/image";
import type { BhaktiGuideId } from "@/lib/bhaktigpt/guides";
import BhaktiTrackedLink from "@/components/bhaktigpt/BhaktiTrackedLink";

type GuideCardProps = {
  guideId: BhaktiGuideId;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  featured?: boolean;
};

export default function GuideCard({
  guideId,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  featured = false
}: GuideCardProps) {
  return (
    <BhaktiTrackedLink
      href={`/bhaktigpt/chat?guide=${guideId}`}
      eventName="selected_guide"
      eventParams={{ guideId, source: "landing_card" }}
      className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-sagar-amber/22 bg-white/90 shadow-sagar-soft transition duration-200 hover:-translate-y-1 hover:border-sagar-saffron/45 hover:shadow-[0_24px_50px_-28px_rgba(65,30,10,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron focus-visible:ring-offset-2"
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
        priority={guideId === "krishna"}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2f1408]/92 via-[#2f1408]/30 to-transparent" />
      {featured ? (
        <span className="absolute left-4 top-4 inline-flex rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
          Featured guide
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-3xl font-serif text-white">{title}</h3>
        <p className="mt-1 truncate text-sm text-white/90">{subtitle}</p>
      </div>
    </BhaktiTrackedLink>
  );
}
