# Revzion CogniviaERP
## Multi-Tenant Education ERP Platform Architecture

A scalable ERP platform supporting:
- Schools
- Colleges
- Madrasas
- Coaching Institutes
- Hybrid Religious + Modern Institutions

Designed as a configurable SaaS multi-organization system.

---

# 1. Platform Hierarchy

System structure:

Creator (Platform Owner)
└── Organizations
└── Institutes / Campuses
└── Users

Example:

Revzion
└── Al Noor Trust
├── Madrasa Campus
└── School Campus

Each institute operates independently inside one organization.

---

# 2. Role-Based Access Control (RBAC)

Default roles:

- Platform Owner
- Organization Owner
- Director
- Principal
- Vice Principal
- Teacher
- Accountant
- Parent
- Student
- Staff

Custom roles supported:

Example:
- Hostel Manager
- Exam Controller
- Hifz Supervisor
- Transport Manager

Database tables:

roles
permissions
role_permission_mapping
user_role_mapping

---

# 3. Multi-Tenant Database Design

Each table must include:

organization_id
institute_id

Example tables:

organizations
institutes
users
students
parents
teachers
attendance
fees
exams
reports
notifications
roles
permissions

Purpose:

Ensures strict data isolation across institutes.

---

# 4. Core ERP Modules (Universal)

## 4.1 Student Lifecycle Management

Features:

- Admission management
- Enrollment tracking
- Class assignment
- Section allocation
- Student promotion
- Transfer certificates
- Student history timeline

---

## 4.2 Academic Structure Engine

Configurable academic hierarchy:

Class
Section
Batch
Semester
Stream
Subject
Electives

Supports:

School structure:

Science
Commerce
Arts

Madrasa structure:

Nazra
Hifz
Alimiyat
Dars-e-Nizami

Implementation rule:

Academic programs must be configurable, never hardcoded.

---

## 4.3 Attendance Engine

Supports:

- Student attendance
- Teacher attendance
- Subject-wise attendance
- Section attendance
- Daily attendance analytics
- Monthly attendance reports

Future support:

Biometric integration
RFID integration
Mobile attendance marking

---

## 4.4 Examination Engine

Supports:

Exam Categories
Marks Schema
Grade Schema
Result Publishing
Report Card Generator
Transcript Generator
Rank Calculation

Custom exam types:

academic
oral
written
memorization

Madrasa-specific tracking:

Surah progress
Ayat memorization
Sabqi tracking
Hifz completion milestones

---

## 4.5 Fees & Finance Engine

Supports:

Admission Fees
Monthly Fees
Transport Fees
Hostel Fees
Library Fees
Exam Fees
Late Fees
Scholarships
Installments

Madrasa-specific support:

Zakat tracking
Sadaqah tracking
Sponsor mapping
Qurbani contributions
Donation ledger

---

# 5. Madrasa Module (Plugin Architecture)

Never hardcode madrasa logic into core ERP.

Structure:

modules/
school/
college/
madrasa/

Madrasa module includes:

Student sponsorship tracking
Hifz progress management
Islamic subject grading
Qurbani management
Waqf accounting
Donor reports

Activated when:

organization_type == madrasa

---

# 6. Organization Customization Engine

Each institute can configure:

Custom Subjects
Custom Fee Types
Custom Roles
Custom Exam Patterns
Custom Certificates
Custom Attendance Rules

Examples:

School:

Midterm
Final

College:

Semester 1
Semester 2

Madrasa:

Sabqi
Para Revision
Hifz Evaluation

---

# 7. Dashboard Intelligence Layer

Dashboard widgets:

Attendance Today %
Fee Collection Today
Pending Fees
Active Students
Inactive Students
Teacher Workload
Exam Performance Trends
Sponsor Coverage Ratio
Donation Summary

Dashboards configurable per role.

Example:

Principal Dashboard
Teacher Dashboard
Accountant Dashboard
Parent Dashboard

---

# 8. Reports Engine

Critical ERP selling component.

Reports supported:

Student Strength Report
Attendance Analytics
Fee Defaulters Report
Sponsor Coverage Report
Subject Performance Report
Teacher Workload Report
Donor Contribution Summary
Exam Ranking Report

Export formats:

PDF
Excel
CSV

---

# 9. Accounts Module

Includes:

Receipts
Vouchers
Contra Entries
Day Book
Ledger
Cash In Hand
Vendor Management
Gateway Status
Qurbani Gateway Status
Animal Data Tracking

Supports:

Multi-account handling
Donation accounting
Institutional finance tracking

---

# 10. Tasks & Events Module

Supports:

Employee Task Assignment
Internal Events
My Tasks
Section Attendance Tasks
Qurbani Completion Tracking
Manage Qurbani Completion

Role-based visibility.

---

# 11. Examination Module

Features:

Start Exam
Manage Exam
Manage Previous Exams
Exam Categories
Marks Entry
Result Publishing
Report Card Generation

Supports:

Custom grading systems

Example:

Percentage
GPA
Grade Bands
Memorization Level Scores

---

# 12. Reports Module

Includes:

Students Reports
Housing Reports
Enrollments Reports
Guardian/Sponsor Reports
Receipts Reports
Vouchers Reports
Vendor Reports
Employee Task Reports

---

# 13. Export Module

Exportable datasets:

Attendance Summary
Attendance Detailed
Students
Enrollments
Fees
Guardians
Receipts
Vouchers
ID Cards
Report Cards

Formats:

PDF
Excel
CSV

---

# 14. Delete Data Module

Controlled deletion access for:

Receipts
Students
Enrollments
Guardians
Vouchers
Contra Entries

Restricted to admin-level permissions.

---

# 15. Parent Portal (Future Module)

Features:

Attendance Alerts
Fee Reminders
Exam Results
Homework Updates
Announcements
Leave Requests

Improves engagement and retention.

---

# 16. Teacher Portal (Future Module)

Features:

Attendance Marking
Homework Upload
Marks Entry
Student Feedback
Class Notes
Lesson Planning

---

# 17. Notification Engine

Channels:

SMS
Email
Push Notifications
WhatsApp (future)

Triggers:

Attendance Missing
Fee Due
Exam Result Published
Announcement Posted

---

# 18. Multi-Institute Support

Example structure:

Organization
├── School Campus
├── Madrasa Campus
└── College Campus

Shared:

Users
Finance
Reports

Separated:

Students
Attendance
Exams

---

# 19. Custom Role Builder

Admin can create:

Role Name
Designation
Permission Scope

Examples:

Transport Manager
Hostel Warden
Library Admin
Hifz Supervisor

---

# 20. Product Positioning Strategy

Product Name:

Revzion EduCore

Tagline:

Unified ERP for Schools, Colleges & Madrasas

Modes:

School Mode
College Mode
Madrasa Mode
Hybrid Mode

Hybrid mode supports institutions running both religious and modern curriculum.

---

# 21. Recommended Future Additions

Mobile Apps:

Parent App
Teacher App
Admin App

Integrations:

Biometric Devices
Payment Gateways
WhatsApp API
LMS Systems
Online Classes

Analytics:

Performance prediction
Dropout risk detection
Fee default forecasting
Student engagement scoring

# 22. Settings Module (Core Configuration Layer)

Central control panel for platform-level and institute-level configuration.

Includes:

General Settings
Plan & Usage
User Role & Management
Course Structure
Class Structure
Batch Management
Section Management
Academic Year Engine
Master Data Configuration
Student Profile Master
Email & SMS Configuration

---

# 22.1 General Settings

Controls institute-level configuration.

Includes:

Institute Name
Institute Type (School / College / Madrasa / Hybrid)
Timezone
Language
Currency
Logo Upload
Address Details
Contact Information

Optional:

Theme Selection
Report Header Customization
Certificate Branding

---

# 22.2 Plan & Usage Module

Supports SaaS subscription enforcement.

Tracks:

Active Users Count
Student Limit
Teacher Limit
Storage Usage
SMS Credits
Email Credits
API Usage

Plan types example:

Starter
Standard
Professional
Enterprise

Controls:

Feature Access
Institute Limits
Module Permissions
Export Limits
Analytics Access

Example:

Starter Plan:

Attendance
Students
Fees

Enterprise Plan:

Attendance
Fees
Analytics
Sponsor Tracking
Donor Ledger
Advanced Reports
Mobile App Access

---

# 22.3 User Role & Management

Implements Role-Based Access Control (RBAC).

Features:

Create Role
Edit Role
Assign Permissions
Assign Users to Roles
Department-level Access Control

Permission categories:

Student Management
Attendance
Fees
Accounts
Reports
Exam Control
Settings Access

Example:

Teacher Role:

Mark Attendance
Upload Marks
View Students

Accountant Role:

Manage Fees
Generate Receipts
Access Ledger

Principal Role:

Full Academic Access
Reports Dashboard
Staff Monitoring

---

# 22.4 Course Module

Defines educational programs.

Examples:

Science
Commerce
Arts
Alimiyat
Hifz
Nazra
Dars-e-Nizami

Course contains:

Subjects
Duration
Evaluation Type
Credit Structure
Exam Pattern

Supports:

Multi-course institutes
Parallel curriculum institutes

---

# 22.5 Class Module

Defines class hierarchy inside courses.

Examples:

Grade 1
Grade 2
Year 1
Year 2
Hifz Level 1
Hifz Level 2

Class attributes:

Course Mapping
Section Count
Class Teacher Assignment
Subject Allocation

---

# 22.6 Batch Module

Batch represents session grouping.

Examples:

2024 Batch
2025 Batch
Morning Batch
Evening Batch
Ramadan Special Batch

Supports:

Parallel teaching groups
Flexible timetable assignment
Shift-based institutions

---

# 22.7 Section Module

Defines subdivisions within classes.

Examples:

Class 5A
Class 5B
Hifz Section A
Science Section Red

Supports:

Separate attendance
Separate exam evaluation
Separate teacher assignment

---

# 22.8 Academic Year Module

Controls academic session lifecycle.

Examples:

2023–2024
2024–2025

Features:

Session Activation
Session Locking
Promotion Processing
Historical Data Archiving
Report Filtering by Session

Supports:

Multi-session reporting
Student promotion automation

---

# 22.9 Master Data Module

Central reusable configuration repository.

Includes:

Subject Master
Department Master
Designation Master
Religion Categories
Nationality Categories
Transport Routes
Hostel Blocks
Fee Categories

Purpose:

Avoid duplicate manual entries
Maintain consistent taxonomy

---

# 22.10 Student Profile Master

Controls student data schema dynamically.

Admin can configure:

Custom Fields
Mandatory Fields
Optional Fields
Dropdown Values
Document Upload Fields

Example fields:

Passport Number
Aadhar Number
Guardian Occupation
Sponsor Name
Previous School
Hifz Status
Medical Notes

Supports:

Country-specific compliance
Religious institution requirements
Government reporting needs

---

# 22.11 Email & SMS Module

Communication infrastructure layer.

Supports:

SMTP Configuration
SMS Gateway Integration
Template Management
Bulk Messaging
Event-based Notifications

Trigger-based messaging:

Admission Confirmation
Attendance Alerts
Fee Due Reminder
Exam Result Published
Holiday Announcement

Template example:

"Dear {ParentName}, {StudentName} was absent today."

Supports:

Email Templates
SMS Templates
WhatsApp-ready template structure (future-ready)

Credit tracking:

SMS Usage
Email Usage
Gateway Status Monitoring