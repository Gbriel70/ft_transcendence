Based on the provided PDF content, here is the extracted and cleaned context optimized for LLM usage:

# Project: Transcendence

## **Project Overview**
- **Title:** Transcendence
- **Type:** Final Common Core group project (4-5 people)
- **Goal:** Create a real-world web application to boost creativity, self-confidence, adaptability to new technologies, and teamwork.
- **Core Concept:** Undertaking tasks you have never done before. A step forward in the computer science journey.

## **Project Structure**
The project is divided into two parts:
1.  **Mandatory Part:** Fixed core that every team member must contribute to.
2.  **Modules:** A set of optional modules that count toward the final grade. Teams must earn **14 points** in total (Major module = 2 points, Minor module = 1 point).

---

## **AI Instructions & Guidelines (Chapter I)**
### **Context & Philosophy**
- AI can assist with many tasks (code, documentation, ideas, explanations).
- **Crucial:** Always approach AI with caution and critically assess results. You can never be completely sure questions are well-formed or content is accurate.
- Peers are a valuable resource to avoid mistakes and blind spots.

### **Main Message & Learner Rules**
- **Use AI to reduce repetitive or tedious tasks.**
- Develop prompting skills (coding and non-coding) for your career.
- Learn how AI systems work to anticipate risks, biases, and ethical issues.
- Continue building technical and interpersonal (power) skills with peers.
- **Only use AI-generated content that you fully understand and can take responsibility for.**

**Key Rules for Learners:**
1.  Explore AI tools to use them ethically and reduce bias.
2.  Reflect on problems before prompting to write clearer, more detailed prompts.
3.  Develop a habit of systematically checking, reviewing, questioning, and testing AI-generated content.
4.  **Always seek peer review**—don't rely solely on your own validation.

**Good Practice Example:** Ask AI for ideas (e.g., "How do I test a sorting function?"), try them, then review results with a peer to refine the approach together.

**Bad Practice Example (Leads to Failure):** Ask AI to write a whole function, copy-paste it, then be unable to explain it during peer evaluation.

---

## **Team Organization & Project Management (Chapter II)**
### **Required Team Roles**
Teams must assign these roles (one person can have multiple roles in a 4-person team):
- **Product Owner (PO):** Defines vision, prioritizes features, maintains backlog, validates work, communicates with stakeholders.
- **Project Manager (PM) / Scrum Master:** Facilitates coordination, organizes meetings, tracks progress, manages risks.
- **Technical Lead / Architect:** Oversees technical decisions, defines architecture, ensures code quality.
- **Developers (all members):** Implement features, write code, participate in reviews, test, document.

**Team Size:**
- **4 people:** Some members have multiple roles.
- **5 people:** Roles can be more specialized.

*All roles must be clearly documented in `README.md`.*

### **Recommended Project Management Practices**
- Regular communication (weekly/bi-weekly syncs).
- Task organization (GitHub Issues, Trello, shared docs).
- Work breakdown into manageable tasks.
- Code reviews for important changes.
- Documentation of decisions.
- Dedicated communication channel (Discord, Slack).

*During evaluation, the team must explain role distribution, work organization, communication, and individual contributions.*

---

## **Mandatory Part - General & Technical Requirements (Chapter III)**
### **General Requirements (Non-Negotiable)**
1.  Must be a **web application** with frontend, backend, and database.
2.  **Git** with clear commits from all members, showing proper work distribution.
3.  **Deployment** using containerization (Docker, Podman) with a single-command run.
4.  Compatibility with latest stable **Google Chrome**.
5.  No warnings/errors in browser console.
6.  Accessible **Privacy Policy** and **Terms of Service** pages with relevant content (not placeholders).
7.  **Multi-user Support:** Must support multiple simultaneous users with proper concurrency handling, real-time updates, and no data corruption.

### **Technical Requirements**
- **Frontend:** Clear, responsive, accessible. Use a CSS framework (Tailwind, Bootstrap, etc.).
- **Backend:** HTTPS must be used everywhere.
- **Security:** Store credentials in `.env` file (ignored by Git), provide `.env.example`.
- **Database:** Clear schema with well-defined relations.
- **User Management:** Basic system with secure sign-up/login (email/password, hashed & salted). Additional methods (OAuth, 2FA) via modules.
- **Validation:** All forms/user inputs validated on frontend and backend.

**Definition of a Framework:** For this project, a framework provides structured architecture, built-in features for common tasks (routing, state management), and a complete ecosystem.
- *Examples:* React, Vue, Angular, Express, NestJS, Django.
- *Not Frameworks:* jQuery, Lodash, Axios (libraries).

---

## **Modules (Chapter IV)**
Teams must earn **14 points** from these categories. Plan carefully as some modules have dependencies.

### **Category List & Key Dependencies**
- Web
- Gaming and User Experience
- Accessibility and Internationalization
- DevOps
- User Management
- Data and Analytics
- Artificial Intelligence
- Blockchain
- Cybersecurity
- Modules of Choice (Custom)

**Critical Dependencies:**
- Gaming modules (AI Opponent, Tournament, etc.) require at least **one implemented game** first.
- Game Statistics module requires a game.
- Advanced Chat features require the basic chat from "User Interaction" module.
- SSR is **incompatible** with ICP blockchain backend.
- During evaluation, only **fully functional** modules count. Non-functional = 0 points.

### **Selected Module Examples**
*(See PDF pages 13-21 for the complete, detailed list of all Major and Minor modules)*

**IV.1 Web**
- *Major (2pts):* Use frameworks for both frontend & backend.
- *Major (2pts):* Implement real-time features (WebSockets).
- *Major (2pts):* User interaction system (basic chat, profiles, friends).
- *Minor (1pt):* Use an ORM.
- *Minor (1pt):* Server-Side Rendering (SSR).

**IV.2 Accessibility & Internationalization**
- *Major (2pts):* Complete WCAG 2.1 AA compliance.
- *Minor (1pt):* Support for at least 3 languages (i18n).

**IV.3 User Management**
- *Major (2pts):* Standard user management (profiles, avatars, friends, online status).
- *Major (2pts):* Advanced permissions system (CRUD, roles).
- *Minor (1pt):* OAuth 2.0 (Google, GitHub, 42).
- *Minor (1pt):* 2FA system.

**IV.4 Artificial Intelligence**
- *Major (2pts):* AI Opponent for games (requires a game, must be challenging).
- *Major (2pts):* Complete RAG (Retrieval-Augmented Generation) system.
- *Major (2pts):* Complete LLM system interface (text/image generation).
- *Minor (1pt):* Content moderation AI.

**IV.6 Gaming & User Experience**
- *Major (2pts):* Implement a complete web-based game (real-time multiplayer like Pong, Chess).
- *Major (2pts):* Remote players (2 players on separate computers).
- *Major (2pts):* Multiplayer for 3+ players.
- *Minor (1pt):* Tournament system.
- *Minor (1pt):* Game customization (power-ups, maps, themes).
- *Minor (1pt):* Spectator mode.

**IV.10 Modules of Choice**
- *Major (2pts)/Minor (1pt):* Implement a custom module not listed. Requires justification in README.md explaining value, technical challenges, and complexity.

---

## **Project Ideas & Examples (Chapter V)**
### **Example: Pong Game (14-point plan)**
- Gaming: Web-based game (2) + Remote players (2) + Tournament (1) + Customization (1) = **6**
- User Management: Standard (2) + OAuth (1) = **3**
- Web: Frameworks (2) + ORM (1) = **3**
- AI: AI Opponent (2) = **2**
- **Total: 14 points**

### **Project Categories & Ideas**
1.  **Gaming Projects:** Multiplayer Pong, Online Chess, Card Game Arena, Battle Royale, Trivia Platform.
2.  **Social & Collaborative:** Social Network, Collaborative Workspace, Forum, Event Management, Learning Management System.
3.  **Creative & Media:** Music Streaming, Video Sharing, Art Gallery, Blogging Platform, Recipe Sharing.
4.  **Productivity & Tools:** Task Management, Code Collaboration, Booking System, Marketplace, Fitness Tracker.
5.  **Specialized:** Real-time Trading Simulator, Language Learning, Pet Adoption, Travel Planning, Crowdfunding.

*Choose a project that interests the team, allows 14+ points, demonstrates technical complexity, and has coherent module combinations.*

---

## **README Requirements (Chapter VI)**
A comprehensive `README.md` is **critical** for evaluation. Must include:

1.  **First Line:** *"This project has been created as part of the 42 curriculum by <login1>[, <login2>...]."*
2.  **Description:** Project name, goal, overview.
3.  **Instructions:** Prerequisites, step-by-step setup/execution, `.env` configuration.
4.  **Resources:** References (docs, articles) **and a description of how AI was used** (specify tasks and project parts).
5.  **Team Information:** Each member's role(s) and responsibilities.
6.  **Project Management:** How work was organized, tools used (GitHub Issues, Trello), communication channels.
7.  **Technical Stack:** Frontend/Backend tech, database choice with justifications.
8.  **Database Schema:** Visual/description of structure and relationships.
9.  **Features List:** All implemented features with responsible members.
10. **Modules:** List of chosen modules with point calculation, justification, implementation details, and responsible members.
11. **Individual Contributions:** Detailed breakdown per member, challenges overcome.

---

## **Submission & Peer-Evaluation (Chapter VII)**
- Submit work in Git repository. Only repository content is evaluated.
- **Be prepared for a live modification** during evaluation (e.g., minor behavior change, few lines of code). This verifies actual understanding and should be feasible in minutes.
- Details of any modification task will be in the evaluation guidelines.

### **Key Takeaways for LLM Context:**
- This is a **capstone web development project** with strict mandatory requirements and a modular points system.
- **Team structure and project management** are formally assessed.
- The **14-point module system** allows for creative specialization but requires careful planning due to dependencies.
- The **README is a core deliverable** and must comprehensively document the project, team process, and AI usage.
- **Evaluation includes a practical, live coding component** to verify understanding.
