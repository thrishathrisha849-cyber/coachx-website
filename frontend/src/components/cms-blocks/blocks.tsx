import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ContactForm } from '@/components/forms/ContactForm';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { sanitizeRichText } from '@/utils/sanitizeHtml';
import { isExternalUrl, SAFE_EXTERNAL_REL } from '@/utils/url';

/**
 * One render function per FR-085 block type, keyed by `PageBlockType`.
 * Kept in a single file (rather than 20 tiny files) since each is a
 * small, focused function with no internal state beyond what its own
 * `data` prop supplies — matches the "simplify, don't over-fragment"
 * principle without sacrificing the one-schema-per-type discipline the
 * backend's `block-schemas.ts` already establishes.
 *
 * PROGRAMS/COURSES/EVENTS/MENTORS/CUSTOM_HTML render an explicit
 * "coming soon" placeholder — see docs/public-site/DECISION_GATES.md.
 */

type CtaData = { label: string; url: string };

function Cta({ cta, variant = 'primary' }: { cta: CtaData; variant?: 'primary' | 'secondary' }) {
  const isExternal = isExternalUrl(cta.url);
  const className =
    variant === 'primary'
      ? 'inline-flex items-center justify-center rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700'
      : 'inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800';

  if (isExternal) {
    return (
      <a href={cta.url} target="_blank" rel={SAFE_EXTERNAL_REL} className={className}>
        {cta.label}
      </a>
    );
  }
  return <Link to={cta.url} className={className}>{cta.label}</Link>;
}

export function HeroBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { eyebrow?: string; headline: string; description?: string; primaryCta?: CtaData; secondaryCta?: CtaData; mediaUrl?: string };
  return (
    <section className="flex flex-col items-center gap-6 py-16 text-center">
      {d.eyebrow && <span className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{d.eyebrow}</span>}
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">{d.headline}</h1>
      {d.description && <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">{d.description}</p>}
      <div className="flex flex-wrap justify-center gap-3">
        {d.primaryCta && <Cta cta={d.primaryCta} />}
        {d.secondaryCta && <Cta cta={d.secondaryCta} variant="secondary" />}
      </div>
      {d.mediaUrl && <img src={d.mediaUrl} alt="" className="mt-6 max-w-3xl rounded-xl shadow-lg" loading="lazy" />}
    </section>
  );
}

export function TextBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; body: string };
  // Phase 5 Part 2 security review: sanitized via DOMPurify with a
  // narrow tag/attribute allowlist (see utils/sanitizeHtml.ts) — closes
  // the gap Part 1 recorded in docs/public-site/DECISION_GATES.md #7.
  const safeBody = useMemo(() => sanitizeRichText(d.body), [d.body]);

  return (
    <section className="prose prose-slate mx-auto max-w-3xl py-8 dark:prose-invert">
      {d.heading && <h2>{d.heading}</h2>}
      <div dangerouslySetInnerHTML={{ __html: safeBody }} />
    </section>
  );
}

export function ImageBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { url: string; alt: string; caption?: string };
  return (
    <figure className="py-8 text-center">
      <img src={d.url} alt={d.alt} loading="lazy" className="mx-auto max-w-full rounded-lg" />
      {d.caption && <figcaption className="mt-2 text-sm text-slate-500 dark:text-slate-400">{d.caption}</figcaption>}
    </figure>
  );
}

/** Phase 5 Part 2 addition — a responsive grid of images, each independently alt-texted. */
export function GalleryBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; images: Array<{ url: string; alt: string; caption?: string }> };
  return (
    <section className="py-10">
      {d.heading && <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {d.images.map((img, i) => (
          <figure key={i}>
            <img src={img.url} alt={img.alt} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
            {img.caption && <figcaption className="mt-1 text-xs text-slate-500 dark:text-slate-400">{img.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

export function VideoBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { url: string; posterUrl?: string; captionsUrl?: string; title?: string };
  return (
    <section className="py-8">
      <video controls poster={d.posterUrl} className="mx-auto w-full max-w-3xl rounded-lg" aria-label={d.title}>
        <source src={d.url} />
        {d.captionsUrl && <track kind="captions" src={d.captionsUrl} default />}
      </video>
    </section>
  );
}

export function CtaBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { headline: string; description?: string; primaryCta: CtaData; trustNote?: string };
  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl bg-brand-50 px-6 py-14 text-center dark:bg-slate-900">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{d.headline}</h2>
      {d.description && <p className="max-w-xl text-slate-600 dark:text-slate-300">{d.description}</p>}
      <Cta cta={d.primaryCta} />
      {d.trustNote && <p className="text-xs text-slate-500 dark:text-slate-400">{d.trustNote}</p>}
    </section>
  );
}

export function FeaturesBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; items: Array<{ icon?: string; title: string; description?: string }> };
  return (
    <section className="py-10">
      {d.heading && <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {d.items.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
            {item.icon && <span className="text-2xl" aria-hidden="true">{item.icon}</span>}
            <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">{item.title}</h3>
            {item.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function StatsBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; items: Array<{ label: string; value: string; sourceNote: string }> };
  return (
    <section className="py-10">
      {d.heading && <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {d.items.map((item, i) => (
          // FR-014/FR-111: every metric carries its documented source as a title tooltip.
          <div key={i} title={item.sourceNote} className="text-center">
            <dd className="text-3xl font-bold text-brand-600 dark:text-brand-400">{item.value}</dd>
            <dt className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function TestimonialsBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; items: Array<{ name: string; role?: string; photoUrl?: string; format: string; quote?: string; mediaUrl?: string }> };
  return (
    <section className="py-10">
      {d.heading && <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {d.items.map((t, i) => (
          <blockquote key={i} className="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
            {t.format === 'text' && t.quote && <p className="text-slate-700 dark:text-slate-200">“{t.quote}”</p>}
            {t.format === 'video' && t.mediaUrl && <video controls src={t.mediaUrl} className="w-full rounded" />}
            {t.format === 'audio' && t.mediaUrl && <audio controls src={t.mediaUrl} className="w-full" />}
            {t.format === 'screenshot' && t.mediaUrl && <img src={t.mediaUrl} alt={`${t.name}'s testimonial`} className="w-full rounded" loading="lazy" />}
            <footer className="mt-3 flex items-center gap-2">
              {t.photoUrl && <img src={t.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />}
              <span className="text-sm font-medium text-slate-900 dark:text-white">{t.name}</span>
              {t.role && <span className="text-xs text-slate-500 dark:text-slate-400">{t.role}</span>}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

export function PricingBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; plans: Array<{ name: string; bestFor?: string; monthlyPrice: number; annualPrice: number; features: string[]; popular?: boolean; cta: CtaData }> };
  return (
    <section className="py-10">
      {d.heading && <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {d.plans.map((plan, i) => (
          <div key={i} className={`relative rounded-xl border p-6 ${plan.popular ? 'border-brand-600 shadow-lg' : 'border-slate-200 dark:border-slate-800'}`}>
            {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Most Popular</span>}
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
            {plan.bestFor && <p className="text-sm text-slate-500 dark:text-slate-400">{plan.bestFor}</p>}
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">₹{plan.monthlyPrice}<span className="text-sm font-normal text-slate-500">/mo</span></p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
              {plan.features.map((f, fi) => <li key={fi}>✓ {f}</li>)}
            </ul>
            <div className="mt-6"><Cta cta={plan.cta} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TimelineBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; items: Array<{ date: string; title: string; description?: string; imageUrl?: string }> };
  return (
    <section className="py-10">
      {d.heading && <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      <ol className="flex flex-col gap-6 border-l border-slate-200 pl-6 dark:border-slate-800">
        {d.items.map((item, i) => (
          <li key={i}>
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">{item.date}</span>
            <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
            {item.description && <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TeamBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; members: Array<{ name: string; role?: string; photoUrl?: string; bio?: string }> };
  return (
    <section className="py-10">
      {d.heading && <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {d.members.map((m, i) => (
          <div key={i} className="text-center">
            {m.photoUrl && <img src={m.photoUrl} alt={m.name} className="mx-auto h-24 w-24 rounded-full object-cover" loading="lazy" />}
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{m.name}</h3>
            {m.role && <p className="text-sm text-slate-500 dark:text-slate-400">{m.role}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function LogoStripBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; logos: Array<{ name: string; url: string }> };
  return (
    <section className="py-10">
      {d.heading && <p className="mb-4 text-center text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{d.heading}</p>}
      <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
        {d.logos.map((logo, i) => <img key={i} src={logo.url} alt={logo.name} className="h-8 object-contain grayscale" loading="lazy" />)}
      </div>
    </section>
  );
}

/** Phase 5 Part 2 addition — a list of downloadable files (`download` attribute prompts a save rather than in-browser navigation). */
export function DownloadBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; description?: string; files: Array<{ label: string; fileUrl: string; fileType?: string; fileSizeLabel?: string }> };
  return (
    <section className="py-10">
      {d.heading && <h2 className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      {d.description && <p className="mb-6 text-center text-slate-600 dark:text-slate-300">{d.description}</p>}
      <ul className="mx-auto flex max-w-xl flex-col gap-3">
        {d.files.map((file, i) => (
          <li key={i}>
            <a
              href={file.fileUrl}
              download
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm hover:border-brand-400 dark:border-slate-800"
            >
              <span className="font-medium text-slate-900 dark:text-white">{file.label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {[file.fileType, file.fileSizeLabel].filter(Boolean).join(' · ') || 'Download'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FormBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { formType: 'contact' | 'newsletter'; heading?: string };
  return (
    <section className="mx-auto max-w-xl py-10">
      {d.heading && <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      {d.formType === 'contact' ? <ContactForm /> : <NewsletterForm />}
    </section>
  );
}

export function SpacerBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { height?: 'sm' | 'md' | 'lg' | 'xl' };
  const heights = { sm: 'h-4', md: 'h-8', lg: 'h-16', xl: 'h-24' };
  return <div className={heights[d.height ?? 'md']} />;
}

export function DividerBlock() {
  return <hr className="my-8 border-slate-200 dark:border-slate-800" />;
}

/** Placeholder for block types whose data source (004/005/007/010) doesn't exist yet. */
export function ComingSoonBlock({ label }: { label: string }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {label} content is coming soon.
    </section>
  );
}
