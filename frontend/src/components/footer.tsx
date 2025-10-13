import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Mail } from "lucide-react";
import { InstagramIcon } from "./icons/instagram";
import { FacebookIcon } from "./icons/facebook";
import { Link } from "@tanstack/react-router";

export function Footer() {
    return (
        <footer className="col-start-1 col-span-1 bg-card border-t border-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 xl:pt-36">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info & Contact */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-card-foreground">
                            SIBRA Bienes Raíces
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Tu socio de confianza para encontrar, comprar y vender propiedades.
                            Manejamos todas tus necesidades inmobiliarias con experiencia y
                            cuidado.
                        </p>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-foreground">(669) 112-9742</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-foreground">(618) 194-1145</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-foreground">contacto@sibra.mx</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-foreground">
                                    C. Cancer #132. Fracc. Sahop, 34190 Durango, Dgo.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-card-foreground">
                            Nuestros Servicios
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    to="/propiedades"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Compra de Propiedades
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/vender"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Venta de Propiedades
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Consultoría Inmobiliaria
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Trámites Legales
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Valuación de Propiedades
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="#"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Análisis de Mercado
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-card-foreground">
                            Enlaces Rápidos
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    to="/nosotros"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Acerca de Nosotros
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/propiedades"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Propiedades
                                </Link>
                            </li>
                            {/* <li> */}
                            {/*     <Link */}
                            {/*         to="/testimonios" */}
                            {/*         className="text-foreground hover:text-primary transition-colors" */}
                            {/*     > */}
                            {/*         Testimonios */}
                            {/*     </Link> */}
                            {/* </li> */}
                            <li>
                                <Link
                                    to="#"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Preguntas Frecuentes
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/contacto"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Contacto
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/politica-de-privacidad"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Política de Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/terminos-y-condiciones"
                                    className="text-foreground hover:text-primary transition-colors"
                                >
                                    Términos de Servicio
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter Signup */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-card-foreground">
                            Mantente Actualizado
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Recibe las últimas propiedades disponibles y análisis de mercado
                            directamente en tu bandeja de entrada.
                        </p>
                        <div className="space-y-3">
                            <Input
                                type="email"
                                placeholder="Ingrese su correo electrónico"
                                className="bg-background border-border"
                            />
                            <Button className="w-full border-2 border-sbr-green bg-sbr-green hover:bg-accent/90 active:bg-sbr-green text-gray-100 hover:text-sbr-green active:text-gray-100 font-bold tracking-wide active:scale-95 cursor-pointer">
                                Suscribirse
                            </Button>
                        </div>

                        {/* Social Media */}
                        <div className="pt-4">
                            <p className="text-sm font-medium text-card-foreground mb-3">
                                Síguenos
                            </p>
                            <div className="flex gap-3">
                                <a
                                    href="https://www.facebook.com/sibra.app"
                                    className="p-2 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                                    aria-label="Facebook"
                                >
                                    <FacebookIcon className="h-4 w-4" />
                                </a>
                                <a
                                    href="https://instagram.com/sibra.app"
                                    className="p-2 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                                    aria-label="Instagram"
                                >
                                    <InstagramIcon className="h-4 w-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-border">
                    <div className="flex flex-col justify-between items-center gap-6">
                        <div className="flex gap-6 text-xs">
                            <Link
                                to="/terminos-y-condiciones"
                                className="text-center text-muted-foreground hover:text-primary transition-colors"
                            >
                                Términos de Servicio
                            </Link>
                            <Link
                                to="/politica-de-privacidad"
                                className="text-center text-muted-foreground hover:text-primary transition-colors"
                            >
                                Política de Privacidad
                            </Link>
                            <Link
                                to="/politica-de-cookies"
                                className="text-center text-muted-foreground hover:text-primary transition-colors"
                            >
                                Política de Cookies
                            </Link>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            © 2025 SIBRA Bienes Raíces. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
