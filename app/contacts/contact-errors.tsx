export class ContactValidationError extends Error {}

const fields: Record<string, string> = {
    name: "Contact name", "full-name": "Contact name", email: "Email",
    phone: "Phone number", "phone-num": "Phone number",
    street: "Street address", city: "City", country: "Country", zipCode: "Postal code",
    region: "Region", contactRole: "Contact role",
    branch: "Branch", branchId: "Branch", "branch-id": "Branch",
    schoolId: "School", "school-id": "School", "contact-id": "Contact",
    last_contacted: "Last contacted", last_contacted_by: "Last contacted by",
    last_contacted_byId: "Last contacted by", "employee-id": "Employee",
}

export function contactFieldLabel(key: string) {
    return fields[key] ?? "Field"
}

export function contactErrorMessage(error: unknown, action: string): string {
    if (error instanceof ContactValidationError) return error.message
    const info = typeof error === "object" && error !== null ? error as Record<string, unknown> : {}
    const constraint = typeof info.constraint === "string" ? info.constraint : ""
    switch (info.sqlState) {
        case "23505":
            if (constraint === "Contact_email_key") return "A contact with this email already exists. Use a different email address."
            if (constraint === "Contact_pkey") return "Another contact was created at the same time. Please submit again."
            return "This record or assignment already exists. Refresh the page and try again."
        case "23503":
            if (action.startsWith("Delete")) {
                return "Other records still depend on this contact. Remove their links before deleting it."
            }
            if (constraint === "Contact_branchId_fkey") return "The selected branch no longer exists. Refresh the page and select another branch."
            if (constraint === "Contact_schoolId_fkey") return "The selected school no longer exists. Refresh the page and select another school."
            if (constraint === "Contact_last_contacted_byId_fkey") return "The selected employee no longer exists. Refresh the page and select another employee."
            return "A selected related record no longer exists. Refresh the page and try again."
        case "23502":
            return `${contactFieldLabel(typeof info.column === "string" ? info.column : "")} is required.`
        case "23514": return "A value does not meet the database requirements. Check the submitted values."
        case "22001": return "A submitted value is too long. Shorten it and try again."
        case "22P02": return "A submitted value has an invalid format. Check your selections and numbers."
        case "22007":
        case "22008": return "Enter a valid date and time, including a timezone."
        case "40001":
        case "40P01": return "Another update happened at the same time. Please try again."
        case "42501": return "The database did not allow this change. Contact the application administrator."
    }
    if (info.kind === "sql_connection" || (typeof info.sqlState === "string" && info.sqlState.startsWith("08"))) {
        return "Could not connect to the database. Please try again shortly."
    }
    return `${action} failed unexpectedly. Please try again.`
}
