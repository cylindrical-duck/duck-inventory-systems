import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";

interface BrandingContextType {
    primaryColor: string;
    accentColor: string;
    setPrimaryColor: (c: string) => void;
    setAccentColor: (c: string) => void;
    reloadBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
    const ctx = useContext(BrandingContext);
    if (!ctx) throw new Error("useBranding must be used inside BrandingProvider");
    return ctx;
};

export const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
    const [primaryColor, setPrimaryColor] = useState("#800000"); // default Maroon
    const [accentColor, setAccentColor] = useState("#FFD700");   // default Gold

    // 🔥 Automatically inject CSS variables into :root
    const applyColorsToCSS = (primary: string, accent: string) => {
        const root = document.documentElement;
        root.style.setProperty("--company-primary", primary);
        root.style.setProperty("--company-accent", accent);
    };

    // 🚀 Loads branding from Supabase
    const reloadBranding = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("company_id")
                .eq("id", user.id)
                .maybeSingle();

            if (!profile?.company_id) return;

            const { data: company } = await supabase
                .from("companies")
                .select("primary_color, accent_color")
                .eq("id", profile.company_id)
                .maybeSingle();

            if (company) {
                setPrimaryColor(company.primary_color ?? "#800000");
                setAccentColor(company.accent_color ?? "#FFD700");

                applyColorsToCSS(
                    company.primary_color ?? "#800000",
                    company.accent_color ?? "#FFD700"
                );
            }
        } catch (err) {
            console.error("Branding load failed", err);
        }
    };

    // Load branding on initial render
    useEffect(() => {
        reloadBranding();
    }, []);

    // Whenever React state changes → update CSS variables too
    useEffect(() => {
        applyColorsToCSS(primaryColor, accentColor);
    }, [primaryColor, accentColor]);

    return (
        <BrandingContext.Provider
            value={{
                primaryColor,
                accentColor,
                setPrimaryColor,
                setAccentColor,
                reloadBranding
            }}
        >
            {children}
        </BrandingContext.Provider>
    );
};
