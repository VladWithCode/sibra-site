import z from "zod";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { createConqsQuoteOpts } from "@/queries/quotes";

export type TConqsQuoteFormData = z.infer<typeof mainImgFormSchema>

const mainImgFormSchema = z.object({
    name: z.string().min(1, "El nombre no puede estar vacío"),
    phone: z.string().min(1, "El número de teléfono no puede estar vacío").max(10, "El número de teléfono no puede tener más de 10 caracteres"),
    consent: z.literal(true, "Debes aceptar que te contactemos para agendar una cita."),
})

export function ConqsQuoteForm() {
    const form = useForm<TConqsQuoteFormData>({
        resolver: zodResolver(mainImgFormSchema),
        defaultValues: {
            name: "",
            phone: "",
            consent: false,
        },
    });

    const conqsQuoteMut = useMutation(createConqsQuoteOpts(""));
    const onSubmit = form.handleSubmit(
        (data) => {
            conqsQuoteMut.mutate({
                quoteData: data,
            }, {
                onSuccess: () => {
                    toast.success("La cita ha sido creada correctamente.", { closeButton: true });
                },
                onError: (err) => {
                    toast.error(err.message, { closeButton: true });
                },
            });
        },
        () => {
            toast.error("El formulario es inválido. Corrige los datos e intenta de nuevo.");
        },
    );

    return (
        <Form {...form}>
            <form
                className="relative z-10 flex flex-col items-center justify-center px-6 py-24"
                onSubmit={onSubmit}
            >
                <div className="w-full p-6 bg-sbr-blue-dark/30 backdrop-blur-md rounded space-y-6">
                    <h2 className="text-2xl font-bold uppercase">¡Contáctanos!</h2>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="basis-1/2">
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            className="bg-card text-gray-800"
                                            placeholder="Nombre"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="basis-1/2">
                                    <FormLabel>Teléfono</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="tel"
                                            className="bg-card text-gray-800"
                                            placeholder="Teléfono"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="consent"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2 basis-1/2">
                                        <FormControl>
                                            <Checkbox
                                                className="bg-card shadow-lg"
                                                name={field.name}
                                                defaultChecked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="pt-1.5">Acepto que se me contacte a través de Whatsapp o llamada telefónica.</FormLabel>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="">
                        <Button
                            type="submit"
                            className="w-full bg-sbr-blue hover:bg-sbr-blue-light active:bg-sbr-blue-dark text-gray-50 shadow active:shadow-sm hover:scale-105 active:scale-95"
                            size="lg"
                        >
                            Enviar
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
