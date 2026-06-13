type SectionCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function SectionCard({
  eyebrow,
  title,
  description,
  children
}: SectionCardProps) {
  return (
    <section className="glass-panel rounded-xl p-6 shadow-panel sm:p-8">
      <div className="mb-6 space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-container">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-headline text-3xl font-semibold tracking-tight text-on-surface">
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
