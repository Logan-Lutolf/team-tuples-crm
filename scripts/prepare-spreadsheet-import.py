"""Prepare the two supplied CSV exports; no network or database access.

Usage: python3 scripts/prepare-spreadsheet-import.py theatre.csv teams.csv plan.json
The output contains personal data: keep it in .local/, not in Git.
"""
import csv
import datetime
import json
import re
import sys
import unicodedata
from pathlib import Path


def clean(value):
    return " ".join(value.split())


def key(value):
    return clean(value).casefold()


def date(value):
    value = re.sub(r"\s", "", value)
    if not value:
        return None
    if re.fullmatch(r"\d{8}", value):
        value = f"{value[:2]}.{value[2:4]}.{value[4:]}"
    parts = re.split(r"[./-]", value)
    if len(parts) != 3:
        raise ValueError(f"Unrecognized date: {value}")
    day, month, year = map(int, parts)
    if year < 100:
        year += 2000 if year < 27 else 1900
    return datetime.date(year, month, day).isoformat()


def school_type(name):
    normalized = unicodedata.normalize("NFKD", name.casefold())
    normalized = "".join(c for c in normalized if not unicodedata.combining(c))
    if re.match(r"zs\b|zakladni skola", normalized):
        return "PRIMARY_SCHOOL"
    if any(word in normalized for word in ("gymnaz", "gimnaz", "stredni", "konzervator", "oa ")):
        return "SECONDARY_SCHOOL"
    return None


def prepare(theatre_path, teams_path):
    with open(theatre_path, newline="", encoding="utf-8-sig") as stream:
        theatre = list(csv.reader(stream))
    with open(teams_path, newline="", encoding="utf-8-sig") as stream:
        teams = list(csv.reader(stream))
    if len(theatre[0]) < 22 or "účastníka" not in theatre[0][6]:
        raise ValueError("Unexpected theatre CSV columns")
    if len(teams) < 2 or "Učitel" not in teams[0][4] or "Datum narození" not in teams[1][14]:
        raise ValueError("Unexpected school-team CSV columns")

    people, organizations, groups, programs = {}, {}, {}, {}
    issues, duplicate_rows = [], []
    links, parent_links = set(), set()

    def person(name, dob=None, email=None, phone=None, **extra):
        name = clean(name)
        identity = f"{key(name)}|{dob or ''}"
        values = dict(name=name, dob=dob, email=clean(email or "").lower() or None,
                      phone=clean(phone or "") or None, **extra)
        if identity in people:
            for field, value in values.items():
                if value and people[identity].get(field) not in (None, value):
                    issues.append(dict(type="conflicting-person-field", person=identity, field=field, value=value))
                elif value:
                    people[identity][field] = value
        else:
            people[identity] = values
        return identity

    def organization(name, type=None, region=None, address=None):
        identity = key(name)
        organizations.setdefault(identity, dict(name=clean(name), type=type, region=region, address=address))
        return identity

    section = None
    seen_participants = set()
    theatre_program = "Divadlo Paměti národa"
    programs[theatre_program] = dict(name=theatre_program)
    for number, row in enumerate(theatre[1:], 2):
        if len(row) < 22:
            raise ValueError(f"Short theatre row {number}")
        if not clean(row[6]):
            if row[3].startswith("Praha "):
                section = clean(row[3])
                groups[section] = dict(name=section, program=theatre_program,
                                       programType="MEMORY_OF_NATIONS_THEATRE", organization=None)
            continue
        student = person(row[6], date(row[9]), row[14], row[13], student=True, role="STUDENT")
        if student in seen_participants:
            duplicate_rows.append(dict(sheet="theatre", row=number, person=student))
        seen_participants.add(student)
        parent_name = clean(row[15])
        if parent_name and parent_name != "-":
            parent = person(parent_name, email=row[17], phone=row[16], parent=True)
            parent_links.add((student, parent))
        # Partial residence is preserved without inventing a street, postcode or country.
        if clean(row[11]):
            residence = clean(row[11])
            field = "street" if re.search(r"\d+[/\d]*[, ]|Ke škole", residence) and not residence.startswith("Praha") else "city"
            people[student]["address"] = dict(street=None, city=None, country=None, zipCode=None)
            people[student]["address"][field] = residence
        school = clean(row[12])
        # Generic descriptions do not identify an actual school.
        generic = {"", "??", "student", "gymnázium", "gymnazium", "osmileté gymnazium", "zakladni skola", "žákyně 8. třídy zš", "karla čapka"}
        if key(school) not in generic:
            org = organization(school, school_type(school))
            people[student]["organization"] = org
        elif school:
            issues.append(dict(type="unresolved-school", sheet="theatre", row=number, person=student, value=school))
        if not clean(row[7]):
            issues.append(dict(type="missing-group", sheet="theatre", row=number, person=student))
        elif row[7].startswith("POUZE NÁHRADNÍCI"):
            issues.append(dict(type="waitlist-not-enrolment", sheet="theatre", row=number, person=student, group=section))
        elif section:
            links.add((student, section))
        else:
            raise ValueError(f"No group section for row {number}")

    soon_program = "Příběhy našich sousedů — Beroun"
    programs[soon_program] = dict(name=soon_program)
    for number, row in enumerate(teams[2:], 3):
        if not clean(row[0]):
            continue
        if len(row) < 34:
            raise ValueError(f"Short school-team row {number}")
        school = organization(row[0], school_type(row[0]))
        group = f"Příběhy našich sousedů — {clean(row[0])}"
        groups[group] = dict(name=group, program=soon_program, programType="STORIES_OF_OUR_NEIGHBORS", organization=school)
        students = [clean(name) for name in row[2].splitlines() if clean(name)]
        if len(students) != int(row[1]):
            raise ValueError(f"Student count mismatch in team row {number}")
        for name in students:
            student = person(name, student=True, role="STUDENT", organization=school)
            links.add((student, group))
        teacher = person(row[4], email=row[5], phone=row[6], role="TEACHER", organization=school)
        links.add((teacher, group))
        witness = person(row[11], date(row[14]), row[16], row[15])
        links.add((witness, group))
        if clean(row[17]):
            people[witness]["address"] = dict(street=clean(row[17]), city=None, country=None, zipCode=None)
        issues.append(dict(type="witness-role-unavailable", person=witness,
                           explanation="Imported person and participation; no matching witness contact type exists."))

    # Parents take precedence for shared addresses. Never merge people just by email.
    owners = {}
    for identity, data in sorted(people.items(), key=lambda item: (not item[1].get("parent", False), item[0])):
        email = data["email"]
        if email and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
            issues.append(dict(type="invalid-email", person=identity, value=email))
            data["email"] = None
        elif email in owners:
            issues.append(dict(type="shared-email", person=identity, value=email, retainedOn=owners[email]))
            data["email"] = None
        elif email:
            owners[email] = identity

    # One parent FK exists per student. Refuse to choose silently between parents.
    parents_by_student = {}
    for student, parent in sorted(parent_links):
        parents_by_student.setdefault(student, []).append(parent)
    resolved_parents = []
    for student, parents in parents_by_student.items():
        if len(parents) == 1:
            resolved_parents.append([student, parents[0]])
        else:
            issues.append(dict(type="multiple-parents", student=student, parents=parents))

    return dict(version=1, people=people, organizations=organizations, programs=programs,
                participations=groups, links=sorted(links), parentLinks=resolved_parents,
                duplicateRows=duplicate_rows, issues=issues,
                omittedFields=["Payment amounts/status and confirmation emails", "Consent and consent dates",
                               "Health/allergy notes", "Referral sources and free-text messages",
                               "School-team administrative dates, equipment, and workshop tasks",
                               "Lecturer/venue contacts in section headings (not employee accounts)"],
                defaults=["Unknown birth dates, programme dates, school regions and relationship ratings remain null.",
                          "Participation status retains the schema default PLANNED; source status is unknown.",
                          "Theatre section headings identify groups; older venue variants do not create extra groups."])


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    plan = prepare(sys.argv[1], sys.argv[2])
    Path(sys.argv[3]).write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({name: len(plan[name]) for name in ("people", "organizations", "participations", "links", "parentLinks", "issues")}))
