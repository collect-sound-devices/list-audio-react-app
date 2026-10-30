export interface StartCodespaceResult {
    ok: boolean;
    status?: number;
    message?: string;
}

export const startCodespace = async (): Promise<StartCodespaceResult> => {
    try {
        const response = await fetch('/api/codespaces/start', {
            method: 'POST',
        });
        const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                message: payload?.error ?? payload?.message ?? response.statusText,
            };
        }

        return { ok: true, status: response.status, message: payload?.message };
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : String(error),
        };
    }
};
