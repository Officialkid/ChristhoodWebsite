import {
  Activity, BookOpen, Building2, CalendarDays, CalendarHeart, Church, ClipboardList, Clapperboard, Compass, DoorOpen, Flower2, Gem, Globe2,
  HandCoins, HandHeart, HeartHandshake, History, Home, ImagePlus, Images, Info, KeyRound, LayoutDashboard, Mail, Megaphone, MessageCircleQuestion,
  Music2, Palette, PlayCircle, QrCode, Quote, Rocket, ScrollText, Settings, ShieldCheck, Sprout, Target, UserPlus, UsersRound, Waypoints, Newspaper,
  HelpingHand, MapPin, Heart, Sparkles, type LucideIcon,
} from "lucide-react";

/** Icon names the menus and the admin area use. Names are plain strings so server code can pass them to client components. */
const map: Record<string, LucideIcon> = {
  activity: Activity, about: Info, book: BookOpen, building: Building2, calendar: CalendarDays, "calendar-heart": CalendarHeart, church: Church,
  clipboard: ClipboardList, clapperboard: Clapperboard, compass: Compass, door: DoorOpen, flower: Flower2, gem: Gem, globe: Globe2, give: HandCoins,
  prayer: HandHeart, counselling: HeartHandshake, history: History, home: Home, "image-plus": ImagePlus, images: Images, key: KeyRound, dashboard: LayoutDashboard,
  mail: Mail, megaphone: Megaphone, question: MessageCircleQuestion, music: Music2, palette: Palette, play: PlayCircle, qr: QrCode, quote: Quote, rocket: Rocket,
  script: ScrollText, settings: Settings, shield: ShieldCheck, sprout: Sprout, target: Target, guest: UserPlus, users: UsersRound, path: Waypoints, news: Newspaper,
  helping: HelpingHand, map: MapPin, heart: Heart, sparkles: Sparkles,
};

export function Icon({ name, className = "size-4", ...rest }: { name?: string; className?: string } & React.SVGAttributes<SVGElement>) {
  const Cmp = (name && map[name]) || Sparkles;
  return <Cmp aria-hidden className={className} {...rest} />;
}

/** The picture-in-words for each ministry and programme page. */
export const pageIcon: Record<string, string> = {
  "international-faith-chapel": "church",
  worship: "music",
  missions: "globe",
  counselling: "counselling",
  media: "clapperboard",
  mens: "users",
  ladies: "flower",
  administration: "clipboard",
  protocol: "door",
  creative: "palette",
  jewels: "gem",
  "teen-life": "rocket",
  branch: "sprout",
  impact: "target",
  iact: "book",
  apologetics: "question",
};
