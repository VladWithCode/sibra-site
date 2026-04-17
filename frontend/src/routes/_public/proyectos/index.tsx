import { ProjectCard } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProjectsOpts } from '@/queries/projects';
import { queryClient } from '@/queries/queryClient';
import { useUIStore } from '@/stores/uiStore';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'
import { Compass } from 'lucide-react';
import { useEffect } from 'react';

export const Route = createFileRoute('/_public/proyectos/')({
    component: RouteComponent,
    loader: async () => {
        await queryClient.ensureQueryData(getProjectsOpts)
    },
})

function RouteComponent() {
    const { data } = useSuspenseQuery(getProjectsOpts);
    const projects = data.projects;

    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "none" });
    }, []);

    return (
        <main>
            <section className="relative flex items-end overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Architectural perspective of modern development"
                        className="w-full h-full object-cover object-center brightness-75"
                        data-alt="wide angle shot of modern glass skyscrapers reflecting a clear blue sky with architectural symmetry and clean lines"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNDdf3krlI0L-hgyR_7Mwc69FIb9E1nmXqLpTqA3Ke5ftUXjDiPwm4Y5jrgLcf1APU1ktJTWtaCGNguBuIibljk-5jO9RM9xDePwrhiVzwN706LZ65I-RzDtQu7BtKTZS-7vqyR24tdVDmEJm71nUehrHKlzZy0KxqHSOa7oTNz3AsQFIuxmbTgaOFrl9esetGp-ciMF0MssBpJoMggWxtj9VZxQR9G9bAju1E8keBpBguXnlE1t15Y2w3Wm4z3ye05IraUDpVjGk"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                </div>
                <div className="relative z-10 w-full p-6 pt-52 max-w-7xl mx-auto backdrop-blur-xs">
                    <div className="max-w-2xl text-on-primary">
                        {/* <span className="inline-block bg-primary-container/60 text-on-primary px-3 py-1 rounded text-xs uppercase tracking-widest mb-6 backdrop-blur-md border border-primary-container"> */}
                        {/*     Nivel Institucional */}
                        {/* </span> */}
                        <h1 className="text-5xl leading-snug mb-3 tracking-tighter">
                            Construyendo el <br />Futuro del <span className="text-primary-fixed">Suelo Soberano</span>
                        </h1>
                        <p className="text-current/80 leading-relaxed max-w-xl">
                            Portafolios de precisión para el inversor institucional moderno.
                        </p>
                    </div>
                </div>
            </section>
            <section className="bg-surface p-6 py-12">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="text-on-surface md:border-l-4 md:border-sbr-blue-light md:pl-6">
                        <h2 className="flex flex-col gap-3 font-semibold text-4xl tracking-tight leading-none mb-4">
                            <span className="inline-block">Desarrollos Destacados</span>
                            <span className="w-1/6 h-1 bg-sbr-green-light inline-block text-[0px]">decoration</span>
                        </h2>
                        <p className="text-current/60">Adquisiciones estratégicas de terrenos y comunidades planificadas en curso.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {
                            projects.map((project) => (
                                <ProjectCard project={project} key={project.id} />
                            ))
                        }
                        <div className="md:col-span-4 group bg-surface-container-lowest rounded-xl overflow-hidden border-2 border-primary/5">
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-surface-container-low space-y-3">
                                <Compass className="size-8 text-sbr-blue" />
                                <h3 className="font-headline text-xl font-extrabold text-on-surface">Próximos Portafolios</h3>
                                <p className="text-outline text-sm leading-relaxed">Accede primero a conversiones de terreno agrícola a residencial fuera del mercado.</p>
                                <Button
                                    className="bg-sbr-green text-surface px-8 rounded-md font-bold text-sm hover:bg-primary transition-colors"
                                >
                                    Suscribirse a Alertas
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="p-6 py-12 bg-primary-container/5">
                <div className="max-w-5xl mx-auto glass p-6 py-8 rounded-2xl flex flex-col md:flex-row items-center gap-6 border border-white/40 shadow-2xl shadow-primary/5">
                    <div className="flex-1">
                        <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-4 tracking-tight">Mantente a la vanguardia del desarrollo.</h2>
                        <p className="text-on-surface-variant/60">Recibe reportes trimestrales sobre valuación de terrenos y tendencias arquitectónicas emergentes.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <Input
                            className="md:flex-1 md:w-64"
                            placeholder="Correo Institucional"
                            type="email"
                        />
                        <Button
                            className="bg-sbr-green px-8 hover:shadow-lg active:shadow-xs hover:scale-103 active:scale-98 hover:bg-sbr-green-light active:bg-sbr-green"
                        >
                            Enviar
                        </Button>
                    </div>
                </div>
            </section>
        </main >
    );
}
