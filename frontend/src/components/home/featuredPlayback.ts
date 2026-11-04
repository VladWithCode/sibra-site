/**
 * Decides which featured card video plays. Only one plays at a time.
 *
 * Rule: among cards that are eligible (at least half visible, or covering at
 * least half the viewport height for cards taller than the screen), the one
 * with the lowest priority (its index in the featured list) plays. This is
 * deliberately not "most visible wins": on desktop the big main card and the
 * two side cards are visible together and the main featured property must
 * always play first. On mobile (one column) the same rule hands playback
 * down the list in scroll order.
 *
 * Cards whose autoplay is gated (reduced motion, Save-Data, slow network)
 * never win on their own; a tap (`requestPlay`) overrides the rule for that
 * card until it stops being eligible.
 */

type Entry = {
    priority: number;
    autoplay: boolean;
    eligible: boolean;
    setPlaying: (playing: boolean) => void;
    playing: boolean;
};

const entries = new Map<number, Entry>();
let nextId = 0;
let override: number | null = null;
let pageHidden = typeof document !== "undefined" && document.visibilityState === "hidden";

export function pickWinner(
    list: Iterable<[number, Pick<Entry, "priority" | "autoplay" | "eligible">]>,
    overrideId: number | null,
    hidden: boolean,
): number | null {
    if (hidden) return null;
    let winner: number | null = null;
    let best = Infinity;
    for (const [id, e] of list) {
        if (!e.eligible) continue;
        if (id === overrideId) return id;
        if (e.autoplay && e.priority < best) {
            best = e.priority;
            winner = id;
        }
    }
    return winner;
}

function recompute() {
    if (override !== null && !entries.get(override)?.eligible) override = null;
    const winner = pickWinner(entries, override, pageHidden);
    for (const [id, e] of entries) {
        const playing = id === winner;
        if (playing !== e.playing) {
            e.playing = playing;
            e.setPlaying(playing);
        }
    }
}

// --- shared IntersectionObserver ---------------------------------------

const observed = new Map<Element, number>();
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
    if (observer) return observer;
    observer = new IntersectionObserver(
        (records) => {
            for (const r of records) {
                const id = observed.get(r.target);
                const entry = id === undefined ? undefined : entries.get(id);
                if (!entry) continue;
                const viewportH = r.rootBounds?.height ?? window.innerHeight;
                entry.eligible =
                    r.isIntersecting &&
                    (r.intersectionRatio >= 0.5 ||
                        r.intersectionRect.height >= viewportH * 0.5);
            }
            recompute();
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    document.addEventListener("visibilitychange", () => {
        pageHidden = document.visibilityState === "hidden";
        recompute();
    });
    return observer;
}

export type TPlaybackHandle = {
    requestPlay: () => void;
    unregister: () => void;
};

export function registerFeaturedVideo(
    el: Element,
    priority: number,
    autoplay: boolean,
    setPlaying: (playing: boolean) => void,
): TPlaybackHandle {
    const id = nextId++;
    entries.set(id, { priority, autoplay, eligible: false, setPlaying, playing: false });
    observed.set(el, id);
    getObserver().observe(el);
    return {
        requestPlay() {
            const e = entries.get(id);
            if (!e) return;
            override = id;
            // A tap means the card is in view even if no callback ran yet.
            e.eligible = true;
            recompute();
        },
        unregister() {
            getObserver().unobserve(el);
            observed.delete(el);
            entries.delete(id);
            if (override === id) override = null;
            recompute();
        },
    };
}

/**
 * Autoplay is skipped for users who asked for less motion or less data, and
 * on slow connections: they get the poster and a play button.
 */
export function autoplayAllowed(): boolean {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const conn = (
        navigator as Navigator & {
            connection?: { saveData?: boolean; effectiveType?: string };
        }
    ).connection;
    if (conn?.saveData) return false;
    if (conn?.effectiveType && ["slow-2g", "2g", "3g"].includes(conn.effectiveType))
        return false;
    return true;
}
