import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Plus, Trash2, Edit2, Server, Check, 
    ChevronsUpDown, Search, Loader2, 
    List as ListIcon, Filter, LogOut,
    MoreVertical, Globe, ShieldCheck, LayoutGrid,
    Eye, EyeOff, Download, Upload, FileJson
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	icon: string;
	group: string;
	order: number;
	public: boolean;
	auth_required: boolean;
}

function ServiceCard({ 
    service, 
    viewMode, 
    isSelected, 
    onToggleSelect, 
    onEdit, 
    onDelete 
}: { 
    service: Service, 
    viewMode: 'grid' | 'list', 
    isSelected: boolean,
    onToggleSelect: () => void,
    onEdit: () => void,
    onDelete: () => void
}) {
    const s = service;
    return (
        <Card className={cn(isSelected && "border-primary")}>
            <CardContent className={cn(
                "p-4",
                viewMode === 'list' && "flex items-center gap-4 p-3"
            )}>
                {viewMode === 'grid' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="size-12 rounded border flex items-center justify-center relative overflow-hidden bg-muted group/logo">
                                {s.icon && (
                                    <div 
                                        className="absolute inset-0 opacity-20 blur-md scale-150 transition-transform group-hover/logo:scale-[2]"
                                        style={{ 
                                            backgroundImage: `url(${s.icon})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    />
                                )}
                                {s.icon ? (
                                    <img src={s.icon} alt={s.name} className="relative z-10 max-w-[70%] max-h-[70%] object-contain drop-shadow-sm" />
                                ) : (
                                    <Server size={24} className="relative z-10 text-muted-foreground" />
                                )}
                            </div>
                            <Checkbox 
                                checked={isSelected} 
                                onCheckedChange={onToggleSelect}
                            />
                        </div>
                        
                        <div>
                            <h3 className="font-bold truncate">{s.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{s.url}</p>
                        </div>

                        <div className="flex gap-2">
                            {s.public && <Badge variant="outline">Public</Badge>}
                            {s.auth_required && <Badge variant="outline">Secured</Badge>}
                        </div>

                        <div className="flex gap-2">
                            <Button className="flex-1" variant="outline" size="sm" onClick={onEdit}>
                                <Edit2 size={14} className="mr-1" /> Edit
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8">
                                        <MoreVertical size={14} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => window.open(s.url, '_blank')}>
                                        Launch
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                )}

                {viewMode === 'list' && (
                    <div className="flex items-center gap-4 w-full">
                        <Checkbox 
                            checked={isSelected} 
                            onCheckedChange={onToggleSelect}
                        />
                        <div className="size-10 rounded border flex items-center justify-center relative overflow-hidden bg-muted group/logo">
                            {s.icon && (
                                <div 
                                    className="absolute inset-0 opacity-20 blur-md scale-150 transition-transform group-hover/logo:scale-[2]"
                                    style={{ 
                                        backgroundImage: `url(${s.icon})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                />
                            )}
                            {s.icon ? (
                                <img src={s.icon} alt={s.name} className="relative z-10 max-w-[70%] max-h-[70%] object-contain drop-shadow-sm" />
                            ) : (
                                <Server size={18} className="relative z-10 text-muted-foreground" />
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="font-bold truncate">{s.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{s.url}</div>
                        </div>
                        <div className="flex gap-2">
                            {s.public && <Badge variant="outline" className="hidden sm:inline-flex">Public</Badge>}
                            {s.auth_required && <Badge variant="outline" className="hidden sm:inline-flex">Secured</Badge>}
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
                                <Edit2 size={14} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete}>
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
	const [services, setServices] = useState<Service[]>([]);
	const [groups, setGroups] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Service>>({});
    const [filterGroup, setFilterGroup] = useState<string | "all">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">(
        (localStorage.getItem("admin_view_mode") as "grid" | "list") || "list"
    );
    const [showStats, setShowStats] = useState<boolean>(
        localStorage.getItem("admin_show_stats") !== "false"
    );
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        localStorage.setItem("admin_view_mode", viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem("admin_show_stats", showStats.toString());
    }, [showStats]);
    
    // Combobox & Search States
    const [groupPopoverOpen, setGroupPopoverOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [foundIcons, setFoundIcons] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchServices = async () => {
        setLoading(true);
		const res = await fetch("/api/services");
		const data = await res.json();
		setServices(data || []);
		setLoading(false);
	};

	const fetchGroups = async () => {
		const res = await fetch("/api/groups");
		const data = await res.json();
		setGroups(data || []);
	};

	useEffect(() => { 
        fetchServices();
        fetchGroups();
    }, []);

    const searchIcons = async () => {
        if (!formData.url) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/icons/search?url=${encodeURIComponent(formData.url)}`);
            const data = await res.json();
            setFoundIcons(data || []);
        } catch (err) {
            toast.error("Failed to find icons");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectRemoteIcon = async (url: string) => {
        setIsDownloading(true);
        try {
            const res = await fetch("/api/icons/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            setFormData({ ...formData, icon: data.path });
            toast.success("Icon downloaded and set");
        } catch (err) {
            toast.error("Failed to download icon");
        } finally {
            setIsDownloading(false);
        }
    };


    const handleSave = async (id?: string) => {
        const method = id ? "PUT" : "POST";
        const url = id ? `/api/services/${id}` : "/api/services";
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            const savedService = await res.json();
            toast.success(id ? "Service updated" : "Service created");
            
            setServices(prev => {
                const index = prev.findIndex(s => s.id === (id || savedService.id));
                if (index !== -1) {
                    const next = [...prev];
                    next[index] = savedService;
                    return next;
                }
                return [...prev, savedService];
            });

            setEditing(null);
            setFormData({});
            fetchGroups(); // Still fetch groups as they might have changed
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;
        const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Service deleted");
            setServices(prev => prev.filter(s => s.id !== id));
            fetchGroups();
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} services?`)) return;
        
        const promises = Array.from(selectedIds).map(id => 
            fetch(`/api/services/${id}`, { method: "DELETE" })
        );
        
        await Promise.all(promises);
        toast.success("Services deleted");
        setSelectedIds(new Set());
        fetchServices();
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const filteredServices = services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.group.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGroup = filterGroup === "all" || s.group === filterGroup;
        return matchesSearch && matchesGroup;
    });

    const groups_record: Record<string, Service[]> = {};
    filteredServices.forEach(s => {
        if (!groups_record[s.group]) groups_record[s.group] = [];
        groups_record[s.group].push(s);
    });
    const groupedServices = groups_record;

    const handleExport = () => {
        const data = JSON.stringify(services, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nexus-services-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Services exported");
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const importedServices = JSON.parse(content);
                
                if (!Array.isArray(importedServices)) {
                    throw new Error("Invalid format: expected an array of services");
                }

                const res = await fetch("/api/services/bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: content,
                });

                if (res.ok) {
                    toast.success("Services imported successfully");
                    fetchServices();
                    fetchGroups();
                } else {
                    toast.error("Failed to import services");
                }
            } catch (err) {
                toast.error("Failed to parse import file");
                console.error(err);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = "";
    };

    const stats = {
        total: services.length,
        public: services.filter(s => s.public).length,
        auth: services.filter(s => s.auth_required).length,
        groups: new Set(services.map(s => s.group)).size,
    };

	return (
		<div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 px-4 md:px-8 pb-16">
			<div className="container mx-auto py-6">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold">Admin Dashboard</h1>
					<div className="flex gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => setShowStats(!showStats)}>
                                    {showStats ? <EyeOff size={18} /> : <Eye size={18} />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {showStats ? "Hide Statistics" : "Show Statistics"}
                            </TooltipContent>
                        </Tooltip>
						<DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <FileJson size={18} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" /> Export JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" /> Import JSON
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: "none" }} 
                            accept=".json" 
                            onChange={handleImport} 
                        />
						<Button onClick={() => { setEditing("new"); setFormData({ public: true }); }}>
							<Plus className="mr-2 h-4 w-4" /> Add Service
						</Button>
						<Button variant="outline" onClick={onLogout}>
							<LogOut className="h-4 w-4 mr-2" /> Logout
						</Button>
					</div>
				</div>

                {showStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <Server className="h-4 w-4" />
                                    <span className="text-sm font-medium">Total Services</span>
                                </div>
                                <div className="text-2xl font-bold">{stats.total}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <Globe className="h-4 w-4" />
                                    <span className="text-sm font-medium">Public</span>
                                </div>
                                <div className="text-2xl font-bold">{stats.public}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-sm font-medium">Secured</span>
                                </div>
                                <div className="text-2xl font-bold">{stats.auth}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <LayoutGrid className="h-4 w-4" />
                                    <span className="text-sm font-medium">Groups</span>
                                </div>
                                <div className="text-2xl font-bold">{stats.groups}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 flex gap-2">
                        <Input 
                            placeholder="Search services..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-xs"
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    {filterGroup === 'all' ? 'All Groups' : filterGroup}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0">
                                <Command>
                                    <CommandInput placeholder="Filter group..." />
                                    <CommandList>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => setFilterGroup("all")}>All Groups</CommandItem>
                                            {groups.map(g => (
                                                <CommandItem key={g} onSelect={() => setFilterGroup(g)}>{g}</CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete ({selectedIds.size})
                            </Button>
                        )}
                        <div className="flex border rounded-md">
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="rounded-r-none"
                                onClick={() => setViewMode('list')}
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="rounded-l-none"
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin h-8 w-8 mb-4" />
                        <p className="text-muted-foreground">Loading services...</p>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="text-center py-20 border rounded-lg">
                        <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">No services found</h3>
                        <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedServices).map(([group, filteredGroupServices]) => (
                            <div key={group} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-lg font-bold">{group}</h2>
                                    <div className="flex-1 h-px bg-border" />
                                </div>

                                <div className={cn(
                                    "grid gap-4",
                                    viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                                )}>
                                    {filteredGroupServices.map(s => (
                                        <ServiceCard 
                                            key={s.id}
                                            service={s}
                                            viewMode={viewMode}
                                            isSelected={selectedIds.has(s.id)}
                                            onToggleSelect={() => toggleSelect(s.id)}
                                            onEdit={() => { setEditing(s.id); setFormData(s); }}
                                            onDelete={() => handleDelete(s.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editing === 'new' ? 'Add Service' : 'Edit Service'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="url">URL</Label>
                            <div className="flex gap-2">
                                <Input id="url" value={formData.url || ''} onChange={e => setFormData({...formData, url: e.target.value})} />
                                <Button variant="outline" size="icon" disabled={!formData.url || isSearching} onClick={searchIcons}>
                                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {foundIcons.length > 0 && (
                            <div className="grid grid-cols-5 gap-2 border p-2 rounded-md">
                                {foundIcons.map((icon, i) => (
                                    <button
                                        key={i}
                                        className="size-10 rounded border hover:border-primary flex items-center justify-center p-1 bg-muted/50"
                                        onClick={() => handleSelectRemoteIcon(icon)}
                                    >
                                        <img src={icon} alt={`Icon ${i}`} className="max-w-full max-h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Icon Path</Label>
                        </div>
                            <Input value={formData.icon || ''} onChange={e => setFormData({...formData, icon: e.target.value})} placeholder="https://..." />

                        <div className="grid gap-2">
                            <Label>Group</Label>
                            <Popover open={groupPopoverOpen} onOpenChange={setGroupPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="justify-between">
                                        {formData.group || "Select group..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search group..." value={searchValue} onValueChange={setSearchValue} />
                                        <CommandList>
                                            <CommandEmpty>
                                                <Button variant="ghost" className="w-full justify-start text-xs" onClick={() => { setFormData({ ...formData, group: searchValue }); setGroupPopoverOpen(false); }}>
                                                    <Plus className="mr-2 h-3 w-3" /> Create "{searchValue}"
                                                </Button>
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {groups.map((g) => (
                                                    <CommandItem key={g} value={g} onSelect={(val) => { setFormData({ ...formData, group: val }); setGroupPopoverOpen(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", formData.group === g ? "opacity-100" : "opacity-0")} />
                                                        {g}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid gap-2 pt-2">
                            <Label>Visibility & Access</Label>
                            <RadioGroup 
                                value={formData.public ? (formData.auth_required ? "secured" : "public") : "private"}
                                onValueChange={(val) => {
                                    if (val === "public") setFormData({...formData, public: true, auth_required: false});
                                    if (val === "secured") setFormData({...formData, public: true, auth_required: true});
                                    if (val === "private") setFormData({...formData, public: false, auth_required: true});
                                }}
                                className="flex flex-col space-y-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="public" id="public" />
                                    <Label htmlFor="public" className="font-normal cursor-pointer">
                                        <span className="font-bold">Public</span> — Visible to everyone, no login required.
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="secured" id="secured" />
                                    <Label htmlFor="secured" className="font-normal cursor-pointer">
                                        <span className="font-bold">Secured</span> — Visible to everyone, but requires Nexus login.
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="private" id="private" />
                                    <Label htmlFor="private" className="font-normal cursor-pointer">
                                        <span className="font-bold">Private</span> — Only visible to administrators in this dashboard.
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button onClick={() => handleSave(editing === 'new' ? undefined : editing ?? undefined)} disabled={isDownloading}>
                            {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
		</div>
	);
}
