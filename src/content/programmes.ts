import type { PageDoc } from "@/lib/types";
import { photoSet } from "@/lib/images";

const c = (title: string, text?: string, bullets?: string[]) => ({ title, text, bullets });

export const programmes: PageDoc[] = [
  {
    kind: "programme",
    slug: "jewels",
    title: "Jewels Mentorship",
    tagline: "Restoring relationships, enhancing belonging",
    audience: "Ages 7–12",
    summary: "A fun-filled holiday bootcamp for kids aged 7–12, packed with learning, growth and exciting activities.",
    hero: "jewels-about-page",
    order: 1,
    featured: true,
    intro: [
      "The Jewels Kids Mentorship Program is a transformative initiative designed to provide children aged 7 to 12 years with a holistic, faith-based enrichment experience outside the classroom. Rooted in Christian principles, this program seeks to empower, equip, and inspire young minds through mentorship, life skills training, educational support, and recreational activities.",
      "In an era of rapid social and technological change, the program aims to instill strong values, leadership skills, and resilience in the next generation.",
    ],
    actions: [
      { label: "Register for camp", href: "/events/register" },
      { label: "Instagram", href: "https://www.instagram.com/jewelskidsclub", external: true },
      { label: "TikTok", href: "https://www.tiktok.com/@jewels.kids.club", external: true },
      { label: "Facebook", href: "https://www.facebook.com/share/18pdLLYzBC/", external: true },
    ],
    blocks: [
      { type: "gallery", title: "Devotions", photos: photoSet("jd") },
      { type: "gallery", title: "Crazy Olympics", photos: photoSet("jc") },
      { type: "gallery", title: "Creative Night", photos: photoSet("jcn") },
      {
        type: "cards", title: "Childhood development (ages 7–12)", intro: "“Can I make it in the world of people and things?” During this stage, children are capable of learning, creating, and accomplishing numerous new skills, developing a healthy sense of industry. This is a crucial social stage of development where unresolved feelings of inadequacy can lead to problems with competence and self-esteem.", items: [
          c("Social development", "As their world expands, school and neighborhood relationships become significant alongside family."),
          c("Skill building", "The fundamentals of technology and life skills are developed during this critical stage."),
          c("Encouragement", "When praised for accomplishments, children demonstrate industry and perseverance."),
        ],
      },
      {
        type: "cards", title: "Our programme objectives", items: [
          c("Faith-based growth", "Instilling Christian values and spiritual development through Bible-based activities."),
          c("Life skills development", "Teaching practical skills for daily living and future independence."),
          c("Academic support", "Providing educational assistance and STEM engagement activities."),
          c("Character building", "Developing leadership qualities and strong moral character."),
          c("Talent development", "Nurturing artistic, athletic, and creative talents through diverse activities."),
          c("Community engagement", "Fostering social responsibility and service to others."),
        ],
      },
      {
        type: "cards", title: "Our unique approach", intro: "We partner with children to determine not what's wrong with them, but what they truly want in life and how to achieve it through friendly, personal and professional mentoring rooted in Christian values.", items: [
          c("What we avoid", undefined, ["Focusing on dysfunction", "Negative thinking patterns", "Increasing anxiety or depression"]),
          c("What we provide", undefined, ["Guidance for current challenges", "Actionable life improvement", "Transformational mentoring"]),
        ],
      },
      {
        type: "cards", title: "Programme components", items: [
          c("Mentorship sessions", "Children build relationships with caring Christian adults who provide guidance and support.", ["One-on-one Christian mentorship", "Group discussions", "Faith-based counselling"]),
          c("Life skills development", "Practical skills training to prepare children for real-world challenges.", ["Communication", "Problem-solving", "Financial literacy", "Emotional intelligence"]),
          c("STEM & academic support", "Engaging educational activities to boost academic performance.", ["Homework assistance", "Science experiments", "Technology workshops", "Math challenges"]),
          c("Recreational activities", "Fun activities to nurture talents and promote physical health.", ["Sports and games", "Arts and crafts", "Music and drama", "Field trips"]),
        ],
      },
      {
        type: "cards", title: "How we deliver it", items: [
          c("Physical mentorship camps", "Immersive in-person experiences with hands-on activities and team building."),
          c("Community hubs", "Local gathering places for ongoing mentorship and activities."),
          c("Online platforms", "Virtual sessions and resources for remote participation."),
          c("Field trips & outreach", "Educational excursions and community service projects."),
        ],
      },
      { type: "list", title: "Programme benefits", items: ["Kids matched with caring Christian adults for stability", "Understanding and using personal potential", "Development of individual service plans", "Setting short and long term goals", "Ongoing study and training activities", "Strong foundation in Christian faith and values", "Open and honest communication", "Encouragement to achieve goals"] },
      { type: "quote", text: "We are guilty of many errors, but our worst crime is abandoning the children. Many things can wait. The child cannot. Right now is the time his bones are being formed, his blood is being made and his senses are being developed. To him we cannot answer ‘Tomorrow’. His name is ‘Today’.", cite: "Our commitment" },
    ],
  },
  {
    kind: "programme",
    slug: "teen-life",
    title: "Teen Life Mentorship",
    tagline: "Empowering teens to discover their identity, purpose, and values in a challenging world",
    audience: "Ages 13–19",
    summary: "A holistic and rigorous holiday bootcamp for teenagers nationwide, grounded in faith-based mentorship.",
    hero: "tlm-about-section",
    order: 2,
    featured: true,
    intro: [
      "Traditional teen mentorship often revolves around guiding, fixing, and protecting. But what if the real magic happens when we take a step back?",
      "Our approach offers a fresh perspective to mentoring teenagers—grounded in philosophy, psychology, and raw parenting experience.",
    ],
    actions: [{ label: "Register for camp", href: "/events/register" }],
    blocks: [
      { type: "gallery", title: "Devotions", photos: photoSet("td") },
      { type: "gallery", title: "Crazy Olympics", photos: photoSet("ts") },
      { type: "gallery", title: "Creative Night", photos: photoSet("tcn") },
      {
        type: "cards", title: "The world teens face today", intro: "Teens are navigating a complex landscape of challenges that shape their development.", items: [
          c("Digital pressures", "Social media, cyberbullying, and constant internet exposure."),
          c("Substance risks", "Drug influences and gang pressures."),
          c("Relationships", "Early sexualization, sexting, and identity struggles."),
          c("Emotional health", "Emotional instability and mental health challenges."),
        ],
      },
      { type: "statement", label: "Our mission", text: "To help teens build a strong, Godly identity and positive relationships by addressing life issues through a faith-anchored approach." },
      {
        type: "cards", title: "What we believe", items: [
          c("We believe", "Every teen is precious, loved, and full of purpose. We guide with wisdom, grace, and truth—no quick fixes, just a Godly framework for clarity, confidence, and character."),
          c("Our objective", "Create safe, inspiring spaces for growth in stability, direction, hope, and empowerment. We nurture potential in homes, schools, churches, and communities."),
        ],
      },
      {
        type: "cards", title: "What we offer", intro: "A dynamic mentorship program that addresses all aspects of teen development.", items: [
          c("Life skills development", undefined, ["Emotional intelligence training", "Decision-making frameworks", "Conflict resolution strategies", "Financial literacy basics"]),
          c("Academic & career support", undefined, ["Study skill workshops", "Career exploration", "College preparation", "Time management techniques"]),
          c("Faith development", undefined, ["Bible study and devotionals", "Practical faith application", "Prayer life development", "Christian worldview training"]),
          c("Relationship building", undefined, ["Peer relationship skills", "Family communication", "Dating and boundaries", "Social media etiquette"]),
        ],
      },
      {
        type: "cards", title: "Our transformational camp experience", intro: "Our camps provide a unique environment for deep growth and connection.", items: [
          c("Trust building", "Creating safe spaces for vulnerability and growth."),
          c("Meaningful discussions", "Honest conversations about real-life challenges."),
          c("Lasting friendships", "Building supportive peer relationships."),
          c("Leadership development", "Opportunities to grow and take initiative."),
        ],
      },
      { type: "list", title: "Camp activities include", items: ["Team games and challenges", "Interactive devotionals", "Practical life teachings", "Nature hikes and outdoor activities", "Open Q&A sessions", "Talent showcases"] },
      { type: "quote", text: "Through mentorship, my daughter has gained confidence in her identity and made better choices in friendships.", cite: "Parent" },
      { type: "quote", text: "The camp helped me understand my worth and purpose. I'm no longer afraid to be different.", cite: "Teen participant" },
      { type: "quote", text: "We've seen remarkable improvements in students' attitudes and academic performance after joining TLM.", cite: "School administrator" },
    ],
  },
  {
    kind: "programme",
    slug: "branch",
    title: "Branch Mentorship",
    tagline: "Building Resilient Achievers Nurturing Character & Hope",
    audience: "Ages 17–19, high school leavers",
    summary: "A countrywide mentorship programme that midwifes the transition from high school to college or university.",
    hero: "branch3",
    order: 3,
    featured: true,
    intro: [
      "An exciting and interactive initiative dedicated to supporting high school graduates as they transition to college or university. With a focus on career development, spiritual growth, leadership development, and holistic personal growth, BRANCH aims to empower young adults with the skills and virtues necessary for success in their academic and professional journeys.",
      "The most important thing to remember is that mentoring youth isn't another meeting or program; it's a relationship.",
    ],
    actions: [
      { label: "Join the programme", href: "/programmes/branch/register" },
      { label: "Instagram", href: "https://www.instagram.com/christhood_branch_excands", external: true },
      { label: "TikTok", href: "https://www.tiktok.com/@christhood_branchexcands", external: true },
      { label: "Facebook", href: "https://www.facebook.com/share/1SyBD7K4ee/", external: true },
    ],
    blocks: [
      { type: "gallery", title: "Branch sessions", photos: photoSet("b-s") },
      { type: "gallery", title: "Branchers", photos: photoSet("b-m") },
      { type: "gallery", title: "Facilitators", photos: photoSet("b-f") },
      { type: "statement", label: "Vision", text: "To empower young adults to transition confidently from high school to college/university while fostering personal growth, academic readiness, leadership skills, and faith-based values." },
      { type: "statement", label: "Mission", text: "To provide holistic mentorship rooted in practical skills, intellectual development, leadership training, and spiritual grounding, preparing participants for a purposeful and impactful college/university experience." },
      {
        type: "prose", title: "About Nawiri Africa", paragraphs: [
          "Established in January 2010, Nawiri Africa is a dynamic and results-driven training service provider, mentorship hub, and events management firm. With a strong foundation in the training industry, we specialize in delivering high-quality, cost-effective solutions tailored to meet the evolving needs of individuals, teams, and organizations.",
          "At Nawiri Africa, we take pride in our team of skilled and experienced professionals who bring innovation, energy, and strategic insights into every engagement. Our rapid growth is fuelled by a dedication to excellence and a client-centric approach, enabling us to build strong partnerships across diverse industries including Government, Banking, Corporate Organizations, Religious Groups, and Educational Institutions.",
        ],
      },
      {
        type: "cards", title: "Who it is for", intro: "The program is tailored for recent high school graduates (ages 17-19) who are preparing to join college or university.", items: [
          c("Build foundation", "Strong moral and spiritual foundation."),
          c("Develop skills", "Leadership and life skills development."),
          c("Gain clarity", "Future academic and career paths."),
        ],
      },
      {
        type: "cards", title: "Programme overview", numbered: true, items: [
          c("Navigate life issues", "Addressing challenges of young adulthood."),
          c("Enhance intellectual development", "Critical thinking and academic skills."),
          c("Grow in Christian faith", "Spiritual grounding and values."),
          c("Focus on self-development", "Personal growth and confidence."),
          c("Plan careers", "Career exploration and preparation."),
          c("Engage in community service", "Giving back and social responsibility."),
        ],
      },
      {
        type: "cards", title: "Programme objectives", items: [
          c("Spiritual growth", "Developing faith-based values and principles."),
          c("Leadership development", "Cultivating leadership skills and potential."),
          c("Life skills mastery", "Essential skills for independent living."),
          c("Career preparedness", "Preparation for academic and professional success."),
          c("Community engagement", "Service and social responsibility."),
          c("Holistic development", "Balanced growth in all life areas."),
        ],
      },
      {
        type: "cards", title: "Programme structure", numbered: true, items: [
          c("Weekly workshops", "Interactive sessions on key development areas."),
          c("Mentorship sessions", "One-on-one guidance and support."),
          c("Practical projects", "Hands-on learning experiences."),
          c("Faith-based activities", "Spiritual growth and development."),
          c("Evaluation & reflection", "Assessing progress and growth."),
        ],
      },
      { type: "quote", text: "Taking part in Branch 2025 has been a very wonderful experience. I have learnt so many things I wasn't aware of, and how to handle myself and some issues that come along the way in my university life, but most of all I have also been able to grow spiritually through the devotions that we usually do. All I can say is thanks to all who came up with the program together with the facilitators.", cite: "Faith, 2025 Branch events organizer" },
      { type: "quote", text: "Branch has been an amazing experience. At first I was hesitant to join, but when I attended my first session there were no regrets. The lessons were practical and inspiring, and the people were incredibly friendly. I leave feeling more confident and clear about my next steps. I'd definitely recommend it.", cite: "Stacey, Branch Nairobi member" },
      { type: "quote", text: "Finishing Form Four was overwhelming, but the Branch guidance session gave me clarity and direction. It helped me discover my strengths, explore new career paths, and gain the confidence to plan my future with purpose.", cite: "Juanita, Branch Nairobi member" },
      {
        type: "list", title: "Where Branch meets", intro: "Currently available in these towns, and expanding to more soon.", items: ["Nairobi", "Gilgil", "Nakuru", "Nanyuki", "Nyahururu", "Eldoret", "Naivasha", "Narok", "Oloitoktok", "Thika", "Machakos"],
      },
      {
        type: "cards", title: "Join BRANCH Mentorship", intro: "The BRANCH Mentorship Program is a vital initiative that addresses the challenges faced by young adults during a critical stage in their lives. With your participation and support, we can equip them with the tools they need to succeed academically, personally, and spiritually.", items: [
          c("Maureen", "+254 714 545 791"),
          c("Lydiah", "0725 968 973"),
        ],
      },
    ],
  },
  {
    kind: "programme",
    slug: "impact",
    title: "Impact",
    tagline: "University mentorship programme",
    audience: "University and college students",
    summary: "Discipleship, teaching, prayer and community for students on university and college campuses.",
    hero: "christhood-intro-section",
    order: 4,
    featured: true,
    intro: [
      "IMPACT is a comprehensive university mentorship program designed to equip the saints for ministry by deepening their faith and knowledge of Christ, enabling them to engage in impactful ministry and achieve holistic growth.",
    ],
    blocks: [
      { type: "statement", label: "Mission", text: "Drawing inspiration from 2 Timothy 2:1-2, the program emphasizes intentional discipleship, spiritual transformation, and life application through authentic relationships and a Christ-centered community." },
      { type: "statement", label: "Vision", text: "To create a spiritually vibrant campus environment where students thrive in their relationship with Christ, grow as servant leaders, and make a transformative impact on their communities. IMPACT aims to nurture believers who are spiritually mature, firmly rooted in biblical truth, and equipped to disciple others, extending God's kingdom on and beyond the campus." },
      {
        type: "cards", title: "Core pillars", items: [
          c("Discipleship", "Intentional mentoring relationships fostered through trust, guidance, and accountability, leading to spiritual and personal growth."),
          c("Biblical teaching", "Systematic teaching of God's Word, emphasizing sound doctrine and its practical application in daily life."),
          c("Prayer", "Cultivating a lifestyle of fervent, consistent prayer, both individually and corporately, as a cornerstone of spiritual vitality."),
          c("Community", "Building a Christ-centered community where students can share openly, grow together, and encourage one another."),
          c("Leadership development", "Preparing participants to take on leadership roles with integrity, humility, and Christlike character."),
        ],
      },
      { type: "list", title: "Programme objectives", items: ["To deepen participants' relationship with Christ by fostering a habit of daily devotion and reflection.", "To develop godly character and servant-leadership qualities through mentorship and discipleship.", "To establish small groups as safe spaces for spiritual growth, mutual accountability, and encouragement.", "To equip students to disciple others, ensuring the multiplication of spiritually mature leaders.", "To instill a commitment to prayer, worship, and other spiritual disciplines as a foundation for ministry.", "To provide practical tools and training for effective ministry, community engagement, and personal growth."] },
      { type: "quote", text: "You then, my son, be strong in the grace that is in Christ Jesus. And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others.", cite: "2 Timothy 2:1-2 (NIV)" },
      { type: "prose", paragraphs: ["IMPACT exists to glorify God by raising up a generation of Christ-centered leaders who are passionate about transforming lives and communities for His kingdom. Through mentorship, intentional discipleship, and practical ministry opportunities, participants will be empowered to fulfill their God-given purpose and extend His love to the world."] },
    ],
  },
  {
    kind: "programme",
    slug: "iact",
    title: "iAct and the GeMM Program",
    tagline: "Institute of Apologetics & Christian Teaching",
    audience: "Believers and ministers",
    summary: "An outreach training kit that equips saints for ministry through knowledge and faith in Christ.",
    hero: "gemm-photo-section",
    order: 5,
    featured: true,
    actions: [{ label: "Open the Learning Portal", href: "https://instituteofapologetics.org", external: true }],
    intro: [
      "The GeMM (Gospel to the Modern Mind) is a divine initiative ordained by God to equip His people for proclaiming the Gospel of Jesus Christ in the 21st century. We exist to raise up ministers and believers who are unwavering in devotion to Christ, unshakable in sound doctrine, and unstoppable in fulfilling the Great Commission.",
    ],
    blocks: [
      { type: "statement", label: "Vision", text: "To cultivate believers who reflect Christ in character, proclaim Him with boldness, and embody His love in service. Through doctrinal foundations, Spirit-empowered ministry, and Christ-centered cultural engagement, we prepare ambassadors for Christ who can effectively engage the modern mind with eternal truth." },
      {
        type: "cards", title: "Core components", items: [
          c("Doctrinal foundations", "Deeply rooted in Scripture with Christ as the center of every doctrine—His person, the cross, resurrection, return, and the Church as His body."),
          c("Spirit-empowered ministry", "Reliance on the Holy Spirit for anointed preaching, prayer-filled evangelism, discipleship, and healing ministry with Christ's authority."),
          c("Engaging the modern mind", "Presenting Christ as “the way, the truth, and the life” through apologetics, cultural engagement, and gracious truth-speaking."),
          c("Spiritual formation", "Cultivating daily communion with Christ, walking in the Spirit, developing Christlike character, and embracing the cost of discipleship."),
          c("Cultural apologetics", "Addressing modern issues of identity, morality, and purpose with the transformative truth of Jesus Christ."),
        ],
      },
      { type: "list", title: "Programme benefits", items: ["To exalt Christ in every message, mission, and ministry endeavor", "To impact the world for Christ through effective Gospel proclamation", "To stand firm in Christ's truth in a relativistic age", "To reflect Christ's love through compassionate ministry", "To bring souls to Christ through Spirit-empowered evangelism", "To develop biblical responses to contemporary challenges", "To cultivate a life of prayer and dependence on the Holy Spirit"] },
      { type: "quote", text: "For we preach not ourselves, but Christ Jesus the Lord; and ourselves your servants for Jesus' sake.", cite: "2 Corinthians 4:5" },
      { type: "prose", paragraphs: ["The GeMM program is a sacred journey of transformation, empowerment, and obedience to Christ. With sound doctrine, Spirit-led training, and a heart for the lost, participants will emerge as ambassadors of Christ, prepared to shine His light in a dark world. If you feel the burning in your heart to make Christ known, The GeMM program is your divine invitation to rise to the call and join the mission to make His name known to every tribe, tongue, and nation."] },
    ],
  },
  {
    kind: "programme",
    slug: "apologetics",
    title: "Christhood Apologetics",
    tagline: "Defending the faith in the 21st century",
    audience: "Believers who want to give a reason for their hope",
    summary: "Equipping believers to defend their faith with intellectual rigour and biblical truth.",
    hero: "apologetics",
    order: 6,
    featured: true,
    actions: [{ label: "Open the Learning Portal", href: "https://instituteofapologetics.org", external: true }],
    intro: [
      "C.S. Lewis reminds us that the battle of ideas is central to the Christian mission. In an age dominated by secularism, relativism, and naturalism, Christians are called to engage thoughtfully and robustly, providing answers that affirm the credibility and relevance of our faith in Christ.",
    ],
    blocks: [
      {
        type: "cards", title: "The challenge of secular worldviews", items: [
          c("Atheism", "Denying the existence of God, atheism claims human life is the product of blind chance, stripping existence of inherent purpose. This worldview falters when explaining objective moral values, the origin of consciousness, and humanity's innate longing for transcendence."),
          c("Scientism", "A reductionist belief that empirical science alone is the arbiter of truth. While science is a valuable tool for exploring nature, it cannot resolve ultimate purpose, morality, or the metaphysical. Faith and reason are allies."),
          c("Relativism", "The belief that truth is subjective and morality is merely personal preference. Christianity provides the objective moral framework necessary for genuine justice, human rights, and enduring truth."),
          c("Postmodern skepticism", "Questioning whether any worldview can claim universal truth. The Gospel of Jesus Christ does not oppress but liberates, uniting humanity under God's redemptive love and historical truth."),
        ],
      },
      {
        type: "cards", title: "The need for apologetics in evangelism", items: [
          c("Answering tough questions", "Modern culture poses difficult questions about suffering, morality, and the exclusivity of Christ. Apologetics provides thoughtful and biblically grounded answers."),
          c("Revealing logical fallacies", "Many secular claims rest on internal contradictions. Apologetics helps uncover these inconsistencies with clarity and grace."),
          c("Affirming rational credibility", "From the historical resurrection of Jesus Christ to the fine-tuning of the cosmos, the Christian worldview is intellectually robust."),
          c("Demonstrating existential relevance", "Christianity speaks directly to deepest human longings—identity, purpose, reconciliation, and hope for eternity."),
        ],
      },
      {
        type: "cards", title: "Undergirding truths for the Christian apologist", items: [
          c("The Lordship of Christ", "Jesus is the embodiment of truth (John 14:6). He alone fulfills humanity's need for salvation and purpose."),
          c("The reliability of Scripture", "The Bible is the inspired, authoritative Word of God, historically grounded and spiritually transformative."),
          c("The historical resurrection", "The resurrection of Jesus is the cornerstone of Christian faith and the victory over sin and death."),
          c("Human longing for God", "Every soul carries a longing for meaning, justice, and love that only Christ can satisfy."),
        ],
      },
      { type: "quote", text: "But sanctify the Lord God in your hearts, and always be ready to give a defense to everyone who asks you a reason for the hope that is in you, with meekness and fear.", cite: "1 Peter 3:15" },
      { type: "prose", paragraphs: ["Apologetics is not about winning arguments, but winning hearts and minds for Christ. In the 21st century, it stands as an indispensable tool for equipping believers and reaching thinkers."] },
    ],
  },
];
