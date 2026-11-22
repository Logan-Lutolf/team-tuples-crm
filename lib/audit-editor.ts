import { cookies } from 'next/headers'
import { decrypt } from '@/app/login/sessions'

export async function getAuditEditorId() {
    const session = (await cookies()).get('session')?.value
    const editorId = (await decrypt(session))?.userId
    return typeof editorId === 'number' && Number.isInteger(editorId) &&
        editorId > 0 && editorId <= 2147483647 ? editorId : null
}
