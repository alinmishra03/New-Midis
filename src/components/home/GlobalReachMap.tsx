"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { WORLD_VIEWBOX } from "@/content/world-map";

/*
 * The outlines are ~43 KB gzipped. Loading them with the page would put a
 * decorative illustration on the critical path of every homepage visit,
 * including the majority on phones who never scroll this far. The chunk is
 * fetched when the section comes within a screen of the viewport instead.
 *
 * `ssr: false` because the map is scenery, not content: the heading,
 * description and call to action around it are server-rendered and say
 * everything the section means. Nothing is lost without JavaScript.
 */
const WorldMap = dynamic(() => import("./WorldMap").then((m) => m.WorldMap), {
  ssr: false,
});

export function GlobalReachMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setNear(true);
          observer.disconnect();
        }
      },
      /* A screen of lead time, so the chunk has usually arrived before the
         section is actually looked at. */
      { rootMargin: "100% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    /*
     * The box holds the map's exact aspect ratio whether or not the map has
     * arrived, so the surrounding layout never moves when it does.
     */
    <div
      ref={ref}
      className="relative w-full"
      style={{ aspectRatio: `${WORLD_VIEWBOX.width} / ${WORLD_VIEWBOX.height}` }}
    >
      {near && <WorldMap />}
    </div>
  );
}
