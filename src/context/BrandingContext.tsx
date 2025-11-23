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
    const [accentColor, setAccentColor] = useState("#D3AF37");   // default Gold

    const applyColorsToCSS = (primary: string, accent: string) => {
        const root = document.documentElement;

        // Convert hex to HSL component strings
        const primaryHSL = hexToHSLComponents(primary);
        const accentHSL = hexToHSLComponents(accent);

        // Set the variables that index.css (shadcn/ui) uses
        root.style.setProperty("--primary", primaryHSL);
        root.style.setProperty("--accent", accentHSL);

        // --- THIS IS THE FIX FOR THE OUTLINE ---
        // Set the --ring variable to your accent color
        root.style.setProperty("--ring", accentHSL);

        // We can keep your original variables too, just in case
        root.style.setProperty("--company-primary", primary);
        root.style.setProperty("--company-accent", accent);
    };

    /**
 * Converts a hex color string to an HSL component string.
 * e.g., "#800000" -> "0 100% 25%"
 */
    function hexToHSLComponents(hex: string): string {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0;
        let l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);

        return `${h} ${s}% ${l}%`;
    }

    // Loads branding from Supabase
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
                setPrimaryColor(company.primary_color);
                setAccentColor(company.accent_color);

                applyColorsToCSS(
                    company.primary_color,
                    company.accent_color
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
