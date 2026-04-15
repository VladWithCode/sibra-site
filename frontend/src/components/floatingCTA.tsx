import { motion } from "motion/react"
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";

export function FloatingCTA() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 inset-x-0 flex items-center gap-3 px-4 py-3 glass z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]"
        >
            <Button className="flex-1 bg-surface" variant="outline" asChild>
                {/* @ts-ignore */}
                <Link to="#formulario-contacto">Solicitar Precalificación</Link>
            </Button>
            <Button className="flex-1 bg-sbr-green" asChild>
                {/* @ts-ignore */}
                <Link to="#formulario-cita">Agendar Cita</Link>
            </Button>
        </motion.div>
    );
}
