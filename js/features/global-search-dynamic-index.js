/**
 * Runtime search index — facts, books, social pillars, mindset items.
 * Loaded after data sources (app-bulk, legacy-helpers, social-modals, mindset-lab).
 */
(function () {
  'use strict';

  const isRealtor = /Agent Sales Coach/i.test(document.title || '');

  window.buildGlobalSearchDynamicIndex = function buildGlobalSearchDynamicIndex() {
    const entries = [];

    if (!isRealtor && Array.isArray(window.LO_FACT_VAULT_ITEMS)) {
      window.LO_FACT_VAULT_ITEMS.forEach((item) => {
        if (!item?.id) return;
        entries.push({
          type: 'fact',
          id: `fact-${item.id}`,
          title: item.title,
          subtitle: `${item.libraryCategory || 'Ruoff Fact'} · company differentiator`,
          sectionId: 'referrals',
          handler: { kind: 'vault', vaultId: item.id },
          icon: 'fas fa-building',
          keywords: [item.teaser, item.libraryCategory, ...(item.tags || [])],
          group: 'Ruoff Facts',
          _baseScore: 12,
        });
      });
    }

    if (typeof window.getBookSearchEntries === 'function') {
      window.getBookSearchEntries().forEach((book) => {
        entries.push({
          type: 'book',
          id: `book-${book.id}`,
          title: book.title,
          subtitle: `${book.author} · ${book.category}`,
          sectionId: 'books',
          handler: { kind: 'book', bookId: book.id },
          icon: 'fas fa-book',
          keywords: book.keywords || [],
          group: 'Book Vault',
          _baseScore: 11,
        });
      });
    }

    const pillars = window.SOCIAL_PILLAR_CONTENT || {};
    Object.keys(pillars).forEach((key) => {
      const data = pillars[key];
      if (!data?.title) return;
      entries.push({
        type: 'social',
        id: `social-pillar-${key.toLowerCase()}`,
        title: data.title,
        subtitle: `${data.badge || 'Social pillar'} · examples & execution tips`,
        sectionId: 'social',
        handler: { kind: 'social-pillar', pillar: key },
        icon: 'fas fa-share-alt',
        keywords: [
          key,
          data.badge,
          ...(data.examples || []).map((ex) => ex.title),
          ...(data.proTips || []),
        ].filter(Boolean),
        group: 'Social Pillars',
        _baseScore: 11,
      });
    });

    if (typeof window.getMindsetSearchEntries === 'function') {
      window.getMindsetSearchEntries().forEach((item) => {
        entries.push({
          type: 'mindset',
          id: `mindset-${item.id}`,
          title: item.content.slice(0, 72) + (item.content.length > 72 ? '…' : ''),
          subtitle: `${item.category} · ${item.source}`,
          sectionId: 'mindset-motivation',
          handler: { kind: 'mindset', itemId: item.id },
          icon: 'fas fa-brain',
          keywords: [item.category, item.source, item.action].filter(Boolean),
          group: 'Mindset Lab',
          _baseScore: 6,
        });
      });
    }

    return entries;
  };
})();