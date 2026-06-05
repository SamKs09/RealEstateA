import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────

const features = [
  {
    icon: "apartment",
    title: "Property Listings",
    desc: "Browse villas, apartments, and commercial spaces across Tunisia.",
  },
  {
    icon: "directions_car",
    title: "Vehicle Marketplace",
    desc: "Buy or rent vehicles with full specs and direct seller contact.",
  },
  {
    icon: "map",
    title: "Map Search",
    desc: "Explore listings by governorate with interactive search.",
  },
  {
    icon: "calendar_month",
    title: "Instant Booking",
    desc: "Book property viewings and vehicle test drives instantly.",
  },
  {
    icon: "rocket_launch",
    title: "Boost Listings",
    desc: "Promote your listings for more visibility and faster sales.",
  },
  {
    icon: "chat_bubble",
    title: "Secure Messaging",
    desc: "Message buyers and sellers securely inside the app.",
  },
];

const featuredProperties = [
  {
    id: 1,
    name: "The Alabaster Atrium",
    location: "Sidi Bou Saïd · Tunis",
    price: "4,250,000 TND",
    beds: 6,
    baths: 5,
    sqm: 820,
    badge: "Sea View",
    badgeColor: "#005da8",
    type: "Villa · For Sale",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
  },
  {
    id: 2,
    name: "Villa des Dunes",
    location: "Hammamet · Nabeul",
    price: "2,450,000 TND",
    beds: 4,
    baths: 3,
    sqm: 520,
    badge: "Pool",
    badgeColor: "#a33900",
    type: "Villa · For Sale",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
  },
  {
    id: 3,
    name: "Résidence Yasmine",
    location: "Sousse · Sahel",
    price: "6,500 TND/mo",
    beds: 3,
    baths: 2,
    sqm: 180,
    badge: "New",
    badgeColor: "#007a3d",
    type: "Apartment · For Rent",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
  },
];

const featuredVehicles = [
  {
    id: 1,
    name: "Porsche 911 GT3 RS",
    year: "2024",
    price: "850,000 TND",
    km: "1,200 km",
    tag: "For Sale",
    tagColor: "#a33900",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80",
  },
  {
    id: 2,
    name: "Mercedes S-Class",
    year: "2023",
    price: "12,000 TND / mo",
    km: "0 km",
    tag: "For Rent",
    tagColor: "#005da8",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80",
  },
  {
    id: 3,
    name: "BMW M5 Competition",
    year: "2023",
    price: "8,500 TND / mo",
    km: "5,000 km",
    tag: "For Rent",
    tagColor: "#005da8",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80",
  },
];

const testimonials = [
  {
    name: "Yassine B.",
    role: "Property Buyer · Tunis",
    text: "Found my dream apartment in just 3 days.",
    initials: "YB",
  },
  {
    name: "Leila M.",
    role: "Real Estate Agent · Sousse",
    text: "The boost system increased my listing views massively.",
    initials: "LM",
  },
  {
    name: "Karim T.",
    role: "Car Dealer · Sfax",
    text: "Sold multiple vehicles quickly through the platform.",
    initials: "KT",
  },
];

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <Navbar activePage="home" />

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "90vh" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #F85B00 0%, #FCB78E 40%, #fce8dc 70%, #f9f9f9 100%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-24 flex flex-col lg:flex-row items-center gap-16">
          {/* LEFT */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-sm font-medium text-white">
              <span className="material-symbols-outlined text-[16px]">
                diamond
              </span>
              Tunisia&apos;s Premium Marketplace
            </div>

            <h1
              className="text-5xl md:text-7xl font-black text-white leading-tight"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Find Your Dream
              <br />
              <span className="text-[#370e00]">Home or Car</span>
              <br />
              in Tunisia.
            </h1>

            <p className="text-lg text-white/80 max-w-xl leading-relaxed">
              Browse premium properties and luxury vehicles across all Tunisian
              governorates.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#"
                className="bg-[#370e00] text-white px-6 py-4 rounded-full font-semibold hover:bg-black transition-colors"
              >
                Download App
              </a>

              <a
                href="#properties"
                className="bg-white/20 backdrop-blur-md text-white px-6 py-4 rounded-full font-semibold hover:bg-white/30 transition-colors"
              >
                Explore Listings
              </a>

              <Link
                href="/plans"
                className="flex items-center gap-2 bg-[#ffdbce] text-[#a33900] px-6 py-4 rounded-full font-bold shadow-lg hover:bg-[#ffe7d6] transition-colors border-2 border-[#a33900] text-lg"
                style={{ fontFamily: 'var(--font-headline)', letterSpacing: '0.01em' }}
              >
                <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
                Explore Seller Plans
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex-1">
            <div className="relative h-[550px] rounded-[2rem] overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80"
                alt="Luxury Property"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6 bg-[#f9f9f9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Everything You Need
            </h2>

            <p className="text-[#5b4137] mt-4 max-w-2xl mx-auto">
              One platform for buyers, renters, sellers, and dealers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-3xl p-8 shadow-sm border border-[#e3bfb1]/30 hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#ffdbce] flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[#a33900]">
                    {feature.icon}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-[#1a1c1c] mb-3">
                  {feature.title}
                </h3>

                <p className="text-[#5b4137] text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROPERTIES */}
      <section id="properties" className="py-24 px-6 bg-[#eeeeee]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2
              className="text-4xl font-bold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Featured Properties
            </h2>

            <Link href="/properties" className="text-[#a33900] font-semibold">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                <div className="relative h-60">
                  <Image
                    src={property.image}
                    alt={property.name}
                    fill
                    className="object-cover"
                  />

                  <div className="absolute top-4 left-4">
                    <span
                      className="text-white text-xs px-3 py-1 rounded-full font-semibold"
                      style={{ background: property.badgeColor }}
                    >
                      {property.badge}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-xl text-[#1a1c1c] mb-2">
                    {property.name}
                  </h3>

                  <p className="text-[#8f7065] text-sm mb-4">
                    {property.location}
                  </p>

                  <div className="flex gap-4 text-sm text-[#5b4137] mb-5">
                    <span>{property.beds} Beds</span>
                    <span>{property.baths} Baths</span>
                    <span>{property.sqm} m²</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#a33900] text-lg">
                      {property.price}
                    </p>

                    <button className="bg-[#ffdbce] text-[#a33900] px-4 py-2 rounded-full font-semibold hover:bg-[#a33900] hover:text-white transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VEHICLES */}
      <section className="py-24 px-6 bg-[#f9f9f9]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2
              className="text-4xl font-bold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Featured Vehicles
            </h2>

            <Link href="/vehicles" className="text-[#a33900] font-semibold">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                <div className="relative h-60">
                  <Image
                    src={vehicle.image}
                    alt={vehicle.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-6">
                  <p className="text-sm text-[#8f7065] mb-2">
                    {vehicle.year} · {vehicle.km}
                  </p>

                  <h3 className="font-bold text-xl text-[#1a1c1c] mb-4">
                    {vehicle.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#a33900] text-lg">
                      {vehicle.price}
                    </p>

                    <span
                      className="text-white text-xs px-3 py-1 rounded-full font-semibold"
                      style={{ background: vehicle.tagColor }}
                    >
                      {vehicle.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 bg-[#eeeeee]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Trusted Across Tunisia
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-3xl p-8 shadow-sm"
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[#F85B00]"
                    >
                      star
                    </span>
                  ))}
                </div>

                <p className="text-[#5b4137] italic leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#a33900] text-white flex items-center justify-center font-bold">
                    {testimonial.initials}
                  </div>

                  <div>
                    <p className="font-semibold text-[#1a1c1c]">
                      {testimonial.name}
                    </p>

                    <p className="text-sm text-[#8f7065]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div
          className="max-w-5xl mx-auto rounded-[2rem] p-14 text-center text-white"
          style={{
            background: "linear-gradient(135deg, #a33900 0%, #F85B00 100%)",
          }}
        >
          <h2
            className="text-5xl font-black mb-6"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            Join Tunisia&apos;s Largest Marketplace
          </h2>

          <p className="text-white/80 max-w-2xl mx-auto mb-10 text-lg">
            Buy, rent, sell, and connect faster than ever before.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#"
              className="bg-white text-[#a33900] px-8 py-4 rounded-full font-bold hover:bg-[#ffdbce] transition-colors"
            >
              Download App
            </a>

            <Link
              href="/plans"
              className="border border-white/40 px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
