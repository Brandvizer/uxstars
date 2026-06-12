import { getActieveSterren } from "@/lib/stars";
import StarField from "./StarField";

/**
 * Server component: haalt de actieve sterren op uit Supabase (met terugval op
 * mockdata) en geeft ze door aan het client-side StarField. Zo blijft de
 * data-fetch op de server en bevat de client-bundle geen Supabase-call.
 */
export default async function SterrenVeld({
  interactief = true,
  className,
}: {
  interactief?: boolean;
  className?: string;
}) {
  const sterren = await getActieveSterren();
  return (
    <StarField sterren={sterren} interactief={interactief} className={className} />
  );
}
