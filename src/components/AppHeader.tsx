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
    PanelLeftOpen,
    ChartColumnBig
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

    return (
        <header className="border-b border-border bg-card shadow-[var(--shadow-soft)]">
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between">

                    <div className="flex-shrink-0">
                        <h1
                            className="text-2xl font-bold bg-clip-text text-transparent"
                            style={{
                                backgroundImage: `linear-gradient(to right, var(--company-primary), var(--company-accent), var(--company-primary))`,
                            }}
                        >
                            {companyName} {pageTitle}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {pageSubtitle}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">

                        <div
                            className="group relative flex items-center gap-1 rounded-full py-3 px-2 transition-all duration-300 bg-background hover:bg-muted"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="flex-shrink-0 rounded-full"
                            >
                                <PanelLeftOpen
                                    className="h-5 w-5"
                                    style={{ color: primaryColor }}
                                />
                            </Button>

                            <div
                                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3 pr-1 py-4 pl-4 
                           w-0 opacity-0 group-hover:w-max group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden 
                           bg-background group-hover:bg-muted rounded-full z-10"
                            >
                                {navItems.map((item) => (
                                    <Button
                                        key={item.key}
                                        variant={activePage === item.key ? "secondary" : "outline"}
                                        onClick={() => navigate(item.path)}
                                        className="gap-2 flex-shrink-0"
                                    >
                                        <item.icon
                                            className="h-4 w-4"
                                            style={{ color: primaryColor }}
                                        />
                                        {item.label}
                                    </Button>
                                ))}
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="gap-2 flex-shrink-0"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </Button>
                                <div className="w-14 flex-shrink-0"></div>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};