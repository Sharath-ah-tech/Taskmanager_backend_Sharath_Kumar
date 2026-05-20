# TaskManager Application

This is a digital office assistant that helps the teams organize their work, track tasks, and communicate effectively

# Backend

## Set Up 

* Step-1 Get the code 
  #Clone the repository (download the code)
  git clone https://github.com/Sharath-ah-tech/Taskmanager_backend_Sharath_Kumar.git

  #Go into the project folder
  cd Taskmanager_backend_Sharath_Kumar
  cd backend

* Step 2: Create a Virtual Environment (Isolated workspace)
  python -m venv venv
  venv\Scripts\activate

* Step 3: Install Required Packages
  Step 3: Install Required Packages

* Set Up the Database
  CREATE DATABASE taskmanager_db;
  CREATE USER 'taskmanager_user'@'localhost' IDENTIFIED BY 'Sharath@2k5';
  GRANT ALL PRIVILEGES ON taskmanager_db.* TO 'taskmanager_user'@'localhost';
  FLUSH PRIVILEGES;

* Create environment file (.env) in the backend folder:
  SECRET_KEY=your-super-secret-key-here
  DEBUG=True

# Database Settings
  DB_NAME=taskmanager_db
  DB_USER=taskmanager_user
  DB_PASSWORD=Sharath@2k5
  DB_HOST=localhost
  DB_PORT=3306

# Google OAuth (for Google Login)
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (for GitHub Login)
  GITHUB_CLIENT_ID=your-github-client-id
  GITHUB_CLIENT_SECRET=your-github-client-secret

* Step 5: Run Database Migrations
  python manage.py makemigrations
  python manage.py migrate
  python manage.py runserver

## About 

* User Management
  Create account - Sign up with email and password

  Login system - Secure login with email/password

  Google Login - Sign in with your Google account

  GitHub Login - Sign in with your GitHub account

  Password reset - Forgot password? Get a reset link via email

* Group Management

  Create teams - Make different groups for different projects

  Add members - Invite people to join your group

  Assign roles - Make someone admin or regular member

  Remove members - Remove people from your group

* Task Management

  Create tasks - Add new tasks with title, description, due date

  Track status - Mark tasks as To Do, In Progress, Done, or Cancelled

  Assign tasks - Assign tasks to specific team members

  Add comments - Discuss tasks by adding comments

  Upload files - Attach files to tasks (images, PDFs, etc.)

* Notifications

  Get alerts - Receive notifications when tasks are created or assigned

  Read/Unread - Mark notifications as read or unread

  Real-time updates - Get instant notifications (with WebSocket setup)
