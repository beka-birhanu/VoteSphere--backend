# CollaboraTask - Group Task Manager

CollaboraTask is a collaborative task management application that allows users to work together within groups, managing tasks efficiently. The application provides user authentication, authorization, and group-based task management.

## Group Members

1. **[Beka Birhanu Atomsa](https://github.com/beka-birhanu)**

   - ID: UGR/3402/14

2. **[bereket kelay](https://github.com/member1username)**

   - ID: UGR/9587/14

3. **[ephrem mamo tora](https://github.com/Efamamo)**
   - ID: UGR/1504/14
4. **[yohannes alemayehu abdi](https://github.com/yohannesalex)**
   - ID: UGR/2497/14

## Features

- **Authentication and Authorization:**

  - User registration, login, and logout.
  - Role-based access control (e.g., Admin, Member).

- **Group Management:**

  - Create groups and invite members.
  - View and manage tasks within groups.

- **Task Management:**

  - Create tasks within groups with title, description, and status.
  - Assign tasks to specific group members.
  - Update or delete tasks based on user permissions.
  - View a list of tasks within groups.

- **REST API with NestJS:**

  - Modular backend structure with separate modules for authentication, authorization, group management, and task management.
  - JWT token-based authentication.

- **Frontend with Tailwind and Fetch API:**

  - Stylish frontend using Tailwind.
  - TypeScript for organized frontend code.
  - Fetch API for communication with the backend.

- **Database Technology:**

  - Choose SQLite for data storage.

- **Offline Functionality:**
  - The application works locally without an internet connection.

## Justification for SQLite

CollaboraTask utilizes SQLite, a lightweight relational database, for the following reasons:

- **Portability:** SQLite is a serverless, self-contained database, making it highly portable. The database file can be easily moved around with the project without machine dependence.

- **Ease of Integration:** SQLite seamlessly integrates with applications and eliminates the need for a separate database server. This simplicity is advantageous for CollaboraTask's development and deployment.

- **Local Development:** SQLite allows the application to work locally without the need for a dedicated database server. This facilitates a smoother development experience.

By choosing SQLite as the relational database, CollaboraTask aims to take advantage of its portability and simplicity, providing a flexible solution that aligns with the collaborative and dynamic nature of the project.
