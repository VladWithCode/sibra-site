import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export function DashboardBreadcrumbs() {
    const items = useBreadcrumbs();

    if (items.length <= 1) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {items.map((item, index) => (
                    <Fragment key={`${item.label}-${index}`}>
                        <BreadcrumbItem>
                            {item.isCurrent ? (
                                <BreadcrumbPage className="capitalize">{item.label}</BreadcrumbPage>
                            ) : item.to ? (
                                <BreadcrumbLink asChild>
                                    <Link
                                        to={item.to}
                                        params={item.params}
                                        className="hover:text-foreground transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </BreadcrumbLink>
                            ) : (
                                <span>{item.label}</span>
                            )}
                        </BreadcrumbItem>
                        {index < items.length - 1 && (
                            <BreadcrumbSeparator />
                        )}
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
