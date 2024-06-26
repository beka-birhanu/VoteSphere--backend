# Use Case: VoteSphere

## Actors:
- User (Admin): An administrator with full access to the VoteSphere features.
- User (Member): A regular member with limited access to the VoteSphere features.

## Use Case 1: User Registration
### Scenario:
- The User (Admin or Member) navigates to the VoteSphere registration page.
- The system prompts the user to enter a unique username, email, and a strong password, and choose their role (admin or member).
- The User provides the required information and submits the registration form.

### Alternative Flow (Validation Error):
- If the chosen username is not unique or the password does not meet the requirements, the system displays an error message, and the user is prompted to correct the information.

## Use Case 2: User Login
### Scenario:
- The User (Admin or Member) navigates to the VoteSphere login page.
- The system prompts the user to enter their username and password.
- The User provides valid credentials and submits the login form.
- The system validates the credentials, generates a JWT token, and establishes a secure session.

### Alternative Flow (Invalid Credentials):
- If the provided credentials are invalid, the system displays an error message, and the user is prompted to retry.

## Use Case 3: User Logout
### Scenario:
- The User (Admin or Member) navigates to the VoteSphere logout option.
- The system terminates the user's session, invalidates the JWT token, and logs the user out.

## Use Case 4: Admin Creates a Group
### Preconditions:
- The User is logged in with Admin privileges.

### Scenario:
- The Admin navigates to the Group Management section.
- The system allows the Admin to create a new group by providing a group name if they did not create a group before (one admin can create only one group).
- The Admin submits the form to create the group.

### Alternative Flow (Limitation for Member Role):
- If a Member attempts to create a group, the system displays an error message indicating insufficient privileges.
- If an Admin attempts to create a group while having a group already created, the system displays an error message indicating they can only have one group.

## Use Case 5: Admin Manages Group Members
### Preconditions:
- The User is logged in with Admin privileges.

### Scenario:
- The Admin navigates to the Group Management section.
- The Admin has the option to add or remove members.

### Alternative Flow (Limitation for Member Role):
- If a Member attempts to add or remove members from a group, the system displays an error message indicating insufficient privileges.
- If Admin attempts to add a member who is already in another group, the system displays an error message indicating the user can only be a part of one group.

## Use Case 6: Admin Creates a Poll
### Preconditions:
- The User is logged in with Admin privileges.

### Scenario:
- The Admin navigates to the Poll Management section.
- The system allows the Admin to create a new poll by providing a question and multiple-choice options.
- The Admin submits the form to create the poll.

### Alternative Flow (Limitation for Member Role):
- If a Member attempts to create a poll, the system displays an error message indicating insufficient privileges.

## Use Case 7: Admin Deletes a Poll
### Preconditions:
- The User is logged in with Admin privileges.

### Scenario:
- The Admin navigates to the Poll Management section.
- The system displays the list of existing polls.
- The Admin selects a poll and has the option to delete it.
- The Admin confirms the deletion.

### Alternative Flow (Limitation for Member Role):
- If the poll has been voted on, the system shows an error message stating that a voted poll cannot be deleted; they can only be closed.
- If a Member attempts to delete a poll, the system displays an error message indicating insufficient privileges.

## Use Case 8: Admin Closes a Poll
### Preconditions:
- The User is logged in with Admin privileges.

### Scenario:
- The Admin navigates to the Poll Management section.
- The system displays the list of existing polls.
- The Admin selects a poll and has the option to close it.

### Alternative Flow (Limitation for Member Role):
- If a Member attempts to delete a poll, the system displays an error message indicating insufficient privileges.

## Use Case 9: Member Casts Votes to Polls
### Preconditions:
- The User is logged in with Member privileges.

### Scenario:
- The Member navigates to the available polls section within assigned groups.
- The system displays the list of polls within the Member's assigned groups.
- The Member selects a poll and casts their votes on the provided options.

### Alternative Flow (Limitation for Admin Role):
- If a Member attempts to vote on a closed poll, the system shows an error message indicating that they cannot vote on closed polls.
- If a Member attempts to vote on a poll they have already voted on, the system shows an error message indicating that they can only vote once on a poll.

## Notes:
The use cases outline various scenarios for both Admin and Member roles, ensuring that role-based access control is properly enforced throughout the VoteSphere.

