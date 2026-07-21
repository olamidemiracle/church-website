# Setup Guide — Simple, Step-by-Step

This guide does not assume you know anything about computers or websites already.
Every step tells you exactly what to click, what to type, and what you should see
after. Go slowly. Do not skip steps. If a screen looks a little different from what
is described (companies change their websites sometimes), look for a button with a
similar name and click that instead.

**Before you start, get a notebook or a notes app ready.** You will create several
passwords and copy several codes during this guide. Write every single one down as
you go, in one safe place. Do not skip this — you will need these codes again later.

---

## Some words explained first

- **Browser** — the app you use to visit websites (Chrome, Safari, Edge, Firefox).
- **Account** — a login (an email address + a password) that lets a website remember
  you.
- **Click** — press once with your mouse, or tap once on a touchscreen/trackpad.
- **Copy** — select text and press Ctrl+C (Windows) or Cmd+C (Mac). Or right-click the
  text and choose **Copy**.
- **Paste** — press Ctrl+V (Windows) or Cmd+V (Mac) to place copied text somewhere
  else. Or right-click and choose **Paste**.
- **Field / box** — an empty rectangle on a webpage where you type something in.
- **Dashboard** — the main screen you see after logging in to a service.
- **Terminal** — a small black or white window on your computer where you type
  commands instead of clicking. We explain exactly how to open it and what to type
  in Part A.

---

# PART A — Put your project on GitHub

GitHub is a free website that stores a copy of your project's files online, safely,
with a history of every change. This also lets the deploying website (Vercel, in Part
C) automatically publish your site whenever you make a change.

### A.1 — Create your GitHub account

1. Open your browser and go to: **github.com**
2. In the top-right corner, click **Sign up**.
3. Type in an email address you check often.
4. Create a password. **Write this password down in your notebook now**, labeled
   "GitHub password."
5. Pick a username (this will be public — e.g. `gracechapel-admin`). Write it down.
6. Follow the on-screen steps (GitHub may ask you to solve a small puzzle to prove
   you're a real person — just follow the instructions on screen).
7. GitHub will send a code to your email. Open your email, find the code, and type it
   into the box GitHub shows you.
8. You are now logged in to GitHub. You'll see a welcome screen — you can skip any
   "let's set up a project" wizard it offers; we'll do that ourselves below.

### A.2 — Create a new, empty project space (called a "repository")

1. In the top-right corner of GitHub, click the **+** icon, then click
   **New repository**.
2. In the box labeled "Repository name," type: `church-website`
3. Leave it set to **Public** (or choose **Private** if you'd rather only invited
   people can see it — either is fine).
4. **Important:** do NOT check any of the boxes that say "Add a README file," "Add
   .gitignore," or "Choose a license." Leave them all unchecked. Your project already
   has these.
5. Click the green **Create repository** button at the bottom.
6. You'll now see a page with some grey command-line instructions. Leave this page
   open — you'll come back to it in step A.4.

### A.3 — Install the tool that uploads your files (called "Git")

1. Go to **git-scm.com/downloads** in your browser.
2. Click the download link for your computer type (Windows or Mac). The site
   usually detects this automatically and shows the right button.
3. Open the downloaded file and click **Next**/**Continue** through the installer,
   keeping every default option, until it finishes and you can click **Finish**.

### A.4 — Open the Terminal window

- **On Windows:** click the Start menu (bottom-left), type `Git Bash`, and click it
  when it appears. A black window opens — this is your Terminal.
- **On Mac:** click the magnifying glass icon top-right (or press Cmd+Space), type
  `Terminal`, and press Enter. A window opens — this is your Terminal.

You'll type commands into this window one line at a time, pressing **Enter** after
each one to run it. Don't worry if you don't understand the commands — just copy and
paste them exactly as shown.

### A.5 — Move into your project folder

1. Find where you unzipped the `church-website-phase1.zip` file I gave you (probably
   in your **Downloads** folder). Inside it there should be a folder called
   `church-website`.
2. In the Terminal window, type `cd ` (with a space after it — do not press Enter
   yet).
3. Now drag the `church-website` folder from your file explorer/Finder window
   directly into the Terminal window. Its full location will appear automatically
   after `cd `.
4. Press **Enter**.
5. The Terminal should now show `church-website` somewhere in the line — this means
   you're "inside" the project folder.

### A.6 — Connect your project folder to GitHub and upload it

1. Go back to the GitHub page from step A.2 (the one with grey instructions). Find
   the line that looks like this (yours will have your own username):
   ```
   git remote add origin https://github.com/YOUR_USERNAME/church-website.git
   ```
2. Copy that exact line from GitHub's page.
3. Paste it into your Terminal window (right-click → Paste, or Ctrl+V/Cmd+V), then
   press **Enter**.
4. Type this line exactly, then press **Enter**:
   ```
   git push -u origin main
   ```
5. A window may pop up asking you to log in to GitHub — do that (or a browser tab may
   open asking you to click **Authorize**; click it).
6. Wait for it to finish. You'll see some text scroll by, ending with something like
   `branch 'main' set up to track...`. That means it worked.
7. Now type this line and press **Enter**:
   ```
   git push -u origin develop
   ```
8. Go back to your browser, refresh the GitHub repository page. You should now see
   all your project's files listed there. **Your project is now safely on GitHub.**

### A.7 — Protect your main branch (stops mistakes from breaking your live site)

1. On your repository's GitHub page, click the **Settings** tab (top row, with a
   little gear icon).
2. In the left-hand menu, click **Branches**.
3. Find the section called "Branch protection rules" and click **Add branch
   protection rule** (sometimes called **Add rule** or **Add classic branch
   protection rule**).
4. In the box "Branch name pattern," type: `main`
5. Check the box that says **Require a pull request before merging**.
6. Scroll down and click the green **Create** button.

This means no change can be published to your live site until you (or someone you
choose) reviews and approves it first.

---

# PART B — Create your two Firebase projects

Firebase is where all your website's data will live — prayer requests, sermons,
events, membership forms, photos, everything. You will create **two** separate
copies: one called **staging** (for testing, safe to break) and one called **prod**
(the real one your visitors use). You will repeat every step in this part twice —
once for each.

### B.1 — Create your Firebase (Google) account

1. Go to **console.firebase.google.com**
2. If you already have a Gmail/Google account, click **Sign in** and log in with it.
3. If you don't have one, click **Create account**, and follow Google's steps to make
   a free Gmail address. **Write down this email and password in your notebook.**

### B.2 — Create the STAGING project

1. On the Firebase homepage, click **Add project** (or **Create a project**).
2. Type a name: `church-website-staging`
3. Click **Continue**.
4. It may ask about Google Analytics — you can turn this **off** for staging (click
   the toggle switch so it's grey/off), then click **Create project**.
5. Wait for the spinner to finish, then click **Continue**.
6. You are now on your project's dashboard. **Write down "church-website-staging"**
   as the name of Project #1.

### B.3 — Register a "web app" inside the staging project

1. On the dashboard, look for a small icon that looks like `</>` — it's usually in
   the middle of the page under "Get started by adding Firebase to your app." Click
   it.
2. Type a nickname: `Church Website Web`
3. Leave the hosting checkbox **unchecked**.
4. Click **Register app**.
5. Firebase now shows you a grey box of code with several lines like `apiKey: "..."`,
   `authDomain: "..."`, and so on. **This is very important** — copy each value (the
   text inside the quote marks) into your notebook, next to these labels:
   - `apiKey` → write as **FIREBASE_API_KEY**
   - `authDomain` → write as **FIREBASE_AUTH_DOMAIN**
   - `projectId` → write as **FIREBASE_PROJECT_ID**
   - `storageBucket` → write as **FIREBASE_STORAGE_BUCKET**
   - `messagingSenderId` → write as **FIREBASE_MESSAGING_SENDER_ID**
   - `appId` → write as **FIREBASE_APP_ID**
   - `measurementId` → write as **FIREBASE_MEASUREMENT_ID** (may not exist if you
     turned off Analytics — that's fine, leave it blank)
6. Click **Continue to console**.

### B.4 — Turn on sign-in for the admin dashboard (Authentication)

1. On the left-hand menu, find **Build**, click it to expand it, then click
   **Authentication**.
2. Click **Get started**.
3. You'll see a list of sign-in methods. Click **Email/Password**.
4. Click the toggle switch to turn it **on** (it turns blue).
5. Click **Save**.

### B.5 — Turn on the database (Firestore)

1. On the left-hand menu, under **Build**, click **Firestore Database**.
2. Click **Create database**.
3. A window pops up asking about location — choose **Production mode** (not test
   mode). Click **Next**.
4. Choose a location close to your church's country from the dropdown list. Click
   **Enable**.
5. Wait for it to finish setting up.

### B.6 — Turn on file storage (for photos, sermon audio, PDFs)

1. On the left-hand menu, under **Build**, click **Storage**.
2. Click **Get started**.
3. Choose **Production mode**, click **Next**.
4. Confirm the same location as before, click **Done**.

### B.7 — Turn on spam protection (App Check)

1. On the left-hand menu, under **Build**, click **App Check**.
2. Find your web app in the list and click on it (or click **Get started**).
3. Choose **reCAPTCHA v3** as the provider.
4. This will ask for a "site key." Open a new browser tab and go to:
   **google.com/recaptcha/admin**
5. Log in with the same Google account if asked.
6. Click the **+** (plus) button to register a new site.
7. Type a label: `Church Website`
8. Under "reCAPTCHA type," choose **reCAPTCHA v3**.
9. Under "Domains," type `localhost` on one line, then press Enter, and add your real
   website address on another line if you already know it (you can add more domains
   later, so don't worry if you don't have one yet).
10. Check the box agreeing to the terms, then click **Submit**.
11. You'll now see a **Site Key** and a **Secret Key**. Copy the **Site Key** — go
    back to the Firebase tab and paste it into the box there. Click **Save**.
12. In your notebook, write this down as **APP_CHECK_RECAPTCHA_SITE_KEY**.

### B.8 — Create the first settings document

1. Go back to **Firestore Database** in the left-hand menu.
2. Click **Start collection**.
3. In "Collection ID," type: `settings`
4. Click **Next**.
5. In "Document ID," type: `general`
6. Now add these fields one at a time (click **Add field** for each one after the
   first):
   - Field: `churchName` — Type: `string` — Value: your church's real name
   - Field: `address` — Type: `string` — Value: your church's address
   - Field: `phone` — Type: `string` — Value: your church's phone number
   - Field: `email` — Type: `string` — Value: your church's contact email
7. Click **Save**.

### B.9 — Repeat everything in Part B for your SECOND (production) project

Go all the way back to step B.2 and do steps B.2 through B.8 again, but this time:

- Name the project `church-website-prod` instead.
- Write down its config values with the same labels as before, but keep them in a
  **separate list** clearly marked "PRODUCTION" so you never mix them up with
  staging.

You should now have two full sets of Firebase values written down — one labeled
STAGING, one labeled PRODUCTION.

### B.10 — Publish the security rules that were already written for you

This step uses the Terminal again (see Part A.4 for how to open it).

1. Open Terminal and move into your project folder again (repeat step A.5 if it's a
   new window).
2. Type this and press Enter — a browser tab will open asking you to log in and
   click **Allow**:
   ```
   npm install -g firebase-tools
   ```
   (wait for it to finish — this may take a minute or two)
3. Type this and press Enter:
   ```
   firebase login
   ```
   Log in with the same Google account you used for Firebase, click **Allow**.
4. Type this and press Enter:
   ```
   firebase use --add
   ```
   A list of your Firebase projects appears. Use the arrow keys to choose
   `church-website-staging`, press Enter. When it asks for an alias, type `staging`
   and press Enter.
5. Type this again and press Enter:
   ```
   firebase use --add
   ```
   This time choose `church-website-prod`, and when asked for an alias, type
   `production`, press Enter.
6. Finally, type this and press Enter:
   ```
   firebase deploy --only firestore:rules,storage:rules
   ```
   Wait for it to say "Deploy complete!" This has now safely locked down both your
   staging and production databases using the rules already prepared for you.

---

# PART C — Connect your project to Vercel (this is what makes your site live on the internet)

### C.1 — Create your Vercel account

1. Go to **vercel.com**
2. Click **Sign Up**.
3. Choose **Continue with GitHub** (this is the easiest option since your project is
   already there).
4. Log in with your GitHub account from Part A, and click **Authorize Vercel** if
   asked.

### C.2 — Import your project

1. On your Vercel dashboard, click **Add New...** then **Project**.
2. Find `church-website` in the list (it's the one you pushed to GitHub in Part A)
   and click **Import** next to it.
3. Leave all the build settings as they are (Vercel usually detects everything
   automatically for a simple site).
4. Do **not** click **Deploy** yet — first go to step C.3 below to add your secret
   values, otherwise your site will not work correctly the first time.

### C.3 — Add your Firebase values as "Environment Variables"

This is how you safely give your website access to your Firebase project without
putting the codes directly into files anyone could see.

1. While still on the import screen, find the section called **Environment
   Variables** (or, if you already clicked Deploy, go to your project's page, click
   the **Settings** tab, then **Environment Variables** in the left menu).
2. You'll add one row per value. For each row:
   - Type the name exactly as shown (e.g. `FIREBASE_API_KEY`) in the "Key" box.
   - Paste the matching value in the "Value" box.
   - Under "Environment," you'll see checkboxes for **Production**, **Preview**, and
     **Development**.
3. **For your PRODUCTION Firebase values:** check only the **Production** box, then
   click **Add**.
4. **For your STAGING Firebase values:** using the _same key names_ again (e.g.
   `FIREBASE_API_KEY` a second time), check only the **Preview** and **Development**
   boxes, then click **Add**.
5. Repeat this for every value: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`,
   `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`,
   `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID`, and
   `APP_CHECK_RECAPTCHA_SITE_KEY`.

This means: whenever you're just testing changes, your site quietly uses the
staging/testing database. Only your final, live website (the "Production" one) uses
the real database your congregation's information goes into.

### C.4 — Deploy

1. Now click the black **Deploy** button.
2. Wait for the progress screen to finish (usually 1–2 minutes).
3. When you see "Congratulations," click **Continue to Dashboard**, then click
   **Visit** to see your live website address (it will look like
   `church-website-yourname.vercel.app`).
4. Write this web address down.

### C.5 — Confirm which branch is your live site

1. On your project page in Vercel, click **Settings**, then **Git** in the left menu.
2. Confirm "Production Branch" is set to `main`. If not, change it to `main` and
   click **Save**.

This means: any change pushed to the `main` branch on GitHub automatically becomes
your real, live website. Any other branch (or a pull request) automatically gets its
own private preview link instead, using your staging database — so you can always
test safely before something goes live.

### C.6 — Add your own domain (optional, only if you already own one)

1. On your project page in Vercel, click **Settings**, then **Domains**.
2. Type your domain (e.g. `gracechapel.org`) and click **Add**.
3. Vercel shows you one or two lines to add at wherever you bought your domain
   (called your "DNS settings"). Log in to that domain provider's website, find its
   DNS settings page, and add exactly what Vercel showed you.
4. This can take anywhere from a few minutes to a few hours to start working. You can
   skip this step entirely for now and come back to it later — your `.vercel.app`
   address will work in the meantime.

---

# PART D — EmailJS (so you get an email whenever someone submits a form)

### D.1 — Create your account

1. Go to **emailjs.com**
2. Click **Sign Up Free**.
3. Type your email and create a password. **Write the password down.**
4. Confirm your email if asked (check your inbox for a confirmation link and click
   it).

### D.2 — Connect the inbox that should receive form notifications

1. Once logged in, click **Email Services** in the left-hand menu.
2. Click **Add New Email Service**.
3. Choose your email provider (e.g. **Gmail**, **Outlook**), then click **Connect
   Account** and log in when prompted, clicking **Allow**/**Continue** on any
   permission screens.
4. Once connected, click **Create Service**.

### D.3 — Create a template for form messages

1. Click **Email Templates** in the left-hand menu.
2. Click **Create New Template**.
3. In the Subject box, type something like: `New form submission: {{form_name}}`
4. In the Content box, type something like:
   ```
   You received a new submission.

   Form: {{form_name}}
   Name: {{submitter_name}}
   Message: {{message}}
   ```
   (Leave the `{{ }}` parts exactly as they are — the website will fill these in
   automatically later.)
5. Click **Save**.

### D.4 — Collect your three codes

1. Click **Email Services** again — find the service you created, and copy its
   **Service ID**. Write it down as **EMAILJS_SERVICE_ID**.
2. Click **Email Templates** — find your template, and copy its **Template ID**.
   Write it down as **EMAILJS_TEMPLATE_ID**.
3. Click your account icon (top-right) → **Account** → **General**. Copy the
   **Public Key**. Write it down as **EMAILJS_PUBLIC_KEY**.
4. Go back to your Vercel project → **Settings** → **Environment Variables** and add
   these three the same way you did in Part C.3 (check Production, Preview, and
   Development for all three — these aren't sensitive per-environment the way
   Firebase keys are).

---

# PART E — Paystack (so your church can accept online giving)

⚠️ **Important safety note before you start:** Paystack gives you two keys — a
**Public Key** and a **Secret Key**. The Public Key is safe to use on the website
itself. The **Secret Key must never appear anywhere on the website or be shared with
anyone** — it will only be used later, inside a private server-side piece we build in
a future phase (never inside the files a visitor's browser can see). Treat the Secret
Key like a bank PIN.

### E.1 — Create your account

1. Go to **dashboard.paystack.com/#/signup**
2. Fill in your name, email, and a password. **Write the password down.**
3. Check your email for a verification link and click it.
4. Log in.

### E.2 — Complete business verification

1. Paystack will ask for information about your church/organization (name,
   address, bank account details) to approve you for accepting real payments.
   Follow its on-screen form step by step, filling in each box with the requested
   information.
2. While this is being reviewed (it can take a day or two), you can still test
   everything using **Test Mode** — look for a toggle switch near the top of the
   dashboard labeled **Test Mode** / **Live Mode**, and make sure it's set to
   **Test Mode** for now.

### E.3 — Collect your API keys

1. Click **Settings** (usually a gear icon or in the left-hand menu).
2. Click **API Keys & Webhooks**.
3. You'll see a **Test Public Key**, **Test Secret Key**, and (once approved) a
   **Live Public Key** and **Live Secret Key**.
4. Copy the **Test Public Key** for now. Write it down as **PAYSTACK_PUBLIC_KEY**.
5. Copy the **Test Secret Key**. Write it down as **PAYSTACK_SECRET_KEY** — remember,
   this one is private. Do not paste it into Vercel's normal environment variables
   screen for the front end; we will handle this specific key separately in a later
   phase when we build the server-side donation handler.
6. Once your business verification is approved, come back to this same page and
   repeat steps 4–5 using the **Live** keys instead of Test keys, so real donations
   can be processed.

---

## Final Checklist

Go through this list and check off each box as you complete it:

- [ ] GitHub account created, password saved
- [ ] `church-website` repository created on GitHub
- [ ] Git installed on your computer
- [ ] Project uploaded to GitHub (`main` and `develop` branches both visible online)
- [ ] Branch protection turned on for `main`
- [ ] Google/Firebase account created
- [ ] `church-website-staging` project created with Authentication, Firestore,
      Storage, and App Check all turned on
- [ ] `church-website-prod` project created with the same four things turned on
- [ ] All Firebase values written down for both staging and production, clearly
      labeled
- [ ] `settings/general` document created in both Firebase projects
- [ ] Security rules deployed successfully ("Deploy complete!" message seen)
- [ ] Vercel account created and linked to GitHub
- [ ] Project imported into Vercel
- [ ] All environment variables added (Production values under Production, staging
      values under Preview/Development)
- [ ] Site successfully deployed and visited at its `.vercel.app` address
- [ ] EmailJS account, service, and template created; three codes written down and
      added to Vercel
- [ ] Paystack account created; Test Public Key and Test Secret Key written down

Once every box is checked, message me and we'll move on to **Phase 2 — building the
actual pages of your website.**
