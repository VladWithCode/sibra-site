import { describe, expect, it } from "vitest";
import { pickWinner } from "./featuredPlayback";

type E = { priority: number; autoplay: boolean; eligible: boolean };
const cards = (list: E[]) => list.map((e, i) => [i, e] as [number, E]);

describe("pickWinner", () => {
    it("plays the main card even when side cards are also visible (desktop)", () => {
        const list = cards([
            { priority: 0, autoplay: true, eligible: true }, // big main card
            { priority: 1, autoplay: true, eligible: true },
            { priority: 2, autoplay: true, eligible: true },
        ]);
        expect(pickWinner(list, null, false)).toBe(0);
    });

    it("hands playback to the next card once the main card leaves", () => {
        const list = cards([
            { priority: 0, autoplay: true, eligible: false },
            { priority: 1, autoplay: true, eligible: true },
            { priority: 2, autoplay: true, eligible: true },
        ]);
        expect(pickWinner(list, null, false)).toBe(1);
    });

    it("ignores registration order and uses priority", () => {
        const list: [number, E][] = [
            [7, { priority: 2, autoplay: true, eligible: true }],
            [3, { priority: 1, autoplay: true, eligible: true }],
        ];
        expect(pickWinner(list, null, false)).toBe(3);
    });

    it("never autoplays gated cards but honours a tap", () => {
        const list = cards([{ priority: 0, autoplay: false, eligible: true }]);
        expect(pickWinner(list, null, false)).toBeNull();
        expect(pickWinner(list, 0, false)).toBe(0);
    });

    it("lets a tapped lower-priority card override while it is visible", () => {
        const list = cards([
            { priority: 0, autoplay: true, eligible: true },
            { priority: 1, autoplay: true, eligible: true },
        ]);
        expect(pickWinner(list, 1, false)).toBe(1);
        list[1][1].eligible = false;
        expect(pickWinner(list, 1, false)).toBe(0);
    });

    it("plays nothing while the tab is hidden", () => {
        const list = cards([{ priority: 0, autoplay: true, eligible: true }]);
        expect(pickWinner(list, null, true)).toBeNull();
    });
});
