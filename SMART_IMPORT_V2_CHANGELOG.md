# Smart Import V2

## Behavior
- Existing crew is matched before insert using: Crew ID -> NIK/KTP -> Passport -> Seaman Book -> Name + DOB.
- Passport and Seaman Book matching is normalized (spaces/hyphens/case do not create false duplicates).
- A returning/rejoining crew updates the existing Crew Master record instead of creating a new person.
- Ambiguous identity matches are held as CONFLICT and are not injected automatically.
- New people are appended.
- Existing rows are not deleted or globally replaced.
- Lifecycle changes are logged to `Crew Employment History`.

## Important
- This package modifies staging/source only. No deployment is performed.
- Before production deployment, test: new crew, exact re-import, passport format variation, finish/broken -> rejoin, changed passport, and ambiguous matches.
