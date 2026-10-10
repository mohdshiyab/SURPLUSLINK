import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation(output_path="SurplusLink_Presentation.pptx"):
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    PRIMARY = RGBColor(5, 150, 105)      # Emerald Green (#059669)
    PRIMARY_DARK = RGBColor(6, 95, 70)   # Forest (#065F46)
    DARK_BG = RGBColor(15, 23, 42)       # Slate 900 (#0F172A)
    LIGHT_BG = RGBColor(248, 250, 252)   # Slate 50 (#F8FAFC)
    CARD_BG = RGBColor(255, 255, 255)    # White
    CARD_BORDER = RGBColor(226, 232, 240)# Slate 200
    TEXT_MAIN = RGBColor(15, 23, 42)     # Slate 900
    TEXT_MUTED = RGBColor(100, 116, 139) # Slate 500
    ACCENT_BLUE = RGBColor(37, 99, 235)  # Blue 600
    ACCENT_AMBER = RGBColor(217, 119, 6) # Amber 600

    def add_background(slide, color=LIGHT_BG):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, tag, title, dark=False):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.5), Inches(0.35))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = PRIMARY if dark else PRIMARY

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.5), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = RGBColor(255, 255, 255) if dark else TEXT_MAIN

    def create_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1)
        else:
            card.line.fill.background()
        return card

    # ==========================================================
    # SLIDE 1: Title Slide (Dark Theme)
    # ==========================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_background(s1, DARK_BG)

    # Accent decorative bar
    bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(1.2), Inches(0.08))
    bar.fill.solid()
    bar.fill.fore_color.rgb = PRIMARY
    bar.line.fill.background()

    # Title & Subtitle Box
    tbox = s1.shapes.add_textbox(Inches(0.8), Inches(2.1), Inches(11.5), Inches(3.0))
    tf1 = tbox.text_frame
    tf1.word_wrap = True
    
    p = tf1.paragraphs[0]
    p.text = "SurplusLink"
    p.font.size = Pt(46)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

    p2 = tf1.add_paragraph()
    p2.text = "Smart MERN Food-Rescue Platform with GPS Routing & Invariant Proof"
    p2.font.size = Pt(22)
    p2.font.color.rgb = PRIMARY
    p2.space_before = Pt(8)

    p3 = tf1.add_paragraph()
    p3.text = "A production-grade logistics engine connecting restaurants and volunteer rescuers with zero ghost bookings and verified mathematical accountability."
    p3.font.size = Pt(14)
    p3.font.color.rgb = RGBColor(148, 163, 184)
    p3.space_before = Pt(16)

    # Info Badge Card at bottom
    info_card = create_card(s1, Inches(0.8), Inches(5.6), Inches(11.7), Inches(1.2), RGBColor(30, 41, 59), None)
    ibox = s1.shapes.add_textbox(Inches(1.0), Inches(5.75), Inches(11.3), Inches(0.9))
    itf = ibox.text_frame
    ip = itf.paragraphs[0]
    ip.text = "DISCOVER DOLLAR HACKATHON SUBMISSION"
    ip.font.size = Pt(11)
    ip.font.bold = True
    ip.font.color.rgb = PRIMARY

    ip2 = itf.add_paragraph()
    ip2.text = "Live Demo: https://surpluslink-la31.onrender.com/  |  GitHub: https://github.com/mohdshiyab/SURPLUSLINK"
    ip2.font.size = Pt(13)
    ip2.font.color.rgb = RGBColor(255, 255, 255)
    ip2.space_before = Pt(4)

    # ==========================================================
    # SLIDE 2: Problem Statement & Real-World Friction
    # ==========================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_background(s2)
    add_header(s2, "The Challenge", "Why Traditional Food Donation Platforms Fail")

    # 3 Column Cards
    col_width = Inches(3.65)
    col_gap = Inches(0.38)
    top_pos = Inches(1.8)
    card_h = Inches(4.8)

    problems = [
        ("📍 Navigation Friction", "Volunteers struggle with vague restaurant addresses ('near the mall'). Food goes cold or spoils while drivers wander looking for kitchen pickup entrances.", ACCENT_AMBER),
        ("👻 Ghost Claims & Hoarding", "Unregulated claim systems let users book more food than their vehicle can carry, or double-book conflicting times, causing uncollected food waste.", RGBColor(220, 38, 38)),
        ("📉 Zero Accountability", "Traditional apps lack mathematical auditing. There is no proof of whether listed food was actually collected, lost in transit, or discarded.", ACCENT_BLUE)
    ]

    for i, (p_title, p_desc, icon_color) in enumerate(problems):
        left_pos = Inches(0.8) + i * (col_width + col_gap)
        create_card(s2, left_pos, top_pos, col_width, card_h)
        cbox = s2.shapes.add_textbox(left_pos + Inches(0.3), top_pos + Inches(0.4), col_width - Inches(0.6), card_h - Inches(0.8))
        ctf = cbox.text_frame
        ctf.word_wrap = True
        
        cp = ctf.paragraphs[0]
        cp.text = p_title
        cp.font.size = Pt(18)
        cp.font.bold = True
        cp.font.color.rgb = icon_color

        cp2 = ctf.add_paragraph()
        cp2.text = p_desc
        cp2.font.size = Pt(13)
        cp2.font.color.rgb = TEXT_MUTED
        cp2.space_before = Pt(16)

    # ==========================================================
    # SLIDE 3: The SurplusLink Solution
    # ==========================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_background(s3)
    add_header(s3, "Architecture Overview", "SurplusLink: Multi-Rule Precision Food Rescue")

    # Left Box: Key Pillars (4 cards)
    w_left = Inches(5.6)
    h_item = Inches(1.05)
    gap_item = Inches(0.2)
    top_items = Inches(1.8)

    pillars = [
        ("🗺️ Interactive Geolocation", "Live Leaflet map pin selection + turn-by-turn Google Maps navigation"),
        ("🛡️ 7-Rule Validation Engine", "Automated enforcement of capacity, schedules, and eligibility rules"),
        ("⚖️ Conservation Invariant", "Mathematical proof guaranteeing 100% of kilograms are accounted for"),
        ("⏰ Simulated Clock Engine", "Deterministic time control for testing time-sensitive logistics")
    ]

    for i, (title, sub) in enumerate(pillars):
        y_pos = top_items + i * (h_item + gap_item)
        create_card(s3, Inches(0.8), y_pos, w_left, h_item)
        pbox = s3.shapes.add_textbox(Inches(1.0), y_pos + Inches(0.12), w_left - Inches(0.4), h_item - Inches(0.24))
        ptf = pbox.text_frame
        ptf.word_wrap = True
        pp1 = ptf.paragraphs[0]
        pp1.text = title
        pp1.font.size = Pt(15)
        pp1.font.bold = True
        pp1.font.color.rgb = TEXT_MAIN
        pp2 = ptf.add_paragraph()
        pp2.text = sub
        pp2.font.size = Pt(11)
        pp2.font.color.rgb = TEXT_MUTED
        pp2.space_before = Pt(3)

    # Right Box: 3 Roles Workflow
    w_right = Inches(5.7)
    create_card(s3, Inches(6.8), Inches(1.8), w_right, Inches(4.8), CARD_BG, PRIMARY)
    rbox = s3.shapes.add_textbox(Inches(7.1), Inches(2.0), w_right - Inches(0.6), Inches(4.4))
    rtf = rbox.text_frame
    rtf.word_wrap = True

    rp = rtf.paragraphs[0]
    rp.text = "Role-Based Closed-Loop Lifecycle"
    rp.font.size = Pt(18)
    rp.font.bold = True
    rp.font.color.rgb = PRIMARY_DARK

    role_steps = [
        ("1. Restaurant Donors", "Register physical address & pin exact GPS coordinates. Post surplus batches with packaging type and pickup window [pickup_from, pickup_until]."),
        ("2. Volunteer Rescuers", "Browse by zone & distance. Claim whole kg constrained by vehicle capacity. Navigate via Google Maps and collect inside the pickup window."),
        ("3. NGO Coordinator", "Audits live operations, verifies the zero-leakage accounting invariant, and monitors volunteer reliability on public leaderboards.")
    ]

    for r_title, r_desc in role_steps:
        rp_t = rtf.add_paragraph()
        rp_t.text = r_title
        rp_t.font.size = Pt(14)
        rp_t.font.bold = True
        rp_t.font.color.rgb = TEXT_MAIN
        rp_t.space_before = Pt(14)

        rp_d = rtf.add_paragraph()
        rp_d.text = r_desc
        rp_d.font.size = Pt(11.5)
        rp_d.font.color.rgb = TEXT_MUTED
        rp_d.space_before = Pt(2)

    # ==========================================================
    # SLIDE 4: Geolocation & Turn-by-Turn Navigation
    # ==========================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_background(s4)
    add_header(s4, "Feature Highlight", "Interactive GPS Pinning & Live Volunteer Navigation")

    card_w2 = Inches(5.6)
    card_h2 = Inches(4.8)

    # Card 1: Restaurant Pinning
    create_card(s4, Inches(0.8), Inches(1.8), card_w2, card_h2)
    b1 = s4.shapes.add_textbox(Inches(1.1), Inches(2.0), card_w2 - Inches(0.6), card_h2 - Inches(0.4))
    btf1 = b1.text_frame
    btf1.word_wrap = True

    p = btf1.paragraphs[0]
    p.text = "🏢 Restaurant Location Registration"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = TEXT_MAIN

    bullets1 = [
        "Interactive Leaflet Pinning: Restaurants place pins directly on OpenStreetMap during registration.",
        "One-Click GPS Auto-Detect: Uses browser geolocation to capture exact device coordinates.",
        "GeoJSON Point Storage: Preserved as standard MongoDB [longitude, latitude] with 2dsphere indexing.",
        "Posting Confirmation: Modal explicitly verifies kitchen pickup location before listing surplus food."
    ]
    for b in bullets1:
        bp = btf1.add_paragraph()
        bp.text = "• " + b
        bp.font.size = Pt(12)
        bp.font.color.rgb = TEXT_MUTED
        bp.space_before = Pt(10)

    # Card 2: Volunteer Google Maps Navigation
    create_card(s4, Inches(6.9), Inches(1.8), card_w2, card_h2)
    b2 = s4.shapes.add_textbox(Inches(7.2), Inches(2.0), card_w2 - Inches(0.6), card_h2 - Inches(0.4))
    btf2 = b2.text_frame
    btf2.word_wrap = True

    p = btf2.paragraphs[0]
    p.text = "🧭 Turn-by-Turn Volunteer Routing"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_DARK

    bullets2 = [
        "Discovery Map View: Volunteers browse active surplus pins across city zones with instant details.",
        "Dedicated Route Map Button: Available on every active claim in 'My Claims' schedule.",
        "Live Google Maps Integration: One click launches native turn-by-turn GPS directions directly to coordinates.",
        "Live Countdown Indicator: Informs volunteers exactly when pickup opens (e.g. 'Opens at 18:00 (Clock: 14:00)')."
    ]
    for b in bullets2:
        bp = btf2.add_paragraph()
        bp.text = "• " + b
        bp.font.size = Pt(12)
        bp.font.color.rgb = TEXT_MUTED
        bp.space_before = Pt(10)

    # ==========================================================
    # SLIDE 5: The 7-Rule Claim Engine
    # ==========================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_background(s5)
    add_header(s5, "Core Logistics Engine", "The 7 Official Claim Rules (Zero Ghost Bookings)")

    rules = [
        ("Rule 1: Status Check", "Donation must be OPEN (not cancelled, fully claimed, or expired)."),
        ("Rule 2: Vehicle Capacity", "Claimed kg cannot exceed volunteer's vehicle capacity."),
        ("Rule 3: Available Quantity", "Claimed kg cannot exceed donation's remaining unreserved kg."),
        ("Rule 4: Zone Eligibility", "Restaurant zone must be listed in volunteer's assigned zones."),
        ("Rule 5: Pickup Window", "Planned pickup time T must be within [pickup_from, pickup_until]."),
        ("Rule 6: No Past Time", "Planned pickup time T cannot be in the simulated past (T >= now)."),
        ("Rule 7: 60-Min Buffer", "T must be at least 60 mins away from any other active claim of that volunteer.")
    ]

    # Display 7 rules in 2 columns
    for i, (r_name, r_desc) in enumerate(rules):
        col = 0 if i < 4 else 1
        row = i if col == 0 else (i - 4)
        c_left = Inches(0.8) if col == 0 else Inches(6.9)
        c_top = Inches(1.8) + row * Inches(1.2)
        c_w = Inches(5.6)
        c_h = Inches(1.05)

        create_card(s5, c_left, c_top, c_w, c_h)
        rbox = s5.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.1), c_w - Inches(0.4), c_h - Inches(0.2))
        rtf = rbox.text_frame
        rtf.word_wrap = True

        rp1 = rtf.paragraphs[0]
        rp1.text = r_name
        rp1.font.size = Pt(13.5)
        rp1.font.bold = True
        rp1.font.color.rgb = PRIMARY_DARK

        rp2 = rtf.add_paragraph()
        rp2.text = r_desc
        rp2.font.size = Pt(10.5)
        rp2.font.color.rgb = TEXT_MUTED
        rp2.space_before = Pt(2)

    # ==========================================================
    # SLIDE 6: Accounting Invariant & Conservation Proof
    # ==========================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_background(s6)
    add_header(s6, "Mathematical Integrity", "The Zero-Leakage Accounting Invariant")

    # Main Equation Card
    eq_card = create_card(s6, Inches(0.8), Inches(1.8), Inches(11.7), Inches(1.5), RGBColor(236, 253, 245), PRIMARY)
    eq_box = s6.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(11.3), Inches(1.1))
    eq_tf = eq_box.text_frame
    eq_tf.word_wrap = True

    ep1 = eq_tf.paragraphs[0]
    ep1.text = "THE OFFICIAL CONSERVATION EQUATION"
    ep1.font.size = Pt(11)
    ep1.font.bold = True
    ep1.font.color.rgb = PRIMARY_DARK

    ep2 = eq_tf.add_paragraph()
    ep2.text = "Total Listed (kg) = Collected + Missed + Wasted + In Progress + Still Open"
    ep2.font.size = Pt(22)
    ep2.font.bold = True
    ep2.font.color.rgb = PRIMARY_DARK
    ep2.space_before = Pt(4)

    # 5 Breakdown Pillars below
    w_b = Inches(2.2)
    h_b = Inches(3.0)
    gap_b = Inches(0.17)
    top_b = Inches(3.6)

    pillars_inv = [
        ("Collected", "Successfully picked up by volunteers and delivered to community shelters.", PRIMARY),
        ("Missed", "Volunteer claimed but failed to collect before pickup window elapsed.", RGBColor(220, 38, 38)),
        ("Wasted", "Unclaimed surplus on donations whose deadline has passed (expired).", ACCENT_AMBER),
        ("In Progress", "Currently reserved under active volunteer claims awaiting collection.", ACCENT_BLUE),
        ("Still Open", "Remaining unreserved food available for volunteers to claim right now.", PRIMARY_DARK)
    ]

    for i, (name, desc, color) in enumerate(pillars_inv):
        b_left = Inches(0.8) + i * (w_b + gap_b)
        create_card(s6, b_left, top_b, w_b, h_b)
        bbox = s6.shapes.add_textbox(b_left + Inches(0.15), top_b + Inches(0.25), w_b - Inches(0.3), h_b - Inches(0.5))
        btf = bbox.text_frame
        btf.word_wrap = True

        bp = btf.paragraphs[0]
        bp.text = name
        bp.font.size = Pt(16)
        bp.font.bold = True
        bp.font.color.rgb = color

        bp2 = btf.add_paragraph()
        bp2.text = desc
        bp2.font.size = Pt(10.5)
        bp2.font.color.rgb = TEXT_MUTED
        bp2.space_before = Pt(10)

    # ==========================================================
    # SLIDE 7: Authoritative Simulated Clock
    # ==========================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_background(s7)
    add_header(s7, "Testing & Determinism", "Authoritative Simulated Clock Architecture")

    card_w3 = Inches(5.6)
    card_h3 = Inches(4.8)

    # Left: Why Simulated Clock
    create_card(s7, Inches(0.8), Inches(1.8), card_w3, card_h3)
    c1 = s7.shapes.add_textbox(Inches(1.1), Inches(2.0), card_w3 - Inches(0.6), card_h3 - Inches(0.4))
    ctf1 = c1.text_frame
    ctf1.word_wrap = True

    p = ctf1.paragraphs[0]
    p.text = "⏱️ Why System Time Was Banned"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = TEXT_MAIN

    reasons = [
        "Deterministic Evaluation: Hackathon evaluators cannot wait 4 real hours to verify evening pickup windows.",
        "Zero Flakiness: Tests run against predictable timestamps without timezone discrepancies.",
        "Time Strictly Moves Forward: The clock can advance (+15m, +1h, +4h) but can NEVER move backwards.",
        "Auto State Transitions: Advancing past pickup_until automatically transitions pending claims to MISSED."
    ]
    for r in reasons:
        rp = ctf1.add_paragraph()
        rp.text = "• " + r
        rp.font.size = Pt(12)
        rp.font.color.rgb = TEXT_MUTED
        rp.space_before = Pt(10)

    # Right: Technical Implementation
    create_card(s7, Inches(6.9), Inches(1.8), card_w3, card_h3)
    c2 = s7.shapes.add_textbox(Inches(7.2), Inches(2.0), card_w3 - Inches(0.6), card_h3 - Inches(0.4))
    ctf2 = c2.text_frame
    ctf2.word_wrap = True

    p = ctf2.paragraphs[0]
    p.text = "⚙️ Clock State Machine"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_DARK

    impls = [
        "Global State in MongoDB: Clock time is persisted in the database and synchronized across all clients.",
        "React ClockContext Provider: Re-evaluates component eligibility live when clock advances.",
        "Navbar Clock Banner: Displays current simulated time on every page with 1-click Advance Time modal.",
        "Rule 6 & Rule 5 Verification: All claim endpoints validate time strictly against getSimulatedNow()."
    ]
    for im in impls:
        imp = c2.text_frame.add_paragraph()
        imp.text = "• " + im
        imp.font.size = Pt(12)
        imp.font.color.rgb = TEXT_MUTED
        imp.space_before = Pt(10)

    # ==========================================================
    # SLIDE 8: Tech Stack & Architecture
    # ==========================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_background(s8)
    add_header(s8, "Technology Stack", "Production MERN Stack Architecture")

    tech_cards = [
        ("Frontend Layer", "React 18 + Vite", [
            "React Router v6 SPA",
            "Lucide React Icons",
            "Leaflet & React-Leaflet",
            "OpenStreetMap Tiles",
            "Custom CSS Design System"
        ]),
        ("Backend Services", "Node.js + Express", [
            "RESTful API architecture",
            "Atomic Concurrency Locks",
            "Simulated Clock Middleware",
            "JWT & bcryptjs Authentication",
            "18-Rule Automated Jest Tests"
        ]),
        ("Data Persistence", "MongoDB Atlas", [
            "Mongoose Schema Validation",
            "GeoJSON Point Coordinates",
            "2dsphere Geospatial Indexing",
            "Transactions & State Machines",
            "Zero-Leakage Invariant Auditing"
        ])
    ]

    tw = Inches(3.65)
    tgap = Inches(0.38)
    for i, (layer, tech, items) in enumerate(tech_cards):
        tl = Inches(0.8) + i * (tw + tgap)
        create_card(s8, tl, Inches(1.8), tw, Inches(4.8))
        tbox = s8.shapes.add_textbox(tl + Inches(0.25), Inches(2.0), tw - Inches(0.5), Inches(4.4))
        ttf = tbox.text_frame
        ttf.word_wrap = True

        p1 = ttf.paragraphs[0]
        p1.text = layer
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = PRIMARY

        p2 = ttf.add_paragraph()
        p2.text = tech
        p2.font.size = Pt(18)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_MAIN
        p2.space_before = Pt(2)

        for item in items:
            ip = ttf.add_paragraph()
            ip.text = "✔ " + item
            ip.font.size = Pt(11.5)
            ip.font.color.rgb = TEXT_MUTED
            ip.space_before = Pt(8)

    # ==========================================================
    # SLIDE 9: Project Impact & Demo Metrics
    # ==========================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_background(s9)
    add_header(s9, "Impact & Reliability", "Measurable Community Impact & Verification")

    # 4 Metric Cards
    metrics = [
        ("540+ kg", "Surplus Food Rescued", PRIMARY),
        ("1,080+", "Nutritious Meals Served", ACCENT_BLUE),
        ("1,350 kg", "CO2 Emissions Mitigated", PRIMARY_DARK),
        ("100%", "Invariant Accounting Proof", ACCENT_AMBER)
    ]
    mw = Inches(2.68)
    mgap = Inches(0.32)
    for i, (val, label, col) in enumerate(metrics):
        ml = Inches(0.8) + i * (mw + mgap)
        create_card(s9, ml, Inches(1.8), mw, Inches(1.6))
        mbox = s9.shapes.add_textbox(ml + Inches(0.1), Inches(1.95), mw - Inches(0.2), Inches(1.3))
        mtf = mbox.text_frame
        mtf.word_wrap = True

        mp1 = mtf.paragraphs[0]
        mp1.text = val
        mp1.font.size = Pt(30)
        mp1.font.bold = True
        mp1.font.color.rgb = col
        mp1.alignment = PP_ALIGN.CENTER

        mp2 = mtf.add_paragraph()
        mp2.text = label
        mp2.font.size = Pt(11)
        mp2.font.color.rgb = TEXT_MUTED
        mp2.space_before = Pt(3)
        mp2.alignment = PP_ALIGN.CENTER

    # Bottom Summary Box
    create_card(s9, Inches(0.8), Inches(3.7), Inches(11.7), Inches(2.9))
    sbox = s9.shapes.add_textbox(Inches(1.1), Inches(3.9), Inches(11.1), Inches(2.5))
    stf = sbox.text_frame
    stf.word_wrap = True

    sp = stf.paragraphs[0]
    sp.text = "Public Recognition & Gamification Engine"
    sp.font.size = Pt(18)
    sp.font.bold = True
    sp.font.color.rgb = TEXT_MAIN

    f_bullets = [
        "Gamified Community Heroes: Badges awarded for 'First Rescue', 'Consistent Helper', and '100 kg Rescued'.",
        "Public Reliability Score: Encourages accountable volunteering by tracking successful pickups vs missed pickups.",
        "Post-Collection Distribution Records: Documents food reaching local shelters while protecting recipient privacy.",
        "Tested Across 18 Rigorous Scenarios: Verified concurrency, boundary pickup times, and schedule conflicts."
    ]
    for fb in f_bullets:
        fbp = stf.add_paragraph()
        fbp.text = "• " + fb
        fbp.font.size = Pt(12)
        fbp.font.color.rgb = TEXT_MUTED
        fbp.space_before = Pt(6)

    # ==========================================================
    # SLIDE 10: Conclusion & Links (Dark Theme)
    # ==========================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_background(s10, DARK_BG)

    # Centered Final Box
    c_card = create_card(s10, Inches(1.5), Inches(1.2), Inches(10.33), Inches(5.1), RGBColor(30, 41, 59), None)
    c_box = s10.shapes.add_textbox(Inches(2.0), Inches(1.6), Inches(9.33), Inches(4.3))
    ctf = c_box.text_frame
    ctf.word_wrap = True

    cp = ctf.paragraphs[0]
    cp.text = "Thank You!"
    cp.font.size = Pt(40)
    cp.font.bold = True
    cp.font.color.rgb = RGBColor(255, 255, 255)
    cp.alignment = PP_ALIGN.CENTER

    cp2 = ctf.add_paragraph()
    cp2.text = "SurplusLink is ready to eliminate hunger and food waste in modern cities."
    cp2.font.size = Pt(16)
    cp2.font.color.rgb = PRIMARY
    cp2.space_before = Pt(6)
    cp2.alignment = PP_ALIGN.CENTER

    cp3 = ctf.add_paragraph()
    cp3.text = "🌐 Live Production Web App:\nhttps://surpluslink-la31.onrender.com/"
    cp3.font.size = Pt(14)
    cp3.font.color.rgb = RGBColor(255, 255, 255)
    cp3.space_before = Pt(18)
    cp3.alignment = PP_ALIGN.CENTER

    cp4 = ctf.add_paragraph()
    cp4.text = "📁 GitHub Source Code Repository:\nhttps://github.com/mohdshiyab/SURPLUSLINK"
    cp4.font.size = Pt(14)
    cp4.font.color.rgb = RGBColor(148, 163, 184)
    cp4.space_before = Pt(12)
    cp4.alignment = PP_ALIGN.CENTER

    # Save
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    build_presentation()
