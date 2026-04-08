---
name: All frontend content from Supabase
description: Every text, number, image, link on the storefront must come from Supabase — zero hardcoded values
type: preference
---
All frontend data must be fetched from Supabase on component mount. No hardcoded product names, prices, descriptions, hero text, trust bars, FAQ items, social links, contact info, or any other site content.

When admin changes any value in the backend, the frontend must reflect it immediately via realtime subscriptions — no page refresh needed.

**How to apply:**
- Use `useSiteSettings()` for all configurable text/content (hero, trust bar, CTA, about, contact info, social links, delivery text, etc.)
- Use `useProducts()`, `useBundles()`, `useTestimonials()`, `useFaqItems()`, `useBlogPosts()` for entity data
- Show loading skeletons or empty states when data hasn't loaded — never fall back to hardcoded arrays
- All site_settings keys are editable from the admin Settings page
- New content types should be added as site_settings keys or new tables as appropriate
