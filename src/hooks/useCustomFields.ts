import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
  field_order: number;
}

export const useCustomFields = (companyId: string | null, tableName: "inventory_items" | "orders") => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchFields();
    }
  }, [companyId, tableName]);

  const fetchFields = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from("custom_fields")
        .select("*")
        .eq("company_id", companyId)
        .eq("table_name", tableName)
        .order("field_order");

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
    } finally {
      setLoading(false);
    }
  };

  return { fields, loading };
};
