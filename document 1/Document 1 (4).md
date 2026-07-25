# **TAMIL BUSINESS TRIBE**

## **ENTERPRISE DIGITAL BUSINESS ECOSYSTEM**

### **Deep Product Requirement Document**

**Document Series:** Enterprise PRD  
**Volume:** 05  
**Volume Name:** Community, Groups, Channels, Feed, Posts, Networking, Messaging, Moderation and Trust & Safety  
**Version:** 1.0  
**Document Status:** Development Baseline  
**Product Codename:** TBT One  
**Brand Name:** Tamil Business Tribe  
**Primary Surfaces:** Member Web Application, Mobile Application, Admin Panel, Moderator Console  
**Primary Languages:** Tamil, Tanglish, English

---

# **1\. VOLUME PURPOSE**

Indha volume Tamil Business Tribe platform-oda complete community and professional networking ecosystem-ai define pannuthu.

Covered areas:

* Community home  
* Personalized feed  
* Public and private groups  
* Channels  
* Member posts  
* Text, image, video and document posts  
* Questions and polls  
* Achievements and milestone posts  
* Comments and replies  
* Reactions  
* Mentions  
* Hashtags  
* Following and connections  
* Member directory  
* Direct messaging  
* Group messaging  
* Content sharing  
* Saved posts  
* Search and discovery  
* Community events integration  
* Community reputation  
* Moderation  
* Reporting  
* Blocking  
* Anti-spam  
* Trust and safety  
* Community notifications  
* Admin community management  
* Moderator workflows  
* Community analytics  
* Security  
* Privacy  
* Accessibility  
* QA  
* Acceptance criteria

Indha document product managers, UI/UX designers, frontend developers, mobile developers, backend developers, database architects, community managers, moderators, trust-and-safety teams, support teams and QA engineers-ku implementation source of truth-aa use pannappadanum.

---

# **2\. COMMUNITY PRODUCT OBJECTIVE**

Tamil Business Tribe Community simple social-media feed-aa irukka koodathu.

Community user-ai:

1. Learning-related questions ask panna help pannanum.  
2. Practical business progress share panna encourage pannanum.  
3. Similar goals irukkura members-ai connect pannanum.  
4. Mentors and experts-kitta guidance receive panna allow pannanum.  
5. Accountability and consistency improve pannanum.  
6. Collaboration opportunities discover panna support pannanum.  
7. Safe and respectful Tamil professional network build pannanum.  
8. Spam, scams and abusive behavior minimize pannanum.  
9. Valuable discussions easy-aa discover panna help pannanum.  
10. Learning, business and community outcomes connect pannanum.

---

# **3\. COMMUNITY PRINCIPLES**

## **3.1 Value Before Virality**

Feed ranking engagement mattum base pannakoodathu.

Priority:

* Relevance  
* Helpfulness  
* Learning value  
* Genuine progress  
* Trusted participation  
* Timeliness

Sensational or misleading content high engagement irundhaalum artificially boost panna koodathu.

## **3.2 Professional but Human**

Community:

* Friendly  
* Supportive  
* Practical  
* Respectful  
* Tamil-cultural context aware

aa irukkanum.

Aana harassment, hate, scams, financial deception, impersonation or unsafe advice allow panna koodathu.

## **3.3 User Control**

Members control panna vendiya areas:

* Yaar follow pannalaam  
* Yaar message pannalaam  
* Enna notifications receive pannanum  
* Profile visibility  
* Activity visibility  
* Blocked users  
* Group participation  
* Feed preference

## **3.4 Privacy by Default**

Sensitive profile information default public-aa irukka koodathu.

Private groups content external users or unauthorized members-kku visible aaga koodathu.

## **3.5 Moderation Must Be Auditable**

Every major moderation action:

* Actor  
* Reason  
* Evidence  
* Timestamp  
* Appeal status

oda audit pannappadanum.

## **3.6 Real Business Outcomes**

Community success likes count base-la mattum measure panna koodathu.

Important outcomes:

* Questions answered  
* Collaborations created  
* Leads generated  
* Milestones achieved  
* Mentorship interactions  
* Learning completion support  
* Safe participation

---

# **4\. COMMUNITY USER ROLES**

Community-specific roles:

* Visitor  
* Member  
* Verified member  
* Paid member  
* Group member  
* Group contributor  
* Group moderator  
* Group admin  
* Mentor  
* Instructor  
* Community moderator  
* Trust and safety reviewer  
* Platform admin  
* Super admin

Roles and permissions backend-la enforce pannappadanum.

---

# **5\. COMMUNITY INFORMATION ARCHITECTURE**

Primary community navigation:

* Community Home  
* My Feed  
* Discover  
* Groups  
* Questions  
* Member Wins  
* Events  
* Member Directory  
* Connections  
* Messages  
* Saved Posts  
* Notifications  
* Community Guidelines

Mobile bottom or tab navigation:

* Feed  
* Discover  
* Create  
* Groups  
* Messages

---

# **6\. COMMUNITY HOME SCREEN**

Community home page personalized entry point-aa irukkanum.

Recommended sections:

1. Create post composer  
2. Important community announcement  
3. Personalized feed  
4. Trending discussions  
5. Unanswered questions  
6. Member wins  
7. Suggested groups  
8. Suggested members  
9. Upcoming community events  
10. Community guidelines reminder

Dashboard clutter avoid panna sections user state base-la dynamically prioritize pannappadanum.

---

# **7\. FEED TYPES**

Platform support panna vendiya feeds:

* Personalized feed  
* Following feed  
* Latest feed  
* Group feed  
* Questions feed  
* Member wins feed  
* Mentor posts  
* Saved posts  
* Organization feed  
* Admin announcement feed

---

# **8\. PERSONALIZED FEED**

Personalized feed inputs:

* Followed users  
* Joined groups  
* Selected interests  
* Learning path  
* Course enrollment  
* Business stage  
* Language preference  
* Previous interactions  
* Saved posts  
* Hidden content  
* Reported content  
* Post freshness  
* Content quality  
* Trusted-author signals

## **8.1 Feed Goals**

* Relevant content show pannanum.  
* Repeated same author overexposure avoid pannanum.  
* New members-kku discovery opportunity provide pannanum.  
* Low-quality engagement bait reduce pannanum.  
* Spam and duplicate content suppress pannanum.

## **8.2 Feed Ranking Signals**

Positive signals:

* User follows author  
* Same group  
* Same goal  
* Same course  
* Instructor or mentor relevance  
* Helpful votes  
* Accepted answer  
* Meaningful comments  
* Recent content  
* Saved content similarity

Negative signals:

* User hidden post  
* User muted author  
* Repeated duplicate  
* Clickbait  
* Excessive self-promotion  
* Low trust score  
* Report pattern  
* Engagement manipulation

## **8.3 Feed Explainability**

Optional menu:

> Why am I seeing this?

Possible reasons:

* Neenga indha member-ai follow pannureenga.  
* Idhu unga joined group-la post pannappattadhu.  
* Unga learning goal-kku relevant.  
* Community-la helpful-aa rate pannappattadhu.

---

# **9\. FOLLOWING FEED**

Following feed user follow pannura members, mentors, instructors and organizations content mattum show pannanum.

Sort options:

* Latest  
* Recommended

Sponsored or unrelated posts include panna koodathu unless clearly labeled.

---

# **10\. LATEST FEED**

Latest feed chronological order-la permitted community posts show pannanum.

Requirements:

* Pagination or infinite scroll  
* Duplicate prevention  
* Deleted content removal  
* Permission-aware filtering  
* Block and mute filtering

---

# **11\. POST TYPES**

Supported post types:

* Text post  
* Image post  
* Multi-image post  
* Video post  
* Audio post  
* Document post  
* Link post  
* Question  
* Poll  
* Achievement  
* Business milestone  
* Resource share  
* Event post  
* Course-related discussion  
* Job or collaboration opportunity  
* Mentor announcement  
* Admin announcement

Each post type-ku independent validation and display template irukkanum.

---

# **12\. CREATE POST COMPOSER**

## **12.1 Entry Points**

Post composer open aagum locations:

* Community home  
* Group page  
* Course discussion  
* Member profile  
* Quick-action button  
* Mobile center create button

## **12.2 Composer Components**

* User avatar  
* Post-type selector  
* Text editor  
* Media upload  
* Link preview  
* Audience selector  
* Group selector  
* Tags  
* Mention  
* Poll  
* Draft  
* Preview  
* Post button

## **12.3 Placeholder**

General placeholder:

> Innaiku neenga enna learn panneenga, achieve panneenga, illa community-kitta enna kekkanum?

Contextual placeholders group or course base-la vary pannalaam.

---

# **13\. TEXT POST**

Requirements:

* Minimum meaningful content validation  
* Configurable maximum length  
* Paragraph formatting  
* Mentions  
* Hashtags  
* Links  
* Emojis  
* Tamil Unicode support  
* Tanglish support  
* Line breaks  
* Draft autosave

Unsupported scripts or characters unnecessarily block panna koodathu.

---

# **14\. RICH-TEXT SUPPORT**

Allowed formatting:

* Bold  
* Italic  
* Bullets  
* Numbered list  
* Quote  
* Code block  
* Link  
* Heading optional

Raw HTML allow panna koodathu.

All content backend-la sanitize pannappadanum.

---

# **15\. IMAGE POST**

## **15.1 Image Requirements**

* Single or multiple images  
* Approved formats  
* Configurable file limit  
* Minimum dimensions  
* Maximum dimensions  
* Compression  
* Orientation correction  
* Crop  
* Alt text  
* Upload progress

## **15.2 Feed Display**

Images:

* Proper aspect ratio maintain pannanum.  
* Image excessively crop aaga koodathu.  
* Full image open viewer irukkanum.  
* Portrait, landscape and square layouts support pannanum.  
* Low-resolution placeholder use pannalaam.  
* Multi-image grid responsive-aa irukkanum.

## **15.3 Image Viewer**

* Fullscreen  
* Swipe  
* Zoom  
* Download based on permission  
* Alt text  
* Report media  
* Close

---

# **16\. VIDEO POST**

Features:

* Video upload  
* Thumbnail generation  
* Playback controls  
* Captions optional  
* Mute/autoplay policy  
* Fullscreen  
* Duration  
* Processing state  
* Failure retry

Feed autoplay:

* Muted  
* User preference-aware  
* Network-aware  
* Accessibility-aware

Direct raw video URL expose panna koodathu.

---

# **17\. AUDIO POST**

Audio use cases:

* Voice update  
* Short lesson  
* Feedback  
* Question

Features:

* Record  
* Upload  
* Playback  
* Duration  
* Waveform optional  
* Speed control  
* Transcript optional

Microphone permission clear context-la request pannanum.

---

# **18\. DOCUMENT POST**

Supported document types:

* PDF  
* Spreadsheet  
* Presentation  
* Text document  
* Template

Document card:

* Filename  
* File type  
* File size  
* Description  
* Preview  
* Download permission  
* Virus scan state

Private group document unauthorized user access panna koodathu.

---

# **19\. LINK POST**

When valid URL entered:

* Metadata fetch  
* Title  
* Description  
* Domain  
* Thumbnail  
* Security reputation check

User preview remove or edit own post text panna mudiyanum.

Dangerous domains warn or block pannappadanum.

---

# **20\. QUESTION POST**

Question fields:

* Title  
* Details  
* Category  
* Tags  
* Group  
* Optional attachment  
* Urgency optional  
* Anonymous option only if enabled

Question states:

* Open  
* Answered  
* Accepted answer  
* Closed  
* Archived

---

# **21\. ANSWERS AND ACCEPTED ANSWER**

Question post comments-la answers distinguish pannappadanum.

Features:

* Answer submission  
* Helpful vote  
* Reply  
* Instructor badge  
* Mentor badge  
* Accepted answer  
* Sort by helpful/latest  
* Report

Question author or authorized moderator accepted answer select panna mudiyanum.

Accepted answer change audit optional.

---

# **22\. POLL POST**

Poll configuration:

* Question  
* Two or more options  
* Single or multiple selection  
* End date  
* Anonymous results  
* Results visibility  
* Allow option suggestions optional

Poll states:

* Open  
* Closed  
* Cancelled

User vote change policy configurable.

Poll result percentages total accurately calculate aaganum.

---

# **23\. ACHIEVEMENT AND MILESTONE POST**

Special templates:

* Course completed  
* Certificate earned  
* First client  
* Revenue milestone  
* Challenge completed  
* New product launched  
* Streak achieved  
* Community contribution

System-generated achievement post-ku user confirmation mandatory.

User private achievement automatically public post aaga koodathu.

---

# **24\. COLLABORATION OR OPPORTUNITY POST**

Fields:

* Opportunity type  
* Title  
* Description  
* Skills required  
* Compensation type  
* Location/remote  
* Deadline  
* Contact method  
* Application link  
* Verification status

Opportunity types:

* Freelance work  
* Job  
* Partnership  
* Collaboration  
* Internship  
* Volunteer  
* Vendor requirement

## **Safety Requirements**

* Scam detection  
* Upfront-payment warning  
* Contact privacy  
* Report option  
* Verified organization badge  
* Admin moderation for high-risk categories

---

# **25\. POST AUDIENCE**

Audience options:

* Public website where approved  
* All members  
* Followers  
* Connections  
* Selected group  
* Course members  
* Program cohort  
* Organization members  
* Private draft

Audience after publishing restrict/change policy configurable.

Public-to-private reduction allow pannalaam.

Private-to-public change confirmation require pannalaam.

---

# **26\. POST DRAFTS**

Features:

* Autosave  
* Manual save  
* Draft list  
* Edit  
* Delete  
* Publish  
* Last saved time  
* Device sync

Incomplete media upload draft state preserve pannanum.

---

# **27\. POST SCHEDULING**

Available for:

* Admins  
* Mentors  
* Instructors  
* Approved creators

Fields:

* Publish date  
* Publish time  
* Timezone  
* Audience  
* Notification option

Scheduled post:

* Edit before publish  
* Cancel  
* Preview  
* Failure alert

---

# **28\. POST EDITING**

Author own post edit pannalaam.

Rules:

* Edited label  
* Edit history internal audit  
* Poll structure after votes restrict  
* Removed media access cleanup  
* Notification optional for major admin edits

Time limit configurable for specific post types.

---

# **29\. POST DELETION**

Deletion options:

* Soft delete  
* User delete  
* Moderator remove  
* Admin permanent delete under policy

User delete pannina:

* Feed-lendhu remove  
* Comments handling policy  
* Media cleanup queue  
* Audit metadata retain  
* Shared links unavailable state

---

# **30\. POST CARD DESIGN**

Every feed post card include:

* Author avatar  
* Display name  
* Verification or role badge  
* Group/context  
* Timestamp  
* Audience indicator  
* Post content  
* Media  
* Reaction summary  
* Comment count  
* Share count  
* Save  
* More menu

More menu:

* Follow/unfollow  
* Save  
* Copy link  
* Hide  
* Mute author  
* Report  
* Block  
* Edit/delete for owner  
* Moderate for authorized user

---

# **31\. TIMESTAMP DISPLAY**

Feed display relative time:

* Just now  
* X minutes ago  
* X hours ago  
* Yesterday  
* X days ago

Post details-la exact date and time accessible-aa irukkanum.

Timezone user preference base-la.

---

# **32\. REACTIONS**

Recommended reactions:

* Like  
* Helpful  
* Celebrate  
* Support  
* Insightful

Requirements:

* One primary reaction per user per object  
* Change reaction  
* Remove reaction  
* Count aggregation  
* Reaction list  
* Blocked user filtering  
* Rate limit

Reaction system popularity manipulation-ai monitor pannanum.

---

# **33\. COMMENTS**

Comment features:

* Text  
* Image optional  
* Link  
* Mention  
* Emoji  
* Reply  
* Reaction  
* Edit  
* Delete  
* Report  
* Pin by authorized role

Comments pagination or lazy-load use pannanum.

---

# **34\. COMMENT REPLIES**

Nested replies recommended maximum visual depth limited-aa irukkanum.

Deep replies flat thread with “Replying to” display pannalaam.

Requirements:

* Parent reference  
* Thread count  
* View replies  
* Collapse  
* Mention parent author  
* Deleted-parent handling

---

# **35\. COMMENT SORTING**

Options:

* Most helpful  
* Latest  
* Oldest

Question post-ku accepted answer first show pannalaam.

---

# **36\. MENTIONS**

Mention supported entities:

* Members  
* Mentors  
* Instructors  
* Groups  
* Courses where appropriate

Mention autocomplete:

* Relationship-aware  
* Permission-aware  
* Block-aware  
* Group membership-aware

Mass mention permissions restricted.

Examples:

* `@everyone`  
* `@group`  
* `@cohort`

Only authorized admins/moderators use panna mudiyanum.

---

# **37\. HASHTAGS**

Hashtag requirements:

* Unicode support  
* Tamil hashtags  
* Tanglish hashtags  
* Valid-character rules  
* Search  
* Follow hashtag optional  
* Trending calculation  
* Abuse moderation

Duplicate case variations normalize pannappadanum.

---

# **38\. POST SHARING**

Share options:

* Share inside TBT  
* Share to group  
* Share through direct message  
* Copy link  
* External share through device share sheet

## **38.1 Share Count Logic**

Share count actual successful or confirmed share actions base-la increment aaganum.

Share button open pannina mattum count increment panna koodathu.

Internal share record successfully create aana count increment.

External share sheet completion platform capability base-la measurable-aana mattum increment pannanum.

False or duplicate repeated counts prevent pannanum.

## **38.2 Private Content Sharing**

Private group or restricted post:

* Unauthorized destination-kku share panna koodathu.  
* External public link disabled.  
* Recipient access verify pannanum.  
* Restricted-content label show pannanum.

---

# **39\. SAVED POSTS**

User posts save pannalaam.

Features:

* Save  
* Unsave  
* Collections optional  
* Search saved posts  
* Filter by type  
* Saved time  
* Private storage

Post delete or access revoke aana unavailable message show pannanum.

---

# **40\. HIDE POST**

User specific post hide panna mudiyanum.

Hide action:

* Feed-lendhu immediate remove  
* Ranking feedback capture  
* Undo  
* Optional reason:  
  * Not interested  
  * Repetitive  
  * Irrelevant  
  * Already seen

Hide report illa.

---

# **41\. MUTE USER**

Mute behavior:

* Muted user posts feed-la show panna koodathu.  
* User-ku notification pogakoodathu.  
* Existing connection or follow remain pannalaam.  
* Direct messages policy configurable.

Mute temporary or permanent optional.

---

# **42\. BLOCK USER**

Blocking effects:

* Both profiles limited  
* Follow connection remove  
* New follow prevent  
* Direct messages prevent  
* Mentions prevent  
* Content visibility reduce  
* Notifications stop  
* Group co-membership privacy-aware handling

Block user-ku explicit notification send panna koodathu.

Safety reporting option block flow-la provide pannalaam.

---

# **43\. MEMBER FOLLOWING**

Follow model one-directional.

Actions:

* Follow  
* Unfollow  
* Requested follow for private profiles  
* Cancel request

Counts:

* Followers  
* Following

Spam follow/unfollow rate limits mandatory.

---

# **44\. CONNECTION MODEL**

Connection mutual professional relationship.

Flow:

1. Send connection request  
2. Add optional note  
3. Recipient accept, decline or ignore  
4. Connection create  
5. Both connection counts update

States:

* Not connected  
* Request sent  
* Request received  
* Connected  
* Declined  
* Blocked

---

# **45\. CONNECTION REQUEST RULES**

* Daily limit  
* New-account limit  
* Duplicate prevention  
* Block check  
* Account restriction check  
* Recipient privacy preference  
* Mutual group or purpose signals

Excessive unsolicited connection requests spam signal-aa use pannalaam.

---

# **46\. CONNECTIONS LIST**

Profile Connections section display:

* Connected member  
* Headline  
* Skills  
* Connection date  
* Mutual groups  
* Message CTA  
* Remove connection

Search and filters:

* Name  
* Skill  
* Industry  
* Location  
* Group

---

# **47\. FOLLOWER AND FOLLOWING LIST**

Features:

* Search  
* Follow/unfollow  
* Connection status  
* Mutual connection count  
* Block-aware visibility

Private account settings respect pannanum.

---

# **48\. MEMBER DIRECTORY**

Directory purpose professional discovery.

Member card:

* Avatar  
* Name  
* Headline  
* Skills  
* Location optional  
* Business stage optional  
* Badges  
* Mutual groups  
* Follow/connect CTA

Filters:

* Skill  
* Profession  
* Industry  
* Business stage  
* Location  
* Language  
* Mentor availability  
* Group  
* Learning path

User directory discoverability off panna privacy setting irukkanum.

---

# **49\. MEMBER PROFILE COMMUNITY VIEW**

Profile sections:

* Header  
* Bio  
* Skills  
* Business interests  
* Achievements  
* Posts  
* Questions  
* Helpful answers  
* Groups  
* Connections  
* Followers  
* Badges  
* Courses/certificates based on privacy

Actions:

* Follow  
* Connect  
* Message  
* Share profile  
* Report  
* Block

---

# **50\. PROFILE BADGES**

Badge types:

* Verified member  
* Mentor  
* Instructor  
* Group admin  
* Top contributor  
* Helpful expert  
* Course graduate  
* Founding member  
* Organization verified

Badge issuance rules transparent-aa irukkanum.

Purchased membership badge trust verification badge madhiri confuse aaga koodathu.

---

# **51\. GROUPS OVERVIEW**

Group types:

* Public group  
* Private visible group  
* Private hidden group  
* Course group  
* Cohort group  
* Program group  
* Organization group  
* Mentor group  
* Interest group  
* Location group  
* Accountability group

---

# **52\. GROUP DATA FIELDS**

Every group:

* Group ID  
* Name  
* Slug  
* Description  
* Cover image  
* Icon  
* Group type  
* Visibility  
* Join method  
* Category  
* Tags  
* Language  
* Owner  
* Admins  
* Moderators  
* Member count  
* Post count  
* Rules  
* Status  
* Created date

---

# **53\. GROUP VISIBILITY**

## **Public**

Group and posts eligible members or visitors-kku visible based on platform policy.

## **Private Visible**

Group discoverable; content members mattum view panna mudiyum.

## **Private Hidden**

Invitation or direct authorized link moolama mattum visible.

## **Course/Cohort Restricted**

Enrollment base-la automatic access.

---

# **54\. GROUP JOIN METHODS**

* Open join  
* Request approval  
* Invitation only  
* Course enrollment  
* Program enrollment  
* Organization assignment  
* Membership plan requirement  
* Admin grant

---

# **55\. GROUP JOIN QUESTIONS**

Admin configurable questions:

* Short text  
* Multiple choice  
* Agreement checkbox

Applications include:

* Answers  
* Applicant profile  
* Mutual members  
* Risk flags  
* Approve/decline

Sensitive questions avoid pannappadanum.

---

# **56\. GROUP ROLES**

* Owner  
* Admin  
* Moderator  
* Contributor  
* Member  
* Read-only member

Permissions independently configurable.

---

# **57\. GROUP HOME**

Sections:

* Cover and description  
* Join or membership state  
* Rules  
* Announcements  
* Create post  
* Feed  
* Channels  
* Events  
* Files  
* Members  
* About

---

# **58\. GROUP RULES**

Group-specific rules:

* Title  
* Description  
* Display order  
* Mandatory acceptance  
* Updated date  
* Change notification

Major rule update aana existing members re-acknowledgment optional.

---

# **59\. GROUP ANNOUNCEMENTS**

Admins/moderators:

* Create announcement  
* Pin  
* Set expiry  
* Send notification  
* Target audience  
* Schedule

Announcement type:

* Important  
* Event  
* Deadline  
* Rule update  
* General

---

# **60\. GROUP CHANNELS**

Channels organize discussions.

Examples:

* General  
* Introductions  
* Questions  
* Wins  
* Resources  
* Jobs  
* Accountability  
* Announcements

Channel fields:

* Name  
* Description  
* Icon  
* Posting permissions  
* Visibility  
* Order  
* Archived status

---

# **61\. GROUP MEMBER MANAGEMENT**

Admin actions:

* View members  
* Approve requests  
* Invite  
* Change role  
* Mute  
* Remove  
* Ban  
* Restore  
* Export permitted list

Every removal or ban reason audit pannappadanum.

---

# **62\. GROUP INVITATIONS**

Invitation methods:

* Member search  
* Email  
* Invite link  
* Organization assignment

Invite link:

* Expiry  
* Usage limit  
* Revocation  
* Group visibility check  
* Audit

---

# **63\. GROUP LEAVING AND REMOVAL**

Member leave:

* Confirmation  
* Draft warning  
* Group notification preference cleanup  
* Rejoin policy

Admin remove:

* Reason  
* Duration  
* Appeal option based on severity  
* Content retention policy

---

# **64\. GROUP ARCHIVING**

Archived group:

* Read-only or fully unavailable configurable  
* New posts disabled  
* Existing content retained  
* Export optional  
* Reopen permission  
* Archive reason

---

# **65\. COMMUNITY SEARCH**

Search across:

* Posts  
* Questions  
* Comments  
* Groups  
* Members  
* Hashtags  
* Resources  
* Events

Search results permission-aware-aa irukkanum.

Filters:

* Content type  
* Group  
* Author  
* Date  
* Language  
* Hashtag  
* Answered/unanswered  
* Media type

---

# **66\. TRENDING SYSTEM**

Trending inputs:

* Unique meaningful interactions  
* Comment quality  
* Save count  
* Helpful votes  
* Recency  
* Trusted participants  
* Report rate

Prevent:

* Like farms  
* Repeated self-reactions  
* Coordinated manipulation  
* Bot activity

Trending period:

* Today  
* This week  
* This month

---

# **67\. DISCOVER PAGE**

Sections:

* Trending posts  
* Recommended groups  
* Suggested members  
* Popular questions  
* Member wins  
* Upcoming events  
* Followed topics  
* New communities

Personalization and diversity balance pannanum.

---

# **68\. DIRECT MESSAGING OVERVIEW**

Messaging purpose:

* Professional conversation  
* Collaboration  
* Mentorship communication  
* Supportive networking

Messaging dating or unsolicited promotional channel madhiri misuse aaga koodathu.

---

# **69\. MESSAGE PERMISSION SETTINGS**

User choose panna mudiyanum:

* Everyone  
* Members I follow  
* Connections only  
* Same groups only  
* Nobody  
* Mentor clients only for mentor context

Admin and support transactional messages separate.

---

# **70\. DIRECT MESSAGE REQUESTS**

Non-connected member message send pannina message request folder-ku pogalaam.

Recipient actions:

* Accept  
* Decline  
* Block  
* Report

Sender limited message count before acceptance.

Media or links before acceptance restrict pannalaam.

---

# **71\. MESSAGE TYPES**

* Text  
* Image  
* File  
* Audio  
* Link  
* Post share  
* Profile share  
* Event share  
* Course share  
* System message

---

# **72\. CHAT SCREEN**

Components:

* Conversation header  
* Participant status  
* Safety menu  
* Message history  
* Typing indicator  
* Read status  
* Composer  
* Attachment  
* Voice  
* Shared context  
* Block/report

---

# **73\. MESSAGE STATUS**

* Sending  
* Sent  
* Delivered  
* Read  
* Failed  
* Deleted

Read receipts user privacy preference base-la configurable.

---

# **74\. MESSAGE EDIT AND DELETE**

Edit:

* Configurable time window  
* Edited label  
* Original version audit only for safety-authorized access

Delete:

* Delete for me  
* Unsend for everyone within time window  
* Moderator safety retention according to policy

---

# **75\. MESSAGE ATTACHMENT SECURITY**

* File scan  
* MIME validation  
* Signed URLs  
* Size limits  
* Dangerous file block  
* Private storage  
* Expiring preview links

---

# **76\. GROUP CHAT**

Group chat available for:

* Program cohorts  
* Accountability teams  
* Mentor groups  
* Organization teams

Features:

* Member list  
* Admin controls  
* Mentions  
* Pinned messages  
* Files  
* Mute  
* Leave  
* Report

Large communities-ku feed/channel better; unlimited large chat avoid pannalaam.

---

# **77\. MESSAGE ANTI-SPAM**

Signals:

* High message volume  
* Repeated same text  
* Many new recipients  
* Link-heavy requests  
* Report rate  
* New account behavior  
* Block rate

Actions:

* Cooldown  
* Message-request limit  
* Link restriction  
* CAPTCHA  
* Temporary messaging restriction  
* Review queue

---

# **78\. COMMUNITY NOTIFICATIONS**

Notification types:

* Reaction  
* Comment  
* Reply  
* Mention  
* Follow  
* Connection request  
* Connection accepted  
* Group invite  
* Group approval  
* Message  
* Accepted answer  
* Helpful answer  
* Announcement  
* Moderation action  
* Post shared  
* Event reminder

---

# **79\. NOTIFICATION GROUPING**

Examples:

> Arun and 8 others reacted to your post.

> 4 new comments on your question.

Requirements:

* Duplicate reduction  
* Grouped actors  
* Deep link  
* Read/unread  
* Priority  
* Expiry  
* Permission check at open time

---

# **80\. PUSH NOTIFICATIONS**

Push notification tap pannina correct destination open aaganum.

Examples:

* Post  
* Comment  
* Message  
* Group  
* Event  
* Member profile  
* Moderation appeal

Deleted or unavailable resource-na fallback screen show pannanum.

---

# **81\. NOTIFICATION PREFERENCES**

Category controls:

* Reactions  
* Comments  
* Mentions  
* Follows  
* Connections  
* Groups  
* Messages  
* Announcements  
* Recommendations  
* Safety

Channels:

* In-app  
* Push  
* Email

Safety notifications disable panna allow panna koodathu.

---

# **82\. COMMUNITY GUIDELINES**

Guidelines clear categories:

* Respect others  
* No harassment  
* No hate  
* No scams  
* No misleading income claims  
* No spam  
* No unauthorized promotion  
* No impersonation  
* Respect privacy  
* Respect copyright  
* Safe financial and health discussions  
* No illegal content

Guidelines Tamil, Tanglish and English-la available-a irukkanum.

---

# **83\. CONTENT REPORTING**

Users report panna mudiyum:

* Post  
* Comment  
* Message  
* Profile  
* Group  
* Event  
* Opportunity  
* Media

Report reasons:

* Spam  
* Scam or fraud  
* Harassment  
* Hate  
* Threat  
* Sexual content  
* Illegal activity  
* Impersonation  
* Privacy violation  
* Copyright  
* Misinformation  
* Self-harm concern  
* Other

---

# **84\. REPORT SUBMISSION FLOW**

1. User object report select pannuvaar.  
2. Reason select pannuvaar.  
3. Optional details add pannuvaar.  
4. Block or mute suggestion.  
5. Report submit.  
6. Confirmation.  
7. Case ID internal create.  
8. Priority classification.  
9. Moderator queue.

Reporter identity reported user-kku reveal panna koodathu.

---

# **85\. MODERATION LEVELS**

Possible actions:

* No action  
* Warning  
* Content label  
* Reduce distribution  
* Remove content  
* Disable comments  
* Temporary posting restriction  
* Messaging restriction  
* Group removal  
* Temporary suspension  
* Permanent ban  
* Law-enforcement escalation where legally required

---

# **86\. CONTENT STATUS MODEL**

* Published  
* Processing  
* Under review  
* Limited distribution  
* Removed by author  
* Removed by moderator  
* Restored  
* Archived  
* Legally restricted

---

# **87\. AUTOMATED MODERATION**

Automated systems may detect:

* Spam  
* Repeated links  
* Abusive words  
* Scam patterns  
* Contact harvesting  
* Dangerous files  
* Impersonation patterns  
* Mass messaging  
* Manipulated engagement

Automated system should:

* Flag  
* Hold  
* Limit  
* Request verification

High-impact permanent actions generally human review require pannanum.

---

# **88\. LANGUAGE-AWARE MODERATION**

Moderation support:

* Tamil  
* Tanglish  
* English  
* Mixed-language content  
* Common transliterated abusive terms  
* Context-aware expressions

Simple keyword blocking mattum rely panna koodathu.

False positives appeal support irukkanum.

---

# **89\. SPAM PREVENTION**

Controls:

* New-user posting limit  
* Link limit  
* Duplicate-content detection  
* CAPTCHA  
* Email/mobile verification  
* Rate limiting  
* Reputation-based limits  
* Community-specific approval  
* Suspicious-domain blocking

---

# **90\. SCAM PREVENTION**

High-risk indicators:

* Guaranteed income  
* Advance fee request  
* Personal bank request  
* Crypto investment pressure  
* Fake job  
* Fake mentor  
* Impersonated brand  
* External messaging redirection  
* Urgent money request

Possible UI warning:

> Payment or personal financial details share pannurathukku munnaadi identity verify pannunga.

---

# **91\. FINANCIAL CLAIM POLICY**

Users business success share pannalaam.

Aana:

* Guaranteed result claim panna koodathu.  
* Misleading screenshots use panna koodathu.  
* Context illaama earnings promise panna koodathu.  
* Paid promotion disclose pannanum.

Admin “Unverified result” label add panna mudiyanum.

---

# **92\. IMPERSONATION HANDLING**

Report requires:

* Impersonated person or organization  
* Evidence  
* Ownership verification  
* Existing verified profile check

Actions:

* Profile review  
* Username freeze  
* Badge removal  
* Account restriction  
* Content removal  
* Appeal

---

# **93\. COPYRIGHT REPORTING**

Copyright complaint workflow:

* Rights holder details  
* Work identification  
* Infringing content URL  
* Declaration  
* Contact information  
* Counter-notice process where applicable  
* Audit and legal retention

Normal report flow and formal legal notice separate-aa maintain pannanum.

---

# **94\. MEMBER SAFETY TOOLS**

User tools:

* Block  
* Mute  
* Restrict message requests  
* Hide posts  
* Report  
* Leave group  
* Privacy controls  
* Manage mentions  
* Disable read receipts optional  
* Download account data

---

# **95\. MINOR AND VULNERABLE USER SAFETY**

Age policy product legal review base-la define pannappadanum.

Required considerations:

* Minimum age  
* Guardian consent where needed  
* Restricted messaging  
* Contact information visibility  
* Adult-minor interactions  
* Reporting priority  
* Sensitive content controls

---

# **96\. MODERATOR CONSOLE**

Moderator dashboard sections:

* Priority queue  
* New reports  
* Automated flags  
* Appeals  
* Suspicious accounts  
* Spam campaigns  
* Group incidents  
* Message safety reports  
* Resolved cases  
* Policy updates

---

# **97\. MODERATION CASE SCREEN**

Display:

* Reported object  
* Context  
* Reporter reason  
* Previous reports  
* User history  
* Related content  
* Automated signals  
* Policy reference  
* Available actions  
* Reviewer notes  
* Decision  
* Appeal eligibility

Sensitive private messages minimum necessary access principle base-la show pannappadanum.

---

# **98\. MODERATION DECISION REQUIREMENTS**

Every decision:

* Policy category  
* Severity  
* Action  
* Duration  
* Reason  
* Reviewer  
* Evidence  
* User notification  
* Appeal status  
* Audit record

---

# **99\. USER MODERATION NOTIFICATION**

Notification include:

* Content/action affected  
* Policy category  
* Action duration  
* General reason  
* Appeal option  
* Support link

Internal detection methods or reporter identity reveal panna koodathu.

---

# **100\. APPEAL SYSTEM**

Eligible user:

1. Appeal open pannuvaar.  
2. Reason submit pannuvaar.  
3. Additional context provide pannuvaar.  
4. Separate reviewer assign pannappaduvaar where possible.  
5. Decision uphold, modify or reverse.  
6. User notify pannappaduvaar.  
7. Audit update.

Appeal time window configurable.

---

# **101\. STRIKE SYSTEM**

Optional trust-and-safety strike model:

* Warning  
* Strike 1  
* Strike 2  
* Final strike  
* Suspension  
* Ban

Aana severe violation immediate suspension or ban trigger pannalaam.

Strike expiry policy category base-la vary pannalaam.

---

# **102\. COMMUNITY REPUTATION**

Positive signals:

* Helpful answers  
* Accepted answers  
* Constructive comments  
* Completed profile  
* Verified identity  
* Consistent participation  
* Low report rate

Reputation use cases:

* Increased posting limits  
* Contributor badge  
* Group moderation eligibility  
* Better discovery

Reputation exact hidden score public display panna thevai illa.

---

# **103\. COMMUNITY POINTS**

Community actions points provide pannalaam:

* Helpful answer  
* Accepted answer  
* Valid resource share  
* Challenge support  
* Group contribution

Avoid rewarding:

* Raw post quantity  
* Empty comments  
* Reaction farming  
* Spam invites

Detailed gamification Volume 06-la define pannappadum.

---

# **104\. ADMIN COMMUNITY DASHBOARD**

Metrics:

* Active community users  
* Posts per day  
* Comments per day  
* Questions answered  
* Response time  
* Group activity  
* Reports  
* Removal rate  
* Spam rate  
* Connection requests  
* Message requests  
* Member retention  
* Community-driven learning actions

---

# **105\. ADMIN POST MANAGEMENT**

Post list columns:

* Author  
* Post preview  
* Type  
* Audience  
* Group  
* Status  
* Reports  
* Reactions  
* Comments  
* Created date  
* Actions

Filters:

* Type  
* Status  
* Group  
* Author  
* Report count  
* Date  
* Language  
* Media  
* Visibility

Actions:

* View  
* Edit policy label  
* Pin  
* Feature  
* Limit  
* Remove  
* Restore  
* Lock comments  
* Send notification  
* Audit history

---

# **106\. ADMIN “SEND NOTIFICATION” ACTION**

Community post admin screen-la authorized user “Send Notification” action use panna mudiyanum.

Configuration:

* Notification title  
* Notification body  
* Audience  
* Channels  
* Schedule  
* Deep-link target  
* Preview  
* Estimated recipient count

Audience options:

* All members  
* Specific membership  
* Specific group  
* Course learners  
* Program cohort  
* Language  
* Role  
* Selected users

Notification tap pannina exact post details page open aaganum.

Deleted or restricted post-na fallback community page open aaganum.

---

# **107\. ADMIN GROUP MANAGEMENT**

Admin functions:

* Create group  
* Edit group  
* Configure visibility  
* Assign owner  
* Assign moderators  
* Manage join policy  
* Configure channels  
* Pin announcements  
* Archive  
* Suspend  
* Delete  
* Export allowed data

---

# **108\. ADMIN MEMBER MANAGEMENT**

Community member actions:

* View profile  
* View community history  
* View reports  
* View warnings  
* Restrict posting  
* Restrict messaging  
* Suspend  
* Ban  
* Restore  
* Add note  
* Assign badge  
* Remove badge

Role-based permission and audit mandatory.

---

# **109\. ADMIN COMMENT MANAGEMENT**

Admin/moderator:

* Search comments  
* Filter reported  
* View parent post  
* Remove  
* Restore  
* Lock thread  
* Warn user  
* Apply restriction

---

# **110\. FEATURED CONTENT**

Admin feature panna mudiyum:

* Post  
* Question  
* Member win  
* Group  
* Member  
* Event

Feature fields:

* Placement  
* Start date  
* End date  
* Audience  
* Priority  
* Label  
* Reason

Paid promotional content clearly label pannappadanum.

---

# **111\. PINNED CONTENT**

Pin scopes:

* Global community  
* Group  
* Channel  
* Course discussion  
* Organization

Maximum pinned count configurable.

---

# **112\. COMMUNITY ANALYTICS EVENTS**

Core events:

* `community_viewed`  
* `feed_viewed`  
* `post_composer_opened`  
* `post_created`  
* `post_viewed`  
* `post_edited`  
* `post_deleted`  
* `post_reacted`  
* `comment_created`  
* `reply_created`  
* `post_saved`  
* `post_shared`  
* `post_hidden`  
* `user_followed`  
* `connection_requested`  
* `connection_accepted`  
* `group_joined`  
* `group_left`  
* `message_request_sent`  
* `message_sent`  
* `content_reported`  
* `user_blocked`

---

# **113\. POST ANALYTICS**

Track:

* Impressions  
* Unique viewers  
* Detail opens  
* Read duration  
* Video watch  
* Reactions  
* Comments  
* Saves  
* Shares  
* Follows generated  
* Reports  
* Hide rate

Author analytics privacy-safe summary-aa show pannalaam.

---

# **114\. GROUP ANALYTICS**

Metrics:

* Member growth  
* Active members  
* Posts  
* Comments  
* Questions  
* Answer rate  
* Event attendance  
* Retention  
* Reports  
* Top topics  
* Moderator response time

---

# **115\. COMMUNITY HEALTH METRICS**

Important health indicators:

* Percentage of posts receiving meaningful response  
* Median question response time  
* New-member first response  
* Helpful-answer rate  
* Report rate  
* Block rate  
* Spam rate  
* Member retention  
* Cross-member interaction diversity  
* Moderator backlog

---

# **116\. DATA ENTITIES**

Core community entities:

* Community Post  
* Post Media  
* Post Link Preview  
* Post Audience  
* Post Draft  
* Post Reaction  
* Comment  
* Comment Reaction  
* Question  
* Accepted Answer  
* Poll  
* Poll Option  
* Poll Vote  
* Hashtag  
* Post Hashtag  
* Mention  
* Saved Post  
* Hidden Post  
* Follow  
* Connection Request  
* Connection  
* Group  
* Group Member  
* Group Role  
* Group Rule  
* Group Channel  
* Group Invitation  
* Direct Conversation  
* Conversation Participant  
* Message  
* Message Attachment  
* Message Request  
* Notification  
* Report  
* Moderation Case  
* Moderation Action  
* Appeal  
* User Block  
* User Mute  
* Community Badge  
* Trust Signal  
* Audit Log

Detailed database schema Volume 14-la define pannappadum.

---

# **117\. API REQUIREMENT GROUPS**

Detailed endpoints Volume 15-la define pannappadum.

Required API groups:

* Feed  
* Posts  
* Media uploads  
* Comments  
* Reactions  
* Polls  
* Questions  
* Saves  
* Shares  
* Follows  
* Connections  
* Member directory  
* Groups  
* Group channels  
* Group members  
* Messaging  
* Notifications  
* Reports  
* Blocking  
* Muting  
* Moderation  
* Appeals  
* Community analytics  
* Admin community operations

---

# **118\. COMMUNITY ERROR CODES**

Posts:

* `POST_NOT_FOUND`  
* `POST_ACCESS_DENIED`  
* `POST_CONTENT_INVALID`  
* `POST_MEDIA_INVALID`  
* `POST_CREATION_RATE_LIMITED`  
* `POST_COMMENTS_LOCKED`  
* `POST_REMOVED`

Groups:

* `GROUP_NOT_FOUND`  
* `GROUP_ACCESS_DENIED`  
* `GROUP_JOIN_APPROVAL_REQUIRED`  
* `GROUP_MEMBERSHIP_REQUIRED`  
* `GROUP_INVITE_INVALID`  
* `GROUP_MEMBER_BANNED`

Connections:

* `CONNECTION_REQUEST_LIMIT_REACHED`  
* `CONNECTION_ALREADY_EXISTS`  
* `CONNECTION_BLOCKED`

Messaging:

* `MESSAGE_PERMISSION_DENIED`  
* `MESSAGE_REQUEST_REQUIRED`  
* `MESSAGE_RATE_LIMITED`  
* `MESSAGE_ATTACHMENT_INVALID`  
* `CONVERSATION_NOT_FOUND`

Moderation:

* `REPORT_ALREADY_SUBMITTED`  
* `CONTENT_UNDER_REVIEW`  
* `ACCOUNT_COMMUNITY_RESTRICTED`  
* `APPEAL_WINDOW_CLOSED`

---

# **119\. PERFORMANCE REQUIREMENTS**

* Cursor-based feed pagination  
* Infinite-scroll duplicate prevention  
* Optimistic reaction updates  
* Comment lazy loading  
* Media CDN  
* Thumbnail generation  
* Background video processing  
* Message real-time delivery  
* Notification batching  
* Search indexing  
* Permission-aware caching  
* Partial component failure isolation

Feed first meaningful content quickly display aaganum.

---

# **120\. REAL-TIME REQUIREMENTS**

Real-time features:

* New messages  
* Typing indicators  
* Read receipts  
* New comments optional  
* Reaction count updates  
* Notification count  
* Group announcements  
* Moderation removal

Connection interruption aana retry and reconciliation logic irukkanum.

---

# **121\. OFFLINE AND LOW-NETWORK SUPPORT**

Mobile:

* Cached feed items  
* Draft post  
* Draft comment  
* Offline saved items  
* Pending reaction queue  
* Pending post upload indication  
* Retry manager

Final post publish with large media network confirmation require pannanum.

Duplicate submission avoid pannanum.

---

# **122\. SECURITY REQUIREMENTS**

* Server-side permission checks  
* Input sanitization  
* Secure media uploads  
* Malware scanning  
* Signed media access  
* Rate limiting  
* Anti-CSRF  
* XSS prevention  
* Link reputation checks  
* Message authorization  
* Private group isolation  
* Audit logging  
* Moderator permission isolation  
* Sensitive-data masking  
* Abuse-detection monitoring

---

# **123\. PRIVACY REQUIREMENTS**

* Private-group content isolate pannanum.  
* Block relationship respect pannanum.  
* Deleted user identity anonymize according to policy.  
* Member directory opt-out provide pannanum.  
* Contact details default hidden.  
* Message contents unnecessary analytics-ku use panna koodathu.  
* Moderator access minimum necessary basis-la irukkanum.  
* Public profile and community visibility separate controls irukkanum.

---

# **124\. ACCESSIBILITY REQUIREMENTS**

* Keyboard-accessible feed  
* Screen-reader post labels  
* Image alt text  
* Video captions  
* Audio transcript support  
* Accessible reaction controls  
* Comment focus management  
* Clear report flow  
* Non-color status indicators  
* Reduced motion  
* Accessible message announcements  
* Poll selection labels

---

# **125\. LOCALIZATION REQUIREMENTS**

Community interface:

* Tamil  
* Tanglish  
* English

support pannanum.

Requirements:

* Unicode hashtags  
* Mixed-language search  
* Localized timestamps  
* Localized moderation reasons  
* Tamil-friendly line breaking  
* User content automatic translation optional and clearly labeled  
* Original content always accessible

---

# **126\. QA TEST AREAS**

## **Feed**

* Ranking  
* Latest  
* Following  
* Pagination  
* Block/mute filtering  
* Empty states  
* Deleted posts

## **Posts**

* Text  
* Images  
* Video  
* Audio  
* Document  
* Link  
* Question  
* Poll  
* Achievement  
* Draft  
* Edit  
* Delete

## **Interactions**

* Reactions  
* Comments  
* Replies  
* Mentions  
* Hashtags  
* Save  
* Share count  
* Hide

## **Networking**

* Follow  
* Connection request  
* Accept  
* Decline  
* Remove  
* Block  
* Directory

## **Groups**

* Public  
* Private  
* Hidden  
* Join approval  
* Channels  
* Roles  
* Removal  
* Archive

## **Messaging**

* Requests  
* Messages  
* Media  
* Read receipts  
* Block  
* Spam limits

## **Moderation**

* Report  
* Queue  
* Action  
* Notification  
* Appeal  
* Restore  
* Audit

---

# **127\. MVP PRIORITY**

## **P0 – Launch Critical**

* Community feed  
* Text/image/video posts  
* Full image viewer  
* Comments and replies  
* Reactions  
* Post save  
* Correct share-count behavior  
* Member follow  
* Connections  
* Public/private groups  
* Group member management  
* Direct messaging  
* Notifications and deep links  
* Report  
* Block  
* Mute  
* Admin post management  
* Basic moderation  
* Spam rate limits  
* Community analytics basics

## **P1 – Growth Critical**

* Questions and accepted answers  
* Polls  
* Member directory  
* Group channels  
* Message requests  
* Opportunity posts  
* Trending  
* Reputation signals  
* Appeals  
* Automated moderation  
* Scheduled posts  
* Detailed group analytics

## **P2 – Expansion**

* Audio posts  
* Advanced peer collaboration  
* AI feed recommendations  
* Translation  
* Advanced trust scoring  
* Community marketplace integration  
* Native large-group live chat  
* Advanced anti-fraud network detection

---

# **128\. DEFINITION OF DONE**

Community feature complete-nu consider panna:

1. Functional requirements implement aaganum.  
2. Backend permissions enforce aaganum.  
3. Block, mute and privacy rules work aaganum.  
4. Mobile and desktop responsive aaganum.  
5. Loading, empty and error states complete aaganum.  
6. Media properly process aaganum.  
7. Analytics events fire aaganum.  
8. Moderation and report workflow work aaganum.  
9. Security review pass aaganum.  
10. Accessibility checks pass aaganum.  
11. Tamil, Tanglish and English strings available-a irukkanum.  
12. QA test pass aaganum.  
13. UAT approval receive aaganum.  
14. Monitoring configure aaganum.  
15. Documentation update aaganum.

---

# **129\. VOLUME 05 ACCEPTANCE CRITERIA**

Volume 05 approved-nu consider panna:

* Community architecture defined.  
* Feed types and ranking rules documented.  
* All core post types defined.  
* Media behavior documented.  
* Comments, reactions, mentions and hashtags defined.  
* Correct share-count behavior established.  
* Following and connections documented.  
* Groups and channels documented.  
* Direct messaging workflow defined.  
* Notification and deep-link requirements documented.  
* Blocking, muting and reporting defined.  
* Moderation and appeal lifecycle documented.  
* Admin community operations defined.  
* Analytics, security, privacy and accessibility requirements established.  
* MVP priorities approved.

---

# **130\. FINAL COMMUNITY PRINCIPLE**

Tamil Business Tribe Community-oda success:

* Evalo posts publish aachu  
* Evalo likes vandhuchu  
* Evalo time users scroll pannanga

indha metrics mattum base-la measure panna koodathu.

Real success:

* Oru member question-ku useful answer kidaithatha?  
* Oru beginner correct person-kitta connect aanaara?  
* Oru learner course-ai continue panna community help pannucha?  
* Oru entrepreneur collaboration discover panninaara?  
* Oru unsafe or scam interaction quickly prevent pannappattatha?  
* Members respectful-aa support pannangala?  
* Community participation real business outcome-kku lead pannucha?

Tamil Business Tribe Community final principle:

> Community attention collect panna illa; trust build panna, knowledge share panna, meaningful connections create panna and members-ai progress-kku move panna build pannappadanum.

