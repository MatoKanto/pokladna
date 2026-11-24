/** Text rozdelený na slová, ktoré sa postupne vynoria (animácia v effects.css). */
export function RevealWords({
  text,
  start = 0,
  className,
}: {
  text: string;
  /** Poradie prvého slova (kvôli zreťazeniu viacerých častí nadpisu). */
  start?: number;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          {i > 0 && " "}
          <span
            className={`word-reveal ${className ?? ""}`}
            style={{ "--i": start + i } as React.CSSProperties}
          >
            {word}
          </span>
        </span>
      ))}
    </>
  );
}
