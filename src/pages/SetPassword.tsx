import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Switching to direct relative imports since absolute paths (@/) failed to resolve
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock, UserCheck } from "lucide-react";

// Assuming you have components like Input and Button
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const SetPassword = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handlePasswordSet = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        try {
            // 🚨 Core Action: Use updateUser to set the password.
            // This works because the user is authenticated from the invite link.
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                console.error("Password update error:", error);
                // Note: Errors here often mean the session expired or user isn't logged in.
                toast.error(error.message || "Failed to set password. Please try again.");
            } else {
                toast.success("Welcome to the team! Your password is set.");

                // Navigate to the main application area
                navigate("/dashboard", { replace: true });
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            toast.error("An unexpected error occurred during setup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold flex items-center gap-3">
                        <UserCheck className="h-6 w-6 text-primary" />
                        Finalize Account
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-6">
                        You have successfully accepted the invitation. Please set a password to complete your account setup.
                    </p>
                    <form onSubmit={handlePasswordSet} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="password-input" className="text-sm font-medium">New Password</label>
                            <Input
                                id="password-input"
                                type="password"
                                placeholder="Enter a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full gap-2"
                            disabled={loading || password.length < 6}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4" />
                                    Set Password & Continue
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SetPassword;