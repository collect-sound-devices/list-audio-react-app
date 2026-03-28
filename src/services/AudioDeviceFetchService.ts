import {AudioDevice} from '../types/AudioDevice';
import {ApiAudioDevice} from '../types/ApiAudioDevice';
import {startCodespace} from './startCodespace';

export interface FetchProgress {
    progress: number;
    error: string | null;
}

export const internalRouteBaseUrl = '/api/audio-devices';

export class AudioDeviceFetchService {
    private readonly retryCount = 32;
    private readonly pauseDuration = 2000;

    constructor(
        private readonly onProgress: (progress: FetchProgress) => void,
        private readonly translateError: (key: string) => string
    ) {}

    private calculateProgress(attempt: number): number {
        return (attempt + 1) * 100 / this.retryCount;
    }

    private async delay(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, this.pauseDuration));
    }

    private shouldRetryViaCodespaces(): boolean {
        const isAzureTarget = process.env.NEXT_PUBLIC_API_HOSTED_ON === 'AZURE';
        const githubApiUrl = process.env.NEXT_PUBLIC_API_GITHUB_URL ?? '';

        return !isAzureTarget && githubApiUrl.includes('.github.');
    }

    // Minimal shared helper to fetch, check status, parse JSON and ensure it's an array
    private async fetchDevicesFromUrl(url: string, context: string): Promise<ApiAudioDevice[]> {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to ${context}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(`Unexpected ${context} response shape: expected array`);
        }

        return data as ApiAudioDevice[];
    }

    private async fetchDevices(): Promise<ApiAudioDevice[]> {
        return this.fetchDevicesFromUrl(internalRouteBaseUrl, 'fetch devices');
    }

    private async searchDevices(query: string): Promise<ApiAudioDevice[]> {
        const params = new URLSearchParams();
        params.append('query', query);
        return this.fetchDevicesFromUrl(`${internalRouteBaseUrl}/search?${params}`, 'search devices');
    }

    private handleFetchErrorNoAttempts(err: unknown): void {
        console.error('Device fetch error:', err);
        this.onProgress({
            progress: 100,
            error: this.translateError('audioDevicesFetchErrorNoAttempts')
        });
    }

    private handleFetchErrorAttemptsExhausted(err: unknown): void {
        console.error('Device fetch error (start-codespace-attempts exhausted):', err);
        this.onProgress({
            progress: 100,
            error: this.translateError('audioDevicesFetchErrorStartAttemptsExhausted')
        });
    }

    private async handleFetchErrorAsStaringCodespaceAsync(err: unknown, attempt: number): Promise<void> {
        console.log(`Device fetch error (attempt ${attempt + 1}):`, err);
        this.onProgress({
            progress: this.calculateProgress(attempt),
            error: this.translateError('audioDevicesFetchErrorStaringCodespace')
        });
        await startCodespace();
        await this.delay();
    }

    async fetchAudioDevices(): Promise<AudioDevice[]> {
        let attempts = 0;

        while (attempts < this.retryCount) {
            try {
                const apiDevices = await this.fetchDevices();
                const audioDevices = apiDevices.map(AudioDevice.fromApiData);

                this.onProgress({progress: 100, error: null});
                return audioDevices;
            } catch (err) {
                if (!this.shouldRetryViaCodespaces()) {
                    console.info('Codespace retry is disabled for the current API target.');
                    this.handleFetchErrorNoAttempts(err);
                    return [];
                }
                if (++attempts === this.retryCount) {
                    this.handleFetchErrorAttemptsExhausted(err);
                    return [];
                }
                await this.handleFetchErrorAsStaringCodespaceAsync(err, attempts);
            }
        }

        return [];
    }

    async searchAudioDevices(query: string): Promise<AudioDevice[]> {
        const apiDevices = await this.searchDevices(query);
        const audioDevices = apiDevices.map(AudioDevice.fromApiData);
        this.onProgress({ progress: 100, error: null });
        return audioDevices;
    }

}