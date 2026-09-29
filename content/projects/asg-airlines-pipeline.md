---
title: "asg-airlines-pipeline/"
status: "case study"
tags: ["data"]
blurb: "A bronze → silver → gold pipeline that turns a messy airline workbook into a star schema and a Power BI dashboard."
metric:
  value: "64.7%"
  label: "of flights flagged for physically impossible durations"
points:
  - "4,059 raw rows across flights, bookings, passengers and payments"
  - "Deduplication, type casting and cross-day time fixes, with 55 rows quarantined and their reasons logged"
  - "Star schema of 3 fact tables and 5 dimensions, plus 8 KPI aggregates"
  - "Found no link between recorded duration and distance (r = −0.005), so rebuilt block time from great-circle distance"
  - "Passenger PII protected with salted SHA-256"
stack: ["Python", "pandas", "Jupyter", "Parquet", "Power BI"]
links:
  - label: "Repo"
    url: "https://github.com/abelm10/asg-airlines-data-pipeline"
    primary: true
order: 2
---
