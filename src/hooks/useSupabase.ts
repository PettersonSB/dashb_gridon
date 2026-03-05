import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Generic hook for fetching data from a Supabase table
export function useSupabaseQuery<T>(table: string, orderBy = "sort_order") {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data: rows, error: err } = await supabase
            .from(table)
            .select("*")
            .order(orderBy, { ascending: true });

        if (err) {
            setError(err.message);
            setData([]);
        } else {
            setData((rows as T[]) ?? []);
        }
        setLoading(false);
    }, [table, orderBy]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, loading, error, refetch: fetch };
}

// Generic hook for fetching a single row
export function useSupabaseSingle<T>(table: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        const { data: row, error: err } = await supabase
            .from(table)
            .select("*")
            .limit(1)
            .single();

        if (err) {
            setError(err.message);
            setData(null);
        } else {
            setData(row as T);
        }
        setLoading(false);
    }, [table]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, loading, error, refetch: fetch };
}

// Upsert (insert or update) a single row
export async function upsertRow<T extends any>(table: string, data: T) {
    const { error } = await supabase.from(table).upsert(data);
    return { error: error?.message ?? null };
}

// Insert a new row
export async function insertRow<T extends any>(table: string, data: T) {
    const { data: row, error } = await supabase.from(table).insert(data).select().single();
    return { data: row as T | null, error: error?.message ?? null };
}

// Update a row by ID
export async function updateRow<T extends any>(table: string, id: string, data: Partial<T>) {
    const { error } = await supabase.from(table).update(data).eq("id", id);
    return { error: error?.message ?? null };
}

// Delete a row by ID
export async function deleteRow(table: string, id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    return { error: error?.message ?? null };
}

// Bulk upsert (for saving ordered lists)
export async function bulkUpsert<T extends any>(table: string, rows: T[]) {
    const { error } = await supabase.from(table).upsert(rows);
    return { error: error?.message ?? null };
}
