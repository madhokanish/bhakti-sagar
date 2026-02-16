import { redirect } from "next/navigation";

export default function LiveDarshanAliasDetailPage({ params }: { params: { id: string } }) {
  redirect(`/live/${params.id}`);
}
