"use client";

import { useCallback, useRef, useState } from "react";
import {
  INDIA_CENTROID,
  INDIA_ID,
  WORLD_SHAPES,
  WORLD_VIEWBOX,
} from "@/content/world-map";
import { site } from "@/content/site";

/**
 * Interactive world map.
 *
 * The geography is static SVG path data generated at build time
 * (scripts/generate-world-map.mjs), so no projection or topology code runs
 * in the browser. This module is only ever reached through a dynamic import
 * once the section is near the viewport — see GlobalReachMap — which keeps
 * roughly 43 KB gzipped of outlines off the critical path entirely.
 *
 * India is the only country given meaning. Every other shape is scenery:
 * there is no verified data on where MIDIS's clients are, so highlighting
 * countries or drawing routes to them would be inventing evidence. The map
 * says "we work internationally" and stops exactly there.
 *
 * Hover styling is CSS, not state, so moving the pointer across 176
 * countries repaints on the compositor instead of re-rendering React. The
 * only thing React tracks is the tooltip.
 */

interface Tip {
  name: string;
  x: number;
  y: number;
}

export function WorldMap() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  /*
   * One delegated listener rather than 176. `closest` walks up from whatever
   * the pointer is actually over to the country that owns it.
   */
  const track = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    const frame = frameRef.current;
    if (!frame) return;

    const target = (event.target as Element).closest<SVGElement>("[data-country]");
    if (!target) {
      setTip(null);
      return;
    }

    const box = frame.getBoundingClientRect();
    setTip({
      name: target.dataset.country ?? "",
      x: event.clientX - box.left,
      y: event.clientY - box.top,
    });
  }, []);

  const clear = useCallback(() => setTip(null), []);

  const showIndia = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const box = frame.getBoundingClientRect();
    setTip({
      name: "India",
      x: (INDIA_CENTROID.x / WORLD_VIEWBOX.width) * box.width,
      y: (INDIA_CENTROID.y / WORLD_VIEWBOX.height) * box.height,
    });
  }, []);

  const india = WORLD_SHAPES.find((s) => s.id === INDIA_ID);
  const rest = WORLD_SHAPES.filter((s) => s.id !== INDIA_ID);

  return (
    <div ref={frameRef} className="world-map relative w-full">
      <svg
        viewBox={`0 0 ${WORLD_VIEWBOX.width} ${WORLD_VIEWBOX.height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`World map. ${site.name} is based in ${site.address.locality}, ${site.address.countryName}, and works with clients internationally.`}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={clear}
      >
        <g className="world-countries">
          {rest.map((shape) => (
            <path key={shape.id} d={shape.d} data-country={shape.name} className="world-country" />
          ))}
        </g>

        {india && (
          /*
           * The home base. Focusable and labelled because it is the one
           * element here carrying information; the other 175 are decorative
           * and putting them in the tab order would bury the rest of the
           * page behind 175 stops.
           */
          <g
            tabIndex={0}
            role="button"
            aria-label={`India — where ${site.name} is based`}
            className="world-home"
            onFocus={showIndia}
            onBlur={clear}
          >
            <path d={india.d} data-country={india.name} className="world-india" />
            <circle
              cx={INDIA_CENTROID.x}
              cy={INDIA_CENTROID.y}
              r="4"
              className="world-pulse"
              aria-hidden="true"
            />
            <circle
              cx={INDIA_CENTROID.x}
              cy={INDIA_CENTROID.y}
              r="3"
              className="world-dot"
              aria-hidden="true"
            />
          </g>
        )}
      </svg>

      {tip && (
        <span
          role="status"
          className="world-tip"
          style={{ left: `${tip.x}px`, top: `${tip.y}px` }}
        >
          {tip.name}
          {tip.name === "India" && <span className="world-tip-note">Home base</span>}
        </span>
      )}
    </div>
  );
}
