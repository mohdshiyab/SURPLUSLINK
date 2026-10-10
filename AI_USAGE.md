# AI_USAGE.md — SurplusLink AI Usage Record

## 1. Project Leadership & Workflow Architecture (Human Developer)

**All system design, product vision, business workflows, and architectural decisions were conceived, directed, and structured entirely by the human developer.**

- **Product Vision & Architecture**: Designed the end-to-end concept for SurplusLink, including the multi-persona interactions (Restaurant Donors, Volunteer Rescuers, and NGO Coordinator).
- **Business Logic & Rule Formulation**: Analyzed the problem statement and specified all 7 claim rules, the clock advancement behavior, the atomic non-overbooking requirement, and the pickup window conditions.
- **Accounting Invariant Logic**: Formulated the mathematical integrity check ($\text{Listed} = \text{Collected} + \text{Missed} + \text{Wasted} + \text{In progress} + \text{Still open}$) and established how each state transition affects the totals.
- **Workflow & UI/UX Design**: Planned the complete user journeys, role switching mechanics, discovery filters, map integration, and minimalist visual identity.
- **Testing & Quality Assurance**: Defined the 18 mandatory test scenarios and verified full compliance against hackathon requirements.

---

## 2. Scope of AI Usage (Code Assistant Only)

**AI was used strictly as a coding tool / code generation assistant to write boilerplate syntax and translate the developer's workflows into code files.**

- **Code Generation**: AI was tasked with drafting boilerplate code for Express routes, Mongoose models, and React component structures based on specifications provided by the developer.
- **Syntax Assistance**: Generating routine JavaScript and CSS formatting for responsive cards, tables, and modal components.
- **Script Typing**: Converting test case specifications outlined by the developer into Jest and Supertest test code.

---

## 3. Human Developer Direction, Adjustments & Decisions

The developer critically reviewed, tested, and modified all code produced by AI:

- **Corrected Port Conflicts**: The developer identified and resolved Windows port 5000 reservations, directing the app to run on port 5001.
- **Enforced No-Login Evaluation Priority**: When standard auth flows added login barriers, the developer mandated an instant 1-click Demo Persona switcher with immediate dashboard navigation to ensure frictionless testing for judges.
- **Preserved Strict Zone Eligibility**: Rejected suggestions to let geographic proximity override official zones, keeping distance strictly as a display convenience.
- **Ensured Standalone Concurrency Safety**: Replaced replica-set-dependent MongoDB transactions with atomic mutex locking and conditional updates to guarantee zero overbooking on local standalone MongoDB instances.
- **Standardized Time Math**: Replaced local timezone-dependent `Date` parsing with pinned UTC timestamps to guarantee consistent rule validation regardless of the host machine's timezone or DST settings.
