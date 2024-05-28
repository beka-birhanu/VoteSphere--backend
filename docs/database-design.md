# Database Design Documentation

## Overview

This document outlines the database design for VoteSphere, a collaborative voting application that allows users to participate in polls within their groups. The database design focuses on managing users, groups, polls, poll options, and votes.

## Entities

### 1. User

- **Attributes:**
  - `Username` (Primary Key)
  - `Password`
  - `Role` (e.g., Admin, Member)
  - `TokenBlackList`
  - `GroupID` (Foreign Key)

### 2. Group

- **Attributes:**
  - `GroupID` (Primary Key)
  - `GroupName`
  - `AdminUserID` (Foreign Key)

### 3. Poll

- **Attributes:**
  - `PollID` (Primary Key)
  - `Question`
  - `GroupID` (Foreign Key)
  - `IsOpen` (BOOLEAN)

### 4. PollOption

- **Attributes:**
  - `OptionID` (Primary Key)
  - `PollID` (Foreign Key)
  - `OptionText`
  - `NumberOfVotes`

### 5. Vote

- **Attributes:**
  - `VoteID` (Primary Key)
  - `UserID` (Foreign Key)
  - `PollID` (Foreign Key)
  - `OptionID` (Foreign Key)
  - `Timestamp`

## Relationships

- **User-Group Relationship:**

  - A User belongs to one Group.
  - A Group can have multiple Users.

- **Group-Admin Relationship:**

  - A Group is managed by one Admin User.

- **Poll-Group Relationship:**

  - A Poll belongs to one Group.
  - A Group can have multiple Polls.

- **PollOption-Poll Relationship:**

  - Each Poll can have multiple PollOptions (minimum of two).

- **Vote-PollOption Relationship:**

  - Each Vote is associated with one PollOption.

- **User-Poll Relationship:**
  - A User can vote in multiple Polls.
  - A Poll can have multiple Users voting in it.
  - The combination of UserID and PollID in the Vote table must be unique to ensure a user can only vote once per poll.

## Data Types

- `UserID`: `VARCHAR`
- `Username`: `VARCHAR`
- `Password`: `VARCHAR`
- `Role`: `VARCHAR`
- `TokenBlackList`: `LIST OF VARCHAR`
- `GroupID`: `VARCHAR`
- `GroupName`: `VARCHAR`
- `AdminUserID`: `VARCHAR`
- `PollID`: `VARCHAR`
- `Question`: `TEXT`
- `IsOpen`: `BOOLEAN`
- `OptionID`: `VARCHAR`
- `OptionText`: `VARCHAR`
- `NumberOfVotes`: `INT`
- `VoteID`: `VARCHAR`
- `Timestamp`: `TIMESTAMP`
