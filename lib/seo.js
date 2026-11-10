import { countryName, countrySlug } from "./countries";

export const SITE_URL = "https://surfmate.eu";

export const SITE_NAME = "Surfmate";

export const SITE_TITLE = "Surfmate – Find surfers nearby.";

export const SITE_DESCRIPTION =
  "Surfmate connects surfers worldwide. See who surfs your spot, share spotchecks, join meetups – and turn strangers in the line-up into surf friends.";

export const APP_STORE_URL =
  "https://apps.apple.com/de/app/surfmate-surf-log-connect/id6760191082";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp";

export const OG_IMAGE = {
  url: "/images/community-peniche-laughing.webp",
  width: 1600,
  height: 1066,
  alt: "Surfers together at a Surfmate meetup in Peniche, Portugal",
};

export const HOME_FAQS = [
  {
    question: "What is Surfmate?",
    answer:
      "Surfmate is a free community app for iOS and Android that connects surfers worldwide. You can see who surfs your spot, share spotchecks, log sessions, and join contests, festivals and meetups.",
  },
  {
    question: "Where does Surfmate work?",
    answer:
      "Surfmate is made in Hamburg, Germany, and used by surfers worldwide. The spot guide lists the spots the community actually surfs, with a page for each spot.",
  },
  {
    question: "What can I log for a session?",
    answer:
      "You can log the spot, date and time, duration, rating, up to 3 photos, notes, conditions, emotions and highlights. A session can stay private or be visible to friends.",
  },
  {
    question: "Are secret spots private?",
    answer:
      "Yes. Secret spots stay private unless you share them. Sessions at secret spots stay private, and a Spotcheck there is only visible to people who know that spot.",
  },
  {
    question: "Does Surfmate have ads?",
    answer:
      "No. Surfmate has no ads. The feed shows sessions from surfers you follow and from surfers nearby who chose to log publicly.",
  },
  {
    question: "Who makes Surfmate?",
    answer:
      "Surfmate is made by Jolie Bast in Hamburg, together with a small crew of surfers. It started because she learned to surf alone and wanted a way to find surf friends.",
  },
  {
    question: "How do I download Surfmate?",
    answer:
      "Surfmate is free on the App Store for iPhone and iPad, and on Google Play for Android.",
  },
];

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function spotPath(spot) {
  return `/spots/${countrySlug(spot.country_code)}/${spot.region_slug}/${spot.slug}/`;
}

export function countryPath(countryCode) {
  return `/spots/${countrySlug(countryCode)}/`;
}

export function regionPath(spot) {
  return `/spots/${countrySlug(spot.country_code)}/${spot.region_slug}/`;
}

export function pageMetadata({ title, description, path, image = OG_IMAGE }) {
  const ogTitle = typeof title === "string" ? `${title} · Surfmate` : title.absolute;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      title: ogTitle,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [image.url],
    },
  };
}

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/images/app-icon.png"),
    },
    image: absoluteUrl(OG_IMAGE.url),
    description: SITE_DESCRIPTION,
    email: "info@surf-mate.de",
    telephone: "+49-160-91814756",
    foundingLocation: "Hamburg, Germany",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Deelwisch 43",
      postalCode: "22529",
      addressLocality: "Hamburg",
      addressCountry: "DE",
    },
    founder: {
      "@type": "Person",
      name: "Jolie Bast",
      url: absoluteUrl("/team.html"),
      sameAs: ["https://www.linkedin.com/in/jolie-bast-859b802a3/"],
    },
    areaServed: "Worldwide",
    sameAs: [
      "https://instagram.com/surfmate.app",
      "https://www.instagram.com/surfmate.wear/",
      APP_STORE_URL,
      PLAY_STORE_URL,
      "https://ko-fi.com/M2Y1202LAB",
    ],
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), websiteNode()],
  };
}

export function softwareApplicationNode() {
  return {
    "@type": "MobileApplication",
    "@id": `${SITE_URL}/#app`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    image: absoluteUrl("/images/app-icon.png"),
    applicationCategory: "SportsApplication",
    operatingSystem: "iOS, Android",
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    installUrl: [APP_STORE_URL, PLAY_STORE_URL],
    downloadUrl: APP_STORE_URL,
    author: {
      "@type": "Person",
      name: "Jolie Bast",
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    featureList: [
      "Find surfers nearby",
      "Session log",
      "Spotchecks",
      "Public and secret spots",
      "Surf events and meetups",
      "Chats and crews",
      "Surf calendar and personal surf map",
    ],
  };
}

export function faqNode(faqs = HOME_FAQS) {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    url: `${SITE_URL}/#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbNode(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

export function spotItemListNode(spots, name) {
  return {
    "@type": "ItemList",
    name,
    itemListElement: spots.map((spot, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${spot.name}, ${spot.region}`,
      url: absoluteUrl(spotPath(spot)),
    })),
  };
}

export function spotPlaceNode(spot) {
  const path = spotPath(spot);
  const country = countryName(spot.country_code);
  const latitude = Number(spot.latitude);
  const longitude = Number(spot.longitude);
  const hasGeo = Number.isFinite(latitude) && Number.isFinite(longitude);

  return {
    "@type": "Place",
    "@id": `${absoluteUrl(path)}#place`,
    name: spot.name,
    url: absoluteUrl(path),
    description: `${spot.name} is a surf spot in ${spot.region}, ${country}. On Surfmate you can see who has surfed here, read public sessions and find events nearby.`,
    address: {
      "@type": "PostalAddress",
      addressRegion: spot.region,
      addressCountry: spot.country_code,
    },
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: spot.region,
      containedInPlace: {
        "@type": "Country",
        name: country,
      },
    },
    ...(hasGeo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude,
            longitude,
          },
        }
      : {}),
  };
}

export function eventsItemListNode(events) {
  const itemListElement = [];

  for (const event of events) {
    const startDate = eventStartDate(event);
    if (!startDate || !event.title) continue;

    const endDate = eventEndDate(event);
    const locationName = event.location_name || event.title;

    itemListElement.push({
      "@type": "ListItem",
      position: itemListElement.length + 1,
      item: {
        "@type": "Event",
        name: event.title,
        startDate,
        ...(endDate ? { endDate } : {}),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: locationName,
          ...(event.country_code
            ? {
                address: {
                  "@type": "PostalAddress",
                  addressCountry: event.country_code,
                },
              }
            : {}),
        },
        ...(isHttpUrl(event.website_url) ? { url: event.website_url } : {}),
        ...(isHttpUrl(event.cover_image_url) ? { image: event.cover_image_url } : {}),
        description: event.location_name
          ? `${event.title} in ${event.location_name}. See who from Surfmate is going.`
          : `${event.title}. See who from Surfmate is going.`,
      },
    });
  }

  return {
    "@type": "ItemList",
    name: "Upcoming surf events on Surfmate",
    url: absoluteUrl("/events/"),
    itemListElement,
  };
}

function eventStartDate(event) {
  if (event.starts_at) return toIso(event.starts_at);
  if (event.event_year && event.event_month) {
    return new Date(Date.UTC(event.event_year, event.event_month - 1, 1)).toISOString();
  }
  if (event.event_year) return `${event.event_year}-01-01`;
  return null;
}

function eventEndDate(event) {
  if (event.ends_at) return toIso(event.ends_at);
  return null;
}

function toIso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}
