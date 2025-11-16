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
    LogOut
} from "lucide-react";

const TeamManagement = () => {
    const navigate = useNavigate();
    const [emailToInvite, setEmailToInvite] = useState("");
    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState("DuckInventory");

    // Authentication check and profile fetch (similar to Dashboard)
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/");
                return;
            }

            // Fetch company name from user metadata or profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("company_id")
                .eq("id", user.id)
                .single();

            if (profile) {
                const { data: company } = await supabase
                    .from("companies")
                    .select("name")
                    .eq("id", profile.company_id)
                    .single();

                if (company) {
                    setCompanyName(company.name);
                }
            }

            // Note: In a real app, you would check the user's 'role' here and redirect if they are not 'admin'.
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Failed to load user profile.");
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
            // 1. Get the current user's JWT
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) throw new Error("User session not found.");
            const token = sessionData.session.access_token;

            // 2. Call the Edge Function using the fetch API
            // Using the user-provided endpoint 'handle_new_user'.
            const response = await fetch('https://sseafesutfqctttpefia.supabase.co/functions/v1/handle_new_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Pass the JWT for authentication/authorization
                },
                body: JSON.stringify({ emailToInvite, companyName }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                // If the response failed, log the full error from the Edge Function
                console.error("Edge Function Error Response:", result);
                throw new Error(result.error || "Failed to send invitation. Check server logs.");
            }

            toast.success(`Invitation sent successfully to ${emailToInvite}`);
            setEmailToInvite("");
        } catch (error: any) { // Added 'any' type
            console.error("Invite Error:", error);
            toast.error(error.message || "Failed to send invitation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header (Standardized) */}
            <header className="border-b border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                                <Users className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                                    {companyName}
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    Team Management
                                </p>
                            </div>
                        </div>
                        {/* Navigation Buttons */}
                        <div className="flex gap-3">
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
                            <Button variant="default" onClick={() => navigate("/properties")} className="gap-2">
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
            <main className="container mx-auto px-4 py-12">
                <Card className="max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-6 w-6 text-primary" /> Invite New Team Member
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
                            <Button type="submit" className="w-full" disabled={loading}>
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
            </main>
        </div>
    );
};

export default TeamManagement;