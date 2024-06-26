# User Registration, Login, and Logout

## 1. User Registration:
- Users can register with a unique username, email, and a strong password.
- The system validates the uniqueness of chosen usernames and emails, and enforces password requirements (e.g., minimum length, special characters).

## 2. User Login:
- Registered users can log in using their credentials (username/email and password).
- JWT token-based authentication is implemented to ensure secure sessions.

## 3. User Logout:
- Users should be able to log out to terminate their sessions and invalidate their JWT tokens.

# Role-Based Access Control (Admin, Member)

## 1. Admin Role:
- Admins have full access to all features, including user, group, and poll management.
- **Group Management:**
  - Can create one group only.
  - Can add and remove members to/from their group.
- **Poll Management:**
  - Can create, update, close, and delete polls within any group.
  - Can delete a poll only if no one has voted on it.

## 2. Member Role:
- Members have limited access compared to admins, focusing on managing polls within assigned groups.
- **Group Management:**
  - Cannot create groups.
  - Cannot add or remove members to/from their group.
- **Poll Management:**
  - Can cast votes on polls within assigned groups.
  - Cannot create, update, or delete polls.

# Additional Notes:
- Password requirements should include criteria such as minimum length, inclusion of special characters, and avoidance of common passwords.

