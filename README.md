# Audio Device Repository Client

Visualizes an audio device repository using Next.js / React / TypeScript.<br>
Launch it here [here](https://list-audio-react-app.vercel.app).<br>
The *Audio Device Repository Client* is primary client of the *Device Repository Server*,
see [audio-device-repo-server](https://github.com/collect-sound-devices/audio-device-repo-server/).<br>

![primaryWebClient screenshot](202509011555ReactRepoApp.jpg)

## Web Hosting

### Client
- The *Audio Device Repository Client* is deployed on Vercel at https://list-audio-react-app.vercel.app.
- GitHub Actions uses `.github/workflows/vercel-init.yml` for one-time Vercel project setup and `.github/workflows/deploy.yml` for regular production deployments.

### Server
- The *Device Repository Server* is hosted on GitHub Codespaces.<br>
  It starts automatically (on-demand).

## Development Environment

### (Optional) Compile and start the server locally

- Check out the backend repo [audio-device-repo-server](https://github.com/eduarddanziger/audio-device-repo-server/) and install .NET tools
- Start the ASP.NET Core Web API Server:

```powershell
cd DeviceRepoAspNetCore
dotnet run --launch-profile http
```

### Start the client locally (development mode)

1. Install dependencies:
```bash
npm install
```

*Note*<br>
*- If you use locally hosted *Device Repository Server*, configure environment variables so the client points to your local backend.
You can edit `.env.development` file or set the environment variables directly via powershell `$env:NEXT_PUBLIC_API_GITHUB_URL = "http://localhost:5027/api"`
or via cmd.exe `setx NEXT_PUBLIC_API_GITHUB_URL "http://localhost:5027/api"`.*

*- If you want the app to start the GitHub Codespace on demand, set `GITHUB_PAT` as a server-side environment variable.*

2. Start the npm development server:
```bash
npm run dev
```

3. Open a browser at http://localhost:3000.

*Notes*<br>
*- The app also supports Azure as a target by setting `NEXT_PUBLIC_API_HOSTED_ON=AZURE` and providing `NEXT_PUBLIC_API_AZURE_URL`, see `.env.development` file*<br>
*- The API URL values can be plain URLs or pre-defined encrypted strings (the app will attempt to decrypt and fall back to plaintext if decryption fails)*.

## Local deployment (production mode)

*Note*<br>
*- If you use locally hosted *Device Repository Server*, configure environment variables so the client points to your local backend.
You can edit `.env.production` file or set `NEXT_PUBLIC_API_GITHUB_URL` directly.*

*- If you want the app to start the GitHub Codespace on demand, set `GITHUB_PAT` as a server-side environment variable.*

1. Build the client for production:

```bash
npm run build
```
## Governance (Qodana)
Local Qodana analysis is configured in `qodana.yaml` to use the `jetbrains/qodana-js:2025.3` linter together with
the custom inspection profile at `.qodana/profiles/inspection-profile01.xml`.
It explicitly checks `CyclomaticComplexityJS` and excludes non-source files such as `README.md`.


2. Start the npm production server:

```bash
npm start
```

3. Open a browser at http://localhost:3000.

## Vercel deployment

- Run `.github/workflows/vercel-init.yml` once for a new Vercel project or when rotating secrets.
- Regular automatic deployments to Vercel use `.github/workflows/deploy.yml`.
- The scripts above use the following GitHub Actions secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `GITHUB_PAT`, `AUDIO_API_GITHUB_URL`, `AUDIO_API_AZURE_URL`.

## Changelog
- 2026.01 Device removal added 
- 2025.12 Fetching code moved to the Next.js Server Components (RCS)
- 2025.12 Migrated from a Vite-based SPA to Next.js (App Router).

