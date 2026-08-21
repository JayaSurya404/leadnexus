import { createClient } from "@supabase/supabase-js";

const baseTime = new Date("2026-08-20T12:00:00.000Z");

function hoursBefore(hours) {
  return new Date(baseTime.getTime() - hours * 60 * 60 * 1000).toISOString();
}

const businessScenarios = [
  {
    businessName: "Aadhira SunGrid Energy",
    state: "Tamil Nadu",
    leads: [
      ["nithya-rooftop", "Nithya Raman", "+91 74218 56394", "nithya.raman@solarhome.example", "Chennai", "Google Search", "Chennai rooftop savings", 0, "HOT", 93, "Requested 5kW pricing after repeated rooftop solar views.", "Share the site-survey process and current installation timeline.", "PENDING"],
      ["rakesh-commercial", "Rakesh Iyer", "+91 81247 60935", "rakesh.iyer@brightworks.example", "Coimbatore", "LinkedIn", "Commercial energy savings", 2, "HOT", 88, "Returned to compare commercial EPC options and subsidy information.", "Confirm roof area, sanctioned load, and decision timeline.", "PENDING"],
      ["meera-solar", "Meera Krishnan", "+91 93618 47250", "meera.krishnan@greenhouse.example", "Madurai", "Instagram", "Residential solar awareness", 1, "WARM", 67, "Viewed residential packages and completed the enquiry form.", "Ask about monthly bill range and preferred survey date.", "PENDING"],
      ["sandeep-amc", "Sandeep Menon", "+91 79041 82653", "sandeep.menon@facilitycare.example", "Tiruppur", "Referral", "Solar maintenance", 3, "WARM", 56, "Reviewed annual maintenance coverage but showed no near-term pricing action.", "Clarify the existing system size and maintenance concern.", "IGNORED"],
      ["kavya-rooftop", "Kavya Narayanan", "+91 86103 59427", "kavya.narayanan@sunward.example", "Salem", "YouTube", "Solar explainer", 0, "COLD", 31, "Briefly reviewed the residential rooftop overview.", "Leave pending until stronger engagement appears.", null],
      ["pranav-general", "Pranav Subramaniam", "+91 70926 43815", "pranav.subramaniam@homelight.example", "Erode", "QR Expo", "Coimbatore energy expo", null, "COLD", 19, "Submitted a general enquiry after a short page visit.", "Wait for another visit before recovery outreach.", null],
      ["gayathri-subsidy", "Gayathri Venkatesh", "+91 94447 18263", "gayathri.venkatesh@efficienthome.example", "Chennai", "Google Search", "Tamil Nadu solar subsidy", 1, "WARM", 63, "Returned to review the 5kW package and subsidy guidance.", "Confirm the electricity bill range and whether the property is owner-occupied.", "PENDING"],
      ["ashwin-rooftop", "Ashwin Rajan", "+91 87544 62918", "ashwin.rajan@terraceplan.example", "Vellore", "Facebook", "Residential rooftop education", 0, "COLD", 27, "Viewed residential rooftop information without a pricing or contact-channel action.", "Keep admin-only until another visit or stronger buying signal.", null],
      ["sriram-commercial", "Sriram Balasubramanian", "+91 97890 31462", "sriram.balasubramanian@precisionworks.example", "Chennai", "LinkedIn", "Industrial rooftop ROI", 2, "HOT", 86, "Returned to the commercial solar page and reviewed ROI and installation details.", "Confirm the facility load profile, available roof area, and approval timeline.", null]
    ]
  },
  {
    businessName: "Aranya Living Spaces",
    state: "Karnataka",
    leads: [
      ["ananya-kitchen", "Ananya Rao", "+91 74836 29105", "ananya.rao@newnest.example", "Bengaluru", "Instagram", "Modular kitchen ideas", 0, "HOT", 92, "Repeatedly viewed modular kitchen designs and pricing guidance.", "Ask for kitchen dimensions, possession date, and preferred finish.", "PENDING"],
      ["vikram-3bhk", "Vikram Hegde", "+91 80954 67321", "vikram.hegde@cedarhomes.example", "Bengaluru", "Google Search", "3BHK turnkey interiors", 2, "HOT", 87, "Compared 3BHK interiors and returned through a pricing campaign.", "Confirm floor plan, handover month, and budget band.", "PENDING"],
      ["shreya-storage", "Shreya Kulkarni", "+91 93531 84620", "shreya.kulkarni@spacecraft.example", "Mysuru", "Pinterest", "Wardrobe planning", 3, "WARM", 65, "Explored wardrobe storage options and saved contact details.", "Offer a design consultation and request room measurements.", "PENDING"],
      ["manoj-2bhk", "Manoj Shetty", "+91 77608 45219", "manoj.shetty@urbanmove.example", "Mangaluru", "Referral", "2BHK interiors", 1, "WARM", 54, "Reviewed the 2BHK service once and completed a general enquiry.", "Wait for a clearer possession timeline before owner handoff.", "IGNORED"],
      ["deepa-kitchen", "Deepa Nair", "+91 86187 30942", "deepa.nair@mapleflat.example", "Bengaluru", "Facebook", "Kitchen renovation", 0, "COLD", 29, "Viewed a single kitchen service card with limited dwell time.", "Leave admin-only until engagement increases.", null],
      ["aravind-general", "Aravind Bhat", "+91 70191 58436", "aravind.bhat@homecanvas.example", "Hubballi", "Direct", "General interiors", null, "COLD", 17, "Shared contact details after a short general visit.", "No recovery action yet.", null]
    ]
  },
  {
    businessName: "Velora EV Mobility",
    state: "Tamil Nadu",
    leads: [
      ["harish-cityride", "Harish Kumar", "+91 73972 61548", "harish.kumar@citycommute.example", "Chennai", "Google Search", "CityRide test ride", 0, "HOT", 94, "Returned to the CityRide E2 page and explored pricing and availability.", "Offer a test ride and confirm daily commute distance.", "PENDING"],
      ["farah-fleet", "Farah Siddiqui", "+91 82489 37106", "farah.siddiqui@rapidroute.example", "Chennai", "LinkedIn", "Fleet electrification", 3, "HOT", 89, "Reviewed fleet electrification and cargo EV information several times.", "Confirm fleet size, routes, payload, and procurement timeline.", "PENDING"],
      ["kiran-cargo", "Kiran Raj", "+91 93842 56017", "kiran.raj@localhaul.example", "Coimbatore", "YouTube", "Cargo EV operations", 1, "WARM", 69, "Watched a cargo EV explainer and completed the enquiry form.", "Ask about daily kilometres, load profile, and charging access.", "PENDING"],
      ["lavanya-charger", "Lavanya Suresh", "+91 78240 93651", "lavanya.suresh@evready.example", "Madurai", "Referral", "Home charging", 2, "WARM", 57, "Reviewed home charging requirements without selecting a vehicle.", "Wait for vehicle ownership and installation timing details.", "IGNORED"],
      ["mohammed-cityride", "Mohammed Irfan", "+91 86086 42793", "mohammed.irfan@dailyride.example", "Tiruchirappalli", "Instagram", "Electric scooter", 0, "COLD", 33, "Viewed the CityRide overview with moderate dwell time.", "Keep admin-only until pricing or test-ride intent appears.", null],
      ["sowmya-general", "Sowmya Balaji", "+91 72008 35164", "sowmya.balaji@cleanmile.example", "Salem", "QR Expo", "EV awareness event", null, "COLD", 21, "Submitted a general EV enquiry after scanning an event code.", "No owner handoff is recommended yet.", null]
    ]
  }
];

const eventSets = {
  HOT: ["PAGE_VIEW", "PRODUCT_VIEW", "PRODUCT_ENGAGED", "CTA_CLICK", "RETURN_VISIT", "PAGE_VIEW", "PRODUCT_VIEW", "LEAD_FORM_VIEW", "LEAD_FORM_STARTED", "LEAD_FORM_SUBMITTED"],
  WARM: ["PAGE_VIEW", "PRODUCT_VIEW", "PRODUCT_ENGAGED", "LEAD_FORM_VIEW", "LEAD_FORM_STARTED", "LEAD_FORM_SUBMITTED"],
  COLD: ["PAGE_VIEW", "LEAD_FORM_VIEW", "LEAD_FORM_SUBMITTED"]
};

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } }
);

let createdLeads = 0;
let createdSessions = 0;
let createdEvents = 0;

for (const scenario of businessScenarios) {
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,slug")
    .eq("name", scenario.businessName)
    .single();
  if (businessError || !business) throw new Error(`Business unavailable: ${scenario.businessName}`);

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,name")
    .eq("business_id", business.id)
    .eq("active", true)
    .order("sort_order");
  if (productError) throw new Error(`Products unavailable: ${scenario.businessName}`);

  for (let index = 0; index < scenario.leads.length; index += 1) {
    const [key, name, phone, email, city, source, campaign, productIndex, temperature, score, buyingIntent, recommendedAction, recoveryDecision] = scenario.leads[index];
    const product = productIndex === null ? null : products?.[productIndex] ?? null;
    const capturedAt = hoursBefore(12 + index * 7 + businessScenarios.indexOf(scenario) * 3);

    let { data: lead, error: leadQueryError } = await supabase
      .from("leads")
      .select("id,visitor_session_id")
      .eq("business_id", business.id)
      .eq("email", email)
      .maybeSingle();
    if (leadQueryError) throw new Error(`Lead lookup failed for ${key}.`);

    if (!lead) {
      const { data: session, error: sessionError } = await supabase
        .from("visitor_sessions")
        .insert({
          business_id: business.id,
          anonymous_id: `captured-${key}`,
          landing_path: `/b/${business.slug}?utm_source=${encodeURIComponent(source)}&utm_campaign=${encodeURIComponent(campaign)}`,
          first_source: source,
          first_medium: source === "Direct" ? "direct" : "campaign",
          first_campaign: campaign,
          last_source: source,
          last_medium: source === "Direct" ? "direct" : "campaign",
          last_campaign: campaign,
          device_type: index % 2 === 0 ? "Mobile" : "Desktop",
          country: "India",
          region: scenario.state,
          city,
          first_seen_at: hoursBefore(18 + index * 7),
          last_seen_at: capturedAt,
          last_activity_at: capturedAt,
          visit_count: temperature === "HOT" ? 3 : temperature === "WARM" ? 2 : 1,
          created_at: hoursBefore(18 + index * 7)
        })
        .select("id")
        .single();
      if (sessionError || !session) throw new Error(`Session creation failed for ${key}.`);
      createdSessions += 1;

      const { data: insertedLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          business_id: business.id,
          visitor_session_id: session.id,
          primary_product_id: product?.id ?? null,
          name,
          phone,
          email,
          location_text: `${city}, ${scenario.state}`,
          city,
          state: scenario.state,
          country: "India",
          message: product ? `Interested in ${product.name}.` : "Interested in learning more about available products and services.",
          first_source: source,
          first_medium: source === "Direct" ? "direct" : "campaign",
          first_campaign: campaign,
          last_source: source,
          last_medium: source === "Direct" ? "direct" : "campaign",
          last_campaign: campaign,
          visibility: "ADMIN_ONLY",
          contact_intent: "NONE",
          consent_given: false,
          form_submitted_at: capturedAt,
          created_at: capturedAt
        })
        .select("id,visitor_session_id")
        .single();
      if (leadError || !insertedLead) throw new Error(`Lead creation failed for ${key}.`);
      lead = insertedLead;
      createdLeads += 1;
    }

    const reasons = temperature === "HOT"
      ? ["Repeated product views", "Returned to the public page", "Opened pricing or next-step content", "Completed name and phone capture"]
      : temperature === "WARM"
        ? ["Viewed a relevant product or service", "Completed contact capture", "Some qualification details remain unknown"]
        : ["Completed contact capture", "Limited product engagement", "No direct-contact or near-term buying signal"];

    const { error: intelligenceError } = await supabase
      .from("lead_intelligence")
      .update({
        business_id: business.id,
        score,
        temperature,
        primary_interest: product?.name ?? "General enquiry",
        buying_intent: buyingIntent,
        summary: `${temperature} captured enquiry for ${product?.name ?? "general information"}.`,
        reasons,
        recommended_action: recommendedAction,
        analysis_method: "RULES",
        activity_snapshot: { scenario: key, source, campaign, product: product?.name ?? null },
        analyzed_at: hoursBefore(2 + index)
      })
      .eq("lead_id", lead.id)
      .eq("business_id", business.id);
    if (intelligenceError) throw new Error(`Intelligence update failed for ${key}.`);

    const { count: scenarioEventCount, error: eventCountError } = await supabase
      .from("activity_events")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .contains("metadata", { scenario_key: key });
    if (eventCountError) throw new Error(`Activity lookup failed for ${key}.`);

    if ((scenarioEventCount ?? 0) === 0 && lead.visitor_session_id) {
      const events = eventSets[temperature].map((eventType, eventIndex) => ({
        business_id: business.id,
        session_id: lead.visitor_session_id,
        lead_id: lead.id,
        product_id: product?.id ?? null,
        event_type: eventType,
        page_path: `/b/${business.slug}`,
        duration_ms: eventType === "PRODUCT_VIEW" ? 45_000 + eventIndex * 8_000 : null,
        metadata: { scenario_key: key, source, campaign },
        occurred_at: hoursBefore(11 + index * 7 - eventIndex * 0.25),
        created_at: hoursBefore(11 + index * 7 - eventIndex * 0.25)
      }));
      const { error: activityError } = await supabase.from("activity_events").insert(events);
      if (activityError) throw new Error(`Activity creation failed for ${key}.`);
      createdEvents += events.length;
    }

    if (recoveryDecision) {
      const { data: existingReview, error: reviewQueryError } = await supabase
        .from("lead_recovery_reviews")
        .select("id")
        .eq("lead_id", lead.id)
        .maybeSingle();
      if (reviewQueryError) throw new Error(`Recovery lookup failed for ${key}.`);
      if (!existingReview) {
        const { error: reviewError } = await supabase.from("lead_recovery_reviews").insert({
          lead_id: lead.id,
          decision: recoveryDecision,
          admin_note: recoveryDecision === "IGNORED" ? "Engagement is useful context, but the current buying signal is not strong enough for owner handoff." : null,
          reviewed_at: recoveryDecision === "IGNORED" ? hoursBefore(1 + index) : null
        });
        if (reviewError) throw new Error(`Recovery creation failed for ${key}.`);
      }
    }
  }
}

const { data: businesses } = await supabase
  .from("businesses")
  .select("id,name")
  .in("name", businessScenarios.map((scenario) => scenario.businessName));

const verification = [];
for (const business of businesses ?? []) {
  const { data: leads } = await supabase
    .from("leads")
    .select("id,visibility,contact_intent")
    .eq("business_id", business.id);
  const adminOnlyIds = (leads ?? []).filter((lead) => lead.visibility === "ADMIN_ONLY").map((lead) => lead.id);
  const [{ data: intelligence }, { data: reviews }] = await Promise.all([
    adminOnlyIds.length ? supabase.from("lead_intelligence").select("lead_id,temperature").in("lead_id", adminOnlyIds) : Promise.resolve({ data: [] }),
    adminOnlyIds.length ? supabase.from("lead_recovery_reviews").select("lead_id,decision").in("lead_id", adminOnlyIds) : Promise.resolve({ data: [] })
  ]);
  verification.push({
    business: business.name,
    totalLeads: leads?.length ?? 0,
    adminOnly: adminOnlyIds.length,
    hot: intelligence?.filter((row) => row.temperature === "HOT").length ?? 0,
    pendingRecovery: reviews?.filter((row) => row.decision === "PENDING").length ?? 0,
    recovered: leads?.filter((lead) => lead.contact_intent === "RECOVERED").length ?? 0
  });
}

console.log(JSON.stringify({ createdLeads, createdSessions, createdEvents, verification }, null, 2));
