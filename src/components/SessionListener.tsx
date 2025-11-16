// SessionListener.tsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

const SessionListener = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // 1. Check if the URL fragment contains the tokens (i.e., this is a redirect from Supabase)
        if (window.location.hash.includes('access_token')) {

            // 2. Supabase client processes the hash and attempts to set the session
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    // 3. Session is active! User has successfully accepted the invite.

                    // Only navigate away if they are not already on the SetPassword page
                    if (location.pathname !== "/set-password") {
                        toast.success("Invitation accepted! Please set your password.");
                        navigate("/set-password", { replace: true });
                    }

                    // 4. Clean up the URL fragment after processing
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }).catch(error => {
                console.error("Error processing invite session:", error);
                toast.error("Failed to process invite. Please try logging in.");
                window.history.replaceState(null, '', window.location.pathname);
            });
        }
    }, [navigate, location.pathname]);

    return <>{children}</>;
};

export default SessionListener;