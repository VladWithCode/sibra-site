import { z } from "zod";

export const BlogPostFormSchema = z.object({
    title:       z.string().min(1, "El título es obligatorio"),
    snippet:     z.string().optional(),
    content:     z.string().min(1, "El contenido es obligatorio"),
    coverImage:  z.string().optional(),
    readingTime: z.number().int().nonnegative().optional(),
    tagIds:      z.array(z.string()).optional(),
});

export type BlogPostFormValues = z.infer<typeof BlogPostFormSchema>;

export const blogPostFormDefaults: BlogPostFormValues = {
    title:       "",
    snippet:     "",
    content:     "",
    coverImage:  "",
    readingTime: undefined,
    tagIds:      [],
};
