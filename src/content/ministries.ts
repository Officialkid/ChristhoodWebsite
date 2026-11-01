import type { PageDoc } from "@/lib/types";

const c = (title: string, text?: string, bullets?: string[]) => ({ title, text, bullets });

export const ministries: PageDoc[] = [
  {
    kind: "ministry",
    slug: "international-faith-chapel",
    title: "International Faith Chapel",
    tagline: "Word • Prayer • Worship • Fellowship • Evangelism",
    summary: "An interdenominational prayer fellowship called to proclaim the Gospel with power and prepare the Church for His glorious return.",
    hero: "christhoood-about",
    audience: "Everyone",
    order: 1,
    featured: true,
    intro: [
      "International Faith Chapel (IFC) is an interdenominational prayer fellowship called and commissioned by God to proclaim the Gospel of Jesus Christ with power and to prepare His Church for His glorious return. Rooted in the Great Commission (Matthew 28:19-20), our ministry exists to transform lives through the Word, intercession, worship, and intentional fellowship.",
    ],
    blocks: [
      { type: "statement", label: "Our vision", text: "To raise up a Christ-centered fellowship where believers are sanctified, equipped, and empowered to reflect His glory and prepare for His imminent return. We envision a community ablaze with the fire of the Holy Spirit, boldly advancing the Kingdom of God in every sphere of life." },
      { type: "statement", label: "Our mission", text: "To proclaim the Gospel, disciple believers, and mobilize them for ministry through fervent prayer, Spirit-led worship, intentional fellowship, and effective evangelism." },
      {
        type: "cards", title: "Five things we hold on to", numbered: true, items: [
          c("The Word of God", "“The grass withers, the flower fades, but the Word of our God stands forever” (Isaiah 40:8). At IFC, the Word is our foundation. We are committed to faithful teaching, study, and application of Scripture as God's ultimate authority."),
          c("Prayer & Intercession", "“The effective, fervent prayer of a righteous man avails much” (James 5:16). We gather in fervent intercession for spiritual revival, personal breakthroughs, and Kingdom advancement across the globe."),
          c("Worship", "Worship is our lifestyle. In spirit and truth (John 4:23-24), we lift up Jesus Christ, inviting His holiness, peace, and renewal into every gathering."),
          c("Fellowship", "We are one body in Christ (Romans 12:5), called to love, support, and edify one another across all generational and cultural lines."),
          c("Evangelism & Outreach", "Jesus' final command—“Go and make disciples of all nations” (Matthew 28:19)—is our heartbeat. We carry the light of Christ into communities, campuses, and nations."),
        ],
      },
      {
        type: "cards", title: "Confidential prayer & pastoral care", intro: "Connect directly with Sir Gee and our dedicated intercessory and pastoral counselling teams for confidential prayer, deliverance, and biblical direction.", items: [
          c("Confidential prayer request", "Submit personal burdens, family needs, or thanksgiving. You have the option to keep your submission 100% anonymous.", ["Fervent intercessory coverage", "100% anonymous option available", "Direct pastoral WhatsApp & email routing"]),
          c("Pastoral counselling intake", "Book a private biblical session for grief, emotional restoration, faith doubts, marriage and premarital advice, or life guidance. 100% free and confidential.", ["Strict biblical confidentiality", "In person (Nairobi CBD) or virtual call", "Christ-centered discipleship framework"]),
        ],
      },
    ],
    actions: [{ label: "Send a prayer request", href: "#care" }],
  },
  {
    kind: "ministry",
    slug: "worship",
    title: "Worship Ministry",
    tagline: "Levites Praise & Sound — Christ-centered worship",
    summary: "Faith, music, dance and drama, creating an atmosphere where God's Word is experienced in a fresh and powerful way.",
    hero: "worship",
    audience: "Singers, dancers, actors, musicians",
    order: 2,
    featured: true,
    intro: [
      "The Christ-Centered Worship Ministry exists to inspire, uplift, and transform lives through creative expression. By blending faith, music, dance, and drama, we aim to create an atmosphere where God's Word is experienced in a fresh and powerful way, making disciples and glorifying Jesus in all we do.",
    ],
    blocks: [
      { type: "statement", label: "Our mission", text: "To inspire Christ-centered worship, cultivate creative expression, and deepen biblical understanding through the arts—drama, music, and dance—while fostering a purpose-driven commitment to serving our church and community with our God-given talents." },
      {
        type: "cards", title: "Core values", items: [
          c("Christ-Centered Worship", "Every artistic expression will be rooted in glorifying God and proclaiming His Word."),
          c("Biblical Foundation", "Each performance and activity will be grounded in Scripture, ensuring spiritual growth and faithfulness to God's truth."),
          c("Excellence in Creativity", "We will use our God-given talents to present powerful, spirit-filled performances that honour God."),
          c("Community and Service", "Our ministry will reach beyond the church walls to serve and inspire others in our local community."),
          c("Discipleship and Growth", "Encouraging participants to deepen their faith, develop their gifts, and grow in their walk with Christ."),
        ],
      },
      {
        type: "cards", title: "Ministry pillars", items: [
          c("Music – worship that shifts the atmosphere", "“Sing to the Lord, all the earth; proclaim His salvation day after day.” – 1 Chronicles 16:23. Music is more than melody and lyrics—it is a divine conduit through which God's presence is manifested. Our music ministry is dedicated to creating an atmosphere of authentic praise and worship where the sound of music commands the presence of God, shifting the spiritual climate and drawing hearts into deeper intimacy with Him."),
          c("Dance – worship in motion", "“Let them praise His name with dancing and make music to Him with timbrel and harp.” – Psalm 149:3. Dance in worship is more than movement; it is a powerful form of storytelling that conveys the Gospel and magnifies God's presence."),
          c("Drama – faith in action", "“Jesus spoke all these things to the crowd in parables; He did not say anything to them without using a parable.” – Matthew 13:34. Through theatrical storytelling, we bring biblical truths to life in ways that captivate audiences and make Scripture relatable."),
          c("Discipleship & spiritual growth", "Beyond performances, our ministry is committed to nurturing the spiritual growth of our participants.", ["Bible study & devotionals centered on the role of arts in faith", "Mentorship & leadership development for young creatives", "Retreats & worship encounters focused on spiritual renewal"]),
          c("Community engagement & evangelism", "Our ministry extends into the world through outreach performances, workshops, and mission trips."),
        ],
      },
    ],
  },
  {
    kind: "ministry",
    slug: "missions",
    title: "Missions & Outreach",
    tagline: "Practical ministry, high school missions, and Christ-centred service across Kenyan communities.",
    summary: "High school missions, campus outreach and practical service that reflect the heart of Jesus.",
    hero: "kabare-image",
    audience: "Schools, campuses, communities",
    order: 3,
    featured: true,
    intro: [
      "This missions and outreach program is designed to reflect the heart of Jesus Christ—His love, compassion, and commitment to restoring humanity to God. By walking alongside individuals in their spiritual and emotional journeys, we fulfill His command to make disciples and build His kingdom on earth (Matthew 28:19-20).",
    ],
    blocks: [
      { type: "statement", label: "Our mission", text: "To walk alongside individuals in their spiritual and emotional struggles, bringing the light of Christ into their lives and communities. By integrating practical support, heartfelt compassion, and the truth of God's Word, we aim to lead souls into a saving relationship with Jesus Christ and help them grow in spiritual wholeness." },
      {
        type: "cards", title: "Core objectives", numbered: true, items: [
          c("Proclaim the Gospel", "Share the Good News of Jesus Christ with all people, prioritizing high schools, universities, and underserved communities."),
          c("Discipleship", "Equip believers to grow in their faith, apply biblical principles, and boldly share Christ with others."),
          c("Practical Support", "Address physical, emotional, and social needs as a reflection of God's love and care."),
          c("Community Engagement", "Foster unity and transformation within local communities through active involvement and mentorship."),
          c("Prayer and Intercession", "Seek God's guidance and power through consistent prayer, relying on the Holy Spirit to move in every outreach."),
        ],
      },
      {
        type: "cards", title: "How we work", numbered: true, items: [
          c("Collaborative partnerships", "We partner with high schools, colleges, and local churches to offer joint initiatives that cater to the emotional and spiritual needs of youth and families."),
          c("Faith-based volunteering", "We equip outreach volunteers with spiritual grounding, active listening, and emotional support techniques rooted in Biblical principles."),
          c("Training & development", "We host leadership workshops for young ministers seeking to become more active in high school missions, evangelism, and community outreach."),
        ],
      },
      {
        type: "cards", title: "Schools visited", items: [
          c("Moi Forces Academy – Lanet", "High school ministry and youth empowerment session."),
          c("Kabare Girls High School", "Spiritual mentorship, discipleship, and ministry weekend."),
          c("Naromoru Boys High School", "Mentorship and life skills outreach for young men."),
          c("Karima Girls High School", "Gospel outreach, counselling, and spiritual encouragement."),
        ],
      },
      { type: "gallery", title: "From the road", photos: ["mfa-missions", "kabare-girls-cover", "narumoro-boys-mission", "karima-girls-sch", "mumbi-missions", "nakuru-girls-mission", "missions-cover-photo", "christhood-missions"] },
    ],
  },
  {
    kind: "ministry",
    slug: "counselling",
    title: "Counselling & Discipleship",
    tagline: "Walking in wholeness, healing, and spiritual maturity",
    summary: "Confidential, Christ-centered counselling and discipleship for healing, restoration and growth. Free of charge.",
    hero: "counselling",
    audience: "Anyone who needs support",
    order: 4,
    featured: true,
    intro: [
      "Through our Counselling and Discipleship Program, we aim to reflect the heart of Christ in every interaction, providing a pathway to spiritual and emotional wholeness. Whether you are navigating personal struggles, relational conflicts, grief, or a desire to grow deeper in your walk of faith, we are here to walk alongside you.",
    ],
    blocks: [
      { type: "statement", label: "Our mission", text: "To walk alongside individuals in their journey toward spiritual, psychological, and relational wholeness, offering Christ-centered guidance that equips them to live in alignment with God's divine purpose." },
      {
        type: "cards", title: "What we aim to do", numbered: true, items: [
          c("Provide biblical guidance", "Equip individuals with Scripture-based tools to address life's challenges and foster an authentic relationship with God."),
          c("Encourage emotional healing", "Offer a safe, confidential space to address trauma, anxiety, and grief through prayer and pastoral counselling."),
          c("Foster relational restoration", "Address marital, familial, and interpersonal conflicts through Christ-centered mediation and reconciliation."),
          c("Promote discipleship growth", "Help believers establish spiritual disciplines, mind renewal (Romans 12:2), and biblical life habits."),
          c("Empower for Kingdom impact", "Equip individuals to minister comfort to others with the same comfort they received from God (2 Cor 1:3-4)."),
        ],
      },
      {
        type: "cards", title: "Our counselling framework", numbered: true, items: [
          c("Initial assessment & intake", "Each individual begins with a confidential session to understand their background, challenges, and goals, leading to a personalized discipleship plan."),
          c("Christ-centered therapy", "Addressing emotional wounds, depression, spiritual doubts, and past trauma by applying Scripture, prayer, and cognitive renewal."),
          c("Discipleship mentorship", "Pairing participants with mature spiritual mentors for one-on-one encouragement, Bible study, and character formation."),
          c("Marriage & family guidance", "Biblical premarital counselling, marital conflict resolution, and parenting guidance rooted in the Word of God."),
          c("Recovery & wholeness groups", "Support circles for grief, addiction freedom, and life transitions in a loving, non-judgmental environment."),
        ],
      },
      {
        type: "cards", title: "Confidential pastoral care & prayer", intro: "You don't have to walk through life's storms alone. Whether you need confidential one-on-one pastoral counselling or fervent intercessory prayer, our consecrated team is here for you.", items: [
          c("Book pastoral counselling", "100% free and confidential. Schedule a private biblical counselling session for grief, emotional healing, premarital or marriage guidance, or mentorship.", ["Strict biblical confidentiality", "Virtual, WhatsApp call, or in person (Nairobi CBD)", "Mind renewal & discipleship focus"]),
          c("Submit a prayer request", "Send your prayer burdens or praise reports directly to Sir Gee and the consecrated Christhood intercessory team.", ["Option to submit 100% anonymously", "Dedicated weekly prayer vigils", "Direct WhatsApp & email pastoral routing"]),
        ],
      },
    ],
    actions: [{ label: "Book a counselling session", href: "#care" }],
  },
  {
    kind: "ministry",
    slug: "media",
    title: "Media Ministry",
    tagline: "Leveraging technology to spread the Gospel and enhance worship experiences",
    summary: "Audio, video, digital and social media, so God's message reaches people wherever they are.",
    hero: "media-image",
    audience: "Camera, sound, design and social media people",
    order: 5,
    featured: true,
    intro: [
      "The Media Ministry is a vital component of the 21st-century church, leveraging technology to spread the Gospel, enhance worship, and foster engagement, expanding outreach beyond the church walls.",
    ],
    blocks: [
      { type: "statement", label: "Our mission", text: "To spread the Gospel and enhance the worship experience through audio, video, digital, and social media, ensuring that God's message reaches and impacts people wherever they are." },
      {
        type: "cards", title: "Key objectives", numbered: true, items: [
          c("Enhancing worship", "Creating an immersive, distraction-free environment that draws people into the presence of God."),
          c("Expanding church reach", "Using online platforms to connect with those beyond the church building, including the sick, elderly, and global audience."),
          c("Improving communication", "Ensuring seamless internal and external communication through digital and multimedia tools."),
          c("Equipping other ministries", "Providing resources and training to empower every church department to use media effectively."),
        ],
      },
      {
        type: "cards", title: "Teams & roles", items: [
          c("Audio & sound engineering team", "Ensure clarity and excellence in sound for both in-person and online services.", ["Setup and operate sound equipment for services and events", "Monitor and adjust audio levels during live services", "Maintain and troubleshoot audio equipment"]),
          c("Visual media & presentation team", "Support worship and teaching through engaging visuals.", ["Create and display lyric slides for worship", "Prepare sermon slides and visual aids", "Operate presentation software during services"]),
        ],
      },
      {
        type: "cards", title: "Why it matters today", items: [
          c("Breaking geographic barriers", "The church can now minister to people worldwide through live streaming and digital media."),
          c("Enhancing engagement", "Social media allows real-time interactions, questions, and discussions that keep members connected."),
        ],
      },
    ],
    actions: [
      { label: "Watch on YouTube", href: "https://youtube.com/@christhoodministries", external: true },
      { label: "Follow on Instagram", href: "https://www.instagram.com/christhoodministries", external: true },
    ],
  },
  {
    kind: "ministry",
    slug: "mens",
    title: "Men's Ministry",
    tagline: "Band of Brothers & Kings (BOKS)",
    summary: "A holistic programme for empowering, equipping and discipling men for Kingdom impact.",
    hero: "men-photo",
    audience: "Men of every age",
    order: 6,
    intro: [
      "Our purpose is to develop men into passionate disciples for Christ, transitioning from a traditional Men's Ministry to a Ministry “To” Men. We aim to help men discover their God-given purpose and essence of being by addressing their spiritual, emotional, relational, and practical needs through a God-centered yet realistic approach tailored to today's challenges.",
    ],
    blocks: [
      {
        type: "cards", title: "Programme pillars", numbered: true, items: [
          c("Spiritual growth and discipleship", "Deepening each man's relationship with God and developing a Christ-centered identity through Bible study, devotion, prayer, and mentorship."),
          c("Identity and purpose discovery", "Helping men understand their God-given identity and purpose through workshops, retreats, and healing ministries."),
          c("Relational development", "Strengthening relationships with family, friends, and the church community through training and fellowship."),
          c("Practical life skills and Kingdom impact", "Empowering men to thrive in their careers, finances, and community impact while advancing God's Kingdom."),
        ],
      },
      {
        type: "cards", title: "Pillar 1: Spiritual growth & discipleship", intro: "To deepen each man's relationship with God and develop a Christ-centered identity.", items: [
          c("Foundational Bible study", "Weekly small group sessions focusing on foundational doctrines and practical life application."),
          c("Daily devotion and accountability", "Daily Scripture readings and peer accountability emphasizing spiritual discipline and identity."),
          c("Prayer and worship nights", "Monthly gatherings for collective intercession, worship, and testimony."),
        ],
      },
      {
        type: "cards", title: "Pillar 2: Identity & purpose discovery", intro: "To help men understand their God-given identity and leadership calling.", items: [
          c("Identity workshops", "Interactive sessions on biblical manhood, family leadership, and countering cultural misconceptions."),
          c("Purpose discovery retreats", "Quarterly retreats focused on discovering spiritual gifts, marketplace impact, and personal callings."),
        ],
      },
      {
        type: "cards", title: "How a man joins in", items: [
          c("Onboarding", "New members are welcomed with foundational mentorship where they learn the vision and brotherhood core values."),
          c("Regular growth check-ins", "Periodic evaluations of each man's growth through one-on-one mentorship meetings."),
        ],
      },
    ],
  },
  {
    kind: "ministry",
    slug: "ladies",
    title: "Sister Sister Ladies Ministry",
    tagline: "Raising women. Strengthening sisterhood. Impacting generations.",
    summary: "A movement raising, equipping and releasing virtuous women who understand their worth in Christ.",
    hero: "ladies-cover",
    audience: "Women of every age",
    order: 7,
    intro: [
      "Founded in 2015 under the divine calling of Christhood International Outfield Ministries, Sister Sister is more than a ministry—it is a movement designed to raise, equip, and release a generation of virtuous women who understand their worth in Christ and champion unity through sisterhood.",
    ],
    blocks: [
      { type: "statement", label: "Our divine purpose", text: "Sister Sister was birthed with a clear mandate: to restore the God-ordained dignity, strength, and influence of womanhood. This ministry seeks to awaken the divine potential within every woman, deeply rooted in Proverbs 31." },
      {
        type: "cards", title: "Our key focus areas", numbered: true, items: [
          c("Recognize her identity in Christ", "We remind women that their worth is not determined by society but by the love and sacrifice of Jesus Christ."),
          c("Embody godly virtues", "True feminine strength lies in virtues of humility, gentleness, wisdom, and faith—marks of divine power in action."),
          c("Build lasting bonds in sisterhood", "We create an environment of love, mutual support, and accountability where women find not just friends but sisters in Christ."),
          c("Impact the world for Christ", "We equip women to influence every sphere of society with grace, integrity, and unwavering faith."),
        ],
      },
      {
        type: "cards", title: "Our vision in action", items: [
          c("Mentorship for legacy", "Legacy mentors are paired with younger women to pass on godly wisdom and practical life skills, creating an unbroken chain of discipleship and empowerment."),
          c("Community engagement & support", "Outreach initiatives empower women to address community needs, support families, and minister with practical compassion."),
          c("Spiritual retreats & gatherings", "Regular fellowships, prayer retreats, and sisterhood circles where women can recharge, worship, and build deep spiritual connections."),
        ],
      },
    ],
  },
  {
    kind: "ministry",
    slug: "administration",
    title: "Administration Ministry",
    tagline: "Serving with order, excellence, and stewardship",
    summary: "The operational backbone of the ministry, so every other department can flourish.",
    hero: "christhood-about-intro",
    audience: "People who love order and stewardship",
    order: 8,
    intro: [
      "Church administration is a calling, not just a task. Every schedule managed, every financial report balanced, every facility maintained contributes to a greater mission—creating an environment where souls are saved, faith is nurtured, and God's work is carried out effectively.",
      "If you have a passion for organization, leadership, and stewardship, consider serving in the Administration Ministry. Your skills are vital to advancing God's Kingdom!",
    ],
    blocks: [
      { type: "statement", label: "Our mission", text: "To facilitate the smooth, efficient, and spiritually-aligned management of the church's resources, personnel, and operations, ensuring that the ministry fulfills its God-given vision with excellence, transparency, and integrity." },
      {
        type: "cards", title: "Key objectives", numbered: true, items: [
          c("Ensure operational efficiency", "Provide structured systems that enhance workflow and ministry effectiveness."),
          c("Steward financial resources", "Maintain transparency, accurate reporting, and accountability in budgeting and stewardship."),
          c("Manage church properties & facilities", "Ensure the ministry's physical, operational, and digital assets are well maintained."),
          c("Support church leadership & ministries", "Provide administrative assistance that allows pastoral and ministry leaders to focus on spiritual care."),
          c("Implement policies & governance compliance", "Ensure the ministry follows biblical and statutory best practices in governance and operational accountability."),
        ],
      },
      { type: "quote", text: "And God has appointed in the church first apostles, second prophets, third teachers, then miracles, then gifts of healing, helping, administrating, and various kinds of tongues.", cite: "1 Corinthians 12:28" },
      {
        type: "prose", title: "The heart of church administration", paragraphs: [
          "The Administration Ministry is the operational backbone of Christhood International Outfield Ministry, ensuring that all departments coordinate smoothly. It is responsible for managing resources, coordinating personnel, overseeing logistics, managing operational schedules, and ensuring compliance with ministry policies.",
          "This calling is spiritual stewardship: ensuring that God's work is carried out with excellence, integrity, and diligence. A strong administration allows other ministries to flourish without operational hindrance.",
          "A well-administered church reflects God's order, excellence, and purpose. Through wisdom, integrity, and diligent service, the Administration Ministry ensures that the church remains a beacon of light, well-equipped to serve our congregation, our city, and the nations.",
        ],
      },
    ],
  },
  {
    kind: "ministry",
    slug: "protocol",
    title: "Protocol, Security & Hospitality",
    tagline: "“Let all things be done decently and in order”",
    summary: "Order, safety and a warm welcome for leaders, guests and every person who walks through the door.",
    hero: "protocol-ministry-page",
    audience: "Ushers, hosts and security volunteers",
    order: 9,
    intro: [
      "The Protocol, Security, and Hospitality Ministry plays a vital role in ensuring order, safety, and warm reception for church leaders, guest ministers, and attendees. This ministry functions as a bridge between leadership and the congregation, maintaining a well-organized and spiritually conducive atmosphere before, during, and after services or events.",
    ],
    blocks: [
      { type: "statement", label: "Our calling", text: "Rooted in 1 Corinthians 14:40, we serve with vigilance, warmth, and excellence so that every soul visiting Christhood feels welcomed, secure, and honored." },
      {
        type: "cards", title: "Core departments", numbered: true, items: [
          c("Protocol department", "Coordinates the logistics, movement, and welfare of pastors, guest ministers, and special guests to ensure smooth service operations."),
          c("Security department", "Maintains a secure, vigilant, and safe environment for the church, its leaders, and congregation through professional security measures."),
          c("Hospitality department", "Creates a welcoming and comfortable atmosphere for guests, ensuring they feel valued and cared for throughout their visit."),
        ],
      },
      {
        type: "cards", title: "Roles & guidelines", items: [
          c("Protocol team", "Ensure seamless movement and reception for ministers and special visitors.", ["Plan and coordinate the arrival, VIP seating, and departure of ministers and dignitaries.", "Ensure clear communication between leadership and operational departments.", "Manage guest transport, accommodations, and service itinerary logistics."]),
          c("Security team", "Maintain peace of mind and protection for all congregants.", ["Conduct pre-service safety checks of the venue and parking premises.", "Monitor entry and access points for crowd control and restricted zones.", "Handle emergency protocols and coordinate orderly movement."]),
          c("Hospitality team", "Extend the warmth, joy, and love of Christ to every attendee.", ["Welcome first-time visitors with information packets and guidance.", "Coordinate refreshments and pastoral reception care.", "Provide ushering assistance that facilitates an uninterrupted worship atmosphere."]),
        ],
      },
    ],
  },
  {
    kind: "ministry",
    slug: "creative",
    title: "Creative Arts & Beautification",
    tagline: "Inspiring beauty and worship through visual excellence",
    summary: "Design, stage and atmosphere that help every gathering feel intentional, welcoming and spiritually aligned.",
    hero: "creative-intro",
    audience: "Designers, decorators and makers",
    order: 10,
    intro: [
      "The Creative Arts Ministry exists to glorify God through visual design, atmosphere, and artistic expression that supports worship and discipleship. We help shape environments that point people to Christ and make every gathering feel intentional, welcoming, and spiritually aligned.",
    ],
    blocks: [
      { type: "statement", label: "Our ministry focus", text: "We combine design, stage preparation, beautification, and creative collaboration to serve the wider ministry. Our goal is not decoration for its own sake, but excellence that helps people engage with the message and presence of God." },
      {
        type: "cards", title: "Core focus areas", numbered: true, items: [
          c("Visual storytelling", "Design graphics, stage layouts, and worship environments that reinforce the Gospel message and support each ministry moment with clarity and beauty."),
          c("Atmosphere & beautification", "Create warm, orderly, and aesthetically thoughtful spaces that help guests and members feel welcomed, calm, and ready to worship."),
          c("Creative collaboration", "Work closely with worship, media, protocol, and event teams so that every service and program feels unified rather than fragmented."),
        ],
      },
      {
        type: "cards", title: "Teams & structure", items: [
          c("Visual design team", "Mission: create sermon series graphics, stage designs, and environmental décor that align with the message of the Gospel. Key scripture: Exodus 35:35.", ["Design visuals for sermon slides, social media, and print materials.", "Develop thematic stage designs that enhance the worship message.", "Coordinate seasonal themes for Easter, Christmas, and outreach events."]),
          c("Worship environment team", "Mission: enhance the worship atmosphere through creative stage lighting, thematic aesthetics, and venue beautification. Key scripture: Colossians 3:23.", ["Manage aesthetic arrangements and stage lighting dynamics.", "Coordinate environmental displays for conferences and fellowship summits.", "Maintain design excellence across all physical touchpoints."]),
        ],
      },
    ],
  },
];
