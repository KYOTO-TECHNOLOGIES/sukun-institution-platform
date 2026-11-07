# Operating your institution in Sukun

## First setup

1. Sign in as the institution administrator. Verify the institution name, address and contact information under **Institution > Institution settings**.
2. Create an **Academic year** and mark it current. Add a syllabus, classes and class divisions with realistic capacities.
3. Under **People & access**, create staff accounts with unique login phone numbers and strong initial passwords. Choose the role matching each responsibility. Staff can change their own password under **Profile & security**.
4. Create teaching profiles in **Staff directory**, then add subjects, teaching assignments and timetable periods. Timetable checks reject overlapping periods for a division or teacher.
5. Configure class/year-specific **Fee structures** before enrolling students if mandatory fees should be assigned automatically.

## From enquiry to admission

Marketing staff record campaigns, enquiries and scheduled follow-ups. Keep the enquiry stage and next contact date current; overdue follow-ups appear on the dashboard.

Admissions staff create an application with a student login phone, division and academic year. Verify documents, then use **Review** to approve or reject with a reason. **Enroll student** creates the student account and student record together, checks capacity and assigns applicable mandatory fees. Supply a separate guardian phone and password to create a parent login during enrollment, or create the parent account separately and link it under **Parent links**. Existing parent accounts must be linked explicitly.

Use a distinct account for each person. A student's login phone cannot be shared with a guardian account. The system does not send initial passwords by SMS or email; share them through your institution's secure onboarding process.

## Learning and assessment

Teachers open **Course studio**, create their course, and add lessons, resource links, assignments and quizzes. Publish the course and the intended learning items, then enroll students. Teachers manage their own assigned courses. A quiz requires its questions, choices and correct answers before publication; student responses are marked by the server, which does not expose the answer key beforehand.

Students open **My learning & family** to view lessons, mark completion, submit assignments and take quizzes. Teachers return marks and feedback in **Grading desk**. Parents can review only their linked children and cannot submit their work.

Class homework is managed in **Homework** and **Homework review**. Formal exams have an exam period, subject papers and gradebook. Results become visible to students/parents only when the exam period is published.

## Fees and accounts

The **Student fee ledger** lists billed totals, paid amounts and outstanding balances. **Collections & receipts** records money already received by staff. Choose the correct bill and payment method, enter the amount and bank/reference details, then print the receipt. Overpayments and duplicate references for the same bill are rejected.

Use **Refunds** to record money returned and the reason. Refunds cannot exceed the original unrefunded payment; balances reconcile automatically. Payments and refunds cannot be edited or deleted. Correct financial history with a new appropriate transaction rather than replacing an old receipt.

Record expenses and payroll as drafts/pending items. An administrator approves; accounts staff record payment. Payroll is a monthly payment register, not automatic tax or statutory payroll calculation.

## Attendance, support and certificates

**Student attendance** loads a whole division for a selected date and saves the register as one validated batch. Staff attendance and leave have separate registers. Teachers request their own leave; authorized HR/administration staff review it.

The student profile groups permitted guardian, fee, results and development records. **Student support**, memorization, prayer participation and achievements have separate pastoral permissions so accounts and admissions staff do not automatically see sensitive observations.

Use **Certificate register** for numbered certificate issuance and printing. Issued certificates are immutable. The printed document includes space for an authorized signature and institution seal; it is not an electronically signed credential.

## Campus operations

Library issues and returns update stock; returning a loan twice does not increase stock twice. Transport and hostel allocations enforce capacity. Their monthly amounts are reference information; billing is managed through fee structures. Front-desk tickets move from waiting to called, serving and completed (or cancelled). Assets and support tickets help staff track maintenance and equipment.

## Permissions and oversight

Role permissions are enforced by the API as well as the navigation. An administrator can add individual read/write overrides in **People & access**. Student and parent accounts cannot receive staff overrides. Write permission does not automatically grant read permission, so review both settings when granting access. Administrator approval and course/guardian ownership rules still apply to protected workflows.

The overview highlights outstanding fees, follow-ups, attendance concerns and grading work, depending on the user's role. CSV exports support analysis outside the application. **Activity audit** lists successful API changes with actor/time/path; it is not a field-by-field immutable audit archive.

Before using live student records, follow the deployment guide and perform institution acceptance testing. The local demo uses synthetic data and has a separate database.
