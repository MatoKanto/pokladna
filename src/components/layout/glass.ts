/**
 * Glassmorphism hlavičky: svetlé matné sklo, ktoré rozmaže obsah pod sebou.
 * Svetlé sklo drží kontrast pre červené logo aj tmavý text nad červeným hero
 * aj nad svetlými sekciami, takže netreba prepínať tón podľa sekcie.
 */
export const glass =
  "bg-background/60 text-foreground ring-1 ring-foreground/10 shadow-lg shadow-foreground/5 backdrop-blur-xl backdrop-saturate-150";

/**
 * Plávajúce panely (dropdowny). Sú vnorené v skle hlavičky, a vnorený
 * backdrop-filter nerozmaže stránku pod hlavičkou, preto sú takmer nepriehľadné.
 */
export const glassPanel =
  "bg-background/95 text-foreground ring-1 ring-foreground/10 shadow-xl shadow-foreground/10 backdrop-blur-xl backdrop-saturate-150";

/** Hover pre položky na skle; `current` funguje na svetlom skle aj na červenom paneli. */
export const glassItem = "hover:bg-current/10 focus-visible:bg-current/10";
