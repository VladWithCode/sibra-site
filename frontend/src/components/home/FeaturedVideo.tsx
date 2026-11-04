import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { isReady, videoSrc, type TMediaAsset } from "@/lib/media";
import { cn } from "@/lib/utils";
import {
    autoplayAllowed,
    registerFeaturedVideo,
    type TPlaybackHandle,
} from "./featuredPlayback";

/**
 * Playback state of a featured card's cover video. The video element gets
 * no `src` until the coordinator picks this card, so the home page never
 * downloads video for cards the user does not reach (or that another card
 * outranks). Returns refs and controls for FeaturedCard to place.
 */
export function useFeaturedVideo(asset: TMediaAsset | undefined, priority: number) {
    const video = isReady(asset) ? asset : undefined;
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const handle = useRef<TPlaybackHandle | null>(null);
    const [autoplay] = useState(() => typeof window !== "undefined" && autoplayAllowed());
    const [playing, setPlaying] = useState(false);
    const [src, setSrc] = useState<string>();
    const [shown, setShown] = useState(false);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        const el = containerRef.current;
        if (!video || !el) return;
        handle.current = registerFeaturedVideo(el, priority, autoplay, setPlaying);
        return () => {
            handle.current?.unregister();
            handle.current = null;
        };
    }, [video?.id, priority, autoplay]);

    useEffect(() => {
        if (playing && !src && video) setSrc(videoSrc(video, 720));
    }, [playing, src, video]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v || !src) return;
        v.muted = muted;
        if (playing) {
            v.play().catch(() => {
                // Autoplay refused (e.g. iOS Low Power Mode): the play button stays.
                setPlaying(false);
            });
        } else {
            v.pause();
        }
    }, [playing, src]);

    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = muted;
    }, [muted]);

    // Handlers run inside the tap so browsers allow playback with sound.
    const onPlay = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const v = videoRef.current;
        if (!v || !video) return;
        if (!src) {
            const s = videoSrc(video, 720);
            v.src = s;
            setSrc(s);
        }
        v.play().catch(() => {});
        setPlaying(true);
        handle.current?.requestPlay();
    };

    const onToggleMuted = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !muted;
        if (videoRef.current) videoRef.current.muted = next;
        setMuted(next);
    };

    const videoElement = video ? (
        <video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden
            tabIndex={-1}
            onPlaying={() => setShown(true)}
            className={cn(
                "absolute inset-0 w-full h-full object-cover brightness-90 transition-opacity duration-500",
                shown ? "opacity-100" : "opacity-0",
            )}
        />
    ) : null;

    const controls = video ? (
        <div className="absolute top-3 right-3 z-20">
            {playing ? (
                video.hasAudio && (
                    <button
                        type="button"
                        onClick={onToggleMuted}
                        aria-pressed={!muted}
                        aria-label={muted ? "Activar sonido" : "Silenciar"}
                        className="grid place-items-center size-9 rounded-full bg-foreground/50 text-background backdrop-blur-sm transition-colors hover:bg-foreground/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
                    >
                        {muted ? (
                            <VolumeX className="size-4" />
                        ) : (
                            <Volume2 className="size-4" />
                        )}
                    </button>
                )
            ) : (
                <button
                    type="button"
                    onClick={onPlay}
                    aria-label="Reproducir video"
                    className="grid place-items-center size-9 rounded-full bg-foreground/50 text-background backdrop-blur-sm transition-colors hover:bg-foreground/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
                >
                    <Play className="size-4 translate-x-px" />
                </button>
            )}
        </div>
    ) : null;

    return { containerRef, videoElement, controls };
}
