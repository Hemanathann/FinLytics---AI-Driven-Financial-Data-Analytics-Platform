"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const VALID_CATEGORIES = [
  "salary","freelance","investments","business","rental","other-income",
  "housing","transportation","groceries","utilities","entertainment",
  "food","shopping","healthcare","education","personal","travel",
  "insurance","gifts","bills","currency-exchange","other-expense","personal-transfer",
];

// ── Global keyword map ─────────────────────────────────────────
// Covers: Ireland · UK · India · USA · Europe · Middle East
// Order matters — more specific entries first to avoid false matches
const KEYWORD_MAP = [

  // ── SALARY ──────────────────────────────────────────────────
  ["salary", [
    // Universal
    "salary","payroll","wages","direct deposit","employer","pay credit",
    "monthly pay","weekly pay","net pay","gross pay","sal credit","sal cr",
    "neft salary","salary credit","neft-salary","imps salary",
    // Ireland/UK
    "acme technologies","revenue commissioners","paye credit",
    "employer payment","weekly wages",
    // India companies
    "infosys","wipro","tcs ","hcl tech","cognizant","tech mahindra",
    "accenture","capgemini","ibm india","amazon india payroll",
    "zomato salary","swiggy payroll","hdfc salary","icici salary",
    // US
    "gusto payroll","adp payroll","paychex","workday pay","intuit payroll",
    "rippling payroll","bamboohr","justworks",
  ]],

  // ── FREELANCE ────────────────────────────────────────────────
  ["freelance", [
    "upwork","fiverr","toptal","freelance","client invoice","client payment",
    "consulting fee","contractor payment","99designs","peopleperhour",
    "freelancer.com","project payment","invoice payment","razorpay credit",
    "stripe payment","paypal transfer","wise transfer received",
    "transferwise received","payoneer","remitly received",
    "western union received","moneygram received",
  ]],

  // ── INVESTMENTS ──────────────────────────────────────────────
  ["investments", [
    "dividend","vanguard","etf ","etf distribution","etf credit","robinhood","investment return",
    "zerodha","groww","angel broking","upstox","paytm money",
    "mutual fund","sip credit","stock dividend","demat","nse dividend",
    "bse dividend","fidelity","schwab","td ameritrade","coinbase",
    "binance","crypto","bitcoin","ethereum","nft","trading profit",
    "share dividend","interest on investment","bond interest",
    "fixed deposit interest","fd interest","rd maturity",
    "recurring deposit","nsc interest","ppf credit","epf credit",
  ]],

  // ── OTHER INCOME ─────────────────────────────────────────────
  ["other-income", [
    "bonus","christmas bonus","diwali bonus","eid bonus","festival bonus",
    "tax refund","cashback","referral","reward","prize","gift received",
    "interest credit","bank interest","google adsense","amazon affiliate",
    "ebay sale","youtube monetisation","commission received",
    "rental income","subletting income","insurance claim",
    "lottery","competition prize","survey reward","sign up bonus",
  ]],

  // ── CURRENCY EXCHANGE ────────────────────────────────────────
  ["currency-exchange", [
    "currency exchange","forex","foreign exchange","currencyfair",
    "wise fee","wise transfer fee","revolut exchange","n26 exchange","fx fee",
    "currency conversion","exchange rate fee","international transfer fee",
    "swift fee","sepa fee","sepa transfer","western union fee","moneygram fee",
    "transfer fee","remittance fee","wire transfer fee","fx conversion",
    "foreign currency","currency fee","exchange commission",
    "cross border fee","international fee","abroad fee",
    "atm abroad","atm foreign","non-sterling","non-euro fee",
    "usd purchase","eur purchase","gbp purchase","inr purchase",
    "paypal currency","stripe currency conversion",
  ]],

  // ── HOUSING ──────────────────────────────────────────────────
  ["housing", [
    "rent","mortgage","landlord","property management",
    "house rent","flat rent","pg rent","paying guest","hostel rent",
    "lease payment","maintenance charge","society maintenance",
    "home loan emi","housing loan","apartment rent","aib mortgage",
    "room rent","bungalow rent","villa rent","studio rent",
    "deposit payment","security deposit","letting agent",
    "property tax","council tax","rtb rent","hap payment",
    "threshold rent","rent allowance",
  ]],

  // ── UTILITIES (WiFi, electricity, gas, water, broadband) ──────
  ["utilities", [
    // ── Ireland electricity & gas ──
    "electric ireland","bord gais","airtricity","energia","prepay power",
    "pin energy","flogas","flogas direct debit","ervia","gaslink",
    "energia direct debit","airtricity direct debit",
    // ── Ireland broadband / WiFi ──
    "eir broadband","eir fibre","eir dd","pure telecom","siro broadband",
    "sky ireland broadband","virgin media ireland","vodafone home",
    "vodafone broadband ireland","three home","clearstream",
    "digiweb","magnet networks","clearwire ireland",
    // ── Ireland water ──
    "irish water","uisce eireann","water charges ireland",
    // ── Ireland waste ──
    "panda waste","greyhound recycling","gas networks ireland",
    "city council rates","fingal county","dublin city council",
    // ── UK utilities ──
    "british gas","octopus energy","eon energy","edf energy",
    "npower","sse energy","scottish power","bulb energy","e.on",
    "bt broadband","sky broadband","virgin media broadband",
    "talktalk","plusnet","three broadband","vodafone broadband",
    "o2 broadband","shell energy broadband",
    // ── India electricity ──
    "tata power","adani electricity","bescom","msedcl","tneb",
    "bses rajdhani","bses yamuna","torrent power","jvvnl",
    "bijli bill","electricity bill","electricity recharge",
    "cesc limited","wesco","nesco","southco",
    // ── India gas & water ──
    "mahanagar gas","indraprastha gas","mgl topup","igl recharge",
    "water bill","bwssb","nmmc water","bbmp","mcgm water",
    // ── India broadband / WiFi ──
    "jio fiber","jio fibre","airtel fiber","airtel xstream",
    "act fibernet","bsnl broadband","hathway broadband",
    "excitel broadband","you broadband","tikona broadband",
    // ── US utilities ──
    "con edison","pacific gas","duke energy","xcel energy",
    "comcast xfinity","cox communications","spectrum utility","at&t utility",
    // ── Universal ──
    "electricity","gas bill","water rates","broadband bill",
    "utility bill","internet bill","sewage","refuse collection",
    "wifi bill","wi-fi charge","home internet",
  ]],

  // ── ENTERTAINMENT ────────────────────────────────────────────
  ["entertainment", [
    // Video streaming
    "netflix","disney plus","disney+","amazon prime video","hbo max",
    "hulu","peacock","paramount+","apple tv+","discovery+","crunchyroll",
    // India streaming
    "hotstar","zee5","sony liv","jio cinema","voot","alt balaji",
    "aha video","sun nxt","mubi","lionsgate play","shemaroo",
    "hoichoi","erosnow","hungama play",
    // Music
    "spotify","apple music","tidal","deezer","amazon music",
    "gaana","jiosaavn","wynk music","hungama music","saavn",
    // Gaming
    "steam","xbox game pass","playstation plus","nintendo switch online",
    "epic games","battle.net","origin","uplay","ea play","game pass",
    "google stadia","geforce now","shadow pc",
    // Cinema/Events
    "pvr cinemas","inox cinemas","cinepolis","odeon cinema",
    "vue cinema","cineworld","omniplex","lighthouse cinema",
    "imax ticket","book my show","ticketmaster","eventbrite",
    "sky sports","bt sport","dazn","setanta sports",
    // Other
    "audible","kindle unlimited","scribd","comic con","escape room",
  ]],

  // ── FOOD & DINING ────────────────────────────────────────────
  ["food", [
    // Delivery apps
    "swiggy","zomato","deliveroo","just eat","uber eats","doordash",
    "grubhub","foodpanda","dunzo food","magic pin food",
    "talabat","careem food","noon food","namshi food",
    // Fast food global
    "mcdonalds","kfc","burger king","subway","dominos pizza",
    "pizza hut","papa johns","five guys","shake shack","taco bell",
    "chipotle","popeyes","chick-fil-a","wendy","arby","dairy queen",
    "little caesars","hungry jacks",
    // Irish/UK chains
    "nandos","wagamama","honest burger","leon restaurant","pret a manger",
    "pret ","greggs","itsu","wasabi","yo sushi","zizzi","ask italian",
    "bella italia","harvester","toby carvery","wetherspoon","jd wetherspoon",
    "mcdonald","supermacs","abrakebabra","eddie rockets","bunsen burger",
    // Indian restaurant chains
    "barbeque nation","paradise biryani","haldirams","chaayos",
    "chai point","wow momo","naturals ice cream","amul parlour",
    "behrouz biryani","box8","freshmenu","oven story pizza",
    "social restaurant","the bombay canteen","indian accent",
    // Coffee chains
    "starbucks","costa coffee","cafe coffee day","ccd ","barista",
    "third wave coffee","blue tokai","dunkin","tim hortons",
    "mcdonalds coffee","nero","caffe nero","insomnia coffee",
    // Universal
    "restaurant","bistro","diner","takeaway","cafe","canteen",
    "food court","eatery","kitchen","grill","bakery","patisserie",
    "pizzeria","sushi bar","ramen","curry house","chippy","fish chips",
    "kebab","shawarma","falafel","burrito","taqueria",
    "ice cream","dessert","milkshake","smoothie bar",
  ]],

  // ── GROCERIES ────────────────────────────────────────────────
  ["groceries", [
    // Ireland
    "tesco","lidl","aldi","dunnes stores","dunnes ","supervalu",
    "spar ","centra ","eurospar","marks and spencer food",
    "marks spencer food","fresh market","ireland food","discounter",
    // UK
    "waitrose","sainsbury","asda","morrisons","iceland foods",
    "co-op food","budgens","londis","nisa local","farmfoods",
    "heron foods","jack fulton","booths supermarket",
    // India
    "bigbasket","blinkit","zepto","swiggy instamart","grofers",
    "jiomart","dmart ","d-mart","reliance fresh","reliance smart",
    "more supermarket","more daily","nature basket","star bazaar",
    "spencers retail","nilgiris","lulu hypermarket","metro cash",
    "smart bazaar","easy day","food bazaar","heritage fresh",
    "safal market","big apple","godrej nature basket",
    // Middle East (common for expats)
    "eurasia supermarket","eurasia ","carrefour","lulu mart",
    "al meera","spinneys","choithrams","union coop","emirates coop",
    "nesto hypermarket","grand hypermarket","al ain cooperative",
    // US
    "whole foods","trader joe","kroger","safeway","publix",
    "wegmans","costco","walmart grocery","target grocery",
    "instacart","fresh direct","giant food","stop shop",
    "price chopper","market basket","h-e-b","meijer",
    // Europe
    "carrefour","leclerc","intermarche","casino supermarche",
    "rewe","edeka","kaufland","netto","penny markt","billa",
    "albert heijn","jumbo supermarkt","plus supermarkt",
    "mercadona","dia supermarket","eroski",
    // Universal
    "supermarket","grocery","food market","hypermarket",
    "provisions store","convenience store","corner shop","off licence",
  ]],

  // ── TRANSPORTATION ───────────────────────────────────────────
  ["transportation", [
    // Ireland public transport & Leap Card
    "dublin bus","leap card","leap top-up","leap topup","leap top up",
    "leapcard.ie","leap card top","luas ","dart ","irish rail","iarnrod",
    "bus eireann topup","rtpi","transportforireland","tfi leap",
    "translink nireland","ulsterbus","metro bus belfast",
    "bus eireann","go bus","citylink bus","ryanair","aer lingus",
    "stobart air","emerald airlines","translink nireland",
    // UK
    "national rail","oyster card","tfl ","tube ticket","thameslink",
    "great western","avanti west","crosscountry train","easyjet",
    "british airways","jet2","tui fly","flybe","loganair",
    "national express","megabus","stagecoach",
    // India
    "ola ","rapido","meru cab","uber india","irctc","indian railways",
    "indigo airlines","indigo ","air india","spicejet","vistara",
    "goair","akasa air","starair","alliance air","truejet",
    "makemytrip flight","redbus","abhibus","paytm travel",
    "delhi metro","mumbai metro","nmmts","bmtc","best bus",
    "ksrtc","upsrtc","tsrtc","pmpml","apsrtc","gsrtc",
    "auto rickshaw","tuk tuk","ola auto","rapido auto",
    // US
    "lyft","amtrak","greyhound","megabus","flixbus",
    "delta airlines","united airlines","american airlines",
    "southwest","jetblue","spirit airlines","frontier airlines",
    // Universal
    "petrol","fuel","shell ","bp ","esso","texaco","topaz fuel",
    "applegreen","circle k fuel","parking","toll charge",
    "car park","ncp parking","q park","car rental","hertz",
    "enterprise rent","avis","europcar","budget car","sixt",
    "ferry","port","boat ticket","taxi","cab ","minicab",
    "cycle hire","lime bike","bird scooter","electric scooter",
    "uber","bolt transport","free now",
  ]],

  // ── SHOPPING ─────────────────────────────────────────────────
  ["shopping", [
    // Global e-commerce
    "amazon","flipkart","myntra","meesho","snapdeal","nykaa",
    "ajio","tata cliq","ebay","etsy","shein","temu","aliexpress",
    "wish.com","shopify store","noon shopping",
    // Ireland/UK
    "asos","zara","h and m","h&m","penneys","primark","argos",
    "harvey norman","currys pc world","next plc","tkmaxx","tk maxx",
    "river island","new look","topshop","dorothy perkins",
    "marks and spencer clothing","john lewis","boots clothing",
    "debenhams","house of fraser","selfridges","harrods",
    "brown thomas","arnotts","dunnes clothing","heatons",
    "ikea ","homebase","b&q","woodies diy","atlantic homecare",
    // India
    "reliance digital","croma ","vijay sales","decathlon india",
    "fabindia","lifestyle stores","shoppers stop","central mall",
    "westside","big bazaar","pantaloons","biba ","w store",
    "global desi","max fashion","v-mart","v mart","trends",
    "levi india","nike india","adidas india","puma india",
    "reebok india","woodland","bata india","liberty shoes",
    // US
    "walmart","target ","best buy","home depot","macys","nordstrom",
    "gap ","banana republic","old navy","bath body works",
    "victoria secret","ulta beauty","sephora","ross dress",
    "tj maxx","marshall","burlington coat","dollar tree",
    // Europe
    "zara","h&m","mango","pull and bear","bershka","stradivarius",
    "c and a","reserved","sinsay","primark europe",
    // Middle East
    "mall of emirates","dubai mall","ibn battuta","city centre mall",
    // Universal
    "online shopping","shopping mall","department store",
    "clothing store","boutique","fashion store","outlet store",
  ]],

  // ── HEALTHCARE ───────────────────────────────────────────────
  ["healthcare", [
    // Ireland/UK
    "flyefit","total fitness","david lloyd","virgin active",
    "gp visit","gp fee","a&e fee","nhs prescription","boots pharmacy",
    "lloyds pharmacy","well pharmacy","rowlands pharmacy",
    "specsavers","vision express","optical express",
    "denplan","mydentist","bupa dental","smiles dental",
    "physio ireland","beacon hospital","mater hospital",
    "st vincents hospital","tallaght hospital","beaumont hospital",
    // India
    "apollo pharmacy","medplus","1mg","netmeds","pharmeasy",
    "practo","lybrate","apollo hospital","fortis hospital",
    "max hospital","manipal hospital","aster pharmacy",
    "columbia asia","narayana health","kims hospital",
    "care hospital","yashoda hospital","sunshine hospital",
    "cult fit","curefit","gold gym","anytime fitness",
    "talwalkars","fitness first","snap fitness","o2 gym",
    "minimed","healthspring","mfine","nib health",
    // US
    "cvs pharmacy","walgreens","rite aid","urgent care",
    "planet fitness","la fitness","equinox gym","24 hour fitness",
    "crunch fitness","orange theory","f45 training",
    "aetna","cigna","humana health","blue cross","united health",
    // Universal
    "pharmacy","hospital","clinic","doctor","medical centre",
    "dental","dentist","optician","physio","physiotherapy",
    "medical ","health centre","gp ","eye test","hearing aid",
    "gym membership","gym ","wellness","yoga class","pilates",
    "mental health","counselling","therapy",
  ]],

  // ── INSURANCE ────────────────────────────────────────────────
  ["insurance", [
    // Ireland/UK
    "aviva","axa","allianz","zurich","insurance","assurance",
    "fbd insurance","rsa insurance","liberty insurance",
    "laya healthcare","irish life","new ireland","zurich life",
    "vhi healthcare","vhi ","laya ","glohealth",
    "admiral insurance","direct line","churchill","esure",
    "hastings direct","comparethemarket insurance",
    // India
    "lic ","hdfc life","icici prudential","sbi life","bajaj allianz",
    "max life","tata aia","star health","niva bupa","care health",
    "reliance general","new india assurance","oriental insurance",
    "national insurance","united india insurance","digit insurance",
    "go digit","acko insurance","navi insurance","policybazaar",
    // US
    "state farm","allstate","geico","progressive insurance",
    "liberty mutual","farmers insurance","nationwide insurance",
    "travelers insurance","usaa","metlife",
    // Universal
    "protection plan","insurance premium","life cover",
    "travel insurance","car insurance","home insurance",
    "health insurance premium","policy premium",
  ]],

  // ── EDUCATION ────────────────────────────────────────────────
  ["education", [
    // Online learning
    "udemy","coursera","linkedin learning","skillshare","pluralsight",
    "codecademy","edx","masterclass","duolingo","domestika",
    "khan academy","brilliant.org","datacamp","treehouse",
    "udacity","futurelearn","openlearn",
    // India
    "byjus","byju","unacademy","vedantu","toppr","meritnation",
    "extramarks","testbook","gradeup","physicswallah",
    "whitehat jr","cuemath","simplilearn","upgrad","great learning",
    // Universal
    "college fee","university fee","school fee","tuition fee",
    "ucd ","dcu ","tcd ","dit ","nui galway","ul limerick",
    "books and stationery","exam fee","course fee",
    "language school","driving lesson",
  ]],

  // ── PERSONAL CARE ────────────────────────────────────────────
  ["personal", [
    "haircut","barber","salon","skincare","beauty","grooming",
    "spa ","nail treatment","massage","blow dry","waxing",
    "peter mark","toni and guy","toni guy","supercuts","great clips",
    "lakme salon","vlcc","naturals salon","jawed habib",
    "enrich salon","lakmesalon","habib","trends salon",
    "lenskart","specsbazaar","eyeglasses","contact lens",
    "tattoo","piercing","manicure","pedicure","facial",
  ]],

  // ── TRAVEL ───────────────────────────────────────────────────
  ["travel", [
    "airbnb","hotels.com","booking.com","hostel","resort",
    "trivago","expedia","tripadvisor","agoda","hotels combined",
    "makemytrip hotel","cleartrip hotel","goibibo hotel",
    "yatra hotel","oyo rooms","oyo hotel","fabhotels",
    "treebo","zostel","gostops","zostel hostel",
    "holiday inn","marriott","hilton","hyatt","ihg hotel",
    "taj hotels","oberoi","leela hotel","itc hotels","radisson",
    "novotel","ibis hotel","premier inn","travelodge",
    "thomas cook","cox kings","holiday package",
    "travel insurance","visa fee","passport fee",
    "sightseeing","tour package","excursion",
  ]],

  // ── BILLS — Mobile, TV, phone, banking fees ──────────────────
  ["bills", [
    // ── Ireland mobile ──
    "vodafone ireland","vodafone bill","three ireland","eir mobile",
    "tesco mobile ireland","48 topup","48 mobile","virgin mobile ireland",
    "sky mobile ireland","meteor mobile","o2 ireland",
    "three ireland top-up","three topup","eir topup","vodafone topup",
    "lyca ireland","lebara ireland",
    // ── UK mobile ──
    "giffgaff","lebara uk","lyca mobile uk","sky mobile","o2 mobile",
    "ee mobile","bt mobile","virgin mobile","talktalk mobile",
    "three uk","vodafone uk","smarty mobile",
    // ── India mobile recharge ──
    "jio recharge","jio prepaid","jio topup","reliance jio",
    "airtel recharge","airtel prepaid","airtel topup","airtel mobile",
    "vi recharge","vi topup","vodafone india","idea recharge",
    "bsnl recharge","bsnl prepaid","mtnl recharge",
    "paytm recharge","phonepe recharge","google pay recharge",
    "freecharge","mobikwik recharge","amazon recharge",
    // ── US mobile ──
    "t-mobile bill","at&t bill","verizon bill","sprint bill",
    "boost mobile","cricket wireless","metro by t-mobile",
    "consumer cellular","mint mobile","visible wireless",
    // ── Banking & card fees ──
    "bank service charge","bank fee","bank service fee",
    "annual card fee","maintenance fee","account fee",
    "overdraft fee","atm fee","foreign transaction fee",
    "hdfc bank service charge","icici bank charges",
    "sbi bank charges","axis bank fee","kotak bank fee",
    "aib annual fee","bank of ireland fee","revolut fee",
    // ── TV licence / cable ──
    "tv licence","television licence","bbc licence",
    "sky tv","sky sports","sky cinema","virgin media tv",
    "now tv","dstv","tata sky","dish tv","d2h recharge",
    // ── Recurring & membership ──
    "annual fee","subscription renewal","membership fee",
    "credit card fee","loan processing fee","gym membership",
    // ── Waste ──
    "panda waste","greyhound bin","city council rates","bin charge",
    // Banking fees
    "bank service charge","bank fee","bank service fee",
    "annual card fee","maintenance fee","account fee",
    "overdraft fee","atm fee","foreign transaction fee",
    "hdfc bank service charge","icici bank charges",
    "sbi bank charges","axis bank fee",
    // Subscriptions/recurring
    "annual fee","subscription renewal","membership fee",
    "credit card fee","loan processing fee",
    // Waste/Council
    "panda waste","greyhound bin","city council rates",
    // TV licence
    "tv licence","television licence","bbc licence",
  ]],

  // ── GIFTS & DONATIONS ────────────────────────────────────────
  ["gifts", [
    "gift card","amazon gift","itunes gift","google play gift",
    "charity donation","red cross","unicef","oxfam","goal ireland",
    "trocaire","svp donation","st vincent de paul",
    "temple donation","church donation","mosque donation",
    "crowdfunding","gofundme","kickstarter","indiegogo",
    "birthday gift","wedding gift","flowers","bouquet",
    "interflora","bloom flowers","euroflorist",
  ]],

  // ── RENTAL INCOME ────────────────────────────────────────────
  ["rental", [
    "rental income","rent received","subletting income",
    "airbnb payout","vrbo payout","property rental credit",
    "tenant payment","lodger payment",
  ]],

  // ── BUSINESS INCOME ──────────────────────────────────────────
  ["business", [
    "business income","sales revenue","invoice paid","gst credit",
    "vat refund","business account credit","merchant settlement",
    "pos settlement","card machine settlement","stripe payout",
    "square payout","sumup payout","worldpay settlement",
  ]],

];

// Short keywords that cause false positives without word boundary check
const BOUNDARY_REQUIRED = new Set([
  "bp","ola","tcs","etf","sbi","hdfc","icici","axis","shell",
  "rent","visa","gift","tap","pay","tip","gas","oil","ace",
  "club","sun","sky","bus","car","fly","gym","spa","bar",
]);

function wordBoundary(str, kw) {
  if (!BOUNDARY_REQUIRED.has(kw.trim())) return str.includes(kw);
  const re = new RegExp(`(?:^|[\\s,;/|#(\\-])${kw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?:[\\s,;/|#)\\-]|$)`, "i");
  return re.test(str);
}

function guessCategory(desc, type) {
  const lower = desc.toLowerCase();
  // Two-pass: multi-word phrases first (higher precision), then single keywords
  for (const [cat, keywords] of KEYWORD_MAP) {
    if (keywords.filter(kw => kw.includes(" ")).some(kw => lower.includes(kw))) return cat;
  }
  for (const [cat, keywords] of KEYWORD_MAP) {
    if (keywords.filter(kw => !kw.includes(" ")).some(kw => wordBoundary(lower, kw))) return cat;
  }
  return type === "INCOME" ? "other-income" : "other-expense";
}

// ── Merchant name normalisation ────────────────────────────────
// Maps noisy bank descriptions → clean display names
const MERCHANT_MAP = [
  // Streaming
  [/netflix/i,        "Netflix",          "entertainment"],
  [/spotify/i,        "Spotify",          "entertainment"],
  [/disney[+\s*plus]/i,"Disney+",          "entertainment"],
  [/hotstar/i,        "Disney+ Hotstar",  "entertainment"],
  [/amazon\s*prime/i, "Amazon Prime",     "entertainment"],
  [/youtube\s*premium/i,"YouTube Premium",  "entertainment"],
  [/apple\s*music/i,  "Apple Music",      "entertainment"],
  [/apple\s*icloud/i, "Apple iCloud",     "bills"],
  [/apple\s*tv/i,     "Apple TV+",        "entertainment"],
  [/hbo\s*max/i,      "HBO Max",          "entertainment"],
  [/crunchyroll/i,    "Crunchyroll",      "entertainment"],
  [/sony\s*liv/i,     "Sony LIV",         "entertainment"],
  [/zee\s*5/i,        "ZEE5",             "entertainment"],
  [/jio\s*cinema/i,   "JioCinema",        "entertainment"],
  [/sun\s*nxt/i,      "Sun NXT",          "entertainment"],
  [/dazn/i,           "DAZN",             "entertainment"],
  // Food delivery
  [/uber\s*eat/i,     "Uber Eats",        "food"],
  [/deliveroo/i,      "Deliveroo",        "food"],
  [/just\s*eat/i,     "Just Eat",         "food"],
  [/doordash/i,       "DoorDash",         "food"],
  [/zomato/i,         "Zomato",           "food"],
  [/swiggy/i,         "Swiggy",           "food"],
  [/dunzo/i,          "Dunzo",            "food"],
  // Groceries Ireland
  [/tesco/i,          "Tesco",            "groceries"],
  [/dunnes\s*store/i, "Dunnes Stores",    "groceries"],
  [/aldi/i,           "Aldi",             "groceries"],
  [/lidl/i,           "Lidl",             "groceries"],
  [/supervalu/i,      "SuperValu",        "groceries"],
  [/centra/i,         "Centra",           "groceries"],
  [/spar/i,           "Spar",             "groceries"],
  [/marks\s*(&|and)\s*spencer/i,"M&S",              "groceries"],
  // Cafes / fast food
  [/starbucks/i,      "Starbucks",        "food"],
  [/costa\s*coffee/i, "Costa Coffee",     "food"],
  [/mcdonalds|mcdonald/i,"McDonald's",       "food"],
  [/subway/i,         "Subway",           "food"],
  [/kfc/i,            "KFC",              "food"],
  [/burger\s*king/i,  "Burger King",      "food"],
  [/dominos|domino/i, "Domino's",         "food"],
  [/papa\s*john/i,    "Papa John's",      "food"],
  [/five\s*guys/i,    "Five Guys",        "food"],
  [/nandos|nando/i,   "Nando's",          "food"],
  // Transport Ireland
  [/leap\s*card|leapcard/i,"Leap Card",        "transportation"],
  [/dublin\s*bus/i,   "Dublin Bus",       "transportation"],
  [/luas/i,           "Luas",             "transportation"],
  [/iarnrod|irish\s*rail/i,"Irish Rail",       "transportation"],
  [/bus\s*eireann/i,  "Bus Éireann",      "transportation"],
  [/uber/i,           "Uber",             "transportation"],
  [/bolt\s*(?!energy)/i,"Bolt",             "transportation"],
  [/free\s*now/i,     "Free Now",         "transportation"],
  [/ryanair/i,        "Ryanair",          "transportation"],
  [/aer\s*lingus/i,   "Aer Lingus",       "transportation"],
  // Utilities Ireland
  [/electric\s*ireland/i,"Electric Ireland",  "utilities"],
  [/bord\s*gais/i,    "Bord Gáis",        "utilities"],
  [/airtricity/i,     "Airtricity",       "utilities"],
  [/irish\s*water|uisce\s*eireann/i,"Irish Water",      "utilities"],
  [/eir\s*(?:broadband|fibre)?/i,"Eir",              "utilities"],
  [/virgin\s*media/i, "Virgin Media",     "utilities"],
  [/sky\s*ireland/i,  "Sky Ireland",      "utilities"],
  // India utilities
  [/jio\s*fiber|jio\s*fibre/i,"JioFiber",         "utilities"],
  [/airtel\s*(?:fiber|xstream)/i,"Airtel Fiber",     "utilities"],
  [/tata\s*power/i,   "Tata Power",       "utilities"],
  [/adani\s*electricity/i,"Adani Electricity","utilities"],
  // Shopping
  [/amazon(?!\s*prime|\s*music|\s*pay)/i,"Amazon",           "shopping"],
  [/flipkart/i,       "Flipkart",         "shopping"],
  [/myntra/i,         "Myntra",           "shopping"],
  [/asos/i,           "ASOS",             "shopping"],
  [/zara/i,           "Zara",             "shopping"],
  [/h\s*&\s*m|h\s*and\s*m/i,"H&M",              "shopping"],
  [/penneys|primark/i,"Penneys / Primark","shopping"],
  [/ikea/i,           "IKEA",             "shopping"],
  // SaaS / tools
  [/notion/i,         "Notion",           "bills"],
  [/figma/i,          "Figma",            "bills"],
  [/github/i,         "GitHub",           "bills"],
  [/dropbox/i,        "Dropbox",          "bills"],
  [/adobe/i,          "Adobe CC",         "bills"],
  [/canva/i,          "Canva",            "bills"],
  [/slack/i,          "Slack",            "bills"],
  [/zoom/i,           "Zoom",             "bills"],
  [/microsoft\s*365/i,"Microsoft 365",   "bills"],
  [/google\s*one/i,   "Google One",       "bills"],
  // Banking & fintech
  [/revolut/i,        "Revolut",          "bills"],
  [/wise|transferwise/i,"Wise",             "currency-exchange"],
  [/n26/i,             "N26",              "bills"],
  [/paypal/i,         "PayPal",           "bills"],
  [/stripe/i,         "Stripe",           "bills"],
  // ── Irish / Indian restaurants ──────────────────────────
  [/spice\s*village/i,        "Spice Village",        "food"],
  [/poolside\s*caf/i,         "Poolside Cafe",        "food"],
  [/pi\s*res?t/i,             "Pi Restaurant",        "food"],
  [/sheela\s*palace/i,        "Sheela Palace",        "food"],
  [/abrakebabra/i,             "Abrakebabra",          "food"],
  [/eddie\s*rocket/i,         "Eddie Rocket's",       "food"],
  [/chopped/i,                 "Chopped",              "food"],
  [/saba\s*restaurant/i,      "Saba",                 "food"],
  [/wagamama/i,                "Wagamama",             "food"],
  [/itsa\s*bagel/i,           "Itsabagel",            "food"],
  [/sprout/i,                  "Sprout",               "food"],
  [/the\s*barge/i,            "The Barge",            "food"],
  [/camden\s*kitchen/i,       "Camden Kitchen",       "food"],
  [/dollard/i,                 "Dollard",              "food"],
  [/avoca/i,                   "Avoca",                "food"],
  [/bewley/i,                  "Bewley's",             "food"],
  [/insomnia/i,                "Insomnia Coffee",      "food"],
  [/supermac/i,                "Supermac's",           "food"],
  [/mcdonalds|mcdonald/i,      "McDonald's",           "food"],
  [/bunsen/i,                  "Bunsen",               "food"],
  [/paulie'?s\s*pizza/i,     "Paulie's Pizza",       "food"],
  [/burritos?\s*and/i,        "Burrito Bar",          "food"],
  [/freshii/i,                 "Freshii",              "food"],
  [/leon/i,                    "Leon",                 "food"],
  [/pret/i,                    "Pret A Manger",        "food"],
  [/grafton\s*barber/i,       "The Grafton Barber",   "personal"],
  [/mobile\s*expert/i,        "Mobile Expert",        "shopping"],
  [/tfi\s*leap|transport\s*for\s*ireland/i, "TFI / Leap Card", "transportation"],
  [/flyefit/i,                 "FLYEfit",              "healthcare"],
  [/anthropic/i,               "Anthropic (Claude)",   "bills"],
  [/lyca\s*mobile/i,          "LycaMobile",           "bills"],
  [/jupiter\s*ventures/i,     "Jupiter Ventures",     "bills"],
  [/taptap/i,                  "Taptap Send",          "currency-exchange"],
  [/eurasia\s*supermarket/i,  "Eurasia Supermarkets", "groceries"],
  [/londis/i,                  "Londis",               "groceries"],
  // AIB / Irish bank common merchants
  [/property\s*management/i,  "Property Management",  "housing"],
  [/rtb\s*registration/i,     "RTB",                  "housing"],
  [/daft\s*ireland/i,         "Daft.ie",              "housing"],
  [/myhome\s*ireland/i,       "MyHome.ie",            "housing"],
  [/boots\s*ireland/i,        "Boots",                "healthcare"],
  [/lloyds\s*pharm/i,         "Lloyds Pharmacy",      "healthcare"],
  [/energy\s*ireland/i,       "Electric Ireland",     "utilities"],
  [/an\s*post/i,              "An Post",              "bills"],
  [/penneys/i,                 "Penneys",              "shopping"],
  [/woodies/i,                 "Woodies",              "shopping"],
  [/harvey\s*norman/i,        "Harvey Norman",        "shopping"],
  [/currys/i,                  "Currys",               "shopping"],
  [/insomnia/i,                "Insomnia Coffee",      "food"],
  [/pret\s*a\s*manger/i,     "Pret A Manger",        "food"],
  [/greggs/i,                  "Greggs",               "food"],
  [/supermacs/i,               "Supermacs",            "food"],
  [/eddie\s*rockets/i,        "Eddie Rocket's",       "food"],
  [/bunsen/i,                  "Bunsen",               "food"],
  [/avoca/i,                   "Avoca",                "food"],
  [/blank\s*panther|bord\s*bia/i,"Bord Bia",         "food"],
  [/flyefit/i,                 "FLYEfit",              "healthcare"],
  [/total\s*fitness/i,        "Total Fitness",        "healthcare"],
  [/laya/i,                    "Laya Healthcare",      "insurance"],
  [/vhi/i,                     "VHI",                  "insurance"],
  [/irish\s*life/i,           "Irish Life",           "insurance"],
  [/aib\s*(?:mortgage|loan)/i,"AIB Mortgage",         "housing"],
  [/bank\s*of\s*ireland/i,   "Bank of Ireland",      "bills"],
  [/permanent\s*tsb/i,        "Permanent TSB",        "bills"],
  [/credit\s*union/i,         "Credit Union",         "bills"],
  [/ireland\s*revenue/i,      "Revenue Commissioners","bills"],
  [/revenue\s*commissioners/i,"Revenue Commissioners","bills"],
  [/customs\s*ireland/i,      "Revenue",              "bills"],
  // Fuel Ireland
  [/topaz/i,          "Topaz"],
  [/applegreen/i,     "Applegreen"],
  [/circle\s*k/i,     "Circle K"],
  [/esso/i,           "Esso"],
  [/shell/i,          "Shell"],
  [/bp/i,           "BP"],
];

// Strip bank transaction noise from raw descriptions
// e.g. "VIS 24MAR NETFLIX*COM/IE 4521 DUBLIN" → "NETFLIX*COM/IE"
// then merchant map → "Netflix"
function cleanDescription(raw) {
  let s = raw;

  // Remove common Irish/UK bank prefixes
  s = s.replace(/^(VIS|S\/O|DD|ATM|BGC|CHQ|TFR|BACS|SO|FPO|IFT|POS|CRD|DPC|STO)\s+/i, "");

  // Remove date fragments e.g. "24MAR", "24-MAR", "24/03/25"
  s = s.replace(/\d{1,2}[\s\-\/]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/gi, "");
  s = s.replace(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/g, "");

  // Remove card number fragments (4 digit blocks) — but not years (2020-2030)
  s = s.replace(/(?<![\d])(?!20[12]\d)\d{4}(?![\d])/g, "");

  // Remove phone numbers and country codes
  s = s.replace(/(00353|0044|001|\+353|\+44|\+1)\s*[\d\s]{6,}/g, "");

  // Remove pure reference number sequences (6+ digits)
  s = s.replace(/\d{6,}/g, "");

  // Remove trailing/leading punctuation and extra spaces
  s = s.replace(/[*\/\|_]+/g, " ").replace(/\s{2,}/g, " ").trim();

  // Try merchant map for a clean display name
  for (const [pattern, name] of MERCHANT_MAP) {
    if (pattern.test(s)) return name;
  }

  // Capitalise words for cleaner display
  return s.split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .slice(0, 60);
}

// ── Confidence scoring ─────────────────────────────────────────
// Returns {category, confidence, cleanName}
function categorise(desc, type) {
  const lower = desc.toLowerCase();
  const clean = cleanDescription(desc);

  // ── Pass 0: Pattern-based matching (highest precision) ──────────────────

  // ── Income patterns ──────────────────────────────────────────────────
  // Card refund / cashback = shopping income
  if (type === "INCOME" && /refund|cashback|chargeback|return|credit\s*back/i.test(desc)) {
    return { category: "other-income", confidence: "high", cleanName: `Refund: ${clean}` };
  }
  // Apple Pay top-up = loading money from your debit/credit card into Revolut
  if (/apple\s*pay\s*top-?up/i.test(desc)) {
    return { category: "other-income", confidence: "high", cleanName: "Apple Pay Top-up" };
  }
  // Revolut currency exchange
  if (/exchanged\s+to\s+eur|exchanged\s+to\s+gbp|exchanged\s+to\s+usd|exchanged\s+from/i.test(desc)) {
    return { category: "currency-exchange", confidence: "high", cleanName: "Revolut Exchange" };
  }

  // ── Expense: Bills & Subscriptions ───────────────────────────────────
  if (/card\s*delivery\s*fee/i.test(desc)) {
    return { category: "bills", confidence: "high", cleanName: "Card Delivery Fee" };
  }
  if (/lyca\s*mobile/i.test(desc)) {
    return { category: "bills", confidence: "high", cleanName: "LycaMobile" };
  }
  if (/anthropic/i.test(desc)) {
    return { category: "bills", confidence: "high", cleanName: "Anthropic (Claude)" };
  }
  if (/jupiter\s*ventures/i.test(desc)) {
    return { category: "bills", confidence: "high", cleanName: "Jupiter Ventures (Rent)" };
  }

  // ── Currency exchange / international transfers ───────────────────────
  if (/taptap\s*send/i.test(desc)) {
    return { category: "currency-exchange", confidence: "high", cleanName: "Taptap Send" };
  }
  if (/western\s*union|moneygram|wise|remit|xoom|paysend|azimo/i.test(desc)) {
    return { category: "currency-exchange", confidence: "high", cleanName: clean };
  }

  // ── Expense: ATM / cash withdrawal ───────────────────────────────────
  if (/cash\s*withdrawal|atm\s*withdrawal/i.test(desc)) {
    return { category: "other-expense", confidence: "high", cleanName: "Cash Withdrawal" };
  }

  // ── Personal transfers TO/FROM named people ─────────────────────────────
  // Pattern: "Transfer to FIRSTNAME SURNAME" or "To Firstname Surname Surname"
  // ── Personal transfers TO/FROM named people ─────────────────
  // "Transfer to FIRSTNAME SURNAME" → personal-transfer (sent)
  if (/^transfer\s+to\s+([A-Z][A-Za-z]+\s+){1,}/i.test(desc)) {
    const personName = desc.replace(/^transfer\s+to\s+/i, "").trim()
      .split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    return { category: "personal-transfer", confidence: "high", cleanName: `Sent to ${personName}` };
  }
  if (/^to\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i.test(desc) && type === "EXPENSE") {
    const personName = desc.replace(/^to\s+/i, "").trim()
      .split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    return { category: "personal-transfer", confidence: "high", cleanName: `Sent to ${personName}` };
  }
  // "Transfer from FIRSTNAME SURNAME" → personal-transfer (received)
  if (/^transfer\s+from\s+([A-Z][A-Za-z]+\s+){1,}/i.test(desc)) {
    const personName = desc.replace(/^transfer\s+from\s+/i, "").trim()
      .split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    return { category: "personal-transfer", confidence: "high", cleanName: `Received from ${personName}` };
  }
  if (/^payment\s+from\s+/i.test(desc)) {
    const personName = desc.replace(/^payment\s+from\s+/i, "").trim()
      .split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    return { category: "personal-transfer", confidence: "high", cleanName: `Received from ${personName}` };
  }

  // ── Expense: Restaurants (Irish/Indian specific) ──────────────────────
  const RESTAURANT_RE = /spice\s*village|poolside\s*cafe|pi\s*res?t?au?rant|sheela\s*palace|mani\s*rest|indian\s*cuisine|kebab\s*house|chinese\s*rest|thai\s*rest|sushi\s*rest|ramen\s*bar|curry\s*house|biryani|tandoori|dal\s*makhani|butter\s*chicken|masala\s*zone|namaste\s*india|little\s*india|india\s*garden|punjab\s*rest|dosa\s*place|south\s*indian|north\s*indian|zaytoon|abrakebabra|fish\s*chips|chopsticks|china\s*express|imperial\s*chinese|the\s*winding\s*stair|the\s*porterhouse|rotisserie|baguette|sandwich\s*bar|mcdonald|burger.*king|kfc|five\s*guys|shake.*shack|nandos|wagamama|itsu|yo.*sushi|zizzi|insomnia\s*cof|costa\s*cof|starbucks|caffe\s*nero/i;
  if (RESTAURANT_RE.test(desc)) {
    return { category: "food", confidence: "high", cleanName: clean };
  }

  // Pass 1: Exact merchant map match = high confidence
  // MERCHANT_MAP entries carry their own category as 3rd element (fixes Topaz→transportation etc.)
  for (const [pattern, name, merchantCat] of MERCHANT_MAP) {
    if (pattern.test(desc)) {
      // Use merchant category if provided, else fall back to keyword scan
      const cat = merchantCat || guessCategory(desc, type);
      // Validate category is in VALID_CATEGORIES list
      const validCat = VALID_CATEGORIES.includes(cat) ? cat
        : (type === "INCOME" ? "other-income" : "other-expense");
      return { category: validCat, confidence: "high", cleanName: name };
    }
  }

  // Pass 2: Multi-word keyword match = medium confidence
  for (const [cat, keywords] of KEYWORD_MAP) {
    const matched = keywords.find(kw => kw.includes(" ") && lower.includes(kw));
    if (matched) return { category: cat, confidence: "medium", cleanName: clean };
  }

  // Pass 3: Single-word with word-boundary = low confidence
  for (const [cat, keywords] of KEYWORD_MAP) {
    const matched = keywords.find(kw => !kw.includes(" ") && wordBoundary(lower, kw));
    if (matched) return { category: cat, confidence: "low", cleanName: clean };
  }

  // Fallback — everything gets a category, nothing returns undefined
  return {
    category: type === "INCOME" ? "other-income" : "other-expense",
    confidence: "low",
    cleanName: clean || desc.slice(0, 40) || "Unknown",
  };
}

function detectDelimiter(firstLine) {
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs   = (firstLine.match(/\t/g) || []).length;
  const semis  = (firstLine.match(/;/g) || []).length;
  if (tabs > commas && tabs > semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

function parseRow(line, delimiter = ",") {
  const cols = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === delimiter && !inQ) { cols.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

function parseDate(str, preferUS = false) {
  if (!str) return new Date("invalid");
  const s = str.trim();

  // ISO: 2025-04-11
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);

  // DD-Mon-YYYY or DD/Mon/YYYY: 11-Apr-2025
  if (/^\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{4}/.test(s)) {
    return new Date(s.replace(/[-\/]/g," "));
  }

  // Mon DD, YYYY: Apr 11, 2025
  if (/^[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}/.test(s)) return new Date(s);

  // DD Mon YYYY: 11 Apr 2025 (SBI, some Indian/UK banks)
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(s)) return new Date(s);

  // DD.MM.YYYY: 11.04.2025 (European format)
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) {
    const [d, m, y] = s.split(".");
    return new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`);
  }

  // DD/MM/YYYY or MM/DD/YYYY — ambiguous
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, y] = parts;
    const aNum = parseInt(a, 10), bNum = parseInt(b, 10);
    const yearStr = y.length === 2 ? `20${y}` : y;
    // If first part > 12, must be day (DD/MM/YYYY)
    if (aNum > 12) return new Date(`${yearStr}-${b.padStart(2,"0")}-${a.padStart(2,"0")}`);
    // If second part > 12, must be day (MM/DD/YYYY)
    if (bNum > 12) return new Date(`${yearStr}-${a.padStart(2,"0")}-${b.padStart(2,"0")}`);
    // Otherwise use preference (EU/India default = DD/MM)
    if (preferUS) return new Date(`${yearStr}-${a.padStart(2,"0")}-${b.padStart(2,"0")}`);
    return new Date(`${yearStr}-${b.padStart(2,"0")}-${a.padStart(2,"0")}`);
  }

  // Natural language fallback
  return new Date(s);
}

function parseCSV(text) {
  const lines = text
    .split("\n")
    .map((l) =>
      l.replace(/\r/g, "")
       .replace(/[\u2013\u2014\u2012\u2015]/g, "-")
       .replace(/[^\x00-\x7F]/g, " ")
       .trim()
    )
    .filter((l) => l.length > 0);

  // Find header row — scan up to first 15 lines for flexibility (HDFC has preamble rows)
  // Auto-detect delimiter from first non-empty line
  const delimiter = detectDelimiter(lines[0] || "");

  const hi = lines.findIndex((l, idx) => {
    if (idx > 20) return false;
    const hasDate   = /\bdate\b|posting date|txn date|value date|trans date|started date|completed date/i.test(l);
    const hasDesc   = /desc|detail|narr|particular|remark|reference|transaction details|tran desc/i.test(l);
    const hasAmount = /\bamount\b|\bcredit\b|\bdebit\b|withdrawal|deposit/i.test(l);
    // Revolut: Type,Product,Started Date,Completed Date,Description,Amount,...
    const isRevolutHeader = /type.*product.*date.*description.*amount/i.test(l);
    return isRevolutHeader || (hasDate && (hasDesc || hasAmount));
  });
  if (hi === -1) throw new Error(`No header row found. Expected Date + Description/Amount columns. First line: "${(lines[0]||"").slice(0,80)}"`);

  const hdrs = parseRow(lines[hi], delimiter).map((h) =>
    h.toLowerCase().replace(/[()€$₹£]/g, "").trim()
  );
  // Detect all description columns (AIB splits across description1/2/3)
  const descCols = hdrs.reduce((acc, h, i) => {
    if (/desc|detail|narr|particular|remark|reference|transaction details|tran desc/i.test(h)) acc.push(i);
    return acc;
  }, []);

  // ── Detect if this is a Revolut CSV ──────────────────────────
  // Revolut format: Type, Product, Started Date, Completed Date, Description, Amount, Fee, Currency, State, Balance
  const isRevolut = hdrs.includes("product") && hdrs.includes("state") && hdrs.includes("fee");

  const c = {
    date:    hdrs.findIndex((h) => {
      if (isRevolut) return h === "completed date"; // Revolut: use completed date
      return /\bdate\b|posting date|txn date|value date|trans date|started date/i.test(h);
    }),
    desc:    descCols[0] ?? -1,
    desc2:   descCols[1] ?? -1,
    desc3:   descCols[2] ?? -1,
    debit:   hdrs.findIndex((h) => /\bdebit\b|withdrawal|\bdr\b/.test(h)),
    credit:  hdrs.findIndex((h) => /\bcredit\b|deposit|\bcr\b/.test(h)),
    type:    hdrs.findIndex((h) => h === "type" || h === "dr/cr" || h === "cr/dr" || h === "tran type"),
    amount:  hdrs.findIndex((h) => /^amount$|^value$|^txn amount$|^transaction amount$/.test(h)),
    balance: hdrs.findIndex((h) => /^balance$|^running balance$/.test(h)),
    // Revolut-specific columns
    product: isRevolut ? hdrs.findIndex((h) => h === "product") : -1,
    state:   isRevolut ? hdrs.findIndex((h) => h === "state")   : -1,
    fee:     isRevolut ? hdrs.findIndex((h) => h === "fee")     : -1,
  };

  if (c.date === -1 || c.desc === -1)
    throw new Error(`Missing columns. Found: [${hdrs.join(", ")}]. Need: Date, Description`);

  const txns = [];

  for (let i = hi + 1; i < lines.length; i++) {
    const cols = parseRow(lines[i], delimiter);
    const dateStr = (cols[c.date] || "").trim();

    // Concatenate AIB-style split description columns (Description1 + Description2 + Description3)
    const descParts = [
      (cols[c.desc]  || "").trim(),
      c.desc2 >= 0 ? (cols[c.desc2] || "").trim() : "",
      c.desc3 >= 0 ? (cols[c.desc3] || "").trim() : "",
    ].filter(Boolean);
    const desc = descParts.join(" ").replace(/\s+/g, " ").trim();

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}|^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|^\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(dateStr)) continue;
    // Skip balance/summary rows regardless of which column they appear in
    const fullRow = cols.join(" ").toLowerCase();
    if (!desc || /^(opening|closing|balance|total|statement|brought|b\/f|c\/f)/i.test(desc)) continue;
    if (/closing balance|opening balance|brought forward|carried forward|total debit|total credit/i.test(fullRow)) continue;

    function parseAmount(raw) {
      if (!raw) return 0;
      let s = raw.replace(/[$€₹£]/g, "").trim();
      // Handle parentheses for negatives: (1234.56) → -1234.56
      if (/^\(.*\)$/.test(s)) s = "-" + s.slice(1, -1);
      // Detect European format: 1.234,56 (period=thousands, comma=decimal)
      // vs standard: 1,234.56 (comma=thousands, period=decimal)
      const hasEurFmt = /^-?[\d.]+,[\d]{2}$/.test(s.trim()); // ends in ,XX
      if (hasEurFmt) {
        s = s.replace(/\./g, "").replace(",", ".");
      } else {
        s = s.replace(/,/g, ""); // remove thousands commas
      }
      return parseFloat(s) || 0;
    }
    let debit  = c.debit  >= 0 ? parseAmount(cols[c.debit]  || "") : 0;
    let credit = c.credit >= 0 ? parseAmount(cols[c.credit] || "") : 0;

    if (c.amount >= 0 && debit === 0 && credit === 0) {
      const v = parseAmount(cols[c.amount] || "");
      if (v > 0) credit = v; else if (v < 0) debit = Math.abs(v);
    }
    // Balance column sanity check — if amount looks like a running balance, skip
    if (c.balance >= 0 && debit === 0 && credit === 0) {
      // Still no amount found — row is likely a summary/balance row
      continue;
    }

    // ── Revolut-specific processing ───────────────────────────────
    if (isRevolut) {
      // Skip non-completed transactions (REVERTED, DECLINED, PENDING)
      const state = c.state >= 0 ? (cols[c.state] || "").trim().toUpperCase() : "COMPLETED";
      if (state !== "COMPLETED") continue;

      // Skip internal pocket transfers — these are NOT real income/expense
      // They appear in BOTH Savings and Current product rows
      // e.g. "To pocket EUR Common Cash from EUR" (Current→Savings)
      // e.g. "Pocket Withdrawal" (Savings→Current)
      const product = c.product >= 0 ? (cols[c.product] || "").trim() : "";
      const rawDesc = desc.toLowerCase();
      const isPocketTransfer =
        rawDesc.includes("to pocket") ||
        rawDesc.includes("pocket withdrawal") ||
        rawDesc.includes("from pocket") ||
        rawDesc.includes("common cash from eur") ||
        rawDesc.includes("common cash from gbp") ||
        rawDesc.includes("common cash from usd") ||
        rawDesc.includes("dump from eur") ||     // "To pocket EUR Dump from EUR"
        rawDesc.includes("dump from gbp") ||
        rawDesc.includes("dump from usd") ||
        (product === "Savings" && (rawDesc.includes("pocket") || rawDesc.includes("dump")));
      if (isPocketTransfer) continue;

      // Use Amount sign — the ONLY reliable method for Revolut
      // Revolut Amount column: negative = money leaving, positive = money arriving
      const rawAmt  = parseAmount(cols[c.amount] || "");
      const feeAmt  = c.fee >= 0 ? Math.abs(parseAmount(cols[c.fee] || "")) : 0;
      // Allow zero-amount rows (e.g. Irish Stamp Duty) — they appear in history
      // Only skip if truly no amount column found
      if (rawAmt === 0 && c.amount < 0) continue;

      let type, amount;
      if (rawAmt > 0) {
        type = "INCOME";
        // Fee on positive (e.g. Wise transfer: received minus fee)
        amount = rawAmt - feeAmt;
        if (amount <= 0) amount = rawAmt; // safety: don't go negative
      } else {
        type = "EXPENSE";
        // Fee column is separate from Amount — only add if truly extra
        // Most Revolut fees are already baked into Amount column
        amount = Math.abs(rawAmt);
        // Only add fee when it's clearly a separate charge (e.g. ATM)
        if (feeAmt > 0 && feeAmt !== Math.abs(rawAmt)) amount += feeAmt;
      }

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) continue;
      const result = categorise(desc, type);
      // Capture the running balance from this row for final balance calculation
      const rowBalance = c.balance >= 0 ? parseFloat(cols[c.balance] || "0") : null;

      txns.push({
        date,
        description:  desc.slice(0, 200),
        cleanName:    result.cleanName,
        amount:       parseFloat(amount.toFixed(2)),
        type,
        category:     result.category,
        confidence:   result.confidence,
        balance:      rowBalance, // running balance at this point
      });
      continue; // skip general bank logic below
    }

    // ── Standard bank processing (AIB, HDFC, SBI etc.) ───────────
    const th = c.type >= 0 ? (cols[c.type] || "").trim().toUpperCase() : "";
    let type, amount;

    // DR/CR style type column (standard banks)
    if (th === "CR" || th === "C" || credit > 0) {
      type = "INCOME";  amount = credit || debit;
    } else if (th === "DR" || th === "D" || debit > 0) {
      type = "EXPENSE"; amount = debit || credit;
    } else {
      const iw = [
        // Salary & employment
        "salary","payroll","wages","pay credit","sal cr","sal credit","neft salary",
        "imps salary","employer payment","direct credit",
        // Investment income
        "dividend","interest credit","sip credit","fd interest","ppf credit","epf credit",
        "nsc interest","maturity credit","rd maturity","investment return",
        // Freelance platforms
        "upwork","fiverr","toptal","payoneer","stripe payment","wise received",
        // Bonuses & rewards
        "bonus","cashback","refund","reward","tax refund","insurance claim",
        // Crypto/investment
        "etf distribution","vanguard","trading profit","coinbase credit","binance credit",
        // Transfer income keywords
        "bank giro credit","bgc credit","chaps credit","bacs credit",
        "faster payment received","sepa credit","sepa credit transfer",
        "neft cr","imps cr","neft credit","imps credit",
        "incoming transfer","credit transfer","inward transfer","received from",
        "standing order credit","cr transfer","lodgment","lodgement",
        "deposit received","money received","topup","top-up received",
        "payment received","transfer in","funds received","giro credit",
      ];
      type   = iw.some((w) => desc.toLowerCase().includes(w)) ? "INCOME" : "EXPENSE";
      amount = debit || credit;
    }

    if (amount < 0) continue; // only skip truly negative (shouldn't happen after abs())

    const date = parseDate(dateStr);
    if (isNaN(date.getTime())) continue;

    const result = categorise(desc, type);
    const rowBal = c.balance >= 0 ? parseFloat((cols[c.balance] || "").replace(/[,€$£₹]/g,"")) || null : null;
    txns.push({
      date,
      description:  desc.slice(0, 200),
      cleanName:    result.cleanName,
      amount:       parseFloat(amount.toFixed(2)),
      type,
      category:     result.category,
      confidence:   result.confidence,
      balance:      rowBal,
    });
  }

  // Calculate closing balance for Revolut:
  // Track last balance seen per product (Current + Savings) and sum them
  // This gives the true total Revolut balance at end of statement
  let finalBalance = null;
  if (isRevolut) {
    const lastBalByProduct = {};
    // Scan ALL completed rows (including pocket) to track per-product balance
    for (let i = hi + 1; i < lines.length; i++) {
      const cols2 = parseRow(lines[i], delimiter);
      if (!cols2 || cols2.length < 5) continue;
      const product2 = c.product >= 0 ? (cols2[c.product] || "").trim() : "";
      const bal2     = c.balance >= 0 ? parseFloat((cols2[c.balance] || "0").replace(/[,€$£₹]/g,"")) : null;
      const state2   = c.state >= 0 ? (cols2[c.state] || "").trim().toUpperCase() : "COMPLETED";
      if (state2 === "COMPLETED" && product2 && bal2 !== null && !isNaN(bal2)) {
        lastBalByProduct[product2] = bal2;
      }
    }
    // Sum all product balances = true total Revolut balance
    const productBalances = Object.values(lastBalByProduct);
    if (productBalances.length > 0) {
      finalBalance = productBalances.reduce((s, b) => s + b, 0);
    }
  } else if (c.balance >= 0 && txns.length > 0) {
    // For other banks: use last running balance
    const lastWithBal = txns.filter(t => t.balance !== null && t.balance !== undefined);
    if (lastWithBal.length > 0) {
      finalBalance = lastWithBal[lastWithBal.length - 1].balance;
    }
  }

  return { transactions: txns, finalBalance };
}

export async function parseStatement(csvText) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (typeof csvText !== "string" || csvText.length < 10)
      throw new Error("Empty or invalid file received.");

    const result = parseCSV(csvText);
    const transactions = result.transactions || result; // backward compat
    const finalBalance = result.finalBalance ?? null;

    if (!transactions || transactions.length === 0)
      throw new Error("No transactions found. Make sure your CSV has Date, Description, and Debit/Credit columns.");

    // Return both transactions and the closing balance from the CSV
    // finalBalance is the exact balance at end of statement period (Revolut uses Balance column)
    return { transactions, finalBalance };
  } catch (err) {
    console.error("parseStatement error:", err.message);
    throw new Error(err.message);
  }
}

export async function bulkImportTransactions(transactions, accountId, options = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({ where: { id: accountId, userId: user.id } });
    if (!account) throw new Error("Account not found");

    // Balance delta = net of transactions being imported
    const balanceDelta = transactions.reduce(
      (sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0
    );

    // Duplicate detection — check date+amount+description against existing
    const earliest = transactions.reduce((min, t) =>
      new Date(t.date) < min ? new Date(t.date) : min, new Date(transactions[0]?.date || 0)
    );
    const existing = await db.transaction.findMany({
      where: { accountId, userId: user.id, date: { gte: earliest } },
      select: { date: true, amount: true, description: true },
    });
    const existingKeys = new Set(
      existing.map(e => {
        const normDesc = (e.description||"").toLowerCase().replace(/\s+/g," ").trim().slice(0,100);
        return `${e.date.toISOString().split("T")[0]}_${Number(e.amount).toFixed(2)}_${normDesc}`;
      })
    );

    const toInsert  = [];
    const skipped   = [];
    for (const t of transactions) {
      // Normalise description for better duplicate detection (handles whitespace diffs)
      const normDesc = t.description.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 100);
      const key = `${new Date(t.date).toISOString().split("T")[0]}_${t.amount.toFixed(2)}_${normDesc}`;
      if (existingKeys.has(key)) { skipped.push(t); continue; }
      toInsert.push(t);
    }

    if (toInsert.length === 0) {
      return { success: true, count: 0, skipped: skipped.length, alreadyImported: true };
    }

    const insertDelta = toInsert.reduce(
      (sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0
    );

    // Category breakdown for summary report
    const categoryBreakdown = toInsert.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    const lowConfidence = toInsert.filter(t => t.confidence === "low").length;

    await db.transaction.createMany({
      data: toInsert.map((t) => ({
        type:        t.type,
        amount:      t.amount,
        description: t.description,
        date:        new Date(t.date),
        category:    t.category,
        accountId,
        userId:      user.id,
        status:      "COMPLETED",
      })),
    });

    // Update account balance
    // If a closing balance is provided (from CSV Balance column), use it as the source of truth
    // Otherwise, increment by the net of imported transactions
    if (options.closingBalance !== undefined && options.closingBalance !== null) {
      await db.account.update({
        where: { id: accountId },
        data:  { balance: options.closingBalance },
      });
    } else {
      await db.account.update({
        where: { id: accountId },
        data:  { balance: { increment: insertDelta } },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath("/");

    const importedIncome  = parseFloat(toInsert.filter(t=>t.type==="INCOME").reduce((s,t)=>s+t.amount,0).toFixed(2));
    const importedExpense = parseFloat(toInsert.filter(t=>t.type==="EXPENSE").reduce((s,t)=>s+t.amount,0).toFixed(2));

    // Server-side integrity log
    console.log(`[FinLytics] Inserted: ${toInsert.length} | Duplicates skipped: ${skipped.length}`);
    console.log(`[FinLytics] Income: €${importedIncome.toFixed(2)} | Expense: €${importedExpense.toFixed(2)} | Net: €${(importedIncome-importedExpense).toFixed(2)}`);

    return {
      success:         true,
      count:           toInsert.length,
      total:           transactions.length,
      skipped:         skipped.length,
      alreadyImported: toInsert.length === 0,
      lowConfidence,
      categoryBreakdown,
      income:          importedIncome,
      expense:         importedExpense,
      net:             parseFloat((importedIncome - importedExpense).toFixed(2)),
      validation: {
        parsed:       transactions.length,
        inserted:     toInsert.length,
        duplicates:   skipped.length,
        incomeRows:   toInsert.filter(t=>t.type==="INCOME").length,
        expenseRows:  toInsert.filter(t=>t.type==="EXPENSE").length,
        lowConfidence,
      },
    };
  } catch (err) {
    console.error("bulkImport error:", err.message);
    throw new Error("Import failed: " + err.message);
  }
}