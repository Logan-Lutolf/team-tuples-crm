import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    "activity", Path(__file__).resolve().parents[2] / "scripts/prepare-spreadsheet-activity.py"
)
activity = importlib.util.module_from_spec(spec)
spec.loader.exec_module(activity)


class ActivityDates(unittest.TestCase):
    def test_school_year_crosses_calendar_year(self):
        self.assertEqual(activity.parse_date("18.11.", school_year=True), "2026-11-18")
        self.assertEqual(activity.parse_date("7.1.", school_year=True), "2027-01-07")

    def test_explicit_year_takes_precedence(self):
        self.assertEqual(activity.parse_date("11. 3. 2027", school_year=True), "2027-03-11")
        self.assertEqual(activity.parse_date("1.1.2025", school_year=True), "2025-01-01")

    def test_uncertain_dates_are_not_invented(self):
        for value in ["", "během ledna", "zjistit", "nabídka 6.10., nevyužil", "nakonec ABC, 7.9."]:
            self.assertIsNone(activity.parse_date(value))
        with self.assertRaises(ValueError):
            activity.parse_date("31.2.")

    def test_date_only_storage_respects_prague_dst(self):
        self.assertEqual(activity.timestamp("2026-09-09"), "2026-09-09T00:00:00+02:00")
        self.assertEqual(activity.timestamp("2026-11-18"), "2026-11-18T00:00:00+01:00")


if __name__ == "__main__":
    unittest.main()
