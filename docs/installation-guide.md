# EHR Module Simulator - Installation Guide

This guide walks you through downloading, installing, and signing in to the EHR Module Simulator on a Windows computer. No technical background is required.

---

## Step 1: Download the Installer

1. Go to the [Releases page](https://github.com/cbgabler/ehr-module-simulator/releases/latest) on GitHub
2. Under **Assets**, click **`EHR Module Simulator-1.0.0 Setup.exe`** to download it
3. Wait for the download to finish - the file will appear in your **Downloads** folder

---

## Step 2: Install the App

1. Open your **Downloads** folder and double-click **`EHR Module Simulator-1.0.0 Setup.exe`**

2. **Windows SmartScreen warning** - you may see a blue screen that says *"Windows protected your PC."* This is expected for software that hasn't been commercially signed. To continue:
   - Click **"More info"**
   - Click **"Run anyway"**

   > This warning appears because the app is not yet signed with a commercial certificate. It is safe to proceed.

3. The installer will run automatically. You do not need to click through any additional steps - when it finishes, the app will launch on its own.

4. A shortcut named **EHR Module Simulator** will be added to your Desktop and Start Menu for future use.

---

## Step 3: Sign In

When the app opens you will see the sign-in screen.

### Default Accounts

Two accounts are created automatically the first time the app launches:

| Role | Username | Password |
|---|---|---|
| Instructor | `instructor1` | `password123` |
| Student | `student1` | `password123` |

> **Important:** These are shared demo accounts. If your team is setting the app up for real use, instructors should create individual accounts and avoid using the defaults for actual student work.

### Creating a New Account

1. On the sign-in screen, click **"Register"**
2. Enter a username, password, and select a role (Student or Instructor)
3. Click **"Create Account"** - you will be signed in automatically

---

## Step 4: What to Do First

### If you are an **Instructor**

- Head to the **Home** page to view available scenarios
- Click **Create Scenario** to build your own, or use one of the pre-loaded example scenarios
- Go to **Quizzes** to create assessments and assign them to specific students

### If you are a **Student**

- Head to the **Home** page and click **Start Simulation** on any available scenario
- After a simulation ends, your session summary is saved automatically - find it at the bottom of the Home page under **My Session Summaries**
- Go to **Quizzes** to complete any quizzes assigned to you

---

## Uninstalling the App

1. Open **Settings** → **Apps** (Windows 10/11)
2. Search for **EHR Module Simulator**
3. Click it and select **Uninstall**

> Your local database (scenarios, users, quiz data) is stored at:
> `C:\Users\<YourName>\AppData\Roaming\ehr-module-simulator\`
> Uninstalling the app does **not** delete this folder. Delete it manually if you want to remove all data.

---

## Troubleshooting

**The app won't open after installation**
- Try launching it from the Start Menu by searching for "EHR Module Simulator"
- If it still doesn't open, try reinstalling using the same `.exe`

**I see a blank white screen when the app launches**
- Close and reopen the app - this occasionally happens on the very first launch while the database initializes

**I forgot my password**
- Ask your instructor or an admin user to delete your account and create a new one
- There is no self-service password reset at this time

**My scenario or quiz data is missing after reinstalling**
- Reinstalling does not delete your data. If data is missing, check that you are signed in to the same account as before.

---

## System Requirements

| | Minimum |
|---|---|
| OS | Windows 10 (64-bit) or later, macOS 10.15 (Catalina) or later |
| RAM | 4 GB |
| Disk Space | 400 MB |
| Internet | Not required - the app runs fully offline |
