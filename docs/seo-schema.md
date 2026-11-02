# SEO and structured data

Titles and descriptions for each route are in `schema/site.json`. Use `assets/og-default.png` as the Open Graph and Twitter image on every page.

## Rules

- All URLs are absolute. Build them from `NEXT_PUBLIC_SITE_URL`, shown below as `{SITE_URL}`. Never hardcode a domain.
- No empty strings. Leave out a field instead of filling it with a placeholder.
- Mark up only what is visible on the page.
- Do not add `aggregateRating` or `Review` from testimonials. Self-served reviews are not eligible and the risk outweighs any gain.
- Add `FAQPage` only where an FAQ is visible. The current design has none. If FAQ blocks are added to service pages, write them from real sales questions.
- Test each template with the Rich Results Test before launch: https://search.google.com/test/rich-results

## Home and About: ProfessionalService

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "{SITE_URL}/#organization",
  "name": "Quantum Lynx LLC",
  "url": "{SITE_URL}/",
  "logo": "{SITE_URL}/ql-helix-512.png",
  "description": "Infection control consulting, remote surveillance, survey support, and crisis response for physician-owned hospitals and surgical centers.",
  "foundingDate": "2016",
  "areaServed": { "@type": "Country", "name": "United States" },
  "founder": {
    "@type": "Person",
    "name": "Travaughn Baker-Johnson",
    "jobTitle": "CEO and Principal Infection Preventionist"
  },
  "sameAs": ["https://www.linkedin.com/company/quantum-lynx-llc/"]
}
</script>
```

Add `telephone` and `address` once the owner confirms them. If the address is a home office, leave it out.

## Service pages: Service and BreadcrumbList

Generate from `schema/services.json`.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Survey Support",
      "serviceType": "Infection control survey readiness",
      "description": "Survey readiness and on-survey support for CMS, state, Joint Commission, DNV, and CIHQ.",
      "url": "{SITE_URL}/services/survey-support",
      "provider": { "@id": "{SITE_URL}/#organization" }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "{SITE_URL}/" },
        { "@type": "ListItem", "position": 2, "name": "Services", "item": "{SITE_URL}/services" },
        { "@type": "ListItem", "position": 3, "name": "Survey Support", "item": "{SITE_URL}/services/survey-support" }
      ]
    }
  ]
}
</script>
```

## Insights articles (Phase 3): Article

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article title",
  "author": { "@type": "Person", "name": "Travaughn Baker-Johnson" },
  "publisher": { "@id": "{SITE_URL}/#organization" },
  "datePublished": "2027-01-15",
  "dateModified": "2027-01-15"
}
</script>
```

## In Next.js

Render JSON-LD in a server component with a `<script type="application/ld+json">` tag. Escape `<` in the serialized JSON.

## Before launch

- Set a 301 for `/privacy.html` and `/sla.html`.
- Generate `sitemap.xml` and `robots.txt`. Keep `/api` and prototype paths out of both.
- Serve `assets/ql-helix-512.png` as well as the SVG, since some crawlers skip SVG logos.
- Keep the GA4 property so reporting history continues.
- Set `<meta name="robots" content="noindex">` on Vercel previews.

## When the owner buys a domain

1. Add it to the `quantum-lynx-site` project in Vercel and follow Vercel's DNS steps.
2. Set `NEXT_PUBLIC_SITE_URL` to the new address and redeploy.
3. Add it to the allowed domains in Formspree and Cloudflare Turnstile.
4. Update the GA4 web stream and the tracked domains in HubSpot.
5. Add it to Google Search Console and submit the sitemap.
