# **TAMIL BUSINESS TRIBE**

## **ENTERPRISE DIGITAL BUSINESS ECOSYSTEM**

### **Deep Product Requirement Document**

**Document Series:** Enterprise PRD  
**Volume:** 03  
**Volume Name:** Authentication, User Identity, Onboarding, Personalization and Member Dashboard  
**Version:** 1.0  
**Document Status:** Development Baseline  
**Product Codename:** TBT One  
**Brand Name:** Tamil Business Tribe  
**Primary Surfaces:** Web Application, Mobile Application, Admin Panel  
**Primary Languages:** Tamil, Tanglish, English

---

# **1\. VOLUME PURPOSE**

Indha volume Tamil Business Tribe platform-oda complete user entry and activation system-ai define pannuthu.

Covered areas:

* Account registration  
* Login  
* OTP  
* Email verification  
* Password management  
* Social login  
* Session management  
* Device management  
* User identity  
* Profile management  
* Role management  
* User onboarding  
* Goal assessment  
* Personalization  
* Recommended roadmap  
* Member dashboard  
* Quick actions  
* Progress summary  
* Daily actions  
* Membership visibility  
* Account status  
* Suspicious-login handling  
* Account recovery  
* Account deletion  
* Authentication analytics  
* Admin identity operations

Indha volume frontend, backend, mobile, security, database, product, UI/UX, QA and admin teams-ku implementation source of truth-aa use pannappadanum.

---

# **2\. MODULE OBJECTIVES**

Authentication and onboarding modules-oda primary objectives:

1. User secure-aa account create panna mudiyanum.  
2. User minimum friction-oda login panna mudiyanum.  
3. Duplicate and fraudulent accounts reduce pannanum.  
4. User language, goal and business stage understand pannanum.  
5. User-ku personalized learning and business roadmap provide pannanum.  
6. User first meaningful action quickly complete panna help pannanum.  
7. Website, mobile app and admin-la same identity synchronize aaganum.  
8. Access controls backend level-la enforce aaganum.  
9. User session and device security transparent-aa manage pannanum.  
10. Every login, signup and onboarding step measurable-aa irukkanum.

---

# **3\. USER IDENTITY PRINCIPLES**

## **3.1 One Person, One Primary Identity**

Oru user-ku one primary platform identity irukkanum.

User multiple login methods connect pannalaam:

* Email and password  
* Mobile OTP  
* Google  
* Apple  
* Other approved OAuth providers

Aana ellame same user account-kku link aaganum.

## **3.2 Authentication and Profile Separation**

Authentication record and public profile separate entities-aa irukkanum.

Authentication data:

* Email  
* Mobile number  
* Password hash  
* Verification status  
* Login providers  
* Security settings  
* Session data

Profile data:

* Display name  
* Username  
* Profile photo  
* Bio  
* Profession  
* Skills  
* Social links  
* Business stage  
* Interests

## **3.3 Minimum Data Collection**

Signup time-la necessary information mattum collect pannanum.

Additional information onboarding and progressive profiling moolama collect pannalaam.

## **3.4 Server-Side Authorization**

Frontend-la button hide pannurathu authorization illa.

Protected action ellam backend-la verify pannanum:

* Valid session  
* Active account  
* Role  
* Membership  
* Entitlement  
* Organization  
* Ownership  
* Account restrictions

## **3.5 Transparent Security**

User-ku security action clear-aa explain pannanum.

Examples:

* New device login  
* Password changed  
* Email changed  
* Mobile number changed  
* Account locked  
* Suspicious activity detected

---

# **4\. SUPPORTED ACCOUNT TYPES**

## **4.1 Individual Account**

Default account type.

Suitable for:

* Students  
* Freelancers  
* Creators  
* Coaches  
* Entrepreneurs  
* Small-business owners

## **4.2 Mentor Account**

Mentor application and approval-kku apram activate aagum.

## **4.3 Instructor Account**

Admin invitation or approval moolama assign pannappadum.

## **4.4 Organization Member Account**

Organization invitation moolama create or link aagum.

## **4.5 Organization Admin Account**

Own organization members and reports manage panna access.

## **4.6 Internal Staff Account**

Roles:

* Support agent  
* Moderator  
* Content manager  
* Finance admin  
* Platform admin  
* Super admin

Internal staff-ku stronger security mandatory.

---

# **5\. AUTHENTICATION METHODS**

Platform initially support panna vendiya authentication methods:

* Email and password  
* Mobile number and OTP  
* Google OAuth  
* Apple Sign In  
* Passwordless email link optional  
* Admin-created invitation account  
* Organization invitation  
* Recovery codes for eligible users

Future-ready architecture:

* Microsoft login  
* LinkedIn login  
* Enterprise SSO  
* SAML  
* OpenID Connect

---

# **6\. SIGNUP FLOW OVERVIEW**

Standard signup journey:

1. User signup page open pannuvaar.  
2. Preferred method select pannuvaar.  
3. Basic details enter pannuvaar.  
4. Terms and privacy accept pannuvaar.  
5. Email or mobile verification complete pannuvaar.  
6. Account create aagum.  
7. Welcome screen display aagum.  
8. Onboarding start aagum.  
9. User personalized roadmap receive pannuvaar.  
10. Dashboard open aagum.

System signup source preserve pannanum:

* Direct  
* Organic search  
* Social media  
* Advertisement  
* Referral  
* Affiliate  
* Webinar  
* Lead magnet  
* Event  
* Admin invitation  
* Organization invitation

---

# **7\. SIGNUP PAGE PRD**

## **7.1 Page Objective**

Visitor-ai secure registered user-aa convert pannurathu.

## **7.2 Signup Page Components**

* Brand logo  
* Welcome headline  
* Short value statement  
* Google signup  
* Apple signup  
* Email signup  
* Mobile OTP signup  
* Login link  
* Terms consent  
* Privacy consent  
* Marketing consent optional  
* Language selector  
* Support link

## **7.3 Email Signup Fields**

Required:

* Full name  
* Email  
* Password  
* Confirm password  
* Terms acceptance  
* Privacy acceptance

Optional:

* Referral code  
* Marketing consent  
* Country

## **7.4 Mobile Signup Fields**

Required:

* Full name  
* Country code  
* Mobile number  
* OTP  
* Terms acceptance  
* Privacy acceptance

Optional:

* Email  
* Referral code  
* Marketing consent

## **7.5 Password Requirements**

Minimum configurable security policy:

* Minimum 8 characters  
* At least one letter  
* At least one number  
* Common compromised passwords reject pannanum  
* User email or name exact match avoid pannanum

Optional stronger requirement for staff:

* Minimum 12 characters  
* Uppercase  
* Lowercase  
* Number  
* Special character

## **7.6 Password UI**

* Show/hide password  
* Password strength indicator  
* Requirement checklist  
* Caps Lock warning  
* Paste allowed  
* Password manager support

## **7.7 Signup Validation**

### **Full Name**

* Required  
* Leading/trailing spaces remove  
* Minimum 2 characters  
* Maximum configurable limit  
* Unsupported control characters reject  
* Single-word names allow pannanum

### **Email**

* Required for email signup  
* Lowercase normalization  
* Trim spaces  
* Valid format  
* Duplicate account check  
* Disposable email handling configurable

### **Mobile Number**

* Valid country code  
* Country-specific format  
* Duplicate account check  
* OTP send rate limit

### **Password**

* Security policy match  
* Confirm password match  
* Previously breached password reject where supported

### **Consent**

Terms and privacy acceptance mandatory.

Pre-selected checkbox use panna koodathu.

## **7.8 Duplicate Account Behavior**

Email already exists-na:

> Indha email-ku already account irukku. Login pannunga or password reset pannunga.

Available actions:

* Login  
* Forgot password  
* Continue with connected provider

Mobile already exists-na same pattern.

System account existence unnecessarily expose panna koodatha security context-la generic messaging use pannalaam.

## **7.9 Signup Button States**

* Default  
* Disabled  
* Loading  
* Success  
* Validation error  
* Server error  
* Rate limited

Repeated clicks duplicate account create panna koodathu.

## **7.10 Signup Success**

Verification required-na verification screen open aaganum.

Already verified social login-na onboarding-ku redirect aaganum.

---

# **8\. EMAIL VERIFICATION FLOW**

## **8.1 Trigger**

Email signup complete aana verification email send aaganum.

## **8.2 Verification Email**

Include:

* User name  
* Verification CTA  
* Link expiry  
* Security note  
* Support link  
* Ignore message instruction

## **8.3 Verification Screen**

Display:

* Masked email  
* OTP field or verification link status  
* Resend  
* Change email  
* Countdown  
* Support

## **8.4 Verification Link States**

* Valid  
* Expired  
* Already used  
* Invalid  
* Account already verified  
* Account suspended

## **8.5 Resend Rules**

* Cooldown timer  
* Daily send limit  
* IP-level protection  
* Device-level protection  
* Audit log

## **8.6 Email Change During Verification**

User email change pannina:

* New email validate  
* Duplicate check  
* Old token invalidate  
* New verification send  
* Audit event create

---

# **9\. MOBILE OTP FLOW**

## **9.1 Send OTP**

User mobile number submit pannuvaar.

Backend:

1. Number normalize pannanum.  
2. Rate limit check pannanum.  
3. Existing account state check pannanum.  
4. OTP generate pannanum.  
5. OTP hashed or securely stored pannanum.  
6. Expiry assign pannanum.  
7. SMS provider moolama send pannanum.  
8. Request audit record create pannanum.

## **9.2 OTP Rules**

* Six digits recommended  
* Short expiry  
* Limited verification attempts  
* New OTP issue aana old OTP invalidate  
* OTP logs-la plain text store panna koodathu  
* OTP support staff view panna koodathu

## **9.3 OTP Screen**

Components:

* Masked mobile number  
* Six-digit input  
* Auto-focus  
* Auto-advance  
* Paste support  
* Resend countdown  
* Change number  
* Submit  
* Support link

## **9.4 OTP Error Messages**

* Incorrect OTP  
* OTP expired  
* Too many attempts  
* Resend limit reached  
* Service temporarily unavailable

## **9.5 OTP Auto Verification**

Six digits complete aana auto-submit optional.

Slow network-la repeated request prevent pannanum.

---

# **10\. SOCIAL LOGIN FLOW**

Supported initial providers:

* Google  
* Apple

## **10.1 New Social User**

Provider valid response receive pannina:

1. Provider identity verify.  
2. Email status verify.  
3. Existing matching account search.  
4. New account create or account-link flow trigger.  
5. Required consent capture.  
6. Onboarding start.

## **10.2 Existing Email Match**

Same email already password account-aa irundha:

* Secure account-link confirmation required.  
* Automatically unsafe-aa merge panna koodathu.

Possible flow:

> Indha email-ku already account irukku. Account connect panna existing method-la login pannunga.

## **10.3 Missing Social Data**

Provider name or email provide pannala-na additional details collect pannanum.

## **10.4 Social Provider Revoked**

Provider access revoked aana:

* Existing session immediate invalidate panna vendiyadhu provider risk base-la decide.  
* User alternative login method set panna prompt pannanum.

---

# **11\. LOGIN PAGE PRD**

## **11.1 Components**

* Logo  
* Headline  
* Email/mobile input  
* Password input  
* Login button  
* Google login  
* Apple login  
* OTP login option  
* Forgot password  
* Signup link  
* Language selector  
* Remember me optional  
* Support

## **11.2 Identifier Input**

Single identifier field support pannalaam:

> Email or mobile number

System normalized value base-la correct login method detect pannanum.

## **11.3 Login Validation**

* Required identifier  
* Valid format  
* Password required where applicable  
* Account state  
* Verification status  
* Attempt limits

## **11.4 Login Errors**

Security-friendly messaging:

> Login details correct illa. Check panni try pannunga.

Additional clear actions:

* Forgot password  
* Resend verification  
* Use OTP  
* Contact support

## **11.5 Successful Login Routing**

Redirect priority:

1. Preserved protected URL  
2. Pending checkout  
3. Pending event registration  
4. Incomplete onboarding  
5. Member dashboard

---

# **12\. PASSWORDLESS LOGIN**

Optional passwordless methods:

* Email magic link  
* Mobile OTP

## **Requirements**

* Short-lived token  
* Single use  
* Device and IP risk checks  
* Redirect preservation  
* Audit log  
* Invalid-token handling  
* Link scanner safe behavior

---

# **13\. FORGOT PASSWORD FLOW**

## **13.1 Request Screen**

Field:

* Email or mobile number

Response account existence reveal panna koodathu:

> Account match aana reset instructions send pannirukkom.

## **13.2 Email Reset**

Email contains:

* Reset CTA  
* Expiry  
* Security note  
* Support  
* Ignore instruction

## **13.3 Reset Password Screen**

Fields:

* New password  
* Confirm password

Checks:

* Token valid  
* Token unused  
* Token not expired  
* Password policy  
* Old password reuse policy configurable

## **13.4 Reset Completion**

After success:

* Existing sessions revoke configurable  
* User security notification send  
* Login CTA  
* Audit log create

Staff accounts-ku all sessions revoke mandatory.

---

# **14\. ACCOUNT RECOVERY**

Account recovery required when:

* Email access lost  
* Mobile access lost  
* Two-factor device lost  
* Account compromised  
* Social provider unavailable

## **Recovery Methods**

* Verified alternate email  
* Verified alternate mobile  
* Recovery codes  
* Support-assisted identity verification  
* Organization admin confirmation for managed accounts

## **Support Recovery Rules**

Support agent direct password view or set panna koodathu.

Recovery request:

* Ticket  
* Identity evidence  
* Risk review  
* Approval  
* Recovery link  
* Audit log

High-risk account recovery dual approval require pannalaam.

---

# **15\. TWO-FACTOR AUTHENTICATION**

## **15.1 Availability**

Optional for standard users.

Mandatory for:

* Admins  
* Finance roles  
* Super admins  
* High-risk accounts

## **15.2 Supported Methods**

* Authenticator app  
* SMS OTP  
* Email OTP as fallback  
* Recovery codes

Authenticator app preferred.

## **15.3 Setup Flow**

1. User password re-enter.  
2. QR or secret display.  
3. Verification code enter.  
4. Recovery codes generate.  
5. Confirmation send.  
6. Audit event create.

## **15.4 Recovery Codes**

* One-time use  
* Hashed storage  
* Download or copy  
* Regenerate option  
* Regeneration invalidates old codes

## **15.5 Disable 2FA**

Require:

* Password  
* Current 2FA or recovery verification  
* Security notification  
* Audit record

---

# **16\. SESSION MANAGEMENT**

## **16.1 Session Types**

* Web session  
* Mobile session  
* Admin session  
* Temporary checkout session

## **16.2 Session Data**

Store:

* Session ID  
* User ID  
* Device ID  
* Device name  
* Browser/app version  
* Operating system  
* Approximate location  
* IP  
* Created time  
* Last active  
* Expiry  
* Revoked status  
* Authentication strength

## **16.3 Token Strategy**

Recommended:

* Short-lived access token  
* Rotating refresh token  
* Secure HTTP-only cookies for web  
* Secure mobile storage for app  
* Refresh token reuse detection

## **16.4 Session Expiry**

Configurable based on role.

Standard user:

* Reasonable persistent session

Admin:

* Shorter idle timeout  
* Strong re-authentication

## **16.5 Concurrent Sessions**

User multiple devices use panna allow pannalaam.

Admin configurable limits:

* Maximum active sessions  
* Role-based limits  
* Organization policy

## **16.6 Sign Out**

Options:

* Sign out current device  
* Sign out selected device  
* Sign out all devices

All-device logout:

* Refresh tokens revoke  
* Active sessions invalidate  
* Security notification send

---

# **17\. DEVICE MANAGEMENT**

Profile settings-la “Devices and Sessions” screen irukkanum.

Display:

* Device name  
* Browser/app  
* Approximate location  
* Last active  
* Current device badge  
* Login method  
* Remove access

Unknown device remove pannina:

* Session revoke  
* Password-change suggestion  
* Security audit log

---

# **18\. SUSPICIOUS LOGIN DETECTION**

Risk signals:

* New country  
* Impossible travel  
* New device  
* Repeated failure  
* Known malicious IP  
* Token reuse  
* Rapid password attempts  
* Admin login from unusual location

Possible actions:

* Allow and notify  
* Additional OTP challenge  
* Block temporarily  
* Force password reset  
* Revoke sessions  
* Admin security review

User notification:

* Time  
* Device  
* Approximate location  
* “This was me”  
* “Secure my account”

---

# **19\. ACCOUNT STATUS MODEL**

Possible statuses:

* Pending verification  
* Active  
* Onboarding incomplete  
* Restricted  
* Temporarily locked  
* Suspended  
* Deactivated  
* Scheduled for deletion  
* Deleted  
* Merged

## **19.1 Restricted Account**

Possible restrictions:

* Cannot post  
* Cannot comment  
* Cannot purchase  
* Cannot withdraw  
* Cannot book mentor  
* Read-only access

## **19.2 Suspended Account**

User login pannumbodhu:

* Suspension reason category  
* Duration  
* Appeal option  
* Support link

Sensitive internal notes display panna koodathu.

---

# **20\. USER ROLE MODEL**

Core roles:

* Guest  
* Free member  
* Paid member  
* Mentor  
* Instructor  
* Moderator  
* Support agent  
* Content manager  
* Finance admin  
* Organization admin  
* Platform admin  
* Super admin

Role and membership separate concepts.

Example:

User role \= Mentor  
Membership \= Growth Plan

---

# **21\. PERMISSION MODEL**

Permissions action-based-aa define pannanum.

Examples:

* `course.view`  
* `course.create`  
* `course.edit_assigned`  
* `course.publish`  
* `community.post`  
* `community.moderate`  
* `payment.refund`  
* `user.suspend`  
* `analytics.view`  
* `settings.manage`

Roles permission bundles receive pannum.

Special user-specific overrides controlled and audited-aa irukkanum.

---

# **22\. USER PROFILE ARCHITECTURE**

Profile types:

* Private identity profile  
* Public member profile  
* Mentor profile  
* Instructor profile  
* Organization profile

## **22.1 Private Identity Fields**

* Legal or account name  
* Email  
* Mobile  
* Date of birth optional  
* Billing address  
* Tax information where needed  
* Security settings  
* Consent records

## **22.2 Public Profile Fields**

* Display name  
* Username  
* Profile photo  
* Cover image  
* Headline  
* Bio  
* Location  
* Profession  
* Skills  
* Interests  
* Social links  
* Achievements  
* Badges  
* Community activity  
* Followers/following  
* Public courses or products where applicable

---

# **23\. USERNAME RULES**

Username requirements:

* Unique  
* Case-insensitive  
* Lowercase URL normalization  
* Letters, numbers and approved symbols  
* Minimum and maximum length  
* Reserved words block  
* Offensive words block  
* Impersonation protection

Example public URL:

`/members/username`

Username change policy:

* Limited frequency  
* Previous URL redirect optional  
* Audit history  
* Reserved old username period

---

# **24\. PROFILE PHOTO AND COVER IMAGE**

## **Upload Requirements**

* Allowed image formats  
* Maximum size  
* Minimum dimensions  
* Crop  
* Rotate  
* Compress  
* Remove  
* Default avatar

## **Security**

* MIME validation  
* Malware scan  
* Metadata removal where appropriate  
* Signed upload  
* Moderation support

## **Display**

Responsive sizes generate pannanum:

* Thumbnail  
* Small  
* Medium  
* Large

---

# **25\. PROFILE COMPLETION SCORE**

Profile completion percentage fields base-la calculate pannanum.

Example weights:

* Name: mandatory  
* Photo  
* Headline  
* Bio  
* Profession  
* Skills  
* Goal  
* Business stage  
* Location  
* Social link

Percentage admin configurable.

Profile score user-ai encourage panna use pannanum; shame or public ranking-ku use panna koodathu.

---

# **26\. PROFILE PRIVACY**

User control panna vendiya visibility:

* Public  
* Members only  
* Connections only  
* Private

Field-specific controls:

* Location  
* Email  
* Mobile  
* Activity  
* Followers  
* Following  
* Achievements  
* Revenue milestones  
* Course completion

Email and mobile default public-aa irukka koodathu.

---

# **27\. ACCOUNT SETTINGS**

Settings categories:

* Profile  
* Account  
* Security  
* Language  
* Appearance  
* Notifications  
* Privacy  
* Connected accounts  
* Devices  
* Membership  
* Billing  
* Data and privacy  
* Blocked users  
* Organization  
* Support

---

# **28\. ONBOARDING SYSTEM OVERVIEW**

Onboarding purpose:

* User-ai understand pannurathu  
* User goal identify pannurathu  
* Correct starting point recommend pannurathu  
* First success action complete panna vaikkurathu

Onboarding short, progressive and skippable-by-policy irukkanum.

Critical steps skip pannina dashboard-la reminder show pannanum.

---

# **29\. ONBOARDING FLOW**

Recommended sequence:

1. Welcome  
2. Language selection  
3. Goal selection  
4. User type  
5. Experience level  
6. Business stage  
7. Skill interests  
8. Time availability  
9. Preferred learning format  
10. Current challenge  
11. Optional assessment  
12. Personalized roadmap  
13. Recommended first action

Progress indicator always visible-a irukkanum.

---

# **30\. ONBOARDING STEP 1 – WELCOME**

Display:

* Personalized welcome  
* Platform value  
* Expected setup time  
* Skip or continue based on policy  
* Language selector

CTA:

* Set Up My Journey

---

# **31\. ONBOARDING STEP 2 – LANGUAGE**

Options:

* Tamil  
* Tanglish  
* English

Optional:

* Content language  
* Interface language separate

Example:

Interface: Tamil  
Course preference: Tamil \+ English

Preference anytime settings-la change panna mudiyanum.

---

# **32\. ONBOARDING STEP 3 – PRIMARY GOAL**

Options admin configurable.

Examples:

* Business start pannanum  
* Freelancing start pannanum  
* Personal brand grow pannanum  
* Course create pannanum  
* Digital marketing learn pannanum  
* Existing business scale pannanum  
* Job-ready skill learn pannanum  
* Community build pannanum

User one primary and multiple secondary goals select pannalaam.

---

# **33\. ONBOARDING STEP 4 – USER TYPE**

Options:

* Student  
* Working professional  
* Freelancer  
* Coach  
* Content creator  
* Entrepreneur  
* Small-business owner  
* Other

“Other” select pannina optional text field.

---

# **34\. ONBOARDING STEP 5 – EXPERIENCE LEVEL**

Options:

* Complete beginner  
* Learning stage  
* Started but no income  
* First customers acquired  
* Stable monthly income  
* Scaling stage

Description each option-kku clear-aa irukkanum.

---

# **35\. ONBOARDING STEP 6 – BUSINESS STAGE**

Possible stages:

* No idea yet  
* Idea selected  
* Offer being created  
* Product launched  
* First sales  
* Growing  
* Team building  
* Scaling

Business இல்லாத students-ku “Not applicable yet” option.

---

# **36\. ONBOARDING STEP 7 – INTERESTS AND SKILLS**

Categories:

* Business  
* Sales  
* Marketing  
* Content  
* Design  
* Development  
* AI  
* Communication  
* Leadership  
* Finance  
* Productivity  
* Career

User multiple select pannalaam.

Admin categories and order manage panna mudiyanum.

---

# **37\. ONBOARDING STEP 8 – TIME AVAILABILITY**

Options:

* 15 minutes per day  
* 30 minutes per day  
* 1 hour per day  
* Weekends only  
* Flexible

Recommendation engine lesson size and reminders adjust pannalaam.

---

# **38\. ONBOARDING STEP 9 – LEARNING FORMAT**

Preferences:

* Short videos  
* Long-form classes  
* Audio  
* Reading  
* Live sessions  
* Assignments  
* Community learning

Multiple selection allow.

---

# **39\. ONBOARDING STEP 10 – CURRENT CHALLENGE**

Options:

* Clarity illa  
* Consistency illa  
* Skill gap  
* Client kidaikkala  
* Content create panna mudiyala  
* Sales improve pannanum  
* Time management  
* Confidence  
* Technical tools difficult  
* Team problem

Optional user own description add panna mudiyanum.

---

# **40\. ONBOARDING ASSESSMENT**

Assessment optional or goal-specific mandatory-aa configure pannalaam.

Question formats:

* Single select  
* Multiple select  
* Scale  
* Yes/no  
* Number range  
* Short text

Assessment engine:

* Question branching  
* Weighted score  
* Result categories  
* Recommendation mapping  
* Versioning

---

# **41\. PERSONALIZED ROADMAP**

Onboarding complete aana system generate panna vendiya output:

* User goal summary  
* Current stage  
* Recommended learning path  
* Recommended first course  
* Recommended community group  
* Recommended challenge  
* Recommended event  
* Recommended AI tool  
* Expected weekly commitment  
* First milestone

## **Roadmap Example**

### **Goal**

Freelancing start pannanum.

### **First 30 Days**

* Profile complete  
* Freelancing Foundation course  
* Skill selection task  
* Portfolio template  
* First proposal challenge  
* Freelancer community group

### **First Milestone**

First qualified client conversation.

---

# **42\. ROADMAP GENERATION RULES**

Recommendation engine inputs:

* Primary goal  
* User type  
* Experience  
* Business stage  
* Interests  
* Time availability  
* Preferred format  
* Membership access  
* Course prerequisites  
* Language  
* Completed content

Rules admin configurable.

AI use pannalaam, aana deterministic fallback mandatory.

AI failure aana static rules moolama roadmap generate aaganum.

---

# **43\. ONBOARDING SAVE AND RESUME**

User onboarding midway exit pannina:

* Progress auto-save  
* Next login-la resume prompt  
* Dashboard limited access policy configurable  
* Completed steps repeat panna thevai illa

User restart onboarding option settings-la irukkanum.

---

# **44\. ONBOARDING SKIP LOGIC**

Admin step-wise define panna vendum:

* Mandatory  
* Optional  
* Skippable  
* Conditionally required

Skip pannina:

* Generic dashboard load  
* Completion reminder  
* Recommendation quality note

---

# **45\. ONBOARDING ANALYTICS**

Track:

* Onboarding started  
* Step viewed  
* Step completed  
* Step skipped  
* Validation error  
* Assessment started  
* Assessment completed  
* Roadmap generated  
* Onboarding completed  
* Onboarding abandoned

Properties:

* Step ID  
* Time spent  
* Selected answer category  
* Device  
* Language  
* Signup source

Sensitive free-text content analytics-ku send panna koodathu.

---

# **46\. MEMBER DASHBOARD PURPOSE**

Dashboard user login pannumbodhu:

* Current state summarize pannanum  
* Next action clear-aa show pannanum  
* Progress motivate pannanum  
* Important event miss aagama help pannanum  
* Relevant platform modules accessible aakkanum  
* Overload reduce pannanum

Dashboard social feed clone-aa irukka koodathu.

---

# **47\. DASHBOARD INFORMATION PRIORITY**

Dashboard top-to-bottom priority:

1. Critical account or payment alerts  
2. Next best action  
3. Continue learning  
4. Upcoming live session  
5. Current challenge  
6. Progress and milestones  
7. Personalized recommendations  
8. Community highlights  
9. Saved items  
10. Membership and rewards

---

# **48\. DASHBOARD HEADER**

Contains:

* Greeting  
* User display name  
* Profile photo  
* Search  
* Notifications  
* Quick-create button  
* Membership badge  
* Streak indicator optional  
* Mobile menu

Greeting time-aware and localized-aa irukkanum.

Example:

> Good morning, Priya. Innaiku unga next action ready.

---

# **49\. ACCOUNT ALERT BANNER**

Possible alerts:

* Verify email  
* Verify mobile  
* Complete profile  
* Membership expiring  
* Payment failed  
* Account security issue  
* Course deadline  
* Event starts soon  
* Policy update  
* Organization invitation

Each alert:

* Severity  
* Title  
* Description  
* CTA  
* Dismissibility  
* Expiry  
* Audience

Critical security alerts dismiss panna allow panna koodathu.

---

# **50\. NEXT BEST ACTION CARD**

Dashboard-oda main primary card.

Card fields:

* Action title  
* Reason  
* Estimated time  
* Progress  
* CTA  
* Optional deadline  
* Related module

Examples:

* Continue lesson  
* Complete profile  
* Submit challenge  
* Join live event  
* Create offer  
* Follow up lead  
* Renew membership

One primary next action at a time.

Secondary actions separate list-la irukkanum.

---

# **51\. CONTINUE LEARNING SECTION**

Display maximum configurable courses.

Course progress card:

* Thumbnail  
* Course name  
* Current module  
* Current lesson  
* Progress percentage  
* Last accessed  
* Remaining time estimate  
* Continue CTA

Rules:

* Most recently active first  
* Completed course separate state  
* Expired access clear label  
* Removed content fallback message  
* Cross-device progress sync

---

# **52\. DAILY ACTION PLAN**

Daily plan based on roadmap and availability.

Action types:

* Watch lesson  
* Read resource  
* Complete task  
* Post update  
* Attend event  
* Use AI tool  
* Follow up lead  
* Review progress

Each task:

* Title  
* Category  
* Estimated minutes  
* Priority  
* Completion state  
* CTA

User task complete mark panna mudiyanum.

System-verifiable tasks auto-complete aaganum.

---

# **53\. UPCOMING EVENTS WIDGET**

Display:

* Event title  
* Date  
* Time  
* Timezone  
* Countdown  
* Join or register CTA  
* Calendar CTA

States:

* Not registered  
* Registered  
* Starting soon  
* Live  
* Completed  
* Replay available  
* Cancelled

Join button event start window base-la enable aaganum.

---

# **54\. CURRENT CHALLENGE WIDGET**

Display:

* Challenge name  
* Day or progress  
* Current task  
* Deadline  
* Team  
* Points  
* Submit CTA

If no active challenge:

* Recommended challenge  
* Browse challenges CTA

---

# **55\. PROGRESS OVERVIEW**

Metrics:

* Learning progress  
* Tasks completed  
* Current streak  
* Courses completed  
* Certificates  
* Community contribution  
* Business milestone  
* Points  
* Level

Metrics membership or role base-la configurable.

No fake precision.

---

# **56\. BUSINESS MILESTONE TRACKER**

Possible milestones:

* Goal selected  
* Niche finalized  
* Offer created  
* First post published  
* First lead  
* First client call  
* First customer  
* ₹1,000 revenue  
* ₹10,000 revenue  
* ₹1 lakh revenue  
* Team member hired

Milestones:

* User self-declared  
* System verified  
* Mentor verified  
* Admin verified

Verification badge clearly distinguish pannanum.

---

# **57\. PERSONALIZED RECOMMENDATIONS**

Recommendation categories:

* Courses  
* Lessons  
* Events  
* Mentors  
* Community groups  
* Challenges  
* AI tools  
* Resources  
* Marketplace products

Each recommendation card include:

* Why recommended  
* Relevance  
* CTA  
* Dismiss  
* Save

User feedback:

* Not interested  
* Already know this  
* Show later  
* Wrong recommendation

---

# **58\. COMMUNITY HIGHLIGHTS**

Dashboard-la limited community content:

* Trending discussion  
* Member win  
* Mentor announcement  
* Group update  
* Unanswered question

Dashboard community section full feed replace panna koodathu.

Content permissions respect pannanum.

---

# **59\. QUICK ACTIONS**

Possible quick actions:

* Create post  
* Ask question  
* Open AI assistant  
* Add lead  
* Book mentor  
* Join event  
* Browse courses  
* Record milestone  
* Contact support

Admin role/membership base-la quick actions configure panna mudiyanum.

---

# **60\. MEMBERSHIP WIDGET**

Display:

* Current plan  
* Status  
* Renewal date  
* Usage limits  
* AI credits  
* Upgrade CTA  
* Manage billing

States:

* Free  
* Trial  
* Active  
* Grace period  
* Payment failed  
* Cancelled  
* Expired  
* Organization-sponsored

---

# **61\. AI USAGE WIDGET**

When AI module enabled:

* Credits remaining  
* Recent tools  
* Saved outputs  
* Recommended AI task  
* Upgrade or buy credits

Usage reset date clearly show pannanum.

---

# **62\. SAVED ITEMS WIDGET**

Saved content:

* Courses  
* Lessons  
* Posts  
* Resources  
* Events  
* Mentors  
* AI outputs

Display recent saved items and “View all”.

---

# **63\. NOTIFICATION CENTER PREVIEW**

Dashboard header badge:

* Unread count  
* Priority indicator

Dropdown preview:

* Latest notifications  
* Mark all read  
* View all  
* Notification settings

Deep links correct destination open pannanum.

---

# **64\. DASHBOARD CUSTOMIZATION**

Future-ready capability:

* Reorder widgets  
* Hide optional widgets  
* Compact view  
* Goal-focused dashboard  
* Role-specific dashboard

MVP-la admin-defined layout acceptable.

User customization settings future-compatible data model use pannanum.

---

# **65\. ROLE-BASED DASHBOARDS**

## **Free Member**

Focus:

* Free learning  
* Community  
* Upgrade  
* Profile completion

## **Paid Member**

Focus:

* Courses  
* Events  
* Challenges  
* Mentorship  
* Progress

## **Mentor**

Additional widgets:

* Upcoming sessions  
* Student requests  
* Availability  
* Earnings  
* Reviews

## **Instructor**

Additional widgets:

* Course performance  
* Assignments  
* Learner questions  
* Upcoming classes

## **Organization Admin**

Additional widgets:

* Team activity  
* Licenses  
* Course completion  
* Invitations  
* Reports

---

# **66\. NEW USER DASHBOARD EMPTY STATE**

New user-ku blank dashboard show panna koodathu.

Display:

* Welcome  
* Onboarding progress  
* Start first course  
* Join community  
* Upcoming event  
* AI tool demo  
* Profile completion

---

# **67\. RETURNING INACTIVE USER EXPERIENCE**

User configurable inactivity period-kku apram login pannina:

* Welcome back  
* What changed summary  
* Resume recommendation  
* Missed deadlines  
* New relevant events  
* Membership state  
* Simplified restart plan

Overwhelming backlog show panna koodathu.

---

# **68\. DASHBOARD LOADING STATES**

Widgets independently load aaganum.

Requirements:

* Skeleton  
* Layout stability  
* Partial failure isolation  
* Retry per widget  
* Critical data first  
* Cached non-sensitive content

One widget fail aana full dashboard fail panna koodathu.

---

# **69\. DASHBOARD EMPTY STATES**

Examples:

No active course:

> Innum course start pannala. Unga goal-ku recommended course inga irukku.

No event:

> Upcoming event illa. Latest workshops browse pannunga.

No challenge:

> Active challenge illa. Oru beginner challenge start pannunga.

Every empty state-ku clear CTA.

---

# **70\. DASHBOARD ERROR STATES**

Error message:

* Human-readable  
* Retry  
* Support reference  
* Technical details hidden

Authentication failure aana secure login redirect.

Entitlement failure aana membership explanation.

---

# **71\. OFFLINE AND LOW-NETWORK BEHAVIOR**

Mobile app:

* Cached dashboard summary  
* Downloaded lessons access  
* Offline action queue where safe  
* Network status banner  
* Sync status

Sensitive or time-critical values stale badge show pannanum.

Payment, booking and submission finalization offline-la complete panna koodathu.

---

# **72\. MEMBER NAVIGATION**

Desktop sidebar:

* Dashboard  
* Learn  
* Community  
* Challenges  
* Events  
* Mentors  
* AI Tools  
* Marketplace  
* Business Workspace  
* Saved  
* Notifications  
* Profile  
* Support

Mobile bottom navigation recommended core items:

* Home  
* Learn  
* Community  
* AI  
* Profile

Additional modules “More” menu-la.

---

# **73\. GLOBAL MEMBER SEARCH**

Search across:

* Courses  
* Lessons  
* Posts  
* Members  
* Groups  
* Mentors  
* Events  
* Resources  
* Marketplace

Access-controlled content only return pannanum.

---

# **74\. USER IMPERSONATION SAFETY**

Support/admin impersonation feature future-la irundha:

* Strong permission  
* Explicit reason  
* Time-limited session  
* User-sensitive actions blocked  
* Banner visible  
* Full audit log  
* Payment and password actions disabled

Silent impersonation allowed illa.

---

# **75\. ADMIN USER MANAGEMENT**

Admin list columns:

* User  
* Email  
* Mobile  
* Role  
* Membership  
* Status  
* Signup date  
* Last active  
* Verification  
* Organization  
* Risk flag

Filters:

* Role  
* Membership  
* Status  
* Verification  
* Signup source  
* Date range  
* Language  
* Country  
* Organization  
* Last active

Actions:

* View profile  
* Edit approved fields  
* Resend verification  
* Reset onboarding  
* Assign role  
* Change status  
* Add internal note  
* View sessions  
* Revoke sessions  
* Suspend  
* Restore  
* Export permitted data

---

# **76\. ADMIN USER DETAIL**

Tabs:

* Overview  
* Profile  
* Authentication  
* Membership  
* Courses  
* Community  
* Payments  
* Events  
* Mentor sessions  
* Support tickets  
* Security  
* Consent  
* Activity log  
* Admin notes

Sensitive data masking mandatory.

---

# **77\. ROLE CHANGE RULES**

Role change:

* Permission required  
* Reason required  
* Audit log  
* Optional approval  
* User notification based on role  
* Immediate permission refresh

Super admin role grant dual approval recommended.

---

# **78\. ACCOUNT MERGE**

Duplicate accounts merge feature controlled admin workflow.

Merge requirements:

* Verify ownership  
* Select primary account  
* Migrate purchases  
* Migrate progress  
* Migrate memberships  
* Handle duplicate profiles  
* Revoke old sessions  
* Preserve audit history  
* Redirect old identity references

Financial conflicts manual review.

---

# **79\. ACCOUNT DEACTIVATION**

User can temporarily deactivate account if policy allows.

Effects:

* Public profile hidden  
* Notifications paused  
* Login reactivation allowed  
* Subscription handling clearly explained  
* Data retained according to policy

Deactivation subscription cancellation automatically assume panna koodathu.

---

# **80\. ACCOUNT DELETION**

## **User Flow**

1. Open Data and Privacy.  
2. Select Delete Account.  
3. Explain consequences.  
4. Re-authenticate.  
5. Provide reason optional.  
6. Confirm.  
7. Cooling-off period where applicable.  
8. Delete/anonymize according to policy.  
9. Confirmation send.

## **Deletion Considerations**

* Active subscription  
* Pending refund  
* Mentor payout  
* Organization ownership  
* Legal retention  
* Community content  
* Certificates  
* Financial records

User-generated content anonymize or delete based on policy and law.

---

# **81\. DATA EXPORT**

User request export:

* Profile  
* Course progress  
* Posts  
* Comments  
* Saved items  
* Orders  
* Certificates  
* Consent  
* AI history where applicable

Export:

* Secure  
* Time-limited download  
* Identity verification  
* Audit log  
* Notification

---

# **82\. CONSENT MANAGEMENT**

User settings-la:

* Marketing email  
* Push  
* SMS  
* WhatsApp  
* Product updates  
* Partner offers  
* Personalization

withdraw panna mudiyanum.

Transactional communications opt-out apply aagatha cases clear-aa explain pannanum.

---

# **83\. NOTIFICATION PREFERENCES**

Category-wise controls:

* Learning reminders  
* Community  
* Events  
* Mentor sessions  
* Payments  
* Membership  
* Marketing  
* Security  
* Product updates

Channel-wise:

* In-app  
* Push  
* Email  
* SMS  
* WhatsApp

Security notifications disable panna allow panna koodathu.

---

# **84\. PERSONALIZATION ENGINE DATA**

Inputs:

* Explicit preferences  
* Onboarding answers  
* Course activity  
* Search  
* Saved items  
* Event attendance  
* Community groups  
* Membership  
* Business milestones  
* User feedback

Do not use:

* Sensitive personal attributes  
* Private messages without explicit product need and consent  
* Unnecessary protected-category inference

---

# **85\. PERSONALIZATION TRANSPARENCY**

Recommendation card-la:

> Unga freelancing goal and beginner level base-la recommend pannirukkom.

User recommendation controls access panna mudiyanum.

---

# **86\. AUTHENTICATION ANALYTICS EVENTS**

Events:

* `signup_started`  
* `signup_method_selected`  
* `signup_completed`  
* `signup_failed`  
* `verification_sent`  
* `verification_completed`  
* `verification_failed`  
* `login_started`  
* `login_succeeded`  
* `login_failed`  
* `password_reset_requested`  
* `password_reset_completed`  
* `social_account_linked`  
* `session_revoked`  
* `two_factor_enabled`  
* `two_factor_disabled`  
* `account_recovery_started`  
* `account_deleted`

Never log:

* Password  
* OTP  
* Full token  
* Recovery code

---

# **87\. DASHBOARD ANALYTICS EVENTS**

Events:

* `dashboard_viewed`  
* `next_action_viewed`  
* `next_action_clicked`  
* `course_resumed`  
* `daily_task_completed`  
* `recommendation_viewed`  
* `recommendation_clicked`  
* `recommendation_dismissed`  
* `event_join_clicked`  
* `profile_completion_clicked`  
* `membership_upgrade_clicked`  
* `quick_action_clicked`

---

# **88\. AUDIT LOG REQUIREMENTS**

Audit actions:

* Email changed  
* Mobile changed  
* Password changed  
* 2FA changed  
* Session revoked  
* Role changed  
* Account status changed  
* Account merged  
* User deleted  
* Admin profile edit  
* Consent changed

Audit record:

* Actor  
* Target  
* Action  
* Timestamp  
* Source  
* IP  
* Device  
* Before/after safe fields  
* Reason  
* Correlation ID

Passwords, tokens and OTP audit-la store panna koodathu.

---

# **89\. SECURITY REQUIREMENTS**

* Password hashing using approved adaptive algorithm  
* Secure token generation  
* Refresh-token rotation  
* Secure cookie flags  
* CSRF protection  
* XSS protection  
* Rate limiting  
* Bot protection  
* Credential-stuffing defense  
* Login anomaly detection  
* Secret rotation  
* Session revocation  
* Audit logging  
* Encryption in transit  
* Encryption at rest where appropriate

---

# **90\. PERFORMANCE REQUIREMENTS**

Authentication responses:

* UI immediate loading state  
* OTP requests quick acknowledgement  
* Dashboard critical content prioritized  
* Profile images optimized  
* Recommendation engine timeout fallback  
* Parallel safe widget loading

Onboarding answer save failure aana local temporary preservation.

---

# **91\. ACCESSIBILITY REQUIREMENTS**

Authentication:

* Proper labels  
* Password toggle accessible name  
* OTP input screen-reader support  
* Error announcement  
* Keyboard navigation  
* Focus management

Dashboard:

* Semantic regions  
* Keyboard shortcuts optional  
* Chart text alternatives  
* Visible focus  
* Reduced-motion support  
* Screen-reader-friendly progress values

---

# **92\. LOCALIZATION REQUIREMENTS**

All authentication and onboarding strings translation-key base-la irukkanum.

Avoid hardcoded mixed-language text.

Support:

* Tamil script  
* Tanglish  
* English

User-generated names transliterate panna koodathu.

Date, time, number and currency localized-aa display pannanum.

---

# **93\. API REQUIREMENT CATEGORIES**

Detailed endpoints Volume 15-la define pannappadum.

Required API groups:

* Signup  
* Login  
* OTP  
* Verification  
* Password reset  
* Social auth  
* Session  
* Device  
* Profile  
* Username  
* Onboarding  
* Assessment  
* Roadmap  
* Dashboard  
* Preferences  
* Consent  
* Account deletion  
* Data export  
* Admin user management

---

# **94\. CORE DATA ENTITIES**

* User  
* User Identity  
* Login Provider  
* Email Address  
* Mobile Number  
* Password Credential  
* Session  
* Device  
* Two-Factor Method  
* Recovery Code  
* User Profile  
* User Role  
* Permission  
* Role Permission  
* Membership Entitlement  
* User Preference  
* Consent Record  
* Onboarding Response  
* Assessment  
* Assessment Result  
* Roadmap  
* Recommendation  
* Dashboard Configuration  
* User Milestone  
* Security Event  
* Audit Log  
* Account Recovery Request  
* Data Export Request  
* Account Deletion Request

Detailed schema Volume 14-la.

---

# **95\. ERROR CODE FOUNDATION**

Authentication:

* `AUTH_INVALID_CREDENTIALS`  
* `AUTH_EMAIL_UNVERIFIED`  
* `AUTH_MOBILE_UNVERIFIED`  
* `AUTH_ACCOUNT_LOCKED`  
* `AUTH_ACCOUNT_SUSPENDED`  
* `AUTH_OTP_INVALID`  
* `AUTH_OTP_EXPIRED`  
* `AUTH_TOO_MANY_ATTEMPTS`  
* `AUTH_SESSION_EXPIRED`  
* `AUTH_REAUTH_REQUIRED`  
* `AUTH_PROVIDER_CONFLICT`

Profile:

* `PROFILE_USERNAME_TAKEN`  
* `PROFILE_IMAGE_INVALID`  
* `PROFILE_UPDATE_RESTRICTED`

Onboarding:

* `ONBOARDING_STEP_INVALID`  
* `ONBOARDING_SAVE_FAILED`  
* `ROADMAP_GENERATION_FAILED`

Dashboard:

* `DASHBOARD_PARTIAL_FAILURE`  
* `ENTITLEMENT_REQUIRED`  
* `RESOURCE_UNAVAILABLE`

---

# **96\. QA TEST AREAS**

## **Authentication**

* Signup methods  
* Duplicate accounts  
* OTP  
* Verification  
* Password reset  
* Social linking  
* Rate limits  
* Session expiry  
* Device removal  
* 2FA  
* Recovery

## **Onboarding**

* All steps  
* Skip  
* Resume  
* Branching  
* Assessment  
* Roadmap  
* Language  
* Validation

## **Dashboard**

* New user  
* Free member  
* Paid member  
* Mentor  
* Organization admin  
* Empty states  
* Partial failure  
* Expired membership  
* Offline state  
* Recommendations  
* Deep links

---

# **97\. MVP PRIORITY**

## **P0**

* Email signup/login  
* Mobile OTP  
* Google login  
* Verification  
* Forgot password  
* Basic session management  
* Profile  
* Core onboarding  
* Personalized static-rule roadmap  
* Member dashboard  
* Continue learning  
* Notifications preview  
* Membership status  
* Admin user list  
* Account suspension  
* Audit basics

## **P1**

* Apple login  
* 2FA  
* Device management  
* Advanced onboarding assessment  
* Personalized recommendations  
* Milestones  
* Dashboard role variants  
* Data export  
* Account deletion workflow

## **P2**

* Enterprise SSO  
* Advanced risk engine  
* User dashboard customization  
* AI-generated roadmap  
* Account merge automation  
* Passwordless email login

---

# **98\. DEFINITION OF DONE**

Feature complete-nu consider panna:

1. Approved requirement implement aaganum.  
2. Backend authorization enforce aaganum.  
3. Security review pass aaganum.  
4. Mobile and desktop responsive aaganum.  
5. Accessibility support irukkanum.  
6. Tamil, Tanglish and English strings available-a irukkanum.  
7. Loading, empty, error states implement aaganum.  
8. Analytics fire aaganum.  
9. Audit log where required create aaganum.  
10. QA test pass aaganum.  
11. UAT approval receive aaganum.  
12. Monitoring configure aaganum.  
13. Documentation update aaganum.

---

# **99\. VOLUME 03 ACCEPTANCE CRITERIA**

Volume 03 approved-nu consider panna:

* All signup and login methods defined.  
* OTP and verification rules documented.  
* Password and recovery flows defined.  
* Session and device security documented.  
* Account status model defined.  
* Roles and permissions foundation established.  
* Profile architecture documented.  
* Privacy settings defined.  
* Complete onboarding journey documented.  
* Roadmap generation rules defined.  
* Member dashboard widgets documented.  
* Role-based dashboard behavior defined.  
* Admin identity operations documented.  
* Security, analytics and audit requirements established.  
* MVP priority defined.

---

# **100\. FINAL MODULE PRINCIPLE**

Authentication user-ku gate madhiri mattum feel aaga koodathu.

Adhu:

* Secure  
* Simple  
* Fast  
* Trustworthy  
* Recoverable  
* Accessible

aa irukkanum.

Onboarding information form madhiri mattum irukka koodathu.

Adhu user-ai understand panni correct journey-ku guide pannanum.

Dashboard feature collection madhiri irukka koodathu.

Adhu user-kku:

> “Naan ippo enga irukken, next enna seiyanum, en progress enna?”

indha moonu questions-kum immediate answer provide pannanum.

Tamil Business Tribe member experience-oda final principle:

> Every login should move the member toward one meaningful learning, community or business outcome.

