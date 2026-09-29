---
# Copy this file to content/projects/<slug>.md (or run `npm run add-project`).
# Files starting with "_" are ignored. Every field is checked by ProjectSchema
# in lib/projects.ts, and an invalid file fails `npm run build`.

title: "my-project/"            # shown as-is, so keep the trailing slash
status: "in development"        # live | in development | completed | case study
tags: ["ml"]                    # drives the filter buttons: ml, data, web, software ...
blurb: "One or two sentences on what it is and who it's for."
metric:                         # optional: delete the whole block if there's no headline number
  value: "92%"
  label: "what the number means"
points:
  - "A concrete thing it does or a result"
  - "Another one"
stack: ["Python", "pandas"]
links:
  - label: "Repo"
    url: "https://github.com/abelm10/my-project"
    primary: true               # optional: the solid green button
  - label: "Live site"
    url: "https://example.com"
order: 7                        # optional: lower comes first; unordered projects go last
---
