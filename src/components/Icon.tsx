import type { ComponentType, SVGProps } from "react";
import { ArrowRight } from "pixelarticons/react/ArrowRight.js";
import { BellOff } from "pixelarticons/react/BellOff.js";
import { BookOpen } from "pixelarticons/react/BookOpen.js";
import { Check } from "pixelarticons/react/Check.js";
import { Close } from "pixelarticons/react/Close.js";
import { Gamepad } from "pixelarticons/react/Gamepad.js";
import { Heart } from "pixelarticons/react/Heart.js";
import { Home } from "pixelarticons/react/Home.js";
import { Menu } from "pixelarticons/react/Menu.js";
import { Minus } from "pixelarticons/react/Minus.js";
import { Play } from "pixelarticons/react/Play.js";
import { Plus } from "pixelarticons/react/Plus.js";
import { Reload } from "pixelarticons/react/Reload.js";
import { Save } from "pixelarticons/react/Save.js";
import { Search } from "pixelarticons/react/Search.js";
import { Settings2 } from "pixelarticons/react/Settings2.js";
import { Shield } from "pixelarticons/react/Shield.js";
import { Skull } from "pixelarticons/react/Skull.js";
import { Sparkle } from "pixelarticons/react/Sparkle.js";
import { Sword } from "pixelarticons/react/Sword.js";
import { Target } from "pixelarticons/react/Target.js";
import { Trash } from "pixelarticons/react/Trash.js";
import { User } from "pixelarticons/react/User.js";
import { Volume2 } from "pixelarticons/react/Volume2.js";
import { Zap } from "pixelarticons/react/Zap.js";

export type IconName =
  | "arrow-right"
  | "bell-off"
  | "book"
  | "check"
  | "close"
  | "dm"
  | "heart"
  | "home"
  | "menu"
  | "minus"
  | "play"
  | "plus"
  | "reload"
  | "save"
  | "search"
  | "settings"
  | "shield"
  | "skull"
  | "sparkle"
  | "sword"
  | "target"
  | "trash"
  | "user"
  | "volume"
  | "zap";

const iconMap: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  "arrow-right": ArrowRight,
  "bell-off": BellOff,
  book: BookOpen,
  check: Check,
  close: Close,
  dm: Skull,
  heart: Heart,
  home: Home,
  menu: Menu,
  minus: Minus,
  play: Play,
  plus: Plus,
  reload: Reload,
  save: Save,
  search: Search,
  settings: Settings2,
  shield: Shield,
  skull: Skull,
  sparkle: Sparkle,
  sword: Sword,
  target: Target,
  trash: Trash,
  user: User,
  volume: Volume2,
  zap: Zap,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, className = "", ...props }: IconProps) {
  const Component = iconMap[name];
  return <Component aria-hidden="true" className={`icon ${className}`} focusable="false" {...props} />;
}
