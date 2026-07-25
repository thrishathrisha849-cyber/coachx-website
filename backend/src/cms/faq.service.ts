import { findVisibleFaqs } from './cms.repository';

export interface FaqCategoryGroup {
  category: string;
  items: Array<{ id: string; question: string; answer: string }>;
}

/** 002 FR-028: categorized FAQ, admin-controlled sort order. */
export async function getFaqsByCategory(): Promise<FaqCategoryGroup[]> {
  const faqs = await findVisibleFaqs();

  const groups = new Map<string, FaqCategoryGroup>();
  for (const faq of faqs) {
    if (!groups.has(faq.category)) groups.set(faq.category, { category: faq.category, items: [] });
    groups.get(faq.category)!.items.push({ id: faq.id, question: faq.question, answer: faq.answer });
  }

  return Array.from(groups.values());
}
