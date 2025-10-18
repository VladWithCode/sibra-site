import gsap from "gsap";

export function animateSection(section: HTMLElement, obsv: IntersectionObserver) {
    const animationParams = InviewAnimations.find((anim) => anim.id === section.id);

    if (!animationParams) return;
    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power1.inOut" } });
    tl.eventCallback("onComplete", () => {
        tl.kill();
    });

    for (const anim of animationParams.animations) {
        if (anim.animateFromOpts) {
            tl.fromTo(section.querySelectorAll(anim.selector), anim.animateFromOpts, {
                ...anim.animateToOpts,
                onComplete: () => {
                    obsv.unobserve(section);
                },
            });

            continue;
        }

        tl.to(section.querySelectorAll(anim.selector), {
            ...anim.animateToOpts,
            onComplete: () => {
                obsv.unobserve(section);
            },
        }, "<");
    }
}

export const InviewAnimations = [
    {
        id: "inicio",
        animations: [
            {
                selector: "[data-hero-bgimg]",
                animateToOpts: {
                    filter: "brightness(75%)",
                    duration: 0.8,
                },
            },
            {
                selector: "[data-backdrop]",
                animateToOpts: {
                    opacity: 1,
                    duration: 0.8,
                },
                position: "<55%",
            },
            {
                selector: "[data-content]>*",
                animateToOpts: {
                    opacity: 1,
                    y: "0rem",
                    stagger: 0.1,
                    duration: 0.8,
                },
                position: "<",
            },
        ],
    },
    {
        id: "disponibilidad",
        animations: [
            {
                selector: "[data-avl-img]",
                animateToOpts: {
                    opacity: 1,
                    delay: 0.3,
                },
            },
            {
                selector: "[data-avl-content]",
                animateToOpts: {
                    opacity: 1,
                    y: "0rem",
                    duration: 0.5,
                },
            },
        ],
    },
    {
        id: "detalles",
        animations: [
            {
                selector: "[data-card-title],[data-card]",
                animateToOpts: {
                    opacity: 1,
                    y: "0%",
                    duration: 0.8,
                    ease: "power2.out",
                    stagger: 0.2,
                },
            },
        ],
    },
    {
        id: "contacto",
        animations: [
            {
                selector: "[data-quote-form]",
                animateToOpts: {
                    opacity: 1,
                    y: "0%",
                    duration: 0.8,
                    ease: "power2.out",
                    stagger: 0.2,
                },
            },
        ],
    },
    {
        id: "oferta",
        animations: [
            {
                selector: "[data-container]",
                animateToOpts: {
                    opacity: 1,
                    y: "-3.5rem",
                },
            },
            {
                selector: "[data-badge]",
                animateToOpts: {
                    opacity: 1,
                    duration: 0.6,
                    x: "0rem",
                },
            },
            {
                selector: "[data-oferta-price]",
                animateToOpts: {
                    scale: 1,
                    delay: 0.15,
                    duration: 0.6,
                },
                position: "<",
            },
            {
                selector: "[data-feat-item]",
                animateToOpts: {
                    opacity: 1,
                    x: "0rem",
                    stagger: 0.1,
                },
            },
            {
                selector: "[data-feat-land]",
                animateToOpts: {
                    scale: 1,
                    delay: 0.35,
                },
            },
        ],
    }, {
        id: "pasos",
        animations: [
            {
                selector: "[data-card-wrapper]",
                animateToOpts: {
                    opacity: 1,
                    x: "0%",
                    duration: 0.8,
                    ease: "power2.out",
                    stagger: 0.2,
                },
            },
        ],
    }
] as const;
