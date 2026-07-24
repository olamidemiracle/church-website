# Admin Dashboard — User Guide

This guide is for church staff who will use the admin dashboard day-to-day —
adding sermons, reviewing prayer requests, updating service times, and so on. If
you're looking for the technical setup instructions (creating Firebase projects,
deploying, etc.), see `SETUP_GUIDE.md` instead — this guide assumes all of that is
already done and you just want to know how to _use_ the dashboard.

---

## Logging In

1. Go to your website's address, followed by `/admin/login` — for example,
   `https://yourchurch.org/admin/login`.
2. Enter your email address and password, then click **Sign In**.
3. Forgot your password? Click **Forgot your password?** on the login screen,
   enter your email, and follow the link sent to you.

Once signed in, you'll land on the **Dashboard Home**, showing quick counts of
things that need your attention — new prayer requests, pending membership
applications, unread messages, and testimonies awaiting review.

---

## Understanding Roles

There are two types of admin accounts:

- **Editor** — can manage all content (sermons, events, ministries, gallery,
  leadership, announcements) and review all submissions (prayer requests,
  membership applications, visitors, messages, testimonies).
- **Superadmin** — everything an Editor can do, **plus** Website Settings,
  Donations, Activity Log, and (in the future) managing other staff accounts.

You'll see a small badge next to your name in the top-right corner showing which
role your account has. If a page in the sidebar shows "Soon" instead of being
clickable, that feature hasn't been built yet.

---

## Managing Content

The following modules all work the same way: **Manage Sermons**, **Manage
Events**, **Manage Ministries**, **Manage Leadership**, and **Manage
Announcements**.

### Adding something new

1. Click the module in the sidebar (e.g. "Manage Sermons").
2. Click **+ Add New** near the top of the page.
3. Fill in the fields. Anything with a red error message under it after you try
   to save is required.
4. For fields with a file picker (like "Thumbnail Image" or "Audio File"), click
   the box and choose a file from your computer. You don't need to upload
   anything if you're not ready — you can always come back and edit later to add
   it.
5. Click **Save**.

### Editing something

1. Find the item in the list (table) on that module's page.
2. Click **Edit** on its row.
3. Change whatever needs changing. If you don't pick a new file for an image/
   audio/PDF field, the existing one stays as-is — you only need to choose a new
   file if you're replacing it.
4. Click **Save**.

### Deleting something

1. Click **Delete** on that item's row.
2. Confirm when asked. **This cannot be undone.**

### A note on "Slug" fields

Several forms have a "Slug" field (e.g. sermons, events, ministries, news). This
is the web-address-friendly version of the title — lowercase, words separated by
dashes, no spaces or special characters (e.g. `sunday-worship-guide`, not
`Sunday Worship Guide!`). This is what appears in the page's web address, so keep
it short and readable. Once you publish something and share its link, try not to
change the slug afterward — the old link would stop working.

---

## Manage Gallery (a little different)

Gallery works in two steps, since photos live inside albums:

1. **Add Album** — give it a title, description, and optional cover image. Save.
2. Click **Manage Photos** on that album's row to open it.
3. Inside, choose a photo file and an optional caption, then click **Add Photo**.
   Repeat for each photo.
4. Click **Delete** under any photo to remove it, or **Back to Albums** when
   you're done.

---

## Reviewing Submissions

### Prayer Requests

Each request shows the person's name (or "Anonymous"), their message, and a
status dropdown (**New / Praying / Answered**) — update it as your team prays
through requests. A **Confidential** badge means the person asked for privacy —
it's still visible to any signed-in staff member, but should never be shared
outside the church office or discussed publicly.

### Membership Applications

Shows every application with a status dropdown (**Pending / Approved**). Click
**Export CSV** near the top to download the full list as a spreadsheet file you
can open in Excel or Google Sheets — handy for printing or record-keeping.

### Visitor Submissions

Shows everyone who said they're planning to visit, with a follow-up status
(**New / Contacted / Completed**) your welcome team can update as they reach out.

### Contact Messages

Works like an email inbox — click a message to expand it and read the full text
(this also marks it "Read" automatically). Use **Mark Replied** once you've
responded, or **Archive** to file it away without deleting it.

### Testimonies

New submissions start as "Pending Review." Read through the story, then click
**Approve** to make it visible on the public Testimonies page, or **Reject** if
it shouldn't be published. You can change your mind later — approved and
rejected testimonies can be switched back and forth.

---

## Donations _(superadmin only)_

A read-only report of donations received through the website's Give page. This
fills in automatically once someone donates — there's nothing to manually enter
here.

---

## Website Settings _(superadmin only)_

Edits the information shown across the public site:

- **Church Info** — name, phone, email, address (shown in the footer and Contact
  page)
- **Service Times** — click **+ Add Service Time** for each service (day, time,
  label), or **Remove** to delete a row. These appear on the Home page and the
  Service Times page.
- **Livestream Embed URL** — for when Livestream is added in a future update.
- **Footer Text** — a custom line shown in the site footer.

Click **Save Settings** when done. Changes appear on the live site immediately.

---

## Activity Log _(superadmin only)_

A running record of admin actions — who created, edited, deleted, or changed the
status of something, and when. Useful for keeping track of what's changed,
especially with multiple staff using the dashboard. This list only grows; nothing
here can be edited or deleted.

---

## Adding New Staff Accounts

There isn't a "click a button to invite someone" feature yet — creating a new
admin/editor account currently requires a short technical process (a developer or
technically comfortable staff member running a one-time setup command). See
`SETUP_GUIDE.md` Part F for those steps. A proper "Manage Users" page for this is
planned but not yet built.

---

## Logging Out

Click **Log Out** in the top-right corner of any admin page. Especially important
to remember if you're using a shared or public computer.

---

## Getting Help

If something looks broken or behaves unexpectedly, note down what you were doing
right before it happened (which page, what you clicked) and pass that along to
whoever manages the technical side of the website — that detail makes it much
faster to track down what went wrong.
