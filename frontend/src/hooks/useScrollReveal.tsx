// hooks/useScrollReveal.js
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Animation presets
const animations = {
    fadeUp: {
        from: { opacity: 0, y: "60%" },
        to: { opacity: 1, y: 0 }
    },
    fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 }
    },
    slideLeft: {
        from: { opacity: 0, x: 100 },
        to: { opacity: 1, x: 0 }
    },
    slideRight: {
        from: { opacity: 0, x: -100 },
        to: { opacity: 1, x: 0 }
    },
    scale: {
        from: { opacity: 0, scale: 0.8 },
        to: { opacity: 1, scale: 1 }
    }
} as const;

type TUseScrollRevealOptions = {
    trigger?: React.Ref<HTMLElement> | null;
    animation?: keyof typeof animations;
    stagger?: number;
    start?: string;
    duration?: number;
    ease?: string;
    delay?: number;
};

export function useScrollReveal(options: TUseScrollRevealOptions = {}) {
    const ref = useRef<HTMLElement>(null);

    const {
        trigger = ref,
        start = "top 80%",
        animation = "fadeUp",
        stagger = 0.5,
        duration = 0.8,
        ease = "power3.out",
        delay = 0,
    } = options;

    useGSAP(() => {
        if (!ref.current) return;

        const anim = animations[animation] || animations.fadeUp;

        gsap.fromTo("[data-scroll-reveal]", anim.from, {
            ...anim.to,
            duration,
            ease,
            stagger,
            delay,
            scrollTrigger: {
                trigger: ref.current,
                start,
                once: true, // Only animate once
                toggleActions: "play none none none"
            }
        });
    }, { scope: ref });

    return ref;
}
