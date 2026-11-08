# Bulk Mailer

A small web portal for composing email campaigns, importing recipient addresses from CSV/XLSX files, and sending mail through configured SMTP accounts.

## Requirements

- Node.js 18 or newer
- npm
- An SMTP account that permits the intended messages
- Internet access in the browser for the Tailwind CSS and SheetJS CDN assets

## Setup

```powershell
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). To stop the server, press `Ctrl+C` in the terminal.

On Windows, `start-portal.bat` can also be used to launch the local server and open the page.

## Using the portal

1. Add an SMTP sender account. Leave **SMTP Host** blank to use Gmail; enter a host to use a custom SMTP server.
2. Paste recipient addresses or import a CSV/XLS/XLSX file. Addresses from the manual list and spreadsheet are combined and deduplicated.
3. Enter the subject and message, optionally attach a file, and choose a delay between sends.
4. Start the campaign and monitor its progress in the status panel. Use **Stop** to request that the current campaign stop.

The server listens on port `3000`. The custom SMTP configuration currently uses secure SMTP and defaults to port `465`.

## Tests

```powershell
npm test
```

This runs a JavaScript syntax check for the server. No automated functional test suite is included yet.

## Privacy and responsible use

- Use this tool only for recipients who have explicitly opted in to receive your messages. Follow applicable privacy, anti-spam, and email-provider rules.
- Do not use it to send unsolicited or deceptive messages. This project does not implement consent records, unsubscribe handling, or production-grade campaign controls.
- The server has no authentication and is intended for local development only. Do not expose it directly to the internet or use it as a production service.
- Sender credentials are submitted to the local server for the active campaign. Do not enter credentials on a shared or untrusted machine.
- Uploaded attachments are stored temporarily in `uploads/` and removed after the campaign completes. That directory is excluded from Git.
- Do not commit credentials, recipient lists, or private attachments.

## Project files

- `index.html` — browser interface and recipient import logic
- `server.js` — Express server, SMTP delivery, and campaign status endpoints
- `start-portal.bat` — Windows launcher
- `package.json` / `package-lock.json` — npm metadata and dependency lockfile
