# Rohan Das Kathabaniya - personal website

A free, fast, secure static website. Pure HTML, CSS and JavaScript. No build tools, no server, no database.
Live at: https://rohandaskathabaniya.com.np (once your domain is connected)

## Folder guide

| File or folder | What it is |
| --- | --- |
| `index.html`, `about.html`, `projects.html`, ... | The pages |
| `style.css` | All colours and layout. Colours are at the top (`:root`) |
| `script.js` | Menu, footer, dark mode, projects, blog (edit menu links here) |
| `tools.js` | The free tools (only loaded on `tools.html`) |
| `site.json` | Availability message, intro, learning list, skills, links |
| `projects.json` | Your projects |
| `posts.json` | Your blog posts |
| `admin.html`, `admin.js`, `admin.css` | Private editing dashboard (see below) |
| `assets/` | Images, favicon, CV PDF |

## Files YOU must add to `assets/`

| File | Size | Notes |
| --- | --- | --- |
| `profile.jpg` | Square, about 800x800, under 150 KB | Until you add it, the site shows your initials |
| `Rohan-Das-Kathabaniya-CV.pdf` | Any | Exact name. Until you add it, the Download CV button explains the CV is not uploaded yet |
| `favicon.ico` | 32x32 | A simple placeholder is included. Replace it any time |
| `og-image.png` | 1200x630 | The picture shown when someone shares your link. A placeholder is included |

## Editing your content

### Easiest: the admin page
Open `https://rohandaskathabaniya.com.np/admin.html`. Sign in with a GitHub token (steps are on that page). You can add, edit, reorder and delete projects, write blog posts and change your availability message and intro. Every save is a normal GitHub commit, so nothing is ever lost.

### Or edit files on GitHub
Open the file, click the pencil icon, edit, then **Commit changes**.
To change a skill from "learning" to "working", edit `site.json` and change `"level": "learning"` to `"level": "working"`. Only do this when it is true.

## How the admin page stays secure

GitHub Pages is a static host, so a website cannot keep a password secret. Anything in the page's code is visible to everyone. So this admin page has **no password in it at all**.

- **GitHub is the lock.** Saving needs a fine-grained GitHub token with write access to this one repository. Without it, GitHub refuses every change, even if someone finds the page.
- **The token is never stored in the code or sent anywhere except `api.github.com`.** It lives in the browser tab's memory and is cleared when you sign out or close the tab.
- **Strict Content-Security-Policy** in `admin.html` blocks scripts from any other site.
- **Auto sign-out** after 20 minutes of inactivity.
- **Public pages never insert content as HTML**, so edited text cannot inject code.

Your part of the security:
1. Turn on two-factor authentication on GitHub.
2. Create the token for **only** this repository, with **Contents: Read and write** only, expiring in 30 days.
3. Never paste the token into code, chat or screenshots.
4. Use the admin page only on your own devices, then sign out.
5. If a token might have leaked, delete it in GitHub: Settings, Developer settings, Personal access tokens.

Optional, stronger later: put Cloudflare Access (free for small teams) in front of `/admin.html` so a login is required before the page even loads.

## Safe to publish publicly
Your name, public email, LinkedIn, GitHub username, project code, CV (remove your home address and phone number if you do not want strangers to have them).

## Never publish
Passwords, GitHub tokens, API keys, citizenship or ID numbers, exact home address, bank details.
(Anything in a public repository is public forever, even if you delete it later.)

## Connecting the contact form later (free)

Right now the form opens the visitor's email app, which is honest and works with no server.
To receive messages directly, use a free form service:

1. **Web3Forms** (web3forms.com) or **Formspree** (formspree.io): create a free form, use `contact@rohandaskathabaniya.com.np` as the destination.
2. They give you a form endpoint or public access key (these are designed to be public).
3. In `contact.html`, change the `<form>` to `<form action="THE_ENDPOINT_THEY_GIVE_YOU" method="POST">`, keep the `name=` attributes, and remove the `submit` handler for `#contact-form` in `script.js` (the function `initContact`).
4. Turn on their spam protection, and update `privacy.html` to say the form sends data to that service.

## Google Search Console (later)
1. Add your site at search.google.com/search-console, choose "URL prefix" and enter `https://rohandaskathabaniya.com.np/`.
2. If Google gives you an HTML tag, paste it in the `<head>` of `index.html`, where the comment says so. Do not invent a code.
3. Submit `https://rohandaskathabaniya.com.np/sitemap.xml`.
When you add a page, also add it to `sitemap.xml`.

## Future expansion (kept out on purpose so version 1 stays free, fast and secure)
Because content is in JSON files and pages are separate, you can later add: a blog CMS, login, a client dashboard, an order system, an AI tool, a job board, analytics, a newsletter or payments. Anything needing secrets or a database will use a free serverless service (for example Cloudflare Workers) rather than putting keys in this repository.
