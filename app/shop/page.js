import Header from "../../components/Header";
import Footer from "../../components/Footer";
import JsonLd from "../../components/JsonLd";
import WearEarlyAccess from "../../components/WearEarlyAccess";
import WearLockup from "../../components/WearLockup";
import { pageMetadata } from "../../lib/seo";

const TITLE = "Early access · Surfmate Wear";
const DESCRIPTION =
  "Made for the ones who paddle out. Surfmate Wear is 100% organic cotton, produced in Portugal. Limited first drop — join the list for early access.";

export const metadata = pageMetadata({
  title: { absolute: TITLE },
  description: DESCRIPTION,
  path: "/shop/",
  image: {
    url: "/images/wear-campaign.webp",
    width: 1066,
    height: 1600,
    alt: "Two surfers at golden hour in Surfmate Wear, back print Your Surf. Your Story.",
  },
});

const wearJsonLd = {
  "@context": "https://schema.org",
  "@type": "Brand",
  name: "Surfmate Wear",
  url: "https://surfmate.eu/shop/",
  description: DESCRIPTION,
  logo: "https://surfmate.eu/images/app-icon.png",
  sameAs: ["https://www.instagram.com/surfmate.wear/"],
};

const LOOKS = [
  {
    src: "/images/wear-hoodie-board.webp",
    alt: "Surfer from behind in the black Surfmate hoodie, board under one arm, standing on the rocks.",
    caption: "Your surf. Your story.",
    position: "58% 42%",
  },
  {
    src: "/images/wear-couple-surfboard.webp",
    alt: "Light blue oversized Surfmate tee and black hoodie, on the beach with a board.",
    caption: "Light blue",
    position: "50% 22%",
  },
];

const PRODUCTS = [
  {
    src: "/images/wear-hoodie-skate.webp",
    alt: "Oversized black Surfmate hoodie, worn while surfskating along the beach.",
    index: "01",
    name: "Oversized hoodie",
    print: "YOUR SURF. YOUR STORY.",
    position: "40% 48%",
  },
  {
    src: "/images/wear-tee-white-beach.webp",
    alt: "White oversized Surfmate tee from behind, back print Your Surf. Your Story.",
    index: "02",
    name: "Oversized tee",
    print: "YOUR SURF. YOUR STORY.",
    position: "50% 30%",
  },
  {
    src: "/images/wear-group-walking-a.webp",
    alt: "Women's Surfmate tee in vintage black, back print Your Surf. Your Story.",
    index: "03",
    name: "Women's tee",
    print: "YOUR SURF. YOUR STORY.",
    position: "18% 36%",
    focus: "womens-tee",
  },
  {
    src: "/images/wear-top-walking.webp",
    alt: "White Surfmate top, worn with a skateboard on the promenade.",
    index: "04",
    name: "Top",
    print: "SURFMATE",
    position: "68% 42%",
  },
];

const DAYS = [
  {
    src: "/images/wear-tee-white-cafe.webp",
    alt: "White oversized Surfmate tee, chest print Surfmate, sitting with a dog.",
    caption: "With the dog",
    position: "42% 40%",
  },
  {
    src: "/images/wear-tote-beach.webp",
    alt: "Surfmate tote on the sand, next to a surfboard.",
    caption: "The tote",
    position: "48% 55%",
  },
  {
    src: "/images/wear-hoodie-rocks.webp",
    alt: "Surfer in the black hoodie walking the rocks with a board under one arm.",
    caption: "Paddle out",
    position: "62% 62%",
  },
  {
    src: "/images/wear-couple-boardwalk.webp",
    alt: "Two surfers on the promenade, black hoodie and pale blue tee.",
    caption: "After the surf",
    position: "50% 42%",
  },
];

export default function ShopPage() {
  return (
    <>
      <JsonLd data={wearJsonLd} />
      <Header />
      <main>

      <section className="sm-container wear-hero">
        <h1 className="sm-heavy">
          Made for
          <br />
          the ones
          <br />
          who
          <br />
          paddle out.
        </h1>
        <div className="wear-frame wear-hero-photo">
          <img
            src="/images/wear-campaign.webp"
            alt="Two surfers on the rocks at golden hour. Back print on the black hoodie: Surfmate, Your Surf. Your Story."
          />
        </div>
      </section>

      <ul className="wear-facts">
        <li className="sm-heavy">100% organic cotton</li>
        <li className="sm-heavy">Produced in Portugal</li>
        <li className="sm-heavy">Limited first drop</li>
      </ul>

      <section id="drop" className="sm-container wear-block">
        <div className="wear-drop-head">
          <div>
            <p className="sm-eyebrow">Drop 01</p>
            <h2 className="sm-heavy">The drop</h2>
          </div>
          <p>Four pieces. Organic cotton, produced in Portugal. For the ones who paddle out.</p>
        </div>

        <div className="wear-looks">
          {LOOKS.map((look) => (
            <figure key={look.src} style={{ margin: 0 }}>
              <div className="wear-frame wear-look-photo">
                <img src={look.src} alt={look.alt} style={{ objectPosition: look.position }} />
              </div>
              <figcaption className="wear-caption">{look.caption}</figcaption>
            </figure>
          ))}
        </div>

        <div className="wear-products">
          {PRODUCTS.map((product) => (
            <article key={product.index}>
              <div
                className="wear-frame wear-product-photo"
                data-focus={product.focus}
                style={{ "--wear-pos": product.position }}
              >
                <img src={product.src} alt={product.alt} />
              </div>
              <div className="wear-product-meta">
                <p className="wear-product-index">{product.index}</p>
                <h3 className="sm-heavy">{product.name}</h3>
                <p className="sm-seattle wear-print">{product.print}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sm-container wear-story">
        <div className="wear-frame wear-story-photo">
          <img
            src="/images/wear-group-walking-a.webp"
            alt="Friends from behind in Surfmate tees and the black hoodie, one standing on a skateboard."
          />
        </div>
        <div>
          <p className="sm-eyebrow">The story</p>
          <h2 className="sm-heavy">
            Wear your
            <br />
            surf story.
          </h2>
          <p className="wear-story-copy">
            Made for the paddle out, and for the people you meet after. The first drop is small, cut from organic cotton, and produced in Portugal.
          </p>
          <div className="wear-story-links">
            <a href="#drop">Shop now</a>
            <a href="#early">Early access</a>
            <a href="#drop">Limited drop</a>
          </div>
        </div>
      </section>

      <section id="early" className="wear-early">
        <div className="sm-container">
          <WearEarlyAccess />
        </div>
      </section>

      <section className="sm-container wear-block" style={{ paddingBottom: 40 }}>
        <div className="wear-days-head">
          <h2 className="sm-heavy">Real surf days</h2>
          <a href="https://www.instagram.com/surfmate.wear/" target="_blank" rel="noopener noreferrer">
            Follow @surfmate.wear
          </a>
        </div>
        <div className="wear-days">
          {DAYS.map((day) => (
            <figure key={day.src} style={{ margin: 0 }}>
              <div className="wear-frame wear-day-photo">
                <img src={day.src} alt={day.alt} style={{ objectPosition: day.position }} />
              </div>
              <figcaption className="wear-caption">{day.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <div className="sm-container">
        <WearLockup />
      </div>
      </main>

      <Footer />
    </>
  );
}
