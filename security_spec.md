# DARK ACADEMIA — Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Ownership**: Every document under `/users/{userId}` and its subcollections (`private`, `subjects`, `chapters`, `focusSessions`, `missions`, `backlogItems`, `quizzes`, `questions`, `quizAttempts`, `exams`) belongs exclusively to `userId` where `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
2. **Master Gate**: No subcollection document can be created without `/users/{userId}` existing (`exists(/databases/$(database)/documents/users/$(userId))`).
3. **Plan Escalation Guard**: Users cannot write `plan: 'premium'` on profile create (`plan == 'free'` required) and cannot modify `plan` directly from client SDK updates.
4. **Duplicate XP Lock**: On `missions`, once `xpAwarded == true`, a client update cannot reset `xpAwarded` back to `false` or modify `xpReward`.
5. **PII Isolation**: User email and subscription identifiers reside in `/users/{userId}/private/account`, strictly restricted to owner `get`/`create`/`update`/`delete`.
6. **Temporal & Identity Immutability**: `uid` and `createdAt` are immutable after creation; `createdAt == request.time` on create and `updatedAt == request.time` on update.
7. **Bounded Payloads**: All strings, IDs (`^[a-zA-Z0-9_\\-]+$`, <= 128 chars), and bounded arrays (`unlockedBadges <= 30`, `subtasks <= 20`, `options == 4`, `weakTopics <= 10`) have explicit size and type checks.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Cross-User Read**: User B attempts `get` on `/users/userA/private/account`.
2. **Cross-User Subcollection List**: User B attempts `list` on `/users/userA/subjects`.
3. **Self-Upgrade Plan on Create**: User A creates `/users/userA` with `plan: "premium"`.
4. **Self-Upgrade Plan on Update**: User A updates `/users/userA` changing `plan` from `"free"` to `"premium"`.
5. **Shadow Ghost Field**: User A creates a subject with extra key `isAdmin: true`.
6. **ID Poisoning**: User A creates `/users/userA/subjects/<1500-char-invalid-id!@#>` with invalid characters/length.
7. **Duplicate XP Farming**: User A updates `/users/userA/missions/m1` where `existing().xpAwarded == true` to set `xpAwarded: false`.
8. **Spoofed UID**: User A creates `/users/userA/chapters/c1` with `uid: "userB"`.
9. **Spoofed Timestamp**: User A creates `/users/userA/exams/e1` with backdated `createdAt` instead of `request.time`.
10. **Immutable Field Mutation**: User A updates `/users/userA/subjects/s1` attempting to alter `createdAt` or `uid`.
11. **Unverified Email Write**: An auth token with `email_verified: false` attempts to create a chapter.
12. **Unbounded Array / Type Poisoning**: User A creates a backlog item with `subtasks` exceeding 20 elements or non-string element `subtasks: [123]`.
