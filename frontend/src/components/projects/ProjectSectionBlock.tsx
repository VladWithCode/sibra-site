import { ProjectImage } from "@/components/Image";
import { cn } from "@/lib/utils";
import type { TProjectSection } from "@/queries/type";

// ProjectSectionBlock renders a single project section on the public detail
// page. It adapts to three shapes:
//   - text only          → centered readable column
//   - image only         → centered image at a comfortable max width
//   - text + image       → responsive grid (1 col mobile, 2 cols desktop)
// `image_side` controls which column the image lives in on desktop.
export function ProjectSectionBlock({ section }: { section: TProjectSection }) {
    const hasText = section.title.trim() !== "" || section.body.trim() !== "";
    const hasImage = section.image.trim() !== "";

    if (!hasText && !hasImage) return null;

    if (hasText && !hasImage) {
        return (
            <article className="mx-auto max-w-3xl space-y-6">
                <SectionHeading title={section.title} />
                <SectionBody body={section.body} />
            </article>
        );
    }

    if (!hasText && hasImage) {
        return (
            <figure className="mx-auto max-w-4xl">
                <div className="overflow-hidden rounded-2xl shadow-2xl">
                    <ProjectImage
                        projName="Sección"
                        src={section.image}
                        className="aspect-[16/10] w-full object-cover"
                    />
                </div>
            </figure>
        );
    }

    // Text + image: two-column grid on desktop. image_side controls order via
    // a grid order utility so source order in DOM stays text-first for
    // accessibility/SEO regardless of visual layout.
    const imageOnLeft = section.image_side === "left";

    return (
        <article className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className={cn("space-y-6", imageOnLeft && "lg:order-2")}>
                <SectionHeading title={section.title} />
                <SectionBody body={section.body} />
            </div>
            <div className={cn("relative", imageOnLeft && "lg:order-1")}>
                <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl">
                    <ProjectImage
                        projName="Sección"
                        src={section.image}
                        className="h-full w-full object-cover"
                    />
                </div>
            </div>
        </article>
    );
}

function SectionHeading({ title }: { title: string }) {
    const trimmed = title.trim();
    if (!trimmed) return null;
    return (
        <h2 className="text-on-surface text-3xl font-bold leading-tight tracking-tighter">
            {trimmed}
        </h2>
    );
}

function SectionBody({ body }: { body: string }) {
    const paragraphs = body
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p !== "");
    if (paragraphs.length === 0) return null;
    return (
        <div className="text-on-surface-variant space-y-6 leading-relaxed">
            {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
            ))}
        </div>
    );
}
