import type { CmsBlock } from '@/types/cms.types';
import {
  HeroBlock,
  TextBlock,
  ImageBlock,
  GalleryBlock,
  VideoBlock,
  CtaBlock,
  FeaturesBlock,
  StatsBlock,
  TestimonialsBlock,
  PricingBlock,
  TimelineBlock,
  TeamBlock,
  LogoStripBlock,
  FormBlock,
  DownloadBlock,
  SpacerBlock,
  DividerBlock,
  ComingSoonBlock,
} from './blocks';
import { FaqBlock } from './FaqBlock';

/**
 * Renders one PageBlock by type — the single place every FR-085 block
 * type maps to a component. PROGRAMS/COURSES/EVENTS/MENTORS/CUSTOM_HTML
 * render an explicit placeholder (data owned by unbuilt features / a
 * pending sanitization decision — see docs/public-site/DECISION_GATES.md).
 */
export function BlockRenderer({ block }: { block: CmsBlock }) {
  switch (block.type) {
    case 'HERO':
      return <HeroBlock data={block.data} />;
    case 'TEXT':
      return <TextBlock data={block.data} />;
    case 'IMAGE':
      return <ImageBlock data={block.data} />;
    case 'GALLERY':
      return <GalleryBlock data={block.data} />;
    case 'VIDEO':
      return <VideoBlock data={block.data} />;
    case 'CTA':
      return <CtaBlock data={block.data} />;
    case 'FEATURES':
      return <FeaturesBlock data={block.data} />;
    case 'STATS':
      return <StatsBlock data={block.data} />;
    case 'TESTIMONIALS':
      return <TestimonialsBlock data={block.data} />;
    case 'PRICING':
      return <PricingBlock data={block.data} />;
    case 'FAQ':
      return <FaqBlock data={block.data} />;
    case 'TIMELINE':
      return <TimelineBlock data={block.data} />;
    case 'TEAM':
      return <TeamBlock data={block.data} />;
    case 'LOGO_STRIP':
      return <LogoStripBlock data={block.data} />;
    case 'FORM':
      return <FormBlock data={block.data} />;
    case 'DOWNLOAD':
      return <DownloadBlock data={block.data} />;
    case 'SPACER':
      return <SpacerBlock data={block.data} />;
    case 'DIVIDER':
      return <DividerBlock />;
    case 'PROGRAMS':
      return <ComingSoonBlock label="Programs" />;
    case 'COURSES':
      return <ComingSoonBlock label="Courses" />;
    case 'EVENTS':
      return <ComingSoonBlock label="Events" />;
    case 'MENTORS':
      return <ComingSoonBlock label="Mentors" />;
    case 'CUSTOM_HTML':
      return <ComingSoonBlock label="Custom" />;
    default:
      return null;
  }
}
