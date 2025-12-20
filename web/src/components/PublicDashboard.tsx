import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, LogIn, Search, LayoutGrid, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Service {
	id: string;
	name: string;
	url: string;
	description: string;
	icon: string;
	group: string;
    public: boolean;
	auth_required: boolean;
}

export function PublicDashboard() {
	const [services, setServices] = useState<Service[]>([]);
	const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">(
        (localStorage.getItem("public_view_mode") as "grid" | "list") || "grid"
    );

    useEffect(() => {
        localStorage.setItem("public_view_mode", viewMode);
    }, [viewMode]);

	useEffect(() => {
		fetch("/api/services")
			.then(res => res.json())
			.then(data => {
                const isLoggedIn = !!localStorage.getItem("nexus_user");
                const publicServices = data?.filter((s: Service) => {
                    if (!s.public) return false;
                    // If secured, only show if logged in
                    if (s.auth_required && !isLoggedIn) return false;
                    return true;
                }) || [];
                setServices(publicServices);
            })
			.finally(() => setLoading(false));
	}, []);

    const filteredServices = services.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.group.toLowerCase().includes(search.toLowerCase())
    );

    const groupedServices_record: Record<string, Service[]> = {};
    filteredServices.forEach(s => {
        if (!groupedServices_record[s.group]) groupedServices_record[s.group] = [];
        groupedServices_record[s.group].push(s);
    });
    const groupedServices = groupedServices_record;

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto flex h-14 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<Server className="h-6 w-6 text-primary" />
						<span className="font-bold text-xl">Nexus</span>
					</div>

					<div className="flex-1 max-w-sm mx-4">
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search services..."
								className="pl-8 h-9"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					</div>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button asChild variant="outline" size="sm">
								<Link to="/auth">
									<LogIn className="mr-2 h-4 w-4" />
									Login
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Admin Portal</TooltipContent>
					</Tooltip>

                    <div className="flex border rounded-md ml-2 h-9 items-center overflow-hidden">
                        <Button 
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="rounded-none h-full"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="rounded-none h-full"
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon className="h-4 w-4" />
                        </Button>
                    </div>
				</div>
			</header>

			<main className="container mx-auto flex-1 p-4 md:p-6">
				{loading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{[1, 2, 3, 4].map(i => (
							<div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
						))}
					</div>
				) : filteredServices.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-64 border rounded-lg border-dashed">
						<Search className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
						<h3 className="text-lg font-medium">No services found</h3>
						<p className="text-muted-foreground">Try a different search term.</p>
					</div>
				) : (
					<div className="space-y-6">
						{Object.entries(groupedServices).map(([group, groupServices]) => (
							<div key={group} className="space-y-4">
								<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
									{group}
									<Badge variant="secondary" className="ml-2 font-mono">{groupServices.length}</Badge>
								</h3>
								<div className={cn(
                                    "grid gap-4",
                                    viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1"
                                )}>
									{groupServices.map((service) => (
										<a
											key={service.id}
											href={service.url}
											target="_blank"
											rel="noreferrer"
											className="block"
										>
											<Card className="h-full hover:border-primary transition-colors">
												<CardHeader className={cn(
                                                    "p-4 flex gap-4",
                                                    viewMode === 'grid' ? "flex-row items-center" : "flex-row items-center"
                                                )}>
													<div className={cn(
                                                        "shrink-0 flex items-center justify-center rounded border bg-muted relative overflow-hidden group/logo",
                                                        viewMode === 'grid' ? "h-12 w-12" : "h-14 w-14"
                                                    )}>
                                                        {service.icon && (
                                                            <div 
                                                                className="absolute inset-0 opacity-20 blur-md scale-150 transition-transform group-hover/logo:scale-[2]"
                                                                style={{ 
                                                                    backgroundImage: `url(${service.icon})`,
                                                                    backgroundSize: 'cover',
                                                                    backgroundPosition: 'center'
                                                                }}
                                                            />
                                                        )}
														{service.icon ? (
															<img src={service.icon} alt={service.name} className="relative z-10 max-w-[70%] max-h-[70%] object-contain drop-shadow-sm" />
														) : (
															<Server className="relative z-10 h-6 w-6 text-muted-foreground" />
														)}
													</div>
													<div className="min-w-0 flex-1">
														<CardTitle className="text-sm font-bold truncate">{service.name}</CardTitle>
														{service.auth_required && (
															<Badge variant="outline" className="text-[10px] h-4 px-1 mt-1">
																SECURED
															</Badge>
														)}
                                                        {viewMode === 'list' && (
                                                            <p className="text-xs text-muted-foreground truncate mt-1">{service.url}</p>
                                                        )}
													</div>
												</CardHeader>
											</Card>
										</a>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
