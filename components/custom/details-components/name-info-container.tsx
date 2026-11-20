// name-info-container.tsx  (server component: no "use client", no "use server")
import "server-only"

import { db } from "@/prisma/db"
import { canEdit } from "@/lib/auth"
import { NameInfo } from "./name-info"
import type { Branch, Organization, Person, PersonRoles, PersonWithRole } from "@/app/types"
import { EntityType, LoadedMap, RawMap } from "./name-info-types"



// The "load" half: server-only work per entity type
const loaders: { [K in EntityType]: (obj: RawMap[K]) => Promise<LoadedMap[K]> } = {
    person: async (p) => {
        const personRole: PersonRoles[] = await db.orm.public.PersonRoles
            .where({ personId: p.id })
            .all()
        return { ...p, personRole }
    },
    org: async (o) => o,
    branch: async (b) => b,
}

export async function NameInfoContainer<K extends EntityType>({
    type,
    obj,
}: {
    type: K
    obj: RawMap[K]
}) {
    const editPermission = await canEdit()

    const loader = loaders[type] as (obj: RawMap[K]) => Promise<LoadedMap[K]>
    const data = await loader(obj)

    return <NameInfo type={type} obj={data} editPermission={editPermission} />
}