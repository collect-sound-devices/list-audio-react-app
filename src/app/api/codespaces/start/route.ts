import { NextResponse } from 'next/server';

const GITHUB_API_URL = 'https://api.github.com';
const CODESPACE_DISPLAY_NAME = 'CodeSpaceMain';

interface Codespace {
    display_name: string;
    name: string;
}

async function githubFetch(path: string, init?: RequestInit): Promise<Response> {
    const pat = process.env.GITHUB_PAT;
    if (!pat) {
        throw new Error('Missing GITHUB_PAT');
    }

    return fetch(`${GITHUB_API_URL}${path}`, {
        ...init,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `token ${pat}`,
            ...(init?.headers ?? {}),
        },
        cache: 'no-store',
    });
}

export async function POST() {
    try {
        const infoResponse = await githubFetch('/user/codespaces');
        if (!infoResponse.ok) {
            return NextResponse.json(
                { error: `Failed to load Codespaces: ${infoResponse.status} ${infoResponse.statusText}` },
                { status: 502 },
            );
        }

        const info = await infoResponse.json() as { codespaces?: Codespace[] };
        const codespace = info.codespaces?.find((entry) => entry.display_name === CODESPACE_DISPLAY_NAME);
        if (!codespace) {
            return NextResponse.json({ error: `Codespace '${CODESPACE_DISPLAY_NAME}' not found.` }, { status: 404 });
        }

        const startResponse = await githubFetch(`/user/codespaces/${codespace.name}/start`, {
            method: 'POST',
        });

        if (!startResponse.ok) {
            return NextResponse.json(
                { error: `Failed to start Codespace: ${startResponse.status} ${startResponse.statusText}` },
                { status: 502 },
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
