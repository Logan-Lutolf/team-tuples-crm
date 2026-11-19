import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "prepare", Path(__file__).resolve().parents[2] / "scripts/prepare-spreadsheet-import.py"
)
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)


class SpreadsheetImportTests(unittest.TestCase):
    def test_birth_dates(self):
        for source in ("03.04.12", "3/4/2012", "03042012", "3. 4. 2012"):
            self.assertEqual(prepare.date(source), "2012-04-03")
        self.assertIsNone(prepare.date(""))
        with self.assertRaises(ValueError):
            prepare.date("31.2.2012")

    def fixture(self, waitlist=False):
        header = [""] * 22
        header[6] = "Jméno účastníka"
        section = [""] * 22
        section[3] = "Praha 1 — Theatre class"
        row = [""] * 22
        row[6], row[7], row[9] = "Child Example", "POUZE NÁHRADNÍCI" if waitlist else "Theatre class", "3.4.2012"
        row[14] = row[17] = "family@example.test"
        row[15] = "Parent Example"
        team_header = [""] * 40
        team_header[4] = "Učitel"
        team_columns = [""] * 40
        team_columns[14] = "Datum narození"
        team = [""] * 40
        team[0], team[1], team[2] = "ZŠ Example", "2", "Student One\nStudent Two"
        team[4], team[5], team[6] = "Teacher Example", "teacher@example.test", "+420 111 222 333"
        team[11], team[14] = "Witness Example", "1.1.1940"
        with tempfile.TemporaryDirectory() as directory:
            paths = [Path(directory) / name for name in ("theatre.csv", "teams.csv")]
            for path, rows in zip(paths, ([header, section, row, row], [team_header, team_columns, team])):
                with path.open("w", newline="", encoding="utf-8") as stream:
                    csv.writer(stream).writerows(rows)
            return prepare.prepare(*paths)

    def test_shared_email_keeps_parent_and_child_separate(self):
        plan = self.fixture()
        child = plan["people"]["child example|2012-04-03"]
        parent = plan["people"][next(k for k in plan["people"] if k.startswith("parent example"))]
        self.assertIsNone(child["email"])
        self.assertEqual(parent["email"], "family@example.test")
        self.assertIsNone(parent["dob"])
        self.assertEqual(len(plan["parentLinks"]), 1)

    def test_multiline_students_and_teacher_columns(self):
        plan = self.fixture()
        teacher = plan["people"][next(k for k in plan["people"] if k.startswith("teacher example"))]
        self.assertEqual(teacher["email"], "teacher@example.test")
        self.assertEqual(teacher["phone"], "+420 111 222 333")
        self.assertEqual(sum(bool(p.get("student")) for p in plan["people"].values()), 3)

    def test_duplicates_do_not_duplicate_people_or_links(self):
        plan = self.fixture()
        self.assertEqual(len(plan["people"]), 6)
        self.assertEqual(len(plan["duplicateRows"]), 1)
        self.assertEqual(len(plan["links"]), 5)

    def test_waitlist_is_not_confirmed_attendance(self):
        plan = self.fixture(waitlist=True)
        self.assertFalse(any(person.startswith("child example") for person, group in plan["links"]))
        self.assertTrue(any(issue["type"] == "waitlist-not-enrolment" for issue in plan["issues"]))


if __name__ == "__main__":
    unittest.main()
