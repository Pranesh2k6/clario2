# Clario - Feature Summary

## 1. Authentication & User Management
* **Firebase Authentication:** Users can securely sign up, log in, and log out using email and password via Firebase Auth.
* **Persistent Sessions:** User authentication state is managed and persisted across sessions.
* **Database Sync:** Upon successful authentication, user data runs through a synchronization flow (`/api/v1/auth/sync`) to ensure the user exists in the core PostgreSQL database.
* **Profile Management:** The system supports fetching and displaying the user's real profile, including username and calculated experience points (XP).

## 2. Dashboard
* **Dynamic User Profile:** The dashboard greets the user by their actual username and displays their current XP and streak data.
* **Navigation Sidebar:** A comprehensive, responsive sidebar provides access to key sections: Dashboard, Galaxy Map, Mock Tests, Duels, Study Planner, Analytics, and Settings.
* **Quick Start Actions:** A hero section allows users to immediately jump into their learning journey ("Start Learning").
* **Learning Progress Cards:**
    * **Continue Module:** Shows the user's last accessed subject (e.g., Physics) and their progress completion percentage.
    * **Needs Focus:** Highlights the subject where the user has the lowest accuracy (e.g., Chemistry) and recommends practice.
    * **Up Next:** Previews the next scheduled topic (e.g., Math: Calculus) and its estimated completion time.
* **Performance Analytics Preview:** The dashboard includes visualizations for weekly progress (bar chart) and a 28-day study heatmap.

## 3. Galaxy Map (Learning Path)
* **Interactive 3D Navigation:** Users traverse subjects via an interactive, zoom-able map interface representing a galaxy.
* **Spiral Galaxy Visualization:** Subjects are plotted on a mathematically generated 'golden spiral' path with smooth CSS animations.
* **Subject Planets:** Users can click on "subject planets" (e.g., Mathematics, Physics, Chemistry) to view their current progress and mastery level.
* **Chapter Orbits:** Inside a selected subject, chapters are visualized as orbital rings around a central star, indicating hierarchical progression.
* **Module Breakdown:** Selecting a chapter opens a detailed drawer containing categorized learning modules (Learn, Practice, Quiz, Mock Test).

## 4. Duel Arena (Competitive Learning)
* **Real-time Infrastructure:** Built on WebSockets (Socket.io) to support live competitive gameplay between two users.
* **Duel Modes:**
    * **Instant Match:** Users can play against random opponents at their skill level.
    * **Friend Duel:** Users can challenge specific friends using a unique invite code.
    * **Pending Challenges:** Users can view and accept incoming duel requests.
    * **AI Battle:** An offline mode where users train against an AI opponent.
* **Live Match Interface:** A split-screen arena shows the active question, the user's score/status, and the opponent's real-time score/status.
* **Time-based Scoring:** Points are awarded based on both correctness and the speed of the answer.
* **Duel Analysis & Results:** After a match, users see a detailed breakdown including victory/defeat status, XP earned automatically, accuracy percentages across difficulty tiers, and a retrospective review of all questions comparing their answers to the correct ones.

## 5. Mock Tests & Practice
* **Case Archives:** Users can browse through a repository of practice cases and past questions.
* **Detailed Question Interface:** Individual questions feature a clean UI with multiple-choice options, submit functionality, and post-submission explanations.
* **Concept Explanations:** When answering (especially incorrectly), users are provided with root-concept explanations to aid learning.

## 6. Onboarding Flow
* **Subject Selection:** New users are prompted to select their core subjects of interest (e.g., Physics, Chemistry, Math, Biology).
* **Goal Setting:** Users specify their academic goals (e.g., "Ace the boards", "Competitive exams") to tailor the application's recommendation engine.
