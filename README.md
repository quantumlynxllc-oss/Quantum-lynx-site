# Quantum Lynx Site

This repository contains the source code for the **Quantum Lynx LLC** marketing website. The site presents our infection prevention consulting services tailored for physician‑owned hospitals, including consulting, remote surveillance and data submission, survey support, crisis response, and program management.

## Structure

- **index.html** – the main landing page with service descriptions, savings metrics, an about section, testimonials, and a contact form powered by Formspree. Google Analytics (GA4) is configured with measurement ID `G‑MVJ882KZ3T`.
- **privacy.html** – details our privacy policy and HIPAA/BAA commitments.
- **sla.html** – outlines our Service Level Agreement (SLA).
- **robots.txt** – instructs search engine crawlers and references the sitemap.
- **sitemap.xml** – provides a search engine friendly listing of site pages. Update the `<loc>` entries with your final domain after deployment.
- **assets/QuantumLynx_Capabilities.pdf** – marketing one‑pager PDF for download.

## Deployment

You can deploy this site to any static hosting provider (e.g. Vercel, Netlify, GitHub Pages, AWS S3 + CloudFront). For Vercel:

1. Fork or clone this repository and push it to your GitHub account.
2. Sign in to [Vercel](https://vercel.com) and import the repository.
3. Vercel will detect this as a static project – no build step is required. Simply deploy.
4. After deployment, update **Formspree** allowed domains to include your new site URL (e.g. `https://quantum‑lynx‑site.vercel.app`).
5. If you purchase a custom domain (e.g. `www.quantum‑lynx.com`), add it in the Vercel dashboard and update `sitemap.xml` accordingly.

## Updating

To add additional pages or features, create new `.html` files and link them in the navigation. Ensure that any new pages are added to `sitemap.xml` and update `robots.txt` if necessary.

If you change the Google Analytics measurement ID or Formspree endpoint, update `index.html` accordingly.

## License

This project is proprietary to Quantum Lynx LLC. Unauthorized copying or distribution of the site content is prohibited.