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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export type TConqsQuoteFormData = z.infer<typeof conqsQuoteFormSchema>;

const conqsQuoteFormSchema = z.object({
    name: z.string().min(1, "El nombre no puede estar vacío"),
    phone: z.string().min(1, "El número de teléfono no puede estar vacío").max(10, "El número de teléfono no puede tener más de 10 caracteres"),
    consent: z.literal(true, "Debes aceptar que te contactemos para agendar una cita."),
    schedule: z.enum(["otro", "fin de semana", "entre semana", "sin especificar"]).optional().or(z.literal("")),
});

export function ConqsQuoteForm() {
    const form = useForm<TConqsQuoteFormData>({
        resolver: zodResolver(conqsQuoteFormSchema),
        defaultValues: {
            name: "",
            phone: "",
            schedule: "sin especificar",
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
                    form.reset();
                },
                onError: (err) => {
                    toast.error(err.message, { closeButton: true });
                },
            });

            if (window.fbq) {
                window.fbq("track", "Schedule")
            }
        },
        () => {
            toast.error("El formulario es inválido. Corrige los datos e intenta de nuevo.");
        },
    );

    return (
        <Form {...form}>
            <form
                className="relative z-10 flex flex-col items-center justify-center px-6 py-24 sm:py-32"
                onSubmit={onSubmit}
            >
                <div className="relative z-0 w-full max-w-lg p-6 bg-sbr-blue-dark/30 backdrop-blur-md rounded space-y-6">
                    <div
                        className="absolute z-10 inset-0 flex flex-col items-center justify-center gap-6 bg-accent mb-0 rounded text-gray-800 transition duration-500 opacity-0 data-[state=pending]:opacity-100 scale-0 data-[state=pending]:scale-100 pointer-events-none data-[state=pending]:pointer-events-auto"
                        data-state={conqsQuoteMut.status}
                    >
                        <span className="loader"></span>
                        <span className="text-2xl text-current/60 font-medium">Cargando...</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold uppercase">¡Agenda tu cita!</h2>
                    <div className="space-y-4 sm:space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="basis-1/2 sm:space-y-1">
                                    <FormLabel className="sm:text-base">Nombre</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            className="bg-card text-gray-800 sm:text-base"
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
                                <FormItem className="basis-1/2 sm:space-y-1">
                                    <FormLabel className="sm:text-base">Teléfono</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="tel"
                                            className="bg-card text-gray-800 sm:text-base"
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
                            name="schedule"
                            render={({ field }) => (
                                <FormItem>
                                    <Select>
                                        <FormLabel className="sm:text-base">Horario de visita</FormLabel>
                                        <FormControl>
                                            <SelectTrigger className="w-full text-gray-800 bg-card">
                                                <SelectValue placeholder="¿Cuándo deseas visitar?" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="otro">Otro horario</SelectItem>
                                            <SelectItem value="fin de semana">Este fin de semana</SelectItem>
                                            <SelectItem value="entre semana">Entre semana</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        <FormLabel className="pt-1.5 sm:text-base">Acepto que se me contacte a través de Whatsapp o llamada telefónica.</FormLabel>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="">
                        <Button
                            type="submit"
                            className="w-full bg-linear-to-b from-sbr-blue-light to-sbr-blue hover:bg-sbr-blue-light active:bg-sbr-blue-dark text-gray-50 sm:text-base shadow active:shadow-sm hover:scale-105 active:scale-95"
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

export function ConqsFooterQuoteForm() {
    const form = useForm<TConqsQuoteFormData>({
        resolver: zodResolver(conqsQuoteFormSchema),
        defaultValues: {
            name: "",
            phone: "",
            schedule: "otro",
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
                    form.reset();
                },
                onError: (err) => {
                    toast.error(err.message, { closeButton: true });
                },
            });

            if (window.fbq) {
                window.fbq("track", "Schedule")
            }
        },
        () => {
            toast.error("El formulario es inválido. Corrige los datos e intenta de nuevo.");
        },
    );

    return (
        <Form {...form}>
            <form
                className="relative z-0 flex flex-col items-center justify-center"
                onSubmit={onSubmit}
            >
                <div className="relative z-0 w-full py-6 rounded space-y-6 sm:space-y-8">
                    <div
                        className="absolute z-10 inset-0 flex flex-col items-center justify-center gap-6 bg-accent mb-0 rounded text-gray-800 transition duration-500 opacity-0 data-[state=pending]:opacity-100 scale-0 data-[state=pending]:scale-100 pointer-events-none data-[state=pending]:pointer-events-auto"
                        data-state={conqsQuoteMut.status}
                    >
                        <span className="loader"></span>
                        <span className="text-2xl text-current/60 font-medium">Cargando...</span>
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="basis-1/2">
                                    <FormLabel className="sm:text-base">Nombre</FormLabel>
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
                                    <FormLabel className="sm:text-base">Teléfono</FormLabel>
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
                            name="schedule"
                            render={({ field }) => (
                                <FormItem>
                                    <Select>
                                        <FormLabel className="sm:text-base">Horario de visita</FormLabel>
                                        <FormControl>
                                            <SelectTrigger className="w-full bg-card">
                                                <SelectValue placeholder="¿Cuándo deseas visitar?" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="otro">Otro horario</SelectItem>
                                            <SelectItem value="fin de semana">Este fin de semana</SelectItem>
                                            <SelectItem value="entre semana">Entre semana</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="consent"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2 sm:gap-4 basis-1/2">
                                        <FormControl>
                                            <Checkbox
                                                className="bg-card shadow-lg sm:size-6"
                                                name={field.name}
                                                defaultChecked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="leading-none sm:pt-1.5 sm:text-base">Acepto que se me contacte a través de Whatsapp o llamada telefónica.</FormLabel>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="">
                        <Button
                            type="submit"
                            className="w-full bg-sbr-blue hover:bg-sbr-blue-light active:bg-sbr-blue-dark sm:text-base text-gray-50 shadow active:shadow-sm hover:scale-105 active:scale-95"
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
