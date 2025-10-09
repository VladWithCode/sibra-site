import type { TProperty } from "@/queries/type";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";

export function EditPropertyForm({ property }: { property: TProperty }) {
    const form = useForm<TPropertyFormData>({
        resolver: zodResolver(propertyFormSchema),
        defaultValues: property,
    })

    return (
        <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(console.log)}>
                <div className="flex gap-3">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="basis-1/2">
                                <FormLabel>Calle y número</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="Gral. Anaya #101 int 4"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nbHood"
                        render={({ field }) => (
                            <FormItem className="basis-1/2">
                                <FormLabel>Colonia/Fracc.</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="Gral. Anaya #101 int 4"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Casa de 2 pisos con fachada naranja. 2 habitaciones y 1 baño."
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <div className="flex gap-3">
                    <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Código Postal</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="34158"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Ciudad</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="Durango"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Estado</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="Durango"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>País</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="México"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex gap-3">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Precio</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="2_800_000"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="propertyType"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Tipo de Propiedad</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona un tipo de propiedad" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="casa">Casa</SelectItem>
                                        <SelectItem value="apartamento">Apartamento</SelectItem>
                                        <SelectItem value="terreno">Terreno</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contract"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Tipo de Contrato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona un tipo de contrato" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="venta">Venta</SelectItem>
                                        <SelectItem value="renta">Renta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex gap-3">
                    <FormField
                        control={form.control}
                        name="beds"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Habitaciones</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="3"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="baths"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Baños</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="3"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sqMt"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>
                                    <span>Superficie (m<sup>2</sup>)</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="90"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lotSize"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>
                                    <span>Construccion (m<sup>2</sup>)</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="90"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex gap-3">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Estatus</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona un estatus" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="borrador">Borrador</SelectItem>
                                        <SelectItem value="archivada">Archivada</SelectItem>
                                        <SelectItem value="publicada">Publicada</SelectItem>
                                        <SelectItem value="en_revision">En Revisón</SelectItem>
                                        <SelectItem value="vendida">Vendida</SelectItem>
                                        <SelectItem value="no_disponible">No Disponible</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="yearBuilt"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Año de Construcción</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="2010"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end">
                    <Button className="bg-sbr-blue-light text-gray-50" variant="ghost" size="lg">Guardar</Button>
                </div>
            </form>
        </Form>
    );
}

const propertyFormSchema = z.object({
    // id: z.uuid({ version: "v7", error: "El id de la propiedad no es válido" }).optional().or(z.literal("")),
    address: z.string().min(1, "La dirección no puede ser vacía"),
    nbHood: z.string().min(1, "La colonia/fracc. no puede estar vacía"),
    description: z.string().min(1, "La descripción no puede estar vacía").optional().or(z.literal("")),
    city: z.string().min(1, "La ciudad no puede estar vacío"),
    state: z.string().min(1, "El estado no puede estar vacío"),
    zip: z.string().min(1, "El código postal no puede estar vacío"),
    country: z.string().min(1, "El país no es válido").optional().or(z.literal("")),
    price: z.number().min(0, "El precio no puede ser negativo.").optional().or(z.literal("")),
    contract: z.enum(["venta", "renta"], "El contrato de la propiedad no es válido"),
    status: z.enum(["borrador", "archivada", "publicada", "en_revision", "vendida", "no_disponible"], "El estatus de la propiedad no es válido"),
    propertyType: z.enum(["casa", "apartamento", "terreno"], "El tipo de propiedad no es válido"),
    beds: z.number().min(0, "El número de habitaciones no puede ser negativo.").optional().or(z.literal("")),
    baths: z.number().min(0, "El número de baños no puede ser negativo.").optional().or(z.literal("")),
    sqMt: z.number().min(0, "El tamaño de la superficie no puede ser negativo.").optional().or(z.literal("")),
    lotSize: z.number().min(0, "El tamaño de la construcción no puede ser negativo.").optional().or(z.literal("")),
    yearBuilt: z.number().min(0, "El año de construcción no puede ser negativo.").optional().or(z.literal("")),
    lat: z.number().optional().or(z.literal("")),
    lon: z.number().optional().or(z.literal("")),
})

type TPropertyFormData = z.infer<typeof propertyFormSchema>

export function EditPropertyPicForm({ property }: { property: TProperty }) {
    const form = useForm<TMainImgFormData>({
        resolver: zodResolver(mainImgFormSchema),
        defaultValues: {
            mainImg: property.mainImg,
        },
    })

    return (
        <Form {...form}>
            <div className="flex gap-3">
                <FormField
                    control={form.control}
                    name="mainImg"
                    render={({ field }) => (
                        <FormItem className="basis-1/2">
                            <FormLabel>Foto principal</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    className="bg-gray-50"
                                    placeholder="https://example.com/image.jpg"
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="imgs"
                    render={({ field }) => (
                        <FormItem className="basis-1/2">
                            <FormLabel>Galería de fotos</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    className="bg-gray-50"
                                    placeholder="https://example.com/image.jpg"
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
            <div className="flex justify-end">
                <Button className="bg-sbr-blue-light text-gray-50" variant="ghost" size="lg">Guardar</Button>
            </div>
        </Form>
    );
}

const mainImgFormSchema = z.object({
    mainImg: z.string("La imagen principal es inválida").optional().or(z.literal("")),
    imgs: z.array(z.string(), "La galería de fotos contiene valores inválidos").optional().or(z.literal("")),
})

type TMainImgFormData = z.infer<typeof mainImgFormSchema>
