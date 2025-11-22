import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// FIX: Switching to direct relative imports since absolute paths (@/) failed to resolve
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { toast } from "sonner";
import {
    Users,
    Mail,
    Loader2,
    Package,
    Settings,
    ShoppingCart,
    Truck,
    LogOut,
    Palette, // ✨ NEW: Icon for color picker
    User, // ✨ NEW: Icon for team members
} from "lucide-react";
import { Separator } from "../components/ui/separator"; // ✨ NEW: For dividing list items
import { useBranding } from "@/context/BrandingContext";

// ✨ NEW: Define a type for team members
type TeamMember = {
    email: string;
    role: string;
};

const TeamManagement = () => {
    const navigate = useNavigate();
    const [emailToInvite, setEmailToInvite] = useState("");
    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState("DuckInventory");

    // ✨ NEW STATE: For team list and company data
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    // ✨ UPDATED: Use Maroon/Gold as initial defaults
    const [primaryColor, setPrimaryColor] = useState("#800000"); // Maroon
    const [accentColor, setAccentColor] = useState("#FFD700"); // Gold
    const [colorLoading, setColorLoading] = useState(false);


    // Fetch all company and team data on load
    useEffect(() => {
        fetchCompanyAndTeamData();
    }, []);

    const fetchCompanyAndTeamData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/");
                return;
            }

            // 1. Get current user's profile and company ID
            // ✨ USE .maybeSingle() for safety, like Auth.tsx
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("company_id")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            // ✨ CRUCIAL CHECK: Ensure profile and company_id exist before proceeding
            if (!profile || !profile.company_id) {
                toast.error("Could not find your company profile.");
                navigate("/"); // No company, send back to safety
                return;
            }

            const currentCompanyId = profile.company_id;
            setCompanyId(currentCompanyId); // Save company ID for later

            // 2. Fetch Company details (name, colors) and Team Members in parallel
            const [companyRes, teamRes] = await Promise.all([
                supabase
                    .from("companies")
                    .select("name, primary_color, accent_color")
                    .eq("id", currentCompanyId)
                    .maybeSingle(), // ✨ USE .maybeSingle() for safety
                supabase
                    .from("profiles")
                    .select("email, role")
                    .eq("company_id", currentCompanyId)
            ]);

            // 3. Check for errors from parallel fetches
            if (companyRes.error) throw companyRes.error;
            if (teamRes.error) throw teamRes.error;

            // 4. ✨ SAFELY SET DATA: Check if data is not null before accessing
            if (companyRes.data) {
                setCompanyName(companyRes.data.name || "DuckInventory");
                setPrimaryColor(companyRes.data.primary_color || '#800000');
                setAccentColor(companyRes.data.accent_color || '#FFD700');
            } else {
                // Handle case where company is found in profile but not in companies table
                toast.error("Failed to load company branding details.");
            }

            if (teamRes.data) {
                setTeamMembers(teamRes.data as TeamMember[]);
            }

        } catch (error: any) {
            console.error("Error fetching data:", error);
            toast.error(error.message || "Failed to load company data.");
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        navigate("/");
    };

    // --- Core Logic: Call the Supabase Edge Function ---
    const handleInvite = async (e: React.FormEvent) => { // Added type for event
        e.preventDefault();
        setLoading(true);

        if (!emailToInvite) {
            toast.error("Please enter an email address.");
            setLoading(false);
            return;
        }

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) throw new Error("User session not found.");
            const token = sessionData.session.access_token;

            const response = await fetch('https://sseafesutfqctttpefia.supabase.co/functions/v1/handle_new_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ emailToInvite, companyName }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error || "Failed to send invitation. Check server logs.");
            }

            toast.success(`Invitation sent successfully to ${emailToInvite}`);
            setEmailToInvite("");

            // ✨ NEW: Refresh the team list after a successful invite
            fetchCompanyAndTeamData();

        } catch (error: any) {
            console.error("Invite Error:", error);
            toast.error(error.message || "Failed to send invitation.");
        } finally {
            setLoading(false);
        }
    };

    // ✨ NEW: Handler to save the updated colors
    const handleColorSave = async () => {
        if (!companyId) return;

        setColorLoading(true);
        const { reloadBranding } = useBranding();
        try {
            const { error } = await supabase
                .from("companies")
                .update({
                    primary_color: primaryColor,
                    accent_color: accentColor
                })
                .eq("id", companyId);
            reloadBranding()

            if (error) throw error;
            toast.success("Company colors updated!");

        } catch (error: any) {
            console.error("Color Save Error:", error);
            toast.error(error.message || "Failed to save colors.");
        } finally {
            setColorLoading(false);
        }
    };

    return (
        // ✨ NEW: Apply dynamic colors as CSS variables to this component's scope
        <div
            className="min-h-screen bg-background"
            style={{
                '--company-primary': primaryColor,
                '--company-accent': accentColor,
            } as React.CSSProperties}
        >
            {/* Header (Standardized) */}
            <header className="border-b border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* ✨ NEW: Icon background uses dynamic colors */}
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-lg"
                                style={{ background: `linear-gradient(to bottom right, var(--company-primary), var(--company-accent))` }}
                            >
                                <Users className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                {/* ✨ NEW: Header text uses dynamic colors */}
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--company-primary)] via-[var(--company-accent)] to-[var(--company-primary)] bg-clip-text text-transparent">
                                    {companyName}
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    Team Management
                                </p>
                            </div>
                        </div>
                        {/* Navigation Buttons */}
                        <div className="flex gap-3">
                            {/* ... nav buttons ... */}
                            <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
                                <Package className="h-4 w-4" />
                                Inventory
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/orders")} className="gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Orders
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/shipping")} className="gap-2">
                                <Truck className="h-4 w-4" />
                                Shipping
                            </Button>
                            <Button variant="default" onClick={() => navigate("/properties")} className="gap-2 bg-[var(--company-primary)] hover:bg-[var(--company-accent)] text-white">
                                <Settings className="h-4 w-4" />
                                Properties
                            </Button>
                            <Button variant="ghost" onClick={handleLogout} className="gap-2">
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            {/* ✨ NEW: Changed to a 2-column grid for better layout */}
            <main className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* --- COLUMN 1: Team Management --- */}
                    <div className="space-y-8">
                        {/* Invite Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {/* ✨ NEW: Icon uses dynamic color */}
                                    <Mail className="h-6 w-6 text-[var(--company-primary)]" /> Invite New Team Member
                                </CardTitle>
                                <CardDescription>
                                    Send an invitation email to a new user. They will automatically join your company's inventory team.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleInvite} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">User Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="new.user@team.com"
                                            value={emailToInvite}
                                            onChange={(e) => setEmailToInvite(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-[var(--company-primary)] hover:bg-[var(--company-accent)] text-white" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending Invite...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send Invitation
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* ✨ NEW: Team List Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-6 w-6 text-[var(--company-primary)]" /> Current Team
                                </CardTitle>
                                <CardDescription>
                                    A list of all members currently in your company.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {teamMembers.length > 0 ? (
                                        teamMembers.map((member, index) => (
                                            <div key={member.email}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <User className="h-5 w-5 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">{member.email}</p>
                                                            <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {index < teamMembers.length - 1 && <Separator className="mt-4" />}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center">Your team is empty. Send an invite to get started!</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- COLUMN 2: Company Settings --- */}
                    <div className="space-y-8">
                        {/* ✨ NEW: Color Picker Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-6 w-6 text-[var(--company-primary)]" /> Company Branding
                                </CardTitle>
                                <CardDescription>
                                    Choose your company's primary and accent colors.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={(e) => { e.preventDefault(); handleColorSave(); }} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="primaryColor">Primary Color</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="primaryColor"
                                                type="color"
                                                className="w-16 p-1"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                            />
                                            <span className="font-mono text-sm">{primaryColor}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accentColor">Accent Color</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="accentColor"
                                                type="color"
                                                className="w-16 p-1"
                                                value={accentColor}
                                                onChange={(e) => setAccentColor(e.target.value)}
                                            />
                                            <span className="font-mono text-sm">{accentColor}</span>
                                        </div>
                                    </div>
                                    <Button type="submit" variant="outline"
                                        className="w-full bg-[var(--company-primary)] hover:bg-[var(--company-accent)] text-white"
                                        disabled={colorLoading}>
                                        {colorLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving Colors...
                                            </>
                                        ) : (
                                            "Save Colors"
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeamManagement;