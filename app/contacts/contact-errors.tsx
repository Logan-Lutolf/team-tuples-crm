export class SchoolValidationError extends Error {}

const fields: Record<string, string> = {
    name: "Contact name", "full-name": "School name", email: "Email", "phone-num": "Phone number",
    street: "Street address", city: "City", zipCode: "Postal code", type: "School type",
    region: "Region", phone: "Phone number", last_contacted: "Last contacted", last_contacted_by: "Last contacted by", last_contacted_byId: "Last contaced by ID", schoolId: "School", 
    startDate: "Start date", endDate: "End date", "school-id": "School",
    "contact-id": "Contact", "employee-id": "Employee", "program-id": "Program",
    "participation-id": "Participation", "start-date": "Start date", "end-date": "End date", status: "Status",
}

export function schoolFieldLabel(key: string) {
    return fields[key] ?? "Field"
}

export function schoolErrorMessage(error: unknown, action: string): string {
    if (error instanceof SchoolValidationError) return error.message
    const info = typeof error === "object" && error !== null ? error as Record<string, unknown> : {}
    const constraint = typeof info.constraint === "string" ? info.constraint : ""
    switch (info.sqlState) {
        case "23505":
            if (constraint === "School_email_key") return "A school with this email already exists. Use a different email address."
            if (constraint === "School_pkey") return "Another school was created at the same time. Please submit again."
            return "This record or assignment already exists. Refresh the page and try again."
        case "23503":
            if (action.startsWith("Delete")) {
                if (constraint.startsWith("Contact_")) return "This school still has contacts. Remove their school assignments before deleting it."
                if (constraint.startsWith("SchoolEmployees_")) return "This school still has assigned employees. Remove their assignments before deleting it."
                if (constraint.startsWith("ParticipationEmployees_")) return "This participation still has assigned employees. Remove their assignments before deleting it."
                if (constraint.startsWith("Participation_")) return "This school still has participations. Delete them before deleting the school."
                return "Other records still depend on this record. Remove their links before deleting it."
            }
            if (constraint === "School_branchId_fkey") return "The selected branch no longer exists. Refresh the page and select another branch."
            if (constraint.endsWith("_schoolId_fkey")) return "The selected school no longer exists. Refresh the page."
            if (constraint.endsWith("_employeeId_fkey")) return "The selected employee no longer exists. Refresh the page and select another employee."
            if (constraint.endsWith("_programId_fkey")) return "The selected program no longer exists. Refresh the page and select another program."
            return "A selected related record no longer exists. Refresh the page and try again."
        case "23502":
            return `${schoolFieldLabel(typeof info.column === "string" ? info.column : "")} is required.`
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
