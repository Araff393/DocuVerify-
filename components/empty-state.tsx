type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low/50 p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
          folder_off
        </span>
      </div>
      <p className="font-headline text-2xl font-semibold text-on-surface">{title}</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}
