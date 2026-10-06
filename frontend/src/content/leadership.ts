import jagbirPhoto from "../imports/team/jagbir-singh.jpeg"
import kuldeepPhoto from "../imports/team/kuldeep-kumar.jpeg"
import mohanlalPhoto from "../imports/team/mohanlal-goswami.jpeg"

export type LeadershipLanguage = "en" | "hi"
export type Localized<T> = Record<LeadershipLanguage, T>

export type LeaderSection = {
  title: Localized<string>
  paragraphs?: Localized<string[]>
  listIntro?: Localized<string>
  list?: Localized<string[]>
}

export type Leader = {
  /** Anchor on the About page, e.g. /about#jagbir-singh */
  id: string
  name: Localized<string>
  role: Localized<string>
  tagline: Localized<string>
  photo: string
  photoPosition: string
  intro: Localized<string[]>
  highlights?: {
    value: Localized<string>
    label: Localized<string>
  }[]
  sections: LeaderSection[]
  vision?: {
    title: Localized<string>
    quote: Localized<string>
    paragraphs: Localized<string[]>
    beliefLead: Localized<string>
    belief: Localized<string>
  }
  message?: {
    title: Localized<string>
    quote: Localized<string>
  }
}

export const leaders: Leader[] = [
  {
    id: "jagbir-singh",
    name: {
      en: "Jagbir Singh Garhwal",
      hi: "जगबीर सिंह गढ़वाल",
    },
    role: {
      en: "Founder & Director",
      hi: "संस्थापक एवं निदेशक",
    },
    tagline: {
      en: "A vision that reaches beyond business into society",
      hi: "एक सोच, जो व्यवसाय से आगे समाज तक जाती है",
    },
    photo: jagbirPhoto,
    photoPosition: "center top",
    intro: {
      en: [
        "Jagbir Singh Garhwal is an entrepreneur, fintech professional and individual dedicated to social service. While working in business and technology, he recognised the need to serve sections of society that need opportunity, support and dignity most.",
        "To give this vision an organised form, Samriddhi Help Team Foundation was established in 2025. The Foundation's purpose is not only to provide assistance, but to work continuously toward dignity, opportunity and positive change in the lives of people in need.",
      ],
      hi: [
        "जगबीर सिंह गढ़वाल एक उद्यमी, फिनटेक प्रोफेशनल और सामाजिक सेवा के प्रति समर्पित व्यक्ति हैं। व्यवसाय और तकनीक के क्षेत्र में कार्य करते हुए उन्होंने समाज के उन वर्गों के लिए कार्य करने की आवश्यकता को महसूस किया, जिन्हें अवसर, सहयोग और सम्मान की सबसे अधिक आवश्यकता है।",
        "इसी सोच को एक संगठित रूप देने के उद्देश्य से वर्ष 2025 में Samriddhi Help Team Foundation की स्थापना की गई। संस्था का उद्देश्य केवल सहायता प्रदान करना नहीं, बल्कि जरूरतमंद लोगों के जीवन में सम्मान, अवसर और सकारात्मक बदलाव लाने की दिशा में निरंतर कार्य करना है।",
      ],
    },
    sections: [
      {
        title: {
          en: "Business experience",
          hi: "व्यवसायिक अनुभव",
        },
        paragraphs: {
          en: [
            "Jagbir Singh Garhwal is a Director of Digiway Payment Private Limited. Digiway Payment is a FinTech and Digital Payment Solutions company that works with businesses in digital payments and technology solutions.",
            "His experience in fintech and digital payments has helped him understand that modern technology and business are not only vehicles for economic growth; they can also create a positive impact for society.",
            "With this belief, he works to advance business development and social responsibility together.",
          ],
          hi: [
            "जगबीर सिंह गढ़वाल Digiway Payment Private Limited के Director हैं। Digiway Payment एक FinTech एवं Digital Payment Solutions कंपनी है, जो डिजिटल भुगतान और तकनीकी समाधान के क्षेत्र में व्यवसायों के साथ कार्य करती है।",
            "फिनटेक और डिजिटल पेमेंट के क्षेत्र में उनके अनुभव ने उन्हें यह समझने का अवसर दिया कि आधुनिक तकनीक और व्यवसाय केवल आर्थिक विकास के माध्यम नहीं हैं, बल्कि इनके माध्यम से समाज के लिए भी सकारात्मक प्रभाव पैदा किया जा सकता है।",
            "इसी विचार के साथ उनका प्रयास है कि व्यवसायिक विकास और सामाजिक जिम्मेदारी एक-दूसरे के साथ आगे बढ़ें।",
          ],
        },
      },
    ],
    vision: {
      title: {
        en: "Founder's Vision",
        hi: "संस्थापक का दृष्टिकोण",
      },
      quote: {
        en: "I believe a society can achieve true prosperity only when the benefits of development are not limited to a few people, but also reach those who need them most.",
        hi: "मेरा मानना है कि किसी भी समाज की वास्तविक समृद्धि तभी संभव है, जब विकास का लाभ केवल कुछ लोगों तक सीमित न रहे, बल्कि जरूरतमंद व्यक्ति तक भी पहुँचे।",
      },
      paragraphs: {
        en: [
          "For me, Samriddhi Help Team Foundation is not merely an organisation; it is a way to fulfil a responsibility toward society.",
          "Alongside working in technology and digital payments through Digiway Payment Private Limited, one of my important goals is to reach people in need through the social work of Samriddhi Help Team Foundation.",
        ],
        hi: [
          "मेरे लिए Samriddhi Help Team Foundation केवल एक संस्था नहीं, बल्कि समाज के प्रति जिम्मेदारी निभाने का एक माध्यम है।",
          "व्यवसाय के क्षेत्र में Digiway Payment Private Limited के माध्यम से तकनीक और डिजिटल भुगतान के क्षेत्र में काम करने के साथ-साथ, सामाजिक क्षेत्र में Samriddhi Help Team Foundation के माध्यम से जरूरतमंद लोगों तक सहायता पहुँचाने का प्रयास मेरा एक महत्वपूर्ण उद्देश्य है।",
        ],
      },
      beliefLead: {
        en: "We believe that—",
        hi: "हमारा विश्वास है कि—",
      },
      belief: {
        en: "A small effort can create a meaningful change in someone's life.",
        hi: "एक छोटा प्रयास किसी के जीवन में बड़ा बदलाव ला सकता है।",
      },
    },
    message: {
      title: {
        en: "Founder's Message",
        hi: "संस्थापक का संदेश",
      },
      quote: {
        en: "My business journey has taught me that development is not only about moving forward ourselves. Real development is when our progress gives another person in society an opportunity to move forward too. Through Samriddhi Help Team Foundation, I hope we can work together to reach people in need, strengthen the dignity of daughters, protect the environment and create new opportunities for young people.",
        hi: "मेरी व्यावसायिक यात्रा ने मुझे यह सिखाया है कि विकास केवल स्वयं आगे बढ़ने का नाम नहीं है। वास्तविक विकास तब है, जब हमारी प्रगति से समाज के किसी दूसरे व्यक्ति को भी आगे बढ़ने का अवसर मिले। Samriddhi Help Team Foundation के माध्यम से मेरा प्रयास है कि हम मिलकर जरूरतमंद लोगों तक सहायता पहुँचाएँ, बेटियों के सम्मान को मजबूत करें, पर्यावरण की रक्षा करें और युवाओं के लिए नए अवसरों का निर्माण करें।",
      },
    },
  },
  {
    id: "kuldeep-kumar",
    name: {
      en: "Kuldeep Kumar",
      hi: "कुलदीप कुमार",
    },
    role: {
      en: "Director",
      hi: "निदेशक",
    },
    tagline: {
      en: "Dedicated to service, cooperation and social responsibility",
      hi: "सेवा, सहयोग और सामाजिक जिम्मेदारी के प्रति समर्पित",
    },
    photo: kuldeepPhoto,
    photoPosition: "center top",
    intro: {
      en: [
        "Kuldeep Kumar is a Director of Samriddhi Help Team Foundation and has worked actively in social service and community support for approximately three years.",
        "Through his long-standing connection with families in need, he has made support for the marriages of daughters from financially vulnerable families an important part of his social work. Earlier, he was associated with social initiatives through the Ladli Behna Group, which has supported the marriages of more than 90 daughters in need.",
        "For him, this work has never been limited to providing assistance. It is a continuing effort to offer families dignity, confidence and community support.",
      ],
      hi: [
        "कुलदीप कुमार Samriddhi Help Team Foundation के Director हैं और पिछले लगभग 3 वर्षों से सामाजिक सेवा एवं सामुदायिक सहयोग के क्षेत्र में सक्रिय रूप से कार्य कर रहे हैं।",
        "जरूरतमंद परिवारों के साथ लंबे समय से जुड़े रहते हुए उन्होंने विशेष रूप से आर्थिक रूप से कमजोर परिवारों की बेटियों के विवाह में सहयोग को अपने सामाजिक कार्य का महत्वपूर्ण हिस्सा बनाया है। इससे पहले वे “लाडली बहना ग्रुप” के माध्यम से सामाजिक कार्यों से जुड़े रहे, जिसके अंतर्गत अब तक 90 से अधिक जरूरतमंद बेटियों के विवाह में सहयोग किया जा चुका है।",
        "यह कार्य उनके लिए केवल सहायता प्रदान करने तक सीमित नहीं रहा, बल्कि जरूरतमंद परिवारों को सम्मान, भरोसा और सामाजिक सहयोग देने का निरंतर प्रयास रहा है।",
      ],
    },
    highlights: [
      {
        value: { en: "90+", hi: "90+" },
        label: {
          en: "Marriages supported for daughters in need",
          hi: "बेटियों के विवाह में सहयोग",
        },
      },
      {
        value: { en: "3 years", hi: "3 वर्ष" },
        label: {
          en: "Experience in social service",
          hi: "सामाजिक सेवा का अनुभव",
        },
      },
    ],
    sections: [
      {
        title: {
          en: "Strengthening the Foundation through social experience",
          hi: "सामाजिक अनुभव से संस्था को मजबूती",
        },
        paragraphs: {
          en: [
            "His role with Samriddhi Help Team Foundation focuses on taking the Foundation's social activities to the grassroots and building direct connections with families in need.",
            "His experience helps the Foundation understand how assistance can reach genuine beneficiaries and how social programmes can be run more effectively and transparently.",
          ],
          hi: [
            "Samriddhi Help Team Foundation के साथ उनकी भूमिका संस्था की सामाजिक गतिविधियों को जमीनी स्तर तक पहुँचाने और जरूरतमंद परिवारों के साथ सीधे जुड़ने पर केंद्रित है।",
            "उनका अनुभव संस्था को यह समझने में मदद करता है कि वास्तविक जरूरतमंद परिवारों तक सहायता किस प्रकार पहुँचाई जाए और सामाजिक कार्यक्रमों को अधिक प्रभावी एवं पारदर्शी तरीके से कैसे संचालित किया जाए।",
          ],
        },
      },
      {
        title: {
          en: "Experience connected with healthcare",
          hi: "स्वास्थ्य सेवा से भी जुड़ा अनुभव",
        },
        paragraphs: {
          en: [
            "Alongside his social service, Kuldeep Kumar works as a Lab Technician and operates Sai Lab in Kuleri.",
            "His healthcare experience gives him a close understanding of medical and health-related needs. Through this experience, he supports Foundation initiatives connected with health and medical assistance for people in need.",
          ],
          hi: [
            "सामाजिक सेवा के साथ-साथ कुलदीप कुमार एक Lab Technician के रूप में भी कार्य करते हैं और Sai Lab, Kuleri का संचालन करते हैं।",
            "स्वास्थ्य क्षेत्र में उनके अनुभव के कारण वे चिकित्सा एवं स्वास्थ्य संबंधी जरूरतों को भी करीब से समझते हैं। इसी अनुभव के माध्यम से वे जरूरतमंद लोगों के लिए स्वास्थ्य एवं चिकित्सा सहायता से जुड़ी पहलों में संस्था को सहयोग प्रदान करते हैं।",
          ],
        },
      },
    ],
  },
  {
    id: "mohanlal-goswami",
    name: {
      en: "Mohanlal Goswami",
      hi: "मोहनलाल गोस्वामी",
    },
    role: {
      en: "Member",
      hi: "सदस्य",
    },
    tagline: {
      en: "An active member with a social outlook and strong grassroots connection",
      hi: "सामाजिक सोच और जमीनी जुड़ाव के साथ एक सक्रिय सदस्य",
    },
    photo: mohanlalPhoto,
    photoPosition: "center top",
    intro: {
      en: [
        "Mohanlal Goswami is an active member of Samriddhi Help Team Foundation. His positive social outlook and commitment to working directly with people make him an important part of the Foundation's community activities.",
        "He believes social change does not come from plans alone, but from meeting people, understanding their real needs and standing beside them. With this belief, he supports the Foundation's social objectives and public-welfare activities.",
      ],
      hi: [
        "मोहनलाल गोस्वामी Samriddhi Help Team Foundation के सक्रिय सदस्यों में से एक हैं। समाज के प्रति सकारात्मक सोच और लोगों के साथ जमीनी स्तर पर जुड़कर कार्य करने की भावना उन्हें संस्था की सामाजिक गतिविधियों का एक महत्वपूर्ण हिस्सा बनाती है।",
        "उनका मानना है कि सामाजिक बदलाव केवल योजनाएँ बनाने से नहीं, बल्कि लोगों के बीच जाकर उनकी वास्तविक आवश्यकताओं को समझने और उनके साथ खड़े होने से आता है। इसी सोच के साथ वे संस्था के सामाजिक उद्देश्यों और जनकल्याण से जुड़ी गतिविधियों में अपना सहयोग प्रदान करते हैं।",
      ],
    },
    sections: [
      {
        title: {
          en: "A strong connection at the grassroots",
          hi: "जमीनी स्तर पर मजबूत जुड़ाव",
        },
        paragraphs: {
          en: [
            "Mohanlal Goswami's strength is his direct connection with people locally and his perspective on social conditions. By closely understanding issues affecting families in need, young people and the wider community, he remains committed to active participation in positive social initiatives.",
            "He works to ensure that the Foundation's programmes do not remain only on paper, but deliver real benefits to the people for whom they are created.",
          ],
          hi: [
            "मोहनलाल गोस्वामी की विशेषता उनका स्थानीय स्तर पर लोगों से सीधा जुड़ाव और सामाजिक परिस्थितियों को समझने का दृष्टिकोण है। जरूरतमंद परिवारों, युवाओं और समुदाय से जुड़े विषयों को करीब से समझते हुए वे सकारात्मक सामाजिक पहलों में सक्रिय भागीदारी के लिए प्रतिबद्ध हैं।",
            "उनका प्रयास है कि संस्था द्वारा शुरू की जाने वाली योजनाएँ केवल कागजों तक सीमित न रहें, बल्कि उनका वास्तविक लाभ उन लोगों तक पहुँचे जिनके लिए वे बनाई गई हैं।",
          ],
        },
      },
      {
        title: {
          en: "Contribution to Samriddhi Help Team Foundation",
          hi: "Samriddhi Help Team Foundation में योगदान",
        },
        listIntro: {
          en: "As a member of the Foundation, he supports the following social objectives:",
          hi: "संस्था के सदस्य के रूप में वे विशेष रूप से इन सामाजिक उद्देश्यों को आगे बढ़ाने में सहयोग करते हैं:",
        },
        list: {
          en: [
            "Supporting families in need",
            "Assisting with the marriages of daughters from vulnerable families",
            "Supporting homeless people and vulnerable communities",
            "Environmental protection and tree planting",
            "Health and medical-assistance initiatives",
            "Encouraging youth and sports activities",
            "Building social awareness within the community",
          ],
          hi: [
            "जरूरतमंद परिवारों का सहयोग",
            "गरीब एवं जरूरतमंद बेटियों के विवाह में सहायता",
            "बेसहारा एवं कमजोर वर्गों के लिए सहयोग",
            "पर्यावरण संरक्षण एवं वृक्षारोपण",
            "स्वास्थ्य एवं चिकित्सा सहायता से जुड़ी पहल",
            "युवा एवं खेल गतिविधियों को प्रोत्साहन",
            "समुदाय के बीच सामाजिक जागरूकता बढ़ाना",
          ],
        },
      },
      // The unfinished attributed quote remains omitted until the complete source wording is available.
    ],
  },
]

export const foundationMission = {
  title: {
    en: "Our purpose — from assistance to self-reliance",
    hi: "हमारा उद्देश्य — सहायता से आत्मनिर्भरता तक",
  },
  paragraphs: {
    en: [
      "Established in 2025, Samriddhi Help Team Foundation is a social organisation working to bring assistance and opportunity to people and communities in need.",
      "The Foundation is developing work across key areas including:",
    ],
    hi: [
      "Samriddhi Help Team Foundation वर्ष 2025 में स्थापित एक सामाजिक संस्था है, जिसका उद्देश्य समाज के जरूरतमंद एवं वंचित वर्गों तक सहायता और अवसर पहुँचाना है।",
      "संस्था विभिन्न सामाजिक क्षेत्रों में कार्य करने की दिशा में प्रयासरत है, जिनमें प्रमुख रूप से:",
    ],
  },
  areas: [
    {
      icon: "👧",
      title: {
        en: "Marriage support for daughters in need",
        hi: "गरीब एवं जरूरतमंद बेटियों के विवाह में सहयोग",
      },
      text: {
        en: "Providing practical support, wherever possible, to financially vulnerable families during the marriage of their daughters.",
        hi: "आर्थिक रूप से कमजोर परिवारों की बेटियों के विवाह में यथासंभव सहयोग प्रदान करना और परिवारों को इस महत्वपूर्ण अवसर पर सहायता उपलब्ध कराना।",
      },
    },
    {
      icon: "🌱",
      title: {
        en: "Environment and green initiatives",
        hi: "पर्यावरण एवं हरित पहल",
      },
      text: {
        en: "Supporting tree planting, encouraging greener communities and building awareness of environmental protection.",
        hi: "वृक्षारोपण, हरियाली को बढ़ावा देने और पर्यावरण संरक्षण के प्रति समाज में जागरूकता विकसित करने के लिए पहल करना।",
      },
    },
    {
      icon: "🤝",
      title: {
        en: "Support for vulnerable people",
        hi: "बेसहारा एवं जरूरतमंद लोगों का सहयोग",
      },
      text: {
        en: "Working to bring compassionate assistance to older people, homeless individuals, families in need and vulnerable sections of society.",
        hi: "बुजुर्गों, बेसहारा व्यक्तियों, जरूरतमंद परिवारों और समाज के कमजोर वर्गों तक मानवीय सहायता पहुँचाने का प्रयास करना।",
      },
    },
    {
      icon: "🏥",
      title: {
        en: "Health and medical assistance",
        hi: "स्वास्थ्य एवं चिकित्सा सहायता",
      },
      text: {
        en: "Working toward medical assistance, health awareness and necessary support for financially vulnerable people and families in need.",
        hi: "आर्थिक रूप से कमजोर एवं जरूरतमंद लोगों के लिए चिकित्सा सहायता, स्वास्थ्य जागरूकता और आवश्यक सहयोग उपलब्ध कराने की दिशा में कार्य करना।",
      },
    },
    {
      icon: "🏆",
      title: {
        en: "Sports and youth development",
        hi: "खेल एवं युवा विकास",
      },
      text: {
        en: "Encouraging sports that give young people a positive direction and helping talented youth access opportunities to progress.",
        hi: "युवाओं को सकारात्मक दिशा देने के लिए खेल गतिविधियों को प्रोत्साहित करना तथा प्रतिभाशाली युवाओं को आगे बढ़ने के अवसर उपलब्ध कराने में सहयोग करना।",
      },
    },
  ],
}

export const foundationVision = {
  title: {
    en: "Our vision",
    hi: "हमारा विज़न",
  },
  motto: {
    en: ["Empowered society", "Dignified lives", "Prosperous future"],
    hi: ["सशक्त समाज", "सम्मानित जीवन", "समृद्ध भविष्य"],
  },
  intro: {
    en: "We want to help build a society where—",
    hi: "हम ऐसा समाज बनाने की दिशा में कार्य करना चाहते हैं जहाँ—",
  },
  points: {
    en: [
      "Families in need receive support.",
      "Daughters receive dignity and opportunity.",
      "Vulnerable people find a source of support.",
      "The environment remains safe and green.",
      "People in need can access health-related assistance.",
      "Young people receive opportunities in sports and development.",
      "Service, cooperation and humanity grow stronger across society.",
    ],
    hi: [
      "जरूरतमंद परिवारों को सहयोग मिले।",
      "बेटियों को सम्मान और अवसर मिले।",
      "बेसहारा लोगों को सहारा मिले।",
      "पर्यावरण सुरक्षित और हरा-भरा रहे।",
      "जरूरतमंद लोगों को स्वास्थ्य संबंधी सहायता मिल सके।",
      "युवाओं को खेल एवं विकास के अवसर मिलें।",
      "समाज में सेवा, सहयोग और मानवता की भावना मजबूत हो।",
    ],
  },
}
