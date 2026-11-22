import pg from 'pg'

export class AuditPool extends pg.Pool {
    /**
     * @param {import('pg').PoolConfig} config
     * @param {() => Promise<number | null>} getEditorId
     */
    constructor(config, getEditorId) {
        super(config)
        this.getEditorId = getEditorId
    }

    /** @overload @returns {Promise<import('pg').PoolClient>} */
    /**
     * @overload
     * @param {Parameters<import('pg').Pool['connect']>[0]} callback
     * @returns {void}
     */
    /** @param {Parameters<import('pg').Pool['connect']>[0]} [callback] */
    connect(callback) {
        const checkout = this.checkout()
        if (!callback) return checkout
        void checkout.then(
            client => callback(undefined, client, client.release),
            error => callback(error, undefined, () => {}),
        )
    }

    async checkout() {
        const editorId = await this.getEditorId()
        const client = await super.connect()
        try {
            // A pooled connection may have served another user. Set or clear attribution on every checkout.
            await client.query("SELECT set_config('crm.editor_id', $1, false)", [editorId?.toString() ?? ''])
            return client
        } catch (error) {
            client.release(true)
            throw error
        }
    }
}
