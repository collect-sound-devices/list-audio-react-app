export const startCodespace = async (): Promise<void> => {
    try {
        const response = await fetch('/api/codespaces/start', {
            method: 'POST',
        });

        if (!response.ok) {
            console.error(`Failed to start Codespace: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Starting Codespace workflow error:', error);
    }
};
