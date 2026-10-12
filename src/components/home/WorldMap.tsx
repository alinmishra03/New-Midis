"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  PRESENCE_COUNTRIES,
  WORLD_SHAPES,
  WORLD_VIEWBOX,
  type PresenceCountry,
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
 * WHAT IS HIGHLIGHTED, AND ON WHAT BASIS
 *
 * Five countries carry meaning: India, where MIDIS is based, and the United
 * States, United Kingdom, Canada and Australia, which MIDIS confirmed on
 * 2026-10-12 as the countries it works with clients in. That list lives in
 * content/world-map.ts next to the geometry, keyed on numeric ISO 3166-1 so
 * it is matched by code and not by a name that varies between datasets.
 * Nothing is counted, nothing is inferred, and the other 171 shapes are
 * scenery.
 *
 * Hover styling is CSS, not state, so moving the pointer across 176
 * countries repaints on the compositor instead of re-rendering React. The
 * only thing React tracks is the tooltip.
 */

/** Where the tooltip sits relative to the point, so it stays in the frame. */
type Anchor = "start" | "center" | "end";

interface Tip {
  name: string;
  /** Shown beside the name for the home base only. */
  note?: string;
  x: number;
  y: number;
  anchor: Anchor;
  /** True near the top edge, where a tooltip above the point would escape. */
  below: boolean;
}

/*
 * Fractions of the frame inside which the tooltip has to flip rather than
 * stay centred. At 320px the frame is ~280px wide and the longest label,
 * "United States of America", is around 190px, so the flip has to happen
 * before the label's half-width would reach the edge.
 */
const EDGE = 0.2;
const TOP_EDGE = 0.18;

/** How far the connection arcs bow, as a fraction of their own length. */
const ARC_LIFT = 0.18;

/**
 * A quadratic arc between two anchor points, bowing towards the top of the
 * map — the convention for a route line, and on this projection it keeps all
 * four arcs clear of the countries they connect.
 */
function arcPath(from: PresenceCountry, to: PresenceCountry): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const lift = Math.hypot(to.x - from.x, to.y - from.y) * ARC_LIFT;

  return `M${from.x},${from.y}Q${midX.toFixed(1)},${(midY - lift).toFixed(1)} ${to.x},${to.y}`;
}

export function WorldMap() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const { home, abroad, presenceShapes, scenery } = useMemo(() => {
    const byId = new Map(WORLD_SHAPES.map((s) => [s.id, s]));
    const ids = new Set(PRESENCE_COUNTRIES.map((c) => c.id));

    return {
      home: PRESENCE_COUNTRIES.find((c) => c.home),
      abroad: PRESENCE_COUNTRIES.filter((c) => !c.home),
      /* Paired with its outline here so a presence entry whose code stopped
         matching the geometry renders nothing rather than throwing. */
      presenceShapes: PRESENCE_COUNTRIES.flatMap((country) => {
        const shape = byId.get(country.id);
        return shape ? [{ country, shape }] : [];
      }),
      scenery: WORLD_SHAPES.filter((s) => !ids.has(s.id)),
    };
  }, []);

  /** Places the tooltip at a point in the frame, flipping away from edges. */
  const place = useCallback((name: string, x: number, y: number, note?: string) => {
    const frame = frameRef.current;
    if (!frame) return;

    const box = frame.getBoundingClientRect();
    const relX = box.width ? x / box.width : 0.5;
    const relY = box.height ? y / box.height : 0.5;

    setTip({
      name,
      note,
      x,
      y,
      anchor: relX < EDGE ? "start" : relX > 1 - EDGE ? "end" : "center",
      below: relY < TOP_EDGE,
    });
  }, []);

  /*
   * One delegated listener rather than 176. `closest` walks up from whatever
   * the pointer is actually over to the country that owns it.
   *
   * This also covers touch: pointerdown on a country shows its name, which
   * is the only way to read a label without a hovering pointer.
   */
  const track = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const frame = frameRef.current;
      if (!frame) return;

      const target = (event.target as Element).closest<SVGElement>("[data-country]");
      if (!target) {
        setTip(null);
        return;
      }

      const box = frame.getBoundingClientRect();
      place(
        target.dataset.country ?? "",
        event.clientX - box.left,
        event.clientY - box.top,
        target.dataset.note,
      );
    },
    [place],
  );

  const clear = useCallback(() => setTip(null), []);

  /**
   * Keyboard equivalent: the tooltip goes to the country's own anchor point
   * rather than to a pointer that is not there.
   */
  const showCountry = useCallback(
    (country: PresenceCountry) => {
      const frame = frameRef.current;
      if (!frame) return;

      const box = frame.getBoundingClientRect();
      place(
        country.name,
        (country.x / WORLD_VIEWBOX.width) * box.width,
        (country.y / WORLD_VIEWBOX.height) * box.height,
        country.home ? "Home base" : undefined,
      );
    },
    [place],
  );

  const countryList = PRESENCE_COUNTRIES.map((c) => c.name).join(", ");

  return (
    <div ref={frameRef} className="world-map relative w-full">
      <svg
        viewBox={`0 0 ${WORLD_VIEWBOX.width} ${WORLD_VIEWBOX.height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`World map highlighting ${countryList}. ${site.name} is based in ${site.address.locality}, ${site.address.countryName}, and works with clients in ${abroad.length} other countries.`}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={clear}
      >
        <g className="world-countries">
          {scenery.map((shape) => (
            <path key={shape.id} d={shape.d} data-country={shape.name} className="world-country" />
          ))}
        </g>

        {/*
          Connection arcs, drawn under the country fills so each one appears
          to arrive at a coastline rather than stopping at a point inside it.
          Decorative: the countries themselves carry the information, and
          these are hidden from assistive technology.
        */}
        {home && (
          <g className="world-routes" aria-hidden="true">
            {abroad.map((country) => (
              <path key={country.id} d={arcPath(home, country)} pathLength={1} className="world-route" />
            ))}
          </g>
        )}

        {presenceShapes.map(({ country, shape }) => (
          /*
           * Focusable and labelled because these five carry the section's
           * only claim. The other 171 stay out of the tab order — putting
           * them in would bury the rest of the page behind 171 stops.
           */
          <g
            key={country.id}
            tabIndex={0}
            role="button"
            aria-label={
              country.home
                ? `${country.name} — where ${site.name} is based`
                : `${country.name} — ${site.name} works with clients here`
            }
            className="world-presence-group"
            onFocus={() => showCountry(country)}
            onBlur={clear}
          >
            <path
              d={shape.d}
              data-country={country.name}
              data-note={country.home ? "Home base" : undefined}
              className="world-presence"
            />

            {/* The home base keeps its marker; the rest are identified by
                their fill alone, so no point on the map implies an office
                that is not there. */}
            {country.home && (
              <>
                <circle cx={country.x} cy={country.y} r="4" className="world-pulse" aria-hidden="true" />
                <circle cx={country.x} cy={country.y} r="3" className="world-dot" aria-hidden="true" />
              </>
            )}
          </g>
        ))}
      </svg>

      {tip && (
        <span
          role="status"
          className="world-tip"
          data-anchor={tip.anchor}
          data-below={tip.below ? "true" : "false"}
          style={{ left: `${tip.x}px`, top: `${tip.y}px` }}
        >
          <span className="world-tip-body">
            {tip.name}
            {tip.note && <span className="world-tip-note">{tip.note}</span>}
          </span>
        </span>
      )}
    </div>
  );
}
