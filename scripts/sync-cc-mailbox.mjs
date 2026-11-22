import { microsoft365TrackingSettings, mailboxStatePaths, syncMicrosoft365Mailbox } from '../lib/microsoft365-cc-connector.mjs';

try {
    const settings = microsoft365TrackingSettings();
    if (process.argv.includes('--check')) {
        console.log(JSON.stringify({ mailbox: settings.mailbox, crmEndpoint: settings.endpoint,
            cursorFile: mailboxStatePaths(settings).state, note: 'Configuration syntax checked; Microsoft permissions and mailbox delivery have not been tested.' }));
    } else {
        const result = await syncMicrosoft365Mailbox(settings);
        console.log(JSON.stringify(result));
        if (result.more) { console.error('Mailbox import still has more pages. Run the job again.'); process.exitCode = 1; }
    }
} catch (error) {
    // Never print request objects, provider responses, environment values, or credential-bearing URLs.
    console.error(error instanceof Error ? error.message : 'Mailbox tracking failed. See the IT setup guide.');
    process.exitCode = 1;
}
