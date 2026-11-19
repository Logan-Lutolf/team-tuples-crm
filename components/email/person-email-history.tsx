import { currentEmployee } from '@/lib/current-employee'
import { canUseEmailContacts } from '@/lib/email-contacts'
import { loadSmartEmailContact } from '@/lib/smartemailing-data'
import { SmartEmailingHistory } from './smartemailing-history'

export async function PersonEmailHistory({ email, lastTrackedEmailAt }: {
    email: string | null; lastTrackedEmailAt: string | null
}) {
    const employee = await currentEmployee()
    if (!employee || !canUseEmailContacts(employee.roles)) return null
    const lastEmail = lastTrackedEmailAt ? new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Prague',
    }).format(new Date(lastTrackedEmailAt)) : 'Never tracked'
    return <section className="grid gap-4" aria-label="Email history">
        <p>Latest email tracked with CC: {lastEmail}</p>
        {email ? <SmartEmailingHistory data={await loadSmartEmailContact(email)} /> : <p>No email address on file.</p>}
    </section>
}
