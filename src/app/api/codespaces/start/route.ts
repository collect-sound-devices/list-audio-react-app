import {NextResponse} from 'next/server';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const CODESPACE_DISPLAY_NAME = 'CodeSpaceMain';

interface Codespace {
    display_name: string;
    name: string;
}

function getGithubHeaders(): HeadersInit {
    const pat = process.env.GITHUB_PAT;
    if (!pat) {
        throw new Error('Missing GITHUB_PAT');
    }

    return {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${pat}`,
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
    };
}

async function getErrorMessage(response: Response, action: string): Promise<string> {
    const body = await response.text().catch(() => '');
    if (!body) return `Failed to ${action}: ${response.status} ${response.statusText}`;

    try {
        const payload = JSON.parse(body) as { message?: string };
        if (payload.message) {
            return `Failed to ${action}: ${response.status} ${response.statusText}: ${payload.message}`;
        }
    } catch {
        // Use the raw body below.
    }

    return `Failed to ${action}: ${response.status} ${response.statusText}: ${body}`;
}

async function listCodespaces(): Promise<Codespace[]> {
    const response = await fetch(`${GITHUB_API_URL}/user/codespaces`, {
        method: 'GET',
        headers: getGithubHeaders(),
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'load Codespaces'));
    }

    const payload = await response.json() as { codespaces?: Codespace[] };
    return payload.codespaces ?? [];
}

async function startCodespace(name: string): Promise<{ status: number; message?: string }> {
    const response = await fetch(`${GITHUB_API_URL}/user/codespaces/${name}/start`, {
        method: 'POST',
        headers: getGithubHeaders(),
        cache: 'no-store',
    });

    if (response.ok) {
        return { status: response.status };
    }

    if (response.status === 304 || response.status === 409) {
        return {
            status: response.status,
            message: 'Codespace is already started, starting, or not modified.',
        };
    }

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'start Codespace'));
    }

    throw new Error(`Unexpected Codespace start response: ${response.status} ${response.statusText}`);
}

export async function POST() {
    try {
        const codespaces = await listCodespaces();
        const codespace = codespaces.find((entry) => entry.display_name === CODESPACE_DISPLAY_NAME);
        if (!codespace) {
            return NextResponse.json({ error: `Codespace '${CODESPACE_DISPLAY_NAME}' not found.` }, { status: 404 });
        }

        const result = await startCodespace(codespace.name);
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const status = message.startsWith('Failed to ') ? 502 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
