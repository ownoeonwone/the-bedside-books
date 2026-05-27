# The Bedside Books — landing site

The launch landing page for [thebedsidebooks.com](https://thebedsidebooks.com).
A single-page site that introduces the imprint, the first book (*The Truth About
the Puppy*), and captures email signups via Substack.

Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com),
deployed on Cloudflare Pages.

## Quick start

Requires Node 22+.

```bash
npm install
npm run dev      # http://localhost:4322
npm run build    # produces ./dist
npm run preview  # serve the production build
```

## Project layout

```
.
├── public/                     # static assets copied verbatim to the site root
│   ├── logo.svg                # horizontal wordmark (transparent bg)
│   ├── colophon.svg            # imprint mark (transparent bg)
│   ├── favicon.svg             # heavier-stroke version of the colophon
│   └── og-image.jpg            # 1200x630 social preview
├── src/
│   ├── assets/                 # images processed by Astro (webp, responsive)
│   │   └── the-truth-about-the-puppy-cover.png
│   ├── components/
│   │   └── SubstackEmbed.astro # styled signup form posting to Substack
│   ├── layouts/
│   │   └── Base.astro          # head, meta, OG, fonts
│   ├── pages/
│   │   └── index.astro         # the page
│   └── styles/
│       └── global.css          # Tailwind v4 + design tokens
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Editing the page

Almost all the copy lives in [`src/pages/index.astro`](src/pages/index.astro).

- **Section headlines and body copy:** edit inline in `index.astro`.
- **Meta description and Open Graph image:** edit the `<Base>` props at the top
  of `index.astro`, or change the defaults in
  [`src/layouts/Base.astro`](src/layouts/Base.astro).
- **Cover image:** replace
  `src/assets/the-truth-about-the-puppy-cover.png` with a new file at the same
  path. Astro regenerates the optimized webp variants on the next build.
- **Logo:** edit [`public/logo.svg`](public/logo.svg) directly.
- **Colors and typography:** edit the design tokens at the top of
  [`src/styles/global.css`](src/styles/global.css).

## Email signup

The signup form in
[`src/components/SubstackEmbed.astro`](src/components/SubstackEmbed.astro)
posts directly to `https://thebedsidebooks.substack.com/api/v1/free?nojs=true`.
Substack handles the confirmation email and list management. To point at a
different publication, change the `publication` prop:

```astro
<SubstackEmbed publication="some-other-publication" />
```

## Design tokens

| Token         | Hex       | Purpose                          |
| ------------- | --------- | -------------------------------- |
| `--color-paper`     | `#FAF6EF` | Page background (warm cream)     |
| `--color-ink`       | `#2A2520` | Body text (warm dark brown)      |
| `--color-sage`      | `#7A8B6F` | Button, accent                   |
| `--color-sage-dark` | `#5F6E55` | Button hover                     |
| `--color-divider`   | `#D4CFC4` | Hairline rules                   |

Headlines and body all use **EB Garamond** via Google Fonts.

## Deployment

The site is intended to deploy on **Cloudflare Pages** from this GitHub repo.

### One-time setup (Cloudflare dashboard)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
   → **Create application** → **Pages** → **Connect to Git**.
2. Authorize the GitHub connection if prompted, then pick this repo.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** set environment variable `NODE_VERSION` to `22` under
     **Settings → Environment variables**.
4. Click **Save and Deploy**. The first build runs against `main`.

### Custom domain

After the first deploy succeeds:

1. In the Pages project, go to **Custom domains** → **Set up a custom domain**.
2. Enter `thebedsidebooks.com`, confirm. Cloudflare adds the CNAME automatically
   because the domain is registered in the same account.
3. Add `www.thebedsidebooks.com` the same way if you want it.
4. The certificate provisions in a few minutes; the apex domain goes live first.

### Subsequent deploys

Push to `main` and Cloudflare rebuilds automatically. Pull requests get a
preview URL on the same project page.

## Lighthouse and weight

- Total dist: ~350KB (most of which is four responsive webp variants).
- Per-visit page weight: ~80–130KB depending on viewport.
- Targets: Lighthouse 95+ on Performance, Accessibility, Best Practices, SEO.
- The single render-blocking external resource is the Google Fonts stylesheet;
  the font itself loads with `font-display: swap`.
