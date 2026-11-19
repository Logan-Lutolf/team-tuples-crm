"""Build dated activity from the previously imported theatre/project CSVs.

Usage: python3 scripts/prepare-spreadsheet-activity.py theatre.csv projects.csv output.json
Year assumptions and date-only precision are explicit in the output. No DB writes.
"""
import csv
import datetime
import json
import re
import sys
from pathlib import Path
from zoneinfo import ZoneInfo


def parse_date(value, autumn_year=2026, school_year=False):
    match = re.fullmatch(r"\s*(\d{1,2})\s*\.\s*(\d{1,2})\s*\.?\s*(\d{4})?\s*", value)
    if not match:
        return None
    day, month, year = match.groups()
    month = int(month)
    year = int(year) if year else autumn_year + int(school_year and month < 9)
    return datetime.date(year, month, int(day)).isoformat()


def timestamp(date):
    # Source records have no time. Midnight is a date-only storage convention, not a claimed send time.
    return datetime.datetime.fromisoformat(date).replace(tzinfo=ZoneInfo("Europe/Prague")).isoformat()


def person_key(name, dob=""):
    return " ".join(name.split()).casefold() + "|" + dob


def prepare(theatre_path, projects_path):
    with open(theatre_path, newline="", encoding="utf-8-sig") as stream:
        theatre = list(csv.reader(stream))
    with open(projects_path, newline="", encoding="utf-8-sig") as stream:
        projects = list(csv.reader(stream))
    if "mail potvrzení" not in theatre[0][0] or "Datum školení" not in projects[1][8]:
        raise ValueError("Unexpected spreadsheet columns")
    result = dict(emails=[], events=[], skipped=[], assumptions=[
        "Theatre email day/month dates use 2026, the registration timestamp year.",
        "Project dates use school year 2026–27, supported by the explicit March 2027 presentation date.",
        "Date-only timestamps are stored at Prague midnight; exact times and responsible staff are unknown.",
        "Project activities are scheduled participations, not confirmation of attendance or completed outreach.",
        "No undated witness calls, uncertain month-only dates, or health/consent data are imported.",
    ])
    for number, row in enumerate(theatre[1:], 2):
        if not row[6].strip():
            continue
        for column in [0, 1]:
            value = row[column].strip()
            date = parse_date(value)
            source = dict(sheet="theatre", row=number, column=column, value=value)
            if not date:
                if value:
                    result["skipped"].append(dict(source=source, reason="Not an unambiguous full day/month date"))
                continue
            result["emails"].append(dict(email=row[5].strip().lower(), date=date, timestamp=timestamp(date), source=source))

    activity_columns = {8: "Školení učitele", 21: "Nahrávání pamětníka", 24: "Motivační hodina / úvodní schůzka",
                        25: "Jak natočit pamětníka", 26: "Jak vyprávět příběh", 28: "Workshop k výstupu",
                        29: "Druhý workshop k výstupu", 30: "Exkurze", 33: "Závěrečná prezentace"}
    for number, row in enumerate(projects[2:], 3):
        if not row[0].strip():
            continue
        school = " ".join(row[0].split())
        teacher = person_key(row[4])
        students = [person_key(name) for name in row[2].splitlines() if name.strip()]
        witness_date = re.sub(r"\s", "", row[14]).rstrip(".")
        witness_date = datetime.datetime.strptime(witness_date, "%d.%m.%Y").date().isoformat()
        witness = person_key(row[11], witness_date)
        for column, label in activity_columns.items():
            value = row[column].strip()
            if not value:
                continue
            date = parse_date(value, school_year=True)
            source = dict(sheet="projects", row=number, column=column, value=value)
            if not date:
                result["skipped"].append(dict(source=source, reason="Uncertain date or month-only schedule"))
                continue
            people = [teacher] if column == 8 else [teacher, *students]
            if column in [21, 33]:
                people.append(witness)
            result["events"].append(dict(name=f"{label} — {school}", schoolKey=school.casefold(), date=date,
                                         timestamp=timestamp(date), people=people, source=source))
    return result


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    plan = prepare(sys.argv[1], sys.argv[2])
    Path(sys.argv[3]).write_text(json.dumps(plan, ensure_ascii=False, indent=2))
    print(json.dumps({key: len(plan[key]) for key in ["emails", "events", "skipped"]}))
