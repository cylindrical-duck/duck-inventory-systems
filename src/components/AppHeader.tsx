import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Package,
    LogOut,
    Settings,
    Truck,
    TrendingUp,
    UsersRound,
    Users,
    Menu,
    X,
    ChartColumnBig,
    ChevronRight
} from "lucide-react";
import { useBranding } from "../context/BrandingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppHeaderProps {
    companyName: string;
    pageTitle: string;
    pageSubtitle: string;
    activePage: "inventory" | "orders" | "customers" | "shipping" | "properties" | "team" | "reports";
    children?: React.ReactNode;
}

export const AppHeader = ({
    companyName,
    pageTitle,
    pageSubtitle,
    activePage,
    children,
}: AppHeaderProps) => {
    const navigate = useNavigate();
    const { primaryColor } = useBranding();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Handle scroll effect for the top bar transparency/blur
    // useEffect(() => {
    //     const handleScroll = () => {
    //         setIsScrolled(window.scrollY > 10);
    //     };
    //     window.addEventListener("scroll", handleScroll);
    //     return () => window.removeEventListener("scroll", handleScroll);
    // }, []);

    useEffect(() => {
        let last = window.scrollY;

        const handleScroll = () => {
            const y = window.scrollY;

            if (!isScrolled && y > 40) setIsScrolled(true);       // scroll down buffer
            else if (isScrolled && y < 10) setIsScrolled(false);  // scroll up buffer

            last = y;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isScrolled]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        navigate("/");
    };

    const navItems = [
        { key: "inventory", label: "Inventory", icon: Package, path: "/dashboard" },
        { key: "orders", label: "Orders", icon: TrendingUp, path: "/orders" },
        { key: "customers", label: "Customers", icon: Users, path: "/customers" },
        { key: "shipping", label: "Shipping", icon: Truck, path: "/shipping" },
        { key: "properties", label: "Properties", icon: Settings, path: "/properties" },
        { key: "team", label: "Team", icon: UsersRound, path: "/teammanagement" },
        { key: "reports", label: "Reports", icon: ChartColumnBig, path: "/reports" },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <>
            {/* --- TOP HEADER BAR --- */}
            <header
                className={`sticky top-0 z-40 transition-all duration-300 border-b ${isScrolled
                    ? "bg-background/80 backdrop-blur-md border-border shadow-sm py-3"
                    : "bg-background border-transparent py-5"
                    }`}
            >
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Menu Trigger Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMenu}
                            className="hover:bg-accent hover:text-accent-foreground rounded-full"
                        >
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Open menu</span>
                        </Button>

                        {/* Breadcrumb / Title Area */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                                    {companyName}
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                                <h1
                                    className="text-xl font-bold tracking-tight bg-clip-text text-transparent"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, var(--company-primary), var(--company-accent), var(--company-primary))`,
                                    }}
                                >
                                    {pageTitle}
                                </h1>
                            </div>
                            {!isScrolled && (
                                <p
                                    className={`text-xs text-muted-foreground hidden md:block transition-all duration-300 ${isScrolled ? "opacity-0 translate-y-1 h-0 overflow-hidden" : "opacity-100 translate-y-0 h-auto"
                                        }`}
                                >
                                    {pageSubtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Side Actions (Children) */}
                    <div className="flex items-center gap-3">
                        {children}
                    </div>
                </div>
            </header>

            {/* --- NAVIGATION DRAWER (SIDE PANEL) --- */}

            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setIsMenuOpen(false)}
            />

            {/* Slide-out Panel */}
            <aside
                className={`fixed top-0 left-0 bottom-0 w-[280px] bg-card border-r border-border z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Drawer Header */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <span
                        className="text-lg font-bold"
                        style={{ color: primaryColor }}
                    >
                        Navigation
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMenuOpen(false)}
                        className="rounded-full h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = activePage === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => {
                                    navigate(item.path);
                                    setIsMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group relative overflow-hidden ${isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    }`}
                            >
                                {/* Active Indicator Bar */}
                                {isActive && (
                                    <span
                                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                                        style={{ backgroundColor: primaryColor }}
                                    />
                                )}

                                <item.icon
                                    className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        }`}
                                    style={isActive ? { color: primaryColor } : {}}
                                />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-border bg-muted/20">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                        <LogOut className="h-5 w-5" />
                        Log Out
                    </Button>
                </div>
            </aside>
        </>
    );
};