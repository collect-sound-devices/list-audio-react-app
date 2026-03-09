import {NextResponse} from 'next/server';

const GITHUB_API_URL = 'https://api.github.com';
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
        Authorization: `token ${pat}`,
    };
}

async function listCodespaces(): Promise<Codespace[]> {
    const response = await fetch(`${GITHUB_API_URL}${'/user/codespaces'}`, {
        method: 'GET',
        headers: getGithubHeaders(),
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(`Failed to load Codespaces: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json() as { codespaces?: Codespace[] };
    return payload.codespaces ?? [];
}

async function startCodespace(name: string): Promise<void> {
    const response = await fetch(`${GITHUB_API_URL}${`/user/codespaces/${name}/start`}`, {
        method: 'POST',
        headers: getGithubHeaders(),
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(`Failed to start Codespace: ${response.status} ${response.statusText}`);
    }
}

export async function POST() {
    try {
        const codespaces = await listCodespaces();
        const codespace = codespaces.find((entry) => entry.display_name === CODESPACE_DISPLAY_NAME);
        if (!codespace) {
            return NextResponse.json({ error: `Codespace '${CODESPACE_DISPLAY_NAME}' not found.` }, { status: 404 });
        }

        await startCodespace(codespace.name);
        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const status = message.startsWith('Failed to ') ? 502 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
