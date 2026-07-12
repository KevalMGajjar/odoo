# Git Workflow — 4-Member Ownership

Odoo checks that **all four members have real, attributed commit activity**. This
project is split into four owned modules so that's natural. Follow this to produce a
clean, multi-author history.

## One-time setup
1. One member creates the GitHub repo and adds the other three as **collaborators**.
2. Everyone clones and sets their identity **locally in this repo**:
   ```bash
   git config user.name  "Your Name"
   git config user.email "email-on-your-github-account@example.com"
   ```
   > Commits are attributed by this email. It must match the member's GitHub account.
3. Nobody commits directly to `main`. Each member works on a feature branch and opens a PR.

## Module ownership & branches

| Member | Branch | Owns |
|---|---|---|
| A | `feat/foundation-auth` | `prisma/`, `src/lib/auth/*`, `src/lib/api/*`, `src/middleware.ts`, `src/app/login`, `src/app/(app)/settings`, `src/app/api/auth`, `src/app/api/settings`, design-system (`components/ui`, `globals.css`) |
| B | `feat/fleet-maintenance` | `src/app/(app)/vehicles`, `src/app/(app)/maintenance`, `src/lib/services/vehicle.service.ts`, `maintenance.service.ts`, matching `validation/`, `src/app/api/vehicles`, `api/maintenance`, `components/three/VehicleModel.tsx` |
| C | `feat/people-dispatch` | `src/app/(app)/drivers`, `src/app/(app)/trips`, `src/lib/services/driver.service.ts`, `trip.service.ts`, matching `validation/`, `src/app/api/drivers`, `api/trips`, `components/DriverLicense3D.tsx` |
| D | `feat/money-insight` | `src/app/(app)/dashboard`, `src/app/(app)/fuel`, `src/app/(app)/reports`, `src/lib/services/{dashboard,report,fuel,expense}.service.ts`, matching `validation/`, `src/app/api/{dashboard,reports,fuel,expenses}`, `components/three/FleetGlobe.tsx` |

## Per-member loop
```bash
git checkout main && git pull
git checkout -b feat/<your-module>

# stage only your files, commit in small logical chunks (every 20–30 min)
git add <your files>
git commit -m "feat(vehicles): add registry table + form modal"

git push -u origin feat/<your-module>
# open a Pull Request into main; a teammate reviews and merges
```

## Suggested commit sequence (per member, small commits)
- **A:** schema + migration → auth/session/RBAC → API wrapper + error handling → login page → settings/RBAC UI → design system.
- **B:** vehicle service + validation → vehicle API → registry page → 3D vehicle → maintenance service/API → maintenance page.
- **C:** driver service + validation → driver API → drivers page → 3D licence → trip service (rules) → trip API → dispatcher page.
- **D:** dashboard service/API → dashboard UI + globe → fuel/expense service/API → fuel page → report service/API → reports + CSV.

Keep PRs small, review each other's, and sync with `main` often to avoid conflicts.
