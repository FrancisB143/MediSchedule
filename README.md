# DocTime - Hospital Management System

## 🎯 System Purpose

DocTime is a comprehensive hospital management system designed to streamline healthcare operations and improve workforce coordination. The system facilitates efficient scheduling, leave management, and shift coordination for medical staff while providing administrators with powerful tools to manage hospital resources and personnel.

The platform addresses key challenges in hospital operations:
- **Schedule Management**: Automated roster generation and shift assignments
- **Staff Coordination**: Seamless shift swapping between doctors
- **Leave Administration**: Structured leave request and approval workflow
- **Resource Oversight**: Centralized staff directory and operational insights
- **Data Analytics**: Monthly statistics and performance tracking

Built with modern web technologies, DocTime ensures secure authentication, real-time updates, and an intuitive user experience for all stakeholders.

---

## 👥 User Roles and Functions

### 🩺 Doctor Functions

Doctors have access to self-service features that empower them to manage their schedules and coordinate with colleagues:

#### My Schedule
- View assigned shifts with date, time, and department information
- Access upcoming and past shift history
- See detailed shift assignments including duration and location
- Receive notifications for schedule changes

#### Leave Requests
- Submit leave requests with start date, end date, and reason
- Track request status (pending, approved, rejected)
- View leave balance and history
- Receive notifications on request approvals or rejections
- Attach supporting documentation when required

#### Shift Swap
- Initiate shift swap requests with other doctors
- Browse available shifts for swapping
- View incoming swap requests from colleagues
- Accept or decline swap proposals
- See swap history and status updates

#### Monthly Statistics
- View personal performance metrics
- Track total hours worked per month
- See shift completion rates
- Monitor leave days taken
- Analyze work patterns and trends

---

### 👔 Admin Functions

Administrators have comprehensive oversight and management capabilities to ensure smooth hospital operations:

#### Staff Directory
- View complete list of all doctors and medical staff
- Search and filter by name, specialization, or department
- Access staff contact information and credentials
- Add new doctors to the system
- Update staff information and credentials
- Deactivate or archive staff records
- Export staff data for reporting

#### Roster Generation
- Create automated shift schedules based on:
  - Staff availability
  - Specialization requirements
  - Department needs
  - Fair distribution of shifts
- Generate weekly, monthly, or custom period rosters
- Preview schedules before publishing
- Make manual adjustments to auto-generated rosters
- Publish schedules to notify all assigned doctors
- Handle emergency scheduling and last-minute changes

#### Leave Request Management
- Review all pending leave requests
- Approve or reject requests with comments
- View leave calendar across all staff
- Check staffing levels before approving leaves
- Set leave policies and rules
- Generate leave reports and analytics
- Manage leave quotas and entitlements

#### Dashboard & Analytics
- View overall hospital operational metrics
- Monitor staff utilization rates
- Track leave trends and patterns
- See shift coverage status
- Access real-time staffing levels
- Generate comprehensive reports
- Export data for external analysis

#### System Administration
- Manage user accounts and permissions
- Configure system settings and preferences
- Set up departments and specializations
- Define shift types and durations
- Maintain data security and backups
- Monitor system health and performance

---

## 🔐 Security & Access Control

Both user types benefit from:
- Secure JWT-based authentication
- Role-based access control (RBAC)
- Password encryption using bcrypt
- Session management and timeout
- Audit logging for critical actions
- Data privacy compliance
