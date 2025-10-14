import type { TProperty } from "@/queries/type";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { createPropertyOpts, deletePropertyImgOpts, updatePropertyDetailsOpts, updatePropertyGalleryOpts, updatePropertyMainImgOpts } from "@/queries/properties";
import { toast } from "sonner";
import { LucideTrash } from "lucide-react";
import { useCallback } from "react";
import { useRouter } from "@tanstack/react-router";

export function CreatePropertyForm({ }: {}) {
    const router = useRouter();
    const form = useForm<TPropertyFormData>({
        resolver: zodResolver(propertyFormSchema),
        defaultValues: {
            address: "",
            nbHood: "",
            description: "",
            city: "",
            state: "",
            zip: "",
            country: "",
            price: 0,
            propertyType: "casa",
            contract: "venta",
            beds: 0,
            baths: 0,
            sqMt: 0,
            lotSize: 0,
            yearBuilt: 0,
            lat: 0,
            lon: 0,
            featured: false,
            status: "publicada",
        },
    });
    const createPropertyMut = useMutation(createPropertyOpts());
    const onSubmit = form.handleSubmit(
        (data) => {
            createPropertyMut.mutate({
                property: data,
            }, {
                onSuccess: (data) => {
                    toast.success("La propiedad ha sido creada correctamente. Serás redirigido en un segundo.", { closeButton: true });

                    setTimeout(() => {
                        router.history.push("/panel/propiedades/" + data.property.id);
                    }, 1000);
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
            <form className="space-y-6" onSubmit={onSubmit}>
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
                                        className="bg-card"
                                        placeholder="Gral. Anaya #101 int 4"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        className="bg-card"
                                        placeholder="Gral. Anaya #101 int 4"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                    className="bg-card"
                                    placeholder="Casa de 2 pisos con fachada naranja. 2 habitaciones y 1 baño."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
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
                                        className="bg-card"
                                        placeholder="34158"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        className="bg-card"
                                        placeholder="Durango"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        className="bg-card"
                                        placeholder="Durango"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        className="bg-card"
                                        placeholder="México"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="2_800_000"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        <SelectTrigger className="w-full bg-card">
                                            <SelectValue placeholder="Selecciona un tipo de propiedad" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="casa">Casa</SelectItem>
                                        <SelectItem value="apartamento">Apartamento</SelectItem>
                                        <SelectItem value="terreno">Terreno</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
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
                                        <SelectTrigger className="w-full bg-card">
                                            <SelectValue placeholder="Selecciona un tipo de contrato" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="venta">Venta</SelectItem>
                                        <SelectItem value="renta">Renta</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="3"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="3"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="90"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="90"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        <SelectTrigger className="w-full bg-card">
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
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="2010"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Separator />
                <div className="flex gap-3">
                    <FormField
                        control={form.control}
                        name="lon"
                        render={({ field }) => (
                            <FormItem className="basis-1/2">
                                <FormLabel>Longitud</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="bg-card"
                                        placeholder="https://example.com/image.jpg"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lat"
                        render={({ field }) => (
                            <FormItem className="basis-1/2">
                                <FormLabel>Latitud</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="bg-card"
                                        placeholder="https://example.com/image.jpg"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex items-start gap-3">
                    <FormField
                        control={form.control}
                        name="featured"
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
                                    <FormLabel className="leading-none">Marcar como destacada</FormLabel>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex gap-3 justify-end">
                    <Button
                        type="button"
                        className="bg-gray-200 text-primary" size="lg" type="button"
                        onClick={() => {
                            router.history.push("/panel/propiedades");
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button className="bg-sbr-blue-light text-gray-50 shadow-lg" variant="ghost" size="lg">
                        Guardar
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export function EditPropertyForm({ property }: { property: TProperty }) {
    const router = useRouter();
    const form = useForm<TPropertyFormData>({
        resolver: zodResolver(propertyFormSchema),
        defaultValues: property,
    });
    const updatePropertyMut = useMutation(updatePropertyDetailsOpts(property.id));
    const onSubmit = form.handleSubmit(
        (data) => {
            updatePropertyMut.mutate({ ...data, id: property.id }, {
                onSuccess: () => {
                    toast.success("La propiedad ha sido actualizada correctamente.", { closeButton: true });
                },
                onError: (err) => {
                    toast.error(err.message, { closeButton: true });
                },
            });
        },
        () => {
            toast.error("El formulario no es válido. Corrige la información e intenta de nuevo.", { closeButton: true });
        },
    );

    return (
        <Form {...form}>
            <form className="space-y-6" onSubmit={onSubmit}>
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
                                        className="bg-card"
                                        placeholder="Gral. Anaya #101 int 4"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        className="bg-card"
                                        placeholder="Gral. Anaya #101 int 4"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                    className="bg-card"
                                    placeholder="Casa de 2 pisos con fachada naranja. 2 habitaciones y 1 baño."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
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
                                        className="bg-card"
                                        placeholder="34158"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        className="bg-card"
                                        placeholder="Durango"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        className="bg-card"
                                        placeholder="Durango"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        className="bg-card"
                                        placeholder="México"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="2_800_000"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        <SelectTrigger className="w-full bg-card">
                                            <SelectValue placeholder="Selecciona un tipo de propiedad" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="casa">Casa</SelectItem>
                                        <SelectItem value="apartamento">Apartamento</SelectItem>
                                        <SelectItem value="terreno">Terreno</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
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
                                        <SelectTrigger className="w-full bg-card">
                                            <SelectValue placeholder="Selecciona un tipo de contrato" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="venta">Venta</SelectItem>
                                        <SelectItem value="renta">Renta</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="3"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="3"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="90"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="90"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                                        <SelectTrigger className="w-full bg-card">
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
                                <FormMessage />
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
                                        type="number"
                                        className="bg-card"
                                        placeholder="2010"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Separator />
                <div className="flex gap-3">
                    <FormField
                        control={form.control}
                        name="lon"
                        render={({ field }) => (
                            <FormItem className="basis-1/2">
                                <FormLabel>Longitud</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="bg-card"
                                        placeholder="https://example.com/image.jpg"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lat"
                        render={({ field }) => (
                            <FormItem className="basis-1/2">
                                <FormLabel>Latitud</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="bg-card"
                                        placeholder="https://example.com/image.jpg"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex items-start gap-3">
                    <FormField
                        control={form.control}
                        name="featured"
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
                                    <FormLabel className="leading-none">Marcar como destacada</FormLabel>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex gap-3 justify-end">
                    <Button
                        className="bg-gray-200 text-primary shadow-md active:shadow-sm hover:scale-105 active:scale-95"
                        size="lg"
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            router.history.push("/panel/propiedades");
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button className="bg-sbr-blue hover:bg-sbr-blue-light active:bg-sbr-blue-dark text-gray-50 hover:text-gray-50 shadow-md active:shadow-sm hover:scale-105 active:scale-95" variant="ghost" size="lg">
                        Guardar
                    </Button>
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
    price: z.coerce.number("El precio debe ser un número.").min(0, "El precio no puede ser negativo.").optional(),
    contract: z.enum(["venta", "renta"], "El contrato de la propiedad no es válido"),
    status: z.enum(["borrador", "archivada", "publicada", "en_revision", "vendida", "no_disponible"], "El estatus de la propiedad no es válido"),
    propertyType: z.enum(["casa", "apartamento", "terreno"], "El tipo de propiedad no es válido"),
    beds: z.coerce.number("El número de habitaciones no es válido.").min(0, "El número de habitaciones no puede ser negativo.").optional(),
    baths: z.coerce.number("El número de habitaciones no es válido.").min(0, "El número de baños no puede ser negativo.").optional(),
    sqMt: z.coerce.number("La superficie del terreno no es válida.").min(0, "El tamaño de la superficie no puede ser negativo.").optional(),
    lotSize: z.coerce.number("La superficie construida del terreno no es válida.").min(0, "El tamaño de la construcción no puede ser negativo.").optional(),
    yearBuilt: z.coerce.number("El año de construcción no es válido.").min(0, "El año de construcción no puede ser negativo.").optional(),
    lat: z.coerce.number("La latitud debe ser un número válido.").optional(),
    lon: z.coerce.number("La longitud debe ser un número válido.").optional(),
    featured: z.boolean().optional(),
})

export type TPropertyFormData = z.infer<typeof propertyFormSchema>

export function EditPropertyPicForm({ property }: { property: TProperty }) {
    const form = useForm<TMainImgFormData>({
        resolver: zodResolver(mainImgFormSchema),
    });
    const updateImgMut = useMutation(updatePropertyMainImgOpts(property.id));
    const onSubmit = form.handleSubmit(
        (data) => {
            updateImgMut.mutate({
                id: property.id,
                file: data.mainImg,
            }, {
                onSuccess: () => {
                    toast.success("La propiedad ha sido actualizada correctamente.", { closeButton: true });
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
    const deleteImgMut = useMutation(deletePropertyImgOpts(property.id));
    const onDeleteImg = useCallback((imgName: string) => {
        console.log(imgName);
        deleteImgMut.mutate({
            id: property.id,
            imgName,
            type: "main",
        }, {
            onSuccess: () => {
                toast.success("La foto ha sido eliminada correctamente.", { closeButton: true });
            },
            onError: (err) => {
                toast.error(err.message, { closeButton: true });
            },
        });
    }, [property.id])

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <div className="flex gap-3 flex-auto">
                    <FormField
                        control={form.control}
                        name="mainImg"
                        render={({ field: { value, onChange, ...field } }) => (
                            <FormItem className="basis-1/2">
                                <FormLabel>Foto principal</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept="image/jpeg, image/jpg, image/png, image/webp"
                                        className="bg-card"
                                        onChange={e => onChange(e.target.files?.[0] || undefined)}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex items-end justify-center flex-1">
                        <Button className="w-full bg-sbr-blue-light text-gray-50" variant="ghost" size="lg">Guardar</Button>
                    </div>
                </div>
                <div className="relative z-0 flex-1 group">
                    <div className="aspect-video">
                        <img
                            src={`/static/properties/${property.id}/${property.mainImg}`}
                            className="object-cover w-full h-full rounded-lg shadow-lg"
                        />
                    </div>
                    <div className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                        <Button
                            type="button"
                            className="size-8"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                                console.log("delete");
                                onDeleteImg(property.mainImg)
                            }}
                        >
                            <LucideTrash />
                            <span className="sr-only">Eliminar foto principal</span>
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}

const mainImgFormSchema = z.object({
    mainImg: z
        .instanceof(File, { message: "Debe seleccionar un archivo válido." })
        .refine((file) => file.size > 0, { message: "El archivo no puede estar vacío." })
        .refine((file) => file.size <= 90 * 1024 * 1024, { message: "El archivo es demasiado grande (máximo 90MB)." })
        .refine((file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type), {
            message: "Solo se permiten imágenes JPEG, PNG o WebP.",
        })
        .optional(), // Makes the field optional
});

type TMainImgFormData = z.infer<typeof mainImgFormSchema>

export function EditPropertyGalleryForm({ property }: { property: TProperty }) {
    const form = useForm<TGalleryFormData>({
        resolver: zodResolver(galleryFormSchema),
    });
    const updateImgMut = useMutation(updatePropertyGalleryOpts(property.id));
    const onSubmit = form.handleSubmit(
        (data) => {
            updateImgMut.mutate({
                id: property.id,
                files: data.gallery,
            }, {
                onSuccess: () => {
                    toast.success("La galería de fotos ha sido actualizada correctamente.", { closeButton: true });
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

    const deleteImgMut = useMutation(deletePropertyImgOpts(property.id));
    const onDeleteImg = useCallback((imgName: string, type: "main" | "gallery") => {
        deleteImgMut.mutate({
            id: property.id,
            imgName,
            type: type,
        }, {
            onSuccess: () => {
                toast.success("La foto ha sido eliminada correctamente.", { closeButton: true });
            },
            onError: (err) => {
                toast.error(err.message, { closeButton: true });
            },
        });
    }, [property.id])

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <div className="flex gap-3 flex-auto">
                    <FormField
                        control={form.control}
                        name="gallery"
                        render={({ field: { value, onChange, ...field } }) => (
                            <FormItem className="basis-1/2">
                                <FormLabel>Galería de fotos</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept="image/jpeg, image/jpg, image/png, image/webp"
                                        className="bg-card"
                                        onChange={e => onChange(e.target.files)}
                                        {...field}
                                        multiple
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex items-end justify-center flex-1">
                        <Button className="w-full bg-sbr-blue-light text-gray-50" variant="ghost" size="lg">Guardar</Button>
                    </div>
                </div>
                <div className="relative z-0 h-min flex-1">
                    <div className="grid grid-cols-4 auto-rows-min gap-3">
                        {
                            property.imgs?.length > 0
                                ? (
                                    property.imgs.map((img) => (
                                        <div className="relative z-0 group aspect-square">
                                            <img
                                                key={img}
                                                src={`/static/properties/${property.id}/${img}`}
                                                className="relative z-0 object-cover w-full h-full rounded-lg shadow-lg transition-[filter] duration-300 brightness-100 group-hover:brightness-90"
                                            />
                                            <div className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                                <Button
                                                    type="button"
                                                    className="size-8"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => onDeleteImg(img, "gallery")}
                                                >
                                                    <LucideTrash />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full row-span-full flex items-center justify-center w-full h-full bg-card rounded-lg shadow-lg">
                                        <div className="text-center">
                                            <p className="text-2xl text-current/60 font-semibold">Galería de fotos</p>
                                            <p className="text-current/60 font-semibold">No hay fotos aún</p>
                                        </div>
                                    </div>
                                )
                        }
                    </div>
                </div>
            </form>
        </Form>
    );
}

const galleryFormSchema = z.object({
    gallery: z.instanceof(FileList, { message: "Debe seleccionar archivos." })
        .refine((fileList) => fileList.length > 0, { message: "Debe seleccionar al menos una imagen." })
        .refine((fileList) => {
            for (let file of fileList) {
                if (file.size <= 0) return false;
                if (file.size > 90 * 1024 * 1024) return false;
                if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) return false;
            }
            return true;
        }, { message: "Los archivos deben ser imágenes válidas (JPEG, PNG, WebP) y menores a 90MB." }),
});

type TGalleryFormData = z.infer<typeof galleryFormSchema>
