import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../integrations/supabase/client"; // Adjust path as needed
import { toast } from "sonner";

const AuthCallbackHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase client automatically parses the tokens in the URL fragment (#...) 
        // and attempts to establish a session when the page loads.

        const checkSession = async () => {
            try {
                // Get the current session, which should be set if the user clicked the invite link
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    // 1. User is successfully logged in (session is active)
                    toast.success("Welcome! Please set your password to finalize your account.");

                    // 2. Redirect to the dedicated password creation page
                    navigate("/set-password");
                } else {
                    // This case handles users who land here without valid tokens (e.g., direct navigation)
                    console.log("No active session found on callback.");
                    navigate("/"); // Send them to the home page or login
                }
            } catch (error) {
                console.error("Error checking session:", error);
                toast.error("An error occurred during sign-in.");
                navigate("/");
            }
        };

        checkSession();

        // Cleanup the URL to remove tokens, improving security and aesthetics
        if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
        }

    }, [navigate]);

    // Display a simple message while processing
    return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-lg">Finalizing your invitation...</p>
        </div>
    );
};

export default AuthCallbackHandler;