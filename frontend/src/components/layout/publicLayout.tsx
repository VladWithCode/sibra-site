import { useUIStore } from "@/stores/uiStore";
import { Footer } from "../footer";
import { Header, HeaderSidebar } from "../header";
import { cn } from "@/lib/utils";

export function PublicLayout({ children }: {} & React.PropsWithChildren) {
    const { headerFloating } = useUIStore();

    return (
        <>
            <div className="xl:hidden">
                <HeaderSidebar />
            </div>
            <div
                id="main-content"
                className={cn(
                    "relative h-screen w-screen grid grid-cols-1 z-0 overflow-x-hidden overflow-y-auto",
                    headerFloating ? "grid-rows-[1fr_auto]" : "grid-rows-[auto_1fr_auto]",
                )}
            >
                <Header />
                {children}
                <Footer />
            </div>
        </>
    );
}
