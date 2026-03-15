export function getAudioDevicesApiUrl(): string {
    return getBaseApiUrl() + '/AudioDevices';
}

export function getInfoApiUrl(): string {
    return getBaseApiUrl() + '/Info';
}

export function getBaseApiUrl(): string {
    const useAzureApi = process.env.NEXT_PUBLIC_API_HOSTED_ON === 'AZURE';
    const configuredApiUrl = useAzureApi
        ? process.env.NEXT_PUBLIC_API_AZURE_URL
        : process.env.NEXT_PUBLIC_API_GITHUB_URL;

    if (configuredApiUrl && configuredApiUrl.trim() !== '') {
        return configuredApiUrl;
    }

    return 'http://localhost:5027/api';
}
