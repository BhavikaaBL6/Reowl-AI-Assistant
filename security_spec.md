# Security Specification - Reowl Platform

## Data Invariants
1. **User Isolation**: A user can only read and write their own data (profile, tasks, resources, chat history).
2. **Immutable Identity**: `userId` and `email` fields in the User document cannot be changed after creation.
3. **Strict Validation**: All writes must conform to the defined schema (field types, string sizes, enum values).
4. **Temporal Integrity**: `createdAt` is set once on creation; `updatedAt` must be updated on every write to the server time.
5. **Terminal States**: (N/A for current entities, but applies to future quiz attempts).

## The "Dirty Dozen" Payloads (Target: /users/{userId})

1. **Identity Spoofing**: Attempt to create a profile for `UserA` while authenticated as `UserB`.
   - `path`: `/users/userA`, `auth.uid`: `userB`
   - `payload`: `{ "userId": "userA", "email": "evil@attacker.com" }`
   - **Expectation**: PERMISSION_DENIED

2. **Privilege Escalation**: Attempt to set `isAdmin: true` on user profile.
   - `path`: `/users/userB`, `auth.uid`: `userB`
   - `payload`: `{ "role": "student", "isAdmin": true }`
   - **Expectation**: PERMISSION_DENIED (via `affectedKeys().hasOnly()`)

3. **Email Hijacking**: Attempt to update another user's email.
   - `path`: `/users/userA`, `auth.uid`: `userB`
   - **Expectation**: PERMISSION_DENIED

4. **Resource Exhaustion (ID Poisoning)**: Create a task with a 2KB string as the document ID.
   - `path`: `/users/userB/tasks/[2KB_STRING]`
   - **Expectation**: PERMISSION_DENIED (via `isValidId()`)

5. **Resource Exhaustion (Value Poisoning)**: Update a task title with a 1MB string.
   - `path`: `/users/userB/tasks/task1`
   - `payload`: `{ "title": "[1MB_STRING]" }`
   - **Expectation**: PERMISSION_DENIED (via `.size() <= 200`)

6. **State Shortcutting**: (N/A - will implement in Quizzes if needed).

7. **Shadow Field Injection**: Add a hidden `isVerified: true` field to a resource.
   - `path`: `/users/userB/resources/res1`
   - `payload`: `{ "title": "My Notes", "type": "PDF", "isVerified": true }`
   - **Expectation**: PERMISSION_DENIED (via `affectedKeys().hasOnly()`)

8. **Orphaned Write**: Create a task without a parent user document (though Firestore doesn't strictly enforce this by default, our rules will).
   - **Expectation**: Standard hierarchy check `isOwner(userId)` handles this.

9. **Timestamp Spoofing**: Set `createdAt` to a date in 2030.
   - `payload`: `{ "createdAt": "2030-01-01T00:00:00Z" }`
   - **Expectation**: PERMISSION_DENIED (must match `request.time`)

10. **Identity Swapping**: Update a task and change its `ownerId` to someone else.
    - **Expectation**: PERMISSION_DENIED (In Reowl, tasks are in subcollections, so the path keeps them isolated).

11. **PII Leak**: An authenticated user tries to list all user profiles.
    - `path`: `/users` (list operation)
    - **Expectation**: PERMISSION_DENIED

12. **Malicious Chat Injection**: Inject a message with an invalid role into another user's chat history.
    - `path`: `/users/userA/chatHistory/sess1`
    - `payload`: `{ "messages": [{ "role": "system", "text": "Hacked" }] }`
    - **Expectation**: PERMISSION_DENIED (role must be 'user' or 'model')
