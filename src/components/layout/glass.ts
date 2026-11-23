/**
 * Glassmorphism pilulky hlavičky: priesvitné, rozmazané pozadie pod nimi.
 *
 * Tón sa prepína podľa sekcie pod hlavičkou (`data-tone` na <header>, pozri ToneHeader):
 *  - predvolený (dark): tmavé/farebné pozadie → svetlé sklo, biely text
 *  - light: svetlé pozadie → svetlejšie sklo, tmavý text
 *
 * POZOR: triedy musia byť napísané doslovne (nie skladané cez template), inak ich
 * Tailwind pri skenovaní nenájde.
 */
export const glass = [
  "backdrop-blur-xl backdrop-saturate-150 ring-1 shadow-sm transition-colors duration-300",
  "bg-background/15 text-background ring-background/25",
  "group-data-[tone=light]/header:bg-background/55 group-data-[tone=light]/header:text-foreground group-data-[tone=light]/header:ring-foreground/10",
].join(" ");

/** Hover pre pilulky, ktoré sú samy odkazom/tlačidlom (logo, hamburger). */
export const glassHover =
  "hover:bg-background/25 group-data-[tone=light]/header:hover:bg-background/80";

/** Hover pre položky vo vnútri pilulky (navigácia, menu). */
export const glassItem =
  "hover:bg-background/20 group-data-[tone=light]/header:hover:bg-foreground/10";

/** CTA: pri hover sa vyplní plnou farbou. */
export const glassCta =
  "hover:bg-background hover:text-foreground group-data-[tone=light]/header:hover:bg-foreground group-data-[tone=light]/header:hover:text-background";
